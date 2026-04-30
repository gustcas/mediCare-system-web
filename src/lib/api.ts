import axios, { AxiosError } from 'axios';
import { globalToast } from '../hooks/useToast';

export const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL || '/api/auth',
  headers: { 'Content-Type': 'application/json' },
});

export const medicalApi = axios.create({
  baseURL: import.meta.env.VITE_MEDICAL_API_URL || '/api/medical',
  headers: { 'Content-Type': 'application/json' },
});

function getErrorMessage(error: AxiosError): { title: string; message?: string } {
  const data = error.response?.data as any;
  if (data?.error?.message) {
    const details = data.error.details;
    const detail  = Array.isArray(details) ? details.map((d: any) => d.message).join(', ') : undefined;
    return { title: data.error.message, message: detail };
  }
  if (error.response?.status === 401) return { title: 'Sesión expirada', message: 'Por favor, inicia sesión nuevamente' };
  if (error.response?.status === 403) return { title: 'Sin permisos', message: 'No tienes acceso a esta acción' };
  if (error.response?.status === 404) return { title: 'No encontrado' };
  if (error.response?.status === 409) return { title: 'Conflicto', message: data?.error?.message };
  if (error.response?.status === 422) return { title: 'Error de validación', message: data?.error?.details?.map((d: any) => d.message).join(', ') };
  return { title: 'Error inesperado', message: error.message };
}

function attachInterceptors(api: typeof authApi) {
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('medicare_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
      const original = error.config as any;

      const isRefreshCall = original.url?.includes('/refresh');
      if (error.response?.status === 401 && !original._retry && !isRefreshCall) {
        original._retry = true;
        const refreshToken = localStorage.getItem('medicare_refresh_token');
        if (refreshToken) {
          try {
            const res = await authApi.post('/refresh', { refreshToken });
            const { accessToken } = res.data.data.tokens;
            localStorage.setItem('medicare_access_token', accessToken);
            original.headers.Authorization = `Bearer ${accessToken}`;
            return api(original);
          } catch {
            localStorage.removeItem('medicare_access_token');
            localStorage.removeItem('medicare_refresh_token');
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }
        localStorage.removeItem('medicare_access_token');
        localStorage.removeItem('medicare_refresh_token');
        window.location.href = '/login';
      }

      // Show toast for non-auth, non-retry errors
      if (!original._silent) {
        const { title, message } = getErrorMessage(error);
        globalToast('error', title, message);
      }

      return Promise.reject(error);
    },
  );
}

attachInterceptors(authApi);
attachInterceptors(medicalApi);
