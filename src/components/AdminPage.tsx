import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Import des composants UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import des icônes
import {
  Plus,
  LogOut,
  Eye,
  FileText,
  Users,
  UserCheck,
  User,
  Loader2,
  Edit,
  Play,
  Pause,
  RefreshCw,
  Trash2,
} from "lucide-react";

import AuthService from "../services/AuthService";
import toast from "react-hot-toast";


// Type pour un quiz
interface Quiz {
  id: number;
  title: string;
  createdAt?: string;
  uniqueCode?: string;
  isActive: boolean;
  isStarted: boolean;
  accessCode?: string;
}

// URL de l'API
const API_BASE_URL = "http://localhost:8000";


function AdminPage() {
  const navigate = useNavigate();

  // États simples
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuizId, setLoadingQuizId] = useState<number | null>(null);

  // Métriques simples
  const [metrics, setMetrics] = useState({
    quizzesCreated: 0,
    totalAttempts: 0,
    registeredUsers: 15, 
  });

  // Fonction pour obtenir le token
  const getToken = () => {
    const token = AuthService.getToken();
    if (!token) {
      toast.error("Vous devez être connecté");
      navigate("/login");
      return null;
    }
    return token;
  };

  // Fonction pour récupérer les quiz
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/admin/quizzes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Récupérer les quiz depuis la réponse
      let quizList = [];
      if (Array.isArray(response.data)) {
        quizList = response.data;
      } else if (response.data.member) {
        quizList = response.data.member;
      } else if (response.data["hydra:member"]) {
        quizList = response.data["hydra:member"];
      }

      setQuizzes(quizList);

      // Mettre à jour les métriques
      setMetrics({
        quizzesCreated: quizList.length,
        totalAttempts: quizList.length * 2, // Simple calcul
        registeredUsers: 15,
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des quiz");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour activer/désactiver un quiz
  const toggleQuizStatus = async (quizId: number, currentStatus: boolean) => {
    try {
      setLoadingQuizId(quizId);
      const token = getToken();
      if (!token) return;

      await axios.put(
        `${API_BASE_URL}/api/quizzes/${quizId}`,
        { isActive: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Mettre à jour la liste localement
      setQuizzes(
        quizzes.map((quiz) =>
          quiz.id === quizId ? { ...quiz, isActive: !currentStatus } : quiz
        )
      );

      toast.success(!currentStatus ? "Quiz activé" : "Quiz désactivé");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoadingQuizId(null);
    }
  };

  // Fonction pour supprimer un quiz
  const deleteQuiz = async (quizId: number, quizTitle: string) => {
    // Demander confirmation
    if (!window.confirm(`Supprimer le quiz "${quizTitle}" ?`)) {
      return;
    }

    try {
      setLoadingQuizId(quizId);
      const token = getToken();
      if (!token) return;

      await axios.delete(`${API_BASE_URL}/api/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Retirer le quiz de la liste
      setQuizzes(quizzes.filter((quiz) => quiz.id !== quizId));
      toast.success("Quiz supprimé");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoadingQuizId(null);
    }
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Erreur:", error);
      navigate("/login");
    }
  };

  // Fonction pour voir les résultats
  const viewResults = (quiz: Quiz) => {
    navigate("/quiz-results-detail", {
      state: {
        quizId: quiz.id,
        quizTitle: quiz.title,
        quizCode: quiz.accessCode,
      },
    });
  };

  // Charger les quiz au démarrage
  useEffect(() => {
    fetchQuizzes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            Dashboard Admin
          </h1>
          <p className="text-gray-300 text-lg">
            Gérez vos quiz et analysez les performances
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => navigate("/create-quiz")}
            className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un quiz
          </Button>
          <Button
            onClick={() => navigate("/student")}
            className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3"
          >
            <User className="w-4 h-4 mr-2" />
            Espace Élève
          </Button>
          <Button
            onClick={handleLogout}
            className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3"
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
          <p className="text-gray-600">Gérez vos quiz</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Chargement des quiz...</span>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              Aucun quiz créé pour le moment.
              <Button
                onClick={() => navigate("/create-quiz")}
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
                      <h3 className="font-semibold text-gray-900">
                        {quiz.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {quiz.createdAt
                          ? `Créé le ${new Date(
                              quiz.createdAt
                            ).toLocaleDateString()}`
                          : "Date inconnue"}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-medium">
                      {quiz.uniqueCode || "MATH01"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        quiz.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {quiz.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleQuizStatus(quiz.id, quiz.isActive)}
                      disabled={loadingQuizId === quiz.id}
                      className={`${
                        quiz.isActive
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-green-500 hover:bg-green-600"
                      } text-white min-w-[100px]`}
                    >
                      {loadingQuizId === quiz.id ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : quiz.isActive ? (
                        <Pause className="w-4 h-4 mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {quiz.isActive ? "Désactiver" : "Activer"}
                    </Button>

                    <Button
                      onClick={() => navigate(`/manage-questions/${quiz.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>

                    <Button
                      onClick={() => viewResults(quiz)}
                      className="bg-gray-800 hover:bg-gray-700 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Résultat
                    </Button>

                    <Button
                      onClick={() => deleteQuiz(quiz.id, quiz.title)}
                      disabled={loadingQuizId === quiz.id}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {loadingQuizId === quiz.id ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Supprimer
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
}

export default AdminPage;
