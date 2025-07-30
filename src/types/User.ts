// Interface pour les données que nous envoyons lors de la création d'un utilisateur

interface UserCreateRequest {
  email: string;
  password: string;
}

// Interface pour les données que nous recevons de l'API après création/lecture

interface UserResponse {
  id: number;
  email: string;
  roles: string[];
  createdAt: string; // ISO string format de la date
  updatedAt: string | null;
}

// Interface pour les données de mise à jour d'un utilisateur

interface UserUpdateRequest {
  email?: string;
  password?: string;
  roles?: string[];
}

// Interface pour les erreurs de validation retournées par Symfony
interface ApiValidationError {
  propertyPath: string;
  message: string;
}

// Interface pour la réponse d'erreur complète de l'API
interface ApiErrorResponse {
  '@type': string;
  title: string;
  detail: string;
  violations?: ApiValidationError[];
}

export type {
  UserCreateRequest,
  UserResponse,
  UserUpdateRequest,
  ApiValidationError,
  ApiErrorResponse
}; 