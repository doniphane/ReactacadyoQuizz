// Interface pour définir la structure d'un utilisateur connecté
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

// Interface pour définir la réponse de connexion du backend
export interface LoginResponse {
  token: string;
  user: User;
}

// Interface pour définir les données de connexion
export interface LoginData {
  username: string; 
  password: string;
}


export interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  roles?: string[];
  [key: string]: unknown;
} 