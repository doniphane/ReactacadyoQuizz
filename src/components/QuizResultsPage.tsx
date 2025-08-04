

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


type UserAnswers = Record<number, number>;

// Interface pour une réponse dans les détails du backend
interface BackendAnswer {
    id: number;
    text: string;
    isCorrect: boolean;
}

// Interface pour un détail de réponse du backend
interface ResponseDetail {
    questionId: number;
    questionText: string;
    userAnswer: BackendAnswer;
    correctAnswer: BackendAnswer;
    isCorrect: boolean;
}

// Interface pour les résultats venant du backend
interface BackendResults {
    score: number;
    totalQuestions: number;
    percentage: number;
    responseDetails?: ResponseDetail[];
}

// Interface pour l'état de navigation passé depuis la page précédente
interface LocationState {
    quizInfo: QuizInfo;
    userAnswers: UserAnswers;
    results?: BackendResults;
}

// Interface personnalisée pour useLocation avec notre type de state
interface CustomLocation extends Omit<Location, 'state'> {
    state: LocationState | null;
}

// Interface pour une réponse à une question
interface Answer {
    id: number;
    text: string;
    isCorrect?: boolean;
    orderNumber?: number;
}

// Interface pour une question avec ses réponses
interface Question {
    id: number;
    text: string;
    answers: Answer[];
    orderNumber?: number;
}

// Interface pour les données complètes d'un quiz récupérées de l'API
interface QuizData {
    id: number;
    title: string;
    description?: string;
    questions: Question[];
    uniqueCode?: string;
    isActive: boolean;
    isStarted: boolean;
    passingScore?: number;
}

// Interface pour les détails d'une réponse utilisateur formatée pour l'affichage
interface UserAnswerDetail {
    questionId: number;
    questionText: string;
    userAnswer: Answer;
    correctAnswer: Answer;
    isCorrect: boolean;
}

// Interface pour les résultats calculés finaux
interface CalculatedResults {
    score: number;
    totalQuestions: number;
    percentage: number;
    userAnswers: UserAnswerDetail[];
}

// Type pour l'état de calcul
type CalculatingState = boolean;

// Type pour les résultats (peuvent être null pendant le calcul)
type ResultsState = CalculatedResults | null;



// URL de base de l'API Symfony
const API_BASE_URL: string = 'http://localhost:8000';

function QuizResultsPage() {
  
    const navigate = useNavigate();

    // Hook pour récupérer les données passées en navigation
    const location = useLocation() as CustomLocation;
    const { quizInfo, userAnswers, results: backendResults }: Partial<LocationState> = location.state || {};

    // État pour stocker les résultats calculés
    const [results, setResults] = useState<ResultsState>(null);

    // État pour indiquer si on calcule les résultats
    const [isCalculating, setIsCalculating] = useState<CalculatingState>(true);

   
    useEffect(() => {
        const calculateResults = async (): Promise<void> => {
            if (!quizInfo || !userAnswers) {
                console.log('Données manquantes:', { quizInfo, userAnswers });
                navigate('/student');
                return;
            }

            try {
                // Récupérer les questions directement depuis l'API pour avoir les bons IDs
                const response: AxiosResponse<QuizData> = await axios.get<QuizData>(`${API_BASE_URL}/api/public/quizzes/${quizInfo.id}`);
                const quizData: QuizData = response.data;
                const questions: Question[] = quizData.questions || [];

                console.log('Questions récupérées depuis l\'API:', questions);
                console.log('userAnswers reçus:', userAnswers);

                // Log détaillé des questions et réponses
                questions.forEach((question: Question, index: number) => {
                    console.log(`Question ${index + 1}:`, {
                        id: question.id,
                        text: question.text,
                        answers: question.answers.map((a: Answer) => ({
                            id: a.id,
                            text: a.text,
                            isCorrect: a.isCorrect
                        }))
                    });
                });

               
                if (backendResults) {
                    console.log('Utilisation des résultats du backend:', backendResults);
                    const userAnswersDetails: UserAnswerDetail[] = [];

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
                                    orderNumber: 1, 
                                    isCorrect: detail.userAnswer.isCorrect
                                },
                                correctAnswer: detail.correctAnswer ? {
                                    id: detail.correctAnswer.id,
                                    text: detail.correctAnswer.text,
                                    orderNumber: 1, 
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
                    
                        console.log('Pas de détails de réponse du backend, calcul côté frontend');

                        // Analyser chaque question pour créer les détails
                        questions.forEach((question: Question) => {
                            const userAnswerId: number = userAnswers[question.id];
                            const userAnswer: Answer | undefined = question.answers.find((a: Answer) => a.id === userAnswerId);

                            // Si isCorrect n'est pas défini, on doit déterminer la bonne réponse autrement
                            let correctAnswer: Answer | undefined = question.answers.find((a: Answer) => a.isCorrect);

                            if (!correctAnswer && question.answers.length > 0) {
                                correctAnswer = question.answers[0];
                            }

                            console.log('Question:', question.id, 'UserAnswerId:', userAnswerId, 'UserAnswer:', userAnswer, 'CorrectAnswer:', correctAnswer);

                            if (userAnswer && correctAnswer) {
                                // Déterminer si la réponse est correcte
                                let isCorrect: boolean = false;

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
                   
                    let correctAnswers: number = 0;
                    const userAnswersDetails: UserAnswerDetail[] = [];

                    // Analyser chaque question
                    questions.forEach((question: Question) => {
                        const userAnswerId: number = userAnswers[question.id];
                        const userAnswer: Answer | undefined = question.answers.find((a: Answer) => a.id === userAnswerId);
                        const correctAnswer: Answer | undefined = question.answers.find((a: Answer) => a.isCorrect);

                        if (userAnswer && correctAnswer) {
                            const isCorrect: boolean = userAnswer.isCorrect || false;
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
                alert('Erreur lors du calcul des résultats');
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
                    <h1 className="text-4xl font-bold text-yellow-400 mb-2">Résultat du Quizz</h1>
                    <p className="text-gray-300">Votre performance détaillée</p>
                </div>

                {/* Main Results Card - Full Width */}
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

                {/* Bottom Section - 50/50 Split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Answer Details - Left Side */}
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

                    {/* Actions Sidebar - Right Side */}
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