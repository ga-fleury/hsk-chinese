export interface Word {
  id: number;
  hanzi: string;
  pinyin: string;
  english: string;
}

/** SM-2 scheduling state for one Word. Only flashcard Reviews mutate this. */
export interface WordProgress {
  reps: number;
  ease: number;
  intervalDays: number;
  due: string; // yyyy-mm-dd
  lapses: number;
}

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface QuizStats {
  answered: number;
  correct: number;
}

export interface Settings {
  newPerDay: number;
}

export interface AppState {
  progress: Record<number, WordProgress>;
  quizStats: QuizStats;
  settings: Settings;
  /** How many new Words were introduced on `date` (resets daily). */
  introduced: { date: string; count: number };
  /** Seed for the randomized (but stable) order in which new Words are introduced. */
  shuffleSeed: number;
}
