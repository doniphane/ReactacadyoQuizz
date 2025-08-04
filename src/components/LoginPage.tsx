

import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import AuthService from '../services/AuthService';

// Import des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


// Interface pour l'état de navigation (location.state)
interface LocationState {
    error?: string;
    from?: string;
}

// Interface personnalisée pour useLocation avec notre type de state
interface CustomLocation extends Omit<Location, 'state'> {
    state: LocationState | null;
}

// Interface pour le résultat du service d'authentification
interface AuthResult {
    success: boolean;
    message: string;
    user?: {
        username?: string;
        email?: string;
        roles: string[];
        exp?: number;
        iat?: number;
        sub?: string;
    };
}

// Interface pour les erreurs personnalisées
interface CustomError extends Error {
    message: string;
}

// Type pour les fonctions de validation qui retournent soit null soit un message d'erreur
type ValidationResult = string | null;

// Type pour les valeurs des champs de formulaire
type FormFieldValue = string | FormDataEntryValue | null;



function LoginPage() {
    // État pour stocker les valeurs du formulaire
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    // État pour gérer l'affichage des erreurs
    const [error, setError] = useState<string>('');

    // État pour gérer l'affichage du chargement
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // Hook pour récupérer les informations de l'URL
    const location = useLocation() as CustomLocation;

    // Effet pour afficher les messages d'erreur d'accès non autorisé
    useEffect(() => {
        // Vérifie s'il y a un message d'erreur dans l'état de navigation
        if (location.state && location.state.error) {
            setError(location.state.error);
        }
    }, [location.state]);

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

        return null;
    };

    // Fonction appelée quand l'utilisateur soumet le formulaire
    const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        // Empêche le rechargement de la page
        event.preventDefault();

        // Réinitialise les messages d'erreur
        setError('');

        try {
            const formData: FormData = new FormData(event.currentTarget);
            const rawUsername: FormFieldValue = formData.get('email');
            const rawPassword: FormFieldValue = formData.get('password');

            // === VALIDATIONS CÔTÉ FRONTEND ===

            // 1. Vérifier si les champs sont vides
            if (!rawUsername || !rawPassword) {
                setError("Tous les champs sont obligatoires");
                return;
            }

            // 2. Nettoyer les données d'entrée
            const username: string = sanitizeInput(rawUsername as string);
            const password: string = rawPassword as string;

            // 3. Vérifier que les champs ne sont pas vides après nettoyage
            if (!username || !password) {
                setError("Veuillez remplir tous les champs correctement");
                return;
            }

            // 4. Vérifier la longueur de l'email
            if (username.length > 254) {
                setError("L'adresse email est trop longue");
                return;
            }

            // 5. Vérifier le format email
            if (!isValidEmail(username)) {
                setError("Veuillez entrer une adresse email valide");
                return;
            }

            // 6. Valider le mot de passe
            const passwordError: ValidationResult = validatePassword(password);
            if (passwordError) {
                setError(passwordError);
                return;
            }

            // 7. Vérifier les caractères non autorisés
            if (username.includes('--') || username.includes(';') || username.includes('/*')) {
                setError("Caractères non autorisés détectés");
                return;
            }

            // Active l'état de chargement
            setIsLoading(true);

            // Appelle le service d'authentification
            const result: AuthResult = await AuthService.login(username, password);

            if (result.success) {
                // Connexion réussie, on redirige selon le rôle

                // Attendre un peu pour que le service soit mis à jour
                await new Promise<void>(resolve => setTimeout(resolve, 200));

                // Vérifier les rôles
                try {
                    const isUserAdmin: boolean = AuthService.isAdmin();
                    const isUserStudent: boolean = AuthService.isStudent();

                    if (isUserAdmin) {
                        navigate('/admin');
                    } else if (isUserStudent) {
                        navigate('/student');
                    } else {
                        navigate('/student');
                    }
                } catch {
                    // En cas d'erreur, rediriger vers la page étudiant par défaut
                    navigate('/student');
                }
            } else {
                // Connexion échouée, on affiche le message d'erreur
                setError(result.message);
            }
        } catch (error) {
            // Gestion des erreurs
            const customError = error as CustomError;
            if (customError.message && customError.message.includes('Network')) {
                setError("Problème de connexion au serveur. Veuillez réessayer.");
            } else {
                setError("Email ou mot de passe incorrect");
            }
        } finally {
            // Désactive l'état de chargement
            setIsLoading(false);
        }
    };

    // Fonction pour naviguer vers la page d'inscription
    const handleNavigateToRegister = (): void => {
        navigate('/register');
    };

    // Fonction pour gérer le changement du champ email
    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setEmail(e.target.value);
    };

    // Fonction pour gérer le changement du champ mot de passe
    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setPassword(e.target.value);
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: '#18191D' }}>
            {/* Section de gauche - Fond sombre avec logo */}
            <div className="hidden xl:flex w-1/2 items-center justify-end pr-16">
                <div className="text-center">
                    <h1 className="text-5xl font-bold mb-4">
                        <span className="text-white">Acadyo</span>
                        <span className="text-amber-500"> Quiz</span>
                    </h1>
                    <p className="text-white text-xl">Plateforme de quiz</p>
                </div>
            </div>

            {/* Section de droite - Formulaire de connexion */}
            <div className="w-full xl:w-1/2 flex items-center justify-center p-6 xl:justify-start xl:pl-16">
                <Card className="w-full max-w-md border-2 border-amber-500 shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Connexion
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Accédez à votre espace
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Message d'erreur */}
                        {error && (
                            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

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
                                    autoComplete="current-password"
                                    required
                                    placeholder="Entrez votre mot de passe"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    disabled={isLoading}
                                    className="focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>

                            {/* Bouton de connexion */}
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
                                        Connexion en cours...
                                    </>
                                ) : (
                                    <>
                                        Se Connecter
                                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Lien d'inscription */}
                        <div className="text-center pt-4">
                            <p className="text-sm text-gray-600">
                                Pas de compte ?{' '}
                                <Button
                                    variant="link"
                                    className="p-0 h-auto font-medium text-amber-500 hover:text-amber-600"
                                    onClick={handleNavigateToRegister}
                                >
                                    S'inscrire
                                </Button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default LoginPage;