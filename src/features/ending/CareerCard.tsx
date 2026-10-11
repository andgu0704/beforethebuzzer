import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { userOf, type GameState } from '@/engine/career/state';
import { isPlayer } from '@/engine/model/person';
import { one, perGame } from '@/state/stats';
import { Avatar } from '@/ui/components/Avatar';
import { Flag, TeamMark } from '@/ui/components/Marks';
import { Tag } from '@/ui/components/Tag';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

/** The shareable summary: draft result, college line, medals, rival, badges. */
export const CareerCard = forwardRef<View, { readonly state: GameState }>(function CareerCard(
  { state },
  ref,
) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const u = userOf(state);
  const end = state.career.ending;
  const draftTeam = end?.teamId ? state.world.teams[end.teamId] : undefined;
  const collegeLines = u.lines.filter((l) => l.league === 'college' && !l.competition);
  const pg = perGame(collegeLines);
  const seasons = new Set(collegeLines.map((l) => l.season)).size;
  const medals = Object.values(state.world.seasons)
    .flatMap((s) => s.awards)
    .filter((a) => a.personId === u.id && a.kind.startsWith('medal'));
  const rival = state.career.rivalId ? state.world.people[state.career.rivalId] : undefined;
  const rivalPick = isPlayer(rival)
    ? state.world.draft?.picks.find((p) => p.playerId === rival.id)
    : undefined;
  const bg = draftTeam?.colours.primary ?? '#141414';
  return (
    <View
      ref={ref}
      collapsable={false}
      style={[
        styles.card,
        { backgroundColor: t.c.surface, borderRadius: t.radii.md, borderColor: t.c.hairline },
      ]}
    >
      <View style={[styles.hero, { backgroundColor: bg }]}>
        <Avatar
          name={names.person(u.id)}
          portrait={u.portrait}
          size={120}
          primary={draftTeam?.colours.primary}
          secondary={draftTeam?.colours.secondary}
          jersey={u.jersey}
          expression={end?.pick ? 'draft' : 'neutral'}
          shape="card"
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="label" style={{ color: '#FFFFFF', opacity: 0.8 }}>
            {end?.pick ? tt(`ui.ending.round.${end.pick <= 30 ? 1 : 2}`) : tt('ui.ending.kicker')}
          </Text>
          <Text
            variant={end?.pick ? 'scoreboard' : 'displayL'}
            style={{ color: '#FFFFFF' }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {end?.pick ? `#${end.pick}` : tt('ui.ending.undrafted').toUpperCase()}
          </Text>
          {draftTeam ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TeamMark
                teamId={draftTeam.id}
                abbr={draftTeam.abbr}
                primary={draftTeam.colours.secondary}
                secondary={draftTeam.colours.primary}
                emblem={draftTeam.kind === 'pro' ? draftTeam.emblem : undefined}
                size={28}
              />
              <Text variant="subhead" style={{ color: '#FFFFFF' }} numberOfLines={1}>
                {names.team(draftTeam.id)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={{ padding: t.space.l, gap: t.space.m }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text variant="displayS">{names.person(u.id)}</Text>
          <Flag code={u.nation} size={14} />
        </View>
        <View style={styles.statRow}>
          {[
            { v: tt('ui.ending.seasons', { n: seasons }), l: tt('ui.ending.collegeLine') },
            { v: one(pg.pts), l: 'PTS' },
            { v: one(pg.reb), l: 'REB' },
            { v: one(pg.ast), l: 'AST' },
          ].map((s) => (
            <View key={s.l} style={{ gap: 2 }}>
              <Text variant="label" color="inkSecondary">
                {s.l}
              </Text>
              <Text variant="stat" style={{ fontSize: 20, lineHeight: 24 }}>
                {s.v}
              </Text>
            </View>
          ))}
        </View>
        {medals.length ? (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {medals.map((m, i) => (
              <Tag
                key={i}
                tone={m.kind === 'medalGold' ? 'caution' : 'neutral'}
                label={tt(`ui.career.medal.${m.kind}`)}
              />
            ))}
          </View>
        ) : null}
        {isPlayer(rival) ? (
          <Text variant="footnote" color="inkSecondary">
            {`${tt('ui.ending.rival')}: ${rivalPick ? tt('ui.ending.rivalPick', { name: names.person(rival.id), pick: `#${rivalPick.pick}` }) : tt('ui.ending.rivalUndrafted', { name: names.person(rival.id) })}`}
          </Text>
        ) : null}
        {state.meta.integrity.godMode ? (
          <Tag tone="caution" label={tt('ui.ending.godMode')} />
        ) : null}
        <Text variant="label" color="brandText">
          BEFORE THE BUZZER
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
