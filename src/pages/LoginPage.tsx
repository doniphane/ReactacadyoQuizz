import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store";
import { LoginForm } from "@/components/login-form";

// Composant de la page de connexion avec Zustand
const LoginPage: React.FC = () => {
  // Hook pour la navigation avec React Router
  const navigate = useNavigate();
  
  // Hook pour accéder au store d'authentification
  const { login, isAdmin, isUser } = useAuthStore();
  
  // État pour gérer les erreurs de connexion
  const [error, setError] = useState<string>("");

  // Fonction pour gérer la soumission du formulaire de connexion
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Réinitialisation des erreurs
    setError("");
    
    try {
      const formData = new FormData(e.currentTarget);
      const username = formData.get("email") as string; // Le champ s'appelle "email" dans le formulaire mais on l'utilise comme username
      const password = formData.get("password") as string;
      
      // Appel de la fonction de connexion du contexte
      await login(username, password);
      
      // Redirection selon le rôle de l'utilisateur
      if (isAdmin()) {
        navigate('/admin-dashboard');
      } else if (isUser()) {
        navigate('/student');
      } else {
        // Si aucun rôle spécifique, rediriger vers le dashboard admin par défaut
        navigate('/admin-dashboard');
      }
      
    } catch {
      setError("Email ou mot de passe incorrect");
    }
  };

  // Fonction pour naviguer vers la page d'inscription
  const handleNavigateToRegister = () => {
    navigate('/register');
  };

    return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#18191D' }}>

      <div className="hidden xl:flex w-1/2 items-center justify-end pr-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-white">Acadyo</span>
            <span className="text-amber-500"> Quiz</span>
          </h1>
          <p className="text-white text-xl">Plateforme de quiz</p>
        </div>
      </div>

      <div className="w-full xl:w-1/2 flex items-center justify-center p-6 xl:justify-start xl:pl-16">
        <div className="w-full max-w-md bg-white rounded-lg border-2 border-amber-500 shadow-2xl p-8">

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connexion
            </h2>
            <p className="text-gray-600">Accédez à votre espace</p>
          </div>

          {/* Affichage des erreurs de connexion */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <LoginForm onSubmit={handleSubmit} onNavigateToRegister={handleNavigateToRegister} className="space-y-4" />
        </div>
      </div>
      
    </div>
  );
};

export default LoginPage; 