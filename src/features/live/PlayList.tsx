import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { LiveGame, PlayEvent, Side } from '@/engine/game/types';
import { isPlayer } from '@/engine/model/person';
import { useGame } from '@/state/game';
import { clockAt, playerOf, pointsOf } from '@/state/live';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { clockText } from '../decide/labels';

interface Row {
  readonly key: number;
  readonly side: Side;
  readonly clock: string;
  readonly text: string;
  readonly mine: boolean;
  readonly big: boolean;
}

/** "G.Sorenson (PG)" */
export function useShortName(): (personId: string | null) => string {
  const { names } = useT();
  const people = useGame((g) => g.state?.world.people);
  return (id) => {
    if (!id) return '';
    const p = people?.[id];
    const given = names.person(id, 'given');
    const short = `${given.charAt(0)}.${names.person(id, 'family')}`;
    return isPlayer(p) ? `${short} (${p.position})` : short;
  };
}

/**
 * The play-by-play, newest first, the way an arena feed reads it: who scored and how, the
 * rebounds (offensive or not) with running totals, steals from whom, blocks, fouls.
 */
export const PlayList = memo(function PlayList({
  live,
  shown,
  colours,
  userId,
  limit = 9,
}: {
  readonly live: LiveGame;
  readonly shown: number;
  readonly colours: readonly [string, string];
  readonly userId: string;
  readonly limit?: number;
}) {
  const t = useTheme();
  const { t: tt } = useT();
  const short = useShortName();
  const rows = useMemo(() => {
    const out: Row[] = [];
    const pts = new Map<string, number>();
    const reb = new Map<string, number>();
    const pf = new Map<string, number>();
    let lastMiss: Side | null = null;
    live.plays.slice(0, shown).forEach((p: PlayEvent, i) => {
      const who = playerOf(live, p);
      const key = `${p.side}:${p.player}`;
      const name = short(who);
      const add = (m: Map<string, number>, n = 1) => {
        const v = (m.get(key) ?? 0) + n;
        m.set(key, v);
        return v;
      };
      let text = '';
      switch (p.kind) {
        case 'fg2':
          text = tt(`ui.live.pbp.fg2.${p.shot ?? 'mid'}`, { name, pts: add(pts, 2) });
          lastMiss = null;
          break;
        case 'fg3':
          text = tt('ui.live.pbp.fg3', { name, pts: add(pts, 3) });
          lastMiss = null;
          break;
        case 'ft':
          text = tt('ui.live.pbp.ft', { name, pts: add(pts, pointsOf(p)) });
          lastMiss = null;
          break;
        case 'miss2':
        case 'miss3':
          text = tt(`ui.live.pbp.miss.${p.shot ?? (p.kind === 'miss3' ? 'three' : 'mid')}`, {
            name,
          });
          lastMiss = p.side;
          break;
        case 'ftMiss':
          text = tt('ui.live.pbp.ftMiss', { name });
          lastMiss = p.side;
          break;
        case 'reb':
          text = tt(lastMiss === p.side ? 'ui.live.pbp.oreb' : 'ui.live.pbp.dreb', {
            name,
            n: add(reb),
          });
          lastMiss = null;
          break;
        case 'ast':
          text = tt('ui.live.pbp.ast', { name });
          break;
        case 'stl': {
          const other: Side = p.side === 0 ? 1 : 0;
          const vs = p.vs !== undefined ? short(live.teams[other].players[p.vs]?.id ?? null) : '';
          text = vs ? tt('ui.live.pbp.stl', { name, vs }) : tt('ui.live.pbp.stlAlone', { name });
          break;
        }
        case 'blk':
          text = tt('ui.live.pbp.blk', { name });
          break;
        case 'tov':
          text = tt('ui.live.pbp.tov', { name });
          break;
        case 'foul':
          text = tt('ui.live.pbp.foul', { name, n: add(pf) });
          break;
      }
      out.push({
        key: i,
        side: p.side,
        clock: clockText(clockAt(live, p.t).clock),
        text,
        mine: who === userId,
        big: p.kind === 'fg3' || p.kind === 'blk' || p.kind === 'stl',
      });
    });
    return out.slice(-limit).reverse();
  }, [live, shown, short, tt, userId, limit]);

  return (
    <View testID="play-by-play" style={{ gap: 2 }}>
      {rows.map((r, i) => (
        <View
          key={r.key}
          style={[
            styles.row,
            {
              backgroundColor: r.mine ? t.c.accentTint : t.c.surface,
              borderLeftColor: colours[r.side],
              opacity: i === 0 ? 1 : 0.92 - Math.min(0.4, i * 0.05),
            },
          ]}
        >
          <Text variant="caption" color="inkTertiary" style={{ width: 40 }} tabular>
            {r.clock}
          </Text>
          <Text
            variant={r.big || r.mine ? 'subhead' : 'footnote'}
            color={r.mine ? 'accentText' : 'ink'}
            style={{ flex: 1 }}
            numberOfLines={2}
          >
            {r.text}
          </Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderLeftWidth: 4,
    borderRadius: 4,
  },
});
