import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

import AuthService from '../services/AuthService';
import toast from 'react-hot-toast';
import type { 
    Question, 
    UserAnswers, 
    LocationState, 
    QuizInfo,
    ParticipantData,
    ApiQuestionData,
    ApiAnswerData,
    QuizSubmissionData
} from '../types/TakeQuizPage';

const API_BASE_URL = 'http://localhost:8000';

// Hook API pour TakeQuiz
const useQuizApi = () => {
  const navigate = useNavigate();
  
  const getToken = useCallback(() => {
    const token = AuthService.getToken();
    if (!token) {
      toast.error('Vous devez être connecté pour participer à un quiz');
      navigate('/login');
      return null;
    }
    return token;
  }, [navigate]);

  const apiCall = useCallback(async (endpoint: string, options?: RequestInit) => {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options?.headers
        },
        ...options
      });
      
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }, [getToken]);

  return { apiCall };
};

// Hook pour charger les données du quiz
const useQuizData = (quizInfo: QuizInfo | undefined) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { apiCall } = useQuizApi();
  const navigate = useNavigate();

  const loadQuestions = useCallback(async () => {
    if (!quizInfo) {
      navigate('/student');
      return;
    }

    try {
      setIsLoading(true);
      const quizData = await apiCall(`/api/public/questionnaires/${quizInfo.id}`);
      if (!quizData) return;

      // Transformer les données en une seule étape
      const transformedQuestions: Question[] = (quizData.questions || []).map((questionData: ApiQuestionData) => ({
        id: questionData.id,
        text: questionData.texte,
        orderNumber: questionData.numeroOrdre,
        answers: questionData.reponses.map((answerData: ApiAnswerData) => ({
          id: answerData.id,
          text: answerData.texte,
          orderNumber: answerData.numeroOrdre,
          isCorrect: answerData.estCorrecte
        }))
      }));

      setQuestions(transformedQuestions);
    } catch {
      toast.error('Erreur lors du chargement des questions');
      navigate('/student');
    } finally {
      setIsLoading(false);
    }
  }, [quizInfo, apiCall, navigate]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return { questions, isLoading };
};

// Hook pour la navigation dans le quiz
const useQuizNavigation = (questions: Question[]) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});

  const handleAnswerSelect = useCallback((questionId: number, answerId: number) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answerId }));
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const progressPercentage = useMemo(() => 
    questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
  , [currentQuestionIndex, questions.length]);

  const isComplete = useMemo(() => 
    Object.keys(userAnswers).length === questions.length
  , [userAnswers, questions.length]);

  const currentQuestion = questions[currentQuestionIndex];

  return {
    currentQuestionIndex,
    currentQuestion,
    userAnswers,
    progressPercentage,
    isComplete,
    handleAnswerSelect,
    handleNextQuestion
  };
};

// Hook pour la soumission du quiz
const useQuizSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { apiCall } = useQuizApi();
  const navigate = useNavigate();

  const submitQuiz = useCallback(async (
    quizInfo: QuizInfo, 
    participantData: ParticipantData, 
    userAnswers: UserAnswers,
    questions: Question[]
  ) => {
    if (Object.keys(userAnswers).length < questions.length) {
      toast.error(`Veuillez répondre à toutes les questions. ${Object.keys(userAnswers).length}/${questions.length} réponses`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Format des réponses simplifié
      const formattedAnswers = Object.entries(userAnswers).map(([questionId, answerId]) => ({
        questionId: parseInt(questionId),
        answerId: answerId
      }));

      const submissionData: QuizSubmissionData = {
        participantFirstName: participantData.firstName,
        participantLastName: participantData.lastName,
        answers: formattedAnswers
      };

      const results = await apiCall(`/api/public/questionnaires/${quizInfo.id}/submit`, {
        method: 'POST',
        body: JSON.stringify(submissionData)
      });

      if (results) {
        navigate('/quiz-results', {
          state: {
            participantData,
            quizInfo,
            userAnswers,
            questions,
            results
          }
        });
      }
    } catch {
      toast.error('Erreur lors de la soumission du quiz');
    } finally {
      setIsSubmitting(false);
    }
  }, [apiCall, navigate]);

  return { isSubmitting, submitQuiz };
};

function TakeQuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { participantData, quizInfo } = (location.state as LocationState) || {};

  // Redirection si pas de données
  useEffect(() => {
    if (!participantData || !quizInfo) {
      navigate('/student');
    }
  }, [participantData, quizInfo, navigate]);

  // Hooks personnalisés
  const { questions, isLoading } = useQuizData(quizInfo);
  const {
    currentQuestionIndex,
    currentQuestion,
    userAnswers,
    progressPercentage,
    isComplete,
    handleAnswerSelect,
    handleNextQuestion
  } = useQuizNavigation(questions);
  const { isSubmitting, submitQuiz } = useQuizSubmission();

  // Fonctions de navigation
  const handleBack = useCallback(() => {
    navigate('/student');
  }, [navigate]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      handleNextQuestion();
    } else {
      submitQuiz(quizInfo!, participantData!, userAnswers, questions);
    }
  }, [currentQuestionIndex, questions.length, handleNextQuestion, submitQuiz, quizInfo, participantData, userAnswers, questions]);

  // Condition de validation du bouton suivant
  const canProceed = currentQuestion && userAnswers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Affichage de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-400" />
          <div className="text-xl">Chargement des questions...</div>
        </div>
      </div>
    );
  }

  // Si pas de questions
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Aucune question disponible pour ce quiz.</div>
          <Button onClick={handleBack} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header avec progression */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-yellow-400">
            Question {currentQuestionIndex + 1}/{questions.length}
          </h1>
          <div className="text-white text-lg">
            {participantData?.firstName} {participantData?.lastName}
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="h-full bg-yellow-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-100 text-gray-900">
          <CardContent className="p-0">
            {/* Section question */}
            <div className="bg-yellow-500 p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentQuestion.text}
              </h2>
              <p className="text-gray-800">
                Choisissez une réponse
              </p>
            </div>

            {/* Section réponses */}
            <div className="bg-gray-50 p-6 rounded-b-lg">
              <div className="space-y-4">
                {currentQuestion.answers
                  .sort((a, b) => a.orderNumber - b.orderNumber)
                  .map((answer) => (
                    <div key={answer.id} className="flex items-center">
                      <input
                        type="radio"
                        name={`question_${currentQuestion.id}`}
                        id={`answer_${answer.id}`}
                        value={answer.id}
                        checked={userAnswers[currentQuestion.id] === answer.id}
                        onChange={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
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
          </CardContent>
        </Card>

        {/* Bouton Suivant/Terminer */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleNext}
            disabled={!canProceed || (isLastQuestion && (!isComplete || isSubmitting))}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Soumission...
              </>
            ) : isLastQuestion ? (
              'Terminer le Quiz'
            ) : (
              'Suivant'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TakeQuizPage;