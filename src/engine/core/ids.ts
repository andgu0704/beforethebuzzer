/** Branded string identifiers, so a TeamId can never be passed where a PersonId is expected. */

declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type PersonId = Brand<string, 'PersonId'>;
export type TeamId = Brand<string, 'TeamId'>;
export type GameId = Brand<string, 'GameId'>;
export type TournamentId = Brand<string, 'TournamentId'>;
export type ContractId = Brand<string, 'ContractId'>;
export type InterruptId = Brand<string, 'InterruptId'>;
export type FeedId = Brand<string, 'FeedId'>;

export const asPersonId = (s: string): PersonId => s as PersonId;
export const asTeamId = (s: string): TeamId => s as TeamId;
export const asGameId = (s: string): GameId => s as GameId;
export const asTournamentId = (s: string): TournamentId => s as TournamentId;
export const asContractId = (s: string): ContractId => s as ContractId;
export const asInterruptId = (s: string): InterruptId => s as InterruptId;
export const asFeedId = (s: string): FeedId => s as FeedId;

/** Monotonic counters stored in the world, so new ids never collide after a reload. */
export interface IdCounters {
  person: number;
  game: number;
  tournament: number;
  contract: number;
  interrupt: number;
  feed: number;
}

export function emptyCounters(): IdCounters {
  return { person: 0, game: 0, tournament: 0, contract: 0, interrupt: 0, feed: 0 };
}

export function nextId(counters: IdCounters, kind: keyof IdCounters, prefix: string): string {
  counters[kind] += 1;
  return `${prefix}${counters[kind].toString(36)}`;
}
