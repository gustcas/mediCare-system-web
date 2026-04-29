import { useState } from 'react';
import { Plus, Search, Eye, Trash2, Phone, MapPin, Droplets, User, Calendar } from 'lucide-react';
import { Button }  from '../components/ui/Button';
import { Input }   from '../components/ui/Input';
import { Card }    from '../components/ui/Card';
import { Badge }   from '../components/ui/Badge';
import { Modal }   from '../components/ui/Modal';
import { Table }   from '../components/ui/Table';
import { usePatients, useCreatePatient, useDeletePatient, Patient, CreatePatientDto } from '../hooks/usePatients';
import { useToast } from '../hooks/useToast';

const BLOOD_TYPES = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];
const DOC_TYPES   = ['DNI', 'PASSPORT', 'CE', 'RUC', 'OTHER'];
const GENDER_LABEL: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Femenino', OTHERS: 'Otro' };
const BLOOD_TYPE_LABEL: Record<string, string> = {
  A_POS: 'A+', A_NEG: 'A−', B_POS: 'B+', B_NEG: 'B−',
  AB_POS: 'AB+', AB_NEG: 'AB−', O_POS: 'O+', O_NEG: 'O−',
};

const EMPTY: CreatePatientDto = {
  firstName: '', lastName: '', documentType: 'DNI', documentNumber: '',
  phone: '', address: '', dateOfBirth: '', gender: 'MALE', bloodType: '',
};

function calcAge(dob: string) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function PatientDetailModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const initials = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  const age = calcAge(patient.dateOfBirth);

  const infoRows = [
    { icon: User,     label: 'Género',           value: GENDER_LABEL[patient.gender] ?? patient.gender },
    { icon: Calendar, label: 'Fecha de nacimiento', value: `${new Date(patient.dateOfBirth).toLocaleDateString('es-PE')} (${age} años)` },
    { icon: Droplets, label: 'Tipo de sangre',    value: patient.bloodType ? BLOOD_TYPE_LABEL[patient.bloodType] ?? patient.bloodType : '—' },
    { icon: Phone,    label: 'Teléfono',          value: patient.phone ?? '—' },
    { icon: MapPin,   label: 'Dirección',         value: patient.address ?? '—' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-black shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">{patient.firstName} {patient.lastName}</h2>
          <p className="text-sm text-gray-400">{patient.documentType} {patient.documentNumber ?? '—'}</p>
          <div className="flex gap-2 mt-1.5">
            <Badge variant="info">{GENDER_LABEL[patient.gender] ?? patient.gender}</Badge>
            {patient.bloodType && (
              <Badge variant="danger">{BLOOD_TYPE_LABEL[patient.bloodType] ?? patient.bloodType}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="space-y-3">
        {infoRows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={15} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ID info */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ID del sistema</p>
        <p className="text-xs font-mono text-gray-600 break-all">{patient.id}</p>
        <p className="text-xs text-gray-400 mt-1.5">
          Registrado el {new Date(patient.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Button variant="secondary" className="w-full justify-center" onClick={onClose}>Cerrar</Button>
    </div>
  );
}

function PatientForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreatePatientDto>(EMPTY);
  const create = useCreatePatient();
  const { success } = useToast();

  const set = (field: keyof CreatePatientDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreatePatientDto = {
      ...form,
      bloodType:      form.bloodType      || undefined,
      documentType:   form.documentType   || undefined,
      documentNumber: form.documentNumber || undefined,
      phone:          form.phone          || undefined,
      address:        form.address        || undefined,
    };
    await create.mutateAsync(payload);
    success('Paciente registrado', `${form.firstName} ${form.lastName} fue guardado correctamente`);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nombre *"   value={form.firstName} onChange={set('firstName')} required placeholder="Juan" />
        <Input label="Apellido *" value={form.lastName}  onChange={set('lastName')}  required placeholder="Pérez" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">Tipo documento</label>
          <select value={form.documentType} onChange={set('documentType')}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 font-medium text-gray-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm">
            {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <Input label="Nº documento" value={form.documentNumber ?? ''} onChange={set('documentNumber')} placeholder="12345678" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Fecha nacimiento *" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} required />
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">Género *</label>
          <select value={form.gender} onChange={set('gender')}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 font-medium text-gray-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm">
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Femenino</option>
            <option value="OTHERS">Otro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">Tipo de sangre</label>
          <select value={form.bloodType} onChange={set('bloodType')}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 font-medium text-gray-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm">
            <option value="">No especificado</option>
            {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{BLOOD_TYPE_LABEL[bt] ?? bt}</option>)}
          </select>
        </div>
        <Input label="Teléfono" value={form.phone ?? ''} onChange={set('phone')} placeholder="+51 999 999 999" />
      </div>

      <Input label="Dirección" value={form.address ?? ''} onChange={set('address')} placeholder="Av. Lima 123" />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
        <Button type="submit" loading={create.isPending} className="flex-1 justify-center">Guardar paciente</Button>
      </div>
    </form>
  );
}

export function PatientsPage() {
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const { data, isLoading }   = usePatients(page, 20, debouncedSearch);
  const deletePatient         = useDeletePatient();
  const { success, error }    = useToast();

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 400);
  };

  const handleDelete = async (p: Patient) => {
    if (!confirm(`¿Eliminar a ${p.firstName} ${p.lastName}?`)) return;
    try {
      await deletePatient.mutateAsync(p.id);
      success('Paciente eliminado');
    } catch { error('Error al eliminar'); }
  };

  const columns = [
    {
      key: 'id',
      header: 'Paciente',
      render: (row: Patient) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-sm">
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-gray-400">{row.documentType} {row.documentNumber ?? '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'dateOfBirth', header: 'F. Nacimiento', render: (row: Patient) => (
      <div>
        <span className="text-sm text-gray-600">{new Date(row.dateOfBirth).toLocaleDateString('es-PE')}</span>
        <span className="text-xs text-gray-400 ml-1">({calcAge(row.dateOfBirth)} años)</span>
      </div>
    )},
    { key: 'gender',    header: 'Género',  render: (row: Patient) => <Badge variant="info">{GENDER_LABEL[row.gender] || row.gender}</Badge> },
    { key: 'bloodType', header: 'Sangre',  render: (row: Patient) => row.bloodType ? <Badge variant="danger">{BLOOD_TYPE_LABEL[row.bloodType] ?? row.bloodType}</Badge> : <span className="text-gray-300 text-sm">—</span> },
    { key: 'phone',     header: 'Teléfono', render: (row: Patient) => <span className="text-sm text-gray-600">{row.phone ?? '—'}</span> },
    {
      key: 'actions',
      header: '',
      render: (row: Patient) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => setViewPatient(row)}>Ver</Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(row)} className="text-rose-400 hover:text-rose-600" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Gestión de Pacientes</h1>
          <p className="text-gray-400 mt-0.5">{data?.total ?? 0} pacientes registrados</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Nuevo Paciente</Button>
      </div>

      <Card padding="sm">
        <div className="p-3">
          <Input value={search} onChange={e => handleSearch(e.target.value)} icon={<Search size={16} />} placeholder="Buscar por nombre, DNI, teléfono..." />
        </div>

        <div className="hidden sm:block">
          <Table columns={columns} data={data?.items || []} loading={isLoading} emptyMessage="No hay pacientes registrados" keyExtractor={r => r.id} />
        </div>

        <div className="sm:hidden divide-y divide-gray-50">
          {isLoading && <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>}
          {!isLoading && !data?.items?.length && <div className="p-6 text-center text-gray-400 text-sm">No hay pacientes</div>}
          {data?.items?.map(p => (
            <div key={p.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-gray-400">{p.documentType} {p.documentNumber ?? '—'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => setViewPatient(p)} />
              </div>
              <div className="flex gap-2">
                <Badge variant="info">{GENDER_LABEL[p.gender] || p.gender}</Badge>
                {p.bloodType && <Badge variant="danger">{BLOOD_TYPE_LABEL[p.bloodType] ?? p.bloodType}</Badge>}
              </div>
              {p.phone && <p className="text-xs text-gray-500">{p.phone}</p>}
            </div>
          ))}
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
            <span className="text-sm font-medium text-gray-500">Página {page} de {data.totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>Siguiente</Button>
          </div>
        )}
      </Card>

      {/* New patient modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Paciente" size="md">
        <PatientForm onClose={() => setModalOpen(false)} />
      </Modal>

      {/* Patient detail modal */}
      <Modal open={!!viewPatient} onClose={() => setViewPatient(null)} title="Detalle del Paciente" size="sm">
        {viewPatient && <PatientDetailModal patient={viewPatient} onClose={() => setViewPatient(null)} />}
      </Modal>
    </div>
  );
}
