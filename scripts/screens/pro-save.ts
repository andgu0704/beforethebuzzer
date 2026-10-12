/**
 * Writes a save already in the pro years, for screenshots of the pro screens without playing
 * four college seasons in a browser first.
 *   npx tsx scripts/screens/pro-save.ts <out.json> [situation]
 * situation: 'season' (mid regular season), 'contract' (his deal is up), 'veteran' (34, summer).
 */
import { writeFileSync } from 'node:fs';

import { content } from '../../src/content';
import { BOTS } from '../../src/engine/bots/bots';
import { playCareer } from '../../src/engine/bots/run';
import { setDraftingTeam, unlockGodMode } from '../../src/engine/career/godmode';
import { userOf, userTeamId, type GameState } from '../../src/engine/career/state';
import { advance, resolve } from '../../src/engine/career/turn';
import { autoSpend } from '../../src/engine/career/upgrade';
import { asTeamId } from '../../src/engine/core/ids';
import { indexContent } from '../../src/engine/content/registry';
import { serialise } from '../../src/engine/save/store';
import { testPlayer } from '../../src/engine/testing/creation';
import { POSITION_WEIGHTS } from '../../src/engine/model/skills';

const [out = 'pro-save.json', situation = 'season'] = process.argv.slice(2);
const index = indexContent(content);
const team = asTeamId('los_angeles_comets');
let set = false;
const run = playCareer(index, testPlayer('pro-screens'), BOTS.casual, {
  onInterrupt: (state) => {
    if (!set) {
      unlockGodMode(state);
      setDraftingTeam(state, team);
      set = true;
    }
    return state;
  },
});
const state: GameState = run.state;
// God Mode only fixed the pick; the screens should look like an ordinary career.
state.meta.integrity.godMode = false;
state.meta.integrity.log = [];
if (situation === 'contract')
  for (const [id, c] of Object.entries(state.world.contracts))
    if (c.playerId === state.career.playerId) delete state.world.contracts[id];
if (situation === 'veteran')
  (userOf(state) as { birthYear: number }).birthYear = state.world.date.year - 34;

const stopAt = (s: GameState) =>
  situation === 'season'
    ? s.world.date.week === 50
    : s.career.pending.some((p) => p.kind === (situation === 'contract' ? 'contract' : 'retire'));
for (let guard = 0; guard < 20000 && !stopAt(state); guard++) {
  const step = advance(state, index);
  if (step.kind === 'ended') break;
  if (step.kind === 'weekDone') {
    autoSpend(state, POSITION_WEIGHTS[userOf(state).position]);
    continue;
  }
  if (stopAt(state)) break;
  resolve(state, index, step.interrupt.id, BOTS.casual.choose(state, index, step.interrupt));
}
const user = userOf(state);
const teamId = userTeamId(state) ?? '';
const t = state.world.teams[teamId];
const summary = {
  id: state.meta.saveId,
  name: `${user.given} ${user.family}`,
  updatedWeek: state.world.date.year * 52 + state.world.date.week,
  godMode: false,
  detail: {
    year: state.world.date.year,
    week: state.world.date.week,
    stage: state.career.stage,
    teamId,
    teamName: t?.name ?? '',
    colour: t?.colours.primary ?? '',
    jersey: user.jersey,
    portrait: user.portrait,
    ended: state.career.ending !== null,
    pick: user.draft?.pick ?? 0,
  },
};
writeFileSync(out, JSON.stringify({ summary, body: serialise(state) }));
console.log(
  situation,
  state.career.stage,
  state.world.date,
  'pending',
  state.career.pending.map((p) => p.kind),
);
