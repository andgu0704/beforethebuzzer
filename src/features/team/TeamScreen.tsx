import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { content } from '@/content';
import { userOf, type GameState } from '@/engine/career/state';
import { seasonOf } from '@/engine/core/calendar';
import type { TeamId } from '@/engine/core/ids';
import { overallOf } from '@/engine/game/ratings';
import { isPlayer, type Player } from '@/engine/model/person';
import type { Team } from '@/engine/model/team';
import { conferenceStandings } from '@/engine/season/standings';
import { useGame } from '@/state/game';
import { currentTeam, dayLabel, recordOf, recordText, teamSchedule } from '@/state/views';
import { Avatar } from '@/ui/components/Avatar';
import { SegmentedControl } from '@/ui/components/Controls';
import { EmptyState, Rule, Screen, SectionHeader } from '@/ui/components/Layout';
import { TeamMark } from '@/ui/components/Marks';
import { Meter } from '@/ui/components/Meter';
import { Tag } from '@/ui/components/Tag';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { letter } from './grades';

type Tab = 'roster' | 'coach' | 'schedule' | 'standings';

function Roster({ state, team }: { readonly state: GameState; readonly team: Team }) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const players = team.roster.map((id) => state.world.people[id]).filter(isPlayer);
  if (!players.length)
    return <EmptyState title={tt('ui.team.offseason')} body={tt('ui.team.offseasonBody')} />;
  const rated = players
    .map((p) => ({ p, ovr: overallOf(p.skills, p.position, p.heightCm) }))
    .sort((a, b) => b.ovr - a.ovr);
  const roleOf = (i: number, p: Player) =>
    p.isUser
      ? state.career.role
      : i === 0
        ? 'star'
        : i < 5
          ? 'starter'
          : i < 9
            ? 'rotation'
            : 'bench';
  return (
    <View>
      {rated.map(({ p, ovr }, i) => (
        <View
          key={p.id}
          style={[
            styles.row,
            { borderBottomColor: t.c.hairline },
            p.isUser && {
              backgroundColor: t.c.accentTint,
              marginHorizontal: -8,
              paddingHorizontal: 8,
              borderRadius: t.radii.sm,
            },
          ]}
          accessible
          accessibilityLabel={`${names.person(p.id)}, ${tt(`ui.positions.${p.position}`)}, ${tt(`ui.team.roles.${roleOf(i, p)}`)}, grade ${letter(ovr)}`}
        >
          <Avatar
            name={names.person(p.id)}
            portrait={p.portrait}
            size={36}
            primary={team.colours.primary}
            secondary={team.colours.secondary}
            jersey={p.jersey}
          />
          <View style={{ flex: 1 }}>
            <Text variant="subhead" numberOfLines={1}>
              {`${names.person(p.id)}${p.isUser ? ` · ${tt('ui.team.you')}` : ''}`}
            </Text>
            <Text variant="footnote" color="inkSecondary">
              {`#${p.jersey} · ${p.position} · ${p.affiliation.kind === 'college' ? tt(`ui.team.class.${p.affiliation.classYear}`) : ''} · ${tt(`ui.team.roles.${roleOf(i, p)}`)}`}
            </Text>
          </View>
          <Text variant="stat" style={{ fontSize: 22, lineHeight: 26, minWidth: 36 }} align="right">
            {letter(ovr)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function band(v: number, low: number, high: number): 'low' | 'medium' | 'high' {
  return v < low ? 'low' : v > high ? 'high' : 'medium';
}

function Coach({ state, team }: { readonly state: GameState; readonly team: Team }) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const coach = team.coachId ? state.world.people[team.coachId] : undefined;
  if (coach?.kind !== 'coach') return <EmptyState title={tt('ui.team.noTeam')} />;
  const trust = state.career.coachTrust;
  const quote = trust < 40 ? 'low' : trust < 70 ? 'mid' : 'high';
  const pace = band(coach.tactics.pace, 40, 60);
  return (
    <View style={{ gap: t.space.l, marginTop: t.space.l }}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <Avatar
          name={names.person(coach.id)}
          portrait={coach.portrait}
          size={72}
          staff
          expression={trust > 60 ? 'smile' : 'focused'}
          shape="card"
        />
        <View style={{ flex: 1 }}>
          <Text variant="displayS">{names.person(coach.id)}</Text>
          <Text variant="footnote" color="inkSecondary">
            {names.team(team.id)}
          </Text>
        </View>
      </View>
      <Text variant="body" style={{ fontStyle: 'italic' }}>
        {tt(`ui.team.quotes.${quote}`)}
      </Text>
      <Meter label={tt('ui.team.coachTrust')} value={trust} />
      <Rule />
      {(['development', 'discipline', 'acumen'] as const).map((k) => (
        <View key={k} style={styles.kv}>
          <Text variant="callout">{tt(`ui.team.${k}`)}</Text>
          <Text variant="stat" style={{ fontSize: 22, lineHeight: 26 }}>
            {letter(coach[k] * 0.8 + 10)}
          </Text>
        </View>
      ))}
      <Rule />
      <Text variant="label" color="inkSecondary">
        {tt('ui.team.style')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Tag
          label={tt(
            `ui.team.pace.${pace === 'low' ? 'slow' : pace === 'high' ? 'fast' : 'medium'}`,
          )}
        />
        <Tag label={tt(`ui.team.threes.${band(coach.tactics.threeRate, 40, 60)}`)} />
        <Tag label={tt(`ui.team.pressure.${band(coach.tactics.pressure, 40, 60)}`)} />
        <Tag label={tt('ui.team.depth', { n: coach.tactics.depth })} />
      </View>
    </View>
  );
}

function Schedule({ state, team }: { readonly state: GameState; readonly team: Team }) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const games = teamSchedule(state, team.id);
  if (!games.length)
    return <EmptyState title={tt('ui.team.noGames')} body={tt('ui.team.noGamesBody')} />;
  return (
    <View>
      {games.map((g) => {
        const home = g.home === team.id;
        const opp: TeamId = home ? g.away : g.home;
        const r = g.result;
        const us = r ? (home ? r.home : r.away) : 0;
        const them = r ? (home ? r.away : r.home) : 0;
        const won = us > them;
        const oppTeam = state.world.teams[opp];
        const row = (
          <View style={[styles.row, { borderBottomColor: t.c.hairline }]}>
            <Text variant="footnote" color="inkSecondary" style={{ width: 52 }} tabular>
              {dayLabel(g.date.week, g.slot * 3)}
            </Text>
            {oppTeam ? (
              <TeamMark
                teamId={opp}
                abbr={oppTeam.abbr}
                primary={oppTeam.colours.primary}
                secondary={oppTeam.colours.secondary}
                emblem={oppTeam.kind === 'pro' ? oppTeam.emblem : undefined}
                size={26}
              />
            ) : null}
            <Text variant="subhead" style={{ flex: 1 }} numberOfLines={1}>
              {`${g.neutral ? tt('ui.team.vs') : home ? tt('ui.team.vs') : tt('ui.team.at')} ${names.team(opp)}`}
            </Text>
            {r ? (
              <Text variant="subhead" color={won ? 'positive' : 'negative'} tabular>
                {`${won ? tt('ui.team.win') : tt('ui.team.loss')} ${us}–${them}`}
              </Text>
            ) : (
              <Text variant="footnote" color="inkTertiary">
                {tt('ui.team.upcoming')}
              </Text>
            )}
          </View>
        );
        return r?.box ? (
          <Pressable
            key={g.id}
            accessibilityRole="button"
            onPress={() => {
              router.push({ pathname: '/game/[gameId]', params: { gameId: g.id } });
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            {row}
          </Pressable>
        ) : (
          <View key={g.id}>{row}</View>
        );
      })}
    </View>
  );
}

function Standings({ state, team }: { readonly state: GameState; readonly team: Team }) {
  const t = useTheme();
  const { t: tt, names } = useT();
  if (team.kind !== 'college') return null;
  const season = seasonOf(state.world.date);
  const s = state.world.seasons[String(season)];
  const table = s ? conferenceStandings(state.world, season, team.conferenceId) : [];
  const conf = content.conferences.find((c) => c.id === team.conferenceId);
  const poll = s?.college.polls[s.college.polls.length - 1]?.ranking.slice(0, 25) ?? [];
  return (
    <View>
      <SectionHeader
        title={conf?.shortName ?? tt('ui.team.conference')}
        detail={`${tt('ui.team.confRecord')} · ${tt('ui.team.overall')}`}
      />
      {table.map((id, i) => {
        const r = recordOf(state, id);
        return (
          <View
            key={id}
            style={[
              styles.row,
              { borderBottomColor: t.c.hairline },
              id === team.id && {
                backgroundColor: t.c.accentTint,
                marginHorizontal: -8,
                paddingHorizontal: 8,
                borderRadius: t.radii.sm,
              },
            ]}
          >
            <Text variant="footnote" color="inkSecondary" style={{ width: 20 }} tabular>
              {i + 1}
            </Text>
            <Text variant="subhead" style={{ flex: 1 }} numberOfLines={1}>
              {names.team(id)}
            </Text>
            <Text variant="footnote" tabular style={{ width: 44 }} align="right">
              {r ? `${r.confW}–${r.confL}` : '0–0'}
            </Text>
            <Text
              variant="footnote"
              color="inkSecondary"
              tabular
              style={{ width: 48 }}
              align="right"
            >
              {recordText(r)}
            </Text>
          </View>
        );
      })}
      <SectionHeader title={tt('ui.team.poll')} />
      {poll.length ? (
        poll.map((id, i) => (
          <View
            key={id}
            style={[
              styles.row,
              { borderBottomColor: t.c.hairline },
              id === team.id && {
                backgroundColor: t.c.accentTint,
                marginHorizontal: -8,
                paddingHorizontal: 8,
                borderRadius: t.radii.sm,
              },
            ]}
          >
            <Text variant="stat" style={{ width: 32, fontSize: 18, lineHeight: 22 }}>
              {i + 1}
            </Text>
            <Text variant="subhead" style={{ flex: 1 }} numberOfLines={1}>
              {names.team(id)}
            </Text>
            <Text variant="footnote" color="inkSecondary" tabular>
              {recordText(recordOf(state, id))}
            </Text>
          </View>
        ))
      ) : (
        <Text variant="callout" color="inkSecondary" style={{ marginTop: t.space.m }}>
          {tt('ui.team.noPoll')}
        </Text>
      )}
    </View>
  );
}

export function TeamScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  const [tab, setTab] = useState<Tab>('roster');
  if (!state) return null;
  const team = currentTeam(state);
  const onTeam =
    team &&
    (userOf(state).affiliation.kind === 'college' || userOf(state).affiliation.kind === 'pro');
  return (
    <View style={{ flex: 1, backgroundColor: t.c.canvas }} testID="team">
      <Screen contentStyle={{ paddingTop: insets.top + t.space.s }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {team ? (
            <TeamMark
              teamId={team.id}
              abbr={team.abbr}
              primary={team.colours.primary}
              secondary={team.colours.secondary}
              size={40}
            />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text variant="displayL" accessibilityRole="header" numberOfLines={1}>
              {team ? names.team(team.id).toUpperCase() : tt('ui.team.title').toUpperCase()}
            </Text>
            {team ? (
              <Text variant="footnote" color="inkSecondary">
                {`${names.team(team.id, 'nickname')} · ${recordText(recordOf(state, team.id))}`}
              </Text>
            ) : null}
          </View>
        </View>
        {!team ? (
          <EmptyState title={tt('ui.team.noTeam')} body={tt('ui.team.noTeamBody')} />
        ) : (
          <>
            <View style={{ marginTop: t.space.l, marginBottom: t.space.s }}>
              <SegmentedControl
                testID="team-tabs"
                value={tab}
                onChange={setTab}
                options={(['roster', 'coach', 'schedule', 'standings'] as const).map((id) => ({
                  id,
                  label: tt(`ui.team.tabs.${id}`),
                }))}
              />
            </View>
            {tab === 'roster' ? (
              onTeam ? (
                <Roster state={state} team={team} />
              ) : (
                <EmptyState title={tt('ui.team.offseason')} body={tt('ui.team.offseasonBody')} />
              )
            ) : null}
            {tab === 'coach' ? <Coach state={state} team={team} /> : null}
            {tab === 'schedule' ? <Schedule state={state} team={team} /> : null}
            {tab === 'standings' ? <Standings state={state} team={team} /> : null}
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
