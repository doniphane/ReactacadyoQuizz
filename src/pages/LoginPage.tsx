import React from "react";
import { LoginForm } from "@/components/login-form";


interface LoginPageProps {
  onLogin?: (data: { email: string; password: string }) => void;
}


const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };
    
    console.log("Connexion avec LoginForm:", data);
    
    if (onLogin) {
      onLogin(data);
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

          <LoginForm onSubmit={handleSubmit} className="space-y-4" />
        </div>
      </div>
      
    </div>
  );
};

export default LoginPage; 