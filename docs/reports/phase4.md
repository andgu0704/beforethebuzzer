# Phase 4 report: content and balance

## Content

| Content               | Phase 1 | Now | Plan's minimum |
| --------------------- | ------- | --- | -------------- |
| Events                | 18      | 72  | 60             |
| Key-moment situations | 12      | 46  | 40             |
| Traits                | 32      | 32  | 25             |
| Social templates      | 34      | 164 | 150            |
| Delayed consequences  | 5       | 21  | —              |

**Coverage**

- Every event category and all three stages (high school, college, draft prospect) have cards;
  each stage has at least eight.
- About 25 choices are unlocked by earlier decisions, traits, relationships, coach trust or
  having an agent. The app shows these with a "Because you…" badge built from the earlier
  decision's timeline line.
- Several cards chain together: a rivalry feud comes back as a rematch, a headache follows
  playing hurt, team doctors ask about the medical file, and declining the national team brings
  a backlash card.
- 16 social posts are tied to the cards that cause them.

**Key moments and clips**

- The key moments cover late shots, defensive stops for every playing style, and rivalry,
  international, tournament, exhibition and showcase games.
- Four clip templates were added for them: floater, put-back, last-second heave and free
  throws.
- The engine now saves one moment for the final seconds of close games, so late-game situations
  actually appear. It also emits the `clutchMiss`, `draftRise`, `draftFall` and `quietWeek`
  social triggers, which had templates but never fired.

**Checks**

- `src/content/content.test.ts` asserts the minimum counts, at least eight events per stage
  and all fourteen categories, on top of the existing integrity checks: references, text for
  every key, and the real-name deny-lists.
- A read-through removed repeated phrasing ("eleven", "forty", "anyway", "mostly", the same
  relatives) and checked that no `{param}` placeholder is ever left in the text.
- Effects stay the same size as Phase 1's: skill changes of 0.6 or less, and draft-stock
  changes of 0.5 or less.

## Balance

The full report is `docs/balance/phase4.md` (seed `phase4`, 60 careers per bot, two league
seasons). **Every metric with a target is inside its band**:

| Bot    | Top five         | First round     | Median pick | Undrafted |
| ------ | ---------------- | --------------- | ----------- | --------- |
| Casual | 1.7% (band 0–3%) | 20.0% (12–35%)  | 53 (31–61)  | 43.3%     |
| Expert | 40.0% (20–40%)   | 71.7% (70–100%) | 8           | 8.3%      |
| Naive  | 0%               | 3.3%            | 61          | 88.3%     |

In Phase 1, casual top five (3.3%), expert top five (11.7%) and expert first round (51.7%) were
out of band. The college and pro league metrics stay in band.

At 60 careers a share has a standard error of about six points, so the expert sits right at the
edges of its bands here. A 100-career run on another seed gave casual 1.0% top five, 21% first
round and median 53, and expert 32% top five and 80% first round, so the centre of each
distribution is well inside the targets.

**What changed**

- **Expert bot plays on visible information only.** It no longer reads hidden ceilings: it
  trains by position weight and moves off skills that show no skill-up in the feed for 16 weeks.
- **Expert bot times the draft decision.** It declares as a freshman only for a projected
  top-four pick, as a sophomore for top eight and as a junior for the first round, and withdraws
  on the same marks. Replaying each decision both ways showed the old bot left school too early.
- **Scouting rewards how a career is played.** Production is weighted 0.45, current ability
  0.40 and the ceiling estimate 0.15 (was 0.20 / 0.44 / 0.36). The youth premium is 1.0 a year
  (was 1.6).
- **Draft stock swings less.** Big-game moments move it +0.15 / −0.10 and a tournament game at
  most ±0.5, and only 65% carries into the next season.
- **The hidden potential roll is narrower:** normal(22.5, 4), clamped 15–38 (was normal(21, 6),
  12–40). This mostly removes the rare elite roll that made a casual freshman a top-five pick.
- **Tests:** a new `progress.test.ts` covers stock fading, quiet weeks and the final-seconds
  window.
