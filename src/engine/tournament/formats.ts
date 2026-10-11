import type { TournamentFormat } from '../model/tournament';

export const FORMATS = {
  conference: (teams: number): TournamentFormat => ({
    knockout: { size: teams > 8 ? 16 : 8, bestOf: 1, thirdPlace: false, roundsPerWeek: [4] },
    neutral: true,
    momentsPerGame: [1, 2],
  }),
  national: {
    knockout: {
      size: 64,
      bestOf: 1,
      thirdPlace: false,
      roundsPerWeek: [2, 2, 2],
      regions: 4,
      regionSeeding: 'snake',
    },
    neutral: true,
    momentsPerGame: [2, 3],
  },
  holiday: {
    knockout: { size: 8, bestOf: 1, thirdPlace: false, roundsPerWeek: [3] },
    neutral: true,
    momentsPerGame: [1, 2],
  },
  proPlayoffs: {
    knockout: {
      size: 16,
      bestOf: 7,
      thirdPlace: false,
      roundsPerWeek: [1],
      regions: 2,
      regionSeeding: 'straight',
    },
    neutral: false,
    momentsPerGame: [1, 2],
  },
  continental: {
    groups: { count: 4, size: 4, advance: 2, bestThirds: 0, matchdaysPerWeek: [3] },
    knockout: { size: 8, bestOf: 1, thirdPlace: true, roundsPerWeek: [2, 1] },
    neutral: true,
    momentsPerGame: [2, 3],
  },
  continental8: {
    groups: { count: 2, size: 4, advance: 2, bestThirds: 0, matchdaysPerWeek: [3] },
    knockout: { size: 4, bestOf: 1, thirdPlace: true, roundsPerWeek: [1, 1] },
    neutral: true,
    momentsPerGame: [2, 3],
  },
  world: {
    groups: { count: 8, size: 4, advance: 2, bestThirds: 0, matchdaysPerWeek: [3] },
    knockout: { size: 16, bestOf: 1, thirdPlace: true, roundsPerWeek: [2, 2] },
    neutral: true,
    momentsPerGame: [2, 3],
  },
  summerGames: {
    groups: { count: 3, size: 4, advance: 2, bestThirds: 2, matchdaysPerWeek: [3] },
    knockout: { size: 8, bestOf: 1, thirdPlace: true, roundsPerWeek: [2, 1] },
    neutral: true,
    momentsPerGame: [2, 3],
  },
} as const satisfies Record<string, TournamentFormat | ((n: number) => TournamentFormat)>;
