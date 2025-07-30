import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

// Interface pour définir les props du composant ProtectedRoute
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

// Composant pour protéger les routes selon les rôles
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}) => {
  // Hook pour accéder au store d'authentification
  const { isAuthenticated, isLoading, hasRole } = useAuthStore();

  // Affichage d'un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si un rôle spécifique est requis, vérifier que l'utilisateur l'a
  if (requiredRole && !hasRole(requiredRole)) {
    // Rediriger vers la page appropriée selon le rôle
    if (hasRole('ROLE_ADMIN')) {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (hasRole('ROLE_USER')) {
      return <Navigate to="/student" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // Si tout est OK, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute; 