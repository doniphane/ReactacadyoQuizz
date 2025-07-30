import React, { useState, useEffect, type ReactNode } from 'react';
import { AuthService } from '@/lib/auth';
import type { User } from '@/types/Auth';
import { AuthContext, type AuthContextType } from './AuthContextTypes';


interface AuthProviderProps {
  children: ReactNode;
}


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {

  const [user, setUser] = useState<User | null>(null);
  

  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const checkAuth = () => {
      try {
      
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


  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      

      const userData = await AuthService.login({ username, password });
      
  
      setUser(userData);
      
    } finally {
      setIsLoading(false);
    }
  };


  const logout = (): void => {
    try {
     
      AuthService.logout();
      
  
      setUser(null);
      
    } catch {
     //
    }
  };


  const isAdmin = (): boolean => {
    return AuthService.isAdmin();
  };


  const isUser = (): boolean => {
    return AuthService.isUser();
  };

 
  const hasRole = (role: string): boolean => {
    return AuthService.hasRole(role);
  };

 
  const isAuthenticated = user !== null;


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

 