import type { Word } from '../types';
import raw from './hsk1.json';

/** HSK 3.0 Band 1 vocabulary (simplified), 506 entries. See ADR 0001. */
export const WORDS: Word[] = raw as Word[];

export const wordById = new Map(WORDS.map((w) => [w.id, w]));
