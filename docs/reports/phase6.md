# Phase 6 report: a career you play

Feedback on the finished build was blunt:

- You had no attachment to the player, and too little was interactive.
- You couldn't upgrade the player yourself.
- Being drafted ended the game.
- It was unclear who you were playing.
- Games happened off-screen.

This phase answers each point.

## What was built

**The pro career.** Getting drafted no longer ends the game.

- You join your team on the rookie deal and play 82-game seasons, the playoffs and the
  league's awards: MVP, Rookie of the Year, and titles for your team.
- The coach sets your role each week, and your salary is paid weekly.
- When a deal runs out, your team's offer sits alongside those of the other teams that want
  you. Each offer shows years, salary and the role that team sees for you.
- From 33, every summer asks whether you want another season. Nobody plays past 40.
- The career ends at retirement, and the career card gains a pro line, titles and awards.
- Undrafted players can try out at a pro camp instead of stopping.
- Saves move to format 2, and a career saved on draft night carries on into the pros.
- 22 new story events cover the pro years, from rookie initiation to life after basketball.

**Next game, not next week.**

- Home shows the next game plainly: the opponent, home or away, when, and both records.
- The main button plays to it.
- Weeks with no game still say "Next week".

**Watching the game.** Your game opens on its own screen.

- **Before tip-off:** both teams with their records, the venue, the competition and your
  role. You also pick how you'll play it: within the team, looking for your shot, setting up
  teammates, or locking down on defence. The approach changes your usage and ratings in the
  sim, and the coach and teammates react to how you played it.
- **During the game:** a scoreboard with the visitor and home sides, team fouls, the bonus
  and the ball, plus a detailed play-by-play in team colours with your plays highlighted.
- **On the floor:** a shot chart of every make and miss, and both lineups with faces,
  positions, points and fouls.
- **Controls:** pause, 1×, 2× or 4×, and skip ahead.
- **Key moments** stop the clock for your call.
- **At the end:** the final shows your line, the skill points the game earned, a word from
  the coach and the box score.

The engine now records more in each game's play log, without touching its random numbers:

- the shot type;
- the opponent involved in a steal or block;
- lineup changes.

**The skill check.** Key moments now end in a skill check.

- After you pick a move, a banner names it ("Make the outside shot!") next to your rating
  for it.
- A marker sweeps along a bar, and you release it in the green zone.
- Better players get a wider zone.
- Perfect timing adds about +0.6 in log-odds, about as much as a hot streak, and bad timing
  costs the same.
- It can be switched off in Settings, and it's skipped under VoiceOver.

**Upgrading yourself.** Train now opens on your skills.

- You see your points to spend, each skill's level, how much room it has, and the price of
  +1. The rise shows at once and counts in the next game.
- Practice and games earn the points: a good game is worth two or three.
- Ageing still takes skill away on its own, and a little growth still comes from simply
  playing.
- The Train tab shows your unspent points.

## Checked

- **Unit tests:** 102 across 19 files. New ones cover:
  - pro careers: turning pro, a pro season's games and pay, a free-agency summer that moves
    you, retirement by choice and at 40, and reviving a format-1 save;
  - skill points;
  - the approach;
  - the game's start and end stops;
  - the skill check's maths;
  - a translator without `Intl.PluralRules`.
- **In the browser:**
  - a first game on the live screen;
  - a skill check;
  - upgrades;
  - pro saves at three points: mid-season, a free-agency summer, and a veteran's summer.
    `scripts/screens/pro-save.ts` writes these saves without playing four college seasons
    first.
- **On the iOS Simulator** (iPhone 17 Pro Max, light):
  - the release build compiles and runs;
  - the opening flow passes, including the live game and an upgrade.
- **Bugs found on iOS and fixed:**
  - a launch crash: Hermes has no `Intl.PluralRules`;
  - a decision sheet that drew blank: a form sheet in release builds;
  - a family-name field hidden under the keyboard at the largest text size.

## Balance

Growth now comes from points you spend. Practice earns 0.18 points per block, a full game's
minutes about 0.9 (plus more for a good game or a win), and +1 costs 3 to 15 points as a
skill climbs. A young player gains about 30 skill points a year, the old pace.

| Seed `phase6`, 60 careers each | Top five | First round | Median pick | Target bands                         |
| ------------------------------ | -------- | ----------- | ----------- | ------------------------------------ |
| Naive                          | 0%       | 0%          | 61          | none                                 |
| Casual                         | 3.3%     | 28.3%       | 45          | top five 0–3%, first round 12–35%    |
| Expert                         | 23.3%    | 78.3%       | 16          | top five 20–40%, first round 70–100% |

- **Casual top five:** 2 careers of 60, one above the band.
- **Expert on a second seed** (`phase6b`): 43.3% top five and 91.7% first round.
- **Spending and noise:** points spent with no per-skill diminishing returns grow a focused
  player faster than the old practice did. Income was cut twice for that reason. After the
  cuts, the seed matters more than the economy: across both seeds the expert top-five rate
  averages about 33%, in the middle of its band.
- **Casual spending:** the casual bot spends half by position and half by taste. Spending
  purely by position made it as efficient as the expert.
- **Full report:** `docs/balance/phase6.md`.

## Not done here: needs a device and you

The real-device checks listed in the phase 5 report still apply:

- 60 fps;
- haptics;
- VoiceOver;
- the largest Dynamic Type sizes.

Two things from this phase can only be judged by hand:

- how the skill check's timing feels under a thumb;
- whether 2× is the right default speed.
