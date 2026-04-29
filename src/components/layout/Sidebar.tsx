import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity, Users, Calendar, FileText, Stethoscope,
  Settings, LogOut, HeartPulse, X, BedDouble,
  FlaskConical, Pill, DollarSign, Shield, ClipboardList, Package,
} from 'lucide-react';
import { authApi }   from '../../lib/api';
import { authStore } from '../../store/authStore';

const menuItems = [
  { to: '/dashboard',     label: 'Resumen General',       icon: Activity },
  { to: '/pacientes',     label: 'Pacientes',             icon: Users },
  { to: '/citas',         label: 'Citas',                 icon: Calendar },
  { to: '/expedientes',   label: 'Expedientes Clínicos',  icon: FileText },
  { to: '/admisiones',    label: 'Admisiones',            icon: BedDouble },
  { to: '/recetas',       label: 'Recetas',               icon: Pill },
  { to: '/laboratorio',   label: 'Laboratorio',           icon: FlaskConical },
  { to: '/facturacion',   label: 'Facturación',           icon: DollarSign },
  { to: '/planes-cuidado', label: 'Planes de Cuidados',   icon: ClipboardList },
  { to: '/seguros',        label: 'Seguros',              icon: Shield },
  { to: '/medicamentos',   label: 'Medicamentos',         icon: Package },
  { to: '/doctores',       label: 'Staff Médico',         icon: Stethoscope },
  { to: '/configuracion',  label: 'Configuración',        icon: Settings },
];

interface SidebarProps {
  open:    boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { user } = authStore.getState();

  const handleLogout = async () => {
    try {
      const rt = localStorage.getItem('medicare_refresh_token');
      await authApi.post('/logout', { refreshToken: rt });
    } catch { /* ignore */ } finally {
      authStore.clearAuth();
      navigate('/login');
    }
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'US';

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-64 shadow-2xl z-30 flex flex-col
        bg-white dark:bg-gray-900
        border-r border-gray-100 dark:border-gray-700/50
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static
      `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-50 dark:border-gray-700/50">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-xl">
              <HeartPulse size={20} className="text-white" />
            </div>
            <span className="text-lg font-black text-gray-900 dark:text-white">MediCare</span>
          </div>
          <button className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200/50'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-white' : ''} />
                  <span className="font-semibold">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-50 dark:border-gray-700/50">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl mb-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-xs">{user?.fullName || 'Usuario'}</p>
              <p className="text-gray-400 text-xs truncate">{user?.roles[0] || 'Sin rol'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors font-semibold text-sm"
          >
            <LogOut size={17} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
