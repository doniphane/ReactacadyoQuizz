import type { Quiz, Question } from '@/types/Quiz';
import { AuthService } from './auth';


const API_URL = 'http://localhost:8000/api';

// Interface pour la réponse API Platform (JSON-LD)
interface ApiPlatformResponse<T> {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  totalItems?: number;
  member?: T[];
}

// Types pour créer un quiz
interface CreateQuizRequest {
  title: string;
  description?: string;
  isActive: boolean;
  isStarted: boolean;
  passingScore: number;
  questions: CreateQuestionRequest[];
}

interface CreateQuestionRequest {
  text: string;
  orderNumber: number;
  answers: CreateAnswerRequest[];
}

interface CreateAnswerRequest {
  text: string;
  isCorrect: boolean;
  orderNumber: number;
}

// Type pour la réponse quand on crée un quiz
interface CreateQuizResponse {
  id: number;
  title: string;
  description?: string;
  uniqueCode: string;
  accessCode: string;
  isActive: boolean;
  isStarted: boolean;
  passingScore: number;
  createdAt: string;
  questions: Question[];
}

// Classe d'erreur simple pour les quiz
export class QuizApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'QuizApiError';
    this.status = status;
  }
}

// Service pour gérer les quiz
export class QuizApiService {
  
  // Fonction pour préparer les headers avec le token
  private static getAuthHeaders() {
    const token = AuthService.getToken();
    if (!token) {
      throw new QuizApiError('Vous devez être connecté', 401);
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Créer un nouveau quiz
  static async createQuiz(quizData: CreateQuizRequest): Promise<CreateQuizResponse> {
    try {
      const response = await fetch(`${API_URL}/quizzes`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(quizData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.detail || 'Impossible de créer le quiz',
          response.status
        );
      }

      return await response.json();

    } catch (error) {
      if (error instanceof QuizApiError) {
        throw error;
      }
      console.error('Erreur:', error);
      throw new QuizApiError('Problème de connexion', 0);
    }
  }

  // Récupérer tous les quiz
  static async getQuizzes(): Promise<Quiz[] | ApiPlatformResponse<Quiz>> {
    try {
      const response = await fetch(`${API_URL}/quizzes`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.detail || 'Impossible de récupérer les quiz',
          response.status
        );
      }

      return await response.json();

    } catch (error) {
      if (error instanceof QuizApiError) {
        throw error;
      }
      console.error('Erreur:', error);
      throw new QuizApiError('Problème de connexion', 0);
    }
  }

  // Récupérer un quiz avec ses questions
  static async getQuizById(quizId: number): Promise<Quiz> {
    try {
      const response = await fetch(`${API_URL}/quizzes/${quizId}/with-questions`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.detail || 'Quiz non trouvé',
          response.status
        );
      }

      const quizData = await response.json();
      
      // On transforme les données pour notre format
      return {
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        uniqueCode: quizData.uniqueCode,
        isActive: quizData.isActive,
        isStarted: quizData.isStarted,
        passingScore: quizData.passingScore,
        teacher: quizData.teacher || '',
        questions: quizData.questions || []
      };

    } catch (error) {
      if (error instanceof QuizApiError) {
        throw error;
      }
      console.error('Erreur:', error);
      throw new QuizApiError('Problème de connexion', 0);
    }
  }

  // Supprimer un quiz
  static async deleteQuiz(quizId: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.detail || 'Impossible de supprimer le quiz',
          response.status
        );
      }

    } catch (error) {
      if (error instanceof QuizApiError) {
        throw error;
      }
      console.error('Erreur:', error);
      throw new QuizApiError('Problème de connexion', 0);
    }
  }

  // Ajouter une question à un quiz
  static async addQuestion(
    quizId: number, 
    questionData: {
      text: string;
      answers: Array<{
        text: string;
        isCorrect: boolean;
      }>;
    }
  ): Promise<{
    success: boolean;
    message: string;
    question: {
      id: number;
      text: string;
      orderNumber: number;
      answers: Array<{
        id: number;
        text: string;
        isCorrect: boolean;
        orderNumber: number;
      }>;
    };
  }> {
    try {
      const response = await fetch(`${API_URL}/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(questionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.error || 'Impossible d\'ajouter la question',
          response.status
        );
      }

      return await response.json();

    } catch (error) {
      if (error instanceof QuizApiError) {
        throw error;
      }
      console.error('Erreur:', error);
      throw new QuizApiError('Problème de connexion', 0);
    }
  }
}

// Export des types
export type { CreateQuizRequest, CreateQuestionRequest, CreateAnswerRequest, CreateQuizResponse, ApiPlatformResponse };