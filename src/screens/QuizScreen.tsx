import * as Speech from 'expo-speech';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WORDS } from '../data/words';
import { useStore } from '../store/store';
import { colors } from '../theme';
import type { Word } from '../types';

type Mode = 'hanzi-english' | 'english-hanzi' | 'pinyin-hanzi' | 'listening';

const MODES: { mode: Mode; title: string; desc: string }[] = [
  { mode: 'hanzi-english', title: '汉字 → English', desc: 'Read the character, pick the meaning' },
  { mode: 'english-hanzi', title: 'English → 汉字', desc: 'Read the meaning, pick the character' },
  { mode: 'pinyin-hanzi', title: 'Pīnyīn → 汉字', desc: 'Read the pinyin, pick the character' },
  { mode: 'listening', title: '🔊 Listening', desc: 'Hear the word, pick the meaning' },
];

const QUESTIONS_PER_SESSION = 10;
const CHOICES = 4;

interface Question {
  word: Word;
  choices: Word[];
}

function sample<T>(arr: T[], n: number, exclude?: T): T[] {
  const pool = exclude ? arr.filter((x) => x !== exclude) : [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

function makeQuestions(): Question[] {
  return sample(WORDS, QUESTIONS_PER_SESSION).map((word) => {
    const distractors = sample(WORDS, CHOICES - 1, word);
    return { word, choices: sample([word, ...distractors], CHOICES) };
  });
}

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'zh-CN', rate: 0.85 });
}

export default function QuizScreen() {
  const { recordQuizAnswer } = useStore();
  const [mode, setMode] = useState<Mode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  const start = useCallback((m: Mode) => {
    const qs = makeQuestions();
    setMode(m);
    setQuestions(qs);
    setIndex(0);
    setPicked(null);
    setSessionCorrect(0);
    if (m === 'listening') speak(qs[0].word.hanzi);
  }, []);

  if (!mode) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Quiz</Text>
        <Text style={styles.sub}>{QUESTIONS_PER_SESSION} questions · practice only, doesn't affect your review schedule</Text>
        {MODES.map(({ mode: m, title, desc }) => (
          <Pressable
            key={m}
            style={({ pressed }) => [styles.modeCard, pressed && styles.pressed]}
            onPress={() => start(m)}
          >
            <Text style={styles.modeTitle}>{title}</Text>
            <Text style={styles.modeDesc}>{desc}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  if (index >= questions.length) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.doneEmoji}>{sessionCorrect >= questions.length * 0.8 ? '🏆' : '💪'}</Text>
        <Text style={styles.title}>
          {sessionCorrect}/{questions.length}
        </Text>
        <Text style={styles.sub}>correct</Text>
        <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]} onPress={() => start(mode)}>
          <Text style={styles.ctaText}>Play again</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => setMode(null)}>
          <Text style={styles.linkText}>Change mode</Text>
        </Pressable>
      </View>
    );
  }

  const q = questions[index];
  const answered = picked !== null;

  const prompt =
    mode === 'hanzi-english' ? q.word.hanzi : mode === 'english-hanzi' ? q.word.english : mode === 'pinyin-hanzi' ? q.word.pinyin : '🔊';
  const choiceText = (w: Word) => (mode === 'hanzi-english' || mode === 'listening' ? w.english : w.hanzi);

  const onPick = (i: number) => {
    if (answered) return;
    const correct = q.choices[i].id === q.word.id;
    setPicked(i);
    setSessionCorrect((c) => c + (correct ? 1 : 0));
    recordQuizAnswer(correct);
  };

  const next = () => {
    setPicked(null);
    setIndex((i) => i + 1);
    const nq = questions[index + 1];
    if (mode === 'listening' && nq) speak(nq.word.hanzi);
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.progress}>
        {index + 1} / {questions.length}
      </Text>
      <Pressable
        style={styles.promptCard}
        onPress={() => (mode === 'listening' || mode === 'hanzi-english') && speak(q.word.hanzi)}
      >
        <Text style={[styles.promptText, mode === 'english-hanzi' && styles.promptTextSmall]} adjustsFontSizeToFit numberOfLines={3}>
          {prompt}
        </Text>
        {mode === 'listening' && <Text style={styles.tapHint}>tap to replay</Text>}
      </Pressable>

      {q.choices.map((w, i) => {
        const isCorrect = w.id === q.word.id;
        const bg = !answered ? colors.card : isCorrect ? colors.greenSoft : i === picked ? colors.accentSoft : colors.card;
        return (
          <Pressable key={w.id} style={[styles.choice, { backgroundColor: bg }]} onPress={() => onPick(i)}>
            <Text style={styles.choiceText}>{choiceText(w)}</Text>
            {answered && isCorrect && (
              <Text style={styles.choiceDetail}>
                {q.word.hanzi} · {q.word.pinyin}
              </Text>
            )}
          </Pressable>
        );
      })}

      {answered && (
        <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]} onPress={next}>
          <Text style={styles.ctaText}>{index + 1 === questions.length ? 'Finish' : 'Next'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 20 },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 14, color: colors.inkSoft, marginTop: 4, marginBottom: 18 },
  modeCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  modeTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  modeDesc: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  progress: { fontSize: 15, color: colors.inkSoft, marginBottom: 12 },
  promptCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 34,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  promptText: { fontSize: 56, color: colors.ink, textAlign: 'center' },
  promptTextSmall: { fontSize: 24, color: colors.ink },
  tapHint: { fontSize: 13, color: colors.inkSoft, marginTop: 8 },
  choice: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  choiceText: { fontSize: 17, color: colors.ink },
  choiceDetail: { fontSize: 14, color: colors.inkSoft, marginTop: 4 },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 6,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { marginTop: 16 },
  linkText: { color: colors.blue, fontSize: 15 },
  pressed: { opacity: 0.8 },
  doneEmoji: { fontSize: 56, marginBottom: 8 },
});
