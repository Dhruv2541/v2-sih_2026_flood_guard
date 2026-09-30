"""
Real Historical Weather Fetcher for FloodGuard ML Pipeline.

Fetches REAL historical weather data from Open-Meteo Archive API
and (where available) historical forecast data for all 180 canonical
Assam Revenue Circles.

NO SYNTHETIC DATA. NO FABRICATION. NO LEAKAGE.
"""

import os
import json
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "backend", "data")
CIRCLES_PATH = os.path.join(DATA_DIR, "assam_circles.json")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")

os.makedirs(PROCESSED_DIR, exist_ok=True)


def load_circles() -> List[Dict]:
    """Load canonical Assam Revenue Circles."""
    with open(CIRCLES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_open_meteo_archive(lat: float, lon: float, start_date: str, end_date: str) -> Optional[pd.DataFrame]:
    """
    Fetch REAL historical daily rainfall from Open-Meteo Archive API.
    
    Returns DataFrame with columns: timestamp (date), rainfall_24h (mm)
    """
    url = (
        f"https://archive-api.open-meteo.com/v1/archive?"
        f"latitude={lat}&longitude={lon}&"
        f"start_date={start_date}&end_date={end_date}&"
        f"daily=precipitation_sum&timezone=UTC"
    )
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'FloodGuard-SIH26'})
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode())
        if "daily" in data and "time" in data["daily"] and "precipitation_sum" in data["daily"]:
            df = pd.DataFrame({
                "timestamp": pd.to_datetime(data["daily"]["time"]),
                "rainfall_24h": data["daily"]["precipitation_sum"]
            })
            return df
    except Exception as e:
        print(f"  [ERROR] Archive fetch failed for ({lat}, {lon}): {e}")
    return None


def fetch_open_meteo_forecast_historical(lat: float, lon: float, start_date: str, end_date: str) -> Optional[pd.DataFrame]:
    """
    Attempt to fetch historical forecast data from Open-Meteo.
    
    NOTE: Open-Meteo does NOT provide historical forecast archives in the free tier.
    This function documents the limitation and returns None.
    
    For production, you would need:
    - ECMWF reforecast data (requires license)
    - NOAA GEFS reforecast
    - Or a commercial historical forecast archive
    
    Returns None to signal UNAVAILABLE - do not fabricate.
    """
    print(f"  [WARNING] Historical forecast data unavailable from Open-Meteo free tier.")
    print(f"  [ACTION REQUIRED] Obtain historical forecast archive from ECMWF/NOAA/commercial source.")
    return None


def fetch_all_regions_weather(
    circles: List[Dict],
    start_date: str,
    end_date: str,
    rate_limit_sleep: float = 1.0
) -> pd.DataFrame:
    """
    Fetch real historical weather for all 180 regions.
    
    Returns panel DataFrame with real rainfall_24h for each region/date.
    """
    all_data = []
    total = len(circles)
    
    for idx, circle in enumerate(circles):
        region_id = circle["object_id"]
        lat = circle["lat"]
        lon = circle["lon"]
        
        print(f"[{idx+1}/{total}] Fetching weather for {region_id} ({circle['name']})...")
        
        weather_df = fetch_open_meteo_archive(lat, lon, start_date, end_date)
        
        if weather_df is not None and not weather_df.empty:
            weather_df["region_id"] = region_id
            all_data.append(weather_df)
            print(f"    -> Got {len(weather_df)} days of real data")
        else:
            print(f"    -> NO DATA for {region_id}")
        
        # Respect rate limits
        if idx < total - 1:
            time.sleep(rate_limit_sleep)
    
    if all_data:
        master_df = pd.concat(all_data, ignore_index=True)
        print(f"\n[SUCCESS] Fetched real weather for {master_df['region_id'].nunique()}/180 regions")
        print(f"Total rows: {len(master_df):,}")
        return master_df
    else:
        raise RuntimeError("No weather data fetched for any region")


def build_real_weather_dataset(
    start_date: str = "2024-05-01",
    end_date: str = "2025-09-25"
) -> pd.DataFrame:
    """
    Main entry point: Build real historical weather panel for all 180 regions.
    
    Output: panel with region_id, timestamp, rainfall_24h (REAL data)
    """
    circles = load_circles()
    print(f"[*] Building real weather dataset for {len(circles)} regions")
    print(f"[*] Date range: {start_date} to {end_date}")
    
    weather_panel = fetch_all_regions_weather(circles, start_date, end_date)
    
    # Save raw weather panel
    raw_path = os.path.join(PROCESSED_DIR, "real_weather_panel_raw.csv")
    weather_panel.to_csv(raw_path, index=False)
    print(f"[OK] Raw weather panel saved to: {raw_path}")
    
    return weather_panel


if __name__ == "__main__":
    # Fetch real weather for the full training period
    df = build_real_weather_dataset("2024-05-01", "2025-09-25")
    print(f"\nFinal panel shape: {df.shape}")
    print(f"Regions with data: {df['region_id'].nunique()}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"Rainfall stats:\n{df['rainfall_24h'].describe()}")