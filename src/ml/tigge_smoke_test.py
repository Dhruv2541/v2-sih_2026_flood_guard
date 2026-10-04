import os
import argparse
from datetime import datetime, timedelta

def run_tigge_smoke_test():
    """
    Task 3: Historical Forecast Investigation - TIGGE Smoke Test
    This is a minimal script to verify we can successfully request TIGGE 
    Total Precipitation (tp) data for a tiny slice before scaling up.
    
    WARNING: Requires ECMWF/ECDS credentials to be configured in ~/.cdsapirc
    """
    print("Initializing TIGGE Smoke Test...")
    
    try:
        import cdsapi
    except ImportError:
        print("ERROR: cdsapi library not found. Please install it using: pip install cdsapi")
        return
        
    try:
        # Initialize client (will automatically look for ~/.cdsapirc)
        c = cdsapi.Client()
        print("✓ CDS API Client initialized successfully.")
    except Exception as e:
        print(f"ERROR initializing CDS API Client. Ensure ~/.cdsapirc is configured correctly.\nDetails: {e}")
        return

    # Assam bounding box approximately: N: 28.0, S: 24.0, W: 89.0, E: 96.0
    test_area = [28.0, 89.0, 24.0, 96.0] 
    
    # Tiny slice: 1 date, 1 run, only relevant lead times for +6h forecast
    # For a +6h forecast at 00:00 UTC, we need tp at +0h (if available, usually 0) and +6h.
    request_params = {
        'class': 'ti',
        'dataset': 'tigge',
        'date': '2024-07-01',     # 1 Date
        'expver': 'prod',
        'grid': '0.25/0.25',      # Resolution
        'levtype': 'sfc',
        'origin': 'ecmf',         # ECMWF forecast
        'param': '228',           # Total precipitation (tp)
        'step': '0/6/12',         # Steps to capture the accumulated precipitation
        'time': '00:00:00',       # 1 Forecast run
        'type': 'cf',             # Control forecast (deterministic)
        'area': test_area,
        'format': 'grib',
    }
    
    output_file = 'tigge_smoke_test_output.grib'
    
    print("\nRequesting tiny TIGGE slice from ECMWF Data Store:")
    for k, v in request_params.items():
        print(f"  {k}: {v}")
        
    print(f"\nTarget output file: {output_file}")
    print("\nSending request... (This may queue and take several minutes)")
    
    try:
        # NOTE: Actual dataset name may vary on new ECDS. Often 'tigge' is routed via MARS on ECDS.
        c.retrieve('tigge', request_params, output_file)
        print(f"\n✓ SUCCESS! TIGGE data downloaded to {output_file}")
        
        file_size = os.path.getsize(output_file)
        print(f"File size: {file_size / 1024:.2f} KB")
        
    except Exception as e:
        print(f"\n❌ ERROR during retrieval: {e}")
        print("This could be due to missing permissions, invalid dataset name on the current ECDS, or network issues.")

if __name__ == "__main__":
    run_tigge_smoke_test()
