import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RegisterForm } from "@/components/register-form";
import { UserApiService, ApiError } from "@/lib/api";

// Types simples pour correspondre au fichier api.ts simplifié
interface NewUser {
  email: string;
  password: string;
}

interface User {
  id: number;
  email: string;
  roles: string[];
}

// Composant de la page d'inscription avec React Router
const RegisterPage: React.FC = () => {
  // Hook pour la navigation avec React Router
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // === FONCTIONS DE VALIDATION ===

  // Fonction pour valider le format email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fonction pour nettoyer et sécuriser les entrées
  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, ''); 
  };

  // Fonction pour valider le mot de passe
  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Le mot de passe doit contenir au moins 6 caractères";
    }
    
    if (password.length > 100) {
      return "Le mot de passe est trop long (maximum 100 caractères)";
    }
    
    // Vérifier qu'il contient au moins une lettre et un chiffre
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return "Le mot de passe doit contenir au moins une lettre et un chiffre";
    }
    
    return null; 
  };

  // Fonction pour valider l'email
  const validateEmail = (email: string): string | null => {
    const cleanEmail = sanitizeInput(email);
    
    if (!cleanEmail) {
      return "L'adresse email est obligatoire";
    }
    
    if (cleanEmail.length > 254) {
      return "L'adresse email est trop longue";
    }
    
    if (!isValidEmail(cleanEmail)) {
      return "Veuillez entrer une adresse email valide";
    }
    
    // Vérifier contre les tentatives d'injection
    if (cleanEmail.includes('--') || cleanEmail.includes(';') || cleanEmail.includes('/*')) {
      return "Caractères non autorisés détectés dans l'email";
    }
    
    return null; 
  };

  // === FONCTIONS HELPER CENTRALISÉES ===

  // Réinitialiser tous les messages
  const resetAllMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Afficher un message d'erreur
  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage(""); 
  };

  // Afficher un message de succès et rediriger
  const showSuccessMessage = () => {
    const message = `Compte créé avec succès ! Redirection...`;
    setSuccessMessage(message);
    setErrorMessage(""); 

    // Redirection vers la page de connexion après inscription réussie
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  // Gérer les erreurs de l'API
  const handleApiError = (error: unknown) => {
    console.error("Erreur lors de la création:", error);

    if (error instanceof ApiError) {
      // Gestion spécifique des erreurs API
      if (error.status === 409) {
        showErrorMessage("Cet email est déjà utilisé par un autre compte");
      } else if (error.status === 422) {
        showErrorMessage("Les données du formulaire ne sont pas valides");
      } else if (error.status === 400) {
        showErrorMessage("Données invalides. Vérifiez votre saisie.");
      } else {
        showErrorMessage(error.message || "Erreur lors de la création du compte");
      }
    } else if (error instanceof Error) {
      // Gestion des autres types d'erreurs
      if (error.message.includes('Network')) {
        showErrorMessage("Problème de connexion au serveur. Veuillez réessayer.");
      } else {
        showErrorMessage("Une erreur est survenue. Veuillez réessayer plus tard.");
      }
    } else {
      showErrorMessage("Une erreur est survenue. Veuillez réessayer plus tard.");
    }
  };

  // === FONCTION PRINCIPALE ===

  // Gérer la soumission du formulaire avec validation
  const handleRegisterSubmit = async (userData: NewUser) => {


    resetAllMessages();

  
    
    // 1. Vérifier que les champs ne sont pas vides
    if (!userData.email || !userData.password) {
      showErrorMessage("Tous les champs sont obligatoires");
      return;
    }

    // 2. Valider l'email
    const emailError = validateEmail(userData.email);
    if (emailError) {
      showErrorMessage(emailError);
      return;
    }

    // 3. Valider le mot de passe
    const passwordError = validatePassword(userData.password);
    if (passwordError) {
      showErrorMessage(passwordError);
      return;
    }

    // 4. Nettoyer les données avant envoi
    const cleanUserData: NewUser = {
      email: sanitizeInput(userData.email),
      password: userData.password 
    };



    setIsLoading(true);

    try {
      
      const createdUser: User = await UserApiService.createUser(cleanUserData);

      showSuccessMessage();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
  
    }
  };

  // Naviguer vers la page de connexion
  const goToLoginPage = () => {
    navigate('/login');
  };



 
  const MessageDisplay: React.FC = () => {
    if (errorMessage) {
      return (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="text-sm">{errorMessage}</p>
        </div>
      );
    }

    if (successMessage) {
      return (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <p className="text-sm">{successMessage}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#18191D" }}>
      <div className="hidden xl:flex w-1/2 items-center justify-end pr-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-white">Acadyo</span>
            <span className="text-amber-500"> Quiz</span>
          </h1>
        </div>
      </div>

      <div className="w-full xl:w-1/2 flex items-center justify-center p-6 xl:justify-start xl:pl-16">
        <div className="w-full max-w-md">
      
          <MessageDisplay />

          <RegisterForm
            onSubmit={handleRegisterSubmit}
            isLoading={isLoading}
            className="bg-white rounded-lg border-2 border-amber-500 shadow-2xl"
          />

          <div className="mt-6 text-center">
            <p className="text-white text-sm">
              Déjà un compte ?{" "}
              <button
                onClick={goToLoginPage}
                className="text-amber-500 hover:text-amber-400 font-medium underline"
                disabled={isLoading}
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;