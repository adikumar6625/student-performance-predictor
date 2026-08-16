import { useEffect, useState } from "react";
import { getEda, getModelInfo, predict } from "./api";
import { defaultFormValues } from "./features";
import { buildRemark } from "./remark";

import ScoreGauge from "./components/ScoreGauge";
import StudentForm from "./components/StudentForm";
import ContributionChart from "./components/ContributionChart";
import CorrelationChart from "./components/CorrelationChart";
import ModelLedger from "./components/ModelLedger";

export default function App() {
  const [formValues, setFormValues] = useState(defaultFormValues());
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [modelInfo, setModelInfo] = useState(null);
  const [eda, setEda] = useState(null);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    getModelInfo().then(setModelInfo).catch(() => setBackendError(true));
    getEda().then(setEda).catch(() => setBackendError(true));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await predict(formValues);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen paper-grain">
      {/* Header */}
      <header className="border-b border-[var(--ink-line)]">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full border-2 flex items-center justify-center font-serif-display italic text-sm"
              style={{ borderColor: "var(--amber)", color: "var(--amber)" }}
            >
              Σ
            </div>
            <div>
              <h1 className="font-serif-display text-lg leading-none">Report Card</h1>
              <p className="text-[11px] text-[var(--text-muted)] font-mono-data mt-1">
                student performance predictor
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono-data text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: backendError ? "var(--red-ink)" : "var(--teal)" }} />
            {backendError ? "backend offline" : "linear regression · scikit-learn"}
          </div>
        </div>
      </header>

      {backendError && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="rounded-xl border border-[var(--red-ink)]/40 bg-[var(--red-ink)]/10 px-4 py-3 text-sm">
            Can't reach the API. Make sure the backend is running and{" "}
            <code className="font-mono-data">VITE_API_URL</code> points to it.
          </div>
        </div>
      )}

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-10 sm:py-14">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
          <StudentForm
            values={formValues}
            onChange={setFormValues}
            onSubmit={handleSubmit}
            submitting={submitting}
          />

          <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-6 sm:p-8 ledger-rule">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="font-serif-display text-xl">Predicted Outcome</h2>
              <span className="font-mono-data text-[11px] text-[var(--text-muted)]">
                final exam
              </span>
            </div>

            {error && (
              <p className="text-sm text-[var(--red-ink)] mb-2">{error}</p>
            )}

            <div className="flex justify-center py-4">
              <ScoreGauge score={result?.predicted_score} grade={result?.grade} loading={submitting} />
            </div>

            <p className="text-sm text-[var(--text-muted)] leading-relaxed min-h-[3.5rem] italic font-serif-display">
              {result
                ? buildRemark(result.grade, result.contribution_breakdown)
                : "Fill in the record and predict to see a grade, teacher's remark, and score breakdown."}
            </p>
          </div>
        </div>

        {/* Breakdown + EDA */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <section className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-6 sm:p-8">
            <h3 className="font-serif-display text-lg mb-1">Where the grade came from</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              each bar is (standardized feature value) x (learned coefficient)
            </p>
            <ContributionChart contributions={result?.contribution_breakdown} />
          </section>

          <section className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-6 sm:p-8">
            <h3 className="font-serif-display text-lg mb-1">Class-wide correlations</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Pearson r between each feature and performance index, {eda?.n_rows ?? "..."} students
            </p>
            <CorrelationChart correlations={eda?.correlation_with_target} />
          </section>
        </div>

        {/* Model report */}
        <section className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-6 sm:p-8 mt-8">
          <h3 className="font-serif-display text-lg mb-4">Model report card</h3>
          <ModelLedger metrics={modelInfo?.metrics} />
        </section>

        <footer className="text-center text-[11px] text-[var(--text-muted)] font-mono-data py-10">
          Linear Regression - Pandas - Scikit-learn - FastAPI - React
        </footer>
      </main>
    </div>
  );
}
