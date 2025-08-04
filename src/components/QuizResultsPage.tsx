

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Import des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import des icônes Lucide React
import { CheckCircle, XCircle, Home, Trophy } from 'lucide-react';


// Interface pour les informations du quiz
interface QuizInfo {
    id: number;
    title: string;
    description?: string;
    uniqueCode?: string;
    isActive: boolean;
    isStarted: boolean;
    passingScore?: number;
}

// Type pour les réponses utilisateur
type UserAnswers = Record<number, number>;

// Interface pour l'état de navigation
interface LocationState {
    quizInfo: QuizInfo;
    userAnswers: UserAnswers;
    results?: {
        score: number;
        totalQuestions: number;
        percentage: number;
        responseDetails?: Array<{
            questionId: number;
            questionText: string;
            userAnswer: { id: number; text: string; isCorrect: boolean };
            correctAnswer: { id: number; text: string; isCorrect: boolean };
            isCorrect: boolean;
        }>;
    };
}

// Interface personnalisée pour useLocation
interface CustomLocation extends Omit<Location, 'state'> {
    state: LocationState | null;
}

// Interface pour une réponse
interface Answer {
    id: number;
    text: string;
    isCorrect?: boolean;
}

// Interface pour une question
interface Question {
    id: number;
    text: string;
    answers: Answer[];
}

// Interface pour les détails d'une réponse utilisateur
interface UserAnswerDetail {
    questionId: number;
    questionText: string;
    userAnswer: Answer;
    correctAnswer: Answer;
    isCorrect: boolean;
}

// Interface pour les résultats calculés
interface CalculatedResults {
    score: number;
    totalQuestions: number;
    percentage: number;
    userAnswers: UserAnswerDetail[];
}



// URL de base de l'API Symfony
const API_BASE_URL: string = 'http://localhost:8000';

