import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Home } from 'lucide-react';
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

// Interface pour les détails de réponse du backend
interface ResponseDetail {
  questionId: number;
  questionText: string;
  userAnswer: {
    id: number;
    text: string;
    isCorrect: boolean;
  };
  correctAnswer: {
    id: number;
    text: string;
    isCorrect: boolean;
  } | null;
  isCorrect: boolean;
}

// Interface pour les résultats du quiz
interface QuizResults {
  score: number;
  totalQuestions: number;
  percentage: number;
  userAnswers: {
    questionId: number;
    questionText: string;
    userAnswer: Answer;
    correctAnswer: Answer;
    isCorrect: boolean;
  }[];
}

// Composant principal de la page des résultats
const QuizResultsPage: React.FC = () => {
  // Hook pour la navigation avec React Router
  const navigate = useNavigate();
  
  // Hook pour récupérer les données passées en navigation
  const location = useLocation();
  const { quizInfo, userAnswers, results: backendResults } = location.state || {};

  // État pour stocker les résultats calculés
  const [results, setResults] = useState<QuizResults | null>(null);
  
  // État pour indiquer si on calcule les résultats
  const [isCalculating, setIsCalculating] = useState(true);

  // Calculer les résultats au montage du composant
  useEffect(() => {
    const calculateResults = async () => {
      if (!quizInfo || !userAnswers) {
        console.log('Données manquantes:', { quizInfo, userAnswers });
        navigate('/student');
        return;
      }

      try {
        // Récupérer les questions directement depuis l'API pour avoir les bons IDs
        const questions = await QuizApiService.getQuizQuestions(quizInfo.id);
        
        console.log('Questions récupérées depuis l\'API:', questions);
        console.log('userAnswers reçus:', userAnswers);
        
        // Log détaillé des questions et réponses
        questions.forEach((question, index) => {
          console.log(`Question ${index + 1}:`, {
            id: question.id,
            text: question.text,
            answers: question.answers.map(a => ({
              id: a.id,
              text: a.text,
              isCorrect: a.isCorrect
            }))
          });
        });

        // Si on a les résultats du backend, on les utilise
        if (backendResults) {
          console.log('Utilisation des résultats du backend:', backendResults);
          const userAnswersDetails: QuizResults['userAnswers'] = [];

          // Si le backend a fourni les détails des réponses, on les utilise
          if (backendResults.responseDetails) {
            console.log('Utilisation des détails de réponse du backend:', backendResults.responseDetails);
            
            backendResults.responseDetails.forEach((detail: ResponseDetail) => {
              userAnswersDetails.push({
                questionId: detail.questionId,
                questionText: detail.questionText,
                userAnswer: {
                  id: detail.userAnswer.id,
                  text: detail.userAnswer.text,
                  orderNumber: 1, // Pas important pour l'affichage
                  isCorrect: detail.userAnswer.isCorrect
                },
                correctAnswer: detail.correctAnswer ? {
                  id: detail.correctAnswer.id,
                  text: detail.correctAnswer.text,
                  orderNumber: 1, // Pas important pour l'affichage
                  isCorrect: detail.correctAnswer.isCorrect
                } : {
                  id: 0,
                  text: 'Réponse non disponible',
                  orderNumber: 1,
                  isCorrect: false
                },
                isCorrect: detail.isCorrect
              });
            });
          } else {
            // Fallback : calcul côté frontend
            console.log('Pas de détails de réponse du backend, calcul côté frontend');
            
            // Analyser chaque question pour créer les détails
            questions.forEach((question: Question) => {
              const userAnswerId = userAnswers[question.id];
              const userAnswer = question.answers.find(a => a.id === userAnswerId);
              
              // Si isCorrect n'est pas défini, on doit déterminer la bonne réponse autrement
              let correctAnswer = question.answers.find(a => a.isCorrect);
              
              // Si pas de isCorrect, on utilise la première réponse comme fallback
              // (ce n'est pas idéal mais c'est temporaire)
              if (!correctAnswer && question.answers.length > 0) {
                correctAnswer = question.answers[0];
              }

              console.log('Question:', question.id, 'UserAnswerId:', userAnswerId, 'UserAnswer:', userAnswer, 'CorrectAnswer:', correctAnswer);

              if (userAnswer && correctAnswer) {
                // Déterminer si la réponse est correcte
                let isCorrect = false;
                
                // Si isCorrect est défini sur la réponse utilisateur, on l'utilise
                if (userAnswer.isCorrect !== undefined) {
                  isCorrect = userAnswer.isCorrect;
                } else {
                  // Sinon, on compare avec la bonne réponse
                  isCorrect = userAnswer.id === correctAnswer.id;
                }

                userAnswersDetails.push({
                  questionId: question.id,
                  questionText: question.text,
                  userAnswer,
                  correctAnswer,
                  isCorrect
                });
              } else {
                console.log('Problème avec la question:', question.id);
                console.log('- userAnswer trouvé:', !!userAnswer);
                console.log('- correctAnswer trouvé:', !!correctAnswer);
              }
            });
          }

          console.log('userAnswersDetails créés:', userAnswersDetails);

          setResults({
            score: backendResults.score,
            totalQuestions: backendResults.totalQuestions,
            percentage: backendResults.percentage,
            userAnswers: userAnswersDetails
          });
        } else {
          console.log('Pas de résultats backend, calcul côté frontend');
          // Fallback : calcul côté frontend si pas de résultats backend
          let correctAnswers = 0;
          const userAnswersDetails: QuizResults['userAnswers'] = [];

          // Analyser chaque question
          questions.forEach((question: Question) => {
            const userAnswerId = userAnswers[question.id];
            const userAnswer = question.answers.find(a => a.id === userAnswerId);
            const correctAnswer = question.answers.find(a => a.isCorrect);

            if (userAnswer && correctAnswer) {
              const isCorrect = userAnswer.isCorrect;
              if (isCorrect) {
                correctAnswers++;
              }

              userAnswersDetails.push({
                questionId: question.id,
                questionText: question.text,
                userAnswer,
                correctAnswer,
                isCorrect
              });
            }
          });

          const totalQuestions = questions.length;
          const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

          setResults({
            score: correctAnswers,
            totalQuestions,
            percentage,
            userAnswers: userAnswersDetails
          });
        }

      } catch (error) {
        console.error('Erreur lors du calcul des résultats:', error);
        alert('Erreur lors du calcul des résultats');
        navigate('/student');
      } finally {
        setIsCalculating(false);
      }
    };

    calculateResults();
  }, [quizInfo, userAnswers, backendResults, navigate]);

  // Fonction pour retourner à l'accueil
  const handleBackToHome = () => {
    navigate('/admin-dashboard');
  };

  // Affichage de chargement
  if (isCalculating) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Calcul des résultats...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Redirection si pas de résultats
  if (!results) {
    navigate('/student');
    return null;
  }

  // Déterminer la couleur de la barre de progression
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-100 text-gray-900">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold mb-2">Résultats du Quiz</h1>
            <p className="text-gray-600">{quizInfo?.title}</p>
          </CardHeader>
          <CardContent>
            {/* Section du score */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Score: {results.score}/{results.totalQuestions}
              </h2>
              
              {/* Barre de progression */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-8 mb-2">
                  <div 
                    className={`h-8 rounded-full transition-all duration-500 ${getProgressBarColor(results.percentage)}`}
                    style={{ width: `${results.percentage}%` }}
                  >
                    <span className="flex items-center justify-center h-full text-white font-bold">
                      {Math.round(results.percentage)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {results.percentage >= 70 ? 'Excellent !' : 
                   results.percentage >= 50 ? 'Bien !' : 'À améliorer'}
                </p>
              </div>
            </div>

            {/* Section détail des réponses */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Détail des réponses :</h3>
              
              {results.userAnswers.map((answerDetail, index) => (
                <div key={answerDetail.questionId} className="mb-6 p-4 border rounded-lg bg-white">
                  <h5 className="text-lg font-semibold mb-3">
                    Question {index + 1}: {answerDetail.questionText}
                  </h5>
                  
                  {/* Réponse de l'utilisateur */}
                  <div className="mb-3">
                    <strong className="text-gray-700">Votre réponse :</strong>
                    <div className="flex items-center mt-1">
                      <span className={`mr-2 ${answerDetail.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {answerDetail.userAnswer.text}
                      </span>
                      {answerDetail.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                        answerDetail.isCorrect 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {answerDetail.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                  </div>

                  {/* Réponse correcte (si l'utilisateur s'est trompé) */}
                  {!answerDetail.isCorrect && (
                    <div className="mb-2">
                      <strong className="text-gray-700">Réponse correcte :</strong>
                      <div className="flex items-center mt-1">
                        <span className="text-green-600 mr-2">
                          {answerDetail.correctAnswer.text}
                        </span>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bouton retour à l'accueil */}
            <div className="text-center">
              <Button 
                onClick={handleBackToHome}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizResultsPage; 