// Composant principal de l'application
// Ce composant configure le routage et la protection des routes
// Il gère la redirection automatique selon l'authentification

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

// Import des composants
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminPage from './components/AdminPage';
import StudentPage from './components/StudentPage';
import TakeQuizPage from './components/TakeQuizPage';
import CreateQuizPage from './components/CreateQuizPage';
import ManageQuestionsPage from './components/ManageQuestionsPage';
import QuizResultsPage from './components/QuizResultsPage';
import QuizResultsDetailPage from './components/QuizResultsDetailPage';
import StudentHistoryPage from './components/StudentHistoryPage';
import ProtectedRoute from './components/ProtectedRoute';

// Import du service d'authentification
import AuthService from './services/AuthService';

function App() {
  // État pour gérer le chargement initial de l'application
  const [isLoading, setIsLoading] = useState(true);

  // Effet pour vérifier l'authentification au chargement de l'app
  useEffect(() => {
    // Simule un petit délai pour vérifier l'authentification
    const checkAuth = () => {
      // Termine le chargement - on ne fait plus de redirection automatique ici
      // La redirection sera gérée par les composants ProtectedRoute
      setIsLoading(false);
    };

    // Appelle la vérification après un petit délai
    const timer = setTimeout(checkAuth, 100);

    // Nettoie le timer si le composant est démonté
    return () => clearTimeout(timer);
  }, []);

  // Affiche un écran de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          {/* Icône de chargement */}
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {/* Configuration du Toaster pour les notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Configuration des routes */}
        <Routes>
          {/* Route pour la page de connexion */}
          <Route
            path="/login"
            element={<LoginPage />}
          />

          {/* Route pour la page d'inscription */}
          <Route
            path="/register"
            element={<RegisterPage />}
          />

          {/* Route pour la page admin (protégée) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Route pour la page étudiant (protégée) */}
          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <StudentPage />
              </ProtectedRoute>
            }
          />

          {/* Route pour la page de quiz (protégée) */}
          <Route
            path="/take-quiz"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <TakeQuizPage />
              </ProtectedRoute>
            }
          />

          {/* Route pour la page d'historique étudiant (protégée) */}
          <Route
            path="/student-history"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <StudentHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Route pour la page de création de quiz (protégée) */}
          <Route
            path="/create-quiz"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <CreateQuizPage />
              </ProtectedRoute>
            }
          />

          {/* Route pour la page de gestion des questions (protégée) */}
          <Route
            path="/manage-questions/:quizId"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <ManageQuestionsPage />
              </ProtectedRoute>
            }
          />

          {/* Route pour la page des résultats de quiz (protégée) */}
          <Route
            path="/quiz-results"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <QuizResultsPage />
              </ProtectedRoute>
            }
          />

          {/* Route pour la page des résultats détaillés de quiz (protégée) */}
          <Route
            path="/quiz-results-detail"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <QuizResultsDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Route par défaut - redirige vers login */}
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          {/* Route pour les URLs non trouvées - redirige vers login */}
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
