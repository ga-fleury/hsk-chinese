import type { Grade, WordProgress } from '../types';

const MIN_EASE = 1.3;
const START_EASE = 2.5;

export function todayString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return todayString(d);
}

export function newProgress(): WordProgress {
  return { reps: 0, ease: START_EASE, intervalDays: 0, due: todayString(), lapses: 0 };
}

export function isDue(p: WordProgress): boolean {
  return p.due <= todayString();
}

/** SM-2 with Anki-style grades. See ADR 0002. */
export function review(p: WordProgress, grade: Grade): WordProgress {
  let { reps, ease, intervalDays, lapses } = p;

  switch (grade) {
    case 'again':
      lapses += 1;
      reps = 0;
      ease = Math.max(MIN_EASE, ease - 0.2);
      intervalDays = 0; // relearn today
      break;
    case 'hard':
      reps += 1;
      ease = Math.max(MIN_EASE, ease - 0.15);
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
      break;
    case 'good':
      reps += 1;
      if (reps === 1) intervalDays = 1;
      else if (reps === 2) intervalDays = 6;
      else intervalDays = Math.max(intervalDays + 1, Math.round(intervalDays * ease));
      break;
    case 'easy':
      reps += 1;
      ease = ease + 0.15;
      intervalDays = Math.max(intervalDays + 2, Math.round(intervalDays * ease * 1.3));
      if (reps === 1) intervalDays = Math.max(intervalDays, 4);
      break;
  }

  return { reps, ease, intervalDays, lapses, due: addDays(intervalDays) };
}

/** A Word counts as "known" once its interval passes three weeks. */
export function isKnown(p: WordProgress): boolean {
  return p.intervalDays >= 21;
}
