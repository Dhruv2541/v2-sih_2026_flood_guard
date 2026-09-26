import pandas as pd
import json
import os

def map_flood_reports_to_regions(flood_reports_df, circles_json_path):
    """
    Task 4 & 5: Map Real Floods to Revenue Circles and align time.
    Ingests a dataframe of real historical flood evidence (e.g. ASDMA reports)
    and strictly maps them to `region_id`.
    """
    with open(circles_json_path, 'r') as f:
        circles = json.load(f)
        
    # Create a mapping dictionary: District -> List of Revenue Circles
    district_to_circles = {}
    for c in circles:
        dist = c.get('district', '').upper()
        if dist not in district_to_circles:
            district_to_circles[dist] = []
        district_to_circles[dist].append(c)
        
    mapped_events = []
    
    for idx, row in flood_reports_df.iterrows():
        reported_dist = str(row.get('district', '')).upper()
        reported_date = row.get('date', None)
        reported_circle = str(row.get('revenue_circle', '')).upper()
        
        # If the report is missing critical proof, mark unresolved
        if pd.isna(reported_date) or reported_dist == '':
            continue
            
        matched_region_id = "unresolved"
        
        # Strict mapping logic
        if reported_dist in district_to_circles:
            possible_circles = district_to_circles[reported_dist]
            for c in possible_circles:
                if c['name'].upper() == reported_circle:
                    matched_region_id = c['object_id']
                    break
        
        if matched_region_id != "unresolved":
            mapped_events.append({
                "region_id": matched_region_id,
                "timestamp": f"{reported_date}T00:00:00",
                "flood_occurred": 1
            })
            
    return pd.DataFrame(mapped_events)

if __name__ == "__main__":
    # Example usage showing how the pipeline WILL work once ASDMA CSV is provided:
    # dummy_reports = pd.read_csv("backend/data/raw_asdam_reports.csv")
    print("Flood Report Mapper ready to ingest ASDMA ground-truth data.")
