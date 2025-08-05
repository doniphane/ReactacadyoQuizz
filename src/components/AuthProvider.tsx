import { useEffect } from 'react';
import { useAuth } from '../store/authStore';

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const { checkAuth } = useAuth();

    useEffect(() => {
        // Vérifie l'authentification au chargement de l'application
        checkAuth();
    }, [checkAuth]);

    return <>{children}</>;
}; 