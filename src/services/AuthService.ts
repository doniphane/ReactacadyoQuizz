

import axios from 'axios';
import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';


// Interface pour les credentials de connexion
interface LoginCredentials {
    username: string; 
    password: string;
}

// Interface pour la réponse de connexion réussie du backend
interface LoginSuccessResponse {
    token: string;
    refresh_token?: string;
}

// Interface pour la réponse d'erreur du backend
interface LoginErrorResponse {
    message?: string;
    error?: string;
    code?: number;
}

// Interface pour le résultat de la méthode login
interface LoginResult {
    success: boolean;
    user?: DecodedTokenPayload;
    message: string;
}

// Type pour les rôles utilisateur
type UserRole = 'ROLE_ADMIN' | 'ROLE_USER' | 'ROLE_SUPER_ADMIN' | string;

// Interface pour les données utilisateur décodées du token JWT
interface DecodedTokenPayload {
    username?: string;
    email?: string;
    roles: UserRole[];
    exp: number; 
    iat?: number; 
    sub?: string; 
    [key: string]: unknown; 
}

// Interface pour les erreurs Axios personnalisées
interface CustomAxiosError extends AxiosError {
    response?: AxiosResponse<LoginErrorResponse>;
}


type JWTToken = string | null;


type ValidationResult = boolean;

// Type pour les résultats de vérification utilisateur
type UserInfo = DecodedTokenPayload | null;


// URL de base de l'API Symfony
const API_BASE_URL: string = 'http://localhost:8000';

// Clé pour stocker le token en localStorage
const TOKEN_KEY: string = 'auth_token';

class AuthService {
    constructor() {
    
        this.setupAxiosInterceptors();
    }

    // Configure axios pour ajouter automatiquement le token aux requêtes
    private setupAxiosInterceptors(): void {
        // Intercepteur pour ajouter le token à chaque requête
        axios.interceptors.request.use(
            (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
                const token: JWTToken = this.getToken();
                if (token) {
                    
                    config.headers = config.headers || {};
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error: unknown): Promise<unknown> => {
                return Promise.reject(error);
            }
        );

        // Intercepteur pour gérer les erreurs 401 (token expiré)
        axios.interceptors.response.use(
            (response: AxiosResponse): AxiosResponse => response,
            (error: CustomAxiosError): Promise<unknown> => {
                if (error.response && error.response.status === 401) {
                    // Token expiré, on déconnecte l'utilisateur
                    this.logout();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // Méthode pour se connecter avec email et password
    public async login(email: string, password: string): Promise<LoginResult> {
        try {
            // Préparer les credentials
            const credentials: LoginCredentials = {
                username: email, // Lexik JWT attend 'username'
                password: password
            };

            // Envoie les credentials au backend Symfony
            const response: AxiosResponse<LoginSuccessResponse> = await axios.post<LoginSuccessResponse>(
                `${API_BASE_URL}/api/login_check`,
                credentials
            );

            // Récupère le token de la réponse
            const token: string = response.data.token;

            // Stocke le token en localStorage
            this.setToken(token);

            // Récupère les informations utilisateur depuis le token
            const userInfo: DecodedTokenPayload = this.decodeToken(token);

            return {
                success: true,
                user: userInfo,
                message: 'Connexion réussie'
            };

        } catch (error) {
            // Gestion des erreurs de connexion
            const customError = error as CustomAxiosError;
            let errorMessage: string = 'Erreur de connexion';

            if (customError.response) {
                // Erreur du serveur (400, 401, 500, etc.)
                if (customError.response.status === 401) {
                    errorMessage = 'Email ou mot de passe incorrect';
                } else if (customError.response.data && customError.response.data.message) {
                    errorMessage = customError.response.data.message;
                }
            } else if (customError.request) {
               
                errorMessage = 'Impossible de se connecter au serveur';
            }

            return {
                success: false,
                message: errorMessage
            };
        }
    }

    // Méthode pour se déconnecter
    public async logout(): Promise<void> {
        try {
            // Appelle l'endpoint de déconnexion du backend
            await axios.post(`${API_BASE_URL}/api/logout`);
        } catch (error) {
            // Même si la déconnexion échoue côté serveur, on supprime le token local
            console.log('Erreur lors de la déconnexion:', error);
        } finally {
            // Supprime le token du localStorage
            this.removeToken();
        }
    }

    // Méthode pour vérifier si l'utilisateur est connecté
    public isAuthenticated(): ValidationResult {
        const token: JWTToken = this.getToken();
        if (!token) {
            return false;
        }

        try {
            // Vérifie si le token n'est pas expiré
            const decodedToken: DecodedTokenPayload = this.decodeToken(token);
            const currentTime: number = Date.now() / 1000;

            // Si le token a expiré, on le supprime
            if (decodedToken.exp && decodedToken.exp < currentTime) {
                this.removeToken();
                return false;
            }

            return true;
        } catch {
            // Token invalide, on le supprime
            this.removeToken();
            return false;
        }
    }

    // Méthode pour récupérer les informations de l'utilisateur connecté
    public getCurrentUser(): UserInfo {
        if (!this.isAuthenticated()) {
            return null;
        }

        try {
            const token: JWTToken = this.getToken();
            if (!token) {
                return null;
            }
            return this.decodeToken(token);
        } catch {
            return null;
        }
    }

    // Méthode pour vérifier si l'utilisateur a un rôle spécifique
    public hasRole(role: UserRole): ValidationResult {
        const user: UserInfo = this.getCurrentUser();
        if (!user || !user.roles) {
            return false;
        }

        return user.roles.includes(role);
    }

    // Méthode pour vérifier si l'utilisateur est admin
    public isAdmin(): ValidationResult {
        return this.hasRole('ROLE_ADMIN');
    }

    // Méthode pour vérifier si l'utilisateur est un étudiant
    public isStudent(): ValidationResult {
        return this.hasRole('ROLE_USER');
    }

    // Méthode pour décoder le JWT (partie payload)
    private decodeToken(token: string): DecodedTokenPayload {
        try {
            // Un JWT a 3 parties séparées par des points
            const parts: string[] = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Token invalide');
            }

            // La deuxième partie contient les données (payload)
            const payload: string = parts[1];

            // Décode la base64 et parse le JSON
            const decodedPayload: DecodedTokenPayload = JSON.parse(atob(payload));

            return decodedPayload;
        } catch {
            throw new Error('Impossible de décoder le token');
        }
    }

    // Méthode pour stocker le token en localStorage
    private setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
    }

    // Méthode pour récupérer le token depuis localStorage
    public getToken(): JWTToken {
        return localStorage.getItem(TOKEN_KEY);
    }

    // Méthode pour supprimer le token de localStorage
    private removeToken(): void {
        localStorage.removeItem(TOKEN_KEY);
    }
}


export default new AuthService();