"""
models.py
----------
Three tables:
  User        - one row per account
  Course      - a user can track multiple subjects/courses, each with its
                own prediction history
  Prediction  - a saved prediction, tied to a user and a course, storing
                the inputs and the result so history can be shown later
"""

import datetime
import json

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    courses = relationship("Course", back_populates="owner", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="courses")
    predictions = relationship(
        "Prediction", back_populates="course", cascade="all, delete-orphan"
    )


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    values_json = Column(Text, nullable=False)  # the input feature values, as JSON
    predicted_score = Column(Float, nullable=False)
    grade = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="predictions")

    def as_dict(self):
        return {
            "id": self.id,
            "course_id": self.course_id,
            "values": json.loads(self.values_json),
            "predicted_score": self.predicted_score,
            "grade": self.grade,
            "created_at": self.created_at.isoformat() + "Z",
        }
