import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../pages/DashboardPage';

vi.mock('../hooks/useAppointments', () => ({
  useDashboard: () => ({
    data: {
      stats: { newPatientsMonth: 148, appointmentsToday: 42, pendingBilling: 15, urgentAppointments: 8 },
    },
    isLoading: false,
  }),
  useTodayAppointments: () => ({
    data: {
      items: [
        { id: 'appt-1', patientId: 'pat-1', doctorId: 'doc-1', scheduledAt: new Date().toISOString(), endAt: new Date().toISOString(), type: 'IN_PERSON', status: 'CONFIRMED', reason: 'Test', doctor: { specialties: [] } },
      ],
      total: 1,
    },
    isLoading: false,
  }),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('DashboardPage', () => {
  it('renders stat cards', () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Resumen General')).toBeInTheDocument();
    expect(screen.getByText('Pacientes Nuevos')).toBeInTheDocument();
    expect(screen.getByText('Citas Hoy')).toBeInTheDocument();
    expect(screen.getByText('148')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders appointments table header', () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Citas del Día')).toBeInTheDocument();
  });
});
