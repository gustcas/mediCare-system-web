import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export function Input({ label, error, icon, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3
            bg-gray-50 dark:bg-gray-800
            rounded-xl border
            ${error
              ? 'border-rose-400 focus:ring-rose-100 focus:border-rose-500'
              : 'border-gray-200 dark:border-gray-600 focus:ring-blue-100 focus:border-blue-500'}
            focus:ring-4 outline-none transition-all
            font-medium text-gray-700 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
