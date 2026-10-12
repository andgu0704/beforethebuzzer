import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { TeamId } from '@/engine/core/ids';
import type { LiveGame, Side } from '@/engine/game/types';
import { isPlayer } from '@/engine/model/person';
import { useGame } from '@/state/game';
import { recordOf, recordText } from '@/state/views';
import { Avatar } from '@/ui/components/Avatar';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import type { LiveView } from './view';

/** A coach's tactic (0–100) as a word. */
function level(v: number): 'low' | 'mid' | 'high' {
  return v < 40 ? 'low' : v > 62 ? 'high' : 'mid';
}

/**
 * Both teams on the floor right now: each player's face, position and number, points and fouls
 * so far; the team's record and the coach's tempo, three-point appetite and pressure.
 */
export const Lineups = memo(function Lineups({
  live,
  view,
  teams,
  userId,
}: {
  readonly live: LiveGame;
  readonly view: LiveView;
  readonly teams: readonly [TeamId, TeamId];
  readonly userId: string;
}) {
  return (
    <View style={{ gap: 10 }} testID="lineups">
      {([1, 0] as const).map((side) => (
        <TeamLine
          key={side}
          side={side}
          live={live}
          view={view}
          teamId={teams[side]}
          userId={userId}
        />
      ))}
    </View>
  );
});

function TeamLine({
  side,
  live,
  view,
  teamId,
  userId,
}: {
  readonly side: Side;
  readonly live: LiveGame;
  readonly view: LiveView;
  readonly teamId: TeamId;
  readonly userId: string;
}) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  if (!state) return null;
  const team = state.world.teams[teamId];
  const tactics = live.teams[side].tactics;
  const colour = team?.colours.primary ?? t.c.accent;
  return (
    <View
      style={[styles.team, { borderColor: colour, borderRadius: t.radii.md }]}
      testID={`lineup-${side}`}
    >
      <View style={[styles.head, { backgroundColor: colour }]}>
        <Text variant="subhead" style={{ color: '#FFFFFF', flex: 1 }} numberOfLines={1}>
          {names.team(teamId)}
        </Text>
        <Text variant="caption" style={{ color: '#FFFFFF' }}>
          {recordText(recordOf(state, teamId))}
        </Text>
      </View>
      <View style={styles.players}>
        {view.onCourt[side].map((index) => {
          const sim = live.teams[side].players[index];
          const person = sim ? state.world.people[sim.id] : undefined;
          const line = view.players[side][index];
          if (!sim || !isPlayer(person) || !line) return null;
          const me = sim.id === userId;
          return (
            <View
              key={index}
              style={[
                styles.card,
                {
                  backgroundColor: me ? t.c.accentTint : t.c.surface,
                  borderColor: me ? t.c.accent : t.c.hairline,
                  borderRadius: t.radii.sm,
                },
              ]}
              accessibilityLabel={`${names.person(sim.id)}, ${person.position}, ${line.pts} ${tt('ui.game.pts')}, ${line.pf} ${tt('ui.game.pf')}`}
            >
              <Text variant="caption" color={me ? 'accentText' : 'inkSecondary'}>
                {me ? `★ ${person.position}` : person.position}
              </Text>
              <Avatar
                name={names.person(sim.id)}
                portrait={person.portrait}
                size={38}
                primary={team?.colours.primary}
                secondary={team?.colours.secondary}
                jersey={person.jersey}
              />
              <Text variant="caption" numberOfLines={1} style={{ maxWidth: 62 }}>
                {names.person(sim.id, 'family')}
              </Text>
              <View style={styles.nums}>
                <Text variant="caption" color="inkSecondary">
                  {tt('ui.live.p')}
                </Text>
                <Text variant="subhead" tabular>
                  {line.pts}
                </Text>
                <Text variant="caption" color={line.pf >= 4 ? 'negative' : 'inkSecondary'}>
                  {`${tt('ui.live.f')}${line.pf}`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <Text
        variant="caption"
        color="inkSecondary"
        style={{ paddingHorizontal: 8, paddingBottom: 6 }}
      >
        {[
          tt(`ui.live.tactics.pace.${level(tactics.pace)}`),
          tt(`ui.live.tactics.threes.${level(tactics.threeRate)}`),
          tt(`ui.live.tactics.pressure.${level(tactics.pressure)}`),
        ].join(' · ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  team: { borderWidth: 2, overflow: 'hidden', gap: 6 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  players: { flexDirection: 'row', gap: 4, paddingHorizontal: 4 },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  nums: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
});
