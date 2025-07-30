import { create } from 'zustand';
import type { Quiz, DashboardMetrics } from '@/types/Quiz';


interface QuizState {

  quizzes: Quiz[];
  metrics: DashboardMetrics;
  isLoading: boolean;

  // Actions
  setQuizzes: (quizzes: Quiz[]) => void;
  addQuiz: (quiz: Quiz) => void;
  updateQuiz: (id: number, quiz: Partial<Quiz>) => void;
  deleteQuiz: (id: number) => void;
  
  setMetrics: (metrics: DashboardMetrics) => void;
  updateMetrics: (updates: Partial<DashboardMetrics>) => void;
  
  setLoading: (loading: boolean) => void;
}

// Store de quiz avec Zustand
export const useQuizStore = create<QuizState>((set) => ({
  // État initial
  quizzes: [
    {
      id: 1,
      title: 'Quiz de Mathématiques',
      code: 'MATH01',
      completionCount: 3
    },
    {
      id: 2,
      title: 'Quiz de Mathématiques',
      code: 'MATH02',
      completionCount: 3
    }
  ],
  metrics: {
    quizzesCreated: 2,
    totalAttempts: 5,
    registeredUsers: 15
  },
  isLoading: false,

  // Actions pour les quiz
  setQuizzes: (quizzes: Quiz[]) => {
    set({ quizzes });
  },

  addQuiz: (quiz: Quiz) => {
    set((state) => ({ 
      quizzes: [...state.quizzes, quiz] 
    }));
  },

  updateQuiz: (id: number, quiz: Partial<Quiz>) => {
    set((state) => ({
      quizzes: state.quizzes.map(q => 
        q.id === id ? { ...q, ...quiz } : q
      )
    }));
  },

  deleteQuiz: (id: number) => {
    set((state) => ({
      quizzes: state.quizzes.filter(q => q.id !== id)
    }));
  },

  // Actions pour les métriques
  setMetrics: (metrics: DashboardMetrics) => {
    set({ metrics });
  },

  updateMetrics: (updates: Partial<DashboardMetrics>) => {
    set((state) => ({
      metrics: { ...state.metrics, ...updates }
    }));
  },

  // Action pour le loading
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  }
})); 