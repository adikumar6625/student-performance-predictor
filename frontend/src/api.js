const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export const getModelInfo = () => request("/api/model-info");
export const getEda = () => request("/api/eda");
export const predict = (payload) =>
  request("/api/predict", { method: "POST", body: JSON.stringify(payload) });
