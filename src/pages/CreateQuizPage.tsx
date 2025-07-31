import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ArrowLeft, Copy } from "lucide-react";
import { QuizApiService, QuizApiError } from "@/lib/quizApi";

const CreateQuizPage: React.FC = () => {

  const navigate = useNavigate();

  // État pour stocker les données du formulaire de quiz
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
  });

  // État pour indiquer si on crée le quiz
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour mettre à jour les champs du formulaire
  const handleInputChange = (field: "title" | "description", value: string) => {
    setQuizData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  // Fonction pour créer le quiz
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des données
    if (!quizData.title.trim()) {
      toast.error("Le titre du quiz est obligatoire", {
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Préparer les données
      const quizToSend = {
        title: quizData.title,
        description: quizData.description || "",
        isActive: true,
        isStarted: false,
        passingScore: 70,
        questions: [], // Les questions seront ajoutées séparément
      };

      console.log("Données du quiz à envoyer:", quizToSend);

      // Créer le quiz via l'API Symfony
      const createdQuizResponse = await QuizApiService.createQuiz(quizToSend);

      console.log("Quiz créé avec succès:", createdQuizResponse);

      // Afficher un toast de succès avec le code d'accès généré
      toast.success(`Quiz créé avec succès !`, {
        duration: 6000,
        style: {
          padding: "16px",
          fontSize: "14px",
        },
      });

      // Toast séparé pour le code d'accès avec bouton copier
      toast.custom(
        (t) => (
          <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4 max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800 mb-1">
                  Code d'accès généré
                </h3>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-3 py-1 rounded font-mono text-lg font-bold text-gray-800">
                    {createdQuizResponse.uniqueCode}
                  </code>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          createdQuizResponse.uniqueCode
                        );
                        toast.success("Code copié !", { duration: 2000 });
                      } catch (err) {
                        console.error("Erreur copie:", err);
                        toast.error("Erreur lors de la copie");
                      }
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copier le code"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Les étudiants utiliseront ce code pour accéder au quiz
                </p>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600 ml-4"
              >
                ✕
              </button>
            </div>
          </div>
        ),
        {
          duration: 5000, // 8 secondes pour le code d'accès
        }
      );

      // Redirection vers le dashboard admin après un délai
      setTimeout(() => {
        navigate("/admin-dashboard");
      }, 1500);
    } catch (error) {
      console.error("Erreur lors de la création du quiz:", error);

      let errorMessage = "Erreur lors de la création du quiz";

      if (error instanceof QuizApiError) {
        if (error.status === 401) {
          errorMessage = "Vous devez être connecté pour créer un quiz";
        } else if (error.status === 400) {
          errorMessage = "Données invalides pour la création du quiz";
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Afficher l'erreur avec un toast
      toast.error(errorMessage, {
        duration: 5000,
        style: {
          padding: "16px",
          fontSize: "14px",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour retourner au dashboard
  const handleBackToDashboard = () => {
    navigate("/admin-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        {/* Bouton retour et titre */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBackToDashboard}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">
              Créer un nouveau quiz
            </h1>
            <p className="text-gray-300 text-lg">
              Créez votre quiz en quelques étapes simples
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-100 text-gray-900">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Créer un nouveau quiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateQuiz}>
              <div className="mb-4">
                <Label htmlFor="title" className="text-sm font-medium">
                  Titre du quiz *
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={quizData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Ex: Quiz de culture générale"
                  required
                  className="mt-1"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Ex: Quiz de culture générale
                </div>
              </div>

              <div className="mb-4">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={quizData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Description optionnelle du quiz"
                  rows={3}
                  className="mt-1"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Description optionnelle du quiz
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={handleBackToDashboard}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </Button>

                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Création..." : "Créer le quiz"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateQuizPage;
