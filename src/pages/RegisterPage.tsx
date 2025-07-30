import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RegisterForm } from "@/components/register-form";
import { UserApiService, ApiError } from "@/lib/api";
import type { UserCreateRequest, UserResponse } from "@/types/User";


const RegisterPage: React.FC = () => {
  // Hook pour la navigation avec React Router
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const resetAllMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const showSuccessMessage = () => {
    const message = `Compte créé avec succès ! Bienvenue !`;
    setSuccessMessage(message);


    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  const handleApiErrors = (error: ApiError) => {
    if (error.status === 409) {
      setErrorMessage("Cet email est déjà utilisé par un autre compte");
    } else if (error.status === 422) {
      setErrorMessage("Les données du formulaire ne sont pas valides");
    } else {
      setErrorMessage(error.message || "Erreur lors de la création du compte");
    }
  };

  const handleUnknownError = () => {
    setErrorMessage("Une erreur est survenue. Veuillez réessayer plus tard.");
  };

  const handleRegisterSubmit = async (userData: UserCreateRequest) => {
    console.log("Début de l'inscription...");

    resetAllMessages();

    setIsLoading(true);

    try {
      console.log("Appel de l'API pour créer l'utilisateur");
      const createdUser: UserResponse = await UserApiService.createUser(
        userData
      );

      console.log("Utilisateur créé avec succès:", createdUser);
      showSuccessMessage();
    } catch (error) {
      console.error("Erreur lors de la création:", error);

      if (error instanceof ApiError) {
        handleApiErrors(error);
      } else {
        handleUnknownError();
      }
    } finally {
      setIsLoading(false);
      console.log("Fin de l'inscription");
    }
  };

  const goToLoginPage = () => {
    navigate('/login');
  };

  const renderErrorMessage = () => {
    if (!errorMessage) return null;

    return (
      <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="text-sm">{errorMessage}</p>
      </div>
    );
  };

  const renderSuccessMessage = () => {
    if (!successMessage) return null;

    return (
      <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
        <p className="text-sm">{successMessage}</p>
      </div>
    );
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
          {renderErrorMessage()}

          {renderSuccessMessage()}

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
