# SM-2 spaced-repetition scheduler

Flashcard reviews are scheduled with the classic SM-2 algorithm (Anki-style Again/Hard/Good/Easy grades, per-word ease factor and growing intervals). Leitner boxes were rejected as too coarse and FSRS as too complex to implement and tune for a personal app. Scheduling state (ease, interval, due date) is persisted per word, so changing algorithms later invalidates that state. Quizzes are practice-only and never touch SM-2 state — only flashcard reviews do.
