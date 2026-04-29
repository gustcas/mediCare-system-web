import { useState } from 'react';
import { Plus, LogOut } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input }  from '../components/ui/Input';
import { Card }   from '../components/ui/Card';
import { Badge }  from '../components/ui/Badge';
import { Modal }  from '../components/ui/Modal';
import { Table }  from '../components/ui/Table';
import { useToast } from '../hooks/useToast';

interface Admission {
  id:          string;
  patientId:   string;
  patient?:    { firstName: string; lastName: string; documentNumber?: string };
  ward?:       { name: string };
  room?:       { number: string };
  admittedAt:  string;
  dischargedAt?: string;
  reason:      string;
  status:      string;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  ADMITTED: 'warning', DISCHARGED: 'success', TRANSFERRED: 'info',
};

function useAdmissions(page: number, status?: string) {
  return useQuery({
    queryKey: ['admissions', page, status],
    queryFn:  async () => {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) p.append('status', status);
      const res = await medicalApi.get(`/admissions?${p}`);
      return res.data.data as { items: Admission[]; total: number; totalPages: number };
    },
  });
}

function NewAdmissionForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { success } = useToast();
  const [form, setForm] = useState({ patientId: '', reason: '', admittedAt: new Date().toISOString().slice(0, 16), status: 'ADMITTED' });

  const create = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await medicalApi.post('/admissions', { ...data, admittedAt: new Date(data.admittedAt).toISOString() });
      return res.data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admissions'] }); success('Admisión registrada'); onClose(); },
  });

  return (
    <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
      <Input label="ID Paciente *" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required placeholder="UUID del paciente" />
      <Input label="Motivo *" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required placeholder="Motivo de admisión" />
      <Input label="Fecha admisión *" type="datetime-local" value={form.admittedAt} onChange={e => setForm(f => ({ ...f, admittedAt: e.target.value }))} required />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
        <Button type="submit" loading={create.isPending} className="flex-1 justify-center">Registrar</Button>
      </div>
    </form>
  );
}

export function AdmissionsPage() {
  const [page, setPage]     = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useAdmissions(page, statusFilter || undefined);
  const qc                  = useQueryClient();
  const { success }         = useToast();

  const discharge = useMutation({
    mutationFn: async (id: string) => medicalApi.patch(`/admissions/${id}/discharge`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admissions'] }); success('Alta registrada'); },
  });

  const columns = [
    {
      key: 'patient',
      header: 'Paciente',
      render: (row: Admission) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : row.patientId.slice(-8)}
          </p>
          <p className="text-xs text-gray-400">{row.patient?.documentNumber ?? ''}</p>
        </div>
      ),
    },
    { key: 'ward',   header: 'Sala',        render: (row: Admission) => <span className="text-sm">{row.ward?.name ?? '—'}</span> },
    { key: 'room',   header: 'Habitación',  render: (row: Admission) => <span className="text-sm">{row.room?.number ?? '—'}</span> },
    { key: 'reason', header: 'Motivo',      render: (row: Admission) => <span className="text-sm text-gray-600 truncate max-w-[200px] block">{row.reason}</span> },
    { key: 'date',   header: 'Ingreso',     render: (row: Admission) => <span className="text-xs text-gray-400">{new Date(row.admittedAt).toLocaleDateString('es-PE')}</span> },
    { key: 'status', header: 'Estado',      render: (row: Admission) => <Badge variant={STATUS_VARIANT[row.status] ?? 'info'}>{row.status}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (row: Admission) => row.status === 'ADMITTED' ? (
        <Button variant="ghost" size="sm" icon={<LogOut size={14} />} onClick={() => discharge.mutate(row.id)}>Alta</Button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Admisiones</h1>
          <p className="text-gray-400 mt-0.5">{data?.total ?? 0} registros</p>
        </div>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:ring-4 focus:ring-blue-100 outline-none">
            <option value="">Todos</option>
            <option value="ADMITTED">Admitidos</option>
            <option value="DISCHARGED">Alta</option>
            <option value="TRANSFERRED">Transferidos</option>
          </select>
          <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Nueva admisión</Button>
        </div>
      </div>

      <Card padding="sm">
        <Table columns={columns} data={data?.items || []} loading={isLoading} emptyMessage="No hay admisiones" keyExtractor={r => r.id} />
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
            <span className="text-sm text-gray-500">Página {page} de {data.totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>Siguiente</Button>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Admisión" size="sm">
        <NewAdmissionForm onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
