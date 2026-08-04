import type { Phrase } from '../types';
import raw from './phrases.json';

/**
 * Everyday Phrases for Translation. Two provenances (see ADR 0005):
 * hand-authored thematic sentences, plus sentences curated from Tatoeba
 * (CC-BY 2.0 FR) — those carry `ref` sentence ids for attribution.
 */
export const PHRASES: Phrase[] = raw as Phrase[];

export const THEMES: { key: string; label: string }[] = [
  { key: 'greetings', label: 'Greetings' },
  { key: 'family', label: 'Family' },
  { key: 'time', label: 'Time & dates' },
  { key: 'food', label: 'Food & drink' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'directions', label: 'Places & directions' },
  { key: 'daily', label: 'Daily life' },
  { key: 'weather', label: 'Weather' },
  { key: 'school', label: 'School & work' },
  { key: 'feelings', label: 'Feelings & health' },
];
