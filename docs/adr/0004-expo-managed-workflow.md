# Expo managed workflow, TypeScript, no navigation library

The app is an Expo managed-workflow project (runs via Expo Go, no Xcode/Android Studio) written in TypeScript. Listening mode uses on-device text-to-speech via expo-speech (zh-CN voice) instead of recorded audio — no audio assets to source for 500 words. Screen switching is hand-rolled with React state rather than react-navigation: four flat tabs don't justify the dependency footprint.
