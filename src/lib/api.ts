import type { UserCreateRequest, UserResponse, ApiErrorResponse } from '@/types/User';

// Configuration de base pour notre API
// Utilise HTTP en développement pour éviter les problèmes de certificat SSL
const API_BASE_URL = 'http://localhost:8000/api';

// Classe d'erreur personnalisée pour les erreurs de l'API
class ApiError extends Error {
  public status: number;
  public violations?: { propertyPath: string; message: string }[];

  constructor(message: string, status: number, violations?: { propertyPath: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.violations = violations;
  }
}

// Service pour gérer toutes les interactions avec l'API utilisateur
class UserApiService {
  
  /**
   * Créer un nouvel utilisateur
   * @param userData - Les données de l'utilisateur à créer
   * @returns Promise avec les données de l'utilisateur créé
   */
  static async createUser(userData: UserCreateRequest): Promise<UserResponse> {
    try {
      // Préparation des headers pour la requête JSON
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      // Configuration de la requête
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          firstName: 'User', // Valeur par défaut
          lastName: 'Default' // Valeur par défaut
        }),
        // En développement, on peut avoir des certificats auto-signés
        // Cette configuration aide avec les CORS et certificats SSL locaux
      };

      // Envoi de la requête vers l'API Symfony (route d'inscription)
      const response = await fetch(`${API_BASE_URL}/register`, requestOptions);

      // Vérification si la requête a échoué
      if (!response.ok) {
        // Tentative de récupération des détails de l'erreur
        const errorData: ApiErrorResponse = await response.json();
        
        // Création d'une erreur avec les détails de validation si disponibles
        throw new ApiError(
          errorData.detail || 'Erreur lors de la création de l\'utilisateur',
          response.status,
          errorData.violations
        );
      }

      // Si tout va bien, on récupère les données de l'utilisateur créé
      const responseData = await response.json();
      
      // Adapter la réponse au format attendu
      const createdUser: UserResponse = {
        id: responseData.user.id,
        email: responseData.user.email,
        roles: responseData.user.roles,
        createdAt: new Date().toISOString(),
        updatedAt: null
      };
      
      return createdUser;

    } catch (error) {
      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }

      // Pour les autres erreurs (réseau, etc.), on crée une ApiError générique
      console.error('Erreur réseau lors de la création de l\'utilisateur:', error);
      throw new ApiError('Erreur de connexion au serveur', 0);
    }
  }

  /**
   * Récupérer un utilisateur par son ID
   * @param userId - L'ID de l'utilisateur
   * @returns Promise avec les données de l'utilisateur
   */
  static async getUserById(userId: number): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`);

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new ApiError(
          errorData.detail || 'Utilisateur non trouvé',
          response.status
        );
      }

      const user: UserResponse = await response.json();
      return user;

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw new ApiError('Erreur de connexion au serveur', 0);
    }
  }
}

// Export de la classe et de l'erreur personnalisée
export { UserApiService, ApiError }; 