import type { ContentRegistry } from '@/engine/content/registry';

import { denyLists } from './denylist';
import { consequences } from './story/consequences';
import { events } from './story/events';
import { moments } from './story/moments';
import { social } from './story/social';
import { traits } from './story/traits';
import { colleges } from './world/colleges';
import { conferences } from './world/conferences';
import { namingCultures } from './world/naming';
import { nations } from './world/nations';
import { proTeams } from './world/pro-teams';

export const CONTENT_VERSION = '1';

export const content: ContentRegistry = {
  version: CONTENT_VERSION,
  nations,
  namingCultures,
  conferences,
  colleges,
  proTeams,
  denyLists,
  traits,
  events,
  consequences,
  moments,
  social,
};
