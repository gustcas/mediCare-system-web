import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input }  from '../components/ui/Input';
import { Card }   from '../components/ui/Card';
import { Badge }  from '../components/ui/Badge';
import { Modal }  from '../components/ui/Modal';
import { Table }  from '../components/ui/Table';
import { SearchSelect } from '../components/ui/SearchSelect';
import { useToast } from '../hooks/useToast';

interface LabTest   { id: string; name: string; category: string; }
interface LabResult {
  id:          string;
  patientId:   string;
  labTestId:   string;
  labTest?:    { name: string };
  status:      string;
  resultValue?: string;
  unit?:        string;
  referenceRange?: string;
  requestedAt: string;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  AVAILABLE: 'success', PENDING: 'warning', REVIEWED: 'info', CANCELLED: 'danger',
};
const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Disponible', PENDING: 'Pendiente', REVIEWED: 'Revisado', CANCELLED: 'Cancelado',
};
const CATEGORY_LABEL: Record<string, string> = {
  BIOCHEMISTRY: 'Bioquímica', HEMATOLOGY: 'Hematología', MICROBIOLOGY: 'Microbiología',
  ENDOCRINOLOGY: 'Endocrinología', IMMUNOLOGY: 'Inmunología', PATHOLOGY: 'Patología',
  GENETICS: 'Genética', TOXICOLOGY: 'Toxicología', OTHER: 'Otro',
};

function useLabTests() {
  return useQuery({
    queryKey: ['lab-tests'],
    queryFn:  async () => {
      const res = await medicalApi.get('/lab-tests');
      return res.data.data as LabTest[];
    },
  });
}

function useLabResults(page: number) {
  return useQuery({
    queryKey: ['lab-results', page],
    queryFn:  async () => {
      const res = await medicalApi.get(`/lab-results/list?page=${page}&limit=20`);
      return res.data.data as { items: LabResult[]; total: number; totalPages: number };
    },
  });
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

function NewResultForm({ onClose }: { onClose: () => void }) {
  const { data: tests } = useLabTests();
  const { data: patients, isLoading: loadingPatients } = usePatientsLookup();
  const qc = useQueryClient();
  const { success } = useToast();
  const [form, setForm] = useState({ patientId: '', labTestId: '', requestedAt: new Date().toISOString().slice(0, 16), notes: '' });

  const patientOptions = (patients ?? []).map(p => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName}`,
    sublabel: p.documentNumber ? `DNI: ${p.documentNumber}` : undefined,
  }));

  const create = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await medicalApi.post('/lab-results', data);
      return res.data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lab-results'] }); success('Solicitud de laboratorio creada'); onClose(); },
  });

  return (
    <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
      <SearchSelect
        label="Paciente"
        value={form.patientId}
        onChange={v => setForm(f => ({ ...f, patientId: v }))}
        options={patientOptions}
        placeholder="Buscar paciente..."
        required
        loading={loadingPatients}
      />
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">Prueba *</label>
        <select value={form.labTestId} onChange={e => setForm(f => ({ ...f, labTestId: e.target.value }))} required
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none">
          <option value="">Seleccionar prueba</option>
          {tests?.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} — {CATEGORY_LABEL[t.category] ?? t.category}
            </option>
          ))}
        </select>
      </div>
      <Input label="Fecha solicitud" type="datetime-local" value={form.requestedAt} onChange={e => setForm(f => ({ ...f, requestedAt: e.target.value }))} required />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
        <Button type="submit" loading={create.isPending} className="flex-1 justify-center">Crear solicitud</Button>
      </div>
    </form>
  );
}

export function LabResultsPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useLabResults(page);

  const columns = [
    { key: 'test',    header: 'Prueba',     render: (row: LabResult) => <span className="font-semibold text-gray-900 text-sm">{row.labTest?.name ?? row.labTestId.slice(-8)}</span> },
    { key: 'patient', header: 'Paciente',   render: (row: LabResult) => <span className="text-sm text-gray-600">{row.patientId.slice(-8)}</span> },
    { key: 'result',  header: 'Resultado',  render: (row: LabResult) => row.resultValue ? <span className="font-semibold text-gray-800">{row.resultValue} {row.unit ?? ''}</span> : <span className="text-gray-300 text-sm">Pendiente</span> },
    { key: 'ref',     header: 'Referencia', render: (row: LabResult) => <span className="text-xs text-gray-400">{row.referenceRange ?? '—'}</span> },
    { key: 'status',  header: 'Estado',     render: (row: LabResult) => <Badge variant={STATUS_VARIANT[row.status] ?? 'info'}>{STATUS_LABEL[row.status] ?? row.status}</Badge> },
    { key: 'date',    header: 'Solicitado', render: (row: LabResult) => <span className="text-xs text-gray-400">{new Date(row.requestedAt).toLocaleDateString('es-PE')}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Laboratorio</h1>
          <p className="text-gray-400 mt-0.5">{data?.total ?? 0} solicitudes</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Nueva solicitud</Button>
      </div>

      <Card padding="sm">
        <div className="p-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={16} />} placeholder="Buscar por prueba, paciente..." />
        </div>
        <Table columns={columns} data={data?.items || []} loading={isLoading} emptyMessage="No hay resultados de laboratorio" keyExtractor={r => r.id} />
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
            <span className="text-sm text-gray-500">Página {page} de {data.totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>Siguiente</Button>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Solicitud de Lab" size="sm">
        <NewResultForm onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
