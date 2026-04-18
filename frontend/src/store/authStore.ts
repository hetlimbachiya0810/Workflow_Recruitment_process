import { create } from 'zustand';
import type { User } from '@/types';
import { getMe } from '@/api/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (user, accessToken) => {
    localStorage.setItem('access_token', accessToken);
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },
  clearAuth: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },
  initAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    
    try {
      const user = await getMe();
      set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      // getMe failed (e.g. token expired and refresh failed)
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
