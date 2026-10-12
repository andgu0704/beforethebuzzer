import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { Series } from '@/engine/model/tournament';
import { useGame } from '@/state/game';
import { currentTeam, tournamentName } from '@/state/views';
import { EmptyState, Screen, SectionHeader } from '@/ui/components/Layout';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

const CELL_H = 58;

function roundName(
  index: number,
  total: number,
  tt: (k: string, p?: Record<string, string | number>) => string,
): string {
  const fromEnd = total - index;
  if (fromEnd === 1) return tt('ui.bracket.final');
  if (fromEnd === 2) return tt('ui.bracket.semis');
  if (fromEnd === 3) return tt('ui.bracket.quarters');
  return tt('ui.bracket.round', { n: index + 1 });
}

/** A tournament: group tables, then the knockout bracket with his team's path highlighted. */
export function BracketScreen() {
  const t = useTheme();
  const { t: tt, names } = useT();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  const tour = state?.world.tournaments[tournamentId];
  if (!state || !tour) return <EmptyState title={tt('ui.bracket.missing')} />;
  const mine = currentTeam(state)?.id;
  const national = Object.values(state.world.nations).find(
    (n) => n.code === state.world.people[state.career.playerId]?.nation,
  );
  const ours = new Set<string>(
    [mine, national?.seniorTeam, national?.u20Team].filter((x): x is NonNullable<typeof x> => !!x),
  );

  const seriesCell = (s: Series, key: string) => {
    const row = (id: string | null, seed: number, wins: number) => {
      const won = s.winner !== null && s.winner === id;
      const isOurs = id !== null && ours.has(id);
      return (
        <View style={[styles.side, isOurs && { backgroundColor: t.c.accentTint }]}>
          <Text variant="footnote" color="inkTertiary" style={{ width: 18 }} tabular>
            {seed || ''}
          </Text>
          <Text
            variant={won ? 'subhead' : 'footnote'}
            color={id ? (s.winner && !won ? 'inkTertiary' : 'ink') : 'inkTertiary'}
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {id ? names.team(id, 'abbr') || names.team(id) : tt('ui.bracket.tbd')}
          </Text>
          {s.games.length ? (
            <Text variant="footnote" tabular color={won ? 'ink' : 'inkSecondary'}>
              {tour.format.knockout.bestOf > 1 ? wins : scoreOf(s, id)}
            </Text>
          ) : null}
        </View>
      );
    };
    return (
      <View
        key={key}
        style={[
          styles.series,
          {
            borderColor:
              s.a && ours.has(s.a) ? t.c.accent : s.b && ours.has(s.b) ? t.c.accent : t.c.hairline,
            backgroundColor: t.c.surface,
            borderRadius: t.radii.sm,
          },
        ]}
      >
        {row(s.a, s.seedA, s.winsA)}
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.hairline }} />
        {row(s.b, s.seedB, s.winsB)}
      </View>
    );
  };

  const scoreOf = (s: Series, id: string | null): string => {
    const g = s.games[s.games.length - 1];
    const game = g ? state.world.games[g] : undefined;
    if (!game?.result || !id) return '';
    return String(game.home === id ? game.result.home : game.result.away);
  };

  const rounds = tour.rounds;
  return (
    <Screen testID="bracket">
      <Text variant="displayM">{tournamentName(tour, tt)}</Text>
      <Text variant="footnote" color="inkSecondary">
        {tour.champion
          ? tt('ui.bracket.champion', { team: names.team(tour.champion) })
          : String(tour.season)}
      </Text>
      {tour.groups.length ? (
        <>
          <SectionHeader title={tt('ui.bracket.groups')} />
          {tour.groups.map((g) => (
            <View key={g.name} style={{ marginTop: t.space.m }}>
              <Text variant="label" color="inkSecondary">
                {g.name}
              </Text>
              {[...g.standings]
                .sort((a, b) => b.w - a.w || b.pf - b.pa - (a.pf - a.pa))
                .map((s) => (
                  <View
                    key={s.teamId}
                    style={[
                      styles.groupRow,
                      { borderBottomColor: t.c.hairline },
                      ours.has(s.teamId) && { backgroundColor: t.c.accentTint },
                    ]}
                  >
                    <Text variant="subhead" style={{ flex: 1 }} numberOfLines={1}>
                      {names.team(s.teamId)}
                    </Text>
                    <Text variant="footnote" tabular>{`${s.w}–${s.l}`}</Text>
                    <Text
                      variant="footnote"
                      color="inkSecondary"
                      tabular
                      style={{ width: 44 }}
                      align="right"
                    >
                      {`${s.pf - s.pa > 0 ? '+' : ''}${s.pf - s.pa}`}
                    </Text>
                  </View>
                ))}
            </View>
          ))}
        </>
      ) : null}
      <SectionHeader
        title={rounds.length ? tt('ui.bracket.knockout') : tt('ui.bracket.projected')}
      />
      {rounds.length ? (
        <ScrollView
          horizontal
          maximumZoomScale={2}
          minimumZoomScale={0.5}
          contentContainerStyle={{ paddingVertical: t.space.m, gap: 12 }}
        >
          {rounds.map((r) => {
            const spacing = (CELL_H + 8) * 2 ** r.index;
            return (
              <View key={r.index} style={{ width: 140 }}>
                <Text variant="label" color="inkSecondary" style={{ marginBottom: 6 }}>
                  {roundName(r.index, rounds.length, tt)}
                </Text>
                {r.series.map((s, i) => (
                  <View key={i} style={{ height: spacing, justifyContent: 'center' }}>
                    {seriesCell(s, `${r.index}-${i}`)}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={{ marginTop: t.space.s }}>
          <Text variant="footnote" color="inkSecondary" style={{ marginBottom: t.space.s }}>
            {tt('ui.bracket.projectedBody')}
          </Text>
          {tour.teams.map((id, i) => (
            <View
              key={id}
              style={[
                styles.groupRow,
                { borderBottomColor: t.c.hairline },
                ours.has(id) && { backgroundColor: t.c.accentTint },
              ]}
            >
              <Text variant="footnote" color="inkTertiary" style={{ width: 28 }} tabular>
                {i + 1}
              </Text>
              <Text variant="subhead" style={{ flex: 1 }}>
                {names.team(id)}
              </Text>
            </View>
          ))}
        </View>
      )}
      {tour.thirdPlace ? (
        <View style={{ width: 160, marginTop: t.space.m }}>
          <Text variant="label" color="inkSecondary">
            {tt('ui.bracket.third')}
          </Text>
          {seriesCell(tour.thirdPlace, 'third')}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  series: { borderWidth: 1, overflow: 'hidden' },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: CELL_H / 2,
    paddingHorizontal: 6,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
});
