import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from '../pages/LoginPage';

vi.mock('../lib/api', () => ({
  authApi: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  medicalApi: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('../store/authStore', () => ({
  authStore: {
    setAuth: vi.fn(),
    getState: () => ({ user: null, isAuthenticated: false }),
    clearAuth: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
    hasRole: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(false),
  },
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<Wrapper><LoginPage /></Wrapper>);
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByText('MediCare System')).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    render(<Wrapper><LoginPage /></Wrapper>);
    expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('shows submit button', () => {
    render(<Wrapper><LoginPage /></Wrapper>);
    expect(screen.getByText('Ingresar al Sistema')).toBeInTheDocument();
  });

  it('shows error on failed login', async () => {
    const { authApi } = await import('../lib/api');
    (authApi.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      response: { data: { error: { message: 'Credenciales inválidas' } } },
    });

    render(<Wrapper><LoginPage /></Wrapper>);
    fireEvent.click(screen.getByText('Ingresar al Sistema'));

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    });
  });
});
