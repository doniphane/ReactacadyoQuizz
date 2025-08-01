import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, Eye, FileText, Users, UserCheck, User, Loader2, Edit, Play, Pause, RefreshCw, Trash2 } from 'lucide-react';
import { QuizApiService, QuizApiError } from '@/lib/quizApi';
import { AuthService } from '@/lib/auth';
import type { Quiz, DashboardMetrics } from '@/types/Quiz';


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
  const [deletingQuizId, setDeletingQuizId] = useState<number | null>(null);



  // Options communes pour les toasts
  const toastOptions = {
    duration: 4000,
    style: {
      padding: '12px',
      fontSize: '14px',
    },
  };

  // Afficher un toast d'erreur
  const showErrorToast = (message: string) => {
    toast.error(message, toastOptions);
  };

  // Afficher un toast de succès
  const showSuccessToast = (message: string) => {
    toast.success(message, toastOptions);
  };

  // Valider un ID de quiz
  const validateQuizId = (quizId: number | undefined): boolean => {
    if (!quizId || quizId <= 0) {
      showErrorToast('ID de quiz invalide');
      return false;
    }
    return true;
  };


  const getAuthHeaders = (): HeadersInit | null => {
    const token = AuthService.getToken();
    if (!token) {
      showErrorToast('Vous devez être connecté pour effectuer cette action');
      return null;
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };


  const makeSecureApiCall = async (url: string, options: RequestInit) => {
    const headers = getAuthHeaders();
    if (!headers) return null;

    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur API:', errorText);
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response;
  };


  // Récupérer les quiz depuis l'API
  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await QuizApiService.getQuizzes();
      console.log('Réponse de l\'API:', response); 
      
      // Vérifier le format de la réponse
      let quizzesArray: Quiz[];
      if (Array.isArray(response)) {
        quizzesArray = response;
      } else if (response && Array.isArray(response.member)) {
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

  // Mettre à jour le statut d'un quiz
  const updateQuizStatus = async (quizId: number | undefined, isActive: boolean) => {
    // Validation côté frontend
    if (!validateQuizId(quizId)) return;
    
    const safeQuizId = quizId!; // On sait qu'il est valide maintenant

    try {
      setUpdatingQuizId(safeQuizId);
      
      const response = await makeSecureApiCall(
        `http://localhost:8000/api/quizzes/${safeQuizId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ isActive })
        }
      );

      if (!response) return; 

      // Mettre à jour la liste locale
      setQuizzes(prevQuizzes => 
        prevQuizzes.map(quiz => 
          quiz.id === safeQuizId 
            ? { ...quiz, isActive }
            : quiz
        )
      );

     
      showSuccessToast(
        isActive 
          ? 'Quiz activé ! Les étudiants peuvent y accéder' 
          : 'Quiz désactivé'
      );

    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      showErrorToast('Erreur lors de la mise à jour du statut du quiz');
    } finally {
      setUpdatingQuizId(null);
    }
  };

  // Confirmer et supprimer un quiz
  const confirmDeleteQuiz = (quizId: number | undefined, quizTitle: string) => {
    // Validation côté frontend
    if (!validateQuizId(quizId)) return;


    const isConfirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le quiz "${quizTitle}" ?\n\nCette action est irréversible.`
    );
    
    if (isConfirmed) {
      deleteQuiz(quizId!);
    }
  };


  const deleteQuiz = async (quizId: number) => {
    try {
      setDeletingQuizId(quizId);

      const response = await makeSecureApiCall(
        `http://localhost:8000/api/quizzes/${quizId}`,
        { method: 'DELETE' }
      );

      if (!response) return; 

   
      setQuizzes(prevQuizzes => 
        prevQuizzes.filter(quiz => quiz.id !== quizId)
      );

      showSuccessToast('Quiz supprimé avec succès');

    } catch (error) {
      console.error('Erreur lors de la suppression du quiz:', error);
      showErrorToast('Erreur lors de la suppression du quiz');
    } finally {
      setDeletingQuizId(null);
    }
  };

  // Charger les quiz au démarrage
  useEffect(() => {
    fetchQuizzes();
  }, []);



  const handleCreateQuiz = () => {
    navigate('/create-quiz');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewResults = (quizId: number | undefined) => {
    if (!validateQuizId(quizId)) return;
    console.log(`Voir les résultats du quiz ${quizId}`);
    // Navigation vers les résultats
  };

  const handleEditQuiz = (quizId: number | undefined) => {
    if (!validateQuizId(quizId)) return;
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
            Gérez vos quiz et activez/désactivez-les quiz
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

   
                  <div className="flex gap-2">
                   
                    <Button
                      onClick={() => updateQuizStatus(quiz.id, !quiz.isActive)}
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
                    <Button 
                      onClick={() => confirmDeleteQuiz(quiz.id, quiz.title)}
                      disabled={deletingQuizId === quiz.id}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {deletingQuizId === quiz.id ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      {deletingQuizId === quiz.id ? 'Suppression...' : 'Supprimer'}
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