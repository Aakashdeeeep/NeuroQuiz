import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Question {
  type: "mcq" | "true_false" | "fill_blank";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
}

export interface QuizAttempt {
  id: string;
  topic: string;
  difficulty: string;
  date: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  challengeId?: string | null;
  questions?: Question[];
  userAnswers?: Record<number, string>;
}

interface QuizState {
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  numQuestions: number;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, string>;
  isGenerating: boolean;
  history: QuizAttempt[];
  startTime: number | null;
  endTime: number | null;
  isOverclocked: boolean;
  isVoiceEnabled: boolean;
  aiReaction: "none" | "happy" | "sad" | "surprised" | "thinking";
  appTheme: "dark" | "light";
  challengeId: string | null;

  // Actions
  setChallengeId: (id: string | null) => void;
  setAppTheme: (theme: "dark" | "light") => void;
  setAiReaction: (reaction: "none" | "happy" | "sad" | "surprised" | "thinking") => void;
  setOverclocked: (val: boolean) => void;
  toggleVoice: () => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
  updateLatestAttemptChallengeId: (challengeId: string) => void;
  setConfig: (config: { topic: string; difficulty: "Easy" | "Medium" | "Hard"; numQuestions: number }) => void;
  setQuestions: (questions: Question[]) => void;
  answerQuestion: (index: number, answer: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  startQuiz: () => void;
  endQuiz: () => void;
  resetQuiz: () => void;
  saveAttempt: () => void;
  setIsGenerating: (isGenerating: boolean) => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      topic: "",
      difficulty: "Medium",
      numQuestions: 5,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      isGenerating: false,
      history: [],
      startTime: null,
      endTime: null,
      isOverclocked: false,
      isVoiceEnabled: true,
      aiReaction: "none",
      appTheme: "dark",
      challengeId: null,

      setChallengeId: (challengeId) => set({ challengeId }),
      setAppTheme: (theme) => {
        set({ appTheme: theme });
        if (theme === "light") {
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      },
      setAiReaction: (aiReaction) => set({ aiReaction }),
      toggleVoice: () => set((state) => ({ isVoiceEnabled: !state.isVoiceEnabled })),
      setOverclocked: (val) => set({ isOverclocked: val }),
      setConfig: (config) => set({ ...config }),
      setQuestions: (questions) => set({ questions }),
      answerQuestion: (index, answer) =>
        set((state) => ({ answers: { ...state.answers, [index]: answer } })),
      nextQuestion: () =>
        set((state) => ({
          currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1),
        })),
      prevQuestion: () =>
        set((state) => ({
          currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
        })),
      startQuiz: () => set({ currentQuestionIndex: 0, answers: {}, startTime: Date.now(), endTime: null }),
      endQuiz: () => set({ endTime: Date.now() }),
      deleteHistoryItem: (id) => set((state) => ({ history: state.history.filter(h => h.id !== id) })),
      clearHistory: () => set({ history: [] }),
      updateLatestAttemptChallengeId: (challengeId) => set((state) => {
        if (state.history.length === 0) return state;
        const updated = [...state.history];
        updated[0] = { ...updated[0], challengeId };
        return { history: updated };
      }),
      resetQuiz: () => set({ questions: [], currentQuestionIndex: 0, answers: {}, startTime: null, endTime: null, challengeId: null }),
      saveAttempt: () =>
        set((state) => {
          if (state.questions.length === 0) return state;
          
          let score = 0;
          state.questions.forEach((q, i) => {
            if (q.type === "fill_blank"
              ? state.answers[i]?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()
              : state.answers[i] === q.correctAnswer) score++;
          });

          const attempt: QuizAttempt = {
            id: crypto.randomUUID(),
            topic: state.topic,
            difficulty: state.difficulty,
            date: new Date().toISOString(),
            score,
            totalQuestions: state.questions.length,
            timeTaken: state.endTime && state.startTime ? Math.floor((state.endTime - state.startTime) / 1000) : 0,
            challengeId: state.challengeId ?? undefined,
            questions: [...state.questions],
            userAnswers: { ...state.answers },
          };

          const newHistory = [attempt, ...state.history];
          
          // Cap total items at 20, drop heavy nested arrays for items beyond top 3
          const optimizedHistory = newHistory.slice(0, 20).map((h, i) => {
            if (i >= 3) return { ...h, questions: undefined, userAnswers: undefined };
            return h;
          });

          return { history: optimizedHistory };
        }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
    }),
    {
      name: "knowledge-lab-storage",
      partialize: (state) => ({ history: state.history, appTheme: state.appTheme, isVoiceEnabled: state.isVoiceEnabled }),
    }
  )
);
