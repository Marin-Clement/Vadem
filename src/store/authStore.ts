import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../api/auth';
import type { PlayerProfile } from '../api/player';

interface AuthState {
  jwt: string | null;
  refreshToken: string | null;
  profile: PlayerProfile | null;
  isLoading: boolean;
  error: string | null;

  connect: (gameName: string, tagLine: string, region: string) => Promise<void>;
  logout: () => Promise<void>;
  setProfile: (profile: PlayerProfile) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      jwt: null,
      refreshToken: null,
      profile: null,
      isLoading: false,
      error: null,

      connect: async (gameName, tagLine, region) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.connect(gameName, tagLine, region);
          localStorage.setItem('vadem_jwt', res.access_token);
          localStorage.setItem('vadem_refresh', res.refresh_token);
          set({
            jwt: res.access_token,
            refreshToken: res.refresh_token,
            profile: {
              user_id: res.user_id,
              game_name: res.game_name,
              tag_line: res.tag_line,
              region: res.region,
              summoner_level: 0,
              profile_icon_id: 0,
              rank: null,
            },
            isLoading: false,
          });
        } catch (e) {
          set({ isLoading: false, error: (e as Error).message });
        }
      },

      logout: async () => {
        try {
          if (get().jwt) await authApi.logout();
        } catch {
          // ignore errors on logout
        }
        localStorage.removeItem('vadem_jwt');
        localStorage.removeItem('vadem_refresh');
        set({ jwt: null, refreshToken: null, profile: null, error: null });
      },

      setProfile: (profile) => set({ profile }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'vadem-auth',
      partialize: (s) => ({ jwt: s.jwt, refreshToken: s.refreshToken, profile: s.profile }),
    }
  )
);

// Sync localStorage token on hydration (middleware writes to store, but apiFetch reads localStorage)
useAuthStore.subscribe((state) => {
  if (state.jwt) {
    localStorage.setItem('vadem_jwt', state.jwt);
  } else {
    localStorage.removeItem('vadem_jwt');
  }
});

// Handle logout events fired by apiFetch on 401
window.addEventListener('vadem:logout', () => {
  useAuthStore.setState({ jwt: null, refreshToken: null, profile: null });
});
