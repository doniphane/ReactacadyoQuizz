

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';

// Import des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Import des icônes Lucide React
import { ArrowLeft } from 'lucide-react';



// Interface pour les données du participant
interface ParticipantData {
    firstName: string;
    lastName: string;
    quizCode: string;
}

// Interface pour les informations du quiz
interface QuizInfo {
    id: number;
    title: string;
    description?: string;
    isActive: boolean;
    isStarted: boolean;
    uniqueCode: string;
    passingScore?: number;
}

// Interface pour une réponse (données brutes de l'API)
interface RawAnswerData {
    id: number;
    text: string;
    orderNumber: number;
    isCorrect: boolean;
}

// Interface pour une réponse transformée
interface Answer {
    id: number;
    text: string;
    orderNumber: number;
    isCorrect: boolean;
}

// Interface pour une question (données brutes de l'API)
interface RawQuestionData {
    id: number;
    text: string;
    orderNumber: number;
    answers: RawAnswerData[];
}

// Interface pour une question transformée
interface Question {
    id: number;
    text: string;
    orderNumber: number;
    answers: Answer[];
}

// Interface pour les données complètes du quiz récupérées de l'API
interface QuizData {
    id: number;
    title: string;
    description?: string;
    questions: RawQuestionData[];
    isActive: boolean;
    isStarted: boolean;
    uniqueCode: string;
    passingScore?: number;
}

// Type pour les réponses utilisateur (questionId -> answerId)
type UserAnswers = Record<number, number>;

// Interface pour l'état de navigation passé depuis la page précédente
interface LocationState {
    participantData: ParticipantData;
    quizInfo: QuizInfo;
}

// Interface personnalisée pour useLocation avec notre type de state
interface CustomLocation extends Omit<Location, 'state'> {
    state: LocationState | null;
}

// Interface pour les données de création d'une tentative de quiz
interface AttemptCreationData {
    quiz: string; // URL de référence vers le quiz
    participantFirstName: string;
    participantLastName: string;
}

// Interface pour les données de tentative créée
interface AttemptData {
    id: number;
    quiz: string;
    participantFirstName: string;
    participantLastName: string;
    startedAt: string;
    score?: number;
    totalQuestions?: number;
}

// Interface pour les données de soumission du quiz
interface QuizSubmissionData {
    attemptId: number;
    answers: UserAnswers;
}

// Interface pour les résultats du quiz
interface QuizResults {
    score: number;
    totalQuestions: number;
    percentage: number;
    responseDetails?: unknown[];
}

// Interface pour les réponses d'erreur de l'API
interface ApiErrorResponse {
    message?: string;
    error?: string;
}

// Interface pour les erreurs Axios personnalisées
interface CustomAxiosError extends AxiosError {
    response?: AxiosResponse<ApiErrorResponse>;
}

// Types pour les états du composant
type QuestionsState = Question[];
type UserAnswersState = UserAnswers;
type LoadingState = boolean;
type SubmittingState = boolean;
type CurrentQuestionIndexState = number;

// Types pour les gestionnaires d'événements
type AnswerSelectHandler = (questionId: number, answerId: number) => void;
type NextQuestionHandler = () => void;
type SubmitQuizHandler = (event: FormEvent<HTMLFormElement>) => Promise<void>;
type BackHandler = () => void;
type EventHandler = () => void;


// URL de base de l'API Symfony
const API_BASE_URL: string = 'http://localhost:8000';

