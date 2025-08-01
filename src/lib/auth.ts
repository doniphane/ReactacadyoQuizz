import Cookies from 'js-cookie';

// Types simples
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
      console.log('Réponse de l\'API de connexion:', data);
      
      // Sauvegarder SEULEMENT le token
      Cookies.set('auth_token', data.token, { expires: 1 });
      
      // Récupérer les données utilisateur depuis le serveur
      return await this.getCurrentUser();

    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw new Error('Impossible de se connecter');
    }
  }

  // Se déconnecter
  static logout(): void {
    Cookies.remove('auth_token');
  }

  // Récupérer le token
  static getToken(): string | null {
    return Cookies.get('auth_token') || null;
  }

  // Vérifier si on est connecté (demande au serveur)
  static async isAuthenticated(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch('http://localhost:8000/api/verify-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  // Récupérer l'utilisateur connecté (depuis le serveur)
  static async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token non trouvé');
    }

    try {
      const response = await fetch('http://localhost:8000/api/verify-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        this.logout(); 
        throw new Error('Token invalide');
      }

      const data = await response.json();
      
      if (!data.valid || !data.user) {
        this.logout();
        throw new Error('Token invalide');
      }

      return data.user;

    } catch (error) {
      console.error('Erreur:', error);
      this.logout();
      throw new Error('Impossible de récupérer l\'utilisateur');
    }
  }

  // Vérifier si l'utilisateur a un rôle spécifique
  static async hasRole(role: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user.roles.includes(role);
    } catch {
      return false;
    }
  }

  // Vérifier si l'utilisateur est admin
  static async isAdmin(): Promise<boolean> {
    return await this.hasRole('ROLE_ADMIN');
  }

  // Vérifier si l'utilisateur est un utilisateur normal Role_user
  static async isUser(): Promise<boolean> {
    return await this.hasRole('ROLE_USER');
  }
}

export type { User, LoginData };