

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { AxiosResponse } from 'axios';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


import {
    Plus,
    LogOut,
    Eye,
    FileText,
    Users,
    UserCheck,
    User,
    Loader2,
    Edit,
    Play,
    Pause,
    RefreshCw,
    Trash2
} from 'lucide-react';


import AuthService from '../services/AuthService';
import toast from 'react-hot-toast';



// Interface pour un quiz
interface Quiz {
    id: number;
    title: string;
    createdAt?: string;
    uniqueCode?: string;
    isActive: boolean;
    isStarted: boolean;
    accessCode?: string;
}

// Interface pour les métriques du dashboard
interface Metrics {
    quizzesCreated: number;
    totalAttempts: number;
    registeredUsers: number;
}

// Type pour les statistiques des quiz (nombre de tentatives par quiz)
type QuizStats = Record<string, number>;

// Interface pour une tentative de quiz
interface QuizAttempt {
    id: number;
    quiz: string; 
    user?: string;
    score?: number;
    completedAt?: string;
}

// Interface pour les headers d'authentification
interface AuthHeaders {
    'Content-Type': string;
    'Authorization': string;
}

// Types pour les réponses API (format JSON-LD d'API Platform)
interface ApiResponse<T> {
    member?: T[];
    'hydra:member'?: T[];
}

// Type pour les réponses API qui peuvent être un array direct ou un objet JSON-LD
type ApiResponseFormat<T> = T[] | ApiResponse<T>;


interface SecureApiCallOptions {
    method?: string;
    data?: unknown;
    headers?: Record<string, string>;
}


type QuizId = number | null;


// URL de base de l'API Symfony
const API_BASE_URL: string = 'http://localhost:8000';

