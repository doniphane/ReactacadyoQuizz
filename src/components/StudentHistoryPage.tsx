
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Import des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Import des icônes Lucide React
import {
    ArrowLeft,
    History,
    Calendar,
    Target,
    CheckCircle,
    XCircle,
    Eye,
    Search,
    Trophy,
    Clock,
    User
} from 'lucide-react';

// Import du service d'authentification
import AuthService from '../services/AuthService';
import toast from 'react-hot-toast';


// Interface pour les informations utilisateur
interface User {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
}

// Interface pour une tentative de quiz (données brutes de l'API)
interface RawQuizAttempt {
    id: number;
    quiz: string; 
    participantEmail?: string;
    participantFirstName: string;
    participantLastName: string;
    startedAt: string;
    score: number;
    totalQuestions: number;
    quizTitle?: string;
    quizCode?: string;
    completedAt?: string;
}

// Interface pour une tentative transformée pour l'affichage
interface TransformedAttempt {
    id: number;
    quizTitle: string;
    quizCode: string;
    date: string;
    time: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    isPassed: boolean;
}

// Interface pour une question (données brutes de l'API)
interface Question {
    id: number;
    text: string;
    quiz: string; // URL de référence vers le quiz
    orderNumber?: number;
}

// Interface pour une réponse possible (données brutes de l'API)
interface Answer {
    id: number;
    text: string;
    correct: boolean;
    question: string; // URL de référence vers la question
    orderNumber?: number;
}

// Interface pour une réponse utilisateur (données brutes de l'API)
interface UserAnswer {
    id: number;
    question: string; // URL de référence vers la question
    answer: string; // URL de référence vers la réponse
    quizAttempt: string; // URL de référence vers la tentative
}

