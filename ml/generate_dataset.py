"""
generate_dataset.py
--------------------
Creates a realistic student-performance dataset from scratch (no external
download needed, so the project is fully reproducible and portfolio-safe).

Features:
    hours_studied         - weekly study hours (0-12)
    attendance_pct        - class attendance percentage (40-100)
    previous_score        - score in last exam (35-100)
    sleep_hours           - average sleep per night (4-9)
    sample_papers_solved  - practice papers solved before exam (0-10)
    extracurricular       - 0/1, participates in extracurriculars
    parental_support      - 1 (low) - 3 (high), categorical encoded as int

Target:
    performance_index     - final exam score (0-100), continuous

The target is generated from a deliberately non-trivial linear combination
of the features plus Gaussian noise, so a Linear Regression model has a
real (but learnable) relationship to recover — good for teaching EDA,
feature selection, and evaluation.
"""

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)
N = 1000


def generate(n=N):
    hours_studied = np.clip(RNG.normal(5.5, 2.2, n), 0, 12)
    attendance_pct = np.clip(RNG.normal(80, 12, n), 40, 100)
    previous_score = np.clip(RNG.normal(65, 15, n), 35, 100)
    sleep_hours = np.clip(RNG.normal(6.5, 1.2, n), 4, 9)
    sample_papers_solved = np.clip(RNG.poisson(4, n), 0, 10)
    extracurricular = RNG.binomial(1, 0.45, n)
    parental_support = RNG.integers(1, 4, n)  # 1,2,3

    noise = RNG.normal(0, 6, n)

    performance_index = (
        2.6 * hours_studied
        + 0.28 * attendance_pct
        + 0.35 * previous_score
        + 1.1 * sleep_hours
        + 1.4 * sample_papers_solved
        + 1.8 * extracurricular
        + 2.0 * parental_support
        - 15
        + noise
    )
    performance_index = np.clip(performance_index, 0, 100)

    df = pd.DataFrame({
        "hours_studied": hours_studied.round(1),
        "attendance_pct": attendance_pct.round(1),
        "previous_score": previous_score.round(1),
        "sleep_hours": sleep_hours.round(1),
        "sample_papers_solved": sample_papers_solved.astype(int),
        "extracurricular": extracurricular.astype(int),
        "parental_support": parental_support.astype(int),
        "performance_index": performance_index.round(1),
    })

    # inject a few missing values + duplicate rows to make cleaning meaningful
    for col in ["attendance_pct", "sleep_hours"]:
        idx = RNG.choice(n, size=int(n * 0.02), replace=False)
        df.loc[idx, col] = np.nan
    dup_rows = df.sample(10, random_state=1)
    df = pd.concat([df, dup_rows], ignore_index=True)

    return df


if __name__ == "__main__":
    df = generate()
    df.to_csv("data/student_performance.csv", index=False)
    print(f"Saved {len(df)} rows -> ml/data/student_performance.csv")
