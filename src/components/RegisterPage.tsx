

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';

// Import des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';



// Interface pour les données utilisateur nettoyées
interface CleanUserData {
    email: string;
    password: string;
}

// Interface pour une violation de validation Symfony
interface ValidationViolation {
    propertyPath: string;
    message: string;
    code?: string;
}

// Interface pour les réponses d'erreur de l'API avec violations
interface ApiErrorResponseWithViolations {
    message?: string;
    violations?: ValidationViolation[];
    error?: string;
}

// Interface pour les réponses d'erreur de l'API standard
interface StandardApiErrorResponse {
    message?: string;
    error?: string;
}

// Union type pour toutes les réponses d'erreur possibles
type ApiErrorResponse = ApiErrorResponseWithViolations | StandardApiErrorResponse;

// Interface pour les erreurs Axios personnalisées
interface CustomAxiosError extends AxiosError {
    response?: AxiosResponse<ApiErrorResponse>;
    request?: unknown;
}

// Interface pour la réponse d'inscription réussie
interface RegistrationSuccessResponse {
    message: string;
    user?: {
        id: number;
        email: string;
    };
}

// Type pour les fonctions de validation qui retournent soit null soit un message d'erreur
type ValidationResult = string | null;

// Type pour les états de chargement
type LoadingState = boolean;

// Type pour les messages d'état
type MessageState = string;

// Type pour les gestionnaires d'événements
type EventHandler = () => void;
type FormSubmitHandler = (event: FormEvent<HTMLFormElement>) => Promise<void>;
type InputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => void;

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

// URL de base de l'API Symfony
const API_BASE_URL: string = 'http://localhost:8000';

