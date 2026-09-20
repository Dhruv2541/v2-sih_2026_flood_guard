import os
import sys
import pickle
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.calibration import CalibratedClassifierCV
import xgboost as xgb

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR = os.path.join(BASE_DIR, "models")
ROOT_MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), "models")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(ROOT_MODELS_DIR, exist_ok=True)

def train_and_evaluate_dataset(csv_filename, dataset_label, feature_cols, target_col='flood_occurred'):
    file_path = os.path.join(PROCESSED_DIR, csv_filename)
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset not found: {file_path}")
        
    print("\n" + "=" * 80)
    print(f" TRAINING MODEL ON DATASET: {dataset_label} ({csv_filename})")
    print("=" * 80)
    
    df = pd.read_csv(file_path)
    print(f"[*] Loaded {len(df)} rows and {len(df.columns)} columns.")
    
    # Filter features present in dataframe
    available_features = [col for col in feature_cols if col in df.columns]
    print(f"[*] Selected {len(available_features)} feature columns: {available_features}")
    
    X = df[available_features]
    y = df[target_col]
    
    counts = y.value_counts().to_dict()
    print(f"[*] Class distribution in target '{target_col}': {counts}")
    
    min_class_count = min(counts.values()) if len(counts) > 1 else 0
    pos_count = counts.get(1, 0)
    neg_count = counts.get(0, 0)
    pos_weight = neg_count / max(pos_count, 1)
    
    # Determine if stratification & CV calibration can be used
    use_stratify = (min_class_count >= 2) and (len(df) >= 200)
    
    if use_stratify:
        X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)
        X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp)
    else:
        # Non-stratified split, ensuring positive instances are in train if count is small
        if pos_count > 0 and pos_count < 5:
            pos_indices = df[df[target_col] == 1].index
            neg_indices = df[df[target_col] == 0].index
            
            # Put positive indices in train set
            train_idx = list(pos_indices) + list(neg_indices[:int(len(neg_indices)*0.7)])
            test_idx = list(neg_indices[int(len(neg_indices)*0.7):])
            
            X_train, y_train = X.loc[train_idx], y.loc[train_idx]
            X_val, y_val = X.loc[test_idx], y.loc[test_idx]
            X_test, y_test = X.loc[test_idx], y.loc[test_idx]
        else:
            X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, random_state=42)
            X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42)
            
    # Imputation & Scaling
    imputer = SimpleImputer(strategy='median')
    scaler = StandardScaler()
    
    X_train_imp = imputer.fit_transform(X_train)
    X_train_scaled = scaler.fit_transform(X_train_imp)
    
    X_val_imp = imputer.transform(X_val)
    X_val_scaled = scaler.transform(X_val_imp)
    
    X_test_imp = imputer.transform(X_test)
    X_test_scaled = scaler.transform(X_test_imp)
    
    # Base Models
    rf_model = RandomForestClassifier(n_estimators=150, max_depth=12, class_weight='balanced', random_state=42, n_jobs=-1)
    xgb_model = xgb.XGBClassifier(n_estimators=150, learning_rate=0.05, max_depth=6, scale_pos_weight=pos_weight, random_state=42, eval_metric='logloss')
    
    # Calibrated Classifier
    if pos_count >= 5:
        cv_folds = min(3, pos_count)
        cal_rf = CalibratedClassifierCV(rf_model, cv=cv_folds, method='sigmoid')
        cal_xgb = CalibratedClassifierCV(xgb_model, cv=cv_folds, method='sigmoid')
    else:
        cal_rf = rf_model
        cal_xgb = xgb_model
        
    models = {
        "RandomForest": cal_rf,
        "XGBoost": cal_xgb
    }
    
    best_f1 = -1.0
    best_model_name = None
    best_model_obj = None
    best_threshold = 0.5
    best_metrics = {}
    
    for name, model in models.items():
        print(f"\n---> Fitting {name}...")
        model.fit(X_train_scaled, y_train)
        
        # Threshold tuning on validation set
        if hasattr(model, "predict_proba"):
            val_probs = model.predict_proba(X_val_scaled)[:, 1]
        else:
            val_probs = model.predict(X_val_scaled)
            
        opt_thresh = 0.5
        opt_f1 = 0.0
        for thresh in np.arange(0.20, 0.85, 0.02):
            val_preds = (val_probs >= thresh).astype(int)
            f1 = f1_score(y_val, val_preds, zero_division=0)
            if f1 > opt_f1:
                opt_f1 = f1
                opt_thresh = thresh
                
        # Evaluate on Test Set using optimal threshold
        if hasattr(model, "predict_proba"):
            test_probs = model.predict_proba(X_test_scaled)[:, 1]
        else:
            test_probs = model.predict(X_test_scaled)
            
        test_preds = (test_probs >= opt_thresh).astype(int)
        
        acc = accuracy_score(y_test, test_preds)
        prec = precision_score(y_test, test_preds, zero_division=0)
        rec = recall_score(y_test, test_preds, zero_division=0)
        f1 = f1_score(y_test, test_preds, zero_division=0)
        try:
            auc = roc_auc_score(y_test, test_probs) if len(np.unique(y_test)) > 1 else 0.5
        except Exception:
            auc = 0.5
            
        print(f"[{name}] Test Accuracy: {acc:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | F1-Score: {f1:.4f} | ROC-AUC: {auc:.4f} | Thresh: {opt_thresh:.2f}")
        
        if f1 > best_f1 or (f1 == best_f1 and acc >= best_metrics.get('accuracy', 0)):
            best_f1 = f1
            best_model_name = name
            best_model_obj = model
            best_threshold = opt_thresh
            best_metrics = {
                'accuracy': acc,
                'precision': prec,
                'recall': rec,
                'f1_score': f1,
                'roc_auc': auc,
                'optimal_threshold': opt_thresh
            }
            
    print(f"\n[WINNER] Best model for {dataset_label}: {best_model_name} (F1: {best_f1:.4f}, Accuracy: {best_metrics['accuracy']:.4f})")
    
    # Artifact bundle
    artifact = {
        'model': best_model_obj,
        'model_name': best_model_name,
        'dataset_label': dataset_label,
        'csv_filename': csv_filename,
        'scaler': scaler,
        'imputer': imputer,
        'feature_names': available_features,
        'optimal_threshold': float(best_threshold),
        'metrics': best_metrics
    }
    
    return artifact

