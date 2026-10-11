import { router } from 'expo-router';
import { ShareNetworkIcon as Share } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import { userOf } from '@/engine/career/state';
import type { SeasonLine } from '@/engine/model/person';
import { useGame } from '@/state/game';
import { one, pct, perGame } from '@/state/stats';
import { ageOf, currentTeam } from '@/state/views';
import { Avatar } from '@/ui/components/Avatar';
import { Button } from '@/ui/components/Button';
import { EmptyState, Screen, SectionHeader } from '@/ui/components/Layout';
import { Flag } from '@/ui/components/Marks';
import { BoxScoreTable } from '@/ui/components/Stats';
import { Tag } from '@/ui/components/Tag';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { formatHeight } from '../create/draft';

const SEASON_COLUMNS = [
  { key: 'gp', label: 'GP' },
  { key: 'min', label: 'MIN', width: 44 },
  { key: 'pts', label: 'PTS', width: 44 },
  { key: 'reb', label: 'REB', width: 44 },
  { key: 'ast', label: 'AST', width: 44 },
  { key: 'fg', label: 'FG%', width: 48 },
  { key: 'tp', label: '3P%', width: 48 },
  { key: 'ft', label: 'FT%', width: 48 },
] as const;

export function ProfileScreen() {
  const t = useTheme();
  const { t: tt, m, names } = useT();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  if (!state) return null;
  const u = userOf(state);
  const team = currentTeam(state);
  const groups = new Map<string, SeasonLine[]>();
  for (const l of u.lines) {
    const key = `${l.season}-${l.league}-${String(l.team)}-${l.competition ?? ''}`;
    groups.set(key, [...(groups.get(key) ?? []), l]);
  }
  const seasonRows = [...groups.entries()].map(([key, lines]) => {
    const pg = perGame(lines);
    const first = lines[0];
    const teamName = first
      ? state.world.teams[String(first.team)]
        ? names.team(String(first.team), 'abbr')
        : String(first.team)
      : '';
    return {
      id: key,
      name: `${first?.season ?? ''} ${teamName}${first?.competition ? ' *' : ''}`,
      cells: {
        gp: pg.gp,
        min: one(pg.min),
        pts: one(pg.pts),
        reb: one(pg.reb),
        ast: one(pg.ast),
        fg: pct(pg.fgPct),
        tp: pct(pg.tpPct),
        ft: pct(pg.ftPct),
      },
    };
  });
  const awards = Object.values(state.world.seasons).flatMap((s) =>
    s.awards.filter((a) => a.personId === u.id).map((a) => ({ ...a, year: s.year })),
  );
  const timeline = state.career.timeline.map((e, i) => ({ e, i })).reverse();
  return (
    <Screen testID="profile">
      <View
        style={[
          styles.card,
          { backgroundColor: team?.colours.primary ?? t.c.surface, borderRadius: t.radii.md },
        ]}
      >
        <Avatar
          name={names.person(u.id)}
          portrait={u.portrait}
          size={132}
          primary={team?.colours.primary}
          secondary={team?.colours.secondary}
          jersey={u.jersey}
          expression="smile"
          shape="card"
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="displayM" style={{ color: t.c.onAccent }}>
            {names.person(u.id)}
          </Text>
          <Text variant="footnote" style={{ color: t.c.onAccent, opacity: 0.85 }}>
            {`#${u.jersey} · ${tt(`ui.positions.${u.position}`)}`}
          </Text>
          <Text variant="footnote" style={{ color: t.c.onAccent, opacity: 0.85 }}>
            {team ? names.team(team.id) : tt(`ui.stages.${state.career.stage}`)}
          </Text>
        </View>
      </View>
      <View style={{ gap: 4, marginTop: t.space.l }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Flag code={u.nation} size={14} />
          <Text variant="callout">
            {tt('ui.profile.born', { age: ageOf(state), hometown: u.hometown })}
          </Text>
        </View>
        <Text variant="footnote" color="inkSecondary">
          {tt('ui.profile.measurements', {
            height: formatHeight(u.heightCm),
            wingspan: u.wingspanCm,
            weight: u.weightKg,
          })}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {u.traits.map((id) => (
            <Tag key={id} label={tt(`traits.${id}.name`)} tone="accent" />
          ))}
        </View>
      </View>
      <View style={{ marginTop: t.space.l }}>
        <Button
          icon={Share}
          variant="secondary"
          label={tt('ui.profile.share')}
          onPress={() => {
            router.push('/ending');
          }}
        />
      </View>

      <SectionHeader title={tt('ui.profile.seasons')} />
      {seasonRows.length ? (
        <BoxScoreTable columns={SEASON_COLUMNS} rows={seasonRows} />
      ) : (
        <EmptyState title={tt('ui.profile.noSeasons')} />
      )}

      <SectionHeader title={tt('ui.profile.awards')} />
      {awards.length ? (
        awards.map((a, i) => (
          <View key={`${a.kind}-${i}`} style={[styles.row, { borderBottomColor: t.c.hairline }]}>
            <Text variant="subhead" style={{ flex: 1 }}>
              {tt(`ui.profile.award.${a.kind}`)}
            </Text>
            <Text variant="footnote" color="inkSecondary" tabular>
              {a.year}
            </Text>
          </View>
        ))
      ) : (
        <EmptyState title={tt('ui.profile.noAwards')} body={tt('ui.profile.noAwardsBody')} />
      )}

      <SectionHeader title={tt('ui.profile.timeline')} />
      <View style={{ marginTop: t.space.s }}>
        {timeline.map(({ e, i }) => {
          const parent = e.effectOf !== null ? state.career.timeline[e.effectOf] : undefined;
          return (
            <View
              key={i}
              style={styles.node}
              accessible
              accessibilityLabel={`${e.date.year}, week ${e.date.week}. ${m(e.message)}${parent ? `. ${tt('ui.profile.because')}: ${m(parent.message)}` : ''}`}
            >
              <View style={styles.rail}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: e.important ? t.c.accent : t.c.hairline,
                      borderRadius: t.radii.full,
                    },
                  ]}
                />
                <View style={[styles.line, { backgroundColor: t.c.hairline }]} />
              </View>
              <View style={{ flex: 1, paddingBottom: t.space.l, gap: 2 }}>
                <Text variant="label" color="inkSecondary">
                  {`${e.date.year} · ${tt('ui.common.week', { week: e.date.week })}`}
                </Text>
                <Text variant={e.important ? 'bodyStrong' : 'callout'}>{m(e.message)}</Text>
                {parent ? (
                  <Text variant="footnote" color="accentText">
                    {`↳ ${tt('ui.profile.because')}: ${m(parent.message)}`}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  node: { flexDirection: 'row', gap: 12 },
  rail: { width: 12, alignItems: 'center' },
  dot: { width: 10, height: 10, marginTop: 3 },
  line: { width: 2, flex: 1, marginTop: 2 },
});
