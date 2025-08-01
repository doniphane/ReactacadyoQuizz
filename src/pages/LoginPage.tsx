import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store";
import { LoginForm } from "@/components/login-form";


const LoginPage: React.FC = () => {

  const navigate = useNavigate();
  

  const { login, isAdmin, isUser } = useAuthStore();
  
  // État pour gérer les erreurs de connexion
  const [error, setError] = useState<string>("");

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
    
   
    
    return null; 
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    
    try {
      const formData = new FormData(e.currentTarget);
      const rawUsername = formData.get("email") as string;
      const rawPassword = formData.get("password") as string;

      // === VALIDATIONS CÔTÉ FRONTEND ===
      
      // 1. Vérifier si les champs sont vides
      if (!rawUsername || !rawPassword) {
        setError("Tous les champs sont obligatoires");
        return;
      }

      // 2. Nettoyer les données d'entrée
      const username = sanitizeInput(rawUsername);
      const password = rawPassword; 

      // 3. Vérifier que les champs ne sont pas vides après nettoyage
      if (!username || !password) {
        setError("Veuillez remplir tous les champs correctement");
        return;
      }

      // 4. Vérifier la longueur de l'email
      if (username.length > 254) {
        setError("L'adresse email est trop longue");
        return;
      }

      // 5. Vérifier le format email
      if (!isValidEmail(username)) {
        setError("Veuillez entrer une adresse email valide");
        return;
      }

      // 6. Valider le mot de passe
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }


      if (username.includes('--') || username.includes(';') || username.includes('/*')) {
        setError("Caractères non autorisés détectés");
        return;
      }

    
      
   
      // Connexion de l'utilisateur
      await login(username, password);
      
      // Attendre un peu pour que le store soit mis à jour
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Vérifier les rôles de manière asynchrone
      try {
        const isUserAdmin = await isAdmin();
        const isUserStudent = await isUser();
        
        if (isUserAdmin) {
          navigate('/admin-dashboard');
        } else if (isUserStudent) {
          navigate('/student');
        } else {
          navigate('/student');
        }
      } catch {
        // En cas d'erreur, rediriger vers la page étudiant par défaut
        navigate('/student');
      }
      
    } catch (error) {
   
      if (error instanceof Error) {
     
        if (error.message.includes('Network')) {
          setError("Problème de connexion au serveur. Veuillez réessayer.");
        } else {
          setError("Email ou mot de passe incorrect");
        }
      } else {
        setError("Email ou mot de passe incorrect");
      }
    }
  };

  
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