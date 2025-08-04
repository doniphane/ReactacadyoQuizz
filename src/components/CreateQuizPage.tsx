

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


import { ArrowLeft, Copy, CheckCircle } from 'lucide-react';


import AuthService from '../services/AuthService';


// Interface pour les données du formulaire de création de quiz
interface QuizFormData {
    title: string;
    description: string;
}

// Interface pour les données du quiz à envoyer à l'API
interface QuizToSend {
    title: string;
    description: string;
    isActive: boolean;
    isStarted: boolean;
    passingScore: number;
}

// Interface pour la réponse du quiz créé
interface CreatedQuiz {
    id: number;
    title: string;
    description: string;
    uniqueCode?: string;
    isActive: boolean;
    isStarted: boolean;
    passingScore: number;
    createdAt?: string;
}

// Interface pour les messages d'alerte
interface Message {
    type: 'success' | 'error' | '';
    text: string;
}

// Type pour les types de messages
type MessageType = 'success' | 'error';

// Interface pour les erreurs de validation
interface ValidationError {
    field: string;
    message: string;
}

// Type pour les champs du formulaire
type FormField = keyof QuizFormData;

// Interface pour les réponses d'erreur de l'API
interface ApiErrorResponse {
    message?: string;
    errors?: ValidationError[];
}

// Type pour les erreurs Axios avec notre interface personnalisée
interface CustomAxiosError extends AxiosError {
    response?: AxiosResponse<ApiErrorResponse>;
}



// URL de base de l'API Symfony
const API_BASE_URL: string = 'http://localhost:8000';