function AdminPage() {
    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // États pour les données
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [quizStats, setQuizStats] = useState<QuizStats>({}); // Pour stocker les stats par quiz
    const [metrics, setMetrics] = useState<Metrics>({
        quizzesCreated: 0,
        totalAttempts: 0,
        registeredUsers: 0
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingQuizId, setUpdatingQuizId] = useState<QuizId>(null);
    const [deletingQuizId, setDeletingQuizId] = useState<QuizId>(null);

    // Fonction pour obtenir les headers d'authentification
    const getAuthHeaders = (): AuthHeaders | null => {
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

 
    const makeSecureApiCall = async <T = unknown>(url: string, options: SecureApiCallOptions = {}): Promise<AxiosResponse<T>> => {
        const headers: AuthHeaders | null = getAuthHeaders();
        if (!headers) {
            throw new Error('Vous devez être connecté pour effectuer cette action');
        }

        const response: AxiosResponse<T> = await axios({
            url,
            ...options,
            headers: { ...headers, ...options.headers }
        });

        return response;
    };


    const fetchQuizStats = async (): Promise<void> => {
        try {
            const attemptsResponse: AxiosResponse<ApiResponseFormat<QuizAttempt>> = await makeSecureApiCall<ApiResponseFormat<QuizAttempt>>(`${API_BASE_URL}/api/quiz_attempts`);
            console.log('Tentatives récupérées:', attemptsResponse.data);

            const statsByQuiz: QuizStats = {};
            let attemptsArray: QuizAttempt[] = [];

            // Gérer le format de réponse JSON-LD
            if (Array.isArray(attemptsResponse.data)) {
                attemptsArray = attemptsResponse.data;
            } else if (attemptsResponse.data && Array.isArray((attemptsResponse.data as ApiResponse<QuizAttempt>).member)) {
                attemptsArray = (attemptsResponse.data as ApiResponse<QuizAttempt>).member!;
            } else if (attemptsResponse.data && Array.isArray((attemptsResponse.data as ApiResponse<QuizAttempt>)['hydra:member'])) {
                attemptsArray = (attemptsResponse.data as ApiResponse<QuizAttempt>)['hydra:member']!;
            }

            // Compter les tentatives par quiz
            attemptsArray.forEach((attempt: QuizAttempt) => {
                if (attempt.quiz) {
                    const quizId: string = attempt.quiz.split('/').pop()!; // Extraire l'ID du quiz
                    statsByQuiz[quizId] = (statsByQuiz[quizId] || 0) + 1;
                }
            });

            setQuizStats(statsByQuiz);
        } catch (error) {
            console.error('Erreur lors de la récupération des tentatives:', error);
        
            setQuizStats({});
        }
    };

    // Récupérer les quiz depuis l'API
    const fetchQuizzes = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            const response: AxiosResponse<ApiResponseFormat<Quiz>> = await makeSecureApiCall<ApiResponseFormat<Quiz>>(`${API_BASE_URL}/api/admin/quizzes`);

           
            let quizzesArray: Quiz[] = [];
            console.log('Réponse API complète:', response.data);

            if (Array.isArray(response.data)) {
                quizzesArray = response.data;
                console.log('Format: Array direct');
            } else if (response.data && Array.isArray((response.data as ApiResponse<Quiz>).member)) {
                // Format JSON-LD d'API Platform
                quizzesArray = (response.data as ApiResponse<Quiz>).member!;
                console.log('Format: JSON-LD avec member');
            } else if (response.data && Array.isArray((response.data as ApiResponse<Quiz>)['hydra:member'])) {
                // Ancien format Hydra
                quizzesArray = (response.data as ApiResponse<Quiz>)['hydra:member']!;
                console.log('Format: Hydra avec hydra:member');
            } else {
                console.error('Format de réponse inattendu:', response.data);
                console.log('Clés disponibles:', Object.keys(response.data || {}));
                quizzesArray = [];
            }

            console.log('Quiz récupérés:', quizzesArray);
            setQuizzes(quizzesArray);

            // Récupérer les statistiques après avoir récupéré les quiz
            await fetchQuizStats();

            // Mettre à jour les métriques
            setMetrics({
                quizzesCreated: quizzesArray.length,
                totalAttempts: quizzesArray.length * 2, // Pas encore récupérer dans metrique 
                registeredUsers: 15 // Pas encore récupérer
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des quiz:', error);
            setError('Erreur lors du chargement des quiz');
        } finally {
            setIsLoading(false);
        }
    };

    // Mettre à jour le statut d'un quiz
    const updateQuizStatus = async (quizId: number, isActive: boolean): Promise<void> => {
        if (!quizId || quizId <= 0) {
            toast.error('ID de quiz invalide');
            return;
        }

        try {
            setUpdatingQuizId(quizId);

            await makeSecureApiCall(`${API_BASE_URL}/api/quizzes/${quizId}`, {
                method: 'PUT',
                data: { isActive }
            });

            // Mettre à jour la liste locale
            setQuizzes((prevQuizzes: Quiz[]) =>
                prevQuizzes.map((quiz: Quiz) =>
                    quiz.id === quizId
                        ? { ...quiz, isActive }
                        : quiz
                )
            );

  
            toast.success(
                isActive
                    ? 'Quiz activé ! Les étudiants peuvent y accéder'
                    : 'Quiz désactivé'
            );

        } catch (error: unknown) {
            console.error('Erreur lors de la mise à jour du statut:', error);

            // Gérer les différents types d'erreurs
            const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
            if (axiosError.response?.status === 400) {
                if (axiosError.response.data?.message?.includes('own quizzes')) {
                    toast.error('Vous ne pouvez modifier les ressources qui ne vous appartiennent pas');
                } else if (axiosError.response.data?.message?.includes('Admin role required')) {
                    toast.error('Accès refusé - Rôle administrateur requis');
                } else {
                    toast.error('Erreur lors de la mise à jour du statut du quiz');
                }
            } else {
                toast.error('Erreur lors de la mise à jour du statut du quiz');
            }
        } finally {
            setUpdatingQuizId(null);
        }
    };

    // Confirmer et supprimer un quiz
    const confirmDeleteQuiz = (quizId: number, quizTitle: string): void => {
        if (!quizId || quizId <= 0) {
            toast.error('ID de quiz invalide');
            return;
        }

        const isConfirmed: boolean = window.confirm(
            `Êtes-vous sûr de vouloir supprimer le quiz "${quizTitle}" ?\n\nCette action est irréversible.`
        );

        if (isConfirmed) {
            deleteQuiz(quizId);
        }
    };

    // Supprimer un quiz
    const deleteQuiz = async (quizId: number): Promise<void> => {
        try {
            setDeletingQuizId(quizId);

            await makeSecureApiCall(`${API_BASE_URL}/api/quizzes/${quizId}`, {
                method: 'DELETE'
            });

            // Mettre à jour la liste locale
            setQuizzes((prevQuizzes: Quiz[]) =>
                prevQuizzes.filter((quiz: Quiz) => quiz.id !== quizId)
            );

            toast.success('Quiz supprimé avec succès');

        } catch (error: unknown) {
            console.error('Erreur lors de la suppression du quiz:', error);

            // Gérer les différents types d'erreurs
            const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
            if (axiosError.response?.status === 400) {
                if (axiosError.response.data?.message?.includes('own quizzes')) {
                    toast.error('Vous ne pouvez supprimer les ressources qui ne vous appartiennent pas');
                } else if (axiosError.response.data?.message?.includes('Admin role required')) {
                    toast.error('Accès refusé - Rôle administrateur requis');
                } else {
                    toast.error('Erreur lors de la suppression du quiz');
                }
            } else {
                toast.error('Erreur lors de la suppression du quiz');
            }
        } finally {
            setDeletingQuizId(null);
        }
    };

    // Charger les quiz au démarrage
    useEffect(() => {
        fetchQuizzes();
    }, []);

    // Fonctions de navigation
    const handleCreateQuiz = (): void => {
        navigate('/create-quiz');
    };

    const handleLogout = async (): Promise<void> => {
        try {
            await AuthService.logout();
            navigate('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            navigate('/login');
        }
    };

    const handleViewResults = (quizId: number, quizTitle: string, quizCode?: string): void => {
        if (!quizId || quizId <= 0) {
            console.error('ID de quiz invalide');
            return;
        }
        // Navigation vers les résultats détaillés
        navigate('/quiz-results-detail', {
            state: {
                quizId: quizId,
                quizTitle: quizTitle,
                quizCode: quizCode
            }
        });
    };

   

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                        Dashboard Admin
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Gérez vos quiz et analysez les performances
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={() => navigate('/create-quiz')}
                        className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3 "
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Créer un quiz
                    </Button>
                    <Button
                        onClick={() => navigate('/student')}
                        className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3"
                    >
                        <User className="w-4 h-4 mr-2" />
                        Espace Élève
                    </Button>
                    <Button
                        onClick={handleLogout}
                        className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 px-6 py-3"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                    </Button>
                </div>
            </div>

            {/* Métriques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-yellow-400 text-gray-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Quiz Créés</p>
                                <p className="text-2xl font-bold">{metrics.quizzesCreated}</p>
                            </div>
                            <FileText className="w-8 h-8" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-yellow-400 text-gray-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">NB : Tentative</p>
                                <p className="text-2xl font-bold">{metrics.totalAttempts}</p>
                            </div>
                            <UserCheck className="w-8 h-8" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-yellow-400 text-gray-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Nombre Inscrits</p>
                                <p className="text-2xl font-bold">{metrics.registeredUsers}</p>
                            </div>
                            <Users className="w-8 h-8" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Liste des quiz */}
            <Card className="bg-gray-100 text-gray-900">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Liste des Quiz</CardTitle>
                    <p className="text-gray-600">Gérez vos quiz</p>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            <span>Chargement des quiz...</span>
                        </div>
                    ) : error ? (
                        <div className="text-red-600 text-center py-8">
                            {error}
                            <Button
                                onClick={fetchQuizzes}
                                className="ml-4 bg-red-600 hover:bg-red-700 text-white"
                            >
                                Réessayer
                            </Button>
                        </div>
                    ) : quizzes.length === 0 ? (
                        <div className="text-center py-8 text-gray-600">
                            Aucun quiz créé pour le moment.
                            <Button
                                onClick={handleCreateQuiz}
                                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Créer votre premier quiz
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {quizzes.map((quiz: Quiz) => (
                                <div
                                    key={quiz.id}
                                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                                >
                                    {/* Informations du quiz */}
                                    <div className="flex items-center space-x-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {quiz.createdAt
                                                    ? `Créé le ${new Date(quiz.createdAt).toLocaleDateString()}`
                                                    : 'Date de création inconnue'
                                                }
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-medium">
                                            {quiz.uniqueCode || 'MATH01'}
                                        </span>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded text-xs ${quiz.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {quiz.isActive ? 'Actif' : 'Inactif'}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs ${quiz.isStarted ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {quiz.isStarted ? 'Démarré' : `${quizStats[quiz.id] || 0} Fois Réaliser`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => updateQuizStatus(quiz.id, !quiz.isActive)}
                                            disabled={updatingQuizId === quiz.id}
                                            className={`${quiz.isActive
                                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                                } min-w-[100px]`}
                                        >
                                            {updatingQuizId === quiz.id ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : quiz.isActive ? (
                                                <Pause className="w-4 h-4 mr-2" />
                                            ) : (
                                                <Play className="w-4 h-4 mr-2" />
                                            )}
                                            {updatingQuizId === quiz.id ? 'Mise à jour...' : quiz.isActive ? 'Désactiver' : 'Activer'}
                                        </Button>

                                        <Button
                                            onClick={() => navigate(`/manage-questions/${quiz.id}`)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Modifier
                                        </Button>
                                        <Button
                                            onClick={() => handleViewResults(quiz.id, quiz.title, quiz.accessCode)}
                                            className="bg-gray-800 hover:bg-gray-700 text-white"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Résultat
                                        </Button>
                                        <Button
                                            onClick={() => confirmDeleteQuiz(quiz.id, quiz.title)}
                                            disabled={deletingQuizId === quiz.id}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            {deletingQuizId === quiz.id ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 mr-2" />
                                            )}
                                            {deletingQuizId === quiz.id ? 'Suppression...' : 'Supprimer'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default AdminPage;