import { create } from "zustand";
import { AuthService } from "@/lib/auth";
import type { User } from "@/types/Auth";

interface AuthState {
  // Les données que nous stockons
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;

  isAdmin: () => boolean;
  isUser: () => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // Fonction pour connecter un utilisateur
  login: async (username: string, password: string) => {
    set({ isLoading: true });

    try {
      const userData = await AuthService.login({ username, password });

      set({
        user: userData, // On sauvegarde l'utilisateur
        isAuthenticated: true, // On dit qu'il est connecté
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });

      throw error;
    }
  },

  // Fonction pour déconnecter un utilisateur
  logout: () => {
    try {
      AuthService.logout();

      set({
        user: null, // Plus d'utilisateur
        isAuthenticated: false, // Plus connecté
        isLoading: false,
      });
    } catch (error) {
      console.log("Erreur lors de la déconnexion:", error);
    }
  },

  // Fonction pour vérifier si l'utilisateur est encore connecté
  checkAuth: () => {
    try {
      //  On demande au service si l'utilisateur est connecté
      const isConnected = AuthService.isAuthenticated();

      if (isConnected) {
        const currentUser = AuthService.getCurrentUser();

        set({
          user: currentUser, // On sauvegarde l'utilisateur
          isAuthenticated: currentUser !== null, // On vérifie qu'on a bien un utilisateur
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      // En cas d'erreur, on considère que l'utilisateur n'est pas connecté
      console.log("Erreur lors de la vérification:", error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Fonction pour vérifier si l'utilisateur est admin
  isAdmin: () => {
    return AuthService.isAdmin();
  },

  // Fonction pour vérifier si l'utilisateur est un utilisateur normal
  isUser: () => {
    return AuthService.isUser();
  },

  // Fonction pour vérifier si l'utilisateur a un rôle spécifique
  hasRole: (role: string) => {
    return AuthService.hasRole(role);
  },
}));
