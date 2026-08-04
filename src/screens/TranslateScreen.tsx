import * as Speech from 'expo-speech';
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PHRASES, THEMES } from '../data/phrases';
import { useStore } from '../store/store';
import { colors } from '../theme';
import { closestAnswer, isCorrect, pickPhrases, unstudiedCount } from '../translate/grade';
import type { Phrase } from '../types';

const PHRASES_PER_SESSION = 10;

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'zh-CN', rate: 0.85 });
}

export default function TranslateScreen() {
  const { state, recordAttempt } = useStore();
  const [session, setSession] = useState<Phrase[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [verdict, setVerdict] = useState<null | { correct: boolean; overridden: boolean }>(null);
  const [score, setScore] = useState(0);

  const start = useCallback(
    (themeKey: string | null) => {
      const pool = themeKey ? PHRASES.filter((p) => p.theme === themeKey) : PHRASES;
      setSession(pickPhrases(pool, state.phraseProgress, state.progress, PHRASES_PER_SESSION));
      setIndex(0);
      setAnswer('');
      setVerdict(null);
      setScore(0);
    },
    [state.phraseProgress, state.progress],
  );

  const phrase = session?.[index];
  const newWords = useMemo(
    () => (phrase ? unstudiedCount(phrase, state.progress) : 0),
    [phrase, state.progress],
  );

  if (!session) {
    const done = Object.keys(state.phraseProgress).length;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.pad}>
        <Text style={styles.title}>Translate</Text>
        <Text style={styles.sub}>
          Read the English, type it in Chinese characters. {PHRASES.length} phrases · {done} practised
        </Text>
        <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]} onPress={() => start(null)}>
          <Text style={styles.ctaText}>Mixed · start</Text>
        </Pressable>
        <Text style={styles.sectionLabel}>Or pick a theme</Text>
        {THEMES.map((t) => {
          const n = PHRASES.filter((p) => p.theme === t.key).length;
          return (
            <Pressable
              key={t.key}
              style={({ pressed }) => [styles.themeCard, pressed && styles.pressed]}
              onPress={() => start(t.key)}
            >
              <Text style={styles.themeTitle}>{t.label}</Text>
              <Text style={styles.themeCount}>{n}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  if (!phrase) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.doneEmoji}>{score >= session.length * 0.8 ? '🏆' : '💪'}</Text>
        <Text style={styles.title}>
          {score}/{session.length}
        </Text>
        <Text style={styles.sub}>translated correctly</Text>
        <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]} onPress={() => start(null)}>
          <Text style={styles.ctaText}>Another round</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => setSession(null)}>
          <Text style={styles.linkText}>Back to themes</Text>
        </Pressable>
      </View>
    );
  }

  const check = () => {
    if (!answer.trim()) return;
    const correct = isCorrect(phrase, answer);
    setVerdict({ correct, overridden: false });
    if (correct) setScore((s) => s + 1);
  };

  const override = () => {
    setVerdict({ correct: true, overridden: true });
    setScore((s) => s + 1);
  };

  const next = () => {
    if (verdict) recordAttempt(phrase.id, verdict.correct);
    setIndex((i) => i + 1);
    setAnswer('');
    setVerdict(null);
  };

  const expected = verdict && !verdict.correct ? closestAnswer(phrase, answer) : phrase.zh;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={8}
    >
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.progress}>
          {index + 1} / {session.length}
        </Text>

        <View style={styles.promptCard}>
          <Text style={styles.promptText}>{phrase.en}</Text>
          {phrase.glosses.length > 0 && (
            <View style={styles.glossBox}>
              {phrase.glosses.map((g) => (
                <Text key={g.word} style={styles.glossText}>
                  <Text style={styles.glossWord}>{g.word}</Text>
                  <Text style={styles.glossPinyin}> {g.pinyin}</Text> — {g.meaning}
                </Text>
              ))}
            </View>
          )}
          {!verdict && newWords > 0 && (
            <Text style={styles.newNote}>
              contains {newWords} word{newWords === 1 ? '' : 's'} you haven't studied yet
            </Text>
          )}
        </View>

        <TextInput
          style={[
            styles.input,
            verdict?.correct && styles.inputRight,
            verdict && !verdict.correct && styles.inputWrong,
          ]}
          value={answer}
          onChangeText={setAnswer}
          placeholder="用中文写…"
          placeholderTextColor={colors.inkSoft}
          editable={!verdict}
          autoCorrect={false}
          autoCapitalize="none"
          onSubmitEditing={check}
          returnKeyType="done"
        />

        {!verdict ? (
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.pressed, !answer.trim() && styles.ctaDim]}
            onPress={check}
            disabled={!answer.trim()}
          >
            <Text style={styles.ctaText}>Check</Text>
          </Pressable>
        ) : (
          <View>
            <View style={[styles.verdictCard, verdict.correct ? styles.verdictRight : styles.verdictWrong]}>
              <Text style={styles.verdictLabel}>
                {verdict.overridden ? '✓ Counted correct' : verdict.correct ? '✓ Correct' : '✗ Not quite'}
              </Text>
              <Pressable onPress={() => speak(expected)} hitSlop={10}>
                <Text style={styles.answerZh}>
                  {expected} <Text style={styles.speaker}>🔊</Text>
                </Text>
              </Pressable>
              <Text style={styles.answerPinyin}>{phrase.pinyin}</Text>
              {phrase.accept.length > 1 && (
                <Text style={styles.alsoAccepted}>
                  also accepted: {phrase.accept.filter((a) => a !== expected).join('   ')}
                </Text>
              )}
            </View>

            {!verdict.correct && (
              <Pressable style={styles.override} onPress={override}>
                <Text style={styles.overrideText}>My answer was right — count it</Text>
              </Pressable>
            )}

            <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]} onPress={next}>
              <Text style={styles.ctaText}>{index + 1 === session.length ? 'Finish' : 'Next'}</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.link} onPress={() => setSession(null)}>
          <Text style={styles.linkText}>End session</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 20, paddingBottom: 40 },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 14, color: colors.inkSoft, marginTop: 4, marginBottom: 18, textAlign: 'center' },
  sectionLabel: { fontSize: 13, color: colors.inkSoft, marginTop: 22, marginBottom: 10 },
  themeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  themeTitle: { fontSize: 16, color: colors.ink },
  themeCount: { fontSize: 13, color: colors.inkSoft },
  progress: { fontSize: 15, color: colors.inkSoft, marginBottom: 12 },
  promptCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 14,
  },
  promptText: { fontSize: 24, color: colors.ink, lineHeight: 32 },
  glossBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  glossText: { fontSize: 14, color: colors.inkSoft },
  glossWord: { fontSize: 17, color: colors.ink },
  glossPinyin: { color: colors.accent, fontWeight: '600' },
  newNote: { fontSize: 12, color: colors.gold, marginTop: 12 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 26,
    color: colors.ink,
    marginBottom: 14,
  },
  inputRight: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  inputWrong: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaDim: { opacity: 0.4 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  verdictCard: { borderRadius: 14, padding: 16, marginBottom: 12 },
  verdictRight: { backgroundColor: colors.greenSoft },
  verdictWrong: { backgroundColor: colors.accentSoft },
  verdictLabel: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  answerZh: { fontSize: 30, color: colors.ink },
  speaker: { fontSize: 20 },
  answerPinyin: { fontSize: 16, color: colors.accent, fontWeight: '600', marginTop: 4 },
  alsoAccepted: { fontSize: 13, color: colors.inkSoft, marginTop: 10 },
  override: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.card,
  },
  overrideText: { color: colors.blue, fontSize: 14, fontWeight: '600' },
  link: { marginTop: 18, alignItems: 'center' },
  linkText: { color: colors.blue, fontSize: 15 },
  doneEmoji: { fontSize: 56, marginBottom: 8 },
});
