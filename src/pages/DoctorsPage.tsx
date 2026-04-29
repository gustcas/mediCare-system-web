import { useState } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, medicalApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card }   from '../components/ui/Card';
import { Badge }  from '../components/ui/Badge';
import { Table }  from '../components/ui/Table';
import { Modal }  from '../components/ui/Modal';
import { Input }  from '../components/ui/Input';
import { useToast } from '../hooks/useToast';

interface Doctor {
  id:            string;
  userId:        string;
  firstName?:    string;
  lastName?:     string;
  licenseNumber: string;
  bio?:          string;
  isActive:      boolean;
  specialties:   Array<{ specialty: { name: string }; type: string }>;
  availability:  Array<{ dayOfWeek: string; startTime: string; endTime: string }>;
}

interface Specialty { id: string; name: string; }

function useDoctors(page = 1) {
  return useQuery({
    queryKey: ['doctors', page],
    queryFn: async () => {
      const res = await medicalApi.get(`/doctors?page=${page}`);
      return res.data.data as { items: Doctor[]; total: number; totalPages: number };
    },
  });
}

function useSpecialties() {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const res = await medicalApi.get('/specialties');
      return res.data.data as Specialty[];
    },
  });
}

const dayLabels: Record<string, string> = {
  MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mié',
  THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb', SUNDAY: 'Dom',
};

const DOC_TYPES = ['DNI', 'PASSPORT', 'CE', 'RUC', 'OTHER'] as const;

function doctorName(d: Doctor) {
  if (d.firstName || d.lastName) return `Dr. ${d.firstName ?? ''} ${d.lastName ?? ''}`.trim();
  return `Dr. Lic. ${d.licenseNumber}`;
}

function doctorInitials(d: Doctor) {
  if (d.firstName && d.lastName) return `${d.firstName[0]}${d.lastName[0]}`.toUpperCase();
  return d.licenseNumber.slice(0, 2).toUpperCase();
}

const EMPTY_FORM = {
  // Auth user fields
  email: '', password: '', documentType: 'DNI' as string, documentNumber: '',
  // Doctor profile fields
  firstName: '', lastName: '', licenseNumber: '', bio: '', specialtyIds: [] as string[],
};