function TakeQuizPage() {
    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // Hook pour récupérer les données passées en navigation
    const location = useLocation() as CustomLocation;
    const { participantData, quizInfo }: Partial<LocationState> = location.state || {};

    // État pour stocker les questions du quiz
    const [questions, setQuestions] = useState<QuestionsState>([]);

    // État pour stocker les réponses de l'utilisateur
    const [userAnswers, setUserAnswers] = useState<UserAnswersState>({});

    // État pour indiquer si on charge les questions
    const [isLoading, setIsLoading] = useState<LoadingState>(true);

    // État pour indiquer si on soumet les réponses
    const [isSubmitting, setIsSubmitting] = useState<SubmittingState>(false);

    // État pour la question actuelle (pour l'affichage une par une)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<CurrentQuestionIndexState>(0);

    // Charger les questions du quiz au montage du composant
    useEffect(() => {
        const loadQuestions = async (): Promise<void> => {
            try {
                // Appeler l'API pour récupérer le quiz avec ses questions (route publique)
                const response: AxiosResponse<QuizData> = await axios.get<QuizData>(`${API_BASE_URL}/api/public/quizzes/${quizInfo!.id}`);
                const quizData: QuizData = response.data;
                const questionsData: RawQuestionData[] = quizData.questions || [];

                // Transformer les données pour correspondre à notre interface
                const transformedQuestions: Question[] = questionsData.map((questionData: RawQuestionData): Question => ({
                    id: questionData.id,
                    text: questionData.text,
                    orderNumber: questionData.orderNumber,
                    answers: questionData.answers.map((answerData: RawAnswerData): Answer => ({
                        id: answerData.id,
                        text: answerData.text,
                        orderNumber: answerData.orderNumber,
                        isCorrect: answerData.isCorrect
                    }))
                }));

                console.log('Questions chargées depuis l\'API:', questionsData);
                console.log('Questions transformées:', transformedQuestions);

                setQuestions(transformedQuestions);
            } catch (error) {
                // Gérer les erreurs de l'API
                const customError = error as CustomAxiosError;
                const errorMessage: string = customError.response?.data?.message || customError.message || 'Erreur inconnue';
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
    const handleAnswerSelect: AnswerSelectHandler = (questionId: number, answerId: number): void => {
        console.log('Sélection réponse:', { questionId, answerId });
        setUserAnswers((prev: UserAnswersState) => ({
            ...prev,
            [questionId]: answerId
        }));
    };

    // Fonction pour passer à la question suivante
    const handleNextQuestion: NextQuestionHandler = (): void => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    // Fonction pour gérer la soumission du quiz
    const handleSubmitQuiz: SubmitQuizHandler = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        console.log('Soumission du quiz avec userAnswers:', userAnswers);
        console.log('Questions:', questions);

        // Vérifier que toutes les questions ont une réponse
        const answeredQuestions: number = Object.keys(userAnswers).length;
        if (answeredQuestions < questions.length) {
            alert(`Veuillez répondre à toutes les questions. Vous avez répondu à ${answeredQuestions}/${questions.length} questions.`);
            return;
        }

        setIsSubmitting(true);

        try {
            // Créer une tentative de quiz
            const attemptCreationData: AttemptCreationData = {
                quiz: `/api/quizzes/${quizInfo!.id}`,
                participantFirstName: participantData!.firstName,
                participantLastName: participantData!.lastName
            };

            const attemptResponse: AxiosResponse<AttemptData> = await axios.post<AttemptData>(
                `${API_BASE_URL}/api/quiz_attempts`, 
                attemptCreationData
            );

            const attemptData: AttemptData = attemptResponse.data;
            console.log('Tentative créée:', attemptData);

            // Soumettre les réponses
            const submissionData: QuizSubmissionData = {
                attemptId: attemptData.id,
                answers: userAnswers
            };

            const submitResponse: AxiosResponse<QuizResults> = await axios.post<QuizResults>(
                `${API_BASE_URL}/api/public/quizzes/quizzes/${quizInfo!.id}/submit`, 
                submissionData
            );

            const results: QuizResults = submitResponse.data;
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

        } catch (error) {
            // Gérer les erreurs de l'API
            const customError = error as CustomAxiosError;
            const errorMessage: string = customError.response?.data?.message || customError.message || 'Erreur inconnue';
            alert('Erreur lors de la soumission du quiz: ' + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour retourner à la page précédente
    const handleBack: BackHandler = (): void => {
        navigate('/student');
    };

    // Fonction pour gérer le clic sur le bouton Suivant
    const handleNextClick: EventHandler = (): void => {
        handleNextQuestion();
    };

   
    const handleSubmitClick: EventHandler = (): void => {
        // Créer un événement factice pour maintenir la compatibilité
        const fakeEvent = {
            preventDefault: () => {}
        } as FormEvent<HTMLFormElement>;
        
        handleSubmitQuiz(fakeEvent);
    };

    // Calculer le pourcentage de progression
    const progressPercentage: number = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

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

    // Si pas de questions, afficher un message
    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-xl mb-4">Aucune question disponible pour ce quiz.</div>
                    <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                </div>
            </div>
        );
    }

    // Question actuelle
    const currentQuestion: Question = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Header avec progression */}
            <div className="max-w-4xl mx-auto mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-yellow-400">
                            Question {currentQuestionIndex + 1}/{questions.length}
                        </h1>
                    </div>
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

            {/* Contenu principal du quiz */}
            <div className="max-w-4xl mx-auto">
                <Card className="bg-gray-100 text-gray-900">
                    <CardContent className="p-0">
                        {/* Section question (fond jaune) */}
                        <div className="bg-yellow-500 p-6 rounded-t-lg">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {currentQuestion.text}
                            </h2>
                            <p className="text-gray-800">
                                Choisissez une réponse
                            </p>
                        </div>

                        {/* Section réponses (fond gris clair) */}
                        <div className="bg-gray-50 p-6 rounded-b-lg">
                            <div className="space-y-4">
                                {currentQuestion.answers
                                    .sort((a: Answer, b: Answer) => a.orderNumber - b.orderNumber)
                                    .map((answer: Answer) => (
                                        <div key={answer.id} className="flex items-center">
                                            <input
                                                type="radio"
                                                name={`question_${currentQuestion.id}`}
                                                id={`answer_${answer.id}`}
                                                value={answer.id}
                                                checked={userAnswers[currentQuestion.id] === answer.id}
                                                onChange={() => handleAnswerSelect(currentQuestion.id, answer.id)}
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
                    </CardContent>
                </Card>

                {/* Bouton Suivant/Terminer en dehors de la carte */}
                <div className="flex justify-end mt-6">
                    {currentQuestionIndex < questions.length - 1 ? (
                        <Button
                            onClick={handleNextClick}
                            disabled={!userAnswers[currentQuestion.id]}
                            className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 font-semibold"
                        >
                            Suivant
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmitClick}
                            disabled={isSubmitting || Object.keys(userAnswers).length < questions.length}
                            className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 font-semibold"
                        >
                            {isSubmitting ? 'Soumission...' : 'Terminer le Quiz'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TakeQuizPage;