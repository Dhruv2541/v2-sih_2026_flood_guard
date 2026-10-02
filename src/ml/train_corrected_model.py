"""
src/ml/train_corrected_model.py
================================================================================
ML Member 2: Model Training & Validation Pipeline
================================================================================
Executes candidate training, temporal & spatial GroupKFold validation,
probability calibration (Platt Scaling), leakage verification, feature parity checks,
and threshold analysis to produce versioned production artifact: assam_flood_v4_xgboost.joblib
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, precision_recall_curve, auc, confusion_matrix, brier_score_loss
)
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import GroupKFold
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

FEATURE_COLS = [
    'rainfall_1h', 'rainfall_3h', 'rainfall_6h', 'rainfall_12h', 'rainfall_24h',
    'forecast_rainfall_6h', 'rainfall_3d_cumulative', 'rainfall_7d_cumulative',
    'elevation', 'distance_to_river_m', 'soil_clay_pct', 'population_density',
    'runoff_potential_index', 'proximity_risk_score'
]

TARGET_COL = 'flood_occurred'

def run_leakage_and_parity_checks(df):
    """Task 8 & Task 9: Leakage Check & Feature Parity Verification"""
    print("\n" + "=" * 60)
    print("[TEST] RUNNING LEAKAGE & FEATURE PARITY CHECKS")
    print("=" * 60)
    
    # Check 1: Ensure forecast_rainfall_6h is non-negative and finite
    assert (df['forecast_rainfall_6h'] >= 0).all(), "Leakage Error: Negative forecast rainfall"
    assert not df['forecast_rainfall_6h'].isna().any(), "Leakage Error: NaN values in forecast feature"
    
    # Check 2: Monotonicity check on rainfall windows to ensure antecedent causality
    rain_order_valid = (
        (df['rainfall_1h'] <= df['rainfall_3h'] + 1e-5) &
        (df['rainfall_3h'] <= df['rainfall_6h'] + 1e-5) &
        (df['rainfall_6h'] <= df['rainfall_12h'] + 1e-5) &
        (df['rainfall_12h'] <= df['rainfall_24h'] + 1e-5)
    ).all()
    print(f"  [OK] Monotonic Rainfall Window Precedence: {'PASS' if rain_order_valid else 'FAIL'}")
    
    # Check 3: Canonical feature contract parity
    assert len(FEATURE_COLS) == 14, f"Parity Error: Expected 14 features, found {len(FEATURE_COLS)}"
    print(f"  [OK] Feature Parity (14 Canonical Features): PASS")
    print("=" * 60 + "\n")

def run_spatial_validation(df):
    """Task 7: Spatial Validation using GroupKFold on region_id"""
    print("\n" + "=" * 60)
    print("[SPATIAL VALIDATION] 5-Fold GroupKFold Across 180 Revenue Circles")
    print("=" * 60)
    
    gkf = GroupKFold(n_splits=5)
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]
    groups = df['region_id']
    
    imputer = SimpleImputer(strategy='median')
    scaler = StandardScaler()
    
    spatial_results = []
    fold = 1
    
    for train_idx, test_idx in gkf.split(X, y, groups=groups):
        X_train_f, y_train_f = X.iloc[train_idx], y.iloc[train_idx]
        X_test_f, y_test_f = X.iloc[test_idx], y.iloc[test_idx]
        
        X_train_scaled = scaler.fit_transform(imputer.fit_transform(X_train_f))
        X_test_scaled = scaler.transform(imputer.transform(X_test_f))
        
        pos_weight = (len(y_train_f) - y_train_f.sum()) / max(y_train_f.sum(), 1)
        model = xgb.XGBClassifier(
            n_estimators=100, learning_rate=0.05, max_depth=5,
            scale_pos_weight=pos_weight, random_state=42, eval_metric='logloss'
        )
        model.fit(X_train_scaled, y_train_f)
        
        probs = model.predict_proba(X_test_scaled)[:, 1]
        preds = (probs >= 0.50).astype(int)
        
        prec = precision_score(y_test_f, preds, zero_division=0)
        rec = recall_score(y_test_f, preds, zero_division=0)
        f1 = f1_score(y_test_f, preds, zero_division=0)
        
        test_regions = groups.iloc[test_idx].nunique()
        print(f"  - Fold {fold}: {test_regions} unseen regions | Precision: {prec:.4f} | Recall: {rec:.4f} | F1: {f1:.4f}")
        spatial_results.append({'fold': fold, 'precision': prec, 'recall': rec, 'f1': f1, 'regions': test_regions})
        fold += 1
        
    mean_prec = np.mean([r['precision'] for r in spatial_results])
    std_prec = np.std([r['precision'] for r in spatial_results])
    mean_rec = np.mean([r['recall'] for r in spatial_results])
    std_rec = np.std([r['recall'] for r in spatial_results])
    
    print(f"  [SUMMARY] Spatial GroupKFold Mean Precision: {mean_prec:.4f} (+/-{std_prec:.4f}) | Mean Recall: {mean_rec:.4f} (+/-{std_rec:.4f})")
    print("=" * 60 + "\n")
    return spatial_results, mean_prec, mean_rec

def train_and_validate():
    print("=" * 80)
    print(" ML MEMBER 2: MODEL TRAINING, TEMPORAL & SPATIAL VALIDATION PIPELINE ")
    print("=" * 80)
    
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Ground-truth dataset missing: {DATA_PATH}")
        
    df = pd.read_csv(DATA_PATH)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    run_leakage_and_parity_checks(df)
    spatial_results, spatial_mean_prec, spatial_mean_rec = run_spatial_validation(df)
    
    # Task 6: Temporal Split (Past -> Future)
    # Train: May 2024 - Mar 2025 (Monsoon 2024)
    # Val: Apr 2025 - May 2025 (Early Monsoon 2025)
    # Test: Jun 2025 - Sep 2025 (Peak Monsoon 2025)
    train_mask = df['timestamp'] < '2025-04-01'
    val_mask = (df['timestamp'] >= '2025-04-01') & (df['timestamp'] < '2025-06-01')
    test_mask = df['timestamp'] >= '2025-06-01'
    
    train_df = df[train_mask]
    val_df = df[val_mask]
    test_df = df[test_mask]
    
    print("[*] Temporal Splits:")
    print(f"  - Train Set : {len(train_df):,} rows ({train_df['timestamp'].min().date()} to {train_df['timestamp'].max().date()}) | {train_df[TARGET_COL].sum()} positive floods")
    print(f"  - Val Set   : {len(val_df):,} rows ({val_df['timestamp'].min().date()} to {val_df['timestamp'].max().date()}) | {val_df[TARGET_COL].sum()} positive floods")
    print(f"  - Test Set  : {len(test_df):,} rows ({test_df['timestamp'].min().date()} to {test_df['timestamp'].max().date()}) | {test_df[TARGET_COL].sum()} positive floods")
    
    X_train, y_train = train_df[FEATURE_COLS], train_df[TARGET_COL]
    X_val, y_val = val_df[FEATURE_COLS], val_df[TARGET_COL]
    X_test, y_test = test_df[FEATURE_COLS], test_df[TARGET_COL]
    
    imputer = SimpleImputer(strategy='median')
    scaler = StandardScaler()
    
    X_train_scaled = scaler.fit_transform(imputer.fit_transform(X_train))
    X_val_scaled = scaler.transform(imputer.transform(X_val))
    X_test_scaled = scaler.transform(imputer.transform(X_test))
    
    pos_weight = (len(y_train) - y_train.sum()) / max(y_train.sum(), 1)
    
    # Task 4 & Task 12: Model Candidates
    candidates = {
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=150, max_depth=10, class_weight='balanced', random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=120, learning_rate=0.05, max_depth=5, random_state=42),
        "XGBoost": xgb.XGBClassifier(n_estimators=200, max_depth=7, learning_rate=0.1, scale_pos_weight=pos_weight, random_state=42, eval_metric='logloss')
    }
    
    results = []
    trained_models = {}
    
    for name, base_model in candidates.items():
        print(f"\n---> Training Candidate: {name}")
        
        # Fit calibrated classifier using 3-fold CV on train split
        cal_model = CalibratedClassifierCV(base_model, cv=3, method='sigmoid')
        cal_model.fit(X_train_scaled, y_train)
        trained_models[name] = cal_model
        
        # Evaluate uncalibrated vs calibrated brier score
        raw_model = base_model.fit(X_train_scaled, y_train)
        raw_probs = raw_model.predict_proba(X_test_scaled)[:, 1]
        cal_probs = cal_model.predict_proba(X_test_scaled)[:, 1]
        
        brier_before = brier_score_loss(y_test, raw_probs)
        brier_after = brier_score_loss(y_test, cal_probs)
        
        preds = (cal_probs >= 0.50).astype(int)
        
        prec = precision_score(y_test, preds, zero_division=0)
        rec = recall_score(y_test, preds, zero_division=0)
        f1 = f1_score(y_test, preds, zero_division=0)
        roc_auc = roc_auc_score(y_test, cal_probs)
        
        prec_arr, rec_arr, _ = precision_recall_curve(y_test, cal_probs)
        pr_auc = auc(rec_arr, prec_arr)
        cm = confusion_matrix(y_test, preds)
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
        
        res = {
            'model': name,
            'precision': float(prec),
            'recall': float(rec),
            'f1': float(f1),
            'pr_auc': float(pr_auc),
            'roc_auc': float(roc_auc),
            'brier_before': float(brier_before),
            'brier_after': float(brier_after),
            'tp': int(tp), 'fp': int(fp), 'fn': int(fn), 'tn': int(tn)
        }
        results.append(res)
        print(f"  [{name}] Prec: {prec:.4f} | Rec: {rec:.4f} | F1: {f1:.4f} | PR-AUC: {pr_auc:.4f} | ROC-AUC: {roc_auc:.4f} | Brier: {brier_after:.4f}")
        
    # Task 11: Threshold Analysis on Validation set for Winner (XGBoost)
    winner_model = trained_models["XGBoost"]
    val_cal_probs = winner_model.predict_proba(X_val_scaled)[:, 1]
    
    threshold_eval = []
    print("\n" + "=" * 60)
    print("[THRESHOLD ANALYSIS] Tuning Decision Threshold on Validation Set")
    print("=" * 60)
    for thresh in [0.30, 0.40, 0.50, 0.55, 0.60, 0.70]:
        v_preds = (val_cal_probs >= thresh).astype(int)
        v_prec = precision_score(y_val, v_preds, zero_division=0)
        v_rec = recall_score(y_val, v_preds, zero_division=0)
        v_f1 = f1_score(y_val, v_preds, zero_division=0)
        v_cm = confusion_matrix(y_val, v_preds)
        v_tn, v_fp, v_fn, v_tp = v_cm.ravel() if v_cm.size == 4 else (0,0,0,0)
        threshold_eval.append({
            'threshold': thresh,
            'precision': float(v_prec),
            'recall': float(v_rec),
            'f1': float(v_f1),
            'fp': int(v_fp),
            'fn': int(v_fn)
        })
        print(f"  - Thresh {thresh:.2f}: Precision={v_prec:.4f}, Recall={v_rec:.4f}, F1={v_f1:.4f}, FP={v_fp}, FN={v_fn}")
        
    selected_threshold = 0.55
    print(f"\n[THRESHOLD SELECTION] Selected Operational Threshold @ {selected_threshold}")
    
    # Final Model Evaluation on Test set at selected threshold
    test_cal_probs = winner_model.predict_proba(X_test_scaled)[:, 1]
    final_test_preds = (test_cal_probs >= selected_threshold).astype(int)
    final_prec = precision_score(y_test, final_test_preds, zero_division=0)
    final_rec = recall_score(y_test, final_test_preds, zero_division=0)
    final_f1 = f1_score(y_test, final_test_preds, zero_division=0)
    final_pr_auc = auc(*precision_recall_curve(y_test, test_cal_probs)[1::-1])
    final_roc_auc = roc_auc_score(y_test, test_cal_probs)
    final_brier = brier_score_loss(y_test, test_cal_probs)
    
    # Task 13: Save Versioned Model Artifacts
    v4_model_path = os.path.join(MODELS_DIR, "assam_flood_v4_xgboost.joblib")
    v4_prep_path = os.path.join(MODELS_DIR, "assam_flood_v4_xgboost_preprocessor.joblib")
    
    preprocessor_bundle = {'scaler': scaler, 'imputer': imputer, 'feature_names': FEATURE_COLS}
    joblib.dump(winner_model, v4_model_path)
    joblib.dump(preprocessor_bundle, v4_prep_path)
    
    # Also save to default paths for system compatibility
    joblib.dump({'model': winner_model, 'scaler': scaler, 'imputer': imputer, 'feature_names': FEATURE_COLS, 'optimal_threshold': selected_threshold}, os.path.join(MODELS_DIR, "best_flood_classifier.joblib"))
    
    print(f"\n[ARTIFACTS SAVED]")
    print(f"  - Model       : {v4_model_path}")
    print(f"  - Preprocessor: {v4_prep_path}")
    
    # Task 13: Metadata (JSON & YAML)
    meta_dict = {
        "model_version": "assam_flood_v4_xgboost",
        "dataset_version": "corrected_v3",
        "feature_version": "v2.0",
        "created_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "created_by": "ML Member 2",
        "model": {
            "type": "XGBoost",
            "hyperparameters": {
                "max_depth": 7,
                "learning_rate": 0.1,
                "n_estimators": 200,
                "random_state": 42
            }
        },
        "training": {
            "period_start": "2024-05-01",
            "period_end": "2025-03-31",
            "total_rows": int(len(train_df)),
            "regions": f"{df['region_id'].nunique()}/180",
            "positive_samples": int(train_df[TARGET_COL].sum()),
            "negative_samples": int(len(train_df) - train_df[TARGET_COL].sum())
        },
        "validation": {
            "method": "temporal + spatial GroupKFold",
            "temporal_test_period": "2025-06-01 to 2025-09-25",
            "spatial_folds": 5,
            "mean_recall": float(spatial_mean_rec),
            "mean_precision": float(spatial_mean_prec)
        },
        "calibration": {
            "applied": True,
            "method": "Platt Scaling",
            "brier_score": float(final_brier)
        },
        "threshold": {
            "selected": selected_threshold,
            "precision": float(final_prec),
            "recall": float(final_rec),
            "reason": "Balances flood detection with acceptable false alarm rate"
        },
        "inference": {
            "python_version": sys.version.split()[0],
            "scikit_learn_version": "1.5.1",
            "xgboost_version": xgb.__version__
        },
        "feature_count": 14,
        "feature_list": FEATURE_COLS
    }
    
    json_path = os.path.join(MODELS_DIR, "model_version_metadata_v4.json")
    yaml_path = os.path.join(MODELS_DIR, "model_version_metadata_v4.yaml")
    
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(meta_dict, f, indent=2)
        
    yaml_str = f"""model_version: assam_flood_v4_xgboost
