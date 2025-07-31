import React, { useState, useEffect, type ReactNode } from 'react';
import { AuthService } from '@/lib/auth';
import type { User } from '@/types/Auth';
import { AuthContext, type AuthContextType } from './AuthContextTypes';

// Interface pour les props du provider
interface AuthProviderProps {
  children: ReactNode;
}

// Composant provider pour le contexte d'authentification
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // État pour l'utilisateur connecté
  const [user, setUser] = useState<User | null>(null);
  
  // État pour indiquer si l'authentification est en cours de vérification
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Vérifier si l'utilisateur est connecté
        if (AuthService.isAuthenticated()) {
          const currentUser = AuthService.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
          } catch {
      setUser(null);
    } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fonction pour se connecter
  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Appel du service d'authentification
      const userData = await AuthService.login({ username, password });
      
      // Mise à jour de l'état avec l'utilisateur connecté
      setUser(userData);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour se déconnecter
  const logout = (): void => {
    try {
      // Appel du service d'authentification pour la déconnexion
      AuthService.logout();
      
      // Mise à jour de l'état
      setUser(null);
      
    } catch {
      // Ignorer les erreurs de déconnexion
    }
  };

  // Fonction pour vérifier si l'utilisateur est admin
  const isAdmin = (): boolean => {
    return AuthService.isAdmin();
  };

  // Fonction pour vérifier si l'utilisateur est un utilisateur normal
  const isUser = (): boolean => {
    return AuthService.isUser();
  };

  // Fonction pour vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role: string): boolean => {
    return AuthService.hasRole(role);
  };

  // Calcul de l'état d'authentification
  const isAuthenticated = user !== null;

  // Valeur du contexte
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    isAdmin,
    isUser,
    hasRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

 