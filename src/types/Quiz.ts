// Interface pour définir la structure d'un quiz
export interface Quiz {
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