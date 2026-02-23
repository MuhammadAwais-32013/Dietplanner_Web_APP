import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

const API_URL = 'http://127.0.0.1:8000/api';

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Logout helper (stable reference) ──────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionExpiry');
    localStorage.removeItem('chat_session_id');
    setIsLoggedIn(false);
    setUserName('');
    setUserId(null);
  }, []);

  // ── Restore session from localStorage on mount ─────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const sessionExpiry = localStorage.getItem('sessionExpiry');

    if (storedUser && sessionExpiry) {
      const expiryTime = parseInt(sessionExpiry);
      if (Date.now() > expiryTime) {
        // Expired – clear everything
        logout();
      } else {
        try {
          const user = JSON.parse(storedUser);
          setIsLoggedIn(true);
          setUserName(user.name || '');
          setUserId(user.id || null);
        } catch {
          logout();
        }
      }
    }
    setIsLoading(false);
  }, [logout]);

  // ── Periodic server-side session validation ────────────────────────────────
  // Every 60 s, ping a lightweight endpoint. If the server is unreachable
  // OR returns 401/403 → auto-logout.
  useEffect(() => {
    if (!isLoggedIn) return;

    const validate = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/validate`, {
          method: 'GET',
          // 8-second timeout so we don't wait forever if the server is down
          signal: AbortSignal.timeout(8000),
        });
        // Treat any 4xx/5xx that signals "not authenticated" as a logout
        if (res.status === 401 || res.status === 403) {
          logout();
        }
        // If the server returns something else (e.g. 404 because the endpoint
        // doesn't exist yet) we intentionally do NOT log the user out – only
        // a clear "unauthorized" response triggers auto-logout.
      } catch (err) {
        // Network error / server down → log out
        if (err.name === 'AbortError' || err.name === 'TypeError') {
          logout();
        }
      }
    };

    // Run immediately, then every 60 s
    validate();
    const interval = setInterval(validate, 60_000);
    return () => clearInterval(interval);
  }, [isLoggedIn, logout]);

  // ── Cross-tab / cross-window sync ─────────────────────────────────────────
  // If another tab calls logout() and clears localStorage, this tab should
  // follow immediately via the 'storage' event.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user' && e.newValue === null) {
        // Another tab removed the user → log this tab out too
        setIsLoggedIn(false);
        setUserName('');
        setUserId(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = (userData) => {
    const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('sessionExpiry', expiryTime.toString());
    setIsLoggedIn(true);
    setUserName(userData.name || '');
    setUserId(userData.id || null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userName, userId, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);