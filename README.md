# Report Card — Student Performance Predictor

A full-stack machine learning project: a **Linear Regression** model (trained
with `pandas` + `scikit-learn`) predicts a student's exam performance from
study habits, served by a **FastAPI** backend and visualized in a custom
**React** dashboard.

```
student-performance-predictor/
├── ml/                     # data, EDA, training pipeline
│   ├── generate_dataset.py
│   ├── train_model.py
│   ├── data/student_performance.csv
│   └── artifacts/          # trained model, scaler, metrics (generated)
├── backend/                # FastAPI app that serves the model
│   ├── app/main.py
│   ├── app/artifacts/      # copy of trained model used at runtime
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml
└── frontend/                # React + Vite + Tailwind dashboard
    ├── src/
    ├── vercel.json
    └── .env.example
```

## 1. How the ML part works

- **Data**: `ml/generate_dataset.py` builds a 1,000-row synthetic-but-realistic
  dataset (hours studied, attendance, previous score, sleep, practice papers,
  extracurriculars, parental support → performance index), with injected
  missing values and duplicate rows so cleaning has real work to do. Swap in
  a real CSV (e.g. a Kaggle dataset) by pointing `DATA_PATH` in
  `train_model.py` at it — the pipeline doesn't care where the CSV came from.
- **Cleaning**: drop duplicates, median-impute missing values, clip
  impossible values.
- **EDA**: correlation of every feature with the target, summary statistics
  — saved to `ml/artifacts/eda_report.json` and shown live in the frontend's
  "Class-wide correlations" chart.
- **Feature selection**: keeps features whose correlation with the target
  clears a small threshold (all seven clear it here, but the mechanism is
  there for a messier real-world dataset).
- **Model**: features are standardized (`StandardScaler`) and fit with
  `sklearn.linear_model.LinearRegression`. Evaluated with R², MAE, RMSE, and
  5-fold cross-validation.
- **Artifacts**: `model.joblib`, `scaler.joblib`, and `metadata.json`
  (features, coefficients, metrics, feature ranges) are saved and consumed
  directly by the backend — no retraining needed to serve predictions.

Current run: **R² ≈ 0.73, MAE ≈ 4.5 points** on held-out test data.

## 2. Run it locally

### a) Train (or retrain) the model
```bash
cd ml
pip install -r ../backend/requirements.txt pandas  # sklearn, joblib, pandas
python3 generate_dataset.py   # creates data/student_performance.csv
python3 train_model.py        # trains, evaluates, saves artifacts/
cp artifacts/model.joblib artifacts/scaler.joblib artifacts/metadata.json artifacts/eda_report.json ../backend/app/artifacts/
```
(The repo already ships with trained artifacts, so this step is only needed
if you change the data or model.)

### b) Run the backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Visit `http://localhost:8000/docs` for interactive API docs (Swagger UI).

### c) Run the frontend
```bash
cd frontend
npm install
npm run dev
```
Open the printed local URL (default `http://localhost:5173`). It reads the
API location from `VITE_API_URL` in `frontend/.env` (defaults to
`http://localhost:8000`).

## 3. Deploy it live

### Backend → Render (free tier, Docker)
1. Push this repo to GitHub.
2. In [Render](https://dashboard.render.com), click **New +** → **Web
   Service**, connect the repo, and either:
   - let Render detect `backend/render.yaml` as a Blueprint, or
   - set it up manually: **Runtime: Docker**, **Root Directory: backend**.
3. Deploy. Note the live URL, e.g. `https://student-performance-api.onrender.com`.
4. Once you also have your frontend's Vercel URL (step below), go back to
   the Render service → **Environment** and set:
   ```
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
   so CORS only allows your real frontend (it defaults to `*` for a quick
   first deploy).

   *Free-tier note: Render spins the service down after inactivity, so the
   first request after a while takes ~30-50s to wake up — normal, not a bug.*

### Frontend → Vercel
1. In [Vercel](https://vercel.com/new), import the same repo.
2. Set **Root Directory** to `frontend`.
3. Add an environment variable:
   ```
   VITE_API_URL=https://student-performance-api.onrender.com
   ```
   (your live Render URL from above).
4. Deploy. Vercel auto-detects Vite (`vercel.json` is already included for
   SPA routing).

That's it — a live URL you can put on your resume/portfolio, backed by a
real trained model, real inference, real deployment.

### Alternative one-service option
If you'd rather not run two hosts, you can serve the built React app as
static files from FastAPI itself (`StaticFiles` mount) and deploy just the
backend to Render/Railway. Ask if you want this variant — it trades a
slightly simpler deploy for less separation between frontend/backend.

## 4. What each endpoint does

| Endpoint            | Method | Purpose                                                   |
|----------------------|--------|------------------------------------------------------------|
| `/api/health`        | GET    | Liveness check                                              |
| `/api/model-info`    | GET    | Metrics, coefficients, feature ranges — powers the "report card" and coefficient displays |
| `/api/eda`           | GET    | Correlation + summary stats — powers the "class-wide correlations" chart |
| `/api/predict`       | POST   | Runs a live prediction; body = the 7 feature values, returns predicted score, letter grade, and per-feature contribution breakdown |

## 5. Talking about this project (e.g. in an interview)

- **Why Linear Regression**: interpretable coefficients make it easy to
  explain *why* a prediction came out the way it did — the frontend's
  contribution chart literally shows `standardized_value × coefficient` per
  feature, which is the actual math, not a black box.
- **Why standardize features**: features are on very different scales
  (0-12 hours vs 40-100%), so without scaling the raw coefficients wouldn't
  be comparable in magnitude.
- **Validation strategy**: an 80/20 train/test split plus 5-fold
  cross-validation, to check the R² isn't just a lucky split.
- **Limitations to mention**: synthetic data means the "real world"
  relationships are simplified by construction; a linear model also can't
  capture interaction effects (e.g. sleep mattering more when study hours
  are high) — a natural next step would be polynomial features or a tree-based
  model, and comparing R² against this baseline.
