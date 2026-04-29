import { useState } from 'react';
import { ClipboardList, Search, Plus, CheckCircle, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';
import { Button }    from '../components/ui/Button';
import { Input }     from '../components/ui/Input';
import { Card }      from '../components/ui/Card';
import { Badge }     from '../components/ui/Badge';
import { Modal }     from '../components/ui/Modal';
import { Table }     from '../components/ui/Table';
import { useToast }  from '../hooks/useToast';

interface CarePlanGoal {
  id:          string;
  description: string;
  status:      string;
  targetDate?: string;
  achievedAt?: string;
}

interface CarePlanItem {
  id:          string;
  type:        string;
  description: string;
  frequency?:  string;
  startDate?:  string;
  endDate?:    string;
  notes?:      string;
}

interface CarePlan {
  id:          string;
  patientId:   string;
  patient?:    { firstName: string; lastName: string };
  doctorId:    string;
  status:      string;
  startDate:   string;
  endDate?:    string;
  goals:       CarePlanGoal[];
  items:       CarePlanItem[];
  createdAt:   string;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  ACTIVE: 'success', COMPLETED: 'info', CANCELLED: 'danger', ON_HOLD: 'warning',
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo', COMPLETED: 'Completado', CANCELLED: 'Cancelado', ON_HOLD: 'En pausa',
};
const GOAL_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', ACHIEVED: 'Logrado', ABANDONED: 'Abandonado',
};

function useCarePlans(search: string) {
  return useQuery({
    queryKey: ['care-plans', search],
    queryFn:  async () => {
      const res = await medicalApi.get('/care-plans?limit=100');
      const data = (res.data.data.items ?? res.data.data) as CarePlan[];
      if (!search) return data;
      const q = search.toLowerCase();
      return data.filter(p =>
        p.patient
          ? `${p.patient.firstName} ${p.patient.lastName}`.toLowerCase().includes(q)
          : p.patientId.includes(q),
      );
    },
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

function useDoctors() {
  return useQuery({
    queryKey: ['doctors-lookup'],
    queryFn:  async () => {
      const res = await medicalApi.get('/doctors?limit=200');
      return res.data.data.items as { id: string; licenseNumber: string }[];
    },
  });
}

function useCreateCarePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await medicalApi.post('/care-plans', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['care-plans'] }),
  });
}

