import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Interface pour une question
interface Question {
  id: number;
  text: string;
  orderNumber: number;
  answers: Answer[];
}

// Interface pour une réponse
interface Answer {
  id: number;
  text: string;
  orderNumber: number;
  isCorrect: boolean;
}

// Interface pour les réponses de l'utilisateur
interface UserAnswers {
  [questionId: number]: number; // questionId -> answerId
}

// Composant principal de la page de quiz
const TakeQuizPage: React.FC = () => {
  // Hook pour la navigation avec React Router
  const navigate = useNavigate();
  
  // Hook pour récupérer les données passées en navigation
  const location = useLocation();
  const { participantData, quizInfo } = location.state || {};

  // État pour stocker les questions du quiz
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // État pour stocker les réponses de l'utilisateur
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  
  // État pour indiquer si on charge les questions
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour indiquer si on soumet les réponses
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les questions du quiz au montage du composant
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // TODO: Appeler l'API pour récupérer les questions du quiz
        // const response = await QuizApiService.getQuizQuestions(quizInfo.id);
        // setQuestions(response.questions);
        
        // Pour l'instant, simulation avec des questions de test
        const mockQuestions: Question[] = [
          {
            id: 1,
            text: "Quelle est la capitale de la France ?",
            orderNumber: 1,
            answers: [
              { id: 1, text: "Paris", orderNumber: 1, isCorrect: true },
              { id: 2, text: "Lyon", orderNumber: 2, isCorrect: false },
              { id: 3, text: "Marseille", orderNumber: 3, isCorrect: false },
              { id: 4, text: "Toulouse", orderNumber: 4, isCorrect: false }
            ]
          },
          {
            id: 2,
            text: "Quel est le plus grand océan du monde ?",
            orderNumber: 2,
            answers: [
              { id: 5, text: "Océan Atlantique", orderNumber: 1, isCorrect: false },
              { id: 6, text: "Océan Pacifique", orderNumber: 2, isCorrect: true },
              { id: 7, text: "Océan Indien", orderNumber: 3, isCorrect: false },
              { id: 8, text: "Océan Arctique", orderNumber: 4, isCorrect: false }
            ]
          }
        ];
        
        setQuestions(mockQuestions);
      } catch {
        alert('Erreur lors du chargement des questions');
        navigate('/student');
      } finally {
        setIsLoading(false);
      }
    };

    if (participantData && quizInfo) {
      loadQuestions();
    } else {
      // Redirection si pas de données
      navigate('/student');
    }
  }, [participantData, quizInfo, navigate]);

  // Fonction pour gérer la sélection d'une réponse
  const handleAnswerSelect = (questionId: number, answerId: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  // Fonction pour gérer la soumission du quiz
  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier que toutes les questions ont une réponse
    const answeredQuestions = Object.keys(userAnswers).length;
    if (answeredQuestions < questions.length) {
      alert(`Veuillez répondre à toutes les questions. Vous avez répondu à ${answeredQuestions}/${questions.length} questions.`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Appeler l'API pour soumettre les réponses
      // const response = await QuizApiService.submitQuizAnswers({
      //   participantData,
      //   quizId: quizInfo.id,
      //   answers: userAnswers
      // });
      
      // Navigation vers la page de résultats
      navigate('/quiz-results', {
        state: {
          participantData,
          quizInfo,
          userAnswers,
          questions,
          // results: response
        }
      });
      
          } catch {
        alert('Erreur lors de la soumission du quiz');
      } finally {
        setIsSubmitting(false);
      }
  };

  // Fonction pour retourner à la page précédente
  const handleBack = () => {
    navigate('/student');
  };

  // Affichage de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Chargement des questions...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-100 text-gray-900">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{quizInfo?.title}</h1>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Participant: {participantData?.firstName} {participantData?.lastName}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitQuiz}>
              {/* Questions du quiz */}
              {questions
                .sort((a, b) => a.orderNumber - b.orderNumber)
                .map((question, index) => (
                  <div key={question.id} className="mb-6 p-4 border rounded-lg bg-white">
                    <h4 className="text-lg font-semibold mb-4">
                      Question {index + 1}: {question.text}
                    </h4>
                    
                    {/* Réponses de la question */}
                    <div className="space-y-3">
                      {question.answers
                        .sort((a, b) => a.orderNumber - b.orderNumber)
                        .map((answer) => (
                          <div key={answer.id} className="flex items-center">
                            <input
                              type="radio"
                              name={`question_${question.id}`}
                              id={`answer_${answer.id}`}
                              value={answer.id}
                              checked={userAnswers[question.id] === answer.id}
                              onChange={() => handleAnswerSelect(question.id, answer.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                              required
                            />
                            <label 
                              htmlFor={`answer_${answer.id}`}
                              className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                            >
                              {answer.text}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}

              {/* Bouton de soumission */}
              <div className="flex gap-4">
                <Button 
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                
                <Button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Soumission...' : 'Terminer le Quiz'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TakeQuizPage; 