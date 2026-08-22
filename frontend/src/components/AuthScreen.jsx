import { useState } from "react";

export default function AuthScreen({ onLogin, onSignup, onSkip }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onSignup(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen paper-grain flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 mx-auto rounded-full border-2 flex items-center justify-center font-serif-display italic text-lg mb-4"
            style={{ borderColor: "var(--amber)", color: "var(--amber)" }}
          >
            Σ
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl mb-2">Report Card</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {mode === "login"
              ? "Log in to track your predictions across courses over the semester."
              : "Create an account to save your prediction history by course."}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-mono-data text-[var(--text-muted)] mb-1.5">
                email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--ink-line)] bg-[var(--ink-panel-alt)] px-3 py-2.5 text-sm outline-none focus:border-[var(--amber)] transition-colors"
                placeholder="you@college.edu"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-mono-data text-[var(--text-muted)] mb-1.5">
                password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--ink-line)] bg-[var(--ink-panel-alt)] px-3 py-2.5 text-sm outline-none focus:border-[var(--amber)] transition-colors"
                placeholder="at least 6 characters"
              />
            </div>

            {error && <p className="text-sm text-[var(--red-ink)]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-3 font-mono-data text-sm tracking-wide uppercase transition-all active:scale-[0.99] disabled:opacity-50"
              style={{ background: "var(--amber)", color: "#1a1206" }}
            >
              {submitting ? "..." : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="w-full text-center text-xs font-mono-data text-[var(--text-muted)] hover:text-[var(--amber)] transition-colors mt-4"
          >
            {mode === "login" ? "New here? Create an account →" : "Already have an account? Log in →"}
          </button>
        </div>

        <button
          onClick={onSkip}
          className="w-full text-center text-xs font-mono-data text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mt-6"
        >
          continue as guest (predictions won't be saved to an account) →
        </button>
      </div>
    </div>
  );
}
