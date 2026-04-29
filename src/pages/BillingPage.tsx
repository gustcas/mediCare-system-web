import { useState } from 'react';
import { DollarSign, Search, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input }  from '../components/ui/Input';
import { Card }   from '../components/ui/Card';
import { Badge }  from '../components/ui/Badge';
import { Table }  from '../components/ui/Table';
import { useToast } from '../hooks/useToast';

interface BillingRecord {
  id:          string;
  patientId:   string;
  patient?:    { firstName: string; lastName: string };
  amount:      number;
  patientOwes: number;
  status:      string;
  dueDate?:    string;
  paidAt?:     string;
  createdAt:   string;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  PAID: 'success', PENDING: 'warning', PARTIALLY_PAID: 'info', OVERDUE: 'danger', CANCELLED: 'danger',
};
const STATUS_LABEL: Record<string, string> = {
  PAID: 'Pagado', PENDING: 'Pendiente', PARTIALLY_PAID: 'Pago parcial', OVERDUE: 'Vencido', CANCELLED: 'Cancelado',
};

function useBilling(page: number, search: string) {
  return useQuery({
    queryKey: ['billing', page, search],
    queryFn:  async () => {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) p.append('search', search);
      const res = await medicalApi.get(`/billing/list?${p}`);
      return res.data.data as { items: BillingRecord[]; total: number; totalPages: number };
    },
  });
}

function useUpdateBillingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await medicalApi.patch(`/billing/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });
}

export function BillingPage() {
  const [page, setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useBilling(page, search);
  const updateStatus        = useUpdateBillingStatus();
  const { success }         = useToast();

  const markPaid = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'PAID' });
    success('Pago registrado');
  };

  const columns = [
    {
      key: 'patient',
      header: 'Paciente',
      render: (row: BillingRecord) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : row.patientId.slice(-8)}
          </p>
          <p className="text-xs text-gray-400">{new Date(row.createdAt).toLocaleDateString('es-PE')}</p>
        </div>
      ),
    },
    { key: 'amount',      header: 'Total',    render: (row: BillingRecord) => <span className="font-bold text-gray-900">S/ {Number(row.amount).toFixed(2)}</span> },
    { key: 'patientOwes', header: 'Saldo',    render: (row: BillingRecord) => <span className={`font-semibold ${Number(row.patientOwes) > 0 ? 'text-rose-500' : 'text-gray-400'}`}>S/ {Number(row.patientOwes).toFixed(2)}</span> },
    { key: 'status',      header: 'Estado',   render: (row: BillingRecord) => <Badge variant={STATUS_VARIANT[row.status] ?? 'info'}>{STATUS_LABEL[row.status] ?? row.status}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (row: BillingRecord) => row.status !== 'PAID' && row.status !== 'CANCELLED' ? (
        <Button variant="ghost" size="sm" icon={<CheckCircle size={14} />} onClick={() => markPaid(row.id)}>
          Marcar pagado
        </Button>
      ) : null,
    },
  ];

  const stats = data?.items ?? [];
  const pending  = stats.filter(r => r.status === 'PENDING').length;
  const overdue  = stats.filter(r => r.status === 'OVERDUE').length;
  const totalOwed  = stats.reduce((a, r) => a + Number(r.patientOwes), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Facturación</h1>
          <p className="text-gray-400 mt-0.5">{data?.total ?? 0} registros</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Clock size={20} className="text-amber-500" /></div>
          <div><p className="text-2xl font-black text-gray-900">{pending}</p><p className="text-xs text-gray-400">Pendientes</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center"><AlertCircle size={20} className="text-rose-500" /></div>
          <div><p className="text-2xl font-black text-gray-900">{overdue}</p><p className="text-xs text-gray-400">Vencidos</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><DollarSign size={20} className="text-blue-500" /></div>
          <div><p className="text-2xl font-black text-gray-900">S/ {totalOwed.toFixed(0)}</p><p className="text-xs text-gray-400">Por cobrar</p></div>
        </Card>
      </div>

      <Card padding="sm">
        <div className="p-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={16} />} placeholder="Buscar..." />
        </div>
        <Table columns={columns} data={data?.items || []} loading={isLoading} emptyMessage="No hay registros de facturación" keyExtractor={r => r.id} />
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
