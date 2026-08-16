export function ChartSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-3 py-2 animate-pulse" aria-busy="true" aria-label="Loading chart">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className="h-2.5 rounded-full bg-[var(--ink-line)]"
            style={{ width: 90 }}
          />
          <div
            className="h-4 rounded-md bg-[var(--ink-line)]"
            style={{ width: `${30 + ((i * 37) % 55)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function LedgerSkeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading metrics">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2.5"
          style={{ borderBottom: i < rows - 1 ? "1px dashed var(--ink-line)" : "none" }}
        >
          <div className="space-y-1.5">
            <div className="h-3 w-40 rounded bg-[var(--ink-line)]" />
            <div className="h-2 w-24 rounded bg-[var(--ink-line-soft)]" />
          </div>
          <div className="h-3 w-14 rounded bg-[var(--ink-line)]" />
        </div>
      ))}
    </div>
  );
}
