/**
 * Headless simulation: plays league seasons and whole careers with the bots, in parallel,
 * and writes a balance report with every metric checked against its target band.
 *
 *   npm run sim -- --careers 60 --seasons 3 --seed 7 [--policy expert] [--workers 4] [--check]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

import type { Bot } from '@/engine/bots/bots';

import type { CareerResult } from './career-study';
import { emptyTotals, type LeagueTotals } from './league-study';
import type { Task } from './worker';

interface Args {
  careers: number;
  seasons: number;
  seed: string;
  policies: Bot['name'][];
  workers: number;
  check: boolean;
  out: string;
}

function parseArgs(argv: readonly string[]): Args {
  const get = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const policy = get('policy');
  return {
    careers: Number(get('careers') ?? 30),
    seasons: Number(get('seasons') ?? 2),
    seed: get('seed') ?? 'balance',
    policies: policy ? [policy as Bot['name']] : ['naive', 'casual', 'expert'],
    workers: Number(get('workers') ?? Math.max(1, availableParallelism())),
    check: argv.includes('--check'),
    out: get('out') ?? join('docs', 'balance'),
  };
}

function runTasks(
  tasks: Task[],
  workers: number,
  onDone: (task: Task, result: unknown) => void,
): Promise<void> {
  const buckets: Task[][] = Array.from({ length: workers }, () => []);
  tasks.forEach((t, i) => buckets[i % workers]?.push(t));
  return Promise.all(
    buckets
      .filter((b) => b.length > 0)
      .map(
        (bucket) =>
          new Promise<void>((resolve, reject) => {
            // Workers load TypeScript through tsx's CommonJS hook, which also applies the "@/" paths.
            const boot = `require('tsx/cjs/api').register(); require(${JSON.stringify(join(__dirname, 'worker.ts'))});`;
            const worker = new Worker(boot, { eval: true, workerData: { tasks: bucket } });
            worker.on('message', (m: { task: Task; result: unknown }) => {
              onDone(m.task, m.result);
            });
            worker.on('error', reject);
            worker.on('exit', (code) => {
              if (code === 0) resolve();
              else reject(new Error(`worker exited with ${code}`));
            });
          }),
      ),
  ).then(() => undefined);
}

function merge(into: LeagueTotals, from: LeagueTotals): void {
  for (const key of Object.keys(into) as (keyof LeagueTotals)[]) {
    const a = into[key];
    const b = from[key];
    if (Array.isArray(a) && Array.isArray(b)) a.push(...b);
    else if (typeof a === 'number' && typeof b === 'number')
      (into as unknown as Record<string, number>)[key] = a + b;
  }
}

const mean = (xs: readonly number[]) =>
  xs.length === 0 ? 0 : xs.reduce((s, x) => s + x, 0) / xs.length;
const quantile = (xs: readonly number[], q: number) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
};

interface Metric {
  readonly group: string;
  readonly name: string;
  readonly value: number;
  readonly band: readonly [number, number] | null;
  readonly format: 'pct' | 'num';
}

function leagueMetrics(
  group: string,
  t: LeagueTotals,
  bands: Partial<Record<string, readonly [number, number]>>,
): Metric[] {
  const tg = Math.max(1, t.teamGames);
  const ppg = t.pts / tg;
  const raw: [string, number, 'pct' | 'num'][] = [
    ['Points per team game', ppg, 'num'],
    ['Points s.d.', Math.sqrt(Math.max(0, t.ptsSq / tg - ppg * ppg)), 'num'],
    ['Possessions per team game', t.poss / tg, 'num'],
    ['Field goal %', t.fgm / Math.max(1, t.fga), 'pct'],
    ['Three-point %', t.tpm / Math.max(1, t.tpa), 'pct'],
    ['Free throw %', t.ftm / Math.max(1, t.fta), 'pct'],
    ['Three-point attempt share', t.tpa / Math.max(1, t.fga), 'pct'],
    ['Turnovers per team game', t.tov / tg, 'num'],
    ['Offensive rebound %', t.orb / Math.max(1, t.orb + t.drb), 'pct'],
    ['Assists per made field goal', t.ast / Math.max(1, t.fgm), 'pct'],
    ['Home win %', t.homeWins / Math.max(1, t.games - t.neutralGames), 'pct'],
    ['Overtime rate', t.overtimes / Math.max(1, t.games), 'pct'],
    ['Margin s.d.', Math.sqrt(t.marginSq / Math.max(1, t.games)), 'num'],
    ['Best team win % (avg)', mean(t.bestWinPct), 'pct'],
    ['Worst team win % (avg)', mean(t.worstWinPct), 'pct'],
    ['Top scorer, points per game (avg)', mean(t.topScorer), 'num'],
  ];
  return raw.map(([name, value, format]) => ({
    group,
    name,
    value,
    format,
    band: bands[name] ?? null,
  }));
}

const COLLEGE_BANDS = {
  'Points per team game': [69, 76],
  'Points s.d.': [10, 13.5],
  'Possessions per team game': [66, 71.5],
  'Field goal %': [0.425, 0.455],
  'Three-point %': [0.33, 0.355],
  'Free throw %': [0.69, 0.74],
  'Three-point attempt share': [0.36, 0.42],
  'Turnovers per team game': [10.5, 13.5],
  'Offensive rebound %': [0.26, 0.31],
  'Home win %': [0.58, 0.65],
  'Best team win % (avg)': [0.8, 0.97],
  'Worst team win % (avg)': [0.03, 0.22],
  'Top scorer, points per game (avg)': [22, 28],
} as const;

const PRO_BANDS = {
  'Points per team game': [108, 117],
  'Possessions per team game': [96, 102],
  'Field goal %': [0.455, 0.485],
  'Three-point %': [0.345, 0.375],
  'Free throw %': [0.75, 0.81],
} as const;

function careerMetrics(policy: string, results: readonly CareerResult[]): Metric[] {
  const picks = results.map((r) => r.pick);
  const share = (f: (p: number) => boolean) => picks.filter(f).length / Math.max(1, picks.length);
  const bands: Record<string, Record<string, readonly [number, number]>> = {
    casual: { 'Top-five picks': [0, 0.03], 'First round': [0.12, 0.35], 'Median pick': [31, 61] },
    expert: { 'Top-five picks': [0.2, 0.4], 'First round': [0.7, 1] },
  };
  const b = bands[policy] ?? {};
  const raw: [string, number, 'pct' | 'num'][] = [
    ['Careers', results.length, 'num'],
    ['Top-five picks', share((p) => p <= 5), 'pct'],
    ['Lottery (top 14)', share((p) => p <= 14), 'pct'],
    ['First round', share((p) => p <= 30), 'pct'],
    ['Second round', share((p) => p > 30 && p <= 60), 'pct'],
    ['Undrafted', share((p) => p > 60), 'pct'],
    ['Median pick', quantile(picks, 0.5), 'num'],
    ['Seasons in college (avg)', mean(results.map((r) => r.collegeSeasons)), 'num'],
    ['Last season points per game (avg)', mean(results.map((r) => r.lastPpg)), 'num'],
    ['Last season minutes per game (avg)', mean(results.map((r) => r.lastMpg)), 'num'],
    ['Key moments per career (avg)', mean(results.map((r) => r.moments)), 'num'],
    ['Key-moment success', mean(results.map((r) => r.momentSuccess)), 'pct'],
    ['International caps (avg)', mean(results.map((r) => r.caps)), 'num'],
    ['Games missed while ineligible (avg)', mean(results.map((r) => r.ineligibleGames)), 'num'],
    ['Save size MB (avg)', mean(results.map((r) => r.saveMb)), 'num'],
    ['Seconds per career (avg)', mean(results.map((r) => r.ms)) / 1000, 'num'],
  ];
  return raw.map(([name, value, format]) => ({
    group: `Careers: ${policy}`,
    name,
    value,
    format,
    band: b[name] ?? null,
  }));
}

function fmt(m: Metric, v: number): string {
  return m.format === 'pct' ? `${(v * 100).toFixed(1)}%` : v.toFixed(v >= 100 ? 0 : 1);
}

function inBand(m: Metric): boolean | null {
  if (!m.band) return null;
  return m.value >= m.band[0] && m.value <= m.band[1];
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const started = performance.now();
  const tasks: Task[] = [];
  for (let i = 0; i < Math.max(1, Math.ceil(args.seasons / 2)); i++)
    tasks.push({
      kind: 'league',
      seed: `${args.seed}-league-${i}`,
      seasons: Math.min(2, args.seasons - i * 2),
    });
  for (const policy of args.policies)
    for (let i = 0; i < args.careers; i++)
      tasks.push({ kind: 'career', policy, seed: `${args.seed}-${policy}-${i}` });

  const college = emptyTotals();
  const pro = emptyTotals();
  const careers: CareerResult[] = [];
  let done = 0;
  await runTasks(tasks, args.workers, (task, result) => {
    done++;
    if (task.kind === 'league') {
      const r = result as { college: LeagueTotals; pro: LeagueTotals };
      merge(college, r.college);
      merge(pro, r.pro);
    } else careers.push(result as CareerResult);
    if (done % 10 === 0 || done === tasks.length)
      process.stdout.write(`\r${done}/${tasks.length} tasks`);
  });
  process.stdout.write('\n');

  const metrics = [
    ...leagueMetrics('College league', college, COLLEGE_BANDS),
    ...leagueMetrics('Pro league', pro, PRO_BANDS),
    ...args.policies.flatMap((p) =>
      careerMetrics(
        p,
        careers.filter((c) => c.policy === p),
      ),
    ),
  ];
  const failures = metrics.filter((m) => inBand(m) === false);
  const lines = [
    `# Balance report`,
    '',
    `Seed \`${args.seed}\` · ${args.seasons} league seasons · ${args.careers} careers per policy · ${((performance.now() - started) / 1000).toFixed(0)} s on ${args.workers} workers.`,
    `College engine time per in-season week (Node): median ${quantile(college.msPerWeek, 0.5).toFixed(0)} ms, p90 ${quantile(college.msPerWeek, 0.9).toFixed(0)} ms.`,
    '',
  ];
  let group = '';
  for (const m of metrics) {
    if (m.group !== group) {
      group = m.group;
      lines.push('', `## ${group}`, '', '| Metric | Value | Target | |', '|---|---|---|---|');
    }
    const ok = inBand(m);
    lines.push(
      `| ${m.name} | ${fmt(m, m.value)} | ${m.band ? `${fmt(m, m.band[0])}–${fmt(m, m.band[1])}` : '—'} | ${ok === null ? '' : ok ? 'in band' : '**out of band**'} |`,
    );
  }
  lines.push(
    '',
    failures.length === 0
      ? 'Every metric with a target is inside its band.'
      : `${failures.length} metric(s) outside their bands.`,
  );
  const report = lines.join('\n') + '\n';
  mkdirSync(args.out, { recursive: true });
  writeFileSync(join(args.out, `${args.seed}.md`), report);
  writeFileSync(
    join(args.out, `${args.seed}.json`),
    JSON.stringify({ args, metrics, careers }, null, 1),
  );
  console.log(report);
  if (args.check && failures.length > 0) process.exitCode = 1;
}

void main();