def run():
    print("=" * 80)
    print(" SIH26071 FLOOD RISK MODEL TRAINING ON BOTH PROCESSED DATASETS ")
    print("=" * 80)
    
    # 1. Dataset 1: assam_flood_ml_ready.csv (Basic Dataset)
    basic_features = [
        'rainfall_24h', 'elevation', 'distance_to_river_m', 'soil_clay_pct', 'population_density'
    ]
    basic_artifact = train_and_evaluate_dataset(
        csv_filename="assam_flood_ml_ready.csv",
        dataset_label="Basic Dataset (155 rows)",
        feature_cols=basic_features
    )
    
    # Save Basic Model Artifact
    basic_save_path = os.path.join(MODELS_DIR, "model_basic_dataset.pkl")
    with open(basic_save_path, "wb") as f:
        pickle.dump(basic_artifact, f)
    print(f"[OK] Saved Basic Dataset Model artifact to: {basic_save_path}")
    
    # 2. Dataset 2: assam_flood_ml_ready_FINAL.csv (Advanced Dataset)
    final_features = [
        'rainfall_24h', 'forecast_rainfall_6h', 'rainfall_3d_cumulative', 'rainfall_7d_cumulative',
        'elevation', 'distance_to_river_m', 'soil_clay_pct', 'population_density',
        'runoff_potential_index', 'proximity_risk_score'
    ]
    final_artifact = train_and_evaluate_dataset(
        csv_filename="assam_flood_ml_ready_FINAL.csv",
        dataset_label="FINAL Dataset (3662 rows)",
        feature_cols=final_features
    )
    
    # Save FINAL Model Artifact
    final_save_path = os.path.join(MODELS_DIR, "model_final_dataset.pkl")
    with open(final_save_path, "wb") as f:
        pickle.dump(final_artifact, f)
    print(f"[OK] Saved FINAL Dataset Model artifact to: {final_save_path}")
    
    # Also save as backend/models/flood_binary_clf.pkl and models/best_flood_classifier.joblib for system compatibility
    clf_pkl_path = os.path.join(MODELS_DIR, "flood_binary_clf.pkl")
    with open(clf_pkl_path, "wb") as f:
        pickle.dump(final_artifact['model'], f)
    print(f"[OK] Updated primary binary classifier in: {clf_pkl_path}")
    
    joblib_path = os.path.join(ROOT_MODELS_DIR, "best_flood_classifier.joblib")
    joblib.dump(final_artifact, joblib_path)
    print(f"[OK] Saved joblib model bundle to: {joblib_path}")
    
    print("\n" + "=" * 80)
    print(" MODEL TRAINING SUMMARY FOR BOTH DATASETS ")
    print("=" * 80)
    print(f"1. Basic Dataset (assam_flood_ml_ready.csv):")
    print(f"   - Model: {basic_artifact['model_name']}")
    print(f"   - Accuracy: {basic_artifact['metrics']['accuracy']:.2%}")
    print(f"   - Precision: {basic_artifact['metrics']['precision']:.4f}")
    print(f"   - Recall: {basic_artifact['metrics']['recall']:.4f}")
    print(f"   - F1-Score: {basic_artifact['metrics']['f1_score']:.4f}")
    
    print(f"\n2. FINAL Dataset (assam_flood_ml_ready_FINAL.csv):")
    print(f"   - Model: {final_artifact['model_name']}")
    print(f"   - Accuracy: {final_artifact['metrics']['accuracy']:.2%}")
    print(f"   - Precision: {final_artifact['metrics']['precision']:.4f}")
    print(f"   - Recall: {final_artifact['metrics']['recall']:.4f}")
    print(f"   - F1-Score: {final_artifact['metrics']['f1_score']:.4f}")
    print(f"   - Optimal Decision Threshold: {final_artifact['optimal_threshold']:.2f}")

if __name__ == "__main__":
    run()
