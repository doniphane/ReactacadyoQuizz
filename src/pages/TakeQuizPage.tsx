import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { QuizApiService } from '@/lib/quizApi';

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
        // Appeler l'API pour récupérer les questions du quiz
        const questionsData = await QuizApiService.getQuizQuestions(quizInfo.id);
        
        // Transformer les données pour correspondre à notre interface
        const transformedQuestions: Question[] = questionsData.map(questionData => ({
          id: questionData.id,
          text: questionData.text,
          orderNumber: questionData.orderNumber,
          answers: questionData.answers.map(answerData => ({
            id: answerData.id,
            text: answerData.text,
            orderNumber: answerData.orderNumber,
            isCorrect: answerData.isCorrect
          }))
        }));
        
        console.log('Questions chargées depuis l\'API:', questionsData);
        console.log('Questions transformées:', transformedQuestions);
        
        setQuestions(transformedQuestions);
      } catch (error: unknown) {
        // Gérer les erreurs de l'API
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        alert('Erreur lors du chargement des questions: ' + errorMessage);
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
    console.log('Sélection réponse:', { questionId, answerId });
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  // Fonction pour gérer la soumission du quiz
  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Soumission du quiz avec userAnswers:', userAnswers);
    console.log('Questions:', questions);
    
    // Vérifier que toutes les questions ont une réponse
    const answeredQuestions = Object.keys(userAnswers).length;
    if (answeredQuestions < questions.length) {
      alert(`Veuillez répondre à toutes les questions. Vous avez répondu à ${answeredQuestions}/${questions.length} questions.`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Créer une tentative de quiz
      const attemptData = await QuizApiService.createQuizAttempt(quizInfo.id, {
        firstName: participantData.firstName,
        lastName: participantData.lastName
      });
      
      console.log('Tentative créée:', attemptData);
      
      // Soumettre les réponses
      const results = await QuizApiService.submitQuizAnswers(
        quizInfo.id,
        attemptData.id,
        userAnswers
      );
      
      console.log('Résultats reçus:', results);
      
      // Navigation vers la page de résultats
      navigate('/quiz-results', {
        state: {
          participantData,
          quizInfo,
          userAnswers,
          questions,
          results: results
        }
      });
      
    } catch (error: unknown) {
      // Gérer les erreurs de l'API
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert('Erreur lors de la soumission du quiz: ' + errorMessage);
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