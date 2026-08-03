import * as Speech from 'expo-speech';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { wordById } from '../data/words';
import { useStore } from '../store/store';
import { colors } from '../theme';
import type { Grade } from '../types';

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'zh-CN', rate: 0.85 });
}

const GRADES: { grade: Grade; label: string; hint: string; bg: string }[] = [
  { grade: 'again', label: 'Again', hint: '<1d', bg: colors.wrong },
  { grade: 'hard', label: 'Hard', hint: '', bg: colors.gold },
  { grade: 'good', label: 'Good', hint: '', bg: colors.blue },
  { grade: 'easy', label: 'Easy', hint: '', bg: colors.green },
];

export default function ReviewScreen() {
  const { state, dueIds, newIds, gradeWord } = useStore();
  const [revealed, setRevealed] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  // Recomputed each grade: "again" keeps a word due today, so it cycles back automatically.
  const queue = useMemo(() => [...dueIds, ...newIds], [dueIds, newIds]);
  const currentId = queue[0];
  const word = currentId !== undefined ? wordById.get(currentId) : undefined;
  const isNew = word ? !state.progress[word.id] : false;

  if (!word) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>Nothing to review</Text>
        <Text style={styles.doneSub}>
          {doneCount > 0
            ? `You finished ${doneCount} card${doneCount === 1 ? '' : 's'} this session.`
            : 'Come back tomorrow, or raise "new words per day" on Home.'}
        </Text>
      </View>
    );
  }

  const onGrade = (g: Grade) => {
    gradeWord(word.id, g);
    setRevealed(false);
    setDoneCount((c) => c + 1);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.remaining}>{queue.length} left</Text>
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>

      <Pressable style={styles.card} onPress={() => setRevealed(true)}>
        <Text style={styles.hanzi} adjustsFontSizeToFit numberOfLines={1}>
          {word.hanzi}
        </Text>
        {revealed ? (
          <>
            <Text style={styles.pinyin}>{word.pinyin}</Text>
            <Text style={styles.english}>{word.english}</Text>
          </>
        ) : (
          <Text style={styles.tapHint}>tap to reveal</Text>
        )}
        <Pressable style={styles.speaker} onPress={() => speak(word.hanzi)} hitSlop={12}>
          <Text style={styles.speakerText}>🔊</Text>
        </Pressable>
      </Pressable>

      {revealed ? (
        <View style={styles.gradeRow}>
          {GRADES.map(({ grade, label, bg }) => (
            <Pressable
              key={grade}
              style={({ pressed }) => [styles.gradeBtn, { backgroundColor: bg }, pressed && styles.pressed]}
              onPress={() => onGrade(grade)}
            >
              <Text style={styles.gradeText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.revealBtn, pressed && styles.pressed]}
          onPress={() => setRevealed(true)}
        >
          <Text style={styles.revealText}>Show answer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 20 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  remaining: { fontSize: 15, color: colors.inkSoft },
  newBadge: { backgroundColor: colors.blueSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText: { color: colors.blue, fontWeight: '700', fontSize: 12 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hanzi: { fontSize: 96, color: colors.ink },
  pinyin: { fontSize: 28, color: colors.accent, marginTop: 18, fontWeight: '600' },
  english: { fontSize: 18, color: colors.inkSoft, marginTop: 10, textAlign: 'center' },
  tapHint: { fontSize: 14, color: colors.border, marginTop: 24 },
  speaker: { position: 'absolute', top: 16, right: 16 },
  speakerText: { fontSize: 26 },
  revealBtn: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  revealText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  gradeRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  gradeBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  gradeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.8 },
  doneEmoji: { fontSize: 48 },
  doneTitle: { fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 12 },
  doneSub: { fontSize: 15, color: colors.inkSoft, marginTop: 8, textAlign: 'center' },
});
