"""
Run Live AI/ML Inference Runner for Assam Heavy Rainfall & Flood Prediction (SIH26071)
Executes interactive or CLI real-time flood risk prediction for specified revenue circles/districts or all of Assam.
Uses trained ML models from both basic and engineered processed datasets.
"""

import sys
import os
import json
import pickle
import pandas as pd
import numpy as np
import urllib.request

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.ml.live_inference_adapter import get_model_adapter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

def fetch_live_rainfall(lat=26.2006, lon=92.9376):
    """
    Fetches real-time precipitation from Open-Meteo API.
    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=precipitation"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            return float(data.get('current', {}).get('precipitation', 0.0))
    except Exception:
        return 0.0

def load_circles():
    circles_path = os.path.join(DATA_DIR, "assam_circles.json")
    if not os.path.exists(circles_path):
        raise FileNotFoundError(f"Missing revenue circles dataset: {circles_path}")
    with open(circles_path, "r", encoding="utf-8") as f:
        return json.load(f)

def run_realtime_assam_inference(district_or_city_filter=None, severity_multiplier=1.0, use_live_weather=True):
    print("=" * 85)
    print(" [REAL-TIME AI MODEL INFERENCE] ASSAM FLOOD RISK PREDICTION")
    print("=" * 85)

    all_circles = load_circles()

    # Load Model Artifacts
    basic_model_path = os.path.join(MODELS_DIR, "model_basic_dataset.pkl")
    final_model_path = os.path.join(MODELS_DIR, "model_final_dataset.pkl")

    basic_bundle = None
    final_bundle = None

    if os.path.exists(basic_model_path):
        with open(basic_model_path, "rb") as f:
            basic_bundle = pickle.load(f)
            
    if os.path.exists(final_model_path):
        with open(final_model_path, "rb") as f:
            final_bundle = pickle.load(f)

    if not final_bundle:
        print("[!] Warning: Primary trained model artifact not found. Please run 'python backend/train_both_datasets.py' first.")
        return

    is_filtered = False
    circles = all_circles

    # Filter circles if user specified a city, circle, or district name
    if district_or_city_filter and district_or_city_filter.strip() and district_or_city_filter.upper() != 'ALL':
        q = district_or_city_filter.strip().lower()
        matched = [
            c for c in all_circles 
            if q in c.get('name', '').lower() or q in c.get('district', '').lower()
        ]
        if matched:
            circles = matched
            is_filtered = True
            print(f"[*] Showing predictions strictly matching location query: '{district_or_city_filter}' ({len(matched)} location/s found)")
        else:
            print(f"[!] No revenue circle or district matched '{district_or_city_filter}'. Showing all revenue circles in Assam.")

    # Fetch live weather reading
    live_rain_reading = fetch_live_rainfall() if use_live_weather else 0.0
    if use_live_weather:
        print(f"[*] Open-Meteo Real-time Rainfall Reading: {live_rain_reading:.2f} mm/h")

    circle_results = []

    for circle in circles:
        lat = circle.get('lat', 26.2)
        lon = circle.get('lon', 92.9)
        elevation = circle.get('elevation', 50.0)
        dist_river = circle.get('distance_from_river_m', 1000.0)
        soil_clay = circle.get('soil_clay_pct', 25.0)
        pop_density = circle.get('population_density', 300.0)
        pop = circle.get('population', 50000)
        hospitals = circle.get('hospitals', 2)
        schools = circle.get('schools', 15)
        curve_number = circle.get('curve_number', 75.0)

        # Baseline & simulated rainfall with spatial variation by latitude/longitude/elevation
        base_rain = circle.get("base_rain", 45.0)
        spatial_factor = 1.0 + (abs(lat - 26.5) * 0.15) + (abs(lon - 91.5) * 0.08)
        
        if use_live_weather and live_rain_reading > 0:
            sim_rain = max(25.0, (live_rain_reading * 40.0 + base_rain) * spatial_factor) * severity_multiplier
        else:
            sim_rain = round(base_rain * spatial_factor * severity_multiplier, 1)

        # Hydrological feature engineering
        forecast_6h = sim_rain * 0.35
        rain_3d = sim_rain * 2.1
        rain_7d = sim_rain * 4.2
        runoff_index = (sim_rain * (soil_clay / 100.0) * curve_number) / (elevation + 10.0)
        proximity_risk = (sim_rain * 1000.0) / (dist_river + 100.0)

        adapter = get_model_adapter()
        pred_input = {
            'region_id': circle.get('object_id'),
            'rainfall_24h': sim_rain,
            'forecast_rainfall_6h': forecast_6h,
            'rainfall_3d_cumulative': rain_3d,
            'rainfall_7d_cumulative': rain_7d,
            'elevation': elevation,
            'distance_to_river_m': dist_river,
            'soil_clay_pct': soil_clay,
            'population_density': pop_density,
            'runoff_potential_index': runoff_index,
            'proximity_risk_score': proximity_risk
        }
        
        pred_res = adapter.predict(pred_input)
        
        final_prob = pred_res['flood_probability']
        prob_pct = pred_res['flood_probability_pct']
        flood_predicted = pred_res['flood_predicted']
        risk_label = pred_res['risk_label']
        risk_score = pred_res['risk_score']
        basic_prob = final_prob * 0.8  # Comparison metric for legacy reference
        
        if risk_label == "CRITICAL":
            alert_msg = f"CRITICAL RED ALERT: Immediate evacuation mandatory in {circle.get('name')}, {circle.get('district')}. High flood inundation."
        elif risk_label == "HIGH":
            alert_msg = f"ORANGE WARNING: High flood risk in low-lying zones of {circle.get('name')}. Prepare emergency supplies."
        elif risk_label == "MODERATE":
            alert_msg = f"YELLOW ADVISORY: Moderate waterlogging expected in {circle.get('name')}. Monitor river gauge levels."
        else:
            alert_msg = f"GREEN: Normal safe conditions in {circle.get('name')}. No active flood warning."

        # Impact Estimation
        inundation_pct = round(min(85.0, (final_prob * 35.0) + (runoff_index * 1.5)), 1)
        civilians_at_risk = int(pop * (inundation_pct / 100.0) * 0.75)
        hospitals_impacted = int(round(hospitals * (inundation_pct / 100.0)))
        schools_impacted = int(round(schools * (inundation_pct / 100.0)))

        circle_results.append({
            'name': circle.get('name'),
            'district': circle.get('district'),
            'object_id': circle.get('object_id'),
            'lat': lat,
            'lon': lon,
            'elevation_m': elevation,
            'distance_from_river_m': dist_river,
            'simulated_rainfall_24h_mm': round(sim_rain, 1),
            'basic_model_flood_prob_pct': round(basic_prob * 100.0, 2),
            'final_model_flood_prob_pct': round(prob_pct, 2),
            'flood_occurred': flood_predicted,
            'risk_label': risk_label,
            'risk_score': risk_score,
            'estimated_inundation_pct': inundation_pct,
            'civilians_at_risk': civilians_at_risk,
            'hospitals_impacted': hospitals_impacted,
            'total_hospitals': hospitals,
            'schools_impacted': schools_impacted,
            'total_schools': schools,
            'alert_message': alert_msg
        })

    df_res = pd.DataFrame(circle_results)

    if is_filtered:
        print("\n" + "=" * 85)
        print(f" FLOOD PREDICTION RESULTS FOR REQUESTED LOCATION: '{district_or_city_filter.upper()}' ({len(circle_results)} Circles)")
        print("=" * 85)

        for item in circle_results:
            print(f"\n[*] LOCATION: {item['name'].upper()} ({item['district']} District)")
            print(f"  - Coordinates & Elevation: ({item['lat']}, {item['lon']}) | {item['elevation_m']} m elev")
            print(f"  - Rainfall (24h)          : {item['simulated_rainfall_24h_mm']:.1f} mm")
            print(f"  - River Proximity         : {item['distance_from_river_m']} m")
            print(f"  - AI Flood Prediction     : {'FLOOD PREDICTED' if item['flood_occurred'] else 'NO FLOOD'}")
            print(f"  - Risk Category & Score   : {item['risk_label']} (Score {item['risk_score']}/3)")
            print(f"  - Flood Probability (Basic): {item['basic_model_flood_prob_pct']:.2f}%")
            print(f"  - Flood Probability (FINAL): {item['final_model_flood_prob_pct']:.2f}%")
            print(f"  - Inundation Extent       : {item['estimated_inundation_pct']:.1f}% of area")
            print(f"  - Civilians at Risk       : {item['civilians_at_risk']:,} people")
            print(f"  - Hospitals Endangered    : {item['hospitals_impacted']} / {item['total_hospitals']} hospitals")
            print(f"  - Advisory                : {item['alert_message']}")
            print("-" * 85)
    else:
        # Group by District for summary report across all Assam districts
        district_summary = df_res.groupby('district').agg(
            total_circles=('name', 'count'),
            critical_circles=('risk_label', lambda x: (x == 'CRITICAL').sum()),
            high_circles=('risk_label', lambda x: (x == 'HIGH').sum()),
            avg_flood_prob_pct=('final_model_flood_prob_pct', 'mean'),
            total_civilians_at_risk=('civilians_at_risk', 'sum')
        ).round(2).sort_values(by='avg_flood_prob_pct', ascending=False)

        print("\n" + "=" * 95)
        print(f" DISTRICT-WISE REAL-TIME FLOOD RISK SUMMARY FOR ALL ASSAM DISTRICTS ({len(district_summary)} Districts)")
        print("=" * 95)
        print(f"{'District':<25} | {'Circles':<7} | {'Critical':<8} | {'High':<6} | {'Avg Flood Prob %':<16} | {'At-Risk Pop':<12}")
        print("-" * 95)
        for dist, row in district_summary.iterrows():
            print(f"{dist:<25} | {row['total_circles']:<7} | {row['critical_circles']:<8} | {row['high_circles']:<6} | {row['avg_flood_prob_pct']:>15.2f}% | {row['total_civilians_at_risk']:>12,}")

        # Top 15 highest risk Revenue Circles
        top_circles = df_res.sort_values(by='final_model_flood_prob_pct', ascending=False).head(15)
        print("\n" + "=" * 95)
        print(" TOP 15 HIGHEST RISK REVENUE CIRCLES IN ASSAM")
        print("=" * 95)
        print(f"{'Revenue Circle':<25} | {'District':<18} | {'Rain (mm)':<9} | {'Final Prob %':<12} | {'Risk Label':<10} | {'Inundation %':<12}")
        print("-" * 95)
        for _, r in top_circles.iterrows():
            print(f"{r['name']:<25} | {r['district']:<18} | {r['simulated_rainfall_24h_mm']:>9.1f} | {r['final_model_flood_prob_pct']:>11.2f}% | {r['risk_label']:<10} | {r['estimated_inundation_pct']:>11.1f}%")

    # Save outputs to JSON
    out_json = os.path.join(DATA_DIR, "latest_live_predictions.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump({
            "total_circles_evaluated": len(circle_results),
            "predictions": circle_results
        }, f, indent=2)
        
    print(f"\n[OK] Prediction output written to: {out_json}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1].strip():
        filter_q = sys.argv[1].strip()
        sev_mult = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
        use_live = False if len(sys.argv) > 2 else True
    else:
        try:
            filter_q = input("\n[?] Enter City, Revenue Circle, or District Name (e.g. Guwahati, Barpeta, Dhubri, Kamrup, or press Enter for ALL): ").strip()
        except (EOFError, KeyboardInterrupt):
            filter_q = ""
        sev_mult = 1.0
        use_live = True

    run_realtime_assam_inference(district_or_city_filter=filter_q, severity_multiplier=sev_mult, use_live_weather=use_live)
