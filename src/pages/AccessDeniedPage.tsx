import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, LogIn } from 'lucide-react';

const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToStudent = () => {
    navigate('/student');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="text-center text-white max-w-md">
        {/* Icône */}
        <div className="mb-6">
          <Shield className="w-24 h-24 mx-auto text-red-500" />
        </div>

        {/* Titre */}
        <h1 className="text-4xl font-bold mb-4 text-red-400">
          Accès Refusé
        </h1>

        {/* Message */}
        <p className="text-xl mb-8 text-gray-300">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <Button 
            onClick={handleGoBack}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <Button 
            onClick={handleGoToStudent}
            variant="outline"
            className="w-full border-gray-600 text-white hover:bg-gray-800"
          >
            Accéder aux Quiz
          </Button>

          <Button 
            onClick={handleGoToLogin}
            variant="outline"
            className="w-full border-gray-600 text-white hover:bg-gray-800"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Se connecter avec un autre compte
          </Button>
        </div>

        {/* Code d'erreur */}
        <div className="mt-8 text-sm text-gray-500">
          Erreur 403 - Accès interdit
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage; 