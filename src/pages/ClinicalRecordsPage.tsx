import { useState } from 'react';
import { FileText, Lock, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SearchSelect } from '../components/ui/SearchSelect';

interface ClinicalNote {
  id: string;
  appointmentId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  isLocked: boolean;
  createdAt: string;
}

interface AppointmentOption {
  id: string;
  scheduledAt: string;
  patientId: string;
  reason?: string;
}

function useClinicalNotes(appointmentId: string) {
  return useQuery({
    queryKey: ['clinical-notes', appointmentId],
    queryFn: async () => {
      const res = await medicalApi.get(`/appointments/${appointmentId}/notes`);
      return res.data.data as ClinicalNote[];
    },
    enabled: !!appointmentId,
  });
}

function useAppointmentsLookup() {
  return useQuery({
    queryKey: ['appointments-lookup'],
    queryFn: async () => {
      const res = await medicalApi.get('/appointments?limit=100');
      return (res.data.data.items ?? []) as AppointmentOption[];
    },
  });
}

export function ClinicalRecordsPage() {
  const [searchId, setSearchId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ appointmentId: '', subjective: '', objective: '', assessment: '', plan: '' });
  const qc = useQueryClient();

  const { data: notes, isLoading } = useClinicalNotes(searchId);
  const { data: appointments, isLoading: loadingAppts } = useAppointmentsLookup();

  const apptOptions = (appointments ?? []).map(a => ({
    value: a.id,
    label: `Cita #${a.id.slice(-6)} — ${new Date(a.scheduledAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}`,
    sublabel: a.reason ?? undefined,
  }));

  const createNote = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await medicalApi.post('/clinical-notes', data);
      return res.data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clinical-notes'] }); setModalOpen(false); },
  });

  const lockNote = useMutation({
    mutationFn: async (id: string) => {
      const res = await medicalApi.patch(`/clinical-notes/${id}/lock`, {});
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinical-notes'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Expedientes Clínicos</h1>
          <p className="text-gray-400 mt-0.5">Notas y diagnósticos por cita</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Nueva Nota</Button>
      </div>

      {/* Search by appointment */}
      <Card padding="sm">
        <div className="p-3">
          <SearchSelect
            value={searchId}
            onChange={setSearchId}
            options={apptOptions}
            placeholder="Seleccionar cita para ver sus notas..."
            loading={loadingAppts}
          />
        </div>
      </Card>

      {/* Notes */}
      {searchId && (
        <div className="space-y-4">
          {isLoading && <Card><p className="text-center py-8 text-gray-400">Cargando notas...</p></Card>}
          {!isLoading && !notes?.length && (
            <Card><p className="text-center py-8 text-gray-400">No hay notas clínicas para esta cita</p></Card>
          )}
          {notes?.map(note => (
            <Card key={note.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-500" />
                  <span className="font-bold text-gray-900">Nota #{note.id.slice(-6)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {note.isLocked ? (
                    <Badge variant="danger"><Lock size={12} className="mr-1 inline" />Bloqueada</Badge>
                  ) : (
                    <>
                      <Badge variant="success">Activa</Badge>
                      <Button variant="ghost" size="sm" icon={<Lock size={14} />} onClick={() => lockNote.mutate(note.id)}>
                        Bloquear
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Subjetivo', value: note.subjective },
                  { label: 'Objetivo', value: note.objective },
                  { label: 'Evaluación', value: note.assessment },
                  { label: 'Plan', value: note.plan },
                ].map(({ label, value }) => value && (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">{label}</p>
                    <p className="text-gray-700 font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Nota Clínica" size="lg">
        <form onSubmit={e => { e.preventDefault(); createNote.mutate(form); }} className="space-y-4">
          <SearchSelect
            label="Cita"
            value={form.appointmentId}
            onChange={v => setForm(f => ({ ...f, appointmentId: v }))}
            options={apptOptions}
            placeholder="Buscar cita..."
            required
            loading={loadingAppts}
          />
          {[
            { key: 'subjective', label: 'Subjetivo (Síntomas)' },
            { key: 'objective', label: 'Objetivo (Examen físico)' },
            { key: 'assessment', label: 'Evaluación (Diagnóstico)' },
            { key: 'plan', label: 'Plan de tratamiento' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{label}</label>
              <textarea
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 font-medium focus:ring-4 focus:ring-blue-100 outline-none resize-none text-sm"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1 justify-center">Cancelar</Button>
            <Button type="submit" loading={createNote.isPending} className="flex-1 justify-center">Guardar Nota</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
