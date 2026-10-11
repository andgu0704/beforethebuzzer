import type { ConferenceDef } from '../../engine/content/world-types';

/** College conferences. Every name is invented; majors first. */
export const conferences = [
  {
    id: 'northern_lakes',
    name: 'Northern Lakes Alliance',
    shortName: 'Northern Lakes',
    tier: 'major',
  },
  { id: 'magnolia', name: 'Magnolia League', shortName: 'Magnolia', tier: 'major' },
  { id: 'seaboard', name: 'Seaboard Alliance', shortName: 'Seaboard', tier: 'major' },
  {
    id: 'prairie_crown',
    name: 'Prairie Crown Conference',
    shortName: 'Prairie Crown',
    tier: 'major',
  },
  {
    id: 'sierra_cascade',
    name: 'Sierra Cascade League',
    shortName: 'Sierra Cascade',
    tier: 'major',
  },
  { id: 'high_plains', name: 'High Plains Athletic League', shortName: 'High Plains', tier: 'mid' },
  { id: 'tidewater', name: 'Tidewater League', shortName: 'Tidewater', tier: 'mid' },
  { id: 'lakeshore', name: 'Lakeshore Athletic Union', shortName: 'Lakeshore', tier: 'mid' },
  { id: 'desert_sun', name: 'Desert Sun Conference', shortName: 'Desert Sun', tier: 'mid' },
  { id: 'delta_bayou', name: 'Delta & Bayou Conference', shortName: 'Delta Bayou', tier: 'low' },
  {
    id: 'northern_pines',
    name: 'Northern Pines Conference',
    shortName: 'Northern Pines',
    tier: 'low',
  },
  { id: 'timberline', name: 'Timberline Conference', shortName: 'Timberline', tier: 'low' },
] satisfies readonly ConferenceDef[];
