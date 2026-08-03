import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WORDS } from '../data/words';
import { isKnown } from '../srs/sm2';
import { useStore } from '../store/store';
import { colors } from '../theme';

function Stat({ label, value, tint }: { label: string; value: string | number; tint?: string }) {
  return (
    <View style={[styles.stat, tint ? { backgroundColor: tint } : null]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen({ onStartReview }: { onStartReview: () => void }) {
  const { state, dueIds, newIds, setNewPerDay, resetProgress } = useStore();

  // Alert.alert is a no-op on react-native-web, so confirm with a second tap instead.
  const [confirmingReset, setConfirmingReset] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const onResetPress = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      resetTimer.current = setTimeout(() => setConfirmingReset(false), 4000);
      return;
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setConfirmingReset(false);
    resetProgress();
  };

  const started = Object.keys(state.progress).length;
  const known = Object.values(state.progress).filter(isKnown).length;
  const { answered, correct } = state.quizStats;
  const accuracy = answered === 0 ? '—' : `${Math.round((correct / answered) * 100)}%`;
  const toReview = dueIds.length + newIds.length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>你好!</Text>
      <Text style={styles.subtitle}>HSK 1 · {WORDS.length} words (HSK 3.0 Band 1)</Text>

      <View style={styles.statRow}>
        <Stat label="due today" value={dueIds.length} tint={colors.accentSoft} />
        <Stat label="new today" value={newIds.length} tint={colors.blueSoft} />
      </View>
      <View style={styles.statRow}>
        <Stat label="words started" value={`${started}/${WORDS.length}`} />
        <Stat label="known" value={known} tint={colors.greenSoft} />
      </View>
      <View style={styles.statRow}>
        <Stat label="quiz answers" value={answered} />
        <Stat label="quiz accuracy" value={accuracy} />
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.pressed, toReview === 0 && styles.ctaDone]}
        onPress={onStartReview}
        disabled={toReview === 0}
      >
        <Text style={styles.ctaText}>
          {toReview === 0 ? 'All done for today 🎉' : `Review ${toReview} card${toReview === 1 ? '' : 's'}`}
        </Text>
      </Pressable>

      <View style={styles.settings}>
        <Text style={styles.settingsLabel}>New words per day</Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => {
              const n = state.settings.newPerDay;
              setNewPerDay(n > 50 ? n - 25 : Math.max(0, n - 5));
            }}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.stepValue}>{state.settings.newPerDay}</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => {
              const n = state.settings.newPerDay;
              setNewPerDay(Math.min(200, n >= 50 ? n + 25 : n + 5));
            }}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={[styles.reset, confirmingReset && styles.resetConfirming]} onPress={onResetPress}>
        <Text style={[styles.resetText, confirmingReset && styles.resetTextConfirming]}>
          {confirmingReset ? 'Tap again to erase all progress' : 'Reset all progress'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 40, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 15, color: colors.inkSoft, marginTop: 4, marginBottom: 20 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  ctaDone: { backgroundColor: colors.green },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  settings: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsLabel: { fontSize: 16, color: colors.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, color: colors.ink, lineHeight: 24 },
  stepValue: { fontSize: 18, fontWeight: '700', color: colors.ink, minWidth: 28, textAlign: 'center' },
  reset: { marginTop: 32, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  resetConfirming: { backgroundColor: colors.accentSoft },
  resetText: { color: colors.wrong, fontSize: 14 },
  resetTextConfirming: { fontWeight: '700' },
});
