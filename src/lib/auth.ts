import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';


interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface LoginData {
  username: string;
  password: string;
}

interface JWTPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  exp: number;
}


export class AuthService {
  
  // Se connecter
  static async login(loginData: LoginData): Promise<User> {
    try {
      const response = await fetch('http://localhost:8000/api/login_check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      if (!response.ok) {
        throw new Error('Email ou mot de passe incorrect');
      }

      const data = await response.json();
      
      // Sauvegarder dans les cookies
      Cookies.set('auth_token', data.token, { expires: 1 });
      Cookies.set('auth_user', JSON.stringify(data.user), { expires: 1 });
      
      return data.user;

    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw new Error('Impossible de se connecter');
    }
  }

  // Se déconnecter
  static logout(): void {
    Cookies.remove('auth_token');
    Cookies.remove('auth_user');
  }

  // Vérifier si le token est encore valide
  static isTokenValid(): boolean {
    const token = Cookies.get('auth_token');
    if (!token) return false;

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  }

  // Vérifier si on est connecté
  static isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  // Récupérer l'utilisateur connecté
  static getCurrentUser(): User | null {
    const userStr = Cookies.get('auth_user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Récupérer le token
  static getToken(): string | null {
    return Cookies.get('auth_token') || null;
  }

  // Récupérer les rôles depuis le token JWT
  static getRolesFromToken(): string[] {
    const token = this.getToken();
    if (!token) return [];

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.roles || [];
    } catch {
      return [];
    }
  }

  // Vérifier si l'utilisateur a un rôle spécifique
  static hasRole(role: string): boolean {
    // Vérifier dans le token JWT
    const tokenRoles = this.getRolesFromToken();
    if (tokenRoles.includes(role)) {
      return true;
    }

    // Vérifier dans les données utilisateur
    const user = this.getCurrentUser();
    return user ? user.roles.includes(role) : false;
  }

  // Vérifier si l'utilisateur est admin
  static isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  // Vérifier si l'utilisateur est un utilisateur normal
  static isUser(): boolean {
    return this.hasRole('ROLE_USER');
  }

  // Récupérer les infos utilisateur depuis le token
  static getUserFromToken(): Partial<User> | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return {
        id: parseInt(decoded.sub),
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        roles: decoded.roles
      };
    } catch {
      return null;
    }
  }
}


export type { User, LoginData };