function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await medicalApi.patch(`/care-plans/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['care-plans'] }),
  });
}

const ITEM_TYPE_LABEL: Record<string, string> = {
  MONITORING: 'Monitoreo', MEDICATION: 'Medicación', PROCEDURE: 'Procedimiento',
  FOLLOW_UP_APPOINTMENT: 'Cita de seguimiento', LAB_TEST: 'Examen de laboratorio',
  EDUCATION: 'Educación', OTHER: 'Otro',
};

const EMPTY_FORM = {
  title: '', patientId: '', doctorId: '', startDate: '', endDate: '',
  goals: [{ description: '', targetDate: '' }],
  items: [{ type: 'MONITORING', description: '', frequency: '' }],
};

export function CarePlansPage() {
  const [search, setSearch] = useState('');
  const { data: plans, isLoading } = useCarePlans(search);
  const { data: patients } = usePatients();
  const { data: doctors }  = useDoctors();
  const createPlan  = useCreateCarePlan();
  const updateStatus = useUpdateStatus();
  const { success } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPlan.mutateAsync({
      ...form,
      goals: form.goals.filter(g => g.description),
      items: form.items.filter(i => i.description),
    });
    success('Plan de cuidados creado');
    setShowCreate(false);
    setForm(EMPTY_FORM);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus.mutateAsync({ id, status });
    success('Estado actualizado');
  };

  const columns = [
    {
      key: 'patient',
      header: 'Paciente',
      render: (row: CarePlan) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : row.patientId.slice(-8)}
          </p>
          <p className="text-xs text-gray-400">{new Date(row.startDate).toLocaleDateString('es-PE')}</p>
        </div>
      ),
    },
    {
      key: 'goals',
      header: 'Objetivos',
      render: (row: CarePlan) => (
        <div className="flex items-center gap-1.5">
          <CheckCircle size={13} className="text-green-500" />
          <span className="text-sm text-gray-600">{row.goals.filter(g => g.status === 'ACHIEVED').length}/{row.goals.length} logrados</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: CarePlan) => <Badge variant={STATUS_VARIANT[row.status] ?? 'info'}>{STATUS_LABEL[row.status] ?? row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row: CarePlan) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === row.id ? null : row.id)}>
            {expanded === row.id ? 'Ocultar' : 'Ver detalle'}
          </Button>
          {row.status === 'ACTIVE' && (
            <Button variant="ghost" size="sm" onClick={() => handleStatusChange(row.id, 'COMPLETED')} className="text-green-600 hover:bg-green-50">
              Completar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Planes de Cuidados</h1>
          <p className="text-gray-400 mt-0.5">{plans?.length ?? 0} planes</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Nuevo plan</Button>
      </div>

      <Card padding="sm">
        <div className="p-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={16} />} placeholder="Buscar por paciente..." />
        </div>
        <Table columns={columns} data={plans || []} loading={isLoading} emptyMessage="No hay planes de cuidados" keyExtractor={r => r.id} />
      </Card>

      {/* Expanded detail panel */}
      {expanded && (() => {
        const plan = (plans || []).find(p => p.id === expanded);
        if (!plan) return null;
        return (
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Detalle del plan</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Objetivos</h4>
                <ul className="space-y-2">
                  {plan.goals.map(g => (
                    <li key={g.id} className="flex items-start gap-2">
                      <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-800">{g.description}</p>
                        <p className="text-xs text-gray-400">{GOAL_STATUS_LABEL[g.status] ?? g.status}{g.targetDate && ` · meta: ${new Date(g.targetDate).toLocaleDateString('es-PE')}`}</p>
                      </div>
                    </li>
                  ))}
                  {plan.goals.length === 0 && <li className="text-sm text-gray-400">Sin objetivos</li>}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Intervenciones</h4>
                <ul className="space-y-2">
                  {plan.items.map(i => (
                    <li key={i.id} className="flex items-start gap-2">
                      <ClipboardList size={14} className="text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-800">{i.description}</p>
                        <p className="text-xs text-gray-400">{ITEM_TYPE_LABEL[i.type] ?? i.type.replace(/_/g, ' ')}{i.frequency && ` · ${i.frequency}`}</p>
                      </div>
                    </li>
                  ))}
                  {plan.items.length === 0 && <li className="text-sm text-gray-400">Sin intervenciones</li>}
                </ul>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo plan de cuidados">
        <form onSubmit={handleCreate} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Título del plan *" placeholder="Ej: Plan de rehabilitación post-cirugía" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Paciente *</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required>
              <option value="">Seleccionar paciente...</option>
              {(patients || []).map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Doctor *</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))} required>
              <option value="">Seleccionar doctor...</option>
              {(doctors || []).map(d => <option key={d.id} value={d.id}>Lic. {d.licenseNumber}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha inicio *" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
            <Input label="Fecha fin" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Objetivos</p>
            {form.goals.map((g, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input placeholder="Descripción del objetivo" value={g.description} onChange={e => setForm(f => ({ ...f, goals: f.goals.map((x, j) => j === i ? { ...x, description: e.target.value } : x) }))} className="flex-1" />
                <Input type="date" value={g.targetDate} onChange={e => setForm(f => ({ ...f, goals: f.goals.map((x, j) => j === i ? { ...x, targetDate: e.target.value } : x) }))} className="w-36" />
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => setForm(f => ({ ...f, goals: [...f.goals, { description: '', targetDate: '' }] }))}>
              Agregar objetivo
            </Button>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Intervenciones</p>
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" value={item.type} onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, type: e.target.value } : x) }))}>
                  {Object.entries(ITEM_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <Input placeholder="Descripción" value={item.description} onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, description: e.target.value } : x) }))} className="flex-1" />
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => setForm(f => ({ ...f, items: [...f.items, { type: 'MONITORING', description: '', frequency: '' }] }))}>
              Agregar intervención
            </Button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={createPlan.isPending}>Crear plan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