export function DoctorsPage() {
  const [page, setPage]         = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [showPwd, setShowPwd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');
  const { data, isLoading }     = useDoctors(page);
  const { data: specialties }   = useSpecialties();
  const { success }             = useToast();
  const qc                      = useQueryClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Frontend validation: email must have a valid TLD
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email);
    if (!emailOk) {
      setFormError('Correo electrónico inválido. Ejemplo correcto: doctor@clinica.com');
      return;
    }
    // Password: min 8, uppercase, lowercase, digit
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password) || form.password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
      return;
    }

    setSaving(true);
    try {
      // Step 1: create auth user
      const authRes = await authApi.post('/register', {
        email:          form.email,
        password:       form.password,
        documentType:   form.documentType,
        documentNumber: form.documentNumber,
        firstName:      form.firstName || 'Doctor',
        lastName:       form.lastName  || 'Nuevo',
      });
      const userId: string = authRes.data.data.user.id;

      // Step 2: create doctor profile
      await medicalApi.post('/doctors', {
        userId,
        firstName:     form.firstName     || undefined,
        lastName:      form.lastName      || undefined,
        licenseNumber: form.licenseNumber,
        bio:           form.bio           || undefined,
        specialtyIds:  form.specialtyIds.length ? form.specialtyIds : undefined,
      });

      qc.invalidateQueries({ queryKey: ['doctors'] });
      success('Doctor registrado', `${form.firstName} ${form.lastName} fue creado con acceso al sistema.`);
      setShowCreate(false);
      setForm(EMPTY_FORM);
    } catch {
      // errors are shown by the axios interceptor
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (id: string) => {
    setForm(f => ({
      ...f,
      specialtyIds: f.specialtyIds.includes(id)
        ? f.specialtyIds.filter(s => s !== id)
        : [...f.specialtyIds, id],
    }));
  };

  const columns = [
    {
      key: 'doctor',
      header: 'Doctor',
      render: (row: Doctor) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
            {doctorInitials(row)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{doctorName(row)}</p>
            <p className="text-xs text-gray-400">Lic: {row.licenseNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'specialties',
      header: 'Especialidades',
      render: (row: Doctor) => (
        <div className="flex flex-wrap gap-1">
          {row.specialties?.slice(0, 2).map((s, i) => <Badge key={i} variant="info">{s.specialty.name}</Badge>)}
          {(row.specialties?.length || 0) > 2 && <Badge>+{row.specialties.length - 2}</Badge>}
          {(row.specialties?.length || 0) === 0 && <span className="text-xs text-gray-400">Sin especialidad</span>}
        </div>
      ),
    },
    {
      key: 'availability',
      header: 'Disponibilidad',
      render: (row: Doctor) => (
        <div className="flex flex-wrap gap-1">
          {row.availability?.map(a => (
            <span key={a.dayOfWeek} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {dayLabels[a.dayOfWeek] || a.dayOfWeek}
            </span>
          ))}
          {(row.availability?.length || 0) === 0 && <span className="text-xs text-gray-400">No definida</span>}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (row: Doctor) => <Badge variant={row.isActive ? 'success' : 'danger'}>{row.isActive ? 'Activo' : 'Inactivo'}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Staff Médico</h1>
          <p className="text-gray-400 mt-0.5">{data?.total ?? 0} doctores registrados</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Nuevo Doctor</Button>
      </div>

      <Card padding="none">
        <div className="hidden sm:block">
          <Table columns={columns} data={data?.items || []} loading={isLoading} emptyMessage="No hay doctores registrados" keyExtractor={r => r.id} />
        </div>
        <div className="sm:hidden divide-y divide-gray-50">
          {isLoading && <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>}
          {data?.items?.map(d => (
            <div key={d.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">{doctorInitials(d)}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{doctorName(d)}</p>
                    <p className="text-xs text-gray-400">Lic: {d.licenseNumber}</p>
                  </div>
                </div>
                <Badge variant={d.isActive ? 'success' : 'danger'}>{d.isActive ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {d.specialties?.map((s, i) => <Badge key={i} variant="info">{s.specialty.name}</Badge>)}
              </div>
            </div>
          ))}
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
            <span className="text-sm text-gray-500">Página {page} de {data.totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>Siguiente</Button>
          </div>
        )}
      </Card>

      {/* Create Doctor Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setFormError(''); setForm(EMPTY_FORM); }} title="Nuevo Doctor" size="lg">
        <form onSubmit={handleCreate} className="space-y-5">

          {/* Doctor profile section */}
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Datos del médico</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Nombre" placeholder="Carlos" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                <Input label="Apellido" placeholder="Pérez" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
              <Input label="Número de licencia *" placeholder="CMP-12345" value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} required />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Biografía / Descripción</label>
                <textarea
                  rows={2}
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Especialización, experiencia…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Specialties */}
          {specialties && specialties.length > 0 && (
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Especialidades</p>
              <div className="flex flex-wrap gap-2">
                {specialties.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSpecialty(s.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                      form.specialtyIds.includes(s.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Auth account section */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Cuenta de acceso al sistema</p>
            <div className="space-y-3">
              <Input label="Correo electrónico *" type="email" placeholder="doctor@clinica.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              <div className="relative">
                <Input
                  label="Contraseña *"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Mín. 8 caracteres, mayúscula, número"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Tipo documento *</label>
                  <select
                    value={form.documentType}
                    onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <Input label="Nº documento *" placeholder="12345678" value={form.documentNumber} onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))} required />
              </div>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-sm font-medium text-rose-600">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowCreate(false); setFormError(''); setForm(EMPTY_FORM); }}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={saving}>Registrar Doctor</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
