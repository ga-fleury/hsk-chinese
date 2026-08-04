# Translation is a separate exercise from Quiz

Translation shows an English Phrase and has the learner type it in Chinese characters, rather than selecting an answer. It is deliberately **not** modelled as a fifth Quiz mode: Quiz keeps its precise meaning (multiple-choice, scored right/wrong), and Translation gets its own tab, its own glossary term, and its own stored progress.

## Considered options

Widening "Quiz" to cover both was rejected — the two exercises differ in input (produced vs selected), in grading (fuzzy with learner override vs exact), and in persistence (per-Phrase memory vs session counters). One term covering both would have to be vague enough to be useless.

## Consequences

- **Phrase progress does not feed SM-2.** ADR 0002's boundary holds: only flashcard Reviews move Word scheduling. Phrases carry their own lightweight memory (missed Phrases resurface sooner), so a hard Word inside an easy sentence never wrongly credits that Word.
- **Grading is auto with an override.** Chinese admits valid variants (我们/咱们, optional particles) beyond what any authored answer list anticipates. The learner can overrule a wrong verdict; without that escape hatch, auto-grading would be actively misleading.
- **Two provenances in one dataset.** Phrases are hand-authored (thematic, difficulty-ramped, in the manner of HSK 1 textbooks) *and* curated from Tatoeba (authentic native phrasing, volume). Corpus-derived Phrases are CC-BY and carry attribution; each Phrase records its source so the obligation survives future edits.
- **Words outside HSK 1 are permitted but must carry a Gloss.** Extra vocabulary buys naturalness, mirroring how HSK 1 books hand you a word they haven't taught. Glossed words are shown with the Phrase and never tested, so the dataset build fails if an un-glossed non-HSK-1 word slips in.
