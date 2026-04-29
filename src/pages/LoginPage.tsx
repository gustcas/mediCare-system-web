import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, User, Lock, ChevronRight, Eye, EyeOff, UserPlus, ArrowLeft, Phone, FileText } from 'lucide-react';
import { authApi } from '../lib/api';
import { authStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const DOC_TYPES = ['DNI', 'PASSPORT', 'CE', 'RUC', 'OTHER'] as const;

function BrandPanel() {
  return (
    <div className="w-full md:w-5/12 bg-blue-600 text-white p-10 lg:p-14 flex flex-col justify-center items-center text-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
      </div>
      <div className="relative z-10">
        <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-md inline-block mb-6">
          <HeartPulse size={44} className="text-white" />
        </div>
        <h1 className="text-4xl font-black mb-3 tracking-tight">MediCare System</h1>
        <p className="text-blue-100 mb-8 text-base leading-relaxed max-w-xs mx-auto">
          Portal de gestión integral para personal médico y administrativo.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm font-medium">
          {['⚡ Rápido', '🛡️ Seguro', '🩺 Eficiente'].map(tag => (
            <span key={tag} className="bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: 'admin@medicare.com', password: 'Admin@2024!' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.post('/login', form);
      const { user, tokens } = res.data.data;
      authStore.setAuth(user, tokens.accessToken, tokens.refreshToken);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full md:w-7/12 p-10 lg:p-14 flex flex-col justify-center">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-1.5">Iniciar Sesión</h2>
        <p className="text-gray-500">Por favor ingrese sus credenciales de acceso</p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Correo Electrónico"
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          icon={<User size={17} />}
          placeholder="nombre@ejemplo.com"
          required
          autoComplete="email"
        />

        <div className="relative">
          <Input
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            icon={<Lock size={17} />}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 p-1"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
            <span className="text-gray-600">Recordarme</span>
          </label>
          <a href="#" className="text-blue-600 hover:underline font-semibold">¿Olvidó su contraseña?</a>
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full justify-center" icon={<ChevronRight size={18} />}>
          Ingresar al Sistema
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-600 font-semibold hover:underline"
          >
            Crear cuenta
          </button>
        </p>
        <p className="text-xs text-gray-400">Sistema de gestión médica · v1.0.0</p>
      </div>
    </div>
  );
}

function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    documentType: 'DNI' as string, documentNumber: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      setError('La contraseña debe tener al menos una mayúscula, una minúscula y un número');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.post('/register', {
        firstName:      form.firstName,
        lastName:       form.lastName,
        email:          form.email,
        password:       form.password,
        documentType:   form.documentType,
        documentNumber: form.documentNumber,
        phone:          form.phone || undefined,
      });
      const { user, tokens } = res.data.data;
      authStore.setAuth(user, tokens.accessToken, tokens.refreshToken);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full md:w-7/12 p-8 lg:p-12 flex flex-col justify-center overflow-y-auto">
      <button
        type="button"
        onClick={onSwitchToLogin}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 font-semibold w-fit"
      >
        <ArrowLeft size={15} /> Volver al inicio de sesión
      </button>

      <div className="mb-6">
        <h2 className="text-3xl font-black text-gray-900 mb-1.5">Crear Cuenta</h2>
        <p className="text-gray-500 text-sm">Completa tus datos para registrarte en el sistema</p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre *" value={form.firstName} onChange={set('firstName')} placeholder="Juan" required icon={<User size={15} />} />
          <Input label="Apellido *" value={form.lastName}  onChange={set('lastName')}  placeholder="Pérez" required />
        </div>

        {/* Email */}
        <Input label="Correo electrónico *" type="email" value={form.email} onChange={set('email')} placeholder="juan@ejemplo.com" required icon={<User size={15} />} autoComplete="email" />

        {/* Password */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Input
              label="Contraseña *"
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="Mín. 8 caracteres"
              required
              icon={<Lock size={15} />}
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <Input
            label="Confirmar contraseña *"
            type={showPwd ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            placeholder="Repetir contraseña"
            required
            icon={<Lock size={15} />}
          />
        </div>
        <p className="text-xs text-gray-400 -mt-2">Mínimo 8 caracteres · una mayúscula · una minúscula · un número</p>

        {/* Document */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1">
              <FileText size={13} /> Tipo de documento *
            </label>
            <select
              value={form.documentType}
              onChange={set('documentType')}
              required
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <Input label="Nº documento *" value={form.documentNumber} onChange={set('documentNumber')} placeholder="12345678" required icon={<FileText size={15} />} />
        </div>

        {/* Phone */}
        <Input label="Teléfono" value={form.phone} onChange={set('phone')} placeholder="+51 999 999 999" icon={<Phone size={15} />} />

        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-blue-700 font-medium">
            Al registrarte obtendrás acceso como <span className="font-black">paciente</span>. Para cuentas de personal médico o administrativo, contacta al administrador del sistema.
          </p>
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full justify-center" icon={<UserPlus size={18} />}>
          Crear mi cuenta
        </Button>
      </form>
    </div>
  );
}

export function LoginPage() {
  const [view, setView] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-gray-950 p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[560px]">
        <BrandPanel />
        {view === 'login'
          ? <LoginForm onSwitchToRegister={() => setView('register')} />
          : <RegisterForm onSwitchToLogin={() => setView('login')} />
        }
      </div>
    </div>
  );
}
