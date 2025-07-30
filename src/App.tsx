
import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';


type CurrentPage = 'login' | 'register';

function App() {

  const [currentPage, setCurrentPage] = useState<CurrentPage>('login');

 
  const handleLogin = (data: { email: string; password: string }) => {
    console.log('Connexion réussie avec:', data);

  };


  const handleRegisterSuccess = (message: string) => {
    console.log('Inscription réussie:', message);

    setCurrentPage('login');
  };

  const navigateToLogin = () => {
    setCurrentPage('login');
  };


  const navigateToRegister = () => {
    setCurrentPage('register');
  };

  return (
    <div className="App">
   
      {currentPage === 'login' && (
        <LoginPage 
          onLogin={handleLogin}
          onNavigateToRegister={navigateToRegister}
        />
      )}
      
      {currentPage === 'register' && (
        <RegisterPage 
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={navigateToLogin}
        />
      )}
    </div>
  );
}

export default App;