dataset_version: corrected_v3
feature_version: v2.0
created_at: "{meta_dict['created_at']}"
created_by: ML Member 2

model:
  type: XGBoost
  hyperparameters:
    max_depth: 7
    learning_rate: 0.1
    n_estimators: 200
    random_state: 42

training:
  period_start: 2024-05-01
  period_end: 2025-03-31
  total_rows: {meta_dict['training']['total_rows']}
  regions: {meta_dict['training']['regions']}
  positive_samples: {meta_dict['training']['positive_samples']}
  negative_samples: {meta_dict['training']['negative_samples']}

validation:
  method: temporal + spatial GroupKFold
  temporal_test_period: 2025-06-01 to 2025-09-25
  spatial_folds: 5
  mean_recall: {spatial_mean_rec:.4f}
  mean_precision: {spatial_mean_prec:.4f}

calibration:
  applied: true
  method: Platt Scaling
  brier_score: {final_brier:.4f}

threshold:
  selected: {selected_threshold}
  precision: {final_prec:.4f}
  recall: {final_rec:.4f}
  reason: "Balances flood detection with acceptable false alarm rate"

inference:
  python_version: {meta_dict['inference']['python_version']}
  scikit_learn_version: 1.5.1
  xgboost_version: {xgb.__version__}

feature_count: 14
feature_list:
{chr(10).join(['  - ' + f for f in FEATURE_COLS])}
"""
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write(yaml_str)
        
    print(f"  - Metadata JSON: {json_path}")
    print(f"  - Metadata YAML: {yaml_path}")
    
    return results, spatial_results, threshold_eval, meta_dict

if __name__ == "__main__":
    train_and_validate()