function CreateQuizPage() {
    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // État pour stocker les données du formulaire de quiz
    const [quizData, setQuizData] = useState<QuizFormData>({
        title: '',
        description: ''
    });

    // État pour indiquer si on crée le quiz
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // État pour les messages de succès/erreur
    const [message, setMessage] = useState<Message>({ type: '', text: '' });

    // === FONCTIONS DE VALIDATION ===

    // Fonction pour nettoyer et sécuriser les entrées
    const sanitizeInput = (input: string): string => {
        return input.trim().replace(/[<>]/g, '');
    };

    // Fonction pour valider le titre
    const validateTitle = (title: string): string | null => {
        const cleanTitle: string = sanitizeInput(title);
        if (!cleanTitle) {
            return "Le titre du quiz est obligatoire";
        }
        if (cleanTitle.length < 3) {
            return "Le titre doit contenir au moins 3 caractères";
        }
        if (cleanTitle.length > 100) {
            return "Le titre ne peut pas dépasser 100 caractères";
        }
        // Vérifier contre les tentatives d'injection
        if (cleanTitle.includes('--') || cleanTitle.includes(';') || cleanTitle.includes('/*')) {
            return "Caractères non autorisés détectés dans le titre";
        }
        return null;
    };

    // Fonction pour valider la description
    const validateDescription = (description: string): string | null => {
        if (description.length > 500) {
            return "La description ne peut pas dépasser 500 caractères";
        }
        // Vérifier contre les tentatives d'injection
        if (description.includes('--') || description.includes(';') || description.includes('/*')) {
            return "Caractères non autorisés détectés dans la description";
        }
        return null;
    };

    // Fonction pour afficher un message
    const showMessage = (type: MessageType, text: string): void => {
        setMessage({ type, text });
        // Effacer le message après 5 secondes
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // Fonction pour afficher un message de succès
    const showSuccessMessage = (text: string): void => {
        showMessage('success', text);
    };

    // Fonction pour afficher un message d'erreur
    const showErrorMessage = (text: string): void => {
        showMessage('error', text);
    };

    // Fonction pour copier le code d'accès
    const copyAccessCode = async (code: string): Promise<void> => {
        try {
            await navigator.clipboard.writeText(code);
            showSuccessMessage('Code copié dans le presse-papiers !');
        } catch (err) {
            console.error('Erreur copie:', err);
            showErrorMessage('Erreur lors de la copie');
        }
    };

    // === FONCTIONS PRINCIPALES ===

    // Fonction pour mettre à jour les champs du formulaire
    const handleInputChange = (field: FormField, value: string): void => {
        setQuizData((prevData: QuizFormData) => ({
            ...prevData,
            [field]: value
        }));
    };

    // Fonction pour gérer les erreurs de l'API
    const handleApiError = (error: CustomAxiosError): void => {
        console.error('Erreur lors de la création du quiz:', error);
        let errorMessage: string = 'Erreur lors de la création du quiz';

        if (error.response) {
            const status: number = error.response.status;
            if (status === 401) {
                errorMessage = 'Vous devez être connecté pour créer un quiz';
            } else if (status === 400) {
                errorMessage = 'Données invalides pour la création du quiz';
            } else if (status === 403) {
                errorMessage = 'Vous n\'avez pas les permissions pour créer un quiz';
            } else if (error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            }
        } else if (error.request) {
            errorMessage = 'Problème de connexion au serveur. Veuillez réessayer.';
        } else {
            errorMessage = error.message || 'Erreur inconnue';
        }

        showErrorMessage(errorMessage);
    };

    // Fonction pour créer le quiz
    const handleCreateQuiz = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        // === VALIDATIONS CÔTÉ FRONTEND ===
        // Valider le titre
        const titleError: string | null = validateTitle(quizData.title);
        if (titleError) {
            showErrorMessage(titleError);
            return;
        }

        // Valider la description
        const descriptionError: string | null = validateDescription(quizData.description);
        if (descriptionError) {
            showErrorMessage(descriptionError);
            return;
        }

        setIsLoading(true);

        try {
            // Préparer les données du quiz
            const quizToSend: QuizToSend = {
                title: sanitizeInput(quizData.title),
                description: sanitizeInput(quizData.description) || '',
                isActive: true,
                isStarted: false,
                passingScore: 70
            };

            // Récupérer le token d'authentification
            const token: string | null = AuthService.getToken();
            if (!token) {
                showErrorMessage('Vous devez être connecté pour créer un quiz');
                return;
            }

            // Créer le quiz via l'API
            const response = await axios.post<CreatedQuiz>(
                `${API_BASE_URL}/api/quizzes`, 
                quizToSend, 
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const createdQuiz: CreatedQuiz = response.data;

            // Afficher les messages de succès
            showSuccessMessage('Quiz créé avec succès !');

            // Afficher le code d'accès
            if (createdQuiz.uniqueCode) {
                showSuccessMessage(`Quiz créé ! Code d'accès : ${createdQuiz.uniqueCode}`);
                // Afficher un toast personnalisé pour le code
                setTimeout(() => {
                    showSuccessMessage(`Code d'accès : ${createdQuiz.uniqueCode} - Cliquez pour copier`);
                }, 1000);
            }

            // Rediriger vers le dashboard après un délai
            setTimeout(() => {
                navigate('/admin');
            }, 2000);

        } catch (error) {
            handleApiError(error as CustomAxiosError);
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour retourner au dashboard
    const handleBackToDashboard = (): void => {
        navigate('/admin');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleBackToDashboard}
                        variant="outline"
                        className="border-gray-600 text-white hover:bg-gray-800"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour à l'accueil
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                            Créer un nouveau quiz
                        </h1>
                        <p className="text-gray-300 text-lg">
                            Créez votre quiz en quelques étapes simples
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages de succès/erreur */}
            {message.text && (
                <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-100 border border-green-400 text-green-700'
                        : 'bg-red-100 border border-red-400 text-red-700'
                    }`}>
                    <div className="flex items-center">
                        {message.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 mr-2" />
                        ) : (
                            <Copy className="w-5 h-5 mr-2" />
                        )}
                        <span>{message.text}</span>
                        {message.type === 'success' && message.text.includes('Code d\'accès') && (
                            <Button
                                onClick={() => copyAccessCode(message.text.split('Code d\'accès : ')[1].split(' -')[0])}
                                className="ml-2 p-1 hover:bg-green-200 rounded"
                                size="sm"
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Section principale */}
            <div className="max-w-2xl mx-auto">
                <Card className="bg-gray-100 text-gray-900">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Créer un nouveau quiz</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateQuiz}>
                            {/* Titre du quiz */}
                            <div className="mb-4">
                                <Label htmlFor="title" className="text-sm font-medium">
                                    Titre du quiz <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={quizData.title}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
                                    placeholder="Ex: Quiz de culture générale"
                                    required
                                    maxLength={100}
                                    className="mt-1"
                                />
                                <div className="text-sm text-gray-600 mt-1">
                                    100 caractères autorisés
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <Label htmlFor="description" className="text-sm font-medium">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={quizData.description}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                                    placeholder="Description optionnelle du quiz"
                                    rows={3}
                                    maxLength={500}
                                    className="mt-1"
                                />
                                <div className="text-sm text-gray-600 mt-1">
                                    Maximum 500 caractères. Description optionnelle du quiz
                                </div>
                            </div>

                            {/* Informations sur le quiz */}
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-semibold text-blue-800 mb-2">Informations sur le quiz</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Le quiz sera créé avec un code d'accès unique</li>
                                    <li>• Le quiz sera automatiquement activé</li>
                                    <li>• Le score de passage sera fixé à 70%</li>
                                    <li>• Vous pourrez ajouter des questions après la création</li>
                                </ul>
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    onClick={handleBackToDashboard}
                                    variant="outline"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    disabled={isLoading}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Création...
                                        </>
                                    ) : (
                                        'Créer le quiz'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default CreateQuizPage;