"""
FastAPI backend for the Student Performance Predictor.

Endpoints:
  GET  /api/health        - liveness check
  GET  /api/model-info     - metrics, coefficients, feature ranges (drives frontend charts)
  GET  /api/eda            - correlation + summary stats (drives frontend EDA charts)
  POST /api/predict        - run a live prediction through the trained Linear Regression model
"""

import json
import os
from typing import Dict
import pandas as pd

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, create_model

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACT_DIR = os.path.join(BASE_DIR, "artifacts")

app = FastAPI(
    title="Student Performance Predictor API",
    description="Serves a scikit-learn Linear Regression model trained on student academic data.",
    version="1.0.0",
)

# CORS: allow the deployed frontend (and local dev) to call this API.
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Load model artifacts at startup -----------------------------------
model = joblib.load(os.path.join(ARTIFACT_DIR, "model.joblib"))
scaler = joblib.load(os.path.join(ARTIFACT_DIR, "scaler.joblib"))
with open(os.path.join(ARTIFACT_DIR, "metadata.json")) as f:
    metadata = json.load(f)
with open(os.path.join(ARTIFACT_DIR, "eda_report.json")) as f:
    eda_report = json.load(f)

FEATURES = metadata["features"]


# ---- Dynamically build the request schema from the trained features ----
field_defs = {f: (float, Field(..., description=f)) for f in FEATURES}
PredictRequest = create_model("PredictRequest", **field_defs)


class PredictResponse(BaseModel):
    predicted_score: float
    grade: str
    contribution_breakdown: Dict[str, float]


def score_to_grade(score: float) -> str:
    if score >= 90:
        return "A+"
    if score >= 80:
        return "A"
    if score >= 70:
        return "B"
    if score >= 60:
        return "C"
    if score >= 50:
        return "D"
    return "F"


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/model-info")
def model_info():
    return {
        "features": FEATURES,
        "metrics": metadata["metrics"],
        "coefficients": metadata["coefficients"],
        "intercept": metadata["intercept"],
        "feature_ranges": metadata["feature_ranges"],
    }


@app.get("/api/eda")
def eda():
    return eda_report


@app.post("/api/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    values = payload.dict()

    # basic range validation against training data bounds
    for f in FEATURES:
        lo, hi = metadata["feature_ranges"][f]
        margin = (hi - lo) * 0.2 or 1
        if not (lo - margin <= values[f] <= hi + margin):
            raise HTTPException(
                status_code=422,
                detail=f"'{f}' value {values[f]} is far outside the training "
                       f"range [{lo}, {hi}]. Prediction would be unreliable.",
            )

    x = pd.DataFrame([[values[f] for f in FEATURES]], columns=FEATURES)
    x_scaled = scaler.transform(x)
    pred = float(model.predict(x_scaled)[0])
    pred = round(max(0.0, min(100.0, pred)), 1)

    # per-feature contribution = standardized_value * coefficient
    contributions = {}
    for f, sv in zip(FEATURES, x_scaled[0]):
        contributions[f] = round(float(sv) * metadata["coefficients"][f], 2)

    return PredictResponse(
        predicted_score=pred,
        grade=score_to_grade(pred),
        contribution_breakdown=contributions,
    )
