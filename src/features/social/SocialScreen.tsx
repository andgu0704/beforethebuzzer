import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { userOf } from '@/engine/career/state';
import { overallOf } from '@/engine/game/ratings';
import { isPlayer, type Player } from '@/engine/model/person';
import { useGame } from '@/state/game';
import { one, pct, perGame, seasonLines } from '@/state/stats';
import { Avatar } from '@/ui/components/Avatar';
import { SegmentedControl } from '@/ui/components/Controls';
import { EmptyState, Screen, SectionHeader } from '@/ui/components/Layout';
import { Meter } from '@/ui/components/Meter';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { SocialItem } from '../feed/FeedItem';
import { letter } from '../team/grades';

type Tab = 'feed' | 'press' | 'rival';

function Compare({ me, rival }: { readonly me: Player; readonly rival: Player }) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  if (!state) return null;
  const board = state.world.draft?.board ?? [];
  const a = perGame(seasonLines(state.world, me));
  const b = perGame(seasonLines(state.world, rival));
  const teamName = (p: Player) =>
    p.affiliation.kind === 'college' || p.affiliation.kind === 'pro'
      ? names.team(p.affiliation.teamId)
      : tt(`ui.stages.highSchool`);
  const rows: { label: string; a: string; b: string; better: -1 | 0 | 1 }[] = [
    { label: tt('ui.social.team'), a: teamName(me), b: teamName(rival), better: 0 },
    {
      label: tt('ui.social.grade'),
      a: letter(overallOf(me.skills, me.position, me.heightCm)),
      b: letter(overallOf(rival.skills, rival.position, rival.heightCm)),
      better: Math.sign(
        overallOf(me.skills, me.position, me.heightCm) -
          overallOf(rival.skills, rival.position, rival.heightCm),
      ) as -1 | 0 | 1,
    },
    {
      label: tt('ui.social.board'),
      a: board.includes(me.id) ? String(board.indexOf(me.id) + 1) : '—',
      b: board.includes(rival.id) ? String(board.indexOf(rival.id) + 1) : '—',
      better:
        board.includes(me.id) && board.includes(rival.id)
          ? (Math.sign(board.indexOf(rival.id) - board.indexOf(me.id)) as -1 | 0 | 1)
          : 0,
    },
    {
      label: tt('ui.social.ppg'),
      a: one(a.pts),
      b: one(b.pts),
      better: Math.sign(a.pts - b.pts) as -1 | 0 | 1,
    },
    {
      label: tt('ui.social.rpg'),
      a: one(a.reb),
      b: one(b.reb),
      better: Math.sign(a.reb - b.reb) as -1 | 0 | 1,
    },
    {
      label: tt('ui.social.apg'),
      a: one(a.ast),
      b: one(b.ast),
      better: Math.sign(a.ast - b.ast) as -1 | 0 | 1,
    },
    {
      label: tt('ui.social.fg'),
      a: pct(a.fgPct),
      b: pct(b.fgPct),
      better: Math.sign(a.fgPct - b.fgPct) as -1 | 0 | 1,
    },
  ];
  return (
    <View style={{ gap: t.space.l, marginTop: t.space.l }}>
      <View style={styles.faces}>
        <View style={styles.face}>
          <Avatar
            name={names.person(me.id)}
            portrait={me.portrait}
            size={88}
            jersey={me.jersey}
            expression="focused"
            shape="card"
          />
          <Text variant="subhead" align="center">
            {names.person(me.id)}
          </Text>
        </View>
        <Text variant="displayM" color="inkTertiary">
          VS
        </Text>
        <View style={styles.face}>
          <Avatar
            name={names.person(rival.id)}
            portrait={rival.portrait}
            size={88}
            jersey={rival.jersey}
            expression="focused"
            shape="card"
          />
          <Text variant="subhead" align="center">
            {names.person(rival.id)}
          </Text>
        </View>
      </View>
      <Text variant="label" color="inkSecondary">
        {tt('ui.social.season')}
      </Text>
      {rows.map((r) => (
        <View
          key={r.label}
          style={[styles.cmp, { borderBottomColor: t.c.hairline }]}
          accessible
          accessibilityLabel={`${r.label}: you ${r.a}, ${names.person(rival.id)} ${r.b}`}
        >
          <Text
            variant={r.better > 0 ? 'bodyStrong' : 'body'}
            color={r.better > 0 ? 'positive' : 'ink'}
            style={{ flex: 1 }}
            numberOfLines={1}
          >
            {r.a}
          </Text>
          <Text variant="label" color="inkSecondary" align="center" style={{ width: 70 }}>
            {r.label}
          </Text>
          <Text
            variant={r.better < 0 ? 'bodyStrong' : 'body'}
            color={r.better < 0 ? 'negative' : 'ink'}
            style={{ flex: 1 }}
            align="right"
            numberOfLines={1}
          >
            {r.b}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function SocialScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  const [tab, setTab] = useState<Tab>('feed');
  if (!state) return null;
  const me = userOf(state);
  const posts = state.career.feed.filter((f) => f.kind === 'social' && f.social).reverse();
  const journalist = state.career.journalistId
    ? state.world.people[state.career.journalistId]
    : undefined;
  const press = posts.filter(
    (f) => f.social?.template.includes('journalist') || f.social?.template.includes('analyst'),
  );
  const rival = state.career.rivalId ? state.world.people[state.career.rivalId] : undefined;
  return (
    <View style={{ flex: 1, backgroundColor: t.c.canvas }} testID="social">
      <Screen contentStyle={{ paddingTop: insets.top + t.space.s }}>
        <Text variant="displayL" accessibilityRole="header">
          {tt('ui.social.title').toUpperCase()}
        </Text>
        <View style={{ marginTop: t.space.l }}>
          <SegmentedControl
            testID="social-tabs"
            value={tab}
            onChange={setTab}
            options={(['feed', 'press', 'rival'] as const).map((id) => ({
              id,
              label: tt(`ui.social.tabs.${id}`),
            }))}
          />
        </View>
        {tab === 'feed' ? (
          posts.length ? (
            posts.slice(0, 80).map((f) => (
              <View key={f.id} style={[styles.post, { borderBottomColor: t.c.hairline }]}>
                <SocialItem f={f} />
              </View>
            ))
          ) : (
            <EmptyState title={tt('ui.social.quiet')} body={tt('ui.social.quietBody')} />
          )
        ) : null}
        {tab === 'press' ? (
          <View>
            {journalist?.kind === 'journalist' ? (
              <View style={{ gap: t.space.m, marginTop: t.space.l }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Avatar
                    name={names.person(journalist.id)}
                    portrait={journalist.portrait}
                    size={56}
                    staff
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="label" color="inkSecondary">
                      {tt('ui.social.journalist')}
                    </Text>
                    <Text variant="bodyStrong">{names.person(journalist.id)}</Text>
                    <Text variant="footnote" color="inkSecondary">
                      {journalist.outlet}
                    </Text>
                  </View>
                </View>
                <Meter label={tt('ui.social.relation')} value={state.career.relations.journalist} />
              </View>
            ) : null}
            <SectionHeader title={tt('ui.social.tabs.press')} />
            {press.length ? (
              press.map((f) => (
                <View key={f.id} style={[styles.post, { borderBottomColor: t.c.hairline }]}>
                  <SocialItem f={f} />
                </View>
              ))
            ) : (
              <EmptyState title={tt('ui.social.noPress')} body={tt('ui.social.noPressBody')} />
            )}
          </View>
        ) : null}
        {tab === 'rival' ? (
          isPlayer(rival) ? (
            <Compare me={me} rival={rival} />
          ) : (
            <EmptyState title={tt('ui.social.noRival')} />
          )
        ) : null}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  post: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  faces: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  face: { alignItems: 'center', gap: 8, width: 130 },
  cmp: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
