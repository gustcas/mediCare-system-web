import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id:      string;
  type:    ToastType;
  title:   string;
  message?: string;
}

interface ToastProps extends ToastItem {
  onDismiss: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle  size={20} className="text-emerald-500" />,
  error:   <XCircle      size={20} className="text-rose-500"    />,
  warning: <AlertTriangle size={20} className="text-amber-500"  />,
  info:    <Info         size={20} className="text-blue-500"    />,
};

const borders: Record<ToastType, string> = {
  success: 'border-l-4 border-emerald-500',
  error:   'border-l-4 border-rose-500',
  warning: 'border-l-4 border-amber-500',
  info:    'border-l-4 border-blue-500',
};

export function Toast({ id, type, title, message, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), type === 'error' ? 6000 : 4000);
    return () => clearTimeout(t);
  }, [id, type, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4 min-w-[280px] max-w-sm animate-slide-in ${borders[type]}`}
      role="alert"
    >
      <span className="mt-0.5 flex-shrink-0">{icons[type]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{title}</p>
        {message && <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
