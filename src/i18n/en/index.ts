import type { Catalog } from '../format';
import { consequences } from './consequences';
import { engine } from './engine';
import { events } from './events';
import { moments } from './moments';
import { nations } from './nations';
import { social } from './social';
import { traits } from './traits';
import { ui } from './ui';

export const en = {
  ...engine,
  traits,
  events,
  moments,
  consequences,
  social,
  nations,
  ui,
} satisfies Catalog;
