import type { UserCreateRequest, UserResponse, ApiErrorResponse } from '@/types/User';

const API_BASE_URL = 'https://localhost:8000/api';


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


class UserApiService {
  

  static async createUser(userData: UserCreateRequest): Promise<UserResponse> {
    try {
 
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');


      const requestOptions: RequestInit = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(userData),
  
      };


      const response = await fetch(`${API_BASE_URL}/users`, requestOptions);


      if (!response.ok) {

        const errorData: ApiErrorResponse = await response.json();
        

        throw new ApiError(
          errorData.detail || 'Erreur lors de la création de l\'utilisateur',
          response.status,
          errorData.violations
        );
      }


      const createdUser: UserResponse = await response.json();
      return createdUser;

    } catch (error) {
      // Si c'est déjà une ApiError, on la relance
      if (error instanceof ApiError) {
        throw error;
      }


      console.error('Erreur réseau lors de la création de l\'utilisateur:', error);
      throw new ApiError('Erreur de connexion au serveur', 0);
    }
  }


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


export { UserApiService, ApiError }; 