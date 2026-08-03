import * as Speech from 'expo-speech';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { WORDS } from '../data/words';
import { isKnown } from '../srs/sm2';
import { useStore } from '../store/store';
import { colors } from '../theme';
import type { Word } from '../types';

/** Strip tone marks so "nihao" matches "nǐ hǎo". */
function normalizePinyin(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ü/g, 'u')
    .replace(/\s/g, '')
    .toLowerCase();
}

export default function BrowseScreen() {
  const { state } = useStore();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return WORDS;
    const qLower = q.toLowerCase();
    const qPinyin = normalizePinyin(q);
    return WORDS.filter(
      (w) =>
        w.hanzi.includes(q) ||
        w.english.toLowerCase().includes(qLower) ||
        normalizePinyin(w.pinyin).includes(qPinyin),
    );
  }, [query]);

  const renderItem = ({ item }: { item: Word }) => {
    const p = state.progress[item.id];
    const status = !p ? null : isKnown(p) ? 'known' : 'learning';
    return (
      <Pressable
        style={styles.row}
        onPress={() => {
          Speech.stop();
          Speech.speak(item.hanzi, { language: 'zh-CN', rate: 0.85 });
        }}
      >
        <Text style={styles.hanzi}>{item.hanzi}</Text>
        <View style={styles.rowBody}>
          <Text style={styles.pinyin}>{item.pinyin}</Text>
          <Text style={styles.english} numberOfLines={2}>
            {item.english}
          </Text>
        </View>
        {status && (
          <View style={[styles.badge, status === 'known' ? styles.badgeKnown : styles.badgeLearning]}>
            <Text style={[styles.badgeText, status === 'known' ? styles.badgeTextKnown : styles.badgeTextLearning]}>
              {status}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.search}
        placeholder="Search hanzi, pinyin or English…"
        placeholderTextColor={colors.inkSoft}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <Text style={styles.count}>{results.length} words · tap a row to hear it</Text>
      <FlatList
        data={results}
        keyExtractor={(w) => String(w.id)}
        renderItem={renderItem}
        initialNumToRender={20}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 16 },
  search: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
  },
  count: { fontSize: 13, color: colors.inkSoft, marginVertical: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  hanzi: { fontSize: 28, color: colors.ink, minWidth: 64 },
  rowBody: { flex: 1 },
  pinyin: { fontSize: 15, fontWeight: '600', color: colors.accent },
  english: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeKnown: { backgroundColor: colors.greenSoft },
  badgeLearning: { backgroundColor: colors.blueSoft },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextKnown: { color: colors.green },
  badgeTextLearning: { color: colors.blue },
});
