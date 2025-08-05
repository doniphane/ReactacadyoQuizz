import { useEffect, useState, useCallback, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { AttemptsList, AttemptDetails, SearchBar } from '../components';
import AuthService from '../services/AuthService';
import toast from 'react-hot-toast';
import type { TransformedAttempt, AttemptDetail, UserAnswer, Question, Answer, Questionnaire } from '../types/studenthistory';

const API_BASE_URL = 'http://localhost:8000';

// Hook API unifié
const useApi = () => {
  const navigate = useNavigate();
  
  const getToken = useCallback(() => {
    const token = AuthService.getToken();
    if (!token) {
      toast.error('Vous devez être connecté');
      navigate('/login');
      return null;
    }
    return token;
  }, [navigate]);

  const apiCall = useCallback(async (endpoint: string) => {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      
      const data = await response.json();
      return Array.isArray(data) ? data : (data.member || data['hydra:member'] || data);
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }, [getToken]);

  return { apiCall };
};

// Hook pour charger l'historique des quiz
const useQuizHistory = () => {
  const [quizAttempts, setQuizAttempts] = useState<TransformedAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { apiCall } = useApi();

  const loadQuizHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Récupérer utilisateur et tentatives en parallèle
      const [currentUser, attemptsArray] = await Promise.all([
        apiCall('/api/me'),
        apiCall('/api/tentative_questionnaires')
      ]);

      if (!currentUser || !attemptsArray) return;

      // Transformer les tentatives avec détails questionnaire
      const transformedAttempts = await Promise.all(
        attemptsArray.map(async (attempt: TransformedAttempt) => {
          try {
            const questionnaireId = attempt.questionnaire.split('/').pop();
            const questionnaire = await apiCall(`/api/questionnaires/${questionnaireId}`) as Questionnaire;
            
            const percentage = attempt.nombreTotalQuestions && attempt.score 
              ? Math.round((attempt.score / attempt.nombreTotalQuestions) * 100) 
              : 0;
            
            const isPassed = percentage >= (questionnaire?.scorePassage || 70);
            const dateDebut = new Date(attempt.dateDebut);
            
            return {
              ...attempt,
              quizTitle: questionnaire?.title || `${attempt.prenomParticipant} ${attempt.nomParticipant}`,
              quizCode: questionnaire?.accessCode || 'N/A',
              date: dateDebut.toLocaleDateString('fr-FR'),
              time: dateDebut.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              percentage,
              isPassed
            };
          } catch {
            // Fallback si erreur questionnaire
            const dateDebut = new Date(attempt.dateDebut);
            return {
              ...attempt,
              quizTitle: `${attempt.prenomParticipant} ${attempt.nomParticipant}`,
              quizCode: 'N/A',
              date: dateDebut.toLocaleDateString('fr-FR'),
              time: dateDebut.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              percentage: 0,
              isPassed: false
            };
          }
        })
      );
      
      setQuizAttempts(transformedAttempts);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setError('Erreur lors du chargement de l\'historique des quiz');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    loadQuizHistory();
  }, [loadQuizHistory]);

  return { quizAttempts, isLoading, error };
};

// Hook pour les détails d'une tentative
const useAttemptDetails = () => {
  const [selectedAttempt, setSelectedAttempt] = useState<TransformedAttempt | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<AttemptDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { apiCall } = useApi();

  const loadAttemptDetails = useCallback(async (attempt: TransformedAttempt) => {
    try {
      setLoadingDetails(true);
      setSelectedAttempt(attempt);

      // Récupérer les réponses utilisateur pour cette tentative
      const userAnswersArray = await apiCall('/api/reponse_utilisateurs');
      if (!userAnswersArray) return;

      const studentAnswers = userAnswersArray.filter((answer: UserAnswer) => 
        answer.tentativeQuestionnaire === `/api/tentative_questionnaires/${attempt.id}`
      );

      // Traiter les détails en parallèle
      const details = await Promise.all(
        studentAnswers.map(async (userAnswer: UserAnswer): Promise<AttemptDetail> => {
          try {
            const questionId = userAnswer.question?.split('/').pop() || '0';
            const answerId = userAnswer.reponse?.split('/').pop() || '0';

            // Récupérer question, réponse sélectionnée et toutes les réponses en parallèle
            const [questionData, selectedAnswerData, allAnswersData] = await Promise.all([
              apiCall(`/api/questions/${questionId}`),
              apiCall(`/api/reponses/${answerId}`),
              apiCall(`/api/reponses?question=${questionId}`)
            ]);

            // Typer les données reçues de l'API
            const question = questionData as Question;
            const selectedAnswer = selectedAnswerData as Answer;
            const allAnswers = allAnswersData as Answer[];

            const correctAnswer = allAnswers?.find((a: Answer) => a.correct === true);

            return {
              questionId,
              questionText: question?.texte || 'Question non trouvée',
              userAnswer: selectedAnswer?.texte || 'Réponse non trouvée',
              correctAnswer: correctAnswer?.texte || 'Réponse correcte non trouvée',
              isCorrect: selectedAnswer?.correct || false
            };
          } catch (error) {
            console.error('Erreur détail réponse:', error);
            return {
              questionId: '0',
              questionText: 'Question non trouvée',
              userAnswer: 'Réponse non trouvée',
              correctAnswer: 'Réponse correcte non trouvée',
              isCorrect: false
            };
          }
        })
      );

      setAttemptDetails(details);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoadingDetails(false);
    }
  }, [apiCall]);

  return { 
    selectedAttempt, 
    attemptDetails, 
    loadingDetails, 
    loadAttemptDetails 
  };
};

function StudentHistoryPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks personnalisés
  const { quizAttempts, isLoading, error } = useQuizHistory();
  const { selectedAttempt, attemptDetails, loadingDetails, loadAttemptDetails } = useAttemptDetails();

  // Tentatives filtrées (mémorisées)
  const filteredAttempts = useMemo(() => 
    quizAttempts.filter((attempt: TransformedAttempt) => {
      const quizTitle = attempt.quizTitle || `${attempt.prenomParticipant} ${attempt.nomParticipant}`;
      const quizCode = attempt.quizCode || 'N/A';
      return quizTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
             quizCode.toLowerCase().includes(searchTerm.toLowerCase());
    }), [quizAttempts, searchTerm]);

  // Fonctions de navigation
  const handleBackToStudent = useCallback(() => {
    navigate('/student');
  }, [navigate]);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Affichage de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-400" />
          <div className="text-xl">Chargement de l'historique...</div>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Erreur</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button onClick={handleBackToStudent} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button
            onClick={handleBackToStudent}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">
              Mon Historique Personnel
            </h1>
            <p className="text-gray-300">
              {quizAttempts.length} quiz passé{quizAttempts.length > 1 ? 's' : ''} par vous
            </p>
          </div>

          <div className="w-32"></div> 
        </div>

        {/* Barre de recherche */}
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttemptsList 
            attempts={filteredAttempts}
            selectedAttempt={selectedAttempt}
            onAttemptSelect={loadAttemptDetails}
          />

          <AttemptDetails 
            selectedAttempt={selectedAttempt}
            attemptDetails={attemptDetails}
            loadingDetails={loadingDetails}
          />
        </div>
      </div>
    </div>
  );
}

export default StudentHistoryPage;