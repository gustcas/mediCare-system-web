import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  endAt: string;
  type: string;
  status: string;
  reason: string;
  patient?: { id: string };
  doctor?: { id: string; specialties?: Array<{ specialty: { name: string } }> };
}

export function useAppointments(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      const res = await medicalApi.get(`/appointments?${query}`);
      return res.data.data as { items: Appointment[]; total: number; totalPages: number };
    },
  });
}

export function useTodayAppointments() {
  const today = new Date().toISOString().split('T')[0];
  return useAppointments({ date: today });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Appointment>) => {
      const res = await medicalApi.post('/appointments', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useChangeAppointmentStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { status: string; cancelReason?: string }) => {
      const res = await medicalApi.patch(`/appointments/${id}/status`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await medicalApi.get('/dashboard/summary');
      return res.data.data;
    },
    refetchInterval: 60000,
  });
}
