export default function RecommendationsPanel({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="mt-5 pt-5 border-t border-dashed border-[var(--ink-line)]">
      <span className="font-mono-data text-xs text-[var(--text-muted)]">
        what would move the needle
      </span>
      <ul className="mt-3 space-y-2.5">
        {recommendations.map((r) => (
          <li key={r.feature} className="flex items-start gap-2.5">
            <span
              className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono-data"
              style={{ background: "rgba(47,158,100,0.15)", color: "var(--teal)" }}
            >
              +
            </span>
            <p className="text-sm text-[var(--text-primary)] leading-snug">
              {r.action} could raise your score by about{" "}
              <span className="font-mono-data text-[var(--teal)]">+{r.potential_gain} pts</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
