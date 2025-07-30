import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useQuizStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  LogOut,
  Eye,
  FileText,
  Users,
  UserCheck,
  User,
} from "lucide-react";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { logout } = useAuthStore();
  const { quizzes, metrics } = useQuizStore();

  const handleCreateQuiz = () => {};

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  const handleViewResults = (quizId: number) => {
    console.log(`Voir les résultats du quiz ${quizId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
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
            onClick={handleCreateQuiz}
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un quiz
          </Button>
          <Button
            onClick={() => navigate("/student")}
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

      <Card className="bg-gray-100 text-gray-900">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Liste des Quiz</CardTitle>
          <p className="text-gray-600">Gérez vos quiz</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {quiz.title}
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-medium">
                    {quiz.code}
                  </span>
                  <span className="text-gray-600">
                    Réaliser {quiz.completionCount} Fois
                  </span>
                </div>

                <Button
                  onClick={() => handleViewResults(quiz.id)}
                  className="bg-gray-800 hover:bg-gray-700 text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Résultat
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
