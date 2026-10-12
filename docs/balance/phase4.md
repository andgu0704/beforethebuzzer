# Balance report

Seed `phase4` · 2 league seasons · 60 careers per policy · 605 s on 4 workers.
College engine time per in-season week (Node): median 167 ms, p90 269 ms.


## College league

| Metric | Value | Target | |
|---|---|---|---|
| Points per team game | 73.7 | 69.0–76.0 | in band |
| Points s.d. | 11.9 | 10.0–13.5 | in band |
| Possessions per team game | 70.5 | 66.0–71.5 | in band |
| Field goal % | 43.8% | 42.5%–45.5% | in band |
| Three-point % | 34.0% | 33.0%–35.5% | in band |
| Free throw % | 69.7% | 69.0%–74.0% | in band |
| Three-point attempt share | 38.3% | 36.0%–42.0% | in band |
| Turnovers per team game | 12.2 | 10.5–13.5 | in band |
| Offensive rebound % | 27.6% | 26.0%–31.0% | in band |
| Assists per made field goal | 46.5% | — |  |
| Home win % | 63.5% | 58.0%–65.0% | in band |
| Overtime rate | 1.8% | — |  |
| Margin s.d. | 18.0 | — |  |
| Best team win % (avg) | 96.8% | 80.0%–97.0% | in band |
| Worst team win % (avg) | 13.6% | 3.0%–22.0% | in band |
| Top scorer, points per game (avg) | 26.7 | 22.0–28.0 | in band |

## Pro league

| Metric | Value | Target | |
|---|---|---|---|
| Points per team game | 113 | 108–117 | in band |
| Points s.d. | 14.1 | — |  |
| Possessions per team game | 99.7 | 96.0–102 | in band |
| Field goal % | 46.8% | 45.5%–48.5% | in band |
| Three-point % | 35.6% | 34.5%–37.5% | in band |
| Free throw % | 78.6% | 75.0%–81.0% | in band |
| Three-point attempt share | 39.0% | — |  |
| Turnovers per team game | 13.4 | — |  |
| Offensive rebound % | 24.4% | — |  |
| Assists per made field goal | 58.5% | — |  |
| Home win % | 57.2% | — |  |
| Overtime rate | 1.7% | — |  |
| Margin s.d. | 20.3 | — |  |
| Best team win % (avg) | 82.0% | — |  |
| Worst team win % (avg) | 24.4% | — |  |
| Top scorer, points per game (avg) | 30.4 | — |  |

## Careers: naive

| Metric | Value | Target | |
|---|---|---|---|
| Careers | 60.0 | — |  |
| Top-five picks | 0.0% | — |  |
| Lottery (top 14) | 0.0% | — |  |
| First round | 3.3% | — |  |
| Second round | 18.3% | — |  |
| Undrafted | 78.3% | — |  |
| Median pick | 61.0 | — |  |
| Seasons in college (avg) | 2.9 | — |  |
| Last season points per game (avg) | 9.6 | — |  |
| Last season minutes per game (avg) | 25.8 | — |  |
| Key moments per career (avg) | 99.4 | — |  |
| Key-moment success | 47.2% | — |  |
| International caps (avg) | 5.0 | — |  |
| Games missed while ineligible (avg) | 34.3 | — |  |
| Save size MB (avg) | 5.6 | — |  |
| Seconds per career (avg) | 14.8 | — |  |

## Careers: casual

| Metric | Value | Target | |
|---|---|---|---|
| Careers | 60.0 | — |  |
| Top-five picks | 1.7% | 0.0%–3.0% | in band |
| Lottery (top 14) | 5.0% | — |  |
| First round | 25.0% | 12.0%–35.0% | in band |
| Second round | 51.7% | — |  |
| Undrafted | 23.3% | — |  |
| Median pick | 43.0 | 31.0–61.0 | in band |
| Seasons in college (avg) | 2.4 | — |  |
| Last season points per game (avg) | 15.8 | — |  |
| Last season minutes per game (avg) | 27.2 | — |  |
| Key moments per career (avg) | 127 | — |  |
| Key-moment success | 53.6% | — |  |
| International caps (avg) | 4.8 | — |  |
| Games missed while ineligible (avg) | 0.3 | — |  |
| Save size MB (avg) | 4.8 | — |  |
| Seconds per career (avg) | 10.3 | — |  |

## Careers: expert

| Metric | Value | Target | |
|---|---|---|---|
| Careers | 60.0 | — |  |
| Top-five picks | 40.0% | 20.0%–40.0% | in band |
| Lottery (top 14) | 56.7% | — |  |
| First round | 71.7% | 70.0%–100.0% | in band |
| Second round | 20.0% | — |  |
| Undrafted | 8.3% | — |  |
| Median pick | 8.0 | — |  |
| Seasons in college (avg) | 3.0 | — |  |
| Last season points per game (avg) | 22.8 | — |  |
| Last season minutes per game (avg) | 28.9 | — |  |
| Key moments per career (avg) | 162 | — |  |
| Key-moment success | 56.7% | — |  |
| International caps (avg) | 9.2 | — |  |
| Games missed while ineligible (avg) | 0.0 | — |  |
| Save size MB (avg) | 5.3 | — |  |
| Seconds per career (avg) | 12.4 | — |  |

Every metric with a target is inside its band.

## Notes

**Going back to college (added after tuning).** An undrafted player with eligibility left can return for another season; every bot does. This run includes it: casual undrafted fell from 43.3% to 23.3%, first round rose from 20.0% to 25.0% and the median pick from 53 to 43; the expert results did not change. Every banded metric stays in band.

Phase 4 tuning, against the Phase 1 report (casual top five 3.3%, expert top five 11.7% and
first round 51.7% were out of band):

- **Expert bot.** It no longer reads the hidden ceilings: training follows position weights and
  moves off skills that show no skill-up in the feed for 16 weeks. Branching every draft
  decision (declare vs stay) showed it left school too early, so it now declares as a freshman
  only for a projected top-four pick, as a sophomore for a top-eight one and as a junior for a
  first-round projection, and withdraws on the same marks.
- **Scouting.** The consensus weighs production 0.45, current ability 0.40 and the ceiling
  estimate 0.15 (was 0.20 / 0.44 / 0.36); the youth premium is 1.0 a year (was 1.6). Role and
  minutes played well now move a prospect more than the potential roll.
- **Draft stock.** Smaller swings per big-game moment (+0.15 / -0.10) and tournament game
  (at most ±0.5), and 65% carries into the next season instead of all of it.
- **Hidden potential.** The player's gap is normal(22.5, 4), clamped 15–38 (was normal(21, 6),
  12–40): the rare elite roll that made a casual freshman a top-five pick is rarer.
- **Content and pacing.** This run includes the Phase 4 story content and one extra key moment
  in the final 35 seconds of close games, which roughly doubles the key moments per career.

The expert sits at the edges of its bands here (top five 40.0%, first round 71.7%); at 60
careers a share has a standard error of about six points. A 100-career check on another seed
(`t9`) gave casual 1.0% top five, 21% first round, median 53, and expert 32% top five, 80% first
round, so the centre of both distributions is well inside the targets.
