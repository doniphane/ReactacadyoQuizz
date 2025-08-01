import { create } from 'zustand';
import { AuthService } from '@/lib/auth';
import type { User } from '@/lib/auth';


interface AuthState {
  // Les données que nous stockons
  user: User | null;          // L'utilisateur connecté (null si pas connecté)
  isLoading: boolean;         // Si une action est en cours (login, logout, etc.)
  isAuthenticated: boolean;   // Si l'utilisateur est connecté ou non

  // Les fonctions que nous pouvons utiliser
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  initialize: () => void;     // Fonction pour initialiser le store
  
  
  isAdmin: () => Promise<boolean>;
  isUser: () => Promise<boolean>;
  hasRole: (role: string) => Promise<boolean>;
}

// Création du store avec Zustand
export const useAuthStore = create<AuthState>((set, get) => ({
  // Valeurs par défaut au démarrage
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // Fonction pour initialiser le store 
  initialize: () => {
    get().checkAuth();
  },

  // Fonction pour connecter un utilisateur
  login: async (username: string, password: string) => {
    set({ isLoading: true });
    
    try {
      // On essaie de se connecter via le service
      const userData = await AuthService.login({ username, password });
      
      // Si ça marche, on met à jour notre store
      set({ 
        user: userData,           
        isAuthenticated: true,    
        isLoading: false        
      });
      
    } catch (error) {
      // Si ça ne marche pas, on arrête le chargement
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false 
      });
      
   
      throw error;
    }
  },

  // Fonction pour déconnecter un utilisateur
  logout: () => {
    // On appelle le service pour supprimer les cookies
    AuthService.logout();
    
    // On remet tout à zéro dans notre store
    set({ 
      user: null,              
      isAuthenticated: false,  
      isLoading: false        
    });
  },

  // Fonction pour vérifier si l'utilisateur est encore connecté
  checkAuth: async () => {
    try {
      // Vérifier si on a un token
      const token = AuthService.getToken();
      if (!token) {
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        return;
      }

      // Vérifier côté serveur si l'utilisateur est connecté
      const isConnected = await AuthService.isAuthenticated();
      
      if (isConnected) {
        // Si oui, on récupère ses informations depuis le serveur
        try {
          const currentUser = await AuthService.getCurrentUser();
          
          // Sauvegarder dans le store
          set({ 
            user: currentUser,
            isAuthenticated: true,
            isLoading: false
          });
          
        } catch {
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } else {
        // Si non connecté, on remet tout à zéro
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch {
      // En cas d'erreur, on considère que l'utilisateur n'est pas connecté
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  // Fonction pour vérifier si l'utilisateur a un rôle spécifique 
  hasRole: async (role: string) => {
    const state = get();
    
    // Si on a l'utilisateur dans le store, vérification rapide
    if (state.user && state.isAuthenticated && state.user.roles) {
      return state.user.roles.includes(role);
    }
    
    // Sinon, vérifier côté serveur
    try {
      return await AuthService.hasRole(role);
    } catch {
      return false;
    }
  },

  // Fonction pour vérifier si l'utilisateur est admin (utilise hasRole)
  isAdmin: async () => {
    return await get().hasRole('ROLE_ADMIN');
  },

  // Fonction pour vérifier si l'utilisateur est un utilisateur normal (utilise hasRole)
  isUser: async () => {
    return await get().hasRole('ROLE_USER');
  }
}));


const store = useAuthStore.getState();
store.initialize();