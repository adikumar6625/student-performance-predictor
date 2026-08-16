import { useState } from "react";
import { FEATURE_CONFIG } from "../features";

function gradeColor(grade) {
  if (["A+", "A"].includes(grade)) return "var(--teal)";
  if (["B", "C"].includes(grade)) return "var(--amber)";
  return "var(--red-ink)";
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function HistoryPanel({ history, onLoad, onRemove, onClear }) {
  const [compareIds, setCompareIds] = useState([]);

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const compareEntries = compareIds
    .map((id) => history.find((e) => e.id === id))
    .filter(Boolean);

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-6 sm:p-8">
        <h3 className="font-serif-display text-lg mb-1">Past entries</h3>
        <p className="text-xs text-[var(--text-muted)] font-mono-data py-6 text-center">
          predictions you run will show up here
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-6 sm:p-8">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-serif-display text-lg">Past entries</h3>
        <button
          onClick={onClear}
          className="text-[11px] font-mono-data text-[var(--text-muted)] hover:text-[var(--red-ink)] transition-colors"
        >
          clear all
        </button>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        select up to two to compare, or load one back into the form
      </p>

      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {history.map((entry) => {
          const selected = compareIds.includes(entry.id);
          const color = gradeColor(entry.grade);
          return (
            <li
              key={entry.id}
              className="group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all"
              style={{
                borderColor: selected ? color : "var(--ink-line)",
                background: selected ? `${color}14` : "transparent",
              }}
            >
              <button
                onClick={() => toggleCompare(entry.id)}
                className="w-9 h-9 shrink-0 rounded-full border-2 flex items-center justify-center font-mono-data text-xs transition-transform active:scale-90"
                style={{ borderColor: color, color }}
                title="Select for comparison"
              >
                {entry.grade}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono-data text-sm" style={{ color }}>
                    {entry.predicted_score.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono-data">
                    {timeAgo(entry.timestamp)}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">
                  {entry.values.hours_studied}h study · {entry.values.attendance_pct}% attend ·{" "}
                  {entry.values.previous_score}% prev
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onLoad(entry.values)}
                  className="text-[11px] font-mono-data px-2 py-1 rounded-md border border-[var(--ink-line)] text-[var(--text-muted)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors"
                >
                  load
                </button>
                <button
                  onClick={() => onRemove(entry.id)}
                  className="text-[11px] font-mono-data px-2 py-1 rounded-md border border-[var(--ink-line)] text-[var(--text-muted)] hover:text-[var(--red-ink)] hover:border-[var(--red-ink)] transition-colors"
                >
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {compareEntries.length === 2 && (
        <CompareBlock entries={compareEntries} />
      )}
    </div>
  );
}

function CompareBlock({ entries }) {
  const [a, b] = entries;
  const delta = +(b.predicted_score - a.predicted_score).toFixed(1);
  const deltaColor = delta > 0 ? "var(--teal)" : delta < 0 ? "var(--red-ink)" : "var(--text-muted)";

  const keys = Object.keys(FEATURE_CONFIG);

  return (
    <div className="mt-5 pt-5 border-t border-dashed border-[var(--ink-line)]">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono-data text-xs text-[var(--text-muted)]">comparison</span>
        <span className="font-mono-data text-sm" style={{ color: deltaColor }}>
          {delta > 0 ? "+" : ""}
          {delta} pts
        </span>
      </div>
      <div className="space-y-1.5">
        {keys.map((k) => {
          const av = a.values[k];
          const bv = b.values[k];
          const changed = av !== bv;
          return (
            <div key={k} className="flex items-center justify-between text-xs font-mono-data">
              <span className="text-[var(--text-muted)]">{FEATURE_CONFIG[k].label}</span>
              <span className={changed ? "text-[var(--amber-soft)]" : "text-[var(--text-muted)]"}>
                {av} → {bv}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
