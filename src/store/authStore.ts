interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  avatarUrl: string | null;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

let state: AuthState = {
  user: null,
  accessToken: localStorage.getItem('medicare_access_token'),
  refreshToken: localStorage.getItem('medicare_refresh_token'),
  isAuthenticated: !!localStorage.getItem('medicare_access_token'),
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() { listeners.forEach(l => l()); }

export const authStore = {
  getState: () => state,
  subscribe: (l: Listener) => { listeners.add(l); return () => listeners.delete(l); },
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => {
    localStorage.setItem('medicare_access_token', accessToken);
    localStorage.setItem('medicare_refresh_token', refreshToken);
    state = { user, accessToken, refreshToken, isAuthenticated: true };
    notify();
  },
  clearAuth: () => {
    localStorage.removeItem('medicare_access_token');
    localStorage.removeItem('medicare_refresh_token');
    state = { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
    notify();
  },
  hasRole: (role: string) => state.user?.roles.includes(role) ?? false,
  hasPermission: (resource: string, action: string) =>
    state.user?.permissions.includes(`${resource}:${action}`) ?? false,
};
