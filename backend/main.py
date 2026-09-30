"""
FastAPI Decision-Support & Flood Early-Warning Server (SIH26071)
Serves real-time AI/ML predictions, storm simulation, revenue circle risk maps,
impact assessments, and early warning alert triggers across Assam's 180 Revenue Circles.
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pickle
import pandas as pd
import numpy as np
import json
import urllib.request
import os
import random
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.ml.live_inference_adapter import get_model_adapter

app = FastAPI(title="SIH26071 Assam Flood Early Warning Platform API", version="2.0.0")

def send_alert_sms(city_name, people_affected):
    """
    Mock function to send SMS alerts.
    To make this real:
    1. Sign up for free Twilio account.
    2. Replace the keys below and uncomment the real Twilio code.
    """
    message_body = f"⚠️ CRITICAL ALERT: Immediate flood danger in {city_name}. Est {people_affected} people at risk. Evacuate to higher ground immediately!"
    
    print(f"\n[{'='*40}]")
    print(f"📱 MOCK SMS TRIGGERED FOR {city_name.upper()}")
    # --- REAL TWILIO CODE (No installation required) ---
    import urllib.parse
    import urllib.request
    import base64
    
    # HACKATHON FIX: Twilio Trial accounts will block you (400 Bad Request) if you try to send 10 texts 
    # at the exact same millisecond. We will only send the real text for Guwahati, and mock the rest!
    if city_name.lower() != "guwahati":
        print("✅ Mock SMS recorded (Real Twilio API skipped to prevent spam blocks).")
        return

    import os
    
    # Simple .env parser to avoid requiring pip installs on Windows
    if os.path.exists(".env"):
        with open(".env") as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

    account_sid = os.environ.get('TWILIO_ACCOUNT_SID', '')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN', '')
    
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    
    # HACKATHON FIX 2: Twilio Trial accounts in India CANNOT send custom messages due to strict telecom laws.
    # We MUST send their pre-approved template string "sms_account_alerts". 
    data = urllib.parse.urlencode({
        'To': '+916351208639',
        'From': '+17372212163',
        'Body': 'sms_account_alerts'
    }).encode('ascii')
    
    auth_string = f"{account_sid}:{auth_token}"
    b64_auth = base64.b64encode(auth_string.encode('ascii')).decode('ascii')
    
    req = urllib.request.Request(url, data=data)
    req.add_header("Authorization", f"Basic {b64_auth}")
    
    try:
        with urllib.request.urlopen(req) as response:
            print("✅ Real SMS Sent successfully!")
    except Exception as e:
        error_details = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
        print(f"❌ Failed to send real SMS: {error_details}")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")


# Global Models and Data
circles = []
cities = []

bin_clf = None
sev_clf = None
inund_reg = None
impact_reg = None
legacy_model = None

def load_resources():
    global circles, cities, bin_clf, sev_clf, inund_reg, impact_reg, legacy_model
    
    # 1. Load Circles Metadata
    assam_circles_path = os.path.join(DATA_DIR, "assam_circles.json")
    if os.path.exists(assam_circles_path):
        with open(assam_circles_path, "r", encoding="utf-8") as f:
            circles = json.load(f)
        print(f"Loaded {len(circles)} Assam Revenue Circles from data/assam_circles.json")
    
    cities_path = os.path.join(DATA_DIR, "cities.json")
    if os.path.exists(cities_path):
        with open(cities_path, "r", encoding="utf-8") as f:
            cities = json.load(f)
            
    # 2. Load Trained AI Models
    try:
        bin_path_corr = os.path.join(MODELS_DIR, "flood_binary_clf_CORRECTED.pkl")
        bin_path = bin_path_corr if os.path.exists(bin_path_corr) else os.path.join(MODELS_DIR, "flood_binary_clf.pkl")
        if os.path.exists(bin_path):
            with open(bin_path, "rb") as f:
                bin_clf = pickle.load(f)
                
        sev_path = os.path.join(MODELS_DIR, "flood_severity_clf.pkl")
        if os.path.exists(sev_path):
            with open(sev_path, "rb") as f:
                sev_clf = pickle.load(f)
                
        inund_path = os.path.join(MODELS_DIR, "inundation_regressor.pkl")
        if os.path.exists(inund_path):
            with open(inund_path, "rb") as f:
                inund_reg = pickle.load(f)
                
        impact_path = os.path.join(MODELS_DIR, "impact_regressor.pkl")
        if os.path.exists(impact_path):
            with open(impact_path, "rb") as f:
                impact_reg = pickle.load(f)
                
        legacy_path = os.path.join(MODELS_DIR, "flood_rf_model.pkl")
        if os.path.exists(legacy_path):
            with open(legacy_path, "rb") as f:
                legacy_model = pickle.load(f)
                
        print("Successfully loaded AI/ML model artifacts!")
    except Exception as e:
        print(f"Warning loading model artifacts: {e}")

load_resources()

def fetch_live_rain(lat: float, lon: float) -> float:
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=precipitation"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            return float(data.get('current', {}).get('precipitation', 0.0))
    except Exception:
        return 0.0

class SimulationRequest(BaseModel):
    severity_multiplier: float = 1.0  # 1.0 = normal, 2.0 = heavy rain, 3.0 = extreme
    use_live_weather: bool = False
    custom_rainfall_mm: Optional[float] = None
    city_or_district: Optional[str] = None  # City or district filter

@app.get("/api/state")
def get_current_state():
    return {
        "circles": circles if circles else [],
        "cities": cities if cities else [],
        "total_circles": len(circles),
        "total_districts": len(set(c["district"] for c in circles)) if circles else 0
    }

@app.post("/api/simulate")
def simulate_storm(req: SimulationRequest):
    load_resources()  # Reload in case models were newly saved
    results = []

    # Target circles (180 Assam Revenue Circles) or default cities fallback
    items = circles if circles else cities

    # Filter items if user entered a specific city or district name
    if req.city_or_district and req.city_or_district.strip():
        q = req.city_or_district.strip().lower()
        matched = [
            item for item in items
            if q in item.get("name", "").lower() 
            or q in item.get("district", "").lower()
            or q in item.get("City", "").lower()
        ]
        if matched:
            items = matched

    # Fetch live weather once if requested to avoid 180 sequential network calls
    global_live_rain = 0.0
    if req.use_live_weather:
        global_live_rain = fetch_live_rain(26.2006, 92.9376)


    for item in items:
        lat = item.get("lat", 26.2)
        lon = item.get("lon", 92.9)
        elevation = item.get("elevation", 50.0)
        pop = item.get("population", 50000)
        hospitals = item.get("hospitals", 2)
        schools = item.get("schools", 15)

        # 1. Rainfall Simulation
        base_rain = item.get("base_rain", 45.0)
        if req.custom_rainfall_mm is not None:
            sim_rain = req.custom_rainfall_mm * req.severity_multiplier
        elif req.use_live_weather:
            sim_rain = max(25.0, global_live_rain * 40.0 + base_rain) * req.severity_multiplier
        else:
            sim_rain = base_rain * req.severity_multiplier

        # Hydrological River Surge & Soil Moisture
        sim_river = round(elevation * 0.4 + (sim_rain * 0.18), 2)
        sim_soil = round(min(100.0, max(15.0, item.get("soil_clay_pct", 25.0) * 1.2 + sim_rain * 0.4)), 2)

        # Model Inference via AssamFloodModel Adapter
        adapter = get_model_adapter()
        ml_input = {
            "region_id": item.get("object_id"),
            "rainfall_24h": sim_rain,
            "elevation": elevation,
            "distance_to_river_m": item.get("distance_from_river_m", 1000.0),
            "soil_clay_pct": item.get("soil_clay_pct", 25.0),
            "population_density": item.get("population_density", 300.0)
        }
        
        ml_res = adapter.predict(ml_input)
        flood_occurred = ml_res["flood_predicted"]
        risk_score = ml_res["risk_score"]
        flood_prob = ml_res["flood_probability"]
        flood_prob_pct = ml_res["flood_probability_pct"]

        if inund_reg is not None:
            try:
                inundation_pct = float(np.clip(inund_reg.predict(df_feat)[0], 0.0, 1.0))
            except Exception:
                inundation_pct = 0.05 if risk_score == 1 else (0.18 if risk_score == 2 else (0.35 if risk_score == 3 else 0.01))
        else:
            inundation_pct = 0.05 if risk_score == 1 else (0.18 if risk_score == 2 else (0.35 if risk_score == 3 else 0.01))

        if impact_reg is not None:
            try:
                imp_preds = impact_reg.predict(df_feat)[0]
                pop_affected = int(max(0, imp_preds[0]))
                crop_damaged_ha = round(float(max(0, imp_preds[1])), 1)
            except Exception:
                pop_affected = int(pop * inundation_pct * 0.8)
                crop_damaged_ha = round(float(item.get("area_sqkm", 150.0) * inundation_pct * 40.0), 1)
        else:
            pop_affected = int(pop * inundation_pct * 0.8)
            crop_damaged_ha = round(float(item.get("area_sqkm", 150.0) * inundation_pct * 40.0), 1)

        # Fallback to legacy single RF model if new models not yet initialized
        if sev_clf is None and legacy_model is not None:
            try:
                legacy_features = pd.DataFrame([{
                    "Rainfall_mm": sim_rain,
                    "River_Level_m": sim_river,
                    "Soil_Moisture_%": sim_soil,
                    "Elevation_m": elevation
                }])
                risk_score = int(legacy_model.predict(legacy_features)[0])
            except Exception:
                pass

        risk_labels = ["Low", "Moderate", "High", "Critical"]
        risk_label = risk_labels[min(3, max(0, risk_score))]

        # Detailed Impact Calculation
        hospitals_affected = 0
        schools_affected = 0
        road_km_blocked = round(float(item.get("major_road_km", 12.0) * max(0.05, inundation_pct)), 1)

        if risk_score == 3:
            hospitals_affected = max(1, int(np.ceil(hospitals * min(1.0, inundation_pct * 1.5 + 0.35))))
            schools_affected = max(2, int(np.ceil(schools * min(1.0, inundation_pct * 1.5 + 0.4))))
            alert_msg = f"CRITICAL RED ALERT: Immediate evacuation mandatory in {item.get('name', 'Circle')}, {item.get('district', 'Assam')}. Severe river inundation expected."
            try:
                send_alert_sms(item.get('name', 'Circle'), pop_affected)
            except Exception:
                pass
        elif risk_score == 2:
            hospitals_affected = max(1, int(np.ceil(hospitals * min(0.6, inundation_pct * 1.2 + 0.2))))
            schools_affected = max(1, int(np.ceil(schools * min(0.6, inundation_pct * 1.2 + 0.25))))
            alert_msg = f"ORANGE WARNING: High flood risk in low-lying zones of {item.get('name', 'Circle')}. Prepare emergency supplies."
        elif risk_score == 1:
            hospitals_affected = max(1, int(np.ceil(hospitals * max(0.08, inundation_pct * 0.5))))
            schools_affected = max(1, int(np.ceil(schools * max(0.12, inundation_pct * 0.5))))
            alert_msg = f"YELLOW ADVISORY: Moderate waterlogging expected in {item.get('name', 'Circle')}. Monitor river levels."
        else:
            hospitals_affected = 0
            schools_affected = 0
            alert_msg = f"GREEN: Safe conditions in {item.get('name', 'Circle')}. No active flood alert."


        results.append({
            "object_id": item.get("object_id", str(random.randint(10000, 99999))),
            "name": item.get("name", item.get("City", "Circle")),
            "district": item.get("district", "Assam"),
            "lat": lat,
            "lon": lon,
            "elevation_m": elevation,
            "sim_rain_mm": round(sim_rain, 2),
            "sim_river_m": round(sim_river, 2),
            "sim_soil_pct": sim_soil,
            "flood_occurred": flood_occurred,
            "risk_score": risk_score,
            "risk_label": risk_label,
            "inundation_pct": round(inundation_pct * 100.0, 2),
            "alert": alert_msg,
            "impact": {
                "population_at_risk": pop_affected,
                "total_hospitals": hospitals,
                "hospitals_affected": hospitals_affected,
                "total_schools": schools,
                "schools_affected": schools_affected,
                "crop_area_damaged_ha": crop_damaged_ha,
                "road_km_blocked": road_km_blocked
            }
        })

    return {"simulation": results, "total_evaluated": len(results)}

@app.get("/api/history/{city_name}")
def get_historical_data(city_name: str):
    try:
        df = pd.read_csv("data/historical_flood_data.csv")
        city_data = df[df["City"].str.lower() == city_name.lower()]
        
        if city_data.empty:
            return {"error": f"No historical data found for {city_name}"}
            
        recent_data = city_data.tail(30).to_dict(orient="records")
        return {
            "city": city_name, 
            "data_points": len(recent_data),
            "history": recent_data
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/live-prediction")
def get_live_predictions():
    """Runs dynamic real-time prediction using live Open-Meteo weather data."""
    sim_req = SimulationRequest(severity_multiplier=1.0, use_live_weather=True)
    return simulate_storm(sim_req)

@app.get("/api/alerts")
def get_active_alerts(min_severity: str = Query("Moderate", description="Minimum alert level: Moderate, High, Critical")):
    """Retrieves active location-specific early warning alerts."""
    sim_res = simulate_storm(SimulationRequest(severity_multiplier=1.2, use_live_weather=False))
    all_sims = sim_res.get("simulation", [])
    
    severity_order = {"Low": 0, "Moderate": 1, "High": 2, "Critical": 3}
    target_score = severity_order.get(min_severity, 1)
    
    active_alerts = [
        item for item in all_sims if item["risk_score"] >= target_score
    ]
    return {
        "active_alerts": active_alerts,
        "count": len(active_alerts)
    }

@app.get("/api/summary")
def get_state_summary():
    """Returns aggregated state-wide & district-wide impact metrics."""
    sim_res = simulate_storm(SimulationRequest(severity_multiplier=1.5, use_live_weather=False))
    all_sims = sim_res.get("simulation", [])
    
    total_pop_at_risk = sum(item["impact"]["population_at_risk"] for item in all_sims)
    total_crop_ha = sum(item["impact"]["crop_area_damaged_ha"] for item in all_sims)
    critical_circles = [item for item in all_sims if item["risk_score"] == 3]
    high_circles = [item for item in all_sims if item["risk_score"] == 2]
    
@app.get("/api/predict/{location_name}")
def get_prediction_by_location(location_name: str, severity: float = 1.0):
    """Retrieves model prediction parameters specifically for a requested city or district."""
    sim_req = SimulationRequest(severity_multiplier=severity, city_or_district=location_name)
    res = simulate_storm(sim_req)
    matches = res.get("simulation", [])
    if not matches:
        raise HTTPException(status_code=404, detail=f"No revenue circle or district found matching '{location_name}'")
    return {
        "query": location_name,
        "matched_count": len(matches),
        "predictions": matches
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


