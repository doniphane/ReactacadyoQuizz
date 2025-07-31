import type { Quiz, Question } from '@/types/Quiz';
import { AuthService } from './auth';

// Configuration de base pour notre API
const API_BASE_URL = 'http://localhost:8000/api';

// Interface pour la création d'un quiz
interface CreateQuizRequest {
  title: string;
  description?: string;
  isActive: boolean;
  isStarted: boolean;
  passingScore: number;
  questions: CreateQuestionRequest[];
}

// Interface pour la création d'une question
interface CreateQuestionRequest {
  text: string;
  orderNumber: number;
  answers: CreateAnswerRequest[];
}

// Interface pour la création d'une réponse
interface CreateAnswerRequest {
  text: string;
  isCorrect: boolean;
  orderNumber: number;
}

// Interface pour la réponse de création de quiz
interface CreateQuizResponse {
  id: number;
  title: string;
  description?: string;
  uniqueCode: string; // Pour compatibilité frontend
  accessCode: string;
  isActive: boolean;
  isStarted: boolean;
  passingScore: number;
  createdAt: string;
  questions: Question[];
}

// Classe d'erreur personnalisée pour les erreurs de l'API
class QuizApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'QuizApiError';
    this.status = status;
  }
}

// Service pour gérer toutes les interactions avec l'API quiz
class QuizApiService {
  
  /**
   * Créer un nouveau quiz
   * @param quizData - Les données du quiz à créer
   * @returns Promise avec les données du quiz créé
   */
  static async createQuiz(quizData: CreateQuizRequest): Promise<CreateQuizResponse> {
    try {
      // Récupérer le token d'authentification
      const token = AuthService.getToken();
      if (!token) {
        throw new QuizApiError('Non authentifié', 401);
      }

      // Préparation des headers pour la requête JSON
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Accept', 'application/json');
      headers.append('Authorization', `Bearer ${token}`);

      // Configuration de la requête
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(quizData),
        credentials: 'include',
      };

      // Envoi de la requête vers l'API Symfony
      const response = await fetch(`${API_BASE_URL}/quizzes`, requestOptions);

      // Vérification si la requête a échoué
      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.detail || 'Erreur lors de la création du quiz',
          response.status
        );
      }

      // Si tout va bien, on récupère les données du quiz créé
      const createdQuiz: CreateQuizResponse = await response.json();
      return createdQuiz;

    } catch (error) {
      // Si c'est déjà une QuizApiError, on la relance
      if (error instanceof QuizApiError) {
        throw error;
      }

      // Pour les autres erreurs (réseau, etc.), on crée une QuizApiError générique
      console.error('Erreur réseau lors de la création du quiz:', error);
      throw new QuizApiError('Erreur de connexion au serveur', 0);
    }
  }

  /**
   * Récupérer la liste des quiz
   * @returns Promise avec la liste des quiz
   */
  static async getQuizzes(): Promise<Quiz[]> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new QuizApiError('Non authentifié', 401);
      }

      const headers = new Headers();
      headers.append('Accept', 'application/json');
      headers.append('Authorization', `Bearer ${token}`);

      const response = await fetch(`${API_BASE_URL}/quizzes`, {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.detail || 'Erreur lors de la récupération des quiz',
          response.status
        );
      }

      const quizzes: Quiz[] = await response.json();
      return quizzes;

    } catch (error) {
      if (error instanceof QuizApiError) {
        throw error;
      }

      console.error('Erreur lors de la récupération des quiz:', error);
      throw new QuizApiError('Erreur de connexion au serveur', 0);
    }
  }

  /**
   * Récupérer un quiz par son ID avec ses questions
   * @param quizId - L'ID du quiz
   * @returns Promise avec les données du quiz
   */
  static async getQuizById(quizId: number): Promise<Quiz> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new QuizApiError('Non authentifié', 401);
      }

      const headers = new Headers();
      headers.append('Accept', 'application/json');
      headers.append('Authorization', `Bearer ${token}`);

      const url = `${API_BASE_URL}/quizzes/${quizId}/with-questions`;

      // Utiliser l'endpoint personnalisé qui retourne les questions complètes
      const response = await fetch(url, {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.detail || errorData.error || 'Quiz non trouvé',
          response.status
        );
      }

      const quizData = await response.json();
      
      // Transformer les données pour correspondre à notre interface
      const quiz: Quiz = {
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
      
      return quiz;

    } catch (error) {
      if (error instanceof QuizApiError) {
        throw error;
      }

      console.error('Erreur lors de la récupération du quiz:', error);
      throw new QuizApiError('Erreur de connexion au serveur', 0);
    }
  }

  /**
   * Supprimer un quiz
   * @param quizId - L'ID du quiz à supprimer
   * @returns Promise
   */
  static async deleteQuiz(quizId: number): Promise<void> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new QuizApiError('Non authentifié', 401);
      }

      const headers = new Headers();
      headers.append('Accept', 'application/json');
      headers.append('Authorization', `Bearer ${token}`);

      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.detail || 'Erreur lors de la suppression du quiz',
          response.status
        );
      }

    } catch (error) {
      if (error instanceof QuizApiError) {
        throw error;
      }

      console.error('Erreur lors de la suppression du quiz:', error);
      throw new QuizApiError('Erreur de connexion au serveur', 0);
    }
  }

  /**
   * Ajouter une question à un quiz
   * @param quizId - L'ID du quiz
   * @param questionData - Les données de la question à ajouter
   * @returns Promise avec les données de la question créée
   */
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
      const token = AuthService.getToken();
      if (!token) {
        throw new QuizApiError('Non authentifié', 401);
      }

      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Accept', 'application/json');
      headers.append('Authorization', `Bearer ${token}`);

      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(questionData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new QuizApiError(
          errorData.error || 'Erreur lors de l\'ajout de la question',
          response.status
        );
      }

      const result = await response.json();
      return result;

    } catch (error) {
      if (error instanceof QuizApiError) {
        throw error;
      }

      console.error('Erreur lors de l\'ajout de la question:', error);
      throw new QuizApiError('Erreur de connexion au serveur', 0);
    }
  }
}

// Export de la classe et de l'erreur personnalisée
export { QuizApiService, QuizApiError };
export type { CreateQuizRequest, CreateQuestionRequest, CreateAnswerRequest, CreateQuizResponse }; 