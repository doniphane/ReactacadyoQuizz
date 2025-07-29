
// Correspond aux champs avec les groups 'user:create' dans l'entité Symfony
interface UserCreateRequest {
  email: string;
  plainPassword: string;
  firtName: string; 
  lastName: string;
  roles: string[];
}

// Correspond aux champs avec les groups 'user:read' dans l'entité Symfony
interface UserResponse {
  id: number;
  email: string;
  firtName: string;
  lastName: string;
  roles: string[];
  createdAt: string; 
  updatedAt: string | null;
}

// Correspond aux champs avec les groups 'user:update' dans l'entité Symfony
interface UserUpdateRequest {
  email?: string;
  plainPassword?: string;
  firtName?: string;
  lastName?: string;
  roles?: string[];
}


interface ApiValidationError {
  propertyPath: string;
  message: string;
}

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