import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "report-card:history";
const MAX_ENTRIES = 8;

function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function usePredictionHistory() {
  const [history, setHistory] = useState(readHistory);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // storage full or unavailable — fail silently, history is non-critical
    }
  }, [history]);

  const addEntry = useCallback((values, result) => {
    setHistory((prev) => {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        values,
        predicted_score: result.predicted_score,
        grade: result.grade,
      };
      return [entry, ...prev].slice(0, MAX_ENTRIES);
    });
  }, []);

  const removeEntry = useCallback((id) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return { history, addEntry, removeEntry, clearHistory };
}
