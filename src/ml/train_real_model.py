import os
import sys
import json
import pickle
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, precision_recall_curve, auc, confusion_matrix, brier_score_loss
)
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
import xgboost as xgb

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, "backend", "data", "processed", "assam_flood_ml_ready_ground_truth.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
BACKEND_MODELS_DIR = os.path.join(BASE_DIR, "backend", "models")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
DOCS_DIR = os.path.join(BASE_DIR, "docs", "ml")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(BACKEND_MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

# 1. Feature Definition matching Live Backend capabilities
FEATURE_COLS = [
    'rainfall_1h', 'rainfall_3h', 'rainfall_6h', 'rainfall_12h', 'rainfall_24h',
    'forecast_rainfall_6h', 'rainfall_3d_cumulative', 'rainfall_7d_cumulative',
    'elevation', 'distance_to_river_m', 'soil_clay_pct', 'population_density',
    'runoff_potential_index', 'proximity_risk_score'
]

TARGET_COL = 'flood_occurred'

def load_and_split_data():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Ground-truth dataset missing: {DATA_PATH}")
        
    print(f"[*] Loading ground-truth dataset from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Non-Random Grouped Temporal Split (No Data Leakage)
    train_mask = df['timestamp'] < '2025-04-01'
    val_mask = (df['timestamp'] >= '2025-04-01') & (df['timestamp'] < '2025-06-01')
    test_mask = df['timestamp'] >= '2025-06-01'
    
    train_df = df[train_mask]
    val_df = df[val_mask]
    test_df = df[test_mask]
    
    print(f"[*] Data Splits:")
    print(f"  - Train Set : {len(train_df):,} rows ({train_df[TARGET_COL].sum()} floods)")
    print(f"  - Val Set   : {len(val_df):,} rows ({val_df[TARGET_COL].sum()} floods)")
    print(f"  - Test Set  : {len(test_df):,} rows ({test_df[TARGET_COL].sum()} floods)")
    
    X_train, y_train = train_df[FEATURE_COLS], train_df[TARGET_COL]
    X_val, y_val = val_df[FEATURE_COLS], val_df[TARGET_COL]
    X_test, y_test = test_df[FEATURE_COLS], test_df[TARGET_COL]
    
    return X_train, y_train, X_val, y_val, X_test, y_test, df

def train_and_evaluate():
    print("=" * 80)
    print(" ML MEMBER 2: MODEL TRAINING, CALIBRATION & EVALUATION PIPELINE ")
    print("=" * 80)
    
    X_train, y_train, X_val, y_val, X_test, y_test, full_df = load_and_split_data()
    
    # Imputation & Scaling (Fitted STRICTLY on Train set)
    imputer = SimpleImputer(strategy='median')
    scaler = StandardScaler()
    
    X_train_scaled = scaler.fit_transform(imputer.fit_transform(X_train))
    X_val_scaled = scaler.transform(imputer.transform(X_val))
    X_test_scaled = scaler.transform(imputer.transform(X_test))
    
    pos_count = y_train.sum()
    neg_count = len(y_train) - pos_count
    pos_weight = neg_count / max(pos_count, 1)
    
    print(f"[*] Calculated class positive weight: {pos_weight:.2f}")
    
    # Candidate Base Models
    rf_base = RandomForestClassifier(n_estimators=150, max_depth=10, class_weight='balanced', random_state=42, n_jobs=-1)
    xgb_base = xgb.XGBClassifier(n_estimators=150, learning_rate=0.05, max_depth=6, scale_pos_weight=pos_weight, random_state=42, eval_metric='logloss')
    gb_base = GradientBoostingClassifier(n_estimators=120, learning_rate=0.05, max_depth=5, random_state=42)
    
    # Probability Calibration via Platt Scaling (Sigmoid)
    rf_cal = CalibratedClassifierCV(rf_base, cv=3, method='sigmoid')
    xgb_cal = CalibratedClassifierCV(xgb_base, cv=3, method='sigmoid')
    gb_cal = CalibratedClassifierCV(gb_base, cv=3, method='sigmoid')
    
    candidates = {
        "Random Forest (Calibrated)": rf_cal,
        "XGBoost (Calibrated)": xgb_cal,
        "Gradient Boosting (Calibrated)": gb_cal
    }
    
    evaluation_results = []
    best_candidate_name = None
    best_model_obj = None
    best_f1 = -1.0
    best_opt_thresh = 0.5
    best_metrics = {}
    
    for name, model in candidates.items():
        print(f"\n---> Training Candidate: {name}...")
        model.fit(X_train_scaled, y_train)
        
        # Brier score before thresholding
        val_probs = model.predict_proba(X_val_scaled)[:, 1]
        
        # Threshold tuning on Validation Set
        opt_thresh = 0.5
        opt_f1 = 0.0
        for thresh in np.arange(0.20, 0.85, 0.02):
            preds = (val_probs >= thresh).astype(int)
            score = f1_score(y_val, preds, zero_division=0)
            if score > opt_f1:
                opt_f1 = score
                opt_thresh = thresh
                
        # Final Evaluation on Test Set
        test_probs = model.predict_proba(X_test_scaled)[:, 1]
        test_preds = (test_probs >= opt_thresh).astype(int)
        
        acc = accuracy_score(y_test, test_preds)
        prec = precision_score(y_test, test_preds, zero_division=0)
        rec = recall_score(y_test, test_preds, zero_division=0)
        f1 = f1_score(y_test, test_preds, zero_division=0)
        
        try:
            roc_auc = roc_auc_score(y_test, test_probs)
        except Exception:
            roc_auc = 0.5
            
        prec_arr, rec_arr, _ = precision_recall_curve(y_test, test_probs)
        pr_auc = auc(rec_arr, prec_arr)
        brier = brier_score_loss(y_test, test_probs)
        cm = confusion_matrix(y_test, test_preds)
        
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
        
        print(f"[{name}] Test Results:")
        print(f"  - Accuracy   : {acc:.4f}")
        print(f"  - Precision  : {prec:.4f}")
        print(f"  - Recall     : {rec:.4f}")
        print(f"  - F1 Score   : {f1:.4f}")
        print(f"  - ROC-AUC    : {roc_auc:.4f}")
        print(f"  - PR-AUC     : {pr_auc:.4f}")
        print(f"  - Brier Score: {brier:.4f}")
        print(f"  - Opt Thresh : {opt_thresh:.2f}")
        print(f"  - Confusion  : TP={tp}, FP={fp}, TN={tn}, FN={fn}")
        
        metrics_dict = {
            'candidate_name': name,
            'accuracy': float(acc),
            'precision': float(prec),
            'recall': float(rec),
            'f1_score': float(f1),
            'roc_auc': float(roc_auc),
            'pr_auc': float(pr_auc),
            'brier_score': float(brier),
            'optimal_threshold': float(opt_thresh),
            'tp': int(tp), 'fp': int(fp), 'tn': int(tn), 'fn': int(fn)
        }
        
        evaluation_results.append(metrics_dict)
        
        if f1 > best_f1:
            best_f1 = f1
            best_candidate_name = name
            best_model_obj = model
            best_opt_thresh = opt_thresh
            best_metrics = metrics_dict
            
    print(f"\n[WINNER] Selected Best Model: {best_candidate_name} (Test F1: {best_f1:.4f})")
    
    # Feature Importance Extraction from base estimator
    feature_importances = {}
    if hasattr(best_model_obj, "calibrated_classifiers_"):
        base_est = best_model_obj.calibrated_classifiers_[0].estimator
        if hasattr(base_est, "feature_importances_"):
            imps = base_est.feature_importances_
            feature_importances = {col: float(imp) for col, imp in zip(FEATURE_COLS, imps)}
            
    # Save Artifact Bundle
    artifact_bundle = {
        'model': best_model_obj,
        'model_name': best_candidate_name,
        'model_version': 'assam-flood-v2-ground-truth',
        'scaler': scaler,
        'imputer': imputer,
        'feature_names': FEATURE_COLS,
        'optimal_threshold': float(best_opt_thresh),
        'metrics': best_metrics,
        'feature_importances': feature_importances,
        'trained_at': datetime.now().isoformat()
    }
    
    # Save primary model artifacts
    main_joblib = os.path.join(MODELS_DIR, "best_flood_classifier.joblib")
    backend_pkl = os.path.join(BACKEND_MODELS_DIR, "model_final_dataset.pkl")
    clf_pkl = os.path.join(BACKEND_MODELS_DIR, "flood_binary_clf.pkl")
    
    joblib.dump(artifact_bundle, main_joblib)
    with open(backend_pkl, "wb") as f:
        pickle.dump(artifact_bundle, f)
    with open(clf_pkl, "wb") as f:
        pickle.dump(best_model_obj, f)
        
    print(f"\n[OK] Model artifacts saved to:\n  - {main_joblib}\n  - {backend_pkl}\n  - {clf_pkl}")
    
    # Save Model Version Metadata YAML and JSON
    metadata_yaml_path = os.path.join(MODELS_DIR, "model_version_metadata.yaml")
    metadata_json_path = os.path.join(MODELS_DIR, "model_version_metadata.json")
    
    yaml_content = f"""model_version: assam-flood-v2-ground-truth
algorithm: "{best_candidate_name}"
features: {json.dumps(FEATURE_COLS)}
training_period: "2024-05-01 to 2025-03-31"
validation_period: "2025-04-01 to 2025-05-31"
test_period: "2025-06-01 to 2025-09-25"
regions_count: {int(full_df['region_id'].nunique())}
calibration_method: "Platt Scaling (Sigmoid CalibratedClassifierCV)"
metrics:
  accuracy: {best_metrics['accuracy']:.4f}
  precision: {best_metrics['precision']:.4f}
  recall: {best_metrics['recall']:.4f}
  f1_score: {best_metrics['f1_score']:.4f}
  roc_auc: {best_metrics['roc_auc']:.4f}
  pr_auc: {best_metrics['pr_auc']:.4f}
  brier_score: {best_metrics['brier_score']:.4f}
  optimal_threshold: {best_metrics['optimal_threshold']:.2f}
label_definition_reference: docs/ml/label_definition.md
"""
    with open(metadata_yaml_path, "w", encoding="utf-8") as f:
        f.write(yaml_content)
        
    with open(metadata_json_path, "w", encoding="utf-8") as f:
        json.dump({
            'model_version': 'assam-flood-v2-ground-truth',
            'algorithm': best_candidate_name,
            'features': FEATURE_COLS,
            'metrics': best_metrics,
            'feature_importances': feature_importances
        }, f, indent=2)
        
    print(f"[OK] Model metadata written to: {metadata_yaml_path} and {metadata_json_path}")
    
    # Generate Evaluation Report Markdown
    report_md_path = os.path.join(REPORTS_DIR, "model_performance.md")
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write("# Model Performance & Evaluation Report (Ground-Truth Model v2)\n\n")
        f.write(f"**Execution Timestamp:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Selected Champion Model:** `{best_candidate_name}`\n")
        f.write(f"**Model Version:** `assam-flood-v2-ground-truth`\n\n")
        
        f.write("## Candidate Model Comparison (Test Set Evaluation)\n\n")
        f.write("| Candidate Model | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | Brier Score | Thresh |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n")
        for res in evaluation_results:
            f.write(f"| {res['candidate_name']} | {res['precision']:.4f} | {res['recall']:.4f} | **{res['f1_score']:.4f}** | {res['roc_auc']:.4f} | {res['pr_auc']:.4f} | {res['brier_score']:.4f} | {res['optimal_threshold']:.2f} |\n")
            
        f.write("\n\n## Champion Confusion Matrix (Test Set)\n")
        f.write(f"- **True Positives (TP):** {best_metrics['tp']}\n")
        f.write(f"- **False Positives (FP):** {best_metrics['fp']}\n")
        f.write(f"- **True Negatives (TN):** {best_metrics['tn']}\n")
        f.write(f"- **False Negatives (FN):** {best_metrics['fn']}\n\n")
        
        f.write("## Top Feature Importances / Key Drivers\n\n")
        f.write("| Feature Name | Importance Weight |\n")
        f.write("| :--- | :--- |\n")
        sorted_fi = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)
        for feat, imp in sorted_fi:
            f.write(f"| `{feat}` | {imp:.4f} |\n")
            
    print(f"[OK] Evaluation report saved to: {report_md_path}")

if __name__ == "__main__":
    train_and_evaluate()
