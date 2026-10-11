import { parentPort, workerData } from 'node:worker_threads';

import { content } from '@/content';
import type { Bot } from '@/engine/bots/bots';
import { indexContent } from '@/engine/content/registry';

import { careerStudy } from './career-study';
import { leagueStudy } from './league-study';

export type Task =
  | { readonly kind: 'league'; readonly seed: string; readonly seasons: number }
  | { readonly kind: 'career'; readonly policy: Bot['name']; readonly seed: string };

const index = indexContent(content);
const tasks = (workerData as { tasks: Task[] }).tasks;
for (const task of tasks) {
  const result =
    task.kind === 'league'
      ? leagueStudy(index, task.seed, task.seasons)
      : careerStudy(index, task.policy, task.seed);
  parentPort?.postMessage({ task, result });
}
