import { useState } from "react";

export default function CourseSwitcher({ courses, activeCourseId, onSelect, onCreate, onDelete, loading }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await onCreate(newName.trim());
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-panel)] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono-data text-xs text-[var(--text-muted)]">your courses</span>
        <button
          onClick={() => setCreating((c) => !c)}
          className="text-xs font-mono-data text-[var(--amber-soft)] hover:text-[var(--amber)] transition-colors"
        >
          {creating ? "cancel" : "+ new course"}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="flex gap-2 mb-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Calculus II"
            className="flex-1 rounded-lg border border-[var(--ink-line)] bg-[var(--ink-panel-alt)] px-3 py-1.5 text-sm outline-none focus:border-[var(--amber)] transition-colors"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-mono-data"
            style={{ background: "var(--amber)", color: "#1a1206" }}
          >
            add
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-xs text-[var(--text-muted)] font-mono-data py-2">loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] font-mono-data py-2">
          no courses yet — add one to start saving history
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {courses.map((c) => {
            const active = c.id === activeCourseId;
            return (
              <div key={c.id} className="group relative">
                <button
                  onClick={() => onSelect(c.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-mono-data border transition-colors pr-6"
                  style={{
                    borderColor: active ? "var(--amber)" : "var(--ink-line)",
                    color: active ? "var(--amber)" : "var(--text-muted)",
                    background: active ? "rgba(242,183,5,0.1)" : "transparent",
                  }}
                >
                  {c.name}
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] opacity-0 group-hover:opacity-100 text-[var(--red-ink)] transition-opacity"
                  title="Delete course"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
