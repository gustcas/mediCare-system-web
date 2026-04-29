import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalApi } from '../lib/api';

export interface Patient {
  id:             string;
  userId?:        string;
  firstName:      string;
  lastName:       string;
  documentType?:  string;
  documentNumber?:string;
  phone?:         string;
  address?:       string;
  dateOfBirth:    string;
  gender:         string;
  bloodType?:     string;
  createdAt:      string;
}

export interface CreatePatientDto {
  firstName:      string;
  lastName:       string;
  documentType?:  string;
  documentNumber?:string;
  phone?:         string;
  address?:       string;
  dateOfBirth:    string;
  gender:         string;
  bloodType?:     string;
}

export function usePatients(page = 1, limit = 20, search = '') {
  return useQuery({
    queryKey: ['patients', page, limit, search],
    queryFn:  async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.append('search', search);
      const res = await medicalApi.get(`/patients?${params}`);
      return res.data.data as { items: Patient[]; total: number; page: number; totalPages: number };
    },
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn:  async () => {
      const res = await medicalApi.get(`/patients/${id}`);
      return res.data.data as Patient;
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePatientDto) => {
      const res = await medicalApi.post('/patients', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreatePatientDto>) => {
      const res = await medicalApi.put(`/patients/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['patients', id] });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await medicalApi.delete(`/patients/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}
