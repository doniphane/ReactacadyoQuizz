

// L'adresse de notre API
const API_URL = 'http://localhost:8000/api';


interface User {
  id: number;
  email: string;
  roles: string[];
}

interface NewUser {
  email: string;
  password: string;
}


export class ApiError extends Error {
  public status: number;
  public violations?: { propertyPath: string; message: string }[];

  constructor(message: string, status: number, violations?: { propertyPath: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.violations = violations;
  }
}

// Fonctions pour communiquer avec l'API
export class UserApiService {
  
  // Créer un nouvel utilisateur
  static async createUser(userData: NewUser): Promise<User> {
    try {
      // On envoie les données à l'API
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          firstName: 'User',
          lastName: 'Default'
        })
      });

      // Si ça marche pas, on lance une erreur
      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          errorData.detail || 'Impossible de créer l\'utilisateur',
          response.status,
          errorData.violations
        );
      }

      // On récupère la réponse
      const data = await response.json();
      
      // On retourne les infos de l'utilisateur
      return {
        id: data.user.id,
        email: data.user.email,
        roles: data.user.roles
      };

    } catch (error) {
  
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Erreur:', error);
      throw new ApiError('Problème de connexion', 0);
    }
  }

  // Récupérer un utilisateur par son ID
  static async getUserById(userId: number): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          errorData.detail || 'Utilisateur non trouvé',
          response.status
        );
      }

      return await response.json();

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Erreur:', error);
      throw new ApiError('Impossible de récupérer l\'utilisateur', 0);
    }
  }
}