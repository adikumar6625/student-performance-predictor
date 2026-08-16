import { ALL_FEATURE_KEYS, FEATURE_CONFIG } from "../features";

export default function ParameterSelector({ selected, onChange, onContinue }) {
  const allSelected = selected.length === ALL_FEATURE_KEYS.length;
  const noneSelected = selected.length === 0;

  const toggle = (key) => {
    onChange(
      selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]
    );
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : [...ALL_FEATURE_KEYS]);
  };

  return (
    <div className="min-h-screen paper-grain flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 sm:mb-10">
          <div
            className="w-12 h-12 mx-auto rounded-full border-2 flex items-center justify-center font-serif-display italic text-lg mb-4"
            style={{ borderColor: "var(--amber)", color: "var(--amber)" }}
          >
            Σ
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl mb-2">Choose your factors</h1>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Pick which parts of a student's record you want to experiment with.
            Anything left out is held at the class average instead of shown as a slider.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-5 sm:p-8">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-[var(--ink-line)]">
            <span className="font-mono-data text-xs text-[var(--text-muted)]">
              {selected.length} of {ALL_FEATURE_KEYS.length} selected
            </span>
            <button
              onClick={toggleAll}
              className="text-xs font-mono-data px-3 py-1.5 rounded-full border transition-colors"
              style={{
                borderColor: allSelected ? "var(--amber)" : "var(--ink-line)",
                color: allSelected ? "var(--amber)" : "var(--text-muted)",
              }}
            >
              {allSelected ? "clear all" : "select all"}
            </button>
          </div>

          <ul className="divide-y divide-[var(--ink-line-soft)]">
            {ALL_FEATURE_KEYS.map((key) => {
              const cfg = FEATURE_CONFIG[key];
              const checked = selected.includes(key);
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="w-full flex items-center gap-4 py-3.5 text-left group"
                  >
                    <span
                      className="w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: checked ? "var(--amber)" : "var(--ink-line)",
                        background: checked ? "var(--amber)" : "transparent",
                      }}
                    >
                      {checked && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M2.5 7.5L5.5 10.5L11.5 3.5"
                            stroke="#1a1206"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className="block text-sm transition-colors"
                        style={{ color: checked ? "var(--text-primary)" : "var(--text-muted)" }}
                      >
                        {cfg.label}
                      </span>
                      <span className="block text-xs text-[var(--text-muted)] truncate">
                        {cfg.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          onClick={onContinue}
          disabled={noneSelected}
          className="mt-6 w-full rounded-xl py-3.5 font-mono-data text-sm tracking-wide uppercase transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--amber)", color: "#1a1206" }}
        >
          Continue to Report Card →
        </button>
        {noneSelected && (
          <p className="text-center text-xs text-[var(--red-ink)] mt-2 font-mono-data">
            select at least one factor to continue
          </p>
        )}
      </div>
    </div>
  );
}