function QuizResultsPage() {
    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // Hook pour récupérer les données passées en navigation
    const location = useLocation() as CustomLocation;
    const { quizInfo, userAnswers, results: backendResults }: Partial<LocationState> = location.state || {};

    // État pour stocker les résultats calculés
    const [results, setResults] = useState<CalculatedResults | null>(null);

    // État pour indiquer si on calcule les résultats
    const [isCalculating, setIsCalculating] = useState<boolean>(true);

    // Calculer les résultats au montage du composant
    useEffect(() => {
        const calculateResults = async (): Promise<void> => {
            if (!quizInfo || !userAnswers) {
                navigate('/student');
                return;
            }

            try {
                // Récupérer les questions depuis l'API
                const response: AxiosResponse<{ questions: Question[] }> = await axios.get(`${API_BASE_URL}/api/public/quizzes/${quizInfo.id}`);
                const questions: Question[] = response.data.questions || [];

                // Si on a les résultats du backend, on les utilise
                if (backendResults) {
                    const userAnswersDetails: UserAnswerDetail[] = [];

                    // Si le backend a fourni les détails des réponses, on les utilise
                    if (backendResults.responseDetails) {
                        backendResults.responseDetails.forEach((detail) => {
                            userAnswersDetails.push({
                                questionId: detail.questionId,
                                questionText: detail.questionText,
                                userAnswer: {
                                    id: detail.userAnswer.id,
                                    text: detail.userAnswer.text,
                                    isCorrect: detail.userAnswer.isCorrect
                                },
                                correctAnswer: {
                                    id: detail.correctAnswer.id,
                                    text: detail.correctAnswer.text,
                                    isCorrect: detail.correctAnswer.isCorrect
                                },
                                isCorrect: detail.isCorrect
                            });
                        });
                    } else {
                        // Calcul côté frontend
                        questions.forEach((question: Question) => {
                            const userAnswerId: number = userAnswers[question.id];
                            const userAnswer: Answer | undefined = question.answers.find((a: Answer) => a.id === userAnswerId);
                            const correctAnswer: Answer | undefined = question.answers.find((a: Answer) => a.isCorrect);

                            if (userAnswer && correctAnswer) {
                                const isCorrect: boolean = userAnswer.isCorrect || userAnswer.id === correctAnswer.id;

                                userAnswersDetails.push({
                                    questionId: question.id,
                                    questionText: question.text,
                                    userAnswer,
                                    correctAnswer,
                                    isCorrect
                                });
                            }
                        });
                    }

                    setResults({
                        score: backendResults.score,
                        totalQuestions: backendResults.totalQuestions,
                        percentage: backendResults.percentage,
                        userAnswers: userAnswersDetails
                    });
                } else {
                    // Calcul côté frontend si pas de résultats backend
                    let correctAnswers: number = 0;
                    const userAnswersDetails: UserAnswerDetail[] = [];

                    questions.forEach((question: Question) => {
                        const userAnswerId: number = userAnswers[question.id];
                        const userAnswer: Answer | undefined = question.answers.find((a: Answer) => a.id === userAnswerId);
                        const correctAnswer: Answer | undefined = question.answers.find((a: Answer) => a.isCorrect);

                        if (userAnswer && correctAnswer) {
                            const isCorrect: boolean = userAnswer.isCorrect || userAnswer.id === correctAnswer.id;
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

                    const totalQuestions: number = questions.length;
                    const percentage: number = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

                    setResults({
                        score: correctAnswers,
                        totalQuestions,
                        percentage,
                        userAnswers: userAnswersDetails
                    });
                }

            } catch (error) {
                console.error('Erreur lors du calcul des résultats:', error);
                navigate('/student');
            } finally {
                setIsCalculating(false);
            }
        };

        calculateResults();
    }, [quizInfo, userAnswers, backendResults, navigate]);

    // Fonction pour retourner à l'accueil
    const handleBackToHome = (): void => {
        navigate('/student');
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

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-yellow-400 mb-2">Résultat du Quiz</h1>
                    <p className="text-gray-300">Votre performance détaillée</p>
                </div>

                {/* Main Results Card */}
                <Card className="bg-gray-200 text-gray-900 mb-6">
                    <CardContent className="p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <Trophy className="w-16 h-16 text-yellow-500" />
                        </div>
                        <div className="text-6xl font-bold mb-2">
                            {results.score}/{results.totalQuestions}
                        </div>
                        <div className="text-2xl text-gray-600 mb-4">{Math.round(results.percentage)}%</div>
                        <div className="text-red-600 font-semibold text-lg">Il faut réviser !</div>
                    </CardContent>
                </Card>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Answer Details */}
                    <Card className="bg-gray-200 text-gray-900">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Détail des Réponses</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {results.userAnswers.map((answerDetail: UserAnswerDetail, index: number) => (
                                <div key={answerDetail.questionId} className="border border-gray-300 rounded-lg p-4 bg-gray-100">
                                    <div className="flex items-start gap-3 mb-3">
                                        {answerDetail.isCorrect ? (
                                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        )}
                                        <h3 className="font-semibold">
                                            Question {index + 1}: {answerDetail.questionText}
                                        </h3>
                                    </div>
                                    <div className="ml-8 space-y-1">
                                        <div className="text-red-600">
                                            <span className="font-medium">Votre réponse:</span> {answerDetail.userAnswer.text}
                                        </div>
                                        {!answerDetail.isCorrect && (
                                            <div className="text-green-600">
                                                <span className="font-medium">Réponse correcte:</span> {answerDetail.correctAnswer.text}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card className="bg-gray-200 text-gray-900 h-48">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl font-bold text-center">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex items-center justify-center h-full">
                            <Button
                                onClick={handleBackToHome}
                                variant="outline"
                                className="w-full border-gray-400 text-gray-700 hover:bg-gray-100 bg-transparent"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Retour à l'accueil
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default QuizResultsPage;