import React, { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';
import { Button }    from '../components/ui/Button';
import { Input }     from '../components/ui/Input';
import { Card }      from '../components/ui/Card';
import { Badge }     from '../components/ui/Badge';
import { Modal }     from '../components/ui/Modal';
import { Table }     from '../components/ui/Table';
import { useToast }  from '../hooks/useToast';

interface InsurancePolicy {
  id:            string;
  patientId:     string;
  patient?:      { firstName: string; lastName: string };
  provider:      string;
  policyNumber:  string;
  holderName:    string;
  coverageType:  string;
  validFrom:     string;
  validTo:       string;
  createdAt:     string;
}

const COVERAGE_LABEL: Record<string, string> = {
  FULL: 'Cobertura total', PARTIAL: 'Parcial', EMERGENCY_ONLY: 'Solo emergencias',
};

function useInsurance(search: string) {
  return useQuery({
    queryKey: ['insurance', search],
    queryFn:  async () => {
      const res = await medicalApi.get('/insurance');
      const raw = res.data.data;
      const data = (raw.items ?? raw) as InsurancePolicy[];
      if (!search) return data;
      const q = search.toLowerCase();
      return data.filter(p =>
        p.provider.toLowerCase().includes(q) ||
        p.policyNumber.toLowerCase().includes(q) ||
        p.holderName.toLowerCase().includes(q),
      );
    },
  });
}

function useCreateInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await medicalApi.post('/insurance', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance'] }),
  });
}

function useDeleteInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await medicalApi.delete(`/insurance/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance'] }),
  });
}

function usePatients() {
  return useQuery({
    queryKey: ['patients-lookup'],
    queryFn:  async () => {
      const res = await medicalApi.get('/patients?limit=200');
      return res.data.data.items as { id: string; firstName: string; lastName: string }[];
    },
  });
}

const EMPTY = {
  patientId: '', provider: '', policyNumber: '', holderName: '',
  coverageType: 'FULL', validFrom: '', validTo: '',
};

export function InsurancePage() {
  const [search, setSearch] = useState('');
  const { data: policies, isLoading } = useInsurance(search);
  const { data: patients } = usePatients();
  const createPolicy = useCreateInsurance();
  const deletePolicy = useDeleteInsurance();
  const { success }  = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPolicy.mutateAsync(form);
    success('Póliza registrada');
    setShowCreate(false);
    setForm(EMPTY);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta póliza?')) return;
    await deletePolicy.mutateAsync(id);
    success('Póliza eliminada');
  };

  const isValid = (validTo: string) => new Date(validTo) >= new Date();

  const columns = [
    {
      key: 'patient',
      header: 'Paciente / Titular',
      render: (row: InsurancePolicy) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : row.patientId.slice(-8)}
          </p>
          <p className="text-xs text-gray-400">Titular: {row.holderName}</p>
        </div>
      ),
    },
    {
      key: 'provider',
      header: 'Aseguradora',
      render: (row: InsurancePolicy) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">{row.provider}</p>
          <p className="text-xs text-gray-400 font-mono">{row.policyNumber}</p>
        </div>
      ),
    },
    {
      key: 'coverage',
      header: 'Cobertura',
      render: (row: InsurancePolicy) => (
        <Badge variant="info">{COVERAGE_LABEL[row.coverageType] ?? row.coverageType}</Badge>
      ),
    },
    {
      key: 'validity',
      header: 'Vigencia',
      render: (row: InsurancePolicy) => (
        <div>
          <p className="text-xs text-gray-500">
            {new Date(row.validFrom).toLocaleDateString('es-PE')} – {new Date(row.validTo).toLocaleDateString('es-PE')}
          </p>
          <Badge variant={isValid(row.validTo) ? 'success' : 'danger'} className="mt-0.5">
            {isValid(row.validTo) ? 'Vigente' : 'Vencida'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: InsurancePolicy) => (
        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(row.id)} className="text-rose-500 hover:bg-rose-50">
          Eliminar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Seguros</h1>
          <p className="text-gray-400 mt-0.5">{policies?.length ?? 0} pólizas</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Nueva póliza</Button>
      </div>

      <Card padding="sm">
        <div className="p-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={16} />} placeholder="Buscar por aseguradora, póliza o titular..." />
        </div>
        <Table columns={columns} data={policies || []} loading={isLoading} emptyMessage="No hay pólizas registradas" keyExtractor={r => r.id} />
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva póliza de seguro">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Paciente *</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required>
              <option value="">Seleccionar paciente...</option>
              {(patients || []).map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
          <Input label="Aseguradora *" placeholder="Ej: MAPFRE, Rimac, Pacifico" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} required />
          <Input label="Número de póliza *" value={form.policyNumber} onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))} required />
          <Input label="Nombre del titular *" value={form.holderName} onChange={e => setForm(f => ({ ...f, holderName: e.target.value }))} required />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de cobertura *</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.coverageType} onChange={e => setForm(f => ({ ...f, coverageType: e.target.value }))} required>
              {Object.entries(COVERAGE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Válida desde *" type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} required />
            <Input label="Válida hasta *" type="date" value={form.validTo} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))} required />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={createPolicy.isPending}>Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
