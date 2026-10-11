/**
 * Plays a career in the terminal, on the same engine the app uses.
 *
 *   npm run play                         interactive, with a ready-made player
 *   npm run play -- --seed mine          a different world
 *   npm run play -- --auto expert        a bot plays; you watch the feed
 *   npm run play -- --auto casual --weeks 60
 */

import { writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

import { content } from '@/content';
import { BOTS, type Bot } from '@/engine/bots/bots';
import { simulateAhead } from '@/engine/career/ahead';
import { createCareer, DEFAULT_PLAN } from '@/engine/career/create';
import { castParams } from '@/engine/career/events';
import { userOf, type GameState } from '@/engine/career/state';
import { advance, resolve, type Choice } from '@/engine/career/turn';
import { weekStartDay } from '@/engine/core/calendar';
import { indexContent } from '@/engine/content/registry';
import { overallOf } from '@/engine/game/ratings';
import type { FeedEntry, Interrupt, WeekPlan } from '@/engine/model/career';
import { serialise } from '@/engine/save/store';
import { testPlayer } from '@/engine/testing/creation';
import { translatorFor } from '@/i18n';
import { worldNames } from '@/i18n/names';

const index = indexContent(content);
const t = translatorFor('en');
const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const autoName = arg('auto') as Bot['name'] | undefined;
const bot = autoName ? BOTS[autoName] : undefined;
const maxWeeks = Number(arg('weeks') ?? 400);

const PLANS: Record<string, WeekPlan> = {
  balanced: DEFAULT_PLAN,
  shooting: {
    train: { shooting: 4, handling: 1 },
    rest: 2,
    film: 1,
    bonding: 0,
    study: 2,
    media: 0,
  },
  athlete: {
    train: { athleticism: 3, defence: 2, rebounding: 1 },
    rest: 2,
    film: 0,
    bonding: 0,
    study: 2,
    media: 0,
  },
  recover: { train: { shooting: 1 }, rest: 5, film: 2, bonding: 1, study: 1, media: 0 },
  grades: { train: { shooting: 2, handling: 1 }, rest: 2, film: 1, bonding: 0, study: 4, media: 0 },
};

function names(state: GameState) {
  return worldNames(state.world, t);
}

function dateLabel(state: GameState): string {
  const { month, day } = weekStartDay(state.world.date.week);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[month - 1] ?? ''} ${day}, ${state.world.date.year}`;
}

function statusLine(state: GameState): string {
  const u = userOf(state);
  const c = state.career;
  const ovr = overallOf(u.skills, u.position, u.heightCm).toFixed(1);
  return `${u.given} ${u.family} · ${c.stage} · ${t.t(`roles.${c.role}`)} · OVR ${ovr} · energy ${Math.round(u.energy)} · health ${Math.round(u.health)} · confidence ${Math.round(u.confidence)} · trust ${Math.round(c.coachTrust)} · rep ${Math.round(c.reputation)} · GPA ${c.gpa.toFixed(2)} · $${Math.round(c.money)}${u.injury ? ` · injured (${u.injury.weeksLeft} wk)` : ''}`;
}

function render(state: GameState, f: FeedEntry): string {
  const text = t.message(f.message, names(state));
  if (f.kind === 'social' && f.social) return `   @${f.social.handle}: ${text}`;
  if (f.kind === 'game' && f.data) {
    const d = f.data;
    const line =
      Number(d['min']) > 0
        ? `  [${d['min']} min · ${d['pts']} pts · ${d['reb']} reb · ${d['ast']} ast · ${d['fgm']}-${d['fga']} FG]`
        : '';
    return ` ● ${text}${line}`;
  }
  if (f.kind === 'moment') return `   ▸ ${text}`;
  return ` · ${text}`;
}

function describe(
  state: GameState,
  i: Interrupt,
): { title: string; body: string; options: { id: string; label: string }[]; multi?: number } {
  const n = names(state);
  switch (i.kind) {
    case 'keyMoment': {
      const s = i.situation;
      const clock = `${Math.floor(s.clock / 60)}:${String(Math.floor(s.clock % 60)).padStart(2, '0')}`;
      return {
        title: `KEY MOMENT · ${t.t(`moments.${i.momentId}.title`)} · ${s.score[s.userSide]}–${s.score[s.userSide === 0 ? 1 : 0]}, ${clock} left in period ${s.period}`,
        body: t.t(`moments.${i.momentId}.body`),
        options: i.options.map((o) => ({
          id: o,
          label: `${t.t(`moments.${i.momentId}.options.${o}.label`)} — ${t.t(`moments.${i.momentId}.options.${o}.read`)}`,
        })),
      };
    }
    case 'event': {
      const params = castParams(i.cast);
      return {
        title: t.message({ key: `events.${i.eventId}.title`, params }, n),
        body: t.message({ key: `events.${i.eventId}.body`, params }, n),
        options: i.choices.map((c) => ({
          id: c,
          label: t.message({ key: `events.${i.eventId}.choices.${c}.label`, params }, n),
        })),
      };
    }
    case 'offers':
      return {
        title: 'SCHOLARSHIP OFFERS',
        body: 'Choose where you will play.',
        options: i.offers.map((o) => {
          const team = state.world.teams[o.teamId];
          const prestige = team?.kind === 'college' ? team.prestige : 0;
          return {
            id: o.teamId,
            label: `${n.team(o.teamId)} ${n.team(o.teamId, 'nickname')} (prestige ${prestige}) — projected ${t.t(`roles.${o.role}`)}, ~${o.minutes} min. ${t.t(`offers.pitch.${o.pitch}`)}`,
          };
        }),
      };
    case 'callUp':
      return {
        title: `NATIONAL TEAM (${t.t(`levels.${i.level}`)})`,
        body: `${t.t(`nations.${userOf(state).nation}`)} want you for the tournament.`,
        options: [
          { id: 'accept', label: 'Accept' },
          { id: 'decline', label: 'Decline' },
        ],
      };
    case 'draftDecision': {
      const [best, worst] = state.career.draft.projected;
      return {
        title: 'THE DRAFT',
        body: `Scouts project you between pick ${best} and ${worst > 60 ? 'undrafted' : worst}.`,
        options: [
          { id: 'declare', label: 'Declare' },
          { id: 'testWaters', label: 'Test the waters' },
          { id: 'stay', label: 'Stay in school' },
        ].filter((o) => i.options.includes(o.id as 'declare')),
      };
    }
    case 'withdraw':
      return {
        title: 'WITHDRAWAL DEADLINE',
        body: `Projected ${state.career.draft.projected.join('–')}.`,
        options: [
          { id: 'stay', label: 'Stay in the draft' },
          { id: 'return', label: 'Return to school' },
        ],
      };
    case 'workouts':
      return {
        title: 'WORKOUT INVITATIONS',
        body: `Pick up to ${i.max} (e.g. 1,3,4).`,
        options: i.teams.map((id) => ({ id, label: n.team(id) })),
        multi: i.max,
      };
    case 'agent':
      return {
        title: 'AGENTS',
        body: 'Who represents you?',
        options: [
          ...i.agents.map((id) => {
            const a = state.world.people[id];
            return {
              id,
              label: `${n.person(id)} (quality ${a?.kind === 'agent' ? a.quality : '?'})`,
            };
          }),
          { id: 'none', label: 'No agent' },
        ],
      };
    case 'draftNight':
      return {
        title: 'DRAFT NIGHT',
        body: 'The green room smells like new suits.',
        options: [{ id: 'go', label: 'Let it happen' }],
      };
  }
}

async function main(): Promise<void> {
  const rl = bot ? null : createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (q: string) => (rl ? (await rl.question(q)).trim() : '');
  const state = createCareer(index, testPlayer(arg('seed') ?? 'play', autoName ? {} : {}));
  let mark = 0;
  let weeks = 0;
  const flush = () => {
    for (const f of state.career.feed.slice(mark)) console.log(render(state, f));
    mark = state.career.feed.length;
  };
  console.log(`\n${statusLine(state)}\n`);
  while (weeks < maxWeeks) {
    if (state.career.cursor.stage === 'idle') {
      console.log(`\n━━ Week ${state.world.date.week} · ${dateLabel(state)} ━━`);
      if (bot) state.career.plan = bot.plan(state, index);
      else {
        const cmd = await ask(
          '[enter] next week · a ahead · p plan · s status · t timeline · w save · q quit > ',
        );
        if (cmd === 'q') break;
        if (cmd === 's') {
          console.log(statusLine(state));
          continue;
        }
        if (cmd === 't') {
          for (const e of state.career.timeline.slice(-15))
            console.log(`  ${e.date.year}-w${e.date.week} ${t.message(e.message, names(state))}`);
          continue;
        }
        if (cmd === 'w') {
          writeFileSync('career.save.json', serialise(state));
          console.log('Saved to career.save.json');
          continue;
        }
        if (cmd === 'p') {
          const choice = await ask(`Plan (${Object.keys(PLANS).join(', ')}) > `);
          const plan = PLANS[choice];
          if (plan) state.career.plan = plan;
          continue;
        }
        if (cmd === 'a') {
          const r = simulateAhead(state, index);
          flush();
          console.log(`(simulated ${r.weeks} weeks, stopped: ${r.stop})`);
          weeks += r.weeks;
          if (r.stop === 'ended') break;
          if (r.stop !== 'interrupt') continue;
        }
      }
    }
    const step = advance(state, index);
    flush();
    if (step.kind === 'ended') break;
    if (step.kind === 'weekDone') {
      weeks++;
      if (bot && weeks % 13 === 0) console.log(`   (${statusLine(state)})`);
      continue;
    }
    const i = step.interrupt;
    const view = describe(state, i);
    console.log(`\n  ${view.title}\n  ${view.body}`);
    view.options.forEach((o, k) => {
      console.log(`   ${k + 1}. ${o.label}`);
    });
    let choice: Choice;
    if (bot) {
      choice = bot.choose(state, index, i);
      console.log(
        `   → ${Array.isArray(choice) ? `${choice.length} picked` : (view.options.find((o) => o.id === choice)?.label.split(' — ')[0] ?? String(choice))}`,
      );
    } else {
      const answer = await ask('  > ');
      const picks = answer
        .split(',')
        .map((x) => Number(x.trim()) - 1)
        .filter((k) => k >= 0 && k < view.options.length);
      const ids = picks.map((k) => view.options[k]?.id ?? '').filter(Boolean);
      choice = view.multi ? ids.slice(0, view.multi) : (ids[0] ?? view.options[0]?.id ?? '');
    }
    resolve(state, index, i.id, choice);
    flush();
  }
  const end = state.career.ending;
  console.log(`\n${statusLine(state)}`);
  if (end)
    console.log(
      end.pick
        ? `\nDrafted ${end.pick} by ${names(state).team(end.teamId ?? '')}.`
        : '\nUndrafted.',
    );
  rl?.close();
}

void main();
