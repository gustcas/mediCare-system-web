import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  loading?: boolean;
}

export function SearchSelect({ label, value, onChange, options, placeholder = 'Buscar...', required, loading }: SearchSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = query
    ? options.filter(o => `${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:border-gray-300 dark:hover:border-gray-500"
        >
          <Search size={14} className="text-gray-400 shrink-0" />
          <span className={`flex-1 truncate ${selected ? 'text-gray-800 dark:text-gray-100 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
            {selected ? selected.label : placeholder}
          </span>
          {selected ? (
            <X size={14} className="text-gray-400 hover:text-gray-600 shrink-0" onClick={handleClear} />
          ) : (
            <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          )}
        </button>

        {open && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Escribir para filtrar..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {loading && <p className="p-3 text-center text-xs text-gray-400">Cargando...</p>}
              {!loading && filtered.length === 0 && (
                <p className="p-3 text-center text-xs text-gray-400">Sin resultados</p>
              )}
              {filtered.slice(0, 100).map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSelect(o)}
                  className={`w-full flex flex-col items-start px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left transition-colors ${value === o.value ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                >
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{o.label}</span>
                  {o.sublabel && <span className="text-xs text-gray-400 mt-0.5">{o.sublabel}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          onChange={() => {}}
          required
          className="sr-only"
        />
      )}
    </div>
  );
}
