import { ALL_FEATURE_KEYS, FEATURE_CONFIG } from "../features";

export default function StudentForm({ values, onChange, onSubmit, submitting, selectedFeatures, onEditParameters }) {
  const update = (key, val) => onChange({ ...values, [key]: val });
  const visibleKeys = selectedFeatures ?? ALL_FEATURE_KEYS;
  const hiddenCount = ALL_FEATURE_KEYS.length - visibleKeys.length;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-5 sm:p-8 transition-shadow hover:shadow-2xl hover:shadow-black/20"
    >
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-serif-display text-xl">Student Record</h2>
        <span className="font-mono-data text-[11px] text-[var(--text-muted)]">
          entry no. 07
        </span>
      </div>

      {onEditParameters && (
        <button
          type="button"
          onClick={onEditParameters}
          className="text-[11px] font-mono-data text-[var(--text-muted)] hover:text-[var(--amber)] transition-colors mb-5 sm:mb-6"
        >
          edit factors{hiddenCount > 0 ? ` (${hiddenCount} held at class average)` : ""} →
        </button>
      )}

      <div className="space-y-6">
        {visibleKeys.map((key) => {
          const cfg = FEATURE_CONFIG[key];
          return (
          <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2">
            <label htmlFor={key} className="text-sm text-[var(--text-muted)] col-span-2 sm:col-span-1">
              {cfg.label}
            </label>

            {cfg.field === "slider" && (
              <>
                <span className="font-mono-data text-sm text-[var(--amber-soft)] justify-self-end sm:col-start-2">
                  {values[key]}
                  {cfg.unit ? ` ${cfg.unit}` : ""}
                </span>
                <input
                  id={key}
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  value={values[key]}
                  onChange={(e) => update(key, parseFloat(e.target.value))}
                  className="col-span-2 w-full"
                />
              </>
            )}

            {cfg.field === "toggle" && (
              <button
                type="button"
                role="switch"
                aria-checked={values[key] === 1}
                onClick={() => update(key, values[key] === 1 ? 0 : 1)}
                className="col-start-2 sm:col-start-2 justify-self-end relative w-12 h-6 rounded-full transition-colors"
                style={{
                  background: values[key] === 1 ? "var(--teal)" : "var(--ink-line)",
                }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-[var(--ink-bg)] transition-transform"
                  style={{ transform: values[key] === 1 ? "translateX(26px)" : "translateX(2px)" }}
                />
              </button>
            )}

            {cfg.field === "select" && (
              <div className="col-span-2 sm:col-span-1 sm:col-start-2 flex gap-1.5 justify-self-end">
                {cfg.options.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => update(key, opt.value)}
                    className="px-3 py-1 rounded-full text-xs font-mono-data border transition-colors"
                    style={{
                      borderColor: values[key] === opt.value ? "var(--amber)" : "var(--ink-line)",
                      color: values[key] === opt.value ? "var(--amber)" : "var(--text-muted)",
                      background: values[key] === opt.value ? "rgba(232,184,75,0.08)" : "transparent",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 w-full rounded-xl py-3 font-mono-data text-sm tracking-wide uppercase transition-transform active:scale-[0.99] disabled:opacity-50"
        style={{ background: "var(--amber)", color: "#1a1206" }}
      >
        {submitting ? "Grading…" : "Predict Performance Index"}
      </button>
    </form>
  );
}
