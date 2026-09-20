import os
import sys
import joblib
import pandas as pd
import numpy as np

from src.data_loader import load_master_dataset
from src.feature_engineering import add_engineered_features

def test_all_circles(period_filter="today", export_csv=True, city_filter=None):
    clf_path = os.path.join("models", "best_flood_classifier.joblib")
    reg_path = os.path.join("models", "best_rainfall_regressor.joblib")

    if not os.path.exists(clf_path):
        print("Error: Trained model artifacts not found in models/ directory. Run 'python backend/train_both_datasets.py' first.")
        return

    # Load Models
    clf_bundle = joblib.load(clf_path)
    reg_bundle = joblib.load(reg_path) if os.path.exists(reg_path) else None

    clf_model = clf_bundle['model']
    clf_scaler = clf_bundle['scaler']
    clf_imputer = clf_bundle['imputer']
    clf_features = clf_bundle['feature_names']
    optimal_thresh = clf_bundle.get('optimal_threshold', 0.70)

    reg_model = reg_bundle['model'] if reg_bundle else None
    reg_scaler = reg_bundle.get('scaler') if reg_bundle else None
    reg_imputer = reg_bundle.get('imputer') if reg_bundle else None
    reg_features = reg_bundle.get('feature_names') if reg_bundle else []

    df_raw = load_master_dataset()
    df = add_engineered_features(df_raw)

    is_today = period_filter in ["today", "2026_09", "2026-09-09"]
    if is_today:
        print(f"\n==========================================================")
        print(f" RUNNING FLOOD & RAINFALL PREDICTIONS FOR TODAY (09-09-2026)")
        print(f"==========================================================")
        
        latest_period = df['timeperiod'].max()
        period_df = df[df['timeperiod'] == latest_period].copy()
        period_df['timeperiod'] = '2026_09 (Today)'
        period_df['month'] = 9
        period_df['year'] = 2026
        period_df['is_monsoon_season'] = 1
        period_df['monsoon_rainfall_intensity'] = period_df['rainfall_monthly_sum_mm'] * period_df['is_monsoon_season']
    else:
        print(f"\n==========================================================")
        print(f" PREDICTING FLOOD RISK & RAINFALL FOR ASSAM CIRCLES ({period_filter})")
        print(f"==========================================================")
        period_df = df[df['timeperiod'] == period_filter].copy()
        if len(period_df) == 0:
            print(f"Period '{period_filter}' not found in historical panel. Using latest available period ({df['timeperiod'].max()}).")
            period_filter = df['timeperiod'].max()
            period_df = df[df['timeperiod'] == period_filter].copy()

    # Apply City / District Filter if requested by user
    if city_filter and city_filter.strip() and city_filter.upper() != 'ALL':
        q = city_filter.strip().lower()
        matched = period_df[
            period_df['revenue_circle'].str.lower().str.contains(q, na=False) | 
            period_df['district'].str.lower().str.contains(q, na=False)
        ]
        if len(matched) > 0:
            print(f"\n[*] [FILTER APPLIED] Showing predictions matching city/district query: '{city_filter}' ({len(matched)} circle/s)")
            period_df = matched.copy()
        else:
            print(f"\n[!] No revenue circles matched '{city_filter}'. Showing all revenue circles.")

    print(f"\n[Dataset] Loaded {len(period_df)} Revenue Circles for evaluation.")

    # 1. Predict Flood Risk
    X_clf_imp = pd.DataFrame(clf_imputer.transform(period_df[clf_features]), columns=clf_features, index=period_df.index)
    X_clf_scaled = pd.DataFrame(clf_scaler.transform(X_clf_imp), columns=clf_features, index=period_df.index)
    flood_probs = clf_model.predict_proba(X_clf_scaled)[:, 1]

    # 2. Predict Rainfall Intensity
    X_reg_imp = pd.DataFrame(reg_imputer.transform(period_df[reg_features]), columns=reg_features, index=period_df.index)
    X_reg_scaled = pd.DataFrame(reg_scaler.transform(X_reg_imp), columns=reg_features, index=period_df.index)
    rain_preds = reg_model.predict(X_reg_scaled)

    # 3. Results DataFrame
    results_df = pd.DataFrame({
        'object_id': period_df['object_id'],
        'revenue_circle': period_df['revenue_circle'],
        'district': period_df['district'],
        'timeperiod': period_df['timeperiod'],
        'predicted_flood_prob_%': (flood_probs * 100).round(2),
        'predicted_flood_occurred': (flood_probs >= optimal_thresh).astype(int),
        'predicted_rainfall_mm': rain_preds.round(1)
    })

    if not is_today:
        results_df['actual_flood'] = period_df['flood_occurred'].values
        results_df['actual_rainfall_mm'] = period_df['rainfall_monthly_sum_mm'].round(1).values

    def assign_alert(prob):
        if prob >= (optimal_thresh * 100): return "CRITICAL"
        elif prob >= 50.0: return "HIGH"
        elif prob >= 25.0: return "MODERATE"
        else: return "LOW"

    results_df['flood_alert_level'] = results_df['predicted_flood_prob_%'].apply(assign_alert)
    results_df = results_df.sort_values(by='predicted_flood_prob_%', ascending=False).reset_index(drop=True)

    # District Summary
    district_summary = results_df.groupby('district').agg(
        total_circles=('revenue_circle', 'count'),
        critical_alert_circles=('flood_alert_level', lambda x: (x == 'CRITICAL').sum()),
        high_alert_circles=('flood_alert_level', lambda x: (x == 'HIGH').sum()),
        avg_predicted_flood_prob_pct=('predicted_flood_prob_%', 'mean'),
        avg_predicted_rainfall_mm=('predicted_rainfall_mm', 'mean')
    ).round(2).sort_values(by='avg_predicted_flood_prob_pct', ascending=False)

    if export_csv:
        os.makedirs("reports", exist_ok=True)
        circle_csv = "all_assam_circles_predictions_today.csv" if is_today else "all_assam_circles_predictions.csv"
        district_csv = "district_wise_flood_summary_today.csv" if is_today else "district_wise_flood_summary.csv"
        
        results_df.to_csv(os.path.join("reports", circle_csv), index=False)
        district_summary.to_csv(os.path.join("reports", district_csv))

    print("\n-------------------------------------------------------------------------------------------------")
    print(f" AI MODEL PREDICTION PARAMETERS FOR MATCHED CIRCLES ({len(results_df)})")
    print("-------------------------------------------------------------------------------------------------")
    print(f"{'Revenue Circle':<25} | {'District':<18} | {'Flood Prob':<10} | {'Alert Level':<10} | {'Pred Rain (mm)':<14}")
    print("-" * 88)
    
    for idx, row in results_df.iterrows():
        print(f"{row['revenue_circle']:<25} | {row['district']:<18} | {row['predicted_flood_prob_%']:>8.2f}% | {row['flood_alert_level']:<10} | {row['predicted_rainfall_mm']:>14.1f}")

    print("\n---------------------------------------------------------")
    print(f" DISTRICT-WISE SUMMARY")
    print("---------------------------------------------------------")
    print(district_summary.to_string())

if __name__ == "__main__":
    print("=" * 80)
    print(" [AI MODEL] SIH26071 FLOOD MODEL TESTER & TERMINAL INFERENCE RUNNER")
    print("=" * 80)
    
    if len(sys.argv) > 1:
        city_query = sys.argv[1].strip()
    else:
        try:
            city_query = input("[?] Enter City or Revenue Circle Name (e.g. Guwahati, Gossaigaon, Dhubri, Barpeta, or press Enter for ALL): ").strip()
        except EOFError:
            city_query = ""
    
    test_all_circles(period_filter="today", city_filter=city_query)
