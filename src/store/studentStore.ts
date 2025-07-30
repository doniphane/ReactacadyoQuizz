import { create } from 'zustand';
import type { StudentInfo, QuizInfo } from '@/types/Quiz';

// Interface pour définir l'état du store d'étudiant
interface StudentState {
  // État
  studentInfo: StudentInfo;
  quizInfo: QuizInfo;
  isLoading: boolean;

  // Actions pour les informations étudiant
  setStudentInfo: (info: StudentInfo) => void;
  updateStudentInfo: (field: keyof StudentInfo, value: string) => void;
  resetStudentInfo: () => void;

  // Actions pour les informations quiz
  setQuizInfo: (info: QuizInfo) => void;
  updateQuizInfo: (field: keyof QuizInfo, value: string) => void;
  resetQuizInfo: () => void;

  // Actions générales
  setLoading: (loading: boolean) => void;
  resetAll: () => void;
}

// Store d'étudiant avec Zustand
export const useStudentStore = create<StudentState>((set) => ({
  // État initial
  studentInfo: {
    firstName: '',
    lastName: ''
  },
  quizInfo: {
    firstName: '',
    lastName: '',
    quizCode: ''
  },
  isLoading: false,

  // Actions pour les informations étudiant
  setStudentInfo: (info: StudentInfo) => {
    set({ studentInfo: info });
  },

  updateStudentInfo: (field: keyof StudentInfo, value: string) => {
    set((state) => ({
      studentInfo: {
        ...state.studentInfo,
        [field]: value
      }
    }));
  },

  resetStudentInfo: () => {
    set({
      studentInfo: {
        firstName: '',
        lastName: ''
      }
    });
  },

  // Actions pour les informations quiz
  setQuizInfo: (info: QuizInfo) => {
    set({ quizInfo: info });
  },

  updateQuizInfo: (field: keyof QuizInfo, value: string) => {
    set((state) => ({
      quizInfo: {
        ...state.quizInfo,
        [field]: value
      }
    }));
  },

  resetQuizInfo: () => {
    set({
      quizInfo: {
        firstName: '',
        lastName: '',
        quizCode: ''
      }
    });
  },

  // Actions générales
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  resetAll: () => {
    set({
      studentInfo: {
        firstName: '',
        lastName: ''
      },
      quizInfo: {
        firstName: '',
        lastName: '',
        quizCode: ''
      },
      isLoading: false
    });
  }
})); 