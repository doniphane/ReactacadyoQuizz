
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudentPage from './pages/StudentPage';
import CreateQuizPage from './pages/CreateQuizPage';
import TakeQuizPage from './pages/TakeQuizPage';
import QuizResultsPage from './pages/QuizResultsPage';
import ManageQuestionsPage from './pages/ManageQuestionsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store';

// Composant principal de l'application avec React Router
function App() {
  // Hook pour accéder au store d'authentification
  const { checkAuth } = useAuthStore();

  // Vérifier l'authentification au chargement de l'application
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="App">
      {/* Configuration des routes de l'application */}
      <Routes>
        {/* Route par défaut - redirige vers /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Route pour la page de connexion */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Route pour la page d'inscription */}
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Route protégée pour le dashboard admin - rôle admin requis */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Route protégée pour la création de quiz - rôle admin requis */}
        <Route 
          path="/create-quiz" 
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <CreateQuizPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Route protégée pour l'espace élève - rôle user requis */}
        <Route 
          path="/student" 
          element={
            <ProtectedRoute requiredRole="ROLE_USER">
              <StudentPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Route pour passer le quiz */}
        <Route 
          path="/take-quiz" 
          element={<TakeQuizPage />} 
        />
        
        {/* Route pour voir les résultats du quiz */}
        <Route 
          path="/quiz-results" 
          element={<QuizResultsPage />} 
        />
        
        {/* Route protégée pour la gestion des questions - rôle admin requis */}
        <Route 
          path="/manage-questions/:quizId" 
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <ManageQuestionsPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
