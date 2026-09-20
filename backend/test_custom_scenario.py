"""
Interactive Tester for Assam Heavy Rainfall & Flood Prediction AI Models (SIH26071)

Allows testing any custom rainfall amount, storm severity multiplier, live weather feed,
or specific Revenue Circle in Assam.
"""

import sys
import os
import json
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from main import simulate_storm, SimulationRequest

def test_scenario(rainfall_mm: float = 120.0, multiplier: float = 2.0, use_live: bool = False, circle_name: str = None):
    print("=" * 75)
    print(f" TESTING AI MODEL WITH CUSTOM SCENARIO:")
    print(f"   - Input Rainfall: {rainfall_mm} mm")
    print(f"   - Severity Multiplier: {multiplier}x")
    print(f"   - Live Weather Mode: {use_live}")
    if circle_name:
        print(f"   - Filter Revenue Circle: '{circle_name}'")
    print("=" * 75)

    req = SimulationRequest(
        severity_multiplier=multiplier,
        use_live_weather=use_live,
        custom_rainfall_mm=rainfall_mm
    )
    
    res = simulate_storm(req)
    results = res["simulation"]
    
    if circle_name:
        results = [r for r in results if circle_name.lower() in r["name"].lower() or circle_name.lower() in r["district"].lower()]
        if not results:
            print(f"No circle matching '{circle_name}' found.")
            return

    df = pd.DataFrame(results)
    
    print(f"\n=========================================================================================")
    print(f" AI MODEL FLOOD PREDICTION RESULTS FOR ALL {len(results)} REVENUE CIRCLES IN ASSAM")
    print(f"=========================================================================================")
    print(f"{'Revenue Circle':<25} | {'District':<18} | {'Rain (mm)':<9} | {'Risk Level':<12} | {'Inundation %':<12} | {'At-Risk Pop':<12}")
    print("-" * 97)
    for idx, r in df.iterrows():
        pop_risk = r['impact']['population_at_risk']
        print(f"{r['name']:<25} | {r['district']:<18} | {r['sim_rain_mm']:>9.1f} | {r['risk_label']:<12} | {r['inundation_pct']:>11.1f}% | {pop_risk:>12,}")
    print("=" * 97)

if __name__ == "__main__":
    # Test ALL 180 Revenue Circles across Assam with 150mm heavy rain
    print("Test Run 1: 150mm Extreme Rainfall across ALL 180 Revenue Circles of Assam")
    test_scenario(rainfall_mm=150.0, multiplier=1.5, circle_name=None)
