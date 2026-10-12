import type { StatItem } from '@/ui/components/Stats';

type T = (key: string, params?: Readonly<Record<string, string | number>>) => string;

/** A player's game line as stat items, with the spoken forms VoiceOver reads. */
export function statItems(
  t: T,
  l: { pts: number; reb: number; ast: number; fgm: number; fga: number; min?: number; pm?: number },
): StatItem[] {
  const items: StatItem[] = [
    { value: l.pts, label: t('ui.game.pts'), spoken: t('ui.spoken.pts', { n: l.pts }) },
    { value: l.reb, label: t('ui.game.reb'), spoken: t('ui.spoken.reb', { n: l.reb }) },
    { value: l.ast, label: t('ui.game.ast'), spoken: t('ui.spoken.ast', { n: l.ast }) },
    {
      value: `${l.fgm}-${l.fga}`,
      label: t('ui.game.fg'),
      spoken: t('ui.spoken.fg', { made: l.fgm, tried: l.fga }),
    },
  ];
  if (l.min !== undefined)
    items.push({ value: l.min, label: t('ui.game.min'), spoken: t('ui.spoken.min', { n: l.min }) });
  if (l.pm !== undefined)
    items.push({
      value: `${l.pm > 0 ? '+' : ''}${l.pm}`,
      label: '',
      spoken: t('ui.spoken.pm', { n: l.pm }),
    });
  return items;
}
