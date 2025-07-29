import React, { useState } from "react";
import { RegisterForm } from "@/components/register-form";
import { UserApiService, ApiError } from "@/lib/api";
import type { UserCreateRequest } from "@/types/User";

interface RegisterPageProps {
  onRegisterSuccess?: (message: string) => void;
  onNavigateToLogin?: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ 
  onRegisterSuccess, 
  onNavigateToLogin 
}) => {

  const [isLoading, setIsLoading] = useState<boolean>(false);
  

  const [errorMessage, setErrorMessage] = useState<string>("");
  

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  

  const [successMessage, setSuccessMessage] = useState<string>("");


  const handleRegisterSubmit = async (userData: UserCreateRequest) => {

    setErrorMessage("");
    setFieldErrors({});
    setSuccessMessage("");
    setIsLoading(true);

    try {

      const createdUser = await UserApiService.createUser(userData);
      

      console.log("Utilisateur créé avec succès:", createdUser);
      
      const successMsg = `Compte créé avec succès ! Bienvenue ${createdUser.firtName} ${createdUser.lastName}`;
      setSuccessMessage(successMsg);
      

      if (onRegisterSuccess) {
        onRegisterSuccess(successMsg);
      }

    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      
      if (error instanceof ApiError) {

        if (error.violations && error.violations.length > 0) {
          const newFieldErrors: { [key: string]: string } = {};
          
          error.violations.forEach(violation => {
      
            const fieldName = violation.propertyPath;
            newFieldErrors[fieldName] = violation.message;
          });
          
          setFieldErrors(newFieldErrors);
        } else {
        
          setErrorMessage(error.message);
        }
        

        if (error.status === 409) {
          setErrorMessage("Cet email est déjà utilisé par un autre compte");
        } else if (error.status === 422) {
          setErrorMessage("Les données fournies ne sont pas valides");
        }
      } else {
  
        setErrorMessage("Une erreur est survenue. Veuillez réessayer plus tard.");
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleNavigateToLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#18191D' }}>

      <div className="hidden xl:flex w-1/2 items-center justify-end pr-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-white">Acadyo</span>
            <span className="text-amber-500"> Quiz</span>
          </h1>
          <p className="text-white text-xl">Rejoignez notre plateforme de quiz</p>
          <p className="text-gray-300 text-sm mt-2">
            Créez, partagez et participez à des quiz interactifs
          </p>
        </div>
      </div>


      <div className="w-full xl:w-1/2 flex items-center justify-center p-6 xl:justify-start xl:pl-16">
        <div className="w-full max-w-md">
          

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}


          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <p className="text-sm">{successMessage}</p>
            </div>
          )}


          {Object.keys(fieldErrors).length > 0 && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="text-sm font-medium mb-2">Erreurs de validation :</p>
              <ul className="text-sm space-y-1">
                {Object.entries(fieldErrors).map(([field, message]) => (
                  <li key={field}>• {message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Formulaire d'inscription */}
          <RegisterForm 
            onSubmit={handleRegisterSubmit}
            isLoading={isLoading}
            className="bg-white rounded-lg border-2 border-amber-500 shadow-2xl"
          />

          {/* Lien vers la page de connexion */}
          <div className="mt-6 text-center">
            <p className="text-white text-sm">
              Déjà un compte ?{" "}
              <button
                onClick={handleNavigateToLogin}
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