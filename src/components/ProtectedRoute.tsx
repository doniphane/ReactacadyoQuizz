

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import AuthService from '../services/AuthService';


// Interface pour définir les props du composant ProtectedRoute
interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: string;
    redirectTo?: string;
}

// Interface pour l'état de navigation qui peut être passé avec Navigate
interface NavigationState {
    from?: Location;
    error?: string;
}

// Type pour les rôles utilisateur supportés
type UserRole = 'ROLE_ADMIN' | 'ROLE_STUDENT' | 'ROLE_USER' | string;

// Type pour l'état d'authentification
type AuthenticationStatus = boolean;

// Type pour le statut de vérification des rôles
type RoleCheckResult = boolean;



function ProtectedRoute({ 
    children, 
    requiredRole, 
    redirectTo = '/login' 
}: ProtectedRouteProps) {
    // Hook pour récupérer l'URL actuelle
    const location: Location = useLocation();

    // Vérifie si l'utilisateur est authentifié
    const isAuthenticated: AuthenticationStatus = AuthService.isAuthenticated();

    // Si l'utilisateur n'est pas connecté, on le redirige vers la page de connexion
    if (!isAuthenticated) {
        // On sauvegarde l'URL actuelle pour rediriger après connexion
        const navigationState: NavigationState = { from: location };
        
        return <Navigate to={redirectTo} state={navigationState} replace />;
    }

    // Si un rôle spécifique est requis, on vérifie que l'utilisateur l'a
    if (requiredRole) {
        const hasRequiredRole: RoleCheckResult = AuthService.hasRole(requiredRole as UserRole);

        if (!hasRequiredRole) {
            // Si l'utilisateur n'a pas le bon rôle, on le redirige
            // On peut rediriger vers une page d'erreur ou vers login
            const navigationState: NavigationState = { 
                from: location, 
                error: 'Accès non autorisé' 
            };
            
            return <Navigate to={redirectTo} state={navigationState} replace />;
        }
    }


    return <>{children}</>;
}

export default ProtectedRoute;