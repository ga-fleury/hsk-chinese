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

/** A word in a Phrase that falls outside HSK 1: given to the learner, never tested. */
export interface Gloss {
  word: string;
  pinyin: string;
  meaning: string;
}

export interface Phrase {
  id: number;
  zh: string;
  pinyin: string;
  en: string;
  theme: string;
  /** Every answer counted correct, canonical form first. */
  accept: string[];
  glosses: Gloss[];
  source: 'authored' | 'tatoeba';
  /** Tatoeba sentence ids, for CC-BY attribution. */
  ref?: string[];
  /** HSK 1 Word ids this Phrase uses; drives progress-weighted selection. */
  wordIds: number[];
}

/** Per-Phrase memory. Deliberately separate from Word SM-2 state — see ADR 0005. */
export interface PhraseProgress {
  seen: number;
  correct: number;
  streak: number;
  lastWrong: boolean;
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
  phraseProgress: Record<number, PhraseProgress>;
}
