import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useStudentStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, LogOut, User, Book } from "lucide-react";

const StudentPage: React.FC = () => {
  const navigate = useNavigate();

  const { logout } = useAuthStore();
  const { studentInfo, quizInfo, updateStudentInfo, updateQuizInfo } =
    useStudentStore();

  const handleDashboardClick = () => {
    navigate("/admin-dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleStartQuiz = () => {
    if (!quizInfo.firstName || !quizInfo.lastName || !quizInfo.quizCode) {
      alert("Veuillez remplir tous les champs avant de commencer le quiz");
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            Espace Élève
          </h1>
          <p className="text-gray-300 text-lg">Bonjour Étudiant !</p>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleDashboardClick}
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          >
            <Home className="w-4 h-4 mr-2" />
            Button
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

      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-gray-100 text-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold">
              <User className="w-5 h-5 mr-2" />
              Vos Informations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="student-firstname"
                  className="text-sm font-medium"
                >
                  Prénom
                </Label>
                <Input
                  id="student-firstname"
                  type="text"
                  placeholder="Prénom"
                  value={studentInfo.firstName}
                  onChange={(e) =>
                    updateStudentInfo("firstName", e.target.value)
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="student-lastname"
                  className="text-sm font-medium"
                >
                  Nom
                </Label>
                <Input
                  id="student-lastname"
                  type="text"
                  placeholder="Nom"
                  value={studentInfo.lastName}
                  onChange={(e) =>
                    updateStudentInfo("lastName", e.target.value)
                  }
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-100 text-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold">
              <Book className="w-5 h-5 mr-2" />
              Code du Quiz
            </CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              Entrez le code fourni par votre professeur
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-firstname" className="text-sm font-medium">
                  Prénom
                </Label>
                <Input
                  id="quiz-firstname"
                  type="text"
                  placeholder="Prénom"
                  value={quizInfo.firstName}
                  onChange={(e) => updateQuizInfo("firstName", e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz-lastname" className="text-sm font-medium">
                  Nom
                </Label>
                <Input
                  id="quiz-lastname"
                  type="text"
                  placeholder="Nom"
                  value={quizInfo.lastName}
                  onChange={(e) => updateQuizInfo("lastName", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-code" className="text-sm font-medium">
                Entrez le code du quizz
              </Label>
              <Input
                id="quiz-code"
                type="text"
                placeholder="Entrez le code du quizz"
                value={quizInfo.quizCode}
                onChange={(e) => updateQuizInfo("quizCode", e.target.value)}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleStartQuiz}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3"
            >
              Commencer le qizz
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentPage;
