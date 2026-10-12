import { StyleSheet, View } from 'react-native';

import type { MomentResult } from '@/engine/career/game';
import type { FeedEntry, Interrupt } from '@/engine/model/career';
import { contentIndex, useGame } from '@/state/game';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { ClipSlot } from './ClipSlot';
import { ChoiceButton } from './ChoiceButton';
import { becauseOf, clockText, periodText } from './labels';

/** A key moment: the scoreboard, the court, the options with their reads; then the clip and result. */
export function MomentView({
  i,
  result,
  entry,
  onChoose,
}: {
  readonly i: Extract<Interrupt, { kind: 'keyMoment' }>;
  readonly result?: MomentResult | undefined;
  readonly entry?: FeedEntry | undefined;
  readonly onChoose: (c: string) => void;
}) {
  const t = useTheme();
  const { t: tt, m, names, tr } = useT();
  const state = useGame((g) => g.state);
  if (!state) return null;
  const s = i.situation;
  const game = state.world.games[s.gameId];
  const sides = game ? [game.home, game.away] : [];
  const us = sides[s.userSide] ?? '';
  const them = sides[s.userSide === 0 ? 1 : 0] ?? '';
  const def = contentIndex().moment.get(i.momentId);
  const usTeam = state.world.teams[us];
  const themTeam = state.world.teams[them];
  return (
    <View style={{ gap: t.space.l }}>
      <View
        style={[
          styles.board,
          {
            backgroundColor: t.scheme === 'light' ? '#141414' : t.c.surface,
            borderRadius: t.radii.md,
          },
        ]}
        accessible
        accessibilityLabel={`${names.team(us)} ${s.score[s.userSide]}, ${names.team(them)} ${s.score[s.userSide === 0 ? 1 : 0]}. ${clockText(s.clock)} left, ${periodText(state, s.gameId, s.period, tt)}.`}
      >
        <View style={styles.boardSide}>
          <View
            style={[styles.boardTick, { backgroundColor: usTeam?.colours.primary ?? t.c.accent }]}
          />
          <Text variant="displayS" style={{ color: '#F1EFEA' }}>
            {names.team(us, 'abbr')}
          </Text>
          <Text variant="stat" style={{ color: '#F1EFEA' }}>
            {s.score[s.userSide]}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text variant="stat" style={{ color: '#FF5A1F' }}>
            {clockText(s.clock)}
          </Text>
          <Text variant="label" style={{ color: '#A8A49C' }}>
            {periodText(state, s.gameId, s.period, tt)}
          </Text>
        </View>
        <View style={[styles.boardSide, { justifyContent: 'flex-end' }]}>
          <Text variant="stat" style={{ color: '#F1EFEA' }}>
            {s.score[s.userSide === 0 ? 1 : 0]}
          </Text>
          <Text variant="displayS" style={{ color: '#F1EFEA' }}>
            {names.team(them, 'abbr')}
          </Text>
          <View
            style={[
              styles.boardTick,
              { backgroundColor: themTeam?.colours.primary ?? t.c.inkTertiary },
            ]}
          />
        </View>
      </View>

      <ClipSlot situation={s} result={result} resultLine={entry ? m(entry.message) : undefined} />

      <View style={{ gap: t.space.s }}>
        <Text variant="label" color="brandText">
          {tt('ui.decide.moment.kicker')}
        </Text>
        <Text variant="displayM" accessibilityRole="header">
          {tt(`moments.${i.momentId}.title`)}
        </Text>
        {result ? null : <Text variant="body">{tt(`moments.${i.momentId}.body`)}</Text>}
      </View>

      {result ? (
        <View
          style={[styles.result, { borderLeftColor: result.success ? t.c.positive : t.c.negative }]}
          accessibilityLiveRegion="polite"
        >
          <Text variant="label" color={result.success ? 'positive' : 'negative'}>
            {result.success ? tt('ui.decide.moment.success') : tt('ui.decide.moment.failure')}
          </Text>
          <Text variant="bodyStrong">{entry ? m(entry.message) : ''}</Text>
        </View>
      ) : (
        <View style={{ gap: t.space.s }}>
          {i.options.map((o) => {
            const option = def?.options.find((x) => x.id === o);
            return (
              <ChoiceButton
                key={o}
                testID={`moment-${o}`}
                label={tt(`moments.${i.momentId}.options.${o}.label`)}
                read={tt(`moments.${i.momentId}.options.${o}.read`)}
                because={becauseOf(state, contentIndex(), option?.requires, tt, (key) =>
                  tr.message({ key }, names),
                )}
                onPress={() => {
                  onChoose(o);
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  boardSide: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  boardTick: { width: 4, height: 22, borderRadius: 1 },
  result: { borderLeftWidth: 3, paddingLeft: 12, gap: 4 },
});
