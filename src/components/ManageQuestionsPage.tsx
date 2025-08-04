
import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';

// Import des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import des icônes Lucide React
import { ArrowLeft, Plus, Loader2, CheckCircle, XCircle } from 'lucide-react';

// Import du service d'authentification
import AuthService from '../services/AuthService';



// Interface pour une réponse à une question
interface Answer {
    id?: number;
    text: string;
    correct: boolean;
    orderNumber?: number;
}

// Interface pour une question
interface Question {
    id?: number;
    text: string;
    answers: Answer[];
    orderNumber?: number;
}

// Interface pour un utilisateur/professeur
interface Teacher {
    id: number;
    email: string;
    name?: string;
}

// Interface pour un quiz complet
interface Quiz {
    id: number;
    title: string;
    description?: string;
    uniqueCode: string;
    isActive: boolean;
    isStarted: boolean;
    passingScore: number;
    teacher?: Teacher;
    questions: Question[];
}

// Interface pour les données brutes du quiz venant de l'API
interface RawQuizData {
    id?: number;
    title: string;
    description?: string;
    uniqueCode?: string;
    isActive: boolean;
    isStarted: boolean;
    passingScore: number;
    teacher?: Teacher;
    questions?: Question[];
}

// Interface pour une nouvelle question en cours de création
interface NewQuestion {
    text: string;
    answers: NewAnswer[];
}

// Interface pour une nouvelle réponse en cours de création
interface NewAnswer {
    text: string;
    correct: boolean;
}

// Interface pour les données d'une question à envoyer à l'API
interface QuestionToSubmit {
    text: string;
    answers: AnswerToSubmit[];
}

// Interface pour les données d'une réponse à envoyer à l'API
interface AnswerToSubmit {
    text: string;
    correct: boolean;
}

// Interface pour les réponses d'erreur de l'API
interface ApiErrorResponse {
    message?: string;
    errors?: string[];
}

// Interface pour les erreurs Axios personnalisées
interface CustomAxiosError extends AxiosError {
    response?: AxiosResponse<ApiErrorResponse>;
    request?: unknown;
}

// Type pour les champs modifiables d'une réponse
type AnswerField = 'text' | 'correct';

// Type pour l'état de chargement
type LoadingState = boolean;

// Type pour l'état d'erreur
type ErrorState = string | null;



// URL de base de l'API Symfony
const API_BASE_URL: string = 'http://localhost:8000';

