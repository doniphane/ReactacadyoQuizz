// Composant de page Historique des Quiz pour les étudiants

import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
    Clock
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

// Interface pour une question
interface Question {
    id: number;
    text: string;
    quiz: string;
}

// Interface pour une réponse
interface Answer {
    id: number;
    text: string;
    correct: boolean;
    question: string;
}

// Interface pour une réponse utilisateur
interface UserAnswer {
    id: number;
    question: string;
    answer: string;
    quizAttempt: string;
}

// Interface pour les détails d'une réponse
interface AttemptDetail {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

// URL de l'API
const API_BASE_URL = 'http://localhost:8000';


function StudentHistoryPage() {
    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // États pour les données
    const [quizAttempts, setQuizAttempts] = useState<TransformedAttempt[]>([]);
    const [selectedAttempt, setSelectedAttempt] = useState<TransformedAttempt | null>(null);
    const [attemptDetails, setAttemptDetails] = useState<AttemptDetail[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

    // Fonction pour obtenir le token
    const getToken = (): string | null => {
        const token = AuthService.getToken();
        if (!token) {
            toast.error('Vous devez être connecté');
            navigate('/login');
            return null;
        }
        return token;
    };

    // Fonction pour faire des appels API sécurisés
    const makeSecureApiCall = async (url: string) => {
        const token = getToken();
        if (!token) {
            throw new Error('Vous devez être connecté pour effectuer cette action');
        }

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response;
    };

    // Charger l'historique des quiz au montage du composant
    useEffect(() => {
        const loadQuizHistory = async (): Promise<void> => {
            try {
                setIsLoading(true);
                setError(null);

                // Récupérer les informations de l'utilisateur connecté
                const userResponse = await makeSecureApiCall(`${API_BASE_URL}/api/me`);
                const currentUser: User = userResponse.data;

                // Récupérer les tentatives de l'utilisateur connecté
                const response = await makeSecureApiCall(`${API_BASE_URL}/api/quiz_attempts`);
                let attemptsArray: Array<{
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
                }> = [];

                // Gérer le format de réponse JSON-LD
                if (Array.isArray(response.data)) {
                    attemptsArray = response.data;
                } else if (response.data.member) {
                    attemptsArray = response.data.member;
                } else if (response.data['hydra:member']) {
                    attemptsArray = response.data['hydra:member'];
                }

                // Filtrer les tentatives pour l'utilisateur connecté uniquement
                const userAttempts = attemptsArray.filter((attempt) => {
                    return attempt.participantEmail === currentUser.email ||
                        attempt.participantFirstName === currentUser.firstName ||
                        (attempt.participantFirstName && attempt.participantLastName &&
                            `${attempt.participantFirstName} ${attempt.participantLastName}` === `${currentUser.firstName} ${currentUser.lastName}`);
                });

                // Transformer les données des tentatives
                const attemptsData: TransformedAttempt[] = userAttempts.map((attempt) => {
                    const percentage = attempt.totalQuestions > 0
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
    const loadAttemptDetails = async (attempt: TransformedAttempt): Promise<void> => {
        try {
            setLoadingDetails(true);
            setSelectedAttempt(attempt);

            // Récupérer les questions du quiz
            const questionsResponse = await makeSecureApiCall(`${API_BASE_URL}/api/questions`);
            let questionsArray: Question[] = [];

            if (Array.isArray(questionsResponse.data)) {
                questionsArray = questionsResponse.data;
            } else if (questionsResponse.data.member) {
                questionsArray = questionsResponse.data.member;
            } else if (questionsResponse.data['hydra:member']) {
                questionsArray = questionsResponse.data['hydra:member'];
            }

            // Récupérer toutes les réponses possibles
            const answersResponse = await makeSecureApiCall(`${API_BASE_URL}/api/answers`);
            let answersArray: Answer[] = [];

            if (Array.isArray(answersResponse.data)) {
                answersArray = answersResponse.data;
            } else if (answersResponse.data.member) {
                answersArray = answersResponse.data.member;
            } else if (answersResponse.data['hydra:member']) {
                answersArray = answersResponse.data['hydra:member'];
            }

            // Récupérer les réponses utilisateur
            const userAnswersResponse = await makeSecureApiCall(`${API_BASE_URL}/api/user_answers`);
            let userAnswersArray: UserAnswer[] = [];

            if (Array.isArray(userAnswersResponse.data)) {
                userAnswersArray = userAnswersResponse.data;
            } else if (userAnswersResponse.data.member) {
                userAnswersArray = userAnswersResponse.data.member;
            } else if (userAnswersResponse.data['hydra:member']) {
                userAnswersArray = userAnswersResponse.data['hydra:member'];
            }

            // Filtrer les réponses pour cette tentative
            const studentAnswers: UserAnswer[] = userAnswersArray.filter((answer: UserAnswer) =>
                answer.quizAttempt === `/api/quiz_attempts/${attempt.id}`
            );

            // Créer les détails des réponses
            const details: AttemptDetail[] = studentAnswers.map((userAnswer: UserAnswer): AttemptDetail => {
                const questionId = userAnswer.question.split('/').pop() || '0';
                const question = questionsArray.find((q: Question) => q.id === parseInt(questionId));
                const allQuestionAnswers = answersArray.filter((a: Answer) => a.question === `/api/questions/${questionId}`);
                const answerId = userAnswer.answer.split('/').pop() || '0';
                const selectedAnswer = allQuestionAnswers.find((a: Answer) => a.id === parseInt(answerId));
                const correctAnswer = allQuestionAnswers.find((a: Answer) => a.correct === true);

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
    const handleBackToStudent = (): void => {
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
                    <Button onClick={handleBackToStudent} className="bg-white hover:bg-yellow-500 text-gray-900">
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
                        className="bg-white hover:bg-yellow-600 text-gray-900"
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