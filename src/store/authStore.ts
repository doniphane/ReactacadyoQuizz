import { create } from 'zustand';
import { AuthService } from '@/lib/auth';
import type { User } from '@/types/Auth';

// Interface qui décrit ce que contient notre store d'authentification
interface AuthState {
  // Les données que nous stockons
  user: User | null;          // L'utilisateur connecté (null si pas connecté)
  isLoading: boolean;         // Si une action est en cours (login, logout, etc.)
  isAuthenticated: boolean;   // Si l'utilisateur est connecté ou non

  // Les fonctions que nous pouvons utiliser
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  
  // Fonctions pour vérifier les rôles
  isAdmin: () => boolean;
  isUser: () => boolean;
  hasRole: (role: string) => boolean;
}

// Création du store avec Zustand (sans persistance)
export const useAuthStore = create<AuthState>((set) => ({
  // Valeurs par défaut au démarrage
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // Fonction pour connecter un utilisateur
  login: async (username: string, password: string) => {
    // Étape 1: On dit que le chargement commence
    set({ isLoading: true });
    
    try {
      // Étape 2: On essaie de se connecter via le service
      const userData = await AuthService.login({ username, password });
      
      // Étape 3: Si ça marche, on met à jour notre store
      set({ 
        user: userData,           // On sauvegarde l'utilisateur
        isAuthenticated: true,    // On dit qu'il est connecté
        isLoading: false         // On dit que le chargement est fini
      });
      
    } catch (error) {
      // Étape 4: Si ça ne marche pas, on arrête le chargement
      set({ isLoading: false });
      
      // On relance l'erreur pour que le composant puisse la gérer
      throw error;
    }
  },

  // Fonction pour déconnecter un utilisateur
  logout: () => {
    try {
      // Étape 1: On appelle le service pour supprimer les cookies
      AuthService.logout();
      
      // Étape 2: On remet tout à zéro dans notre store
      set({ 
        user: null,              // Plus d'utilisateur
        isAuthenticated: false,  // Plus connecté
        isLoading: false        // Pas de chargement
      });
      
    } catch (error) {
      // Si il y a une erreur, on l'ignore car la déconnexion doit toujours marcher
      console.log('Erreur lors de la déconnexion:', error);
    }
  },

  // Fonction pour vérifier si l'utilisateur est encore connecté
  checkAuth: () => {
    try {
      // Étape 1: On demande au service si l'utilisateur est connecté
      const isConnected = AuthService.isAuthenticated();
      
      if (isConnected) {
        // Étape 2a: Si oui, on récupère ses informations depuis les cookies
        const currentUser = AuthService.getCurrentUser();
        
        // Si on a un utilisateur dans les cookies, on le sauvegarde dans le store
        if (currentUser) {
          set({ 
            user: currentUser,                    // On sauvegarde l'utilisateur
            isAuthenticated: true,                // On dit qu'il est connecté
            isLoading: false                     // On arrête le chargement
          });
        } else {
          // Si pas d'utilisateur dans les cookies, on remet à zéro
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } else {
        // Étape 2b: Si non, on remet tout à zéro
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      // En cas d'erreur, on considère que l'utilisateur n'est pas connecté
      console.log('Erreur lors de la vérification:', error);
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  // Fonction pour vérifier si l'utilisateur est admin
  isAdmin: () => {
    // On utilise le service d'authentification pour vérifier (cookies)
    return AuthService.isAdmin();
  },

  // Fonction pour vérifier si l'utilisateur est un utilisateur normal
  isUser: () => {
    // On utilise le service d'authentification pour vérifier (cookies)
    return AuthService.isUser();
  },

  // Fonction pour vérifier si l'utilisateur a un rôle spécifique
  hasRole: (role: string) => {
    // On utilise le service d'authentification pour vérifier (cookies)
    return AuthService.hasRole(role);
  }
})); 