function ManageQuestionsPage() {
    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // Hook pour récupérer les paramètres de l'URL
    const { quizId } = useParams();

    // États pour les données
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isLoading, setIsLoading] = useState<LoadingState>(true);
    const [error, setError] = useState<ErrorState>(null);

    // États pour le formulaire d'ajout de question
    const [newQuestion, setNewQuestion] = useState<NewQuestion>({
        text: '',
        answers: [
            { text: '', correct: false },
            { text: '', correct: false }
        ]
    });
    const [isSubmitting, setIsSubmitting] = useState<LoadingState>(false);

    // Fonction pour récupérer les données du quiz
    const fetchQuiz = async (): Promise<void> => {
        if (!quizId) return;

        try {
            setIsLoading(true);
            setError(null);

            // Récupérer le token d'authentification
            const token: string | null = AuthService.getToken();
            if (!token) {
                setError('Vous devez être connecté pour accéder à cette page');
                return;
            }

            // Appeler l'API pour récupérer le quiz avec ses questions
            const response: AxiosResponse<RawQuizData> = await axios.get < RawQuizData > (
                `${API_BASE_URL}/api/quizzes/${quizId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const quizData: RawQuizData = response.data;
            console.log('Quiz récupéré:', quizData);

            // Transformer les données pour correspondre à notre interface
            const transformedQuiz: Quiz = {
                id: quizData.id || 0,
                title: quizData.title,
                description: quizData.description,
                uniqueCode: quizData.uniqueCode || 'N/A',
                isActive: quizData.isActive,
                isStarted: quizData.isStarted,
                passingScore: quizData.passingScore,
                teacher: quizData.teacher,
                questions: quizData.questions || []
            };

            setQuiz(transformedQuiz);

        } catch (error) {
            console.error('Erreur lors de la récupération du quiz:', error);
            const customError = error as CustomAxiosError;

            if (customError.response?.status === 404) {
                setError('Quiz non trouvé');
            } else if (customError.response?.status === 403) {
                setError('Vous n\'êtes pas autorisé à accéder à ce quiz');
            } else {
                setError('Erreur lors du chargement du quiz');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Récupérer les données au chargement de la page
    useEffect(() => {
        fetchQuiz();
    }, [quizId]);

    // Fonction pour ajouter une réponse au formulaire
    const handleAddAnswer = (): void => {
        setNewQuestion((prev: NewQuestion) => ({
            ...prev,
            answers: [...prev.answers, { text: '', correct: false }]
        }));
    };

    // Fonction pour mettre à jour une réponse
    const handleAnswerChange = (index: number, field: AnswerField, value: string | boolean): void => {
        setNewQuestion((prev: NewQuestion) => ({
            ...prev,
            answers: prev.answers.map((answer: NewAnswer, i: number) =>
                i === index ? { ...answer, [field]: value } : answer
            )
        }));
    };

    // Fonction pour supprimer une réponse
    const handleRemoveAnswer = (index: number): void => {
        if (newQuestion.answers.length <= 2) return;

        setNewQuestion((prev: NewQuestion) => ({
            ...prev,
            answers: prev.answers.filter((_: NewAnswer, i: number) => i !== index)
        }));
    };

    // Fonction pour gérer le changement du texte de la question
    const handleQuestionTextChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
        setNewQuestion((prev: NewQuestion) => ({
            ...prev,
            text: e.target.value
        }));
    };

    // Fonction pour gérer le changement du texte d'une réponse
    const handleAnswerTextChange = (index: number, e: ChangeEvent<HTMLInputElement>): void => {
        handleAnswerChange(index, 'text', e.target.value);
    };

    // Fonction pour gérer le changement du statut correct d'une réponse
    const handleAnswerCorrectChange = (index: number, e: ChangeEvent<HTMLInputElement>): void => {
        handleAnswerChange(index, 'correct', e.target.checked);
    };

    // Fonction pour soumettre une nouvelle question
    const handleSubmitQuestion = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        if (!quiz) return;

        // Validation
        if (!newQuestion.text.trim()) {
            alert('Le texte de la question est obligatoire');
            return;
        }

        if (newQuestion.answers.length < 2) {
            alert('Il faut au moins 2 réponses');
            return;
        }

        const hasCorrectAnswer: boolean = newQuestion.answers.some((answer: NewAnswer) => answer.correct);
        if (!hasCorrectAnswer) {
            alert('Il faut au moins une réponse correcte');
            return;
        }

        setIsSubmitting(true);

        try {
            // Récupérer le token d'authentification
            const token: string | null = AuthService.getToken();
            if (!token) {
                alert('Vous devez être connecté pour ajouter une question');
                return;
            }

            // Préparer les données de la question
            const questionData: QuestionToSubmit = {
                text: newQuestion.text.trim(),
                answers: newQuestion.answers.map((answer: NewAnswer): AnswerToSubmit => ({
                    text: answer.text.trim(),
                    correct: answer.correct
                }))
            };

            // Appel API pour ajouter une question
            const response: AxiosResponse<Question> = await axios.post < Question > (
                `${API_BASE_URL}/api/quizzes/${quiz.id}/questions`,
                questionData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('Question ajoutée:', response.data);

            // Réinitialiser le formulaire
            setNewQuestion({
                text: '',
                answers: [
                    { text: '', correct: false },
                    { text: '', correct: false }
                ]
            });

            // Recharger les données du quiz
            await fetchQuiz();

            alert('Question ajoutée avec succès !');

        } catch (error) {
            console.error('Erreur lors de l\'ajout de la question:', error);
            const customError = error as CustomAxiosError;

            let errorMessage: string = 'Erreur lors de l\'ajout de la question';

            if (customError.response) {
                const status: number = customError.response.status;
                if (status === 401) {
                    errorMessage = 'Vous devez être connecté pour ajouter une question';
                } else if (status === 403) {
                    errorMessage = 'Vous n\'êtes pas autorisé à modifier ce quiz';
                } else if (status === 400) {
                    errorMessage = customError.response.data?.message || 'Données invalides';
                } else {
                    errorMessage = customError.response.data?.message || errorMessage;
                }
            } else if (customError.request) {
                errorMessage = 'Problème de connexion au serveur';
            }

            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour retourner au dashboard
    const handleBackToDashboard = (): void => {
        navigate('/admin');
    };

    // Affichage de chargement
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Chargement du quiz...</span>
                </div>
            </div>
        );
    }

    // Affichage d'erreur
    if (error || !quiz) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6">
                <div className="text-center py-8">
                    <p className="text-red-400 mb-4">{error || 'Quiz non trouvé'}</p>
                    <Button onClick={handleBackToDashboard} className="bg-blue-600 hover:bg-blue-700">
                        Retour au dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
                {/* Bouton retour et titre */}
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleBackToDashboard}
                        variant="outline"
                        className="border-gray-600 text-white hover:bg-gray-800"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour au dashboard
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                            Gérer les Questions
                        </h1>
                        <p className="text-gray-300 text-lg">
                            Quiz "{quiz.title}" - Code: {quiz.uniqueCode}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Section principale - Liste des questions */}
                <div className="lg:col-span-2">
                    <Card className="bg-gray-100 text-gray-900">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">
                                Questions du quiz "{quiz.title}"
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(!quiz.questions || quiz.questions.length === 0) ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="text-blue-800 font-semibold mb-2">Aucune question</h4>
                                    <p className="text-blue-700">
                                        Ce quiz n'a pas encore de questions. Ajoutez-en une ci-dessous !
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {Array.isArray(quiz.questions) ? quiz.questions
                                        .sort((a: Question, b: Question) => (a.orderNumber || 0) - (b.orderNumber || 0))
                                        .map((question: Question, index: number) => (
                                            <div key={`question-${question.id || index}-${index}`} className="border border-gray-200 rounded-lg p-4 bg-white">
                                                <h5 className="font-semibold text-gray-900 mb-3">
                                                    Question {index + 1}: {question.text || 'Question sans texte'}
                                                </h5>
                                                <div className="ml-4 space-y-3">
                                                    {question.answers && Array.isArray(question.answers) && question.answers
                                                        .sort((a: Answer, b: Answer) => (a.orderNumber || 0) - (b.orderNumber || 0))
                                                        .map((answer: Answer, answerIndex: number) => (
                                                            <div
                                                                key={`answer-${answer.id || answerIndex}-${index}-${answerIndex}`}
                                                                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${answer.correct
                                                                    ? 'bg-green-50 border-green-300'
                                                                    : 'bg-red-50 border-red-300'
                                                                    }`}
                                                            >
                                                                {/* Icône de statut */}
                                                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${answer.correct
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-red-500 text-white'
                                                                    }`}>
                                                                    {answer.correct ? (
                                                                        <CheckCircle className="w-4 h-4" />
                                                                    ) : (
                                                                        <XCircle className="w-4 h-4" />
                                                                    )}
                                                                </div>

                                                                {/* Numéro et texte de la réponse */}
                                                                <div className="flex-1">
                                                                    <span className={`font-semibold ${answer.correct ? 'text-green-800' : 'text-red-800'
                                                                        }`}>
                                                                        {answerIndex + 1}. {answer.text || 'Réponse sans texte'}
                                                                    </span>
                                                                </div>

                                                                {/* Badge de statut */}
                                                                <Badge className={`${answer.correct
                                                                    ? 'bg-green-100 text-green-800 border-green-300'
                                                                    : 'bg-red-100 text-red-800 border-red-300'
                                                                    }`}>
                                                                    {answer.correct ? (
                                                                        <>
                                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                                            Correct
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <XCircle className="w-3 h-3 mr-1" />
                                                                            Incorrect
                                                                        </>
                                                                    )}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )) : (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <h4 className="text-yellow-800 font-semibold mb-2">Erreur d'affichage</h4>
                                            <p className="text-yellow-700">
                                                Les questions ne sont pas dans le bon format. Vérifiez la console pour plus de détails.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Section latérale - Ajouter une question */}
                <div className="space-y-6">
                    <Card className="bg-gray-100 text-gray-900">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Ajouter une question</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitQuestion}>
                                {/* Texte de la question */}
                                <div className="mb-4">
                                    <Label htmlFor="question-text" className="text-sm font-medium">
                                        Question <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="question-text"
                                        value={newQuestion.text}
                                        onChange={handleQuestionTextChange}
                                        placeholder="Entrez votre question ici..."
                                        rows={3}
                                        required
                                        className="mt-1"
                                    />
                                </div>

                                {/* Réponses */}
                                <div className="mb-4">
                                    <Label className="text-sm font-medium">Réponses <span className="text-red-500">*</span></Label>
                                    <div className="space-y-3 mt-2">
                                        {newQuestion.answers.map((answer: NewAnswer, index: number) => (
                                            <div
                                                key={`answer-${index}`}
                                                className={`p-3 rounded-lg border-2 ${answer.correct
                                                    ? 'bg-green-50 border-green-300'
                                                    : 'bg-gray-50 border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Icône de statut */}
                                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${answer.correct
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-gray-400 text-white'
                                                        }`}>
                                                        {answer.correct ? (
                                                            <CheckCircle className="w-4 h-4" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4" />
                                                        )}
                                                    </div>

                                                    {/* Input de réponse */}
                                                    <Input
                                                        value={answer.text}
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleAnswerTextChange(index, e)}
                                                        placeholder={`Réponse ${index + 1}`}
                                                        required
                                                        className="flex-1"
                                                    />

                                                    {/* Checkbox pour marquer comme correcte */}
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={answer.correct}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleAnswerCorrectChange(index, e)}
                                                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Correct
                                                        </span>
                                                    </div>

                                                    {/* Bouton supprimer */}
                                                    {newQuestion.answers.length > 2 && (
                                                        <Button
                                                            type="button"
                                                            onClick={() => handleRemoveAnswer(index)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 border-red-600 hover:bg-red-50"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleAddAnswer}
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Ajouter une réponse
                                    </Button>
                                </div>

                                {/* Bouton de soumission */}
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Ajout...
                                        </>
                                    ) : (
                                        'Ajouter la question'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default ManageQuestionsPage;