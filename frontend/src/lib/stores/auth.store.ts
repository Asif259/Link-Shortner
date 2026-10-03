import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { login as apiLogin, register as apiRegister } from '@/lib/api/auth';
import type { User, AuthResponse } from '@/lib/api/auth';

// ─── Shape ────────────────────────────────────────────────────────────────────

export interface AuthState {
  /** Authenticated user object, or null when logged out. */
  user: User | null;
  /** Raw JWT access token. */
  accessToken: string | null;
  /** Derived — true when token + user are present. */
  isAuthenticated: boolean;
  /** True while login/register is in-flight. */
  isLoading: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Call the login API and store the result. Throws on failure. */
  login: (email: string, password: string) => Promise<void>;

  /** Call the register API. Does NOT auto-login — caller must call login() after. */
  register: (name: string, email: string, password: string) => Promise<{ message: string; user: User }>;

  /** Manually set auth (e.g. after an external token refresh). */
  setAuth: (payload: AuthResponse) => void;

  /** Clear auth state and token. */
  logout: () => void;

  /** Update local user info (e.g. after display name change). */
  updateUser: (partial: Partial<User>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await apiLogin({ email, password });
          set({
            user: data.user,
            accessToken: data.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const result = await apiRegister({ name, email, password });
          set({ isLoading: false });
          return result;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      setAuth: (payload) => {
        set({
          user: payload.user,
          accessToken: payload.accessToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (partial) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        }));
      },
    }),
    {
      name: 'linkly-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      // Only persist the fields that need to survive a page refresh.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ─── Selector helpers (stable references, prevent re-renders) ─────────────────

export const selectUser = (s: AuthState) => s.user;
export const selectToken = (s: AuthState) => s.accessToken;
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectIsLoading = (s: AuthState) => s.isLoading;
