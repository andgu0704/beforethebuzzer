import { z } from 'zod';

const date = z.object({ year: z.number().int(), week: z.number().int().min(1).max(52) });

/** The shape every loadable save must have. Deep content (people, games) is checked structurally. */
export const saveSchema = z.object({
  format: z.number().int().positive(),
  state: z.object({
    format: z.number().int().positive(),
    meta: z.object({
      saveId: z.string(),
      createdAt: date,
      contentVersion: z.string(),
      seed: z.string(),
      integrity: z.object({
        godMode: z.boolean(),
        log: z.array(z.object({ date, action: z.string() })),
      }),
    }),
    world: z
      .object({
        seed: z.string(),
        date,
        counters: z.record(z.string(), z.number()),
        players: z.array(z.array(z.unknown()).length(28)),
        others: z.array(
          z.object({ id: z.string(), kind: z.enum(['coach', 'agent', 'journalist']) }).loose(),
        ),
        teams: z.record(
          z.string(),
          z.object({ id: z.string(), kind: z.string(), roster: z.array(z.string()) }).loose(),
        ),
        games: z.record(
          z.string(),
          z.object({ id: z.string(), home: z.string(), away: z.string(), date }).loose(),
        ),
        tournaments: z.record(z.string(), z.unknown()),
        seasons: z.record(z.string(), z.unknown()),
        nations: z.record(z.string(), z.unknown()),
      })
      .loose(),
    career: z
      .object({
        playerId: z.string(),
        stage: z.enum(['highSchool', 'college', 'prospect', 'drafted', 'undrafted', 'retired']),
        pending: z.array(z.object({ id: z.string(), kind: z.string() }).loose()),
        cursor: z.object({ stage: z.enum(['idle', 'games', 'events', 'wrap']) }).loose(),
      })
      .loose(),
  }),
});
