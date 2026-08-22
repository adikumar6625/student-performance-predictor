import { useEffect, useState } from "react";
import {
  createCourse,
  deleteCourse,
  deletePrediction,
  getCoursePredictions,
  getEda,
  getModelInfo,
  listCourses,
  predict,
} from "./api";
import { ALL_FEATURE_KEYS, defaultFormValues } from "./features";
import { buildRemark } from "./remark";
import { usePredictionHistory } from "./usePredictionHistory";
import { useLocalStorageState } from "./useLocalStorageState";
import { useAuth } from "./useAuth";

import ScoreGauge from "./components/ScoreGauge";
import StudentForm from "./components/StudentForm";
import ContributionChart from "./components/ContributionChart";
import CorrelationChart from "./components/CorrelationChart";
import ModelLedger from "./components/ModelLedger";
import HistoryPanel from "./components/HistoryPanel";
import ParameterSelector from "./components/ParameterSelector";
import AuthScreen from "./components/AuthScreen";
import CourseSwitcher from "./components/CourseSwitcher";
import RecommendationsPanel from "./components/RecommendationsPanel";
import Reveal from "./components/Reveal";
import Toast from "./components/Toast";
import { ChartSkeleton, LedgerSkeleton } from "./components/Skeletons";

function backendPredictionToHistoryEntry(p) {
  return {
    id: p.id,
    timestamp: new Date(p.created_at).getTime(),
    values: p.values,
    predicted_score: p.predicted_score,
    grade: p.grade,
  };
}

