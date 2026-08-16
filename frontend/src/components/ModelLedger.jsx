export default function ModelLedger({ metrics }) {
  if (!metrics) return null;

  const rows = [
    ["R² score", metrics.r2_score, "share of variance explained"],
    ["Mean absolute error", `${metrics.mae} pts`, "avg. prediction miss"],
    ["RMSE", `${metrics.rmse} pts`, "penalizes larger misses"],
    ["5-fold CV R² (mean ± std)", `${metrics.cv_r2_mean} ± ${metrics.cv_r2_std}`, "generalization check"],
    ["Train / test rows", `${metrics.n_train} / ${metrics.n_test}`, "80 / 20 split"],
  ];

  return (
    <div className="font-mono-data text-sm">
      {rows.map(([label, value, note], i) => (
        <div
          key={label}
          className="grid grid-cols-[1fr_auto] items-baseline py-2.5"
          style={{ borderBottom: i < rows.length - 1 ? "1px dashed var(--ink-line)" : "none" }}
        >
          <div>
            <div className="text-[var(--text-primary)]">{label}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-sans">{note}</div>
          </div>
          <div className="text-[var(--amber-soft)]">{value}</div>
        </div>
      ))}
    </div>
  );
}
