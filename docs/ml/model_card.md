# Model Card: Assam Flood Prediction Model (v2-ground-truth)

## Model Details

- **Model Identifier:** `assam-flood-v2-ground-truth`
- **Model Architecture:** Calibrated Gradient Boosting Classifier (`CalibratedClassifierCV` with Sigmoid / Platt Scaling)
- **Primary Task:** Binary Flood Occurrence & Continuous Probability Estimation for Assam Revenue Circles
- **Trained By:** ML Member 2 (Model & Training Engineer)
- **Training Artifact:** `models/best_flood_classifier.joblib` / `backend/models/model_final_dataset.pkl`

---

## Intended Use & Target Users

- **Primary Application:** Decision Support & Flood Early Warning System for Assam State Disaster Management Authority (ASDMA) and district officials.
- **Output:** Continuous probability $P(\text{Flood}) \in [0.0, 1.0]$, binary flood prediction (Threshold: `0.28`), risk severity categorization (`CRITICAL`, `HIGH`, `MODERATE`, `SAFE/LOW`), and interpretable risk factor breakdowns.

---

## Evaluation & Performance Metrics (Test Set Evaluation)

| Metric | Champion Model (Gradient Boosting Calibrated) | Baseline Random Forest | Baseline XGBoost |
| :--- | :--- | :--- | :--- |
| **Precision** | **0.3158** | 0.1713 | 0.2293 |
| **Recall** | **0.6818** | 0.7045 | 0.8182 |
| **F1 Score** | **0.4317** | 0.2756 | 0.3582 |
| **ROC-AUC** | **0.9935** | 0.9895 | 0.9947 |
| **PR-AUC** | **0.5305** | 0.2905 | 0.4154 |
| **Brier Score (Calibration)** | **0.0016** | 0.0021 | 0.0017 |
| **Optimal Threshold** | **0.28** | 0.20 | 0.20 |

---

## Probability Calibration Audit

- **Method:** Platt Scaling via Sigmoid `CalibratedClassifierCV`.
- **Brier Score:** Achieved **0.0016** (indicating excellent probability calibration across low and high risk spectrums).
- **Interpretation:** Output probabilities closely approximate true empirical frequency (e.g., a prediction of `0.80` corresponds to ~80% historical flood frequency under similar antecedent conditions).

---

## Risk Explanations & Interpretable Outputs

The model exposes per-instance factor contributions to the live backend:
1. **Extreme 24h Downpour:** Spikes in 24h rain accumulation (+35%).
2. **Soil Saturation:** High 3-day antecedent rainfall (+25%).
3. **River Proximity Danger:** Distance < 1500m to major river channels (+20%).
4. **Low-Lying Elevation Terrain:** Elevation < 45m (+12%).
