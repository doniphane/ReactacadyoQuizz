import type { Quiz, Question } from '@/types/Quiz';
import { AuthService } from './auth';


const API_URL = 'http://localhost:8000/api';


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
  correct: boolean;
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
      const response = await fetch(`${API_URL}/quizzes/${quizId}`, {
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
        correct: boolean;
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
        correct: boolean;
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

  // Chercher un quiz par son code d'accès (pour les étudiants)
  static async findQuizByCode(accessCode: string): Promise<{
    id: number;
    title: string;
    description?: string;
    accessCode: string;
    isActive: boolean;
  }> {
    try {
      // On utilise l'endpoint public pour chercher par code
      const response = await fetch(`${API_URL}/public/quizzes/by-code/${accessCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new QuizApiError('Quiz non trouvé avec ce code', 404);
        }
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.detail || 'Impossible de trouver le quiz',
          response.status
        );
      }

      const quizData = await response.json();
      
      return {
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        accessCode: quizData.accessCode,
        isActive: quizData.isActive
      };

    } catch (error) {
      if (error instanceof QuizApiError) {
        throw error;
      }
      console.error('Erreur:', error);
      throw new QuizApiError('Problème de connexion', 0);
    }
  }

  // Récupérer les questions d'un quiz (pour les étudiants)
  static async getQuizQuestions(quizId: number): Promise<{
    id: number;
    text: string;
    orderNumber: number;
    answers: Array<{
      id: number;
      text: string;
      orderNumber: number;
      isCorrect: boolean;
    }>;
  }[]> {
    try {
      // On utilise l'endpoint public pour récupérer le quiz avec ses questions
      const response = await fetch(`${API_URL}/public/quizzes/${quizId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.detail || 'Impossible de récupérer les questions',
          response.status
        );
      }

      const quizData = await response.json();
      
      // On retourne seulement les questions avec leurs réponses
      return quizData.questions || [];

    } catch (error) {
      if (error instanceof QuizApiError) {
        throw error;
      }
      console.error('Erreur:', error);
      throw new QuizApiError('Problème de connexion', 0);
    }
  }

  // Créer une tentative de quiz (pour les étudiants)
  static async createQuizAttempt(
    quizId: number, 
    participantData: {
      firstName: string;
      lastName: string;
    }
  ): Promise<{
    id: number;
    participantFirstName: string;
    participantLastName: string;
    quiz: {
      id: number;
      title: string;
    };
  }> {
    try {
      const response = await fetch(`${API_URL}/quizzes/${quizId}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participantFirstName: participantData.firstName,
          participantLastName: participantData.lastName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.detail || 'Impossible de créer la tentative',
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

  // Soumettre les réponses d'un quiz (pour les étudiants)
  static async submitQuizAnswers(
    quizId: number,
    attemptId: number,
    answers: { [questionId: number]: number }
  ): Promise<{
    score: number;
    totalQuestions: number;
    percentage: number;
  }> {
    try {
      const response = await fetch(`${API_URL}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attemptId: attemptId,
          answers: answers
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.error || 'Impossible de soumettre les réponses',
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