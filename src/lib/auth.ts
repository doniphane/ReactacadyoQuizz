import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import type { User, LoginResponse, LoginData, JWTPayload } from '@/types/Auth';

// Classe pour gérer l'authentification
class AuthService {
  private static readonly TOKEN_COOKIE = 'auth_token';
  private static readonly USER_COOKIE = 'auth_user';
  private static readonly COOKIE_OPTIONS = {
    secure: process.env.NODE_ENV === 'production',  // Cookie sécurisé en production
    sameSite: 'Strict' as const,  // Protection CSRF
    expires: 7           // Expire dans 7 jours
  };

  /**
   * Décode un token JWT avec la bibliothèque jwt-decode
   */
  private static decodeToken(token: string): JWTPayload | null {
    try {
      // Utilisation de jwt-decode pour décoder le token de manière sécurisée
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Vérifie si un token est valide
   */
  private static isTokenValid(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return false;

      // Vérifier si le token n'est pas expiré
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  }

  /**
   * Se connecter avec username et mot de passe
   */
  static async login(loginData: LoginData): Promise<User> {
    // Préparation des headers pour la requête JSON
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    // Configuration de la requête
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(loginData),
    };

    // Envoi de la requête vers l'API Symfony
    const response = await fetch('http://localhost:8000/api/login_check', requestOptions);

    // Vérification si la requête a échoué
    if (!response.ok) {
      // Vérifier si la réponse est en JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la connexion');
      } else {
        // Si ce n'est pas du JSON (probablement une page d'erreur HTML)
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    }

    // Vérifier que la réponse est bien du JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Réponse invalide du serveur (pas de JSON)');
    }

    // Récupération de la réponse avec token et utilisateur
    const loginResponse: LoginResponse = await response.json();

    // Vérification de la validité du token
    if (!this.isTokenValid(loginResponse.token)) {
      throw new Error('Token invalide reçu du serveur');
    }

    // Sauvegarde du token et des informations utilisateur
    this.setToken(loginResponse.token);
    this.setUser(loginResponse.user);

    return loginResponse.user;
  }

  /**
   * Se déconnecter
   */
  static logout(): void {
    Cookies.remove(this.TOKEN_COOKIE);
    Cookies.remove(this.USER_COOKIE);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && this.isTokenValid(token);
  }

  /**
   * Récupérer l'utilisateur connecté
   */
  static getCurrentUser(): User | null {
    const userStr = Cookies.get(this.USER_COOKIE);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Récupérer les informations de l'utilisateur depuis le token JWT
   */
  static getUserFromToken(): Partial<User> | null {
    try {
      const token = this.getToken();
      if (!token) return null;

      const decoded = this.decodeToken(token);
      if (!decoded) return null;

      return {
        id: decoded.sub ? parseInt(decoded.sub) : 0,
        email: decoded.email as string || '',
        firstName: decoded.firstName as string || '',
        lastName: decoded.lastName as string || '',
        roles: this.getRolesFromToken()
      };
    } catch {
      return null;
    }
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  static hasRole(role: string): boolean {
    // Normaliser le rôle recherché
    const normalizedRole = this.normalizeRole(role);
    
    // Vérifier d'abord les rôles dans le token JWT (plus sécurisé)
    const tokenRoles = this.getRolesFromToken();
    
    // Vérification avec normalisation
    const hasRoleInToken = tokenRoles.some(tokenRole => 
      this.normalizeRole(tokenRole) === normalizedRole
    );
    
    if (hasRoleInToken) {
      return true;
    }

    // Fallback sur les rôles stockés dans l'utilisateur
    const user = this.getCurrentUser();
    
    const hasRoleInUser = user ? user.roles.some(userRole => 
      this.normalizeRole(userRole) === normalizedRole
    ) : false;
    
    return hasRoleInUser;
  }

  /**
   * Normaliser un rôle (convertir en majuscules)
   */
  private static normalizeRole(role: string): string {
    return role.toUpperCase();
  }

  /**
   * Récupérer les rôles directement depuis le token JWT
   */
  static getRolesFromToken(): string[] {
    try {
      const token = this.getToken();
      if (!token) {
        return [];
      }

      const decoded = this.decodeToken(token);
      
      if (!decoded || !decoded.roles) {
        return [];
      }

      const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
      return roles;
    } catch {
      return [];
    }
  }

  /**
   * Vérifier si l'utilisateur est admin
   */
  static isAdmin(): boolean {
    // Vérifier plusieurs formats possibles pour le rôle admin
    const adminRoles = ['ROLE_ADMIN', 'ROLE_Admin', 'ROLE_admin'];
    const isAdmin = adminRoles.some(role => this.hasRole(role));
    return isAdmin;
  }

  /**
   * Vérifier si l'utilisateur est un utilisateur normal
   */
  static isUser(): boolean {
    const isUser = this.hasRole('ROLE_USER');
    return isUser;
  }

  /**
   * Récupérer le token depuis les cookies
   */
  static getToken(): string | null {
    return Cookies.get(this.TOKEN_COOKIE) || null;
  }

  /**
   * Sauvegarder le token dans les cookies
   */
  private static setToken(token: string): void {
    Cookies.set(this.TOKEN_COOKIE, token, this.COOKIE_OPTIONS);
  }

  /**
   * Sauvegarder l'utilisateur dans les cookies
   */
  private static setUser(user: User): void {
    Cookies.set(this.USER_COOKIE, JSON.stringify(user), this.COOKIE_OPTIONS);
  }
}

export { AuthService };
export type { User, LoginResponse, LoginData }; 