// Types pour les questions selon l'API Symfony
export type QuestionType = 'multiple_choice' | 'true_false' | 'text' | 'number';

// Interface pour définir une réponse selon l'API Symfony
export interface Answer {
  id?: number;
  text: string;
  correct: boolean; // Propriété de l'API Symfony
  orderNumber: number;
  createdAt?: string;
  question: string; // URL de la question parent
}

// Interface pour définir une question selon l'API Symfony
export interface Question {
  id?: number;
  text: string;
  orderNumber: number;
  createdAt?: string;
  quiz: string; // URL du quiz parent
  answers?: Answer[];
}

// Interface pour définir un quiz selon l'API Symfony
export interface Quiz {
  id?: number;
  title: string;
  description?: string;
  uniqueCode: string;
  isActive: boolean;
  isStarted: boolean;
  passingScore: number;
  createdAt?: string;
  updatedAt?: string;
  teacher: string; // URL de l'utilisateur créateur
  questions?: Question[];
}

// Interface pour définir la structure d'un quiz (ancienne version pour compatibilité)
export interface QuizLegacy {
  id: number;
  title: string;
  code: string;
  completionCount: number;
}

// Interface pour définir les métriques du dashboard
export interface DashboardMetrics {
  quizzesCreated: number;
  totalAttempts: number;
  registeredUsers: number;
}

// Interface pour définir les informations de l'étudiant
export interface StudentInfo {
  firstName: string;
  lastName: string;
}

// Interface pour définir les informations du quiz
export interface QuizInfo {
  firstName: string;
  lastName: string;
  quizCode: string;
}

// Interface pour définir un quiz en cours de création (formulaire)
export interface QuizFormData {
  title: string;
  description: string;
  uniqueCode: string;
  isActive: boolean;
  isStarted: boolean;
  passingScore: number;
  questions: QuestionFormData[];
}

// Interface pour définir une question en cours de création (formulaire)
export interface QuestionFormData {
  text: string;
  orderNumber: number;
  answers: AnswerFormData[];
}

// Interface pour définir une réponse en cours de création (formulaire)
export interface AnswerFormData {
  text: string;
  correct: boolean;
  orderNumber: number;
} 