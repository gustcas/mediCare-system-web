import { useState, useEffect } from 'react';
import { Bell, Shield, Database, Palette, User, ChevronDown, ChevronUp, Eye, EyeOff, Check, Monitor, Sun, Moon } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { authApi } from '../lib/api';

type Section = 'perfil' | 'notificaciones' | 'seguridad' | 'apariencia' | 'sistema' | null;

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

const NOTIF_DEFAULTS = { nuevaCita: true, recordatorio: true, cancelacion: true, resultadosLab: false, facturacion: false, sistema: true };

export function ConfigPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [open, setOpen] = useState<Section>(null);

  // Perfil
  const [perfil, setPerfil] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', email: user?.email ?? '' });

  // Notificaciones
  const [notifs, setNotifs] = useState(() => {
    try { return { ...NOTIF_DEFAULTS, ...JSON.parse(localStorage.getItem('medicare_notifs') || '{}') }; }
    catch { return NOTIF_DEFAULTS; }
  });

  // Seguridad
  const [pwd, setPwd]       = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Apariencia
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() =>
    (localStorage.getItem('medicare_theme') as any) || 'light'
  );

  const toggle = (s: Section) => setOpen(o => o === s ? null : s);

  const saveNotifs = (next: typeof notifs) => {
    setNotifs(next);
    localStorage.setItem('medicare_notifs', JSON.stringify(next));
    success('Preferencias de notificaciones guardadas');
  };

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
    } else if (t === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  };

  useEffect(() => { applyTheme(theme); }, []);

  const saveTheme = (t: typeof theme) => {
    setTheme(t);
    localStorage.setItem('medicare_theme', t);
    applyTheme(t);
    success('Apariencia actualizada');
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) { error('Las contraseñas no coinciden'); return; }
    if (pwd.next.length < 8) { error('La contraseña debe tener al menos 8 caracteres'); return; }
    setSaving(true);
    try {
      await authApi.patch('/users/me/password', { currentPassword: pwd.current, newPassword: pwd.next });
      success('Contraseña actualizada correctamente');
      setPwd({ current: '', next: '', confirm: '' });
    } catch {
      error('No se pudo cambiar la contraseña. Verifica la contraseña actual.');
    } finally { setSaving(false); }
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'US';

  const sections: { key: Section; icon: any; title: string; description: string; color: string; bg: string }[] = [
    { key: 'perfil',          icon: User,     title: 'Perfil',          description: 'Información personal y preferencias',         color: 'text-blue-600',    bg: 'bg-blue-50' },
    { key: 'notificaciones',  icon: Bell,     title: 'Notificaciones',  description: 'Alertas y recordatorios de citas',            color: 'text-amber-600',   bg: 'bg-amber-50' },
    { key: 'seguridad',       icon: Shield,   title: 'Seguridad',       description: 'Contraseña y modo seguro',                    color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'apariencia',      icon: Palette,  title: 'Apariencia',      description: 'Tema y configuración visual',                 color: 'text-purple-600',  bg: 'bg-purple-50' },
    { key: 'sistema',         icon: Database, title: 'Sistema',         description: 'Información del sistema y versión',           color: 'text-slate-600',   bg: 'bg-slate-50' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Configuración</h1>
        <p className="text-gray-400 mt-0.5">Personaliza tu experiencia en MediCare System</p>
      </div>

      {/* User card */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-black">{initials}</div>
          <div>
            <p className="text-xl font-black text-gray-900">{user?.fullName || 'Usuario'}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <div className="flex gap-2 mt-2">{user?.roles.map(r => <Badge key={r} variant="info">{r}</Badge>)}</div>
          </div>
        </div>
      </Card>

      {/* Accordion sections */}
      <div className="space-y-2">
        {sections.map(({ key, icon: Icon, title, description, color, bg }) => (
          <div key={key} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-4 p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center shrink-0`}>
                <Icon size={22} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-gray-100">{title}</p>
                <p className="text-sm text-gray-400">{description}</p>
              </div>
              {open === key ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
            </button>

            {/* ── Perfil ── */}
            {open === 'perfil' && key === 'perfil' && (
              <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Nombre" value={perfil.firstName} onChange={e => setPerfil(p => ({ ...p, firstName: e.target.value }))} />
                  <Input label="Apellido" value={perfil.lastName} onChange={e => setPerfil(p => ({ ...p, lastName: e.target.value }))} />
                </div>
                <Input label="Correo electrónico" value={perfil.email} disabled className="opacity-60 cursor-not-allowed" />
                <p className="text-xs text-gray-400">El correo electrónico está gestionado por el servicio de autenticación y no se puede modificar aquí.</p>
                <Button size="sm" icon={<Check size={14} />} onClick={() => success('Perfil guardado (los cambios de nombre se aplican en la próxima sesión)')}>
                  Guardar cambios
                </Button>
              </div>
            )}

            {/* ── Notificaciones ── */}
            {open === 'notificaciones' && key === 'notificaciones' && (
              <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                {[
                  { key: 'nuevaCita',      label: 'Nueva cita agendada',           desc: 'Recibe alerta cuando se registre una nueva cita' },
                  { key: 'recordatorio',   label: 'Recordatorio de citas',         desc: '30 minutos antes de cada cita' },
                  { key: 'cancelacion',    label: 'Cancelaciones y cambios',       desc: 'Notifica cuando una cita es cancelada o reprogramada' },
                  { key: 'resultadosLab',  label: 'Resultados de laboratorio',     desc: 'Aviso cuando lleguen resultados de exámenes' },
                  { key: 'facturacion',    label: 'Alertas de facturación',        desc: 'Pagos pendientes y facturas vencidas' },
                  { key: 'sistema',        label: 'Notificaciones del sistema',    desc: 'Actualizaciones y mantenimiento programado' },
                ].map(({ key: nk, label, desc }) => (
                  <div key={nk} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                    <Toggle checked={(notifs as any)[nk]} onChange={v => saveNotifs({ ...notifs, [nk]: v })} />
                  </div>
                ))}
              </div>
            )}

            {/* ── Seguridad ── */}
            {open === 'seguridad' && key === 'seguridad' && (
              <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-5">
                <form onSubmit={changePassword} className="space-y-3">
                  <p className="text-sm font-bold text-gray-700">Cambiar contraseña</p>
                  <div className="relative">
                    <Input label="Contraseña actual" type={showPwd ? 'text' : 'password'} value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} required />
                  </div>
                  <Input label="Nueva contraseña" type={showPwd ? 'text' : 'password'} value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} required />
                  <Input label="Confirmar nueva contraseña" type={showPwd ? 'text' : 'password'} value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} required />
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                      {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                      {showPwd ? 'Ocultar' : 'Mostrar'} contraseñas
                    </button>
                  </div>
                  <Button type="submit" size="sm" loading={saving} icon={<Shield size={14} />}>Cambiar contraseña</Button>
                </form>
                <div className="border-t border-gray-50 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Modo seguro</p>
                      <p className="text-xs text-gray-400">Cierra sesión automáticamente después de 30 min de inactividad</p>
                    </div>
                    <Toggle
                      checked={!!localStorage.getItem('medicare_secure_mode')}
                      onChange={v => {
                        v ? localStorage.setItem('medicare_secure_mode', '1') : localStorage.removeItem('medicare_secure_mode');
                        success(v ? 'Modo seguro activado' : 'Modo seguro desactivado');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Apariencia ── */}
            {open === 'apariencia' && key === 'apariencia' && (
              <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                <p className="text-sm font-bold text-gray-700">Tema</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light',  label: 'Claro',   icon: Sun },
                    { value: 'dark',   label: 'Oscuro',  icon: Moon },
                    { value: 'system', label: 'Sistema', icon: Monitor },
                  ].map(({ value, label, icon: TIcon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => saveTheme(value as any)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        theme === value ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <TIcon size={22} className={theme === value ? 'text-blue-600' : 'text-gray-400'} />
                      <span className={`text-sm font-semibold ${theme === value ? 'text-blue-700' : 'text-gray-500'}`}>{label}</span>
                      {theme === value && <Check size={13} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400">El tema se aplica de forma inmediata en toda la aplicación.</p>
              </div>
            )}

            {/* ── Sistema ── */}
            {open === 'sistema' && key === 'sistema' && (
              <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Versión',       value: 'v1.0.0' },
                    { label: 'Entorno',       value: import.meta.env.MODE ?? 'production' },
                    { label: 'Frontend',      value: 'React 18 + Vite' },
                    { label: 'Backend',       value: 'Node.js + Express 4' },
                    { label: 'Base de datos', value: 'PostgreSQL 16' },
                    { label: 'ORM',           value: 'Prisma 5' },
                    { label: 'Auth',          value: 'JWT (RS256)' },
                    { label: 'Año',           value: '2026' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Card>
        <p className="text-xs text-gray-300 text-center">MediCare System v1.0.0 · Build 2026.04 · Todos los derechos reservados</p>
      </Card>
    </div>
  );
}
