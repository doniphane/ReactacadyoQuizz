import { createContext } from 'react';
import type { User } from '@/types/Auth';


export interface AuthContextType {

  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;

  // Fonctions d'authentification
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;

  // Fonctions de vérification des rôles
  isAdmin: () => boolean;
  isUser: () => boolean;
  hasRole: (role: string) => boolean;
}


export const AuthContext = createContext<AuthContextType | undefined>(undefined); 