import { useEffect } from "react";

export default function Toast({ message, tone = "success", onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200);
    return () => clearTimeout(t);
  }, [onDismiss, message]);

  const color = tone === "error" ? "var(--red-ink)" : "var(--teal)";

  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full border font-mono-data text-xs sm:text-sm shadow-lg flex items-center gap-2"
      style={{
        background: "var(--ink-panel-alt)",
        borderColor: color,
        color: "var(--text-primary)",
        animation: "toast-in 0.35s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {message}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
