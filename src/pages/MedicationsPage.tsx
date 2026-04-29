import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';
import { Button }    from '../components/ui/Button';
import { Input }     from '../components/ui/Input';
import { Card }      from '../components/ui/Card';
import { Badge }     from '../components/ui/Badge';
import { Modal }     from '../components/ui/Modal';
import { Table }     from '../components/ui/Table';
import { useToast }  from '../hooks/useToast';

interface Medication {
  id:          string;
  genericName: string;
  brandName?:  string;
  description?: string;
  isActive:    boolean;
  variants:    MedVariant[];
}
interface MedVariant {
  id:       string;
  form:     string;
  strength: string;
  category: string;
  isActive: boolean;
}

const FORM_LABEL: Record<string, string> = {
  TABLET: 'Tableta', CAPSULE: 'Cápsula', SYRUP: 'Jarabe', INJECTION: 'Inyección',
  TOPICAL: 'Tópico', INHALER: 'Inhalador', DROPS: 'Gotas', SUPPOSITORY: 'Supositorio', OTHER: 'Otro',
};

const CATEGORY_LABEL: Record<string, string> = {
  ANALGESIC: 'Analgésico', ANTIBIOTIC: 'Antibiótico', ANTIHYPERTENSIVE: 'Antihipertensivo',
  ANTIDIABETIC: 'Antidiabético', ANTIHISTAMINE: 'Antihistamínico', ANTIDEPRESSANT: 'Antidepresivo',
  ANTIPSYCHOTIC: 'Antipsicótico', ANXIOLYTIC: 'Ansiolítico', ANTICOAGULANT: 'Anticoagulante',
  DIURETIC: 'Diurético', BRONCHODILATOR: 'Broncodilatador',
  PROTON_PUMP_INHIBITOR: 'Inhibidor de bomba de protones', STATIN: 'Estatina',
  NSAID: 'AINE (antiinflamatorio)', ANTIFUNGAL: 'Antifúngico', ANTIVIRAL: 'Antiviral',
  VITAMIN: 'Vitamina', SUPPLEMENT: 'Suplemento', OTHER: 'Otro',
};

function useMedications() {
  return useQuery({
    queryKey: ['medications'],
    queryFn:  async () => {
      const res = await medicalApi.get('/medications');
      return res.data.data as Medication[];
    },
  });
}

function useCreateMedication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { genericName: string; brandName?: string; description?: string }) => {
      const res = await medicalApi.post('/medications', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medications'] }),
  });
}

function useAddVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await medicalApi.post(`/medications/${id}/variants`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medications'] }),
  });
}

function useDeactivateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ medId, variantId }: { medId: string; variantId: string }) => {
      const res = await medicalApi.patch(`/medications/${medId}/variants/${variantId}/deactivate`);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medications'] }),
  });
}

export function MedicationsPage() {
  const { data: meds, isLoading } = useMedications();
  const createMed    = useCreateMedication();
  const addVariant   = useAddVariant();
  const deactivate   = useDeactivateVariant();
  const { success }  = useToast();
  const [search, setSearch] = useState('');

  // Create medication modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ genericName: '', brandName: '', description: '' });

  // Add variant modal
  const [variantFor, setVariantFor] = useState<Medication | null>(null);
  const [vForm, setVForm] = useState({ form: 'TABLET', strength: '', category: 'ANALGESIC' });

  const filtered = (meds || []).filter(m =>
    m.genericName.toLowerCase().includes(search.toLowerCase()) ||
    (m.brandName || '').toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMed.mutateAsync({ genericName: form.genericName, brandName: form.brandName || undefined, description: form.description || undefined });
    success('Medicamento creado');
    setShowCreate(false);
    setForm({ genericName: '', brandName: '', description: '' });
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantFor) return;
    await addVariant.mutateAsync({ id: variantFor.id, data: vForm });
    success('Variante agregada');
    setVariantFor(null);
    setVForm({ form: 'TABLET', strength: '', category: 'ANALGESIC' });
  };

  const handleDeactivate = (medId: string, variantId: string) => {
    deactivate.mutateAsync({ medId, variantId }).then(() => success('Variante desactivada'));
  };

  const columns = [
    {
      key: 'genericName',
      header: 'Medicamento',
      render: (row: Medication) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">{row.genericName}</p>
          {row.brandName && <p className="text-xs text-gray-400">{row.brandName}</p>}
        </div>
      ),
    },
    {
      key: 'variants',
      header: 'Variantes',
      render: (row: Medication) => (
        <div className="flex flex-wrap gap-1">
          {row.variants.map(v => (
            <button key={v.id} onClick={() => v.isActive && handleDeactivate(row.id, v.id)} title={v.isActive ? 'Clic para desactivar' : 'Inactiva'} className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer ${v.isActive ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200 line-through cursor-default'}`}>
              {FORM_LABEL[v.form] ?? v.form} {v.strength}
            </button>
          ))}
          {row.variants.length === 0 && <span className="text-xs text-gray-400">Sin variantes</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Medication) => <Badge variant={row.isActive ? 'success' : 'danger'}>{row.isActive ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row: Medication) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setVariantFor(row)}>
            Variante
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Medicamentos</h1>
          <p className="text-gray-400 mt-0.5">{filtered.length} registros</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Nuevo medicamento</Button>
      </div>

      <Card padding="sm">
        <div className="p-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={16} />} placeholder="Buscar medicamento..." />
        </div>
        <Table columns={columns} data={filtered} loading={isLoading} emptyMessage="No hay medicamentos" keyExtractor={r => r.id} />
      </Card>

      {/* Expanded variant details below table */}
      {filtered.map(med =>
        med.variants.length > 0 ? null : null
      )}

      {/* Create Medication Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo medicamento">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre genérico *" value={form.genericName} onChange={e => setForm(f => ({ ...f, genericName: e.target.value }))} required />
          <Input label="Nombre comercial" value={form.brandName} onChange={e => setForm(f => ({ ...f, brandName: e.target.value }))} />
          <Input label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={createMed.isPending}>Crear</Button>
          </div>
        </form>
      </Modal>

      {/* Add Variant Modal */}
      <Modal open={!!variantFor} onClose={() => setVariantFor(null)} title={`Agregar variante — ${variantFor?.genericName}`}>
        <form onSubmit={handleAddVariant} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Forma farmacéutica *</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={vForm.form} onChange={e => setVForm(f => ({ ...f, form: e.target.value }))} required>
              {Object.entries(FORM_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <Input label="Concentración / Fuerza *" placeholder="Ej: 500mg, 10mg/5ml" value={vForm.strength} onChange={e => setVForm(f => ({ ...f, strength: e.target.value }))} required />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoría *</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={vForm.category} onChange={e => setVForm(f => ({ ...f, category: e.target.value }))} required>
              {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setVariantFor(null)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={addVariant.isPending}>Agregar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
