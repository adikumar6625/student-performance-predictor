import { useEffect, useState } from "react";
import { getMe, login as apiLogin, signup as apiSignup } from "./api";
import { useLocalStorageState } from "./useLocalStorageState";

export function useAuth() {
  const [token, setToken] = useLocalStorageState("report-card:auth-token", null);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    getMe(token)
      .then(setUser)
      .catch(() => {
        // token expired/invalid — clear it silently, fall back to guest mode
        setToken(null);
        setUser(null);
      })
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const signup = async (email, password) => {
    const res = await apiSignup(email, password);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return { token, user, checking, isAuthed: !!user, login, signup, logout };
}
