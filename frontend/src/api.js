const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---- public, no auth required ----
export const getModelInfo = () => request("/api/model-info");
export const getEda = () => request("/api/eda");
export const predict = (payload, token = null) =>
  request("/api/predict", { method: "POST", body: JSON.stringify(payload) }, token);

// ---- auth ----
export const signup = (email, password) =>
  request("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) });
export const login = (email, password) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const getMe = (token) => request("/api/auth/me", {}, token);

// ---- courses (all require a token) ----
export const listCourses = (token) => request("/api/courses", {}, token);
export const createCourse = (name, token) =>
  request("/api/courses", { method: "POST", body: JSON.stringify({ name }) }, token);
export const deleteCourse = (courseId, token) =>
  request(`/api/courses/${courseId}`, { method: "DELETE" }, token);
export const getCoursePredictions = (courseId, token) =>
  request(`/api/courses/${courseId}/predictions`, {}, token);
export const deletePrediction = (predictionId, token) =>
  request(`/api/predictions/${predictionId}`, { method: "DELETE" }, token);
