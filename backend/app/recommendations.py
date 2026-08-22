"""
recommendations.py
--------------------
Turns the model's own coefficients into concrete, actionable suggestions,
e.g. "Studying 2 more hours/week could raise your score by about 3.1 pts."

This is NOT a separate AI/LLM call — it's arithmetic derived directly from
the trained Linear Regression model, so every number shown is defensible:
    standardized_value = (raw_value - mean) / std
    prediction = intercept + sum(coefficient_i * standardized_value_i)

so the marginal effect of changing one raw feature by `delta` is:
    delta_prediction = coefficient_i * (delta / std_i)

Keep FEATURE_META in sync with frontend/src/features.js if you add or
change features — it's duplicated here so the backend has no frontend
dependency.
"""

FEATURE_META = {
    "hours_studied": {"label": "Hours Studied / Week", "unit": "hrs", "increment": 2, "max": 12},
    "attendance_pct": {"label": "Attendance", "unit": "%", "increment": 10, "max": 100},
    "previous_score": {"label": "Previous Exam Score", "unit": "%", "increment": 10, "max": 100},
    "sleep_hours": {"label": "Sleep / Night", "unit": "hrs", "increment": 1, "max": 9},
    "sample_papers_solved": {"label": "Practice Papers Solved", "unit": "papers", "increment": 2, "max": 10},
    "extracurricular": {"label": "Extracurricular Activities", "unit": "", "increment": 1, "max": 1},
    "parental_support": {"label": "Parental Support", "unit": "level", "increment": 1, "max": 3},
}


def build_recommendations(features, values, coefficients, scaler, top_n=3):
    """
    features:      list of feature keys used by the model, in scaler order
    values:        dict of the user's submitted raw values
    coefficients:  dict feature -> standardized coefficient
    scaler:        the fitted StandardScaler (has .mean_ and .scale_)
    """
    items = []
    for i, f in enumerate(features):
        meta = FEATURE_META.get(f)
        if not meta:
            continue

        current = values[f]
        headroom = meta["max"] - current
        if headroom <= 0:
            continue  # already at the max, nothing to suggest

        increment = min(meta["increment"], headroom)
        if increment <= 0:
            continue

        std = scaler.scale_[i] or 1.0
        coef = coefficients[f]
        point_gain = coef * (increment / std)

        if point_gain <= 0.15:
            continue  # not worth surfacing as a suggestion

        if meta["unit"] == "" and increment == 1:
            action = f"Turning on {meta['label'].lower()}"
        elif meta["unit"] == "level":
            action = f"Increasing {meta['label'].lower()} by {int(increment)} level"
        else:
            action = f"Adding {increment:g} more {meta['unit']} of {meta['label'].lower()}"

        items.append(
            {
                "feature": f,
                "label": meta["label"],
                "action": action,
                "potential_gain": round(point_gain, 1),
            }
        )

    items.sort(key=lambda x: x["potential_gain"], reverse=True)
    return items[:top_n]
