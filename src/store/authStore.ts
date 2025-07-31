import { create } from 'zustand';
import { AuthService } from '@/lib/auth';
import type { User } from '@/lib/auth'; // Correction de l'import

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
  initialize: () => void;     // Fonction pour initialiser le store
  
  // Fonctions pour vérifier les rôles
  isAdmin: () => boolean;
  isUser: () => boolean;
  hasRole: (role: string) => boolean;
}

// Création du store avec Zustand
export const useAuthStore = create<AuthState>((set, get) => ({
  // Valeurs par défaut au démarrage
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // Fonction pour initialiser le store (vérifier si déjà connecté)
  initialize: () => {
    console.log('Initialisation du store d\'authentification...');
    get().checkAuth();
  },

  // Fonction pour connecter un utilisateur
  login: async (username: string, password: string) => {
    console.log('Tentative de connexion...');
    set({ isLoading: true });
    
    try {
      // On essaie de se connecter via le service
      const userData = await AuthService.login({ username, password });
      console.log('Connexion réussie:', userData);
      
      // Si ça marche, on met à jour notre store
      set({ 
        user: userData,           // On sauvegarde l'utilisateur
        isAuthenticated: true,    // On dit qu'il est connecté
        isLoading: false         // On dit que le chargement est fini
      });
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
      // Si ça ne marche pas, on arrête le chargement
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false 
      });
      
      // On relance l'erreur pour que le composant puisse la gérer
      throw error;
    }
  },

  // Fonction pour déconnecter un utilisateur
  logout: () => {
    console.log('Déconnexion...');
    try {
      // On appelle le service pour supprimer les cookies
      AuthService.logout();
      
      // On remet tout à zéro dans notre store
      set({ 
        user: null,              // Plus d'utilisateur
        isAuthenticated: false,  // Plus connecté
        isLoading: false        // Pas de chargement
      });
      
      console.log('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, on force la déconnexion côté store
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  // Fonction pour vérifier si l'utilisateur est encore connecté
  checkAuth: () => {
    console.log('Vérification de l\'authentification...');
    
    try {
      // On demande au service si l'utilisateur est connecté (vérifie les cookies + JWT)
      const isConnected = AuthService.isAuthenticated();
      console.log('Utilisateur connecté:', isConnected);
      
      if (isConnected) {
        // Si oui, on récupère ses informations depuis les cookies
        const currentUser = AuthService.getCurrentUser();
        console.log('Données utilisateur récupérées:', currentUser);
        
        if (currentUser) {
          // Si on a un utilisateur dans les cookies, on le sauvegarde dans le store
          set({ 
            user: currentUser,
            isAuthenticated: true,
            isLoading: false
          });
          console.log('Store mis à jour avec l\'utilisateur connecté');
        } else {
          // Si pas d'utilisateur dans les cookies, on remet à zéro
          console.log('Pas de données utilisateur trouvées, déconnexion');
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } else {
        // Si non connecté, on remet tout à zéro
        console.log('Utilisateur non connecté, reset du store');
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      // En cas d'erreur, on considère que l'utilisateur n'est pas connecté
      console.error('Erreur lors de la vérification:', error);
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  // Fonction pour vérifier si l'utilisateur est admin
  isAdmin: () => {
    const state = get();
    // D'abord vérifier si on a un utilisateur dans le store
    if (state.user && state.isAuthenticated) {
      return state.user.roles.includes('ROLE_ADMIN');
    }
    // Sinon, vérifier via le service (cookies)
    return AuthService.isAdmin();
  },

  // Fonction pour vérifier si l'utilisateur est un utilisateur normal
  isUser: () => {
    const state = get();
    // D'abord vérifier si on a un utilisateur dans le store
    if (state.user && state.isAuthenticated) {
      return state.user.roles.includes('ROLE_USER');
    }
    // Sinon, vérifier via le service (cookies)
    return AuthService.isUser();
  },

  // Fonction pour vérifier si l'utilisateur a un rôle spécifique
  hasRole: (role: string) => {
    const state = get();
    // D'abord vérifier si on a un utilisateur dans le store
    if (state.user && state.isAuthenticated) {
      return state.user.roles.includes(role);
    }
    // Sinon, vérifier via le service (cookies)
    return AuthService.hasRole(role);
  }
}));

// Auto-initialisation du store dès que le module est importé
// Cela garantit que l'état est vérifié automatiquement au démarrage de l'app
const store = useAuthStore.getState();
store.initialize();