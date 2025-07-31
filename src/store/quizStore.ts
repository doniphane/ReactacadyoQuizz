import { create } from 'zustand';
import type { Quiz, QuizLegacy, DashboardMetrics } from '@/types/Quiz';

// Interface pour définir l'état du store de quiz
interface QuizState {
  // État
  quizzes: QuizLegacy[]; // Garder l'ancien format pour la compatibilité avec le dashboard
  newQuizzes: Quiz[]; // Nouveaux quiz selon l'API Symfony
  metrics: DashboardMetrics;
  isLoading: boolean;

  // Actions pour les quiz existants (compatibilité)
  setQuizzes: (quizzes: QuizLegacy[]) => void;
  addQuiz: (quiz: QuizLegacy) => void;
  updateQuiz: (id: number, quiz: Partial<QuizLegacy>) => void;
  deleteQuiz: (id: number) => void;
  
  // Actions pour les nouveaux quiz (API Symfony)
  setNewQuizzes: (quizzes: Quiz[]) => void;
  addNewQuiz: (quiz: Quiz) => void;
  updateNewQuiz: (id: number, quiz: Partial<Quiz>) => void;
  deleteNewQuiz: (id: number) => void;
  
  // Actions pour créer un quiz via l'API
  createQuiz: (quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'questions'>) => Promise<Quiz | null>;
  
  setMetrics: (metrics: DashboardMetrics) => void;
  updateMetrics: (updates: Partial<DashboardMetrics>) => void;
  
  setLoading: (loading: boolean) => void;
}

// Store de quiz avec Zustand
export const useQuizStore = create<QuizState>((set, get) => ({
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
  newQuizzes: [],
  metrics: {
    quizzesCreated: 2,
    totalAttempts: 5,
    registeredUsers: 15
  },
  isLoading: false,

  // Actions pour les quiz existants (compatibilité)
  setQuizzes: (quizzes: QuizLegacy[]) => {
    set({ quizzes });
  },

  addQuiz: (quiz: QuizLegacy) => {
    set((state) => ({ 
      quizzes: [...state.quizzes, quiz] 
    }));
  },

  updateQuiz: (id: number, quiz: Partial<QuizLegacy>) => {
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

  // Actions pour les nouveaux quiz (API Symfony)
  setNewQuizzes: (quizzes: Quiz[]) => {
    set({ newQuizzes: quizzes });
  },

  addNewQuiz: (quiz: Quiz) => {
    set((state) => ({ 
      newQuizzes: [...state.newQuizzes, quiz] 
    }));
  },

  updateNewQuiz: (id: number, quiz: Partial<Quiz>) => {
    set((state) => ({
      newQuizzes: state.newQuizzes.map(q => 
        q.id === id ? { ...q, ...quiz } : q
      )
    }));
  },

  deleteNewQuiz: (id: number) => {
    set((state) => ({
      newQuizzes: state.newQuizzes.filter(q => q.id !== id)
    }));
  },

  // Action pour créer un quiz via l'API
  createQuiz: async (quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'questions'>) => {
    try {
      set({ isLoading: true });
      
      // TODO: Remplacer par l'appel réel à l'API
      // const response = await fetch('/api/quizzes', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify(quizData)
      // });
      
      // if (!response.ok) {
      //   throw new Error('Erreur lors de la création du quiz');
      // }
      
      // const newQuiz = await response.json();
      
      // Simulation de création pour le moment
      const newQuiz: Quiz = {
        id: Date.now(),
        ...quizData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questions: []
      };
      
      // Ajouter le quiz au store
      get().addNewQuiz(newQuiz);
      
      // Mettre à jour les métriques
      const currentMetrics = get().metrics;
      get().updateMetrics({
        quizzesCreated: currentMetrics.quizzesCreated + 1
      });
      
      set({ isLoading: false });
      return newQuiz;
      
    } catch (error) {
      console.error('Erreur lors de la création du quiz:', error);
      set({ isLoading: false });
      return null;
    }
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