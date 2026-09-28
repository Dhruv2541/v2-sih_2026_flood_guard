# Train / Validation / Test Split Proposal

## Why Random Split (`train_test_split`) Fails on Spatiotemporal Flood Data

Performing a random row-wise split on panel data causes severe **data leakage**:
- Observations from the exact same flood event (e.g. Dhemaji during July 1–5, 2024) would appear in both training and test sets.
- The model would memorize specific dates/events, giving artificially high test metrics (~99% accuracy) while failing completely on unseen future floods.

---

## Recommended Non-Random Split Strategy

To strictly evaluate generalization to **unseen future events** and **unseen geographical regions**, we implement a **Grouped Temporal & Spatial Split**:

```
                              FULL DATASET (92,340 Rows)
                                           │
             ┌─────────────────────────────┴─────────────────────────────┐
             ▼                                                           ▼
    TRAINING & VALIDATION SET                                          TEST SET
  (May 2024 – May 2025: ~80%)                                 (June 2025 – Sept 2025: ~20%)
             │                                              (Strict Unseen Future Evaluation)
      ┌──────┴──────┐
      ▼             ▼
   TRAIN          VAL
  (~65%)         (~15%)
```

---

## Split Proportions & Boundaries

| Split Group | Purpose | Temporal Boundary | Geographical Distribution | Percentage |
| :--- | :--- | :--- | :--- | :---: |
| 🟢 **Train Set** | Teach candidate models | May 1, 2024 to March 31, 2025 | All 180 Revenue Circles | ~65% |
| 🟡 **Validation Set** | Hyperparameter tuning & probability calibration | April 1, 2025 to May 31, 2025 | Grouped Circle Splits | ~15% |
| 🔴 **Test Set** | Final un-biassed performance evaluation | June 1, 2025 to September 25, 2025 | Unseen Monsoon Wave | ~20% |

---

## Guarantee Against Data Leakage

1. **Strict Temporal Separation:** All test events occur strictly *after* training/validation dates.
2. **Grouped Region Isolation:** Spatial fold validations group entire revenue circles together during cross-validation (`GroupKFold` on `region_id`).
3. **No Target-Derived Leakage:** Preprocessing scalers and imputers are fit **only** on the training set and applied to validation/test sets without target leakage.
