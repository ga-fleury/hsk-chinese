import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { WORDS } from '../data/words';
import { isDue, newProgress, review, todayString } from '../srs/sm2';
import type { AppState, Grade } from '../types';

const STORAGE_KEY = 'hsk1:v1';

const DEFAULT_STATE: AppState = {
  progress: {},
  quizStats: { answered: 0, correct: 0 },
  settings: { newPerDay: 10 },
  introduced: { date: todayString(), count: 0 },
};

interface Store {
  state: AppState;
  loaded: boolean;
  /** Word ids due for review today (already-introduced words only). */
  dueIds: number[];
  /** Word ids that may be introduced as new cards today, respecting newPerDay. */
  newIds: number[];
  gradeWord: (id: number, grade: Grade) => void;
  recordQuizAnswer: (correct: boolean) => void;
  setNewPerDay: (n: number) => void;
  resetProgress: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) {
          const saved = JSON.parse(json) as AppState;
          setState({
            ...DEFAULT_STATE,
            ...saved,
            introduced:
              saved.introduced?.date === todayString()
                ? saved.introduced
                : { date: todayString(), count: 0 },
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const store = useMemo<Store>(() => {
    const dueIds = WORDS.filter((w) => {
      const p = state.progress[w.id];
      return p && isDue(p);
    }).map((w) => w.id);

    const remainingNew = Math.max(0, state.settings.newPerDay - state.introduced.count);
    const newIds = WORDS.filter((w) => !state.progress[w.id])
      .slice(0, remainingNew)
      .map((w) => w.id);

    return {
      state,
      loaded,
      dueIds,
      newIds,
      gradeWord: (id, grade) =>
        setState((s) => {
          const existing = s.progress[id];
          const introducing = !existing;
          const p = existing ?? newProgress();
          return {
            ...s,
            progress: { ...s.progress, [id]: review(p, grade) },
            introduced: introducing
              ? { date: todayString(), count: s.introduced.count + 1 }
              : s.introduced,
          };
        }),
      recordQuizAnswer: (correct) =>
        setState((s) => ({
          ...s,
          quizStats: {
            answered: s.quizStats.answered + 1,
            correct: s.quizStats.correct + (correct ? 1 : 0),
          },
        })),
      setNewPerDay: (n) =>
        setState((s) => ({ ...s, settings: { ...s.settings, newPerDay: n } })),
      resetProgress: () => setState({ ...DEFAULT_STATE, introduced: { date: todayString(), count: 0 } }),
    };
  }, [state, loaded]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
