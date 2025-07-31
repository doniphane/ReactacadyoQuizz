import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, Eye, FileText, Users, UserCheck, User, Loader2, Edit } from 'lucide-react';
import { QuizApiService } from '@/lib/quizApi';

// Interface pour les métriques du dashboard
interface DashboardMetrics {
  quizzesCreated: number;
  totalAttempts: number;
  registeredUsers: number;
}

// Interface pour un quiz simplifié pour l'affichage
interface QuizDisplay {
  id: number;
  title: string;
  uniqueCode: string;
  isActive: boolean;
  isStarted: boolean;
  createdAt: string;
}

// Composant principal du dashboard admin
const DashboardPage: React.FC = () => {
  // Hook pour la navigation avec React Router
  const navigate = useNavigate();
  
  // Hook pour accéder au store d'authentification
  const { logout } = useAuthStore();
  
  // États pour les données récupérées de l'API
  const [quizzes, setQuizzes] = useState<QuizDisplay[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    quizzesCreated: 0,
    totalAttempts: 0,
    registeredUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer les quiz depuis l'API
  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const quizzesData = await QuizApiService.getQuizzes();
      
      // Transformer les données pour l'affichage
      const displayQuizzes: QuizDisplay[] = quizzesData.map(quiz => ({
        id: quiz.id || 0,
        title: quiz.title,
        uniqueCode: quiz.uniqueCode || 'N/A',
        isActive: quiz.isActive,
        isStarted: quiz.isStarted,
        createdAt: quiz.createdAt || new Date().toISOString()
      }));
      
      setQuizzes(displayQuizzes);
      
      // Mettre à jour les métriques
      setMetrics({
        quizzesCreated: displayQuizzes.length,
        totalAttempts: displayQuizzes.length * 2, // Simulation pour l'instant
        registeredUsers: 15 // Simulation pour l'instant
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des quiz:', error);
      setError('Erreur lors du chargement des quiz');
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les quiz au chargement de la page
  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Fonction pour gérer la création d'un nouveau quiz
  const handleCreateQuiz = () => {
    // Navigation vers la page de création de quiz
    navigate('/create-quiz');
  };

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    // Utiliser la fonction de déconnexion du contexte
    logout();
    // Redirection vers la page de connexion après déconnexion
    navigate('/login');
  };

  // Fonction pour voir les résultats d'un quiz
  const handleViewResults = (quizId: number) => {
    console.log(`Voir les résultats du quiz ${quizId}`);
    // Ici on pourrait naviguer vers une page de résultats
  };

  // Fonction pour modifier un quiz (gérer les questions)
  const handleEditQuiz = (quizId: number) => {
    navigate(`/manage-questions/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        {/* Titre et sous-titre */}
        <div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            Dashboard Admin
          </h1>
          <p className="text-gray-300 text-lg">
            Gérez vos quiz et analysez les performances
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button 
            onClick={handleCreateQuiz}
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un quiz
          </Button>
          <Button 
            onClick={() => navigate('/student')}
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          >
            <User className="w-4 h-4 mr-2" />
            Espace Élève
          </Button>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Section des métriques clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Métrique 1: Quiz Créés */}
        <Card className="bg-yellow-400 text-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Quiz Créés</p>
                <p className="text-2xl font-bold">{metrics.quizzesCreated}</p>
              </div>
              <FileText className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        {/* Métrique 2: Nombre de Tentatives */}
        <Card className="bg-yellow-400 text-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">NB : Tentative</p>
                <p className="text-2xl font-bold">{metrics.totalAttempts}</p>
              </div>
              <UserCheck className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        {/* Métrique 3: Nombre d'Inscrits */}
        <Card className="bg-yellow-400 text-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Nombre Inscrits</p>
                <p className="text-2xl font-bold">{metrics.registeredUsers}</p>
              </div>
              <Users className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section de la liste des quiz */}
      <Card className="bg-gray-100 text-gray-900">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Liste des Quiz</CardTitle>
          <p className="text-gray-600">Gérez vos quiz</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Chargement des quiz...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">
              {error}
              <Button 
                onClick={fetchQuizzes}
                className="ml-4 bg-red-600 hover:bg-red-700 text-white"
              >
                Réessayer
              </Button>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              Aucun quiz créé pour le moment.
              <Button 
                onClick={handleCreateQuiz}
                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Créer votre premier quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div 
                  key={quiz.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                >
                  {/* Informations du quiz */}
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                      <p className="text-sm text-gray-500">
                        Créé le {new Date(quiz.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-medium">
                      {quiz.uniqueCode}
                    </span>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        quiz.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {quiz.isActive ? 'Actif' : 'Inactif'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        quiz.isStarted ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {quiz.isStarted ? 'Démarré' : 'En attente'}
                      </span>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleEditQuiz(quiz.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button 
                      onClick={() => handleViewResults(quiz.id)}
                      className="bg-gray-800 hover:bg-gray-700 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Résultat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage; 