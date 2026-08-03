# HSK Chinese 汉语

A React Native (Expo) app for learning the **HSK 1 vocabulary — HSK 3.0 Band 1, 506 simplified-character words**.

## Features

- **🎴 Review** — flashcards scheduled by the classic **SM-2** algorithm (Again / Hard / Good / Easy). New words are introduced at a configurable daily rate (default 10/day).
- **❓ Quiz** — four practice modes: 汉字→English, English→汉字, Pīnyīn→汉字, and **listening** (the word is spoken via Chinese text-to-speech). Quizzes never touch your review schedule.
- **📖 Words** — browse and search all 506 words by hanzi, tone-insensitive pinyin (`nihao` finds 你好), or English. Tap any row to hear it.
- **🏠 Home** — due/new counts, words known, quiz accuracy, and settings.

All progress is stored on-device (AsyncStorage). No accounts, no backend, works offline (except text-to-speech voices, which depend on your device).

## Running it

```sh
npm install
npx expo start
```

Scan the QR code with the [Expo Go](https://expo.dev/go) app on your phone (or press `i` / `a` for a simulator).

## Design docs

This project was planned with the [`grill-with-docs`](https://github.com/mattpocock/skills) skill — decisions were interrogated one at a time and captured as they resolved:

- [`CONTEXT.md`](./CONTEXT.md) — the project glossary (ubiquitous language)
- [`docs/adr/`](./docs/adr) — architectural decision records: [HSK 3.0 Band 1 vocabulary](./docs/adr/0001-hsk30-band1-vocabulary.md), [SM-2 scheduler](./docs/adr/0002-sm2-scheduler.md), [on-device persistence](./docs/adr/0003-on-device-persistence.md), [Expo managed workflow](./docs/adr/0004-expo-managed-workflow.md)

## Vocabulary data

`src/data/hsk1.json` is derived from [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (MIT © Yanis Zafirópulos), which itself draws on CC-CEDICT. For 75 words with multiple readings (e.g. 好 hǎo/hào, 还 hái/huán), the beginner-intended reading and a concise gloss were hand-curated.
