import React, { useState, useEffect } from 'react';
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
  const { isAuthenticated, isLoading, hasRole, user } = useAuthStore();
  
  // État pour gérer la vérification des rôles
  const [roleCheckLoading, setRoleCheckLoading] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState<boolean | null>(null);

  // Vérifier le rôle requis de manière asynchrone
  useEffect(() => {
    const checkRole = async () => {
      if (!requiredRole || !isAuthenticated) {
        setHasRequiredRole(true);
        return;
      }

      setRoleCheckLoading(true);
      try {
        const hasRoleResult = await hasRole(requiredRole);
        setHasRequiredRole(hasRoleResult);
      } catch {
        setHasRequiredRole(false);
      } finally {
        setRoleCheckLoading(false);
      }
    };

    checkRole();
  }, [requiredRole, isAuthenticated, hasRole]);

  // Affichage d'un loader pendant la vérification de l'authentification ou des rôles
  if (isLoading || roleCheckLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          {isLoading ? 'Chargement...' : 'Vérification des permissions...'}
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si un rôle spécifique est requis et que l'utilisateur ne l'a pas
  if (requiredRole && hasRequiredRole === false) {
    // Rediriger vers la page appropriée selon le rôle de l'utilisateur
    if (user?.roles?.includes('ROLE_ADMIN')) {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user?.roles?.includes('ROLE_USER')) {
      return <Navigate to="/student" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // Si tout est OK, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute; 