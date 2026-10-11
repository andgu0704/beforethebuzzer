import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { userOf } from '@/engine/career/state';
import { scout } from '@/engine/draft/scouting';
import { SKILLS } from '@/engine/model/skills';
import { useGame } from '@/state/game';
import { Avatar } from '@/ui/components/Avatar';
import { EmptyState, ListRow, Screen, SectionHeader } from '@/ui/components/Layout';
import { Flag } from '@/ui/components/Marks';
import { Sparkline } from '@/ui/components/Stats';
import { Tag } from '@/ui/components/Tag';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { letter } from '../team/grades';

const money = (n: number) => Math.round(n).toLocaleString('en-US');

export function CareerScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  if (!state) return null;
  const u = userOf(state);
  const c = state.career;
  const board = state.world.draft?.board ?? [];
  const rank = board.indexOf(u.id) + 1;
  const history = c.draft.history.slice(-12).map((h) => h.rank);
  const [best, worst] = c.draft.projected;
  const view = scout(state.world, u);
  const sorted = [...SKILLS].sort((a, b) => u.skills[b] - u.skills[a]);
  const agent = c.agentId ? state.world.people[c.agentId] : undefined;
  const contract = Object.values(state.world.contracts).find((k) => k.playerId === u.id);
  const medals = Object.values(state.world.seasons)
    .flatMap((s) => s.awards)
    .filter(
      (a) =>
        a.personId === u.id &&
        (a.kind === 'medalGold' || a.kind === 'medalSilver' || a.kind === 'medalBronze'),
    );
  const callUps = Object.entries(c.callUps);
  const projected =
    best > 60
      ? tt('ui.career.projectedUndrafted')
      : worst > 60
        ? tt('ui.career.projectedFrom', { best })
        : tt('ui.career.projectedRange', { best, worst });

  return (
    <View style={{ flex: 1, backgroundColor: t.c.canvas }} testID="career">
      <Screen contentStyle={{ paddingTop: insets.top + t.space.s }}>
        <Text variant="displayL" accessibilityRole="header">
          {tt('ui.career.title').toUpperCase()}
        </Text>

        <SectionHeader
          title={tt('ui.career.stock')}
          detail={
            c.draft.declared
              ? tt('ui.career.declared')
              : c.draft.testingWaters
                ? tt('ui.career.testing')
                : undefined
          }
        />
        {rank > 0 || history.length > 0 ? (
          <View style={{ gap: t.space.m, marginTop: t.space.s }}>
            <View style={styles.stockRow}>
              <View>
                <Text variant="label" color="inkSecondary">
                  {tt('ui.career.rank')}
                </Text>
                <Text variant="scoreboard">
                  {rank > 0 ? rank : (history[history.length - 1] ?? '—')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Sparkline values={history} invert width={140} height={40} />
                <Text variant="footnote" color="inkSecondary">
                  {tt('ui.career.trend', { n: history.length })}
                </Text>
              </View>
            </View>
            <ListRow title={tt('ui.career.projected')} value={projected} />
          </View>
        ) : (
          <EmptyState title={tt('ui.career.unranked')} body={tt('ui.career.unrankedBody')} />
        )}

        <Text variant="label" color="inkSecondary" style={{ marginTop: t.space.l }}>
          {tt('ui.career.scouts')}
        </Text>
        <View style={[styles.grades, { marginTop: t.space.s }]}>
          {[
            { k: 'ceiling', v: view.ceiling },
            { k: 'readiness', v: view.current },
            { k: 'production', v: view.production },
          ].map((g) => (
            <View
              key={g.k}
              style={[styles.grade, { backgroundColor: t.c.surface, borderRadius: t.radii.md }]}
            >
              <Text variant="label" color="inkSecondary">
                {tt(`ui.career.${g.k}`)}
              </Text>
              <Text variant="stat">{letter(g.v)}</Text>
            </View>
          ))}
        </View>
        <Text variant="callout" style={{ marginTop: t.space.m }}>
          {`${tt('ui.career.likes')}: ${sorted
            .slice(0, 2)
            .map((s) => tt(`skills.${s}`).toLowerCase())
            .join(', ')}.`}
        </Text>
        <Text variant="callout" color="inkSecondary">
          {`${tt('ui.career.questions')}: ${sorted
            .slice(-2)
            .map((s) => tt(`skills.${s}`).toLowerCase())
            .join(', ')}.`}
        </Text>

        <SectionHeader title={tt('ui.career.agent')} />
        {agent?.kind === 'agent' ? (
          <ListRow
            leading={
              <Avatar name={names.person(agent.id)} portrait={agent.portrait} size={40} staff />
            }
            title={names.person(agent.id)}
            subtitle={tt('ui.career.agentQuality', {
              n: agent.quality,
              fee: `${Math.round(agent.fee * 1000) / 10}%`,
            })}
          />
        ) : (
          <EmptyState title={tt('ui.career.noAgent')} body={tt('ui.career.noAgentBody')} />
        )}

        <SectionHeader
          title={tt('ui.career.deals')}
          detail={`${tt('ui.career.money')} $${money(c.money)}`}
        />
        {c.deals.length ? (
          c.deals.map((d) => (
            <ListRow
              key={d.brand}
              title={d.brand}
              subtitle={tt('ui.career.dealLine', {
                weekly: money(d.weekly),
                blocks: d.blocks,
                ends: d.endsWeek % 52 || 52,
              })}
            />
          ))
        ) : (
          <EmptyState title={tt('ui.career.noDeals')} body={tt('ui.career.noDealsBody')} />
        )}

        <SectionHeader title={tt('ui.career.contract')} />
        {contract ? (
          <ListRow
            title={names.team(contract.teamId)}
            subtitle={tt('ui.career.contractLine', {
              salary: money(contract.salary),
              first: contract.firstSeason,
              last: contract.lastSeason,
            })}
          />
        ) : (
          <EmptyState title={tt('ui.career.amateur')} body={tt('ui.career.amateurBody')} />
        )}

        <SectionHeader title={tt('ui.career.national')} />
        <View style={[styles.stockRow, { marginTop: t.space.s }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Flag code={u.nation} size={18} showCode={false} />
            <Text variant="bodyStrong">{tt(`nations.${u.nation}`)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="label" color="inkSecondary">
                {tt('ui.career.caps')}
              </Text>
              <Text variant="stat">{c.feats.internationalCaps}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="label" color="inkSecondary">
                {tt('ui.career.medals')}
              </Text>
              <Text variant="stat">{medals.length}</Text>
            </View>
          </View>
        </View>
        {medals.length ? (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: t.space.s, flexWrap: 'wrap' }}>
            {medals.map((m, i) => (
              <Tag
                key={`${m.kind}-${i}`}
                tone={m.kind === 'medalGold' ? 'caution' : 'neutral'}
                label={tt(`ui.career.medal.${m.kind}`)}
              />
            ))}
          </View>
        ) : null}
        {callUps.length ? (
          callUps.map(([tid, answer]) => {
            const tour = state.world.tournaments[tid];
            return (
              <ListRow
                key={tid}
                title={tour ? tt(tour.nameKey, tour.nameParams) : tid}
                subtitle={`${tour?.season ?? ''}`}
                value={answer === 'accepted' ? tt('ui.career.accepted') : tt('ui.career.declined')}
              />
            );
          })
        ) : (
          <EmptyState title={tt('ui.career.noCallUps')} body={tt('ui.career.noCallUpsBody')} />
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  grades: { flexDirection: 'row', gap: 8 },
  grade: { flex: 1, padding: 12, gap: 2 },
});
