import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store";
import { LoginForm } from "@/components/login-form";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const { login, isAdmin, isUser } = useAuthStore();

  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const username = formData.get("email") as string;
      const password = formData.get("password") as string;

   

      await login(username, password);


      if (isAdmin()) {
        navigate("/admin-dashboard");
      } else if (isUser()) {
        navigate("/student");
      } else {
        navigate("/admin-dashboard");
      }
    } catch {
      setError("Email ou mot de passe incorrect");
    }
  };

  const handleNavigateToRegister = () => {
    navigate("/register");
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#18191D" }}>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h2>
            <p className="text-gray-600">Accédez à votre espace</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <LoginForm
            onSubmit={handleSubmit}
            onNavigateToRegister={handleNavigateToRegister}
            className="space-y-4"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
