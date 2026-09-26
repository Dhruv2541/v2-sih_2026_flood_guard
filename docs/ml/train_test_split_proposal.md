# Train/Validation/Test Split Proposal

Because flood data is highly time-dependent, traditional random splitting (like Scikit-Learn's `train_test_split` with `shuffle=True`) will cause massive **data leakage**. If the model sees weather patterns from 2026 during training, it will artificially score perfectly when asked to predict 2025.

## Proposal: Chronological Split
We propose a strict chronological split based on the date of the record.

- **Training Set (70%):** Data from 2015-01-01 to 2022-12-31. The model uses this vast history of monsoons to learn fundamental terrain and weather interaction patterns.
- **Validation Set (15%):** Data from 2023-01-01 to 2024-06-30. Used by ML Member 2 to tune hyperparameters (like Random Forest depth) and establish probability calibration thresholds.
- **Test Set (15%):** Data from 2024-07-01 to Present. Used **only once** at the very end to generate the final evaluation metrics (Precision, Recall, F1) for the SIH judges. The model has never seen this data during training or tuning.

## Handling Class Imbalance
Since flood days (`flood_occurred=1`) are extremely rare compared to dry days (`0`), the chronological split will maintain this natural imbalance. ML Member 2 is instructed to use `class_weight='balanced'` in Scikit-Learn or SMOTE on the *Training Set only* to adjust the penalization during training, rather than artificially injecting fake positive labels into the dataset.
