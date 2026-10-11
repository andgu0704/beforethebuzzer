import { StyleSheet, View } from 'react-native';

import { userOf } from '@/engine/career/state';
import { isPlayer } from '@/engine/model/person';
import type { CombineResult } from '@/engine/model/world';
import { useGame } from '@/state/game';
import { EmptyState, ListRow, Screen, SectionHeader } from '@/ui/components/Layout';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

const KEYS: readonly {
  key: keyof CombineResult;
  unit: string;
  lowerBetter?: boolean;
  digits?: number;
}[] = [
  { key: 'heightInShoesCm', unit: 'cm' },
  { key: 'wingspanCm', unit: 'cm' },
  { key: 'standingReachCm', unit: 'cm' },
  { key: 'verticalCm', unit: 'cm' },
  { key: 'laneAgilitySec', unit: 's', lowerBetter: true, digits: 2 },
  { key: 'sprintSec', unit: 's', lowerBetter: true, digits: 2 },
  { key: 'shooting', unit: '/25' },
];

const LABEL: Record<keyof CombineResult, string> = {
  heightInShoesCm: 'height',
  wingspanCm: 'wingspan',
  standingReachCm: 'reach',
  verticalCm: 'vertical',
  laneAgilitySec: 'agility',
  sprintSec: 'sprint',
  shooting: 'shooting',
};

/** Combine measurements against the position's average, and the workouts booked. */
export function CombineScreen() {
  const t = useTheme();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  if (!state) return null;
  const u = userOf(state);
  const draft = state.world.draft;
  const mine = draft?.combine[u.id];
  const peers = draft
    ? Object.entries(draft.combine)
        .filter(([id]) => {
          const p = state.world.people[id];
          return isPlayer(p) && p.position === u.position && id !== u.id;
        })
        .map(([, r]) => r)
    : [];
  const avg = (k: keyof CombineResult) =>
    peers.length ? peers.reduce((s, r) => s + r[k], 0) / peers.length : 0;
  return (
    <Screen testID="combine">
      <Text variant="displayL">{tt('ui.combine.title').toUpperCase()}</Text>
      {mine ? (
        <>
          <SectionHeader
            title={tt('ui.combine.measure')}
            detail={tt(`ui.positions.${u.position}`)}
          />
          {KEYS.map(({ key, unit, lowerBetter, digits = 0 }) => {
            const a = avg(key);
            const v = mine[key];
            const better = lowerBetter ? v < a : v > a;
            return (
              <View key={key} style={[styles.row, { borderBottomColor: t.c.hairline }]}>
                <View style={{ flex: 1 }}>
                  <Text variant="subhead">{tt(`ui.combine.${LABEL[key]}`)}</Text>
                  <Text variant="footnote" color="inkSecondary">
                    {tt('ui.combine.vsAvg', { avg: `${a.toFixed(digits)} ${unit}` })}
                  </Text>
                </View>
                <Text
                  variant="stat"
                  color={peers.length ? (better ? 'positive' : 'negative') : 'ink'}
                >
                  {`${v.toFixed(digits)}`}
                </Text>
                <Text variant="footnote" color="inkSecondary" style={{ width: 28 }}>
                  {unit}
                </Text>
              </View>
            );
          })}
        </>
      ) : (
        <EmptyState title={tt('ui.combine.empty')} body={tt('ui.combine.emptyBody')} />
      )}
      <SectionHeader title={tt('ui.combine.workouts')} />
      {state.career.draft.workouts.length ? (
        state.career.draft.workouts.map((id) => (
          <ListRow
            key={id}
            title={names.team(id)}
            value={String(Math.round(state.career.draft.interest[id] ?? 50))}
            subtitle={tt('ui.combine.interest', {
              n: Math.round(state.career.draft.interest[id] ?? 50),
            })}
          />
        ))
      ) : (
        <EmptyState title={tt('ui.combine.noWorkouts')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
