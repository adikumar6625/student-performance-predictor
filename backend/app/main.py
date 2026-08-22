"""
FastAPI backend for the Student Performance Predictor.

Public endpoints:
  GET  /api/health         - liveness check
  GET  /api/model-info      - metrics, coefficients, feature ranges
  GET  /api/eda             - correlation + summary stats
  POST /api/predict         - run a prediction (works with or without an account;
                               with an account + course_id, the prediction is saved)

Auth endpoints:
  POST /api/auth/signup     - create an account
  POST /api/auth/login      - log in, get a token
  GET  /api/auth/me         - current user info (requires auth)

Course endpoints (all require auth):
  GET    /api/courses                       - list your courses
  POST   /api/courses                       - create a course
  DELETE /api/courses/{course_id}           - delete a course
  GET    /api/courses/{course_id}/predictions - prediction history for a course
"""

import json
import os
from typing import Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, create_model
from sqlalchemy.orm import Session

from .auth import (
    create_access_token,
    get_current_user,
    get_current_user_optional,
    hash_password,
    verify_password,
)
from .database import Base, engine, get_db
from .models import Course, Prediction, User
from .recommendations import build_recommendations

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACT_DIR = os.path.join(BASE_DIR, "artifacts")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Student Performance Predictor API",
    description="Serves a scikit-learn Linear Regression model trained on student academic data.",
    version="2.0.0",
)

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

# ---- Dynamically build the predict request schema from trained features
field_defs = {f: (float, Field(..., description=f)) for f in FEATURES}
field_defs["course_id"] = (Optional[int], Field(None, description="If provided (and you're logged in), saves this prediction to that course's history"))
PredictRequest = create_model("PredictRequest", **field_defs)


class RecommendationItem(BaseModel):
    feature: str
    label: str
    action: str
    potential_gain: float


class PredictResponse(BaseModel):
    predicted_score: float
    grade: str
    contribution_breakdown: Dict[str, float]
    recommendations: List[RecommendationItem]
    saved: bool


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class CourseCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


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


# ---------------------------------------------------------------- health --
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


# ------------------------------------------------------------------ auth --
@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with that email already exists")

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user={"id": user.id, "email": user.email})


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user={"id": user.id, "email": user.email})


@app.get("/api/auth/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email}


# --------------------------------------------------------------- courses --
@app.get("/api/courses")
def list_courses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    courses = db.query(Course).filter(Course.user_id == user.id).order_by(Course.created_at).all()
    return [{"id": c.id, "name": c.name, "created_at": c.created_at.isoformat() + "Z"} for c in courses]


@app.post("/api/courses")
def create_course(
    payload: CourseCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course = Course(user_id=user.id, name=payload.name)
    db.add(course)
    db.commit()
    db.refresh(course)
    return {"id": course.id, "name": course.name, "created_at": course.created_at.isoformat() + "Z"}


@app.delete("/api/courses/{course_id}")
def delete_course(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"deleted": True}


@app.get("/api/courses/{course_id}/predictions")
def course_predictions(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    preds = (
        db.query(Prediction)
        .filter(Prediction.course_id == course_id, Prediction.user_id == user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    return [p.as_dict() for p in preds]


# ----------------------------------------------------------------predict --
@app.post("/api/predict", response_model=PredictResponse)
def predict(
    payload: PredictRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    values = payload.dict()
    course_id = values.pop("course_id", None)

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
    grade = score_to_grade(pred)

    contributions = {}
    for f, sv in zip(FEATURES, x_scaled[0]):
        contributions[f] = round(float(sv) * metadata["coefficients"][f], 2)

    recommendations = build_recommendations(
        FEATURES, values, metadata["coefficients"], scaler
    )

    saved = False
    if user is not None and course_id is not None:
        course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
        if course:
            record = Prediction(
                user_id=user.id,
                course_id=course_id,
                values_json=json.dumps(values),
                predicted_score=pred,
                grade=grade,
            )
            db.add(record)
            db.commit()
            saved = True

    return PredictResponse(
        predicted_score=pred,
        grade=grade,
        contribution_breakdown=contributions,
        recommendations=recommendations,
        saved=saved,
    )
