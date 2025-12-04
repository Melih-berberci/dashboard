import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserGuild {
  guildId: string;
  guildName?: string;
  guildIcon?: string;
  permissions: {
    dashboard: boolean;
    logs: boolean;
    moderation: boolean;
    welcome: boolean;
    leveling: boolean;
    tickets: boolean;
    commands: boolean;
    settings: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  guilds: UserGuild[];
  avatar?: string;
  discordId?: string;
  discordUsername?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`/api/admin/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ isLoading: false });
            return { success: false, error: data.error || 'Giriş başarısız' };
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Bağlantı hatası' };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      fetchUser: async () => {
        const token = get().token;
        if (!token) return;

        set({ isLoading: true });
        try {
          const response = await fetch(`/api/admin/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const user = await response.json();
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            // Token geçersiz
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

// Helper function to get auth header
export const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper to check if user has permission for a guild module
export const hasGuildPermission = (guildId: string, module: keyof UserGuild['permissions']): boolean => {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.role === 'super_admin') return true;
  
  const guild = user.guilds.find(g => g.guildId === guildId);
  if (!guild) return false;
  
  return guild.permissions[module] ?? false;
};

// Helper to check if user is super admin
export const isSuperAdmin = (): boolean => {
  const user = useAuthStore.getState().user;
  return user?.role === 'super_admin';
};
