import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
  info: 'bg-blue-50 text-blue-700 border-blue-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function AppointmentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    PENDING: { label: 'Pendiente', variant: 'warning' },
    CONFIRMED: { label: 'Confirmada', variant: 'success' },
    IN_PROGRESS: { label: 'En Consulta', variant: 'info' },
    COMPLETED: { label: 'Completada', variant: 'default' },
    CANCELLED_BY_PATIENT: { label: 'Cancelada', variant: 'danger' },
    CANCELLED_BY_DOCTOR: { label: 'Cancelada', variant: 'danger' },
    NO_SHOW: { label: 'No asistió', variant: 'danger' },
  };
  const c = config[status] || { label: status, variant: 'default' as BadgeVariant };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
