import { useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input }  from '../components/ui/Input';
import { Card }   from '../components/ui/Card';
import { Badge }  from '../components/ui/Badge';
import { Table }  from '../components/ui/Table';

interface PrescItem { medicationName: string; dosage: string; frequency: string; durationDays?: number; }
interface Prescription {
  id:          string;
  patientId:   string;
  patient?:    { firstName: string; lastName: string };
  doctor?:     { licenseNumber: string };
  status:      string;
  issuedAt:    string;
  validUntil?: string;
  items:       PrescItem[];
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  ACTIVE: 'success', EXPIRED: 'warning', CANCELLED: 'danger',
};

function usePrescriptions(page: number) {
  return useQuery({
    queryKey: ['prescriptions', page],
    queryFn:  async () => {
      const res = await medicalApi.get(`/prescriptions/list?page=${page}&limit=20`);
      return res.data.data as { items: Prescription[]; total: number; totalPages: number };
    },
  });
}

export function PrescriptionsPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePrescriptions(page);

  const filtered = search
    ? (data?.items ?? []).filter(p =>
        `${p.patient?.firstName} ${p.patient?.lastName}`.toLowerCase().includes(search.toLowerCase()))
    : (data?.items ?? []);

  const columns = [
    {
      key: 'patient',
      header: 'Paciente',
      render: (row: Prescription) => (
        <span className="font-semibold text-gray-900 text-sm">
          {row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : row.patientId.slice(-8)}
        </span>
      ),
    },
    {
      key: 'medications',
      header: 'Medicamentos',
      render: (row: Prescription) => (
        <div className="space-y-0.5">
          {row.items?.slice(0, 2).map((i, idx) => (
            <p key={idx} className="text-xs text-gray-600">{i.medicationName} — {i.dosage}</p>
          ))}
          {(row.items?.length ?? 0) > 2 && <p className="text-xs text-gray-400">+{(row.items?.length ?? 0) - 2} más</p>}
        </div>
      ),
    },
    { key: 'status',  header: 'Estado',  render: (row: Prescription) => <Badge variant={STATUS_VARIANT[row.status] ?? 'info'}>{row.status}</Badge> },
    { key: 'issued',  header: 'Emitida', render: (row: Prescription) => <span className="text-xs text-gray-400">{new Date(row.issuedAt).toLocaleDateString('es-PE')}</span> },
    { key: 'expires', header: 'Vence',   render: (row: Prescription) => row.validUntil ? <span className="text-xs text-gray-400">{new Date(row.validUntil).toLocaleDateString('es-PE')}</span> : <span className="text-gray-300 text-xs">—</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Recetas</h1>
          <p className="text-gray-400 mt-0.5">{data?.total ?? 0} recetas</p>
        </div>
      </div>

      <Card padding="sm">
        <div className="p-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={16} />} placeholder="Buscar por paciente..." />
        </div>
        <Table columns={columns} data={filtered} loading={isLoading} emptyMessage="No hay recetas" keyExtractor={r => r.id} />
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
            <span className="text-sm text-gray-500">Página {page} de {data.totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>Siguiente</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
