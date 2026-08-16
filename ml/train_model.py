"""
train_model.py
---------------
End-to-end pipeline:
  1. Load raw data
  2. Clean (duplicates, missing values, outlier clipping)
  3. EDA (correlation matrix, summary stats) -> ml/artifacts/eda_report.json
  4. Feature selection (drop weakly-correlated / redundant features)
  5. Train/test split
  6. Train Linear Regression (scikit-learn)
  7. Evaluate (R2, MAE, RMSE, cross-val)
  8. Save model + scaler + metadata -> ml/artifacts/

Run:  python3 train_model.py
"""

import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler

DATA_PATH = "data/student_performance.csv"
ARTIFACT_DIR = "artifacts"
TARGET = "performance_index"

os.makedirs(ARTIFACT_DIR, exist_ok=True)


def load_and_clean(path):
    df = pd.read_csv(path)
    before = len(df)

    df = df.drop_duplicates()

    # impute missing numeric values with column median (robust to outliers)
    for col in df.columns:
        if df[col].isna().any():
            df[col] = df[col].fillna(df[col].median())

    # clip impossible values defensively
    df["attendance_pct"] = df["attendance_pct"].clip(0, 100)
    df["hours_studied"] = df["hours_studied"].clip(0, 24)
    df[TARGET] = df[TARGET].clip(0, 100)

    after = len(df)
    print(f"Cleaned data: {before} -> {after} rows "
          f"(removed {before - after} duplicates/invalid rows)")
    return df


def run_eda(df):
    corr = df.corr(numeric_only=True)[TARGET].drop(TARGET).sort_values(ascending=False)
    summary = df.describe().to_dict()

    eda_report = {
        "n_rows": len(df),
        "n_features": df.shape[1] - 1,
        "correlation_with_target": corr.round(3).to_dict(),
        "summary_stats": {k: {kk: round(vv, 2) for kk, vv in v.items()} for k, v in summary.items()},
    }
    with open(f"{ARTIFACT_DIR}/eda_report.json", "w") as f:
        json.dump(eda_report, f, indent=2)

    print("\nCorrelation with target (performance_index):")
    print(corr.round(3))
    return corr


def select_features(corr, threshold=0.05):
    # Keep features with at least a small linear relationship to the target.
    # (All engineered features clear this bar by design; threshold shown for
    # a real dataset where you'd actually drop weak predictors.)
    selected = corr[abs(corr) >= threshold].index.tolist()
    print(f"\nSelected {len(selected)} / {len(corr)} features: {selected}")
    return selected


def train_and_evaluate(df, features):
    X = df[features]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LinearRegression()
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)

    metrics = {
        "r2_score": round(r2_score(y_test, y_pred), 4),
        "mae": round(mean_absolute_error(y_test, y_pred), 3),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 3),
        "n_train": len(X_train),
        "n_test": len(X_test),
    }

    cv_scores = cross_val_score(model, scaler.transform(X), y, cv=5, scoring="r2")
    metrics["cv_r2_mean"] = round(cv_scores.mean(), 4)
    metrics["cv_r2_std"] = round(cv_scores.std(), 4)

    coefficients = dict(zip(features, model.coef_.round(3).tolist()))

    print("\n=== Model performance ===")
    for k, v in metrics.items():
        print(f"{k}: {v}")
    print("\nCoefficients (standardized):", coefficients)
    print("Intercept:", round(model.intercept_, 3))

    return model, scaler, metrics, coefficients


def main():
    df = load_and_clean(DATA_PATH)
    df.to_csv(f"{ARTIFACT_DIR}/cleaned_data.csv", index=False)

    corr = run_eda(df)
    features = select_features(corr)

    model, scaler, metrics, coefficients = train_and_evaluate(df, features)

    joblib.dump(model, f"{ARTIFACT_DIR}/model.joblib")
    joblib.dump(scaler, f"{ARTIFACT_DIR}/scaler.joblib")

    metadata = {
        "features": features,
        "target": TARGET,
        "metrics": metrics,
        "coefficients": coefficients,
        "intercept": round(float(model.intercept_), 3),
        "feature_ranges": {
            f: [float(df[f].min()), float(df[f].max())] for f in features
        },
    }
    with open(f"{ARTIFACT_DIR}/metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nSaved model, scaler, and metadata to ./{ARTIFACT_DIR}/")


if __name__ == "__main__":
    main()
