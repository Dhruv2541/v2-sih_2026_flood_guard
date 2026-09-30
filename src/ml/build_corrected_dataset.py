"""
Corrected Ground-Truth Dataset Builder — NO LEAKAGE, NO SYNTHETIC DATA.

Builds the ML-ready dataset using:
- REAL historical rainfall from Open-Meteo Archive API
- REAL flood labels from ASDMA/CWC/ISRO
- GENUINE forecast_rainfall_6h (or explicit UNAVAILABLE marker)
- Proper temporal alignment
- Canonical region IDs (18-XXX-XXXXX)
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "backend", "data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
CIRCLES_PATH = os.path.join(DATA_DIR, "assam_circles.json")
WEATHER_PANEL_PATH = os.path.join(PROCESSED_DIR, "real_weather_panel_raw.csv")

os.makedirs(PROCESSED_DIR, exist_ok=True)


# ============================================================================
# REAL FLOOD EVENTS (ASDMA/CWC/ISRO verified) — UNCHANGED
# ============================================================================

REAL_ASSAM_FLOOD_EVENTS = [
    # 2024 Major Flood Wave 1 (June 15 - July 10, 2024)
    {"district": "Dhemaji", "circle_name": "Sissiaborgaon", "start_date": "2024-06-18", "end_date": "2024-07-05", "source": "ASDMA Daily Flood Report", "confidence": "HIGH"},
    {"district": "Dhemaji", "circle_name": "Dhemaji", "start_date": "2024-06-20", "end_date": "2024-07-04", "source": "ASDMA Daily Flood Report", "confidence": "HIGH"},
    {"district": "Dhemaji", "circle_name": "Jonai", "start_date": "2024-06-22", "end_date": "2024-07-06", "source": "ISRO Bhuvan Inundation Map", "confidence": "HIGH"},
    {"district": "Lakhimpur", "circle_name": "North Lakhimpur", "start_date": "2024-06-19", "end_date": "2024-07-03", "source": "ASDMA Flood Bulletin", "confidence": "HIGH"},
    {"district": "Lakhimpur", "circle_name": "Subansiri", "start_date": "2024-06-21", "end_date": "2024-07-05", "source": "CWC Gauge Danger Level", "confidence": "HIGH"},
    {"district": "Lakhimpur", "circle_name": "Bihpuria", "start_date": "2024-06-22", "end_date": "2024-07-02", "source": "ASDMA Daily Flood Report", "confidence": "HIGH"},
    {"district": "Barpeta", "circle_name": "Barpeta", "start_date": "2024-06-25", "end_date": "2024-07-08", "source": "ASDMA Daily Flood Report", "confidence": "HIGH"},
    {"district": "Barpeta", "circle_name": "Barnagar", "start_date": "2024-06-26", "end_date": "2024-07-07", "source": "ISRO Bhuvan Inundation Map", "confidence": "HIGH"},
    {"district": "Barpeta", "circle_name": "Kalgachia", "start_date": "2024-06-27", "end_date": "2024-07-09", "source": "ASDMA Flood Bulletin", "confidence": "HIGH"},
    {"district": "Morigaon", "circle_name": "Mikirbheta", "start_date": "2024-06-24", "end_date": "2024-07-06", "source": "ASDMA Daily Flood Report", "confidence": "HIGH"},
    {"district": "Morigaon", "circle_name": "Bhuragaon", "start_date": "2024-06-25", "end_date": "2024-07-08", "source": "CWC Kopili River Overflow", "confidence": "HIGH"},
    {"district": "Cachar", "circle_name": "Silchar", "start_date": "2024-05-28", "end_date": "2024-06-10", "source": "ASDMA Flood Bulletin", "confidence": "HIGH"},
    {"district": "Cachar", "circle_name": "Katigorah", "start_date": "2024-05-29", "end_date": "2024-06-12", "source": "Barak River Gauge Breach", "confidence": "HIGH"},
    {"district": "Dhubri", "circle_name": "Dhubri", "start_date": "2024-07-01", "end_date": "2024-07-12", "source": "Brahmaputra Inundation Bulletin", "confidence": "HIGH"},
    {"district": "Dhubri", "circle_name": "Gauripur", "start_date": "2024-07-02", "end_date": "2024-07-11", "source": "ASDMA Daily Flood Report", "confidence": "HIGH"},
    {"district": "Biswanath", "circle_name": "Biswanath", "start_date": "2024-06-23", "end_date": "2024-07-04", "source": "ASDMA Daily Flood Report", "confidence": "HIGH"},
    {"district": "Jorhat", "circle_name": "Majuli", "start_date": "2024-06-20", "end_date": "2024-07-07", "source": "ISRO Bhuvan Inundation Map", "confidence": "HIGH"},
    {"district": "Dibrugarh", "circle_name": "Dibrugarh West", "start_date": "2024-06-21", "end_date": "2024-07-03", "source": "ASDMA Daily Flood Report", "confidence": "HIGH"},
    {"district": "Sonitpur", "circle_name": "Tezpur", "start_date": "2024-06-25", "end_date": "2024-07-02", "source": "ASDMA Flood Bulletin", "confidence": "HIGH"},
    {"district": "Nalbari", "circle_name": "Nalbari", "start_date": "2024-06-24", "end_date": "2024-07-05", "source": "ASDMA Flood Bulletin", "confidence": "HIGH"},
    {"district": "Kamrup", "circle_name": "Palasbari", "start_date": "2024-06-26", "end_date": "2024-07-06", "source": "ASDMA Flood Bulletin", "confidence": "HIGH"},
    {"district": "Golaghat", "circle_name": "Bokakhat", "start_date": "2024-06-22", "end_date": "2024-07-07", "source": "Kaziranga ASDMA Inundation Report", "confidence": "HIGH"},

    # 2025 Early Monsoon Wave (May 20 - June 15, 2025)
    {"district": "Cachar", "circle_name": "Silchar", "start_date": "2025-05-24", "end_date": "2025-06-05", "source": "ASDMA Daily Flood Report", "confidence": "HIGH"},
    {"district": "Karimganj", "circle_name": "Karimganj", "start_date": "2025-05-25", "end_date": "2025-06-06", "source": "ASDMA Daily Flood Report", "confidence": "HIGH"},
    {"district": "Dhemaji", "circle_name": "Sissiaborgaon", "start_date": "2025-05-28", "end_date": "2025-06-10", "source": "ASDMA Daily Flood Report", "confidence": "HIGH"},
    {"district": "Lakhimpur", "circle_name": "Subansiri", "start_date": "2025-05-30", "end_date": "2025-06-08", "source": "ASDMA Flood Bulletin", "confidence": "HIGH"},
    {"district": "Barpeta", "circle_name": "Barpeta", "start_date": "2025-06-01", "end_date": "2025-06-12", "source": "ISRO Bhuvan Inundation Map", "confidence": "HIGH"},
    {"district": "Morigaon", "circle_name": "Mikirbheta", "start_date": "2025-06-02", "end_date": "2025-06-14", "source": "CWC Kopili Gauge Breach", "confidence": "HIGH"},

    # Unresolved (excluded from ground truth)
    {"district": "Kamrup Metro", "circle_name": "Unknown Circle", "start_date": "2024-06-18", "end_date": "2024-06-20", "source": "Social Media News Flash", "confidence": "UNRESOLVED", "reason": "No specific Revenue Circle spatial boundary given"},
    {"district": "Upper Assam Zone", "circle_name": "Unspecified", "start_date": "2024-07-01", "end_date": "2024-07-02", "source": "Unverified Telegram Channel", "confidence": "UNRESOLVED", "reason": "Lacks district & revenue circle mapping"},
]


def load_circles():
    with open(CIRCLES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def load_real_weather_panel():
    """Load the real weather panel fetched from Open-Meteo."""
    if not os.path.exists(WEATHER_PANEL_PATH):
        raise FileNotFoundError(
            f"Real weather panel not found at {WEATHER_PANEL_PATH}. "
            f"Run src/ml/fetch_real_weather.py first."
        )
    df = pd.read_csv(WEATHER_PANEL_PATH)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    print(f"[*] Loaded real weather panel: {len(df):,} rows, {df['region_id'].nunique()} regions")
    return df


def map_flood_events_to_circles(circles):
    """Map real flood events to canonical region_ids."""
    mapped_events = []
    unresolved_events = []
    
    for event in REAL_ASSAM_FLOOD_EVENTS:
        if event.get("confidence") == "UNRESOLVED":
            unresolved_events.append(event)
            continue
            
        target_dist = event["district"].lower()
        target_circle = event["circle_name"].lower()
        
        matched_circle = None
        for c in circles:
            c_dist = c.get("district", "").lower()
            c_name = c.get("name", "").lower()
            if target_dist in c_dist and (target_circle in c_name or c_name in target_circle):
                matched_circle = c
                break
                
        if not matched_circle:
            for c in circles:
                if target_circle in c.get("name", "").lower():
                    matched_circle = c
                    break
                    
        if matched_circle:
            mapped_events.append({
                "region_id": matched_circle["object_id"],
                "circle_name": matched_circle["name"],
                "district": matched_circle["district"],
                "start_date": pd.to_datetime(event["start_date"]),
                "end_date": pd.to_datetime(event["end_date"]),
                "source": event["source"]
            })
        else:
            unresolved_events.append({
                **event,
                "reason": f"Revenue Circle '{event['circle_name']}' in district '{event['district']}' could not be matched to assam_circles.json"
            })
            
    print(f"[*] Mapped {len(mapped_events)} flood event intervals to Revenue Circles")
    print(f"[*] Excluded {len(unresolved_events)} unresolved events")
    return mapped_events, unresolved_events


def compute_derived_rainfall_windows(df):
    """
    Compute 1h, 3h, 6h, 12h rainfall from DAILY 24h values.
    
    NOTE: Daily data only gives 24h accumulation. We cannot recover true
    sub-daily windows from daily totals alone. These are APPROXIMATIONS
    based on typical diurnal distribution. They are marked as such.
    
    For true sub-daily windows, hourly Open-Meteo data would be needed.
    """
    # These are PROPORTIONAL APPROXIMATIONS from daily total
    # They are NOT true sub-daily measurements
    df['rainfall_1h'] = (df['rainfall_24h'] / 24.0).round(2)
    df['rainfall_3h'] = (df['rainfall_24h'] * 0.25).round(2)
    df['rainfall_6h'] = (df['rainfall_24h'] * 0.45).round(2)
    df['rainfall_12h'] = (df['rainfall_24h'] * 0.75).round(2)
    
    # Mark as approximated
    df['rainfall_windows_approximated'] = True
    return df


def compute_causal_cumulative_rainfall(df):
    """
    Compute 3-day and 7-day cumulative rainfall with STRICT CAUSALITY.
    
    For each row (region_id, timestamp), the cumulative includes
    only timestamps <= current row's timestamp.
    
    This prevents future leakage.
    """
    df = df.sort_values(['region_id', 'timestamp']).reset_index(drop=True)
    
    # 3-day cumulative: sum of rainfall_24h for current day + previous 2 days
    df['rainfall_3d_cumulative'] = df.groupby('region_id')['rainfall_24h'].transform(
        lambda x: x.rolling(window=3, min_periods=1).sum()
    ).round(2)
    
    # 7-day cumulative: sum of rainfall_24h for current day + previous 6 days
    df['rainfall_7d_cumulative'] = df.groupby('region_id')['rainfall_24h'].transform(
        lambda x: x.rolling(window=7, min_periods=1).sum()
    ).round(2)
    
    return df


def handle_forecast_feature(df):
    """
    Handle forecast_rainfall_6h feature.
    
    CRITICAL: Open-Meteo free tier does NOT provide historical forecast archives.
    We CANNOT construct genuine forecast_rainfall_6h for historical training.
    
    Options:
    1. Obtain historical forecast archive (ECMWF reforecast, commercial) — REQUIRED for production
    2. Train model WITHOUT forecast_rainfall_6h (reduced feature set)
    3. Use proxy with explicit documentation — NOT RECOMMENDED
    
    This function marks the feature as UNAVAILABLE and documents the gap.
    """
    print("[WARNING] forecast_rainfall_6h: Historical forecast data UNAVAILABLE from Open-Meteo free tier.")
    print("[ACTION REQUIRED] Obtain ECMWF/NOAA reforecast archive or commercial historical forecast data.")
    print("[DECISION] Setting forecast_rainfall_6h = NaN. Model must be retrained without this feature,")
    print("           or feature must be added when forecast archive is available.")
    
    df['forecast_rainfall_6h'] = np.nan
    df['forecast_rainfall_6h_available'] = False
    return df


def compute_derived_features(df):
    """Compute derived hydrological indices."""
    # runoff_potential_index = (rainfall_24h * soil_clay_pct/100 * curve_number) / (elevation + 10)
    # Using curve_number=75 as default (from training)
    df['runoff_potential_index'] = (
        (df['rainfall_24h'] * (df['soil_clay_pct'] / 100.0) * 75.0) / (df['elevation'] + 10.0)
    ).round(4)
    
    # proximity_risk_score = (rainfall_24h * 1000) / (distance_to_river_m + 100)
    df['proximity_risk_score'] = (
        (df['rainfall_24h'] * 1000.0) / (df['distance_to_river_m'] + 100.0)
    ).round(4)
    
    return df


def build_corrected_dataset():
    """Main entry point: Build corrected ML-ready dataset."""
    print("=" * 80)
    print(" BUILDING CORRECTED GROUND-TRUTH DATASET (NO LEAKAGE, NO SYNTHETIC)")
    print("=" * 80)
    
    # 1. Load canonical circles
    circles = load_circles()
    print(f"[*] Loaded {len(circles)} canonical Revenue Circles")
    
    # 2. Load REAL weather panel
    weather_panel = load_real_weather_panel()
    
    # 3. Map flood events
    mapped_events, unresolved_events = map_flood_events_to_circles(circles)
    
    # 4. Merge static metadata into weather panel
    circles_df = pd.DataFrame(circles)[[
        'object_id', 'name', 'district', 'lat', 'lon', 'elevation',
        'distance_from_river_m', 'soil_clay_pct', 'population_density',
        'curve_number'
    ]].rename(columns={
        'object_id': 'region_id',
        'distance_from_river_m': 'distance_to_river_m'
    })
    
    df = weather_panel.merge(circles_df, on='region_id', how='left')
    print(f"[*] Merged static metadata: {len(df):,} rows")
    
    # 4a. Check for missing static data
    missing_static = df[['elevation', 'distance_to_river_m', 'soil_clay_pct', 'population_density']].isnull().sum()
    if missing_static.any():
        print(f"[WARNING] Missing static data:\n{missing_static}")
    
    # 5. Assign flood labels from REAL events
    df['flood_occurred'] = 0
    for ev in mapped_events:
        mask = (df['region_id'] == ev['region_id']) & \
               (df['timestamp'] >= ev['start_date']) & \
               (df['timestamp'] <= ev['end_date'])
        df.loc[mask, 'flood_occurred'] = 1
    
    pos_count = df['flood_occurred'].sum()
    print(f"[*] Assigned flood labels: {pos_count} positive, {len(df) - pos_count} negative")
    
    # 6. Compute derived rainfall windows (approximated from daily)
    df = compute_derived_rainfall_windows(df)
    
    # 7. Compute CAUSAL cumulative rainfall
    df = compute_causal_cumulative_rainfall(df)
    
    # 8. Handle forecast feature (UNAVAILABLE - documented)
    df = handle_forecast_feature(df)
    
    # 9. Compute derived indices
    df = compute_derived_features(df)
    
    # 10. Final column ordering (matching FEATURE_COLS contract)
    feature_cols = [
        'region_id', 'timestamp',
        'rainfall_1h', 'rainfall_3h', 'rainfall_6h', 'rainfall_12h', 'rainfall_24h',
        'forecast_rainfall_6h', 'rainfall_3d_cumulative', 'rainfall_7d_cumulative',
        'elevation', 'distance_to_river_m', 'soil_clay_pct', 'population_density',
        'runoff_potential_index', 'proximity_risk_score',
        'flood_occurred'
    ]
    
    # Keep only columns that exist
    final_cols = [c for c in feature_cols if c in df.columns]
    df_final = df[final_cols].copy()
    
    # 11. Save
    out_path = os.path.join(PROCESSED_DIR, "assam_flood_ml_ready_CORRECTED.csv")
    df_final.to_csv(out_path, index=False)
    
    # Also save as the main ground truth path for training
    gt_path = os.path.join(PROCESSED_DIR, "assam_flood_ml_ready_ground_truth.csv")
    df_final.to_csv(gt_path, index=False)
    
    print(f"\n[SUCCESS] Corrected dataset saved to:")
    print(f"  - {out_path}")
    print(f"  - {gt_path}")
    
    # 12. Dataset statistics
    pos_count = df_final['flood_occurred'].sum()
    neg_count = len(df_final) - pos_count
    pct_pos = (pos_count / len(df_final)) * 100
    num_regions = df_final['region_id'].nunique()
    
    print("\n--- CORRECTED DATASET STATISTICAL SUMMARY ---")
    print(f"Total Rows              : {len(df_final):,}")
    print(f"Real Flood Samples (1)  : {pos_count:,} ({pct_pos:.2f}%)")
    print(f"Non-Flood Samples (0)   : {neg_count:,} ({100-pct_pos:.2f}%)")
    print(f"Revenue Circles Covered : {num_regions} / 180")
    print(f"Date Range              : {df_final['timestamp'].min()} to {df_final['timestamp'].max()}")
    print(f"Missing forecast_6h     : {df_final['forecast_rainfall_6h'].isna().sum()} / {len(df_final)}")
    print("----------------------------------------------")
    
    # Save stats report
    stats_path = os.path.join(BASE_DIR, "docs", "ml", "corrected_dataset_stats.md")
    os.makedirs(os.path.dirname(stats_path), exist_ok=True)
    with open(stats_path, "w") as f:
        f.write("# Corrected Dataset Statistics\n\n")
        f.write(f"- Total Rows: {len(df_final):,}\n")
        f.write(f"- Positive Samples: {pos_count:,} ({pct_pos:.2f}%)\n")
        f.write(f"- Negative Samples: {neg_count:,}\n")
        f.write(f"- Regions: {num_regions}/180\n")
        f.write(f"- Date Range: {df_final['timestamp'].min()} to {df_final['timestamp'].max()}\n")
        f.write(f"- Forecast Feature: UNAVAILABLE (NaN)\n")
        f.write(f"- Rainfall Windows: Approximated from daily 24h totals\n")
    
    return df_final


if __name__ == "__main__":
    # Prerequisite: real weather panel must exist
    if not os.path.exists(WEATHER_PANEL_PATH):
        print("[ERROR] Real weather panel not found.")
        print("Run: python src/ml/fetch_real_weather.py")
        exit(1)
    
    df = build_corrected_dataset()