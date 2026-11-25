import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const AlertCountContext = createContext({
  openAlerts: 0,
  criticalAlerts: 0,
  refresh: () => {},
});

export function AlertCountProvider({ children }) {
  const { user } = useAuth();
  const [openAlerts, setOpenAlerts] = useState(0);
  const [criticalAlerts, setCriticalAlerts] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setOpenAlerts(0);
      setCriticalAlerts(0);
      return;
    }
    try {
      const res = await api.get('/alerts/count');
      if (res) {
        setOpenAlerts(res.open ?? 0);
        setCriticalAlerts(res.critical ?? 0);
      }
    } catch {
      // ignore error
    }
  }, [user]);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        refresh();
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <AlertCountContext.Provider value={{ openAlerts, criticalAlerts, refresh }}>
      {children}
    </AlertCountContext.Provider>
  );
}

export function useAlertCount() {
  return useContext(AlertCountContext);
}
