import { useEffect, useState } from "react";

const SIZE = 220;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function gradeColor(grade) {
  if (["A+", "A"].includes(grade)) return "var(--teal)";
  if (["B", "C"].includes(grade)) return "var(--amber)";
  return "var(--red-ink)";
}

export default function ScoreGauge({ score, grade, loading }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (score == null) return;
    setAnimated(0);
    const id = requestAnimationFrame(() => setAnimated(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const pct = Math.max(0, Math.min(100, animated ?? 0)) / 100;
  const offset = CIRCUMFERENCE * (1 - pct);
  const color = score == null ? "var(--ink-line)" : gradeColor(grade);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        {/* track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="var(--ink-line)"
          strokeWidth={STROKE}
          fill="none"
        />
        {/* faint under-stroke for ink texture */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE + 5}
          strokeOpacity={0.15}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.9,.25,1), stroke 0.4s" }}
        />
        {/* pen stroke */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.9,.25,1), stroke 0.4s" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {loading ? (
          <span className="font-mono-data text-sm text-[var(--text-muted)]">calculating…</span>
        ) : score == null ? (
          <>
            <span className="font-serif-display text-2xl text-[var(--text-muted)]">—</span>
            <span className="font-mono-data text-[11px] text-[var(--text-muted)] mt-1">no prediction yet</span>
          </>
        ) : (
          <>
            <span className="font-serif-display text-5xl font-semibold" style={{ color }}>
              {score.toFixed(1)}
            </span>
            <span
              className="font-serif-display italic text-lg mt-1 border-2 rounded-full w-11 h-11 flex items-center justify-center"
              style={{ color, borderColor: color }}
            >
              {grade}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
