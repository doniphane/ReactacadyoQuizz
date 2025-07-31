import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, Eye, FileText, Users, UserCheck, User, Loader2, Edit, Play, Pause, RefreshCw } from 'lucide-react';
import { QuizApiService, QuizApiError } from '@/lib/quizApi';
import { AuthService } from '@/lib/auth';
import type { Quiz, DashboardMetrics } from '@/types/Quiz';

// Composant principal du dashboard admin
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  
  // États pour les données
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    quizzesCreated: 0,
    totalAttempts: 0,
    registeredUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingQuizId, setUpdatingQuizId] = useState<number | null>(null);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await QuizApiService.getQuizzes();
      console.log('Réponse de l\'API:', response); 
      
    
      let quizzesArray: Quiz[];
      if (Array.isArray(response)) {
        // Réponse directe en tableau
        quizzesArray = response;
      } else if (response && Array.isArray(response.member)) {
        // Format API Platform (JSON-LD) - les quiz sont dans "member"
        quizzesArray = response.member;
      } else {
        console.error('Format de réponse inattendu:', response);
        quizzesArray = []; 
      }
      
      setQuizzes(quizzesArray);
      
      // Mettre à jour les métriques
      setMetrics({
        quizzesCreated: quizzesArray.length,
        totalAttempts: quizzesArray.length * 2, 
        registeredUsers: 15 
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des quiz:', error);
      
      if (error instanceof QuizApiError) {
        setError(error.message);
      } else {
        setError('Erreur lors du chargement des quiz');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // NOUVELLE FONCTION : Mettre à jour le statut d'un quiz
  const updateQuizStatus = async (quizId: number, isActive: boolean) => {
    try {
      setUpdatingQuizId(quizId);
      
      // Récupérer le token depuis les cookies (pas localStorage)
      const token = AuthService.getToken();
      if (!token) {
        toast.error('Vous devez être connecté pour effectuer cette action');
        return;
      }

      console.log('Token récupéré:', token ? 'Présent' : 'Absent');

      // Appel API via API Platform
      const response = await fetch(`http://localhost:8000/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive })
      });

      console.log('Réponse API:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      // Mettre à jour la liste locale
      setQuizzes(prevQuizzes => 
        prevQuizzes.map(quiz => 
          quiz.id === quizId 
            ? { ...quiz, isActive }
            : quiz
        )
      );

      // Message de succès simple
      if (isActive) {
        toast.success(' Quiz activé ! Les étudiants peuvent y accéder');
      } else {
        toast.success('⏸Quiz désactivé"');
      }

    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error(' Erreur lors de la mise à jour du statut du quiz');
    } finally {
      setUpdatingQuizId(null);
    }
  };

  // Charger les quiz au démarrage
  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Fonctions de navigation
  const handleCreateQuiz = () => {
    navigate('/create-quiz');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewResults = (quizId: number) => {
    console.log(`Voir les résultats du quiz ${quizId}`);
    // Navigation vers les résultats
  };

  const handleEditQuiz = (quizId: number) => {
    navigate(`/manage-questions/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            Dashboard Admin
          </h1>
          <p className="text-gray-300 text-lg">
            Gérez vos quiz et activez/désactivez-les et analysez les performances
          </p>
        </div>

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

      {/* Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

      {/* Liste des quiz */}
      <Card className="bg-gray-100 text-gray-900">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Liste des Quiz</CardTitle>
          <p className="text-gray-600">Gérez vos quiz et activez/désactivez-les</p>
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
                  {/* Infos du quiz */}
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                      <p className="text-sm text-gray-500">
                        {quiz.createdAt 
                          ? `Créé le ${new Date(quiz.createdAt).toLocaleDateString()}`
                          : 'Date de création inconnue'
                        }
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
                    {/* NOUVEAU BOUTON TOGGLE */}
                    <Button
                      onClick={() => updateQuizStatus(quiz.id || 0, !quiz.isActive)}
                      disabled={updatingQuizId === quiz.id}
                      className={`${
                        quiz.isActive 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      } min-w-[100px]`}
                    >
                      {updatingQuizId === quiz.id ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : quiz.isActive ? (
                        <Pause className="w-4 h-4 mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {updatingQuizId === quiz.id ? 'Mise à jour...' : quiz.isActive ? 'Désactiver' : 'Activer'}
                    </Button>
                    
                    <Button 
                      onClick={() => handleEditQuiz(quiz.id || 0)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button 
                      onClick={() => handleViewResults(quiz.id || 0)}
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