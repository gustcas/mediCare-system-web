import { useState } from 'react';
import { Calendar, Plus, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge, AppointmentStatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { SearchSelect } from '../components/ui/SearchSelect';
import { Input } from '../components/ui/Input';
import { useAppointments, useCreateAppointment } from '../hooks/useAppointments';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
}

function usePatientsLookup() {
  return useQuery({
    queryKey: ['patients-lookup'],
    queryFn: async () => {
      const res = await medicalApi.get('/patients?limit=200');
      return (res.data.data.items ?? []) as { id: string; firstName: string; lastName: string; documentNumber?: string }[];
    },
  });
}

function useDoctorsLookup() {
  return useQuery({
    queryKey: ['doctors-lookup'],
    queryFn: async () => {
      const res = await medicalApi.get('/doctors?limit=200');
      return (res.data.data.items ?? []) as { id: string; firstName?: string; lastName?: string; licenseNumber: string }[];
    },
  });
}

export function AppointmentsPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useAppointments({ date });
  const create = useCreateAppointment();
  const { data: patients, isLoading: loadingPatients } = usePatientsLookup();
  const { data: doctors,  isLoading: loadingDoctors  } = useDoctorsLookup();

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    scheduledAt: '',
    endAt: '',
    type: 'IN_PERSON',
    reason: '',
  });

  const patientOptions = (patients ?? []).map(p => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName}`,
    sublabel: p.documentNumber ? `DNI: ${p.documentNumber}` : undefined,
  }));

  const doctorOptions = (doctors ?? []).map(d => ({
    value: d.id,
    label: d.firstName ? `Dr. ${d.firstName} ${d.lastName ?? ''}`.trim() : `Lic. ${d.licenseNumber}`,
    sublabel: `Lic: ${d.licenseNumber}`,
  }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({
        ...form,
        // datetime-local gives "2026-04-29T10:57" — convert to full ISO string
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        endAt:       new Date(form.endAt).toISOString(),
      });
      setModalOpen(false);
      setForm({ patientId: '', doctorId: '', scheduledAt: '', endAt: '', type: 'IN_PERSON', reason: '' });
    } catch { /* errors handled by interceptor */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Calendario de Citas</h1>
          <p className="text-gray-400 mt-0.5">{data?.total ?? 0} citas encontradas</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Nueva Cita</Button>
      </div>

      {/* Date filter */}
      <Card padding="sm">
        <div className="p-3 flex items-center gap-3">
          <Calendar size={18} className="text-blue-500 shrink-0" />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-semibold text-gray-700"
          />
        </div>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {isLoading && <Card><p className="text-center text-gray-400 py-8">Cargando citas...</p></Card>}
        {!isLoading && !data?.items?.length && (
          <Card><p className="text-center text-gray-400 py-12 font-medium">No hay citas para este día</p></Card>
        )}
        {data?.items?.map(appt => (
          <Card key={appt.id} padding="none" className="overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Cita #{appt.id.slice(-6)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{appt.reason}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{formatDateTime(appt.scheduledAt)}</span>
                </div>
                <Badge variant={appt.type === 'VIDEO' ? 'purple' : 'info'}>
                  {appt.type === 'VIDEO' ? 'Video' : 'Presencial'}
                </Badge>
                <AppointmentStatusBadge status={appt.status} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Cita" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <SearchSelect
            label="Paciente"
            value={form.patientId}
            onChange={v => setForm(f => ({ ...f, patientId: v }))}
            options={patientOptions}
            placeholder="Buscar paciente..."
            required
            loading={loadingPatients}
          />
          <SearchSelect
            label="Doctor"
            value={form.doctorId}
            onChange={v => setForm(f => ({ ...f, doctorId: v }))}
            options={doctorOptions}
            placeholder="Buscar doctor..."
            required
            loading={loadingDoctors}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Inicio" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} required />
            <Input label="Fin"    type="datetime-local" value={form.endAt}       onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}       required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Tipo</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 font-medium text-gray-700 focus:ring-4 focus:ring-blue-100 outline-none text-sm">
              <option value="IN_PERSON">Presencial</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Motivo</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required rows={3}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 font-medium text-gray-700 focus:ring-4 focus:ring-blue-100 outline-none resize-none text-sm"
              placeholder="Motivo de la consulta..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1 justify-center">Cancelar</Button>
            <Button type="submit" loading={create.isPending} className="flex-1 justify-center">Crear Cita</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
