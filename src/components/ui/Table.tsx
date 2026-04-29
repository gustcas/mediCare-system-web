import React from 'react';
import { Loader2 } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T) => string;
}

export function Table<T>({ columns, data, loading, emptyMessage = 'No hay datos', keyExtractor }: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50/50 dark:bg-gray-800/50">
            {columns.map(col => (
              <th key={col.key} className={`px-6 py-3.5 text-[10px] text-gray-400 font-black uppercase tracking-widest ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {data.map(row => (
            <tr key={keyExtractor(row)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className={`px-6 py-4 ${col.className || ''}`}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