export default function App() {
  const auth = useAuth();
  const [guestMode, setGuestMode] = useLocalStorageState("report-card:guest-mode", false);
  const [stage, setStage] = useState("select"); // 'select' | 'dashboard' (auth handled separately below)

  const [selectedFeatures, setSelectedFeatures] = useLocalStorageState(
    "report-card:selected-features",
    ALL_FEATURE_KEYS
  );

  const [formValues, setFormValues] = useState(defaultFormValues());
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [modelInfo, setModelInfo] = useState(null);
  const [eda, setEda] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [toast, setToast] = useState(null);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [activeCourseId, setActiveCourseId] = useLocalStorageState("report-card:active-course-id", null);
  const [remoteHistory, setRemoteHistory] = useState([]);

  const localHistory = usePredictionHistory();

  const loadDashboardData = () => {
    setDashboardLoading(true);
    setBackendError(false);
    Promise.all([getModelInfo(), getEda()])
      .then(([mi, ed]) => {
        setModelInfo(mi);
        setEda(ed);
      })
      .catch(() => setBackendError(true))
      .finally(() => setDashboardLoading(false));
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load this user's courses once authed, and auto-pick the first one.
  useEffect(() => {
    if (!auth.isAuthed) {
      setCourses([]);
      return;
    }
    setCoursesLoading(true);
    listCourses(auth.token)
      .then((list) => {
        setCourses(list);
        setActiveCourseId((current) => {
          if (current && list.some((c) => c.id === current)) return current;
          return list[0]?.id ?? null;
        });
      })
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthed]);

  // Load prediction history for the active course.
  useEffect(() => {
    if (!auth.isAuthed || !activeCourseId) {
      setRemoteHistory([]);
      return;
    }
    getCoursePredictions(activeCourseId, auth.token)
      .then(setRemoteHistory)
      .catch(() => setRemoteHistory([]));
  }, [auth.isAuthed, activeCourseId, auth.token]);

  const handleCreateCourse = async (name) => {
    const course = await createCourse(name, auth.token);
    setCourses((prev) => [...prev, course]);
    setActiveCourseId(course.id);
  };

  const handleDeleteCourse = async (courseId) => {
    await deleteCourse(courseId, auth.token);
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    if (activeCourseId === courseId) setActiveCourseId(null);
  };

  const refreshRemoteHistory = () => {
    if (auth.isAuthed && activeCourseId) {
      getCoursePredictions(activeCourseId, auth.token).then(setRemoteHistory).catch(() => {});
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload =
        auth.isAuthed && activeCourseId ? { ...formValues, course_id: activeCourseId } : formValues;
      const res = await predict(payload, auth.isAuthed ? auth.token : null);
      setResult(res);

      if (res.saved) {
        refreshRemoteHistory();
      } else {
        localHistory.addEntry(formValues, res);
      }

      setToast({ message: `Predicted ${res.predicted_score.toFixed(1)} · grade ${res.grade}`, tone: "success" });
    } catch (e) {
      setError(e.message);
      setToast({ message: "Prediction failed — see details above", tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const usingRemoteHistory = auth.isAuthed && !!activeCourseId;
  const historyItems = usingRemoteHistory
    ? remoteHistory.map(backendPredictionToHistoryEntry)
    : localHistory.history;

  const handleHistoryRemove = async (id) => {
    if (usingRemoteHistory) {
      await deletePrediction(id, auth.token);
      refreshRemoteHistory();
    } else {
      localHistory.removeEntry(id);
    }
  };

  const handleHistoryClear = async () => {
    if (usingRemoteHistory) {
      await Promise.all(remoteHistory.map((p) => deletePrediction(p.id, auth.token)));
      refreshRemoteHistory();
    } else {
      localHistory.clearHistory();
    }
  };

  // ---- stage: not yet decided whether to log in or continue as guest ----
  if (!auth.checking && !auth.isAuthed && !guestMode) {
    return (
      <AuthScreen
        onLogin={auth.login}
        onSignup={auth.signup}
        onSkip={() => setGuestMode(true)}
      />
    );
  }

  if (auth.checking) {
    return <div className="min-h-screen paper-grain" />;
  }

  if (stage === "select") {
    return (
      <ParameterSelector
        selected={selectedFeatures}
        onChange={setSelectedFeatures}
        onContinue={() => setStage("dashboard")}
      />
    );
  }

  return (
    <div className="min-h-screen paper-grain">
      {/* Header */}
      <header className="border-b border-[var(--ink-line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 shrink-0 rounded-full border-2 flex items-center justify-center font-serif-display italic text-sm"
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
          <div className="flex items-center gap-3 text-[11px] font-mono-data text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: backendError ? "var(--red-ink)" : "var(--teal)",
                  animation: backendError ? "none" : "pulse-dot 2.4s ease-in-out infinite",
                }}
              />
              <span className="hidden sm:inline">{backendError ? "backend offline" : "live"}</span>
            </span>
            {auth.isAuthed ? (
              <>
                <span className="hidden sm:inline text-[var(--text-muted)]">{auth.user.email}</span>
                <button onClick={auth.logout} className="hover:text-[var(--red-ink)] transition-colors">
                  log out
                </button>
              </>
            ) : (
              <button
                onClick={() => setGuestMode(false)}
                className="hover:text-[var(--amber)] transition-colors"
              >
                log in to save history →
              </button>
            )}
          </div>
        </div>
      </header>

      {backendError && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          <div className="rounded-xl border border-[var(--red-ink)]/40 bg-[var(--red-ink)]/10 px-4 py-3 text-sm flex items-center justify-between gap-3 flex-wrap">
            <span>
              Can't reach the API. Make sure the backend is running and{" "}
              <code className="font-mono-data">VITE_API_URL</code> points to it.
            </span>
            <button
              onClick={loadDashboardData}
              className="shrink-0 text-xs font-mono-data px-3 py-1.5 rounded-lg border border-[var(--red-ink)]/50 hover:bg-[var(--red-ink)]/15 transition-colors"
            >
              retry
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        {auth.isAuthed && (
          <Reveal>
            <div className="mb-6 sm:mb-8">
              <CourseSwitcher
                courses={courses}
                activeCourseId={activeCourseId}
                onSelect={setActiveCourseId}
                onCreate={handleCreateCourse}
                onDelete={handleDeleteCourse}
                loading={coursesLoading}
              />
            </div>
          </Reveal>
        )}

        {/* Hero */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 sm:gap-8 items-start">
          <Reveal>
            <StudentForm
              values={formValues}
              onChange={setFormValues}
              onSubmit={handleSubmit}
              submitting={submitting}
              selectedFeatures={selectedFeatures}
              onEditParameters={() => setStage("select")}
            />
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-5 sm:p-8 ledger-rule transition-shadow hover:shadow-2xl hover:shadow-black/20">
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="font-serif-display text-xl">Predicted Outcome</h2>
                <span className="font-mono-data text-[11px] text-[var(--text-muted)]">
                  {usingRemoteHistory ? courses.find((c) => c.id === activeCourseId)?.name : "final exam"}
                </span>
              </div>

              {error && <p className="text-sm text-[var(--red-ink)] mb-2">{error}</p>}

              <div className="flex justify-center py-4">
                <ScoreGauge score={result?.predicted_score} grade={result?.grade} loading={submitting} />
              </div>

              <p className="text-sm text-[var(--text-muted)] leading-relaxed min-h-[3.5rem] italic font-serif-display">
                {result
                  ? buildRemark(result.grade, result.contribution_breakdown)
                  : "Fill in the record and predict to see a grade, teacher's remark, and score breakdown."}
              </p>

              <RecommendationsPanel recommendations={result?.recommendations} />
            </div>
          </Reveal>
        </div>

        {/* Breakdown + EDA */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8">
          <Reveal>
            <section className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-5 sm:p-8 h-full transition-shadow hover:shadow-2xl hover:shadow-black/20">
              <h3 className="font-serif-display text-lg mb-1">Where the grade came from</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                each bar is (standardized feature value) x (learned coefficient) for factors you chose to track
              </p>
              <ContributionChart contributions={result?.contribution_breakdown} selectedFeatures={selectedFeatures} />
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-5 sm:p-8 h-full transition-shadow hover:shadow-2xl hover:shadow-black/20">
              <h3 className="font-serif-display text-lg mb-1">Class-wide correlations</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Pearson r between each feature and performance index, {eda?.n_rows ?? "..."} students
              </p>
              {dashboardLoading ? <ChartSkeleton /> : <CorrelationChart correlations={eda?.correlation_with_target} />}
            </section>
          </Reveal>
        </div>

        {/* History + comparison */}
        <Reveal>
          <div className="mt-6 sm:mt-8">
            {auth.isAuthed && !activeCourseId ? (
              <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-6 sm:p-8 text-center text-sm text-[var(--text-muted)] font-mono-data">
                create or select a course above to start saving history
              </div>
            ) : (
              <HistoryPanel
                history={historyItems}
                onLoad={setFormValues}
                onRemove={handleHistoryRemove}
                onClear={handleHistoryClear}
              />
            )}
          </div>
        </Reveal>

        {/* Model report */}
        <Reveal>
          <section className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-5 sm:p-8 mt-6 sm:mt-8 transition-shadow hover:shadow-2xl hover:shadow-black/20">
            <h3 className="font-serif-display text-lg mb-4">Model report card</h3>
            {dashboardLoading ? <LedgerSkeleton /> : <ModelLedger metrics={modelInfo?.metrics} />}
          </section>
        </Reveal>

        <footer className="text-center text-[11px] text-[var(--text-muted)] font-mono-data py-10">
          Linear Regression - Pandas - Scikit-learn - FastAPI - React
        </footer>
      </main>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