function RegisterPage() {
    // État pour stocker les valeurs du formulaire
    const [email, setEmail] = useState<MessageState>('');
    const [password, setPassword] = useState<MessageState>('');

    // État pour gérer l'affichage des erreurs
    const [errorMessage, setErrorMessage] = useState<MessageState>('');

    // État pour gérer l'affichage du succès
    const [successMessage, setSuccessMessage] = useState<MessageState>('');

    // État pour gérer l'affichage du chargement
    const [isLoading, setIsLoading] = useState<LoadingState>(false);

    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // === FONCTIONS DE VALIDATION ===

    // Fonction pour valider le format email
    const isValidEmail = (email: string): boolean => {
        const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Fonction pour nettoyer et sécuriser les entrées
    const sanitizeInput = (input: string): string => {
        return input.trim().replace(/[<>]/g, '');
    };

    // Fonction pour valider le mot de passe
    const validatePassword = (password: string): ValidationResult => {
        if (password.length < 6) {
            return "Le mot de passe doit contenir au moins 6 caractères";
        }

        if (password.length > 100) {
            return "Le mot de passe est trop long (maximum 100 caractères)";
        }

        // Vérifier qu'il contient au moins une lettre et un chiffre
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
            return "Le mot de passe doit contenir au moins une lettre et un chiffre";
        }

        return null;
    };

    // Fonction pour valider l'email
    const validateEmail = (email: string): ValidationResult => {
        const cleanEmail: string = sanitizeInput(email);

        if (!cleanEmail) {
            return "L'adresse email est obligatoire";
        }

        if (cleanEmail.length > 254) {
            return "L'adresse email est trop longue";
        }

        if (!isValidEmail(cleanEmail)) {
            return "Veuillez entrer une adresse email valide";
        }

        // Vérifier contre les tentatives d'injection
        if (cleanEmail.includes('--') || cleanEmail.includes(';') || cleanEmail.includes('/*')) {
            return "Caractères non autorisés détectés dans l'email";
        }

        return null;
    };

    // === FONCTIONS HELPER CENTRALISÉES ===

    // Réinitialiser tous les messages
    const resetAllMessages = (): void => {
        setErrorMessage('');
        setSuccessMessage('');
    };

    // Afficher un message d'erreur
    const showErrorMessage = (message: string): void => {
        setErrorMessage(message);
        setSuccessMessage('');
    };

    // Afficher un message de succès et rediriger
    const showSuccessMessage = (): void => {
        const message: string = `Compte créé avec succès ! Redirection...`;
        setSuccessMessage(message);
        setErrorMessage('');

        // Redirection vers la page de connexion après inscription réussie
        setTimeout(() => {
            navigate('/login');
        }, 2000);
    };

    // Gérer les erreurs de l'API
    const handleApiError = (error: CustomAxiosError): void => {
        console.error("Erreur lors de la création:", error);

        if (error.response) {
            // Gestion spécifique des erreurs API
            const status: number = error.response.status;
            const data: ApiErrorResponse = error.response.data;

            if (status === 409) {
                showErrorMessage("Cet email est déjà utilisé par un autre compte");
            } else if (status === 422) {
                // Gestion des erreurs de validation Symfony
                const dataWithViolations = data as ApiErrorResponseWithViolations;
                if (dataWithViolations && dataWithViolations.violations) {
                    const violations: ValidationViolation[] = dataWithViolations.violations;
                    const messages: string = violations.map((v: ValidationViolation) => v.message).join(', ');
                    showErrorMessage(messages);
                } else {
                    showErrorMessage("Les données du formulaire ne sont pas valides");
                }
            } else if (status === 400) {
                showErrorMessage("Données invalides. Vérifiez votre saisie.");
            } else {
                const standardData = data as StandardApiErrorResponse;
                showErrorMessage(standardData?.message || "Erreur lors de la création du compte");
            }
        } else if (error.request) {
            // Erreur réseau
            showErrorMessage("Problème de connexion au serveur. Veuillez réessayer.");
        } else {
            showErrorMessage("Une erreur est survenue. Veuillez réessayer plus tard.");
        }
    };

    // === FONCTION PRINCIPALE ===

    // Gérer la soumission du formulaire avec validation
    const handleSubmit: FormSubmitHandler = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        // Empêche le rechargement de la page
        event.preventDefault();

        resetAllMessages();

        // 1. Vérifier que les champs ne sont pas vides
        if (!email || !password) {
            showErrorMessage("Tous les champs sont obligatoires");
            return;
        }

        // 2. Valider l'email
        const emailError: ValidationResult = validateEmail(email);
        if (emailError) {
            showErrorMessage(emailError);
            return;
        }

        // 3. Valider le mot de passe
        const passwordError: ValidationResult = validatePassword(password);
        if (passwordError) {
            showErrorMessage(passwordError);
            return;
        }

        // 4. Nettoyer les données avant envoi
        const cleanUserData: CleanUserData = {
            email: sanitizeInput(email),
            password: password
        };

        setIsLoading(true);

        try {
            // Appel à l'API d'inscription
            const response: AxiosResponse<RegistrationSuccessResponse> = await axios.post<RegistrationSuccessResponse>(
                `${API_BASE_URL}/api/register`, 
                cleanUserData
            );

            if (response.status === 201 || response.status === 200) {
                showSuccessMessage();
            } else {
                showErrorMessage("Erreur lors de la création du compte");
            }
        } catch (error) {
            handleApiError(error as CustomAxiosError);
        } finally {
            setIsLoading(false);
        }
    };

    // Naviguer vers la page de connexion
    const goToLoginPage: EventHandler = (): void => {
        navigate('/login');
    };

    // Gestionnaires d'événements pour les champs de saisie
    const handleEmailChange: InputChangeHandler = (e: ChangeEvent<HTMLInputElement>): void => {
        setEmail(e.target.value);
    };

    const handlePasswordChange: InputChangeHandler = (e: ChangeEvent<HTMLInputElement>): void => {
        setPassword(e.target.value);
    };

    // Composant pour afficher les messages
    const MessageDisplay = () => {
        if (errorMessage) {
            return (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <p className="text-sm">{errorMessage}</p>
                </div>
            );
        }

        if (successMessage) {
            return (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    <p className="text-sm">{successMessage}</p>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: "#18191D" }}>
            {/* Section de gauche - Fond sombre avec logo */}
            <div className="hidden xl:flex w-1/2 items-center justify-end pr-16">
                <div className="text-center">
                    <h1 className="text-5xl font-bold mb-4">
                        <span className="text-white">Acadyo</span>
                        <span className="text-amber-500"> Quiz</span>
                    </h1>
                </div>
            </div>

            {/* Section de droite - Formulaire d'inscription */}
            <div className="w-full xl:w-1/2 flex items-center justify-center p-6 xl:justify-start xl:pl-16">
                <div className="w-full max-w-md">
                    {/* Affichage des messages */}
                    <MessageDisplay />

                    {/* Carte du formulaire */}
                    <Card className="bg-white rounded-lg border-2 border-amber-500 shadow-2xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold text-gray-900">
                                Inscription
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Crée votre compte pour accéder au Quizz de Acadyo
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Formulaire */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Champ email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="Entrez votre email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        disabled={isLoading}
                                        className="focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>

                                {/* Champ mot de passe */}
                                <div className="space-y-2">
                                    <Label htmlFor="password">Mot de passe</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        placeholder="Entrez votre mot de passe"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        disabled={isLoading}
                                        className="focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>

                                {/* Bouton d'inscription */}
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Création en cours...
                                        </>
                                    ) : (
                                        <>
                                            S'inscrire
                                            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                            </svg>
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Lien vers la page de connexion */}
                    <div className="mt-6 text-center">
                        <p className="text-white text-sm">
                            Déjà un compte ?{" "}
                            <Button
                                variant="link"
                                className="p-0 h-auto text-amber-500 hover:text-amber-400 font-medium underline"
                                onClick={goToLoginPage}
                                disabled={isLoading}
                            >
                                Se connecter
                            </Button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;