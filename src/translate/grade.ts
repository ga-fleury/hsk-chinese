import type { Phrase, PhraseProgress, WordProgress } from '../types';

const PUNCT = /[。，？！、：；“”‘’（）《》…—·,.?!:;"'\s]/g;

/** Punctuation and spacing never affect the verdict — only the characters do. */
export function normalize(answer: string): string {
  return answer.replace(PUNCT, '');
}

export function isCorrect(phrase: Phrase, answer: string): boolean {
  const given = normalize(answer);
  if (!given) return false;
  return phrase.accept.some((a) => normalize(a) === given);
}

/** The accepted answer closest to what was typed, for showing the diff. */
export function closestAnswer(phrase: Phrase, answer: string): string {
  const given = normalize(answer);
  let best = phrase.accept[0];
  let bestScore = -1;
  for (const a of phrase.accept) {
    const cand = normalize(a);
    let shared = 0;
    for (const ch of new Set(given)) {
      if (cand.includes(ch)) shared += 1;
    }
    const score = shared - Math.abs(cand.length - given.length) * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

export function nextProgress(prev: PhraseProgress | undefined, correct: boolean): PhraseProgress {
  const p = prev ?? { seen: 0, correct: 0, streak: 0, lastWrong: false };
  return {
    seen: p.seen + 1,
    correct: p.correct + (correct ? 1 : 0),
    streak: correct ? p.streak + 1 : 0,
    lastWrong: !correct,
  };
}

/**
 * Weighted pick, favouring Phrases whose Words the learner has studied and
 * Phrases they got wrong last time, while retiring ones they keep nailing.
 * Never hard-blocks: every Phrase keeps a non-zero weight.
 */
export function pickPhrases(
  pool: Phrase[],
  phraseProgress: Record<number, PhraseProgress>,
  wordProgress: Record<number, WordProgress>,
  count: number,
): Phrase[] {
  const weightOf = (p: Phrase) => {
    const studied = p.wordIds.filter((id) => wordProgress[id]).length;
    const coverage = p.wordIds.length ? studied / p.wordIds.length : 1;
    let w = 0.5 + 2.5 * coverage;
    const pr = phraseProgress[p.id];
    if (!pr) w += 0.75;
    else {
      if (pr.lastWrong) w += 2.5;
      if (pr.streak >= 3) w *= 0.2;
    }
    return w;
  };

  const remaining = pool.map((p) => ({ p, w: weightOf(p) }));
  const picked: Phrase[] = [];
  while (picked.length < count && remaining.length) {
    const total = remaining.reduce((s, r) => s + r.w, 0);
    let r = Math.random() * total;
    let idx = remaining.length - 1;
    for (let i = 0; i < remaining.length; i++) {
      r -= remaining[i].w;
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    picked.push(remaining[idx].p);
    remaining.splice(idx, 1);
  }
  return picked;
}

/** HSK 1 Words in this Phrase the learner has not started yet. */
export function unstudiedCount(phrase: Phrase, wordProgress: Record<number, WordProgress>): number {
  return phrase.wordIds.filter((id) => !wordProgress[id]).length;
}
