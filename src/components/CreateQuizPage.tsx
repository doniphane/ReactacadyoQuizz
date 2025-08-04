import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { AxiosError } from 'axios';

// Import des composants UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import des icônes
import { ArrowLeft, Copy, CheckCircle } from 'lucide-react';

import AuthService from '../services/AuthService';
import toast from 'react-hot-toast';



// Type pour le formulaire de quiz
interface QuizForm {
    title: string;
    description: string;
}

// URL de l'API
const API_BASE_URL = 'http://localhost:8000';



function CreateQuizPage() {
    const navigate = useNavigate();

    // États simples
    const [quizData, setQuizData] = useState<QuizForm>({
        title: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Fonction pour obtenir le token
    const getToken = () => {
        const token = AuthService.getToken();
        if (!token) {
            toast.error('Vous devez être connecté');
            navigate('/login');
            return null;
        }
        return token;
    };

    // Fonction pour afficher un message
    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage(text);
        setMessageType(type);
        
        // Effacer le message après 5 secondes
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    // Fonction pour copier le code d'accès
    const copyAccessCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            toast.success('Code copié !');
        } catch (err) {
            console.error('Erreur copie:', err);
            toast.error('Erreur lors de la copie');
        }
    };

    // Fonction pour créer le quiz
    const handleCreateQuiz = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation 
        if (!quizData.title.trim()) {
            showMessage('error', 'Le titre est obligatoire');
            return;
        }

        if (quizData.title.length < 3) {
            showMessage('error', 'Le titre doit avoir au moins 3 caractères');
            return;
        }

        if (quizData.title.length > 100) {
            showMessage('error', 'Le titre ne peut pas dépasser 100 caractères');
            return;
        }

        if (quizData.description.length > 500) {
            showMessage('error', 'La description ne peut pas dépasser 500 caractères');
            return;
        }

        setLoading(true);

        try {
            const token = getToken();
            if (!token) return;

            // Données à envoyer
            const dataToSend = {
                title: quizData.title.trim(),
                description: quizData.description.trim(),
                isActive: true,
                isStarted: false,
                passingScore: 70
            };

            // Créer le quiz
            const response = await axios.post(
                `${API_BASE_URL}/api/quizzes`,
                dataToSend,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const createdQuiz = response.data;

            // Afficher le succès
            showMessage('success', 'Quiz créé avec succès !');

            // Si on a un code d'accès, l'afficher
            if (createdQuiz.uniqueCode) {
                setTimeout(() => {
                    showMessage('success', `Code d'accès : ${createdQuiz.uniqueCode}`);
                }, 1000);
            }

            // Rediriger après 2 secondes
            setTimeout(() => {
                navigate('/admin');
            }, 2000);

        } catch (error) {
            console.error('Erreur:', error);
            
            // Gestion simple des erreurs
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 401) {
                showMessage('error', 'Vous devez être connecté');
            } else if (axiosError.response?.status === 403) {
                showMessage('error', 'Vous n\'avez pas les permissions');
            } else {
                showMessage('error', 'Erreur lors de la création du quiz');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => navigate('/admin')}
                        variant="outline"
                        className="border-gray-600 text-black hover:bg-gray-800 hover:text-white"
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

            {/* Messages */}
            {message && (
                <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-lg ${
                    messageType === 'success'
                        ? 'bg-green-100 border border-green-400 text-green-700'
                        : 'bg-red-100 border border-red-400 text-red-700'
                }`}>
                    <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span>{message}</span>
                        {messageType === 'success' && message.includes('Code d\'accès') && (
                            <Button
                                onClick={() => {
                                    const code = message.split('Code d\'accès : ')[1];
                                    if (code) copyAccessCode(code);
                                }}
                                className="ml-2 p-1 hover:bg-green-200 rounded"
                                size="sm"
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Formulaire */}
            <div className="max-w-2xl mx-auto">
                <Card className="bg-gray-100 text-gray-900">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Créer un nouveau quiz</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateQuiz}>
                            {/* Titre */}
                            <div className="mb-4">
                                <Label htmlFor="title" className="text-sm font-medium">
                                    Titre du quiz <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    type="text"
                                    value={quizData.title}
                                    onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                                    placeholder="Ex: Quiz de culture générale"
                                    required
                                    maxLength={100}
                                    className="mt-1"
                                />
                                <div className="text-sm text-gray-600 mt-1">
                                    100 caractères maximum
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <Label htmlFor="description" className="text-sm font-medium">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={quizData.description}
                                    onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                                    placeholder="Description optionnelle du quiz"
                                    rows={3}
                                    maxLength={500}
                                    className="mt-1"
                                />
                                <div className="text-sm text-gray-600 mt-1">
                                    500 caractères maximum (optionnel)
                                </div>
                            </div>

                        

                            {/* Boutons */}
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    onClick={() => navigate('/admin')}
                                    variant="outline"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
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