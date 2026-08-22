"""
database.py
------------
SQLAlchemy engine/session setup. Uses a local SQLite file by default so the
whole app runs with zero external setup. Set the DATABASE_URL environment
variable to point at a real Postgres instance in production if you want
data to survive redeploys (SQLite on Render's free tier is NOT guaranteed
to persist across deploys/restarts — its disk is ephemeral there).
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SQLITE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'app.db')}"

DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_SQLITE_URL)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
