import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import BrowseScreen from './src/screens/BrowseScreen';
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import TranslateScreen from './src/screens/TranslateScreen';
import { StoreProvider, useStore } from './src/store/store';
import { colors } from './src/theme';

type Tab = 'home' | 'review' | 'quiz' | 'translate' | 'browse';

const TABS: { tab: Tab; label: string; icon: string }[] = [
  { tab: 'home', label: 'Home', icon: '🏠' },
  { tab: 'review', label: 'Review', icon: '🎴' },
  { tab: 'quiz', label: 'Quiz', icon: '❓' },
  { tab: 'translate', label: 'Translate', icon: '✍️' },
  { tab: 'browse', label: 'Words', icon: '📖' },
];

function Root() {
  const [tab, setTab] = useState<Tab>('home');
  const { loaded } = useStore();

  if (!loaded) {
    return (
      <View style={[styles.app, styles.center]}>
        <Text style={styles.loading}>汉</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.app} edges={['top', 'bottom']}>
      <View style={styles.body}>
        {tab === 'home' && <HomeScreen onStartReview={() => setTab('review')} />}
        {tab === 'review' && <ReviewScreen />}
        {tab === 'quiz' && <QuizScreen />}
        {tab === 'translate' && <TranslateScreen />}
        {tab === 'browse' && <BrowseScreen />}
      </View>
      <View style={styles.tabBar}>
        {TABS.map(({ tab: t, label, icon }) => (
          <Pressable key={t} style={styles.tabBtn} onPress={() => setTab(t)}>
            <Text style={[styles.tabIcon, tab !== t && styles.tabInactive]}>{icon}</Text>
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  loading: { fontSize: 64, color: colors.accent },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingTop: 6,
    paddingBottom: 2,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIcon: { fontSize: 22 },
  tabInactive: { opacity: 0.35 },
  tabLabel: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  tabLabelActive: { color: colors.accent, fontWeight: '700' },
});
