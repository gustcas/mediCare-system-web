import { useState, useCallback } from 'react';
import { ToastItem, ToastType } from '../components/ui/Toast';

let counter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${++counter}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const success = useCallback((title: string, message?: string) => toast('success', title, message), [toast]);
  const error   = useCallback((title: string, message?: string) => toast('error',   title, message), [toast]);
  const warning = useCallback((title: string, message?: string) => toast('warning', title, message), [toast]);
  const info    = useCallback((title: string, message?: string) => toast('info',    title, message), [toast]);

  return { toasts, dismiss, toast, success, error, warning, info };
}

// Global singleton para usar fuera de componentes (interceptor Axios)
type ToastFn = (type: ToastType, title: string, message?: string) => void;
let _globalToast: ToastFn | null = null;

export function registerGlobalToast(fn: ToastFn) { _globalToast = fn; }

export function globalToast(type: ToastType, title: string, message?: string) {
  _globalToast?.(type, title, message);
}