// Interface pour les détails d'une réponse formatée pour l'affichage
interface AttemptDetail {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

// Interface pour les réponses API au format JSON-LD
interface ApiResponse<T> {
    member?: T[];
    'hydra:member'?: T[];
}


type ApiResponseFormat<T> = T[] | ApiResponse<T>;

// Types pour les états du composant
type QuizAttemptsState = TransformedAttempt[];
type SelectedAttemptState = TransformedAttempt | null;
type AttemptDetailsState = AttemptDetail[];
type SearchTermState = string;
type LoadingState = boolean;
type ErrorState = string | null;

// Types pour les fonctions
type EventHandler = () => void;
type ParameterizedEventHandler<P, T = void> = (param: P) => T;
type AsyncEventHandler<P = void> = (param?: P) => Promise<void>;


// URL de base de l'API Symfony
const API_BASE_URL: string = 'http://localhost:8000';

function StudentHistoryPage() {
  
    const navigate = useNavigate();

    // États pour les données
    const [quizAttempts, setQuizAttempts] = useState<QuizAttemptsState>([]);
    const [selectedAttempt, setSelectedAttempt] = useState<SelectedAttemptState>(null);
    const [attemptDetails, setAttemptDetails] = useState<AttemptDetailsState>([]);
    const [searchTerm, setSearchTerm] = useState<SearchTermState>('');
    const [isLoading, setIsLoading] = useState<LoadingState>(true);
    const [error, setError] = useState<ErrorState>(null);
    const [loadingDetails, setLoadingDetails] = useState<LoadingState>(false);


    const getAuthHeaders = (): Record<string, string> | null => {
        const token: string | null = AuthService.getToken();
        if (!token) {
            console.error('Token non trouvé');
            return null;
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

  
    const makeSecureApiCall = async <T = unknown>(url: string, options: Record<string, string> = {}): Promise<AxiosResponse<T>> => {
        const headers: Record<string, string> | null = getAuthHeaders();
        if (!headers) {
            throw new Error('Vous devez être connecté pour effectuer cette action');
        }

        const response: AxiosResponse<T> = await axios({
            url,
            ...options,
            headers: { ...headers, ...options }
        });

        return response;
    };

    
    useEffect(() => {
        const loadQuizHistory: AsyncEventHandler = async (): Promise<void> => {
            try {
                setIsLoading(true);
                setError(null);

                // Récupérer les informations de l'utilisateur connecté
                const userResponse: AxiosResponse<User> = await makeSecureApiCall<User>(`${API_BASE_URL}/api/me`);
                const currentUser: User = userResponse.data;

                // Récupérer les tentatives de l'utilisateur connecté
                const response: AxiosResponse<ApiResponseFormat<RawQuizAttempt>> = await makeSecureApiCall<ApiResponseFormat<RawQuizAttempt>>(`${API_BASE_URL}/api/quiz_attempts`);
                let attemptsArray: RawQuizAttempt[] = [];

                // Gérer le format de réponse JSON-LD
                if (Array.isArray(response.data)) {
                    attemptsArray = response.data;
                } else if (response.data && Array.isArray((response.data as ApiResponse<RawQuizAttempt>).member)) {
                    attemptsArray = (response.data as ApiResponse<RawQuizAttempt>).member!;
                } else if (response.data && Array.isArray((response.data as ApiResponse<RawQuizAttempt>)['hydra:member'])) {
                    attemptsArray = (response.data as ApiResponse<RawQuizAttempt>)['hydra:member']!;
                }

                // Filtrer les tentatives pour l'utilisateur connecté uniquement
                const userAttempts: RawQuizAttempt[] = attemptsArray.filter((attempt: RawQuizAttempt) => {
                    // Vérifier si la tentative appartient à l'utilisateur connecté
                    return attempt.participantEmail === currentUser.email ||
                        attempt.participantFirstName === currentUser.firstName ||
                        (attempt.participantFirstName && attempt.participantLastName &&
                            `${attempt.participantFirstName} ${attempt.participantLastName}` === `${currentUser.firstName} ${currentUser.lastName}`);
                });

                console.log('Utilisateur connecté:', currentUser);
                console.log('Tentatives filtrées:', userAttempts);

                // Transformer les données des tentatives
                const attemptsData: TransformedAttempt[] = userAttempts.map((attempt: RawQuizAttempt): TransformedAttempt => {
                    const percentage: number = attempt.totalQuestions > 0
                        ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                        : 0;

                    return {
                        id: attempt.id,
                        quizTitle: attempt.quizTitle || 'Quiz sans titre',
                        quizCode: attempt.quizCode || 'N/A',
                        date: new Date(attempt.startedAt).toLocaleDateString('fr-FR'),
                        time: new Date(attempt.startedAt).toLocaleTimeString('fr-FR'),
                        score: attempt.score,
                        totalQuestions: attempt.totalQuestions,
                        percentage: percentage,
                        isPassed: percentage >= 70
                    };
                });

                setQuizAttempts(attemptsData);

            } catch (error) {
                console.error('Erreur lors du chargement de l\'historique:', error);
                setError('Erreur lors du chargement de l\'historique des quiz');
            } finally {
                setIsLoading(false);
            }
        };

        loadQuizHistory();
    }, []);

    // Fonction pour charger les détails d'une tentative
    const loadAttemptDetails: ParameterizedEventHandler<TransformedAttempt, Promise<void>> = async (attempt: TransformedAttempt): Promise<void> => {
        try {
            setLoadingDetails(true);
            setSelectedAttempt(attempt);

            // Récupérer les questions du quiz
            const questionsResponse: AxiosResponse<ApiResponseFormat<Question>> = await makeSecureApiCall<ApiResponseFormat<Question>>(`${API_BASE_URL}/api/questions`);
            let questionsArray: Question[] = [];

            if (Array.isArray(questionsResponse.data)) {
                questionsArray = questionsResponse.data;
            } else if (questionsResponse.data && Array.isArray((questionsResponse.data as ApiResponse<Question>).member)) {
                questionsArray = (questionsResponse.data as ApiResponse<Question>).member!;
            } else if (questionsResponse.data && Array.isArray((questionsResponse.data as ApiResponse<Question>)['hydra:member'])) {
                questionsArray = (questionsResponse.data as ApiResponse<Question>)['hydra:member']!;
            }

            // Récupérer toutes les réponses possibles
            const answersResponse: AxiosResponse<ApiResponseFormat<Answer>> = await makeSecureApiCall<ApiResponseFormat<Answer>>(`${API_BASE_URL}/api/answers`);
            let answersArray: Answer[] = [];

            if (Array.isArray(answersResponse.data)) {
                answersArray = answersResponse.data;
            } else if (answersResponse.data && Array.isArray((answersResponse.data as ApiResponse<Answer>).member)) {
                answersArray = (answersResponse.data as ApiResponse<Answer>).member!;
            } else if (answersResponse.data && Array.isArray((answersResponse.data as ApiResponse<Answer>)['hydra:member'])) {
                answersArray = (answersResponse.data as ApiResponse<Answer>)['hydra:member']!;
            }

            // Récupérer les réponses utilisateur
            const userAnswersResponse: AxiosResponse<ApiResponseFormat<UserAnswer>> = await makeSecureApiCall<ApiResponseFormat<UserAnswer>>(`${API_BASE_URL}/api/user_answers`);
            let userAnswersArray: UserAnswer[] = [];

            if (Array.isArray(userAnswersResponse.data)) {
                userAnswersArray = userAnswersResponse.data;
            } else if (userAnswersResponse.data && Array.isArray((userAnswersResponse.data as ApiResponse<UserAnswer>).member)) {
                userAnswersArray = (userAnswersResponse.data as ApiResponse<UserAnswer>).member!;
            } else if (userAnswersResponse.data && Array.isArray((userAnswersResponse.data as ApiResponse<UserAnswer>)['hydra:member'])) {
                userAnswersArray = (userAnswersResponse.data as ApiResponse<UserAnswer>)['hydra:member']!;
            }

            // Filtrer les réponses pour cette tentative
            const studentAnswers: UserAnswer[] = userAnswersArray.filter((answer: UserAnswer) =>
                answer.quizAttempt === `/api/quiz_attempts/${attempt.id}`
            );

            // Créer les détails des réponses
            const details: AttemptDetail[] = studentAnswers.map((userAnswer: UserAnswer): AttemptDetail => {
                const questionId: string = userAnswer.question.split('/').pop()!;
                const question: Question | undefined = questionsArray.find((q: Question) => q.id === parseInt(questionId));
                const allQuestionAnswers: Answer[] = answersArray.filter((a: Answer) => a.question === `/api/questions/${questionId}`);
                const answerId: string = userAnswer.answer.split('/').pop()!;
                const selectedAnswer: Answer | undefined = allQuestionAnswers.find((a: Answer) => a.id === parseInt(answerId));
                const correctAnswer: Answer | undefined = allQuestionAnswers.find((a: Answer) => a.correct === true);

                return {
                    questionId: questionId,
                    questionText: question?.text || 'Question non trouvée',
                    userAnswer: selectedAnswer?.text || 'Réponse non trouvée',
                    correctAnswer: correctAnswer?.text || 'Réponse correcte non trouvée',
                    isCorrect: selectedAnswer?.correct || false
                };
            });

            setAttemptDetails(details);

        } catch (error) {
            console.error('Erreur lors de la récupération des détails:', error);
            toast.error('Erreur lors du chargement des détails');
        } finally {
            setLoadingDetails(false);
        }
    };

    // Fonction pour retourner à la page étudiant
    const handleBackToStudent: EventHandler = (): void => {
        navigate('/student');
    };

    // Fonction pour gérer le changement du terme de recherche
    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    // Filtrer les tentatives selon la recherche
    const filteredAttempts: TransformedAttempt[] = quizAttempts.filter((attempt: TransformedAttempt) =>
        attempt.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.quizCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Affichage de chargement
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-xl mb-4">Chargement de l'historique...</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
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
                    <Button onClick={handleBackToStudent} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
                        Retour à l'accueil
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <Button
                        onClick={handleBackToStudent}
                        className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
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

                    <div className="w-32"></div> {/* Espaceur pour centrer le titre */}
                </div>

                {/* Barre de recherche */}
                <div className="mb-6">
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Rechercher un quiz..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-10 bg-gray-800 border-gray-700 text-white"
                        />
                    </div>
                </div>

                {/* Contenu principal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Liste des tentatives (gauche) */}
                    <Card className="bg-gray-100 text-gray-900">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <History className="w-5 h-5 mr-2" />
                                Mes Quiz Passés ({filteredAttempts.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {filteredAttempts.length > 0 ? (
                                filteredAttempts.map((attempt: TransformedAttempt) => (
                                    <div
                                        key={attempt.id}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedAttempt?.id === attempt.id
                                            ? 'bg-blue-100 border-blue-300'
                                            : 'bg-white border-gray-300 hover:bg-gray-50'
                                            }`}
                                        onClick={() => loadAttemptDetails(attempt)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{attempt.quizTitle}</h3>
                                                <p className="text-sm text-blue-600">Code: {attempt.quizCode}</p>
                                                <div className="flex items-center mt-2">
                                                    <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                                                    <p className="text-xs text-gray-500">{attempt.date} à {attempt.time}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center">
                                                    {attempt.isPassed ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-600 mr-1" />
                                                    )}
                                                    <p className={`font-bold ${attempt.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                                        {attempt.percentage}%
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {attempt.score}/{attempt.totalQuestions}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        Aucun quiz passé
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Vous n'avez pas encore passé de quiz personnellement
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Détails de la tentative sélectionnée (droite) */}
                    <Card className="bg-gray-100 text-gray-900">
                        <CardHeader>
                            <CardTitle>Détails du Quiz</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedAttempt ? (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold mb-2">{selectedAttempt.quizTitle}</h3>
                                        <p className="text-gray-600 mb-4">Code: {selectedAttempt.quizCode}</p>
                                        <div className="flex items-center justify-center mb-4">
                                            <Clock className="w-4 h-4 mr-1 text-gray-500" />
                                            <p className="text-sm text-gray-600">
                                                {selectedAttempt.date} à {selectedAttempt.time}
                                            </p>
                                        </div>
                                        <div className={`text-3xl font-bold mb-2 ${selectedAttempt.isPassed ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {selectedAttempt.percentage}%
                                        </div>
                                        <div className="flex items-center justify-center">
                                            {selectedAttempt.isPassed ? (
                                                <Trophy className="w-5 h-5 text-green-600 mr-2" />
                                            ) : (
                                                <Target className="w-5 h-5 text-red-600 mr-2" />
                                            )}
                                            <p className="text-sm text-gray-600">
                                                {selectedAttempt.isPassed ? 'Quiz réussi' : 'Quiz échoué'}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Score: {selectedAttempt.score}/{selectedAttempt.totalQuestions}
                                        </p>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-4">Détails des réponses</h4>
                                        {loadingDetails ? (
                                            <div className="text-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400 mx-auto"></div>
                                                <p className="text-sm text-gray-600 mt-2">Chargement des détails...</p>
                                            </div>
                                        ) : attemptDetails.length > 0 ? (
                                            <div className="space-y-3">
                                                {attemptDetails.map((answer: AttemptDetail, index: number) => (
                                                    <div key={answer.questionId} className="p-3 border rounded-lg bg-white">
                                                        <h5 className="font-medium text-gray-900 mb-2">
                                                            Question {index + 1}: {answer.questionText}
                                                        </h5>
                                                        <div className="space-y-1">
                                                            <div className="text-sm">
                                                                <span className="font-medium">Votre réponse:</span>
                                                                <span className={`ml-2 ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {answer.userAnswer}
                                                                </span>
                                                            </div>
                                                            {!answer.isCorrect && (
                                                                <div className="text-sm">
                                                                    <span className="font-medium">Réponse correcte:</span>
                                                                    <span className="ml-2 text-green-600">
                                                                        {answer.correctAnswer}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="mt-2">
                                                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${answer.isCorrect
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {answer.isCorrect ? 'Correct' : 'Incorrect'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-600">
                                                Aucun détail disponible pour ce quiz
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        Sélectionnez un quiz
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Cliquez sur un quiz dans la liste pour voir ses détails
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default StudentHistoryPage;