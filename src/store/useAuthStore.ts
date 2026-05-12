import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  role: 'admin' | 'scanner' | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (token: string, role: 'admin' | 'scanner') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      isAuthenticated: false,
      
      login: (token, role) => 
        set({ 
          token, 
          role, 
          isAuthenticated: true 
        }),
        
      logout: () => 
        set({ 
          token: null, 
          role: null, 
          isAuthenticated: false 
        }),
    }),
    {
      name: 'smile-fest-auth',
    }
  )
);