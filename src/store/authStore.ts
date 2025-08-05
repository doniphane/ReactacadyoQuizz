import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "../types/User";
import AuthService from "../services/AuthService";

export type Auth = {
  // État
  token: string;
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => boolean;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<Auth>()(
  persist(
    (set) => ({
      // État initial
      token: "",
      user: {
        id: "",
        name: "",
        email: "",
        roles: [],
      },
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setToken: (token: string) => set({ token, isAuthenticated: !!token }),
      setUser: (user: User) => set({ user }),
      
      // Action de connexion
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const result = await AuthService.login(email, password);

          if (result.success && result.user) {
            const token = AuthService.getToken() || "";
            
            // Transforme les données utilisateur pour correspondre au type User
            const user: User = {
              id: result.user.id?.toString() || "",
              name: result.user.username || result.user.email || "",
              email: result.user.email || "",
              roles: result.user.roles || [],
              exp: result.user.exp,
              iat: result.user.iat,
              sub: result.user.sub,
            };

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: result.message
            });
            return false;
          }
        } catch {
          set({
            isLoading: false,
            error: 'Erreur de connexion'
          });
          return false;
        }
      },

      // Action de déconnexion
      logout: async () => {
        set({ isLoading: true });

        try {
          await AuthService.logout();
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
        } finally {
          set({
            token: "",
            user: {
              id: "",
              name: "",
              email: "",
              roles: [],
            },
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      // Vérification de l'authentification
      checkAuth: () => {
        const isAuth = AuthService.isAuthenticated();
        const userData = AuthService.getCurrentUser();
        const token = AuthService.getToken() || "";

        if (isAuth && userData) {
          // Transforme les données utilisateur
          const user: User = {
            id: userData.id?.toString() || "",
            name: userData.username || userData.email || "",
            email: userData.email || "",
            roles: userData.roles || [],
            exp: userData.exp,
            iat: userData.iat,
            sub: userData.sub,
          };

          set({
            user,
            token,
            isAuthenticated: true
          });
        } else {
          set({
            token: "",
            user: {
              id: "",
              name: "",
              email: "",
              roles: [],
            },
            isAuthenticated: false
          });
        }

        return isAuth;
      },

      // Effacer les erreurs
      clearError: () => {
        set({ error: null });
      },

      // Définir l'état de chargement
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: "auth-user",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Hooks utilitaires pour faciliter l'utilisation
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    // État
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    login: store.login,
    logout: store.logout,
    checkAuth: store.checkAuth,
    clearError: store.clearError,
    setLoading: store.setLoading,
    setToken: store.setToken,
    setUser: store.setUser,

    // Utilitaires
    isAdmin: () => store.user?.roles?.includes('ROLE_ADMIN') || false,
    isStudent: () => store.user?.roles?.includes('ROLE_USER') || false,
    hasRole: (role: string) => store.user?.roles?.includes(role) || false,
    getUsername: () => store.user?.name || store.user?.email || '',
    getUserId: () => store.user?.id || null
  };
}; 