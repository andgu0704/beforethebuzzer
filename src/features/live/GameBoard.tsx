import { StyleSheet, View } from 'react-native';

import type { TeamId } from '@/engine/core/ids';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import type { LiveView } from './view';

const INK = '#F1EFEA';
const DIM = '#A8A49C';
const HOT = '#FF5A1F';

/**
 * The arena scoreboard: visitors on the left, the home side on the right, each with its team
 * fouls and the bonus; period, clock and the possession arrow in the middle.
 */
export function GameBoard({
  teams,
  view,
  clock,
  period,
  neutral,
  final,
}: {
  readonly teams: readonly [TeamId, TeamId];
  readonly view: LiveView;
  readonly clock: string;
  readonly period: string;
  readonly neutral: boolean;
  readonly final: boolean;
}) {
  const t = useTheme();
  const { t: tt, names } = useT();
  // Index 0 is the home side; the board reads visitor, then home.
  const order = [1, 0] as const;
  return (
    <View
      testID="live-board"
      style={[styles.board, { backgroundColor: '#141414', borderRadius: t.radii.md }]}
      accessible
      accessibilityLabel={`${names.team(teams[1])} ${view.score[1]}, ${names.team(teams[0])} ${view.score[0]}. ${clock} ${period}`}
    >
      {order.map((side, i) => (
        <View key={side} style={[styles.side, i === 1 && { alignItems: 'flex-end' }]}>
          <Text variant="label" style={{ color: DIM }} numberOfLines={1}>
            {neutral
              ? names.team(teams[side], 'abbr')
              : `${names.team(teams[side], 'abbr')} · ${tt(side === 0 ? 'ui.live.home' : 'ui.live.visitor')}`}
          </Text>
          <Text
            variant="scoreboard"
            style={{ color: INK, fontSize: 40, lineHeight: 44 }}
            testID={`board-score-${side}`}
          >
            {view.score[side]}
          </Text>
          <Text variant="caption" style={{ color: DIM }}>
            {tt('ui.live.teamFouls', { n: view.teamFouls[side] })}
            {view.bonus[side] ? `  ·  ${tt('ui.live.bonus')}` : ''}
          </Text>
        </View>
      ))}
      <View style={styles.middle} pointerEvents="none">
        <Text variant="label" style={{ color: DIM }}>
          {period}
        </Text>
        <Text variant="stat" style={{ color: HOT, fontSize: 26, lineHeight: 30 }}>
          {clock}
        </Text>
        {!final && view.possession !== null ? (
          <Text variant="caption" style={{ color: INK }}>
            {view.possession === 1 ? `◀ ${tt('ui.live.ball')}` : `${tt('ui.live.ball')} ▶`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  side: { gap: 2, minWidth: 96 },
  middle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 10,
    alignItems: 'center',
    gap: 2,
  },
});
