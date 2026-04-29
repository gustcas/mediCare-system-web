import { useState, useEffect } from 'react';
import { authStore } from '../store/authStore';

export function useAuth() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsub = authStore.subscribe(() => forceUpdate(n => n + 1));
    return () => { unsub(); };
  }, []);

  return {
    ...authStore.getState(),
    setAuth: authStore.setAuth,
    clearAuth: authStore.clearAuth,
    hasRole: authStore.hasRole,
    hasPermission: authStore.hasPermission,
  };
}
