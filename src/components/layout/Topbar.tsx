import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, Settings, X, CheckCheck, Info, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface TopbarProps { onMenuClick: () => void; }

interface Notif { id: number; type: 'info' | 'warning' | 'success'; title: string; body: string; time: string; read: boolean; }

const SAMPLE_NOTIFS: Notif[] = [
  { id: 1, type: 'info',    title: 'Nueva cita agendada',      body: 'Paciente #A412 – Dr. García – 10:30',    time: 'Hace 5 min',  read: false },
  { id: 2, type: 'warning', title: 'Resultado de lab listo',   body: 'Hemograma completo – Paciente #B301',    time: 'Hace 22 min', read: false },
  { id: 3, type: 'success', title: 'Pago registrado',          body: 'Factura #F-0091 marcada como pagada',    time: 'Hace 1 h',    read: false },
  { id: 4, type: 'info',    title: 'Cita en 30 minutos',       body: 'Paciente #C205 – Cardiología – 14:00',   time: 'Hace 2 h',    read: true  },
];

const notifIcon = { info: Info, warning: AlertCircle, success: CheckCheck };
const notifColor = { info: 'text-blue-500 bg-blue-50', warning: 'text-amber-500 bg-amber-50', success: 'text-emerald-500 bg-emerald-50' };

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs]         = useState(SAMPLE_NOTIFS);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const dismiss     = (id: number) => setNotifs(n => n.filter(x => x.id !== id));

  // close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    if (showNotifs) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'US';

  return (
    <header className="h-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between px-6 lg:px-8 shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden p-2 text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors" aria-label="Abrir menú">
          <Menu size={22} />
        </button>
        <div className="hidden sm:flex items-center bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-2.5 w-64 lg:w-80 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input type="text" placeholder="Buscar pacientes, citas..." className="bg-transparent border-none focus:outline-none ml-2 w-full text-sm font-medium text-gray-700 dark:text-gray-200 placeholder:text-gray-400" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 rounded-xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-sm"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-rose-500 h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-white">
                {unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-700">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Notificaciones</p>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline font-semibold">
                    Marcar todas como leídas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifs.length === 0 && (
                  <div className="p-6 text-center text-gray-400">
                    <Bell size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin notificaciones</p>
                  </div>
                )}
                {notifs.map(n => {
                  const NIcon  = notifIcon[n.type];
                  const colors = notifColor[n.type];
                  return (
                    <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${n.read ? 'opacity-60' : ''}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${colors}`}>
                        <NIcon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{n.body}</p>
                        <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">{n.time}</p>
                      </div>
                      <button onClick={() => dismiss(n.id)} className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5">
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-700">
                <button onClick={() => { setShowNotifs(false); navigate('/citas'); }} className="w-full flex items-center justify-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline">
                  <Calendar size={13} /> Ver agenda del día
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-100" />

        {/* Ajustes → /configuracion */}
        <button
          onClick={() => navigate('/configuracion')}
          className="flex items-center gap-2 p-1.5 pr-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all"
        >
          <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
          <Settings size={15} className="text-gray-500 dark:text-gray-400 hidden lg:block" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden lg:inline">Ajustes</span>
        </button>
      </div>
    </header>
  );
}
