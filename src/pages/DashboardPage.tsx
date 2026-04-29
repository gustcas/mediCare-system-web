import { useState } from 'react';
import { Users, Calendar, Activity, Clock, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';
import { StatCard } from '../components/ui/Card';
import { Badge, AppointmentStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table }  from '../components/ui/Table';
import { Modal }  from '../components/ui/Modal';
import { useDashboard, useAppointments } from '../hooks/useAppointments';
import { useToast } from '../hooks/useToast';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'short' });
}

function useAppointmentsRange(startDate: string, endDate: string, enabled: boolean) {
  return useQuery({
    queryKey: ['appointments-range', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate, limit: '100' });
      const res = await medicalApi.get(`/appointments?${params}`);
      return res.data.data as { items: any[]; total: number };
    },
    enabled,
  });
}

export function DashboardPage() {
  const navigate    = useNavigate();
  const { success } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: todayAppts, isLoading: apptLoading } = useAppointments({ date: today });

  const [showReport, setShowReport] = useState(false);
  const [reportRange, setReportRange] = useState({ start: today, end: today });

  const { data: rangeAppts, isLoading: rangeLoading } = useAppointmentsRange(
    reportRange.start,
    reportRange.end,
    showReport,
  );

  const stats = dashboard?.stats;
  const todayLabel = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => { window.print(); success('Imprimiendo reporte…'); };

  const columns = [
    {
      key: 'patient',
      header: 'Paciente',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-sm">P</div>
          <span className="font-semibold text-gray-900 text-sm">Paciente #{row.patientId?.slice(-4)}</span>
        </div>
      ),
    },
    {
      key: 'specialty',
      header: 'Especialidad',
      render: (row: any) => <span className="text-sm text-gray-500">{row.doctor?.specialties?.[0]?.specialty?.name || 'General'}</span>,
    },
    {
      key: 'doctor',
      header: 'Doctor',
      render: (row: any) => <span className="text-sm font-medium text-gray-700">Dr. #{row.doctorId?.slice(-4)}</span>,
    },
    {
      key: 'scheduledAt',
      header: 'Hora',
      render: (row: any) => (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          <Clock size={13} className="text-blue-400" />
          {formatTime(row.scheduledAt)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      className: 'text-center',
      render: (row: any) => <AppointmentStatusBadge status={row.status} />,
    },
  ];

  const isSingleDay = reportRange.start === reportRange.end;
  const rangeSummary = isSingleDay
    ? new Date(reportRange.start).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : `${formatDate(reportRange.start)} — ${formatDate(reportRange.end)}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 capitalize">Resumen General</h1>
          <p className="text-gray-400 font-medium mt-0.5 capitalize">{todayLabel}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={<FileText size={16} className="text-blue-500" />} size="md" onClick={() => setShowReport(true)}>
            Reporte Diario
          </Button>
          <Button icon={<Calendar size={16} />} size="md" onClick={() => navigate('/citas')}>
            Agendar Cita
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Pacientes Nuevos"       value={dashLoading ? '...' : stats?.newPatientsMonth ?? 0}    icon={<Users size={26} />}    iconBg="bg-blue-50"    iconColor="text-blue-600"    trend="+12%" trendUp />
        <StatCard label="Citas Hoy"              value={dashLoading ? '...' : stats?.appointmentsToday ?? 0}  icon={<Calendar size={26} />} iconBg="bg-indigo-50"  iconColor="text-indigo-600" />
        <StatCard label="Facturación Pendiente"  value={dashLoading ? '...' : stats?.pendingBilling ?? 0}      icon={<Activity size={26} />} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Urgencias Activas"      value={dashLoading ? '...' : stats?.urgentAppointments ?? 0}  icon={<Clock size={26} />}   iconBg="bg-rose-50"    iconColor="text-rose-600"   trend="+4" trendUp={false} />
      </div>

      {/* Today's appointments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2.5">
            Citas del Día <Badge variant="info">En Vivo</Badge>
          </h2>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={() => navigate('/citas')} icon={<ChevronRight size={14} />}>
            Gestionar Calendario
          </Button>
        </div>
        <div className="hidden sm:block">
          <Table columns={columns} data={todayAppts?.items || []} loading={apptLoading} emptyMessage="No hay citas para hoy" keyExtractor={r => r.id} />
        </div>
        <div className="sm:hidden divide-y divide-gray-50">
          {apptLoading && <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>}
          {!apptLoading && !todayAppts?.items?.length && <div className="p-6 text-center text-gray-400 text-sm">No hay citas para hoy</div>}
          {todayAppts?.items?.map(appt => (
            <div key={appt.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">Paciente #{appt.patientId?.slice(-4)}</span>
                <AppointmentStatusBadge status={appt.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div><span className="font-semibold text-gray-400 uppercase tracking-wider">Doctor</span><br />Dr. #{appt.doctorId?.slice(-4)}</div>
                <div><span className="font-semibold text-gray-400 uppercase tracking-wider">Hora</span><br />{formatTime(appt.scheduledAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reporte Modal */}
      <Modal open={showReport} onClose={() => setShowReport(false)} title="Reporte de Citas" size="lg">
        <div className="space-y-4 text-sm">
          {/* Date range selector */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="font-bold text-gray-700 text-sm">Rango de fechas</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Desde</label>
                <input
                  type="date"
                  value={reportRange.start}
                  onChange={e => setReportRange(r => ({ ...r, start: e.target.value }))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hasta</label>
                <input
                  type="date"
                  value={reportRange.end}
                  min={reportRange.start}
                  onChange={e => setReportRange(r => ({ ...r, end: e.target.value }))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Hoy',        start: today,                                              end: today },
                { label: 'Esta semana', start: (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; })(), end: today },
                { label: 'Este mes',   start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], end: today },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setReportRange({ start: preset.start, end: preset.end })}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                    reportRange.start === preset.start && reportRange.end === preset.end
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary header */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="font-bold text-blue-900 text-base capitalize">{rangeSummary}</p>
            <p className="text-blue-600 text-xs mt-0.5">MediCare System — Reporte de citas</p>
          </div>

          {/* Stats (always today from dashboard) */}
          {isSingleDay && reportRange.start === today && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Citas programadas hoy', value: stats?.appointmentsToday ?? 0 },
                { label: 'Pacientes nuevos (mes)', value: stats?.newPatientsMonth ?? 0 },
                { label: 'Facturación pendiente',  value: stats?.pendingBilling ?? 0 },
                { label: 'Urgencias activas',      value: stats?.urgentAppointments ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-2xl font-black text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Appointments list */}
          <div>
            <p className="font-semibold text-gray-700 mb-2">
              Citas del período
              {!rangeLoading && rangeAppts && (
                <span className="ml-2 text-xs font-normal text-gray-400">({rangeAppts.total} total)</span>
              )}
            </p>
            <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
              {rangeLoading && <p className="p-3 text-gray-400 text-xs text-center">Cargando...</p>}
              {!rangeLoading && (rangeAppts?.items || []).length === 0 && (
                <p className="p-3 text-gray-400 text-xs text-center">Sin citas en el período seleccionado</p>
              )}
              {(rangeAppts?.items || []).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <span className="text-gray-700 font-medium">Paciente #{a.patientId?.slice(-4)}</span>
                    <span className="text-gray-400 text-xs ml-2">{a.reason}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">{formatDate(a.scheduledAt)} {formatTime(a.scheduledAt)}</span>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowReport(false)}>Cerrar</Button>
            <Button className="flex-1" icon={<FileText size={15} />} onClick={handlePrint}>Imprimir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
