import type { DenyLists } from '@/engine/content/world-types';
import { realColleges } from './colleges';
import { realPlayers } from './players';
import { realProNicknames, realProTeams } from './teams';

export const denyLists: DenyLists = {
  players: realPlayers,
  proNicknames: realProNicknames,
  proTeams: realProTeams,
  colleges: realColleges,
};
