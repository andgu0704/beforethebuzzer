import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { planBlocks, planEnergy, practiceBlocks } from '@/engine/career/progress';
import { userOf } from '@/engine/career/state';
import { headroom, practicePoints, upgradeCost } from '@/engine/career/upgrade';
import { overallOf } from '@/engine/game/ratings';
import { PLAN_BLOCKS, type Activity, type FeedEntry, type WeekPlan } from '@/engine/model/career';
import { SKILLS } from '@/engine/model/skills';
import { contentIndex, setPlan, upgrade, useGame } from '@/state/game';
import { useSettings } from '@/state/settings';
import { AnimatedNumber } from '@/ui/components/AnimatedNumber';
import { Button } from '@/ui/components/Button';
import { PlanBar, Stepper } from '@/ui/components/Controls';
import { Banner, Screen, SectionHeader } from '@/ui/components/Layout';
import { Tag } from '@/ui/components/Tag';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

const LIFE: readonly Activity[] = ['rest', 'film', 'bonding', 'study', 'media'];

/** Practice is one number now; older plans that split it by skill are folded into it. */
function withPractice(plan: WeekPlan, v: number): WeekPlan {
  return { ...plan, train: {}, practice: v };
}

/** The last change shown for each skill in the feed, for the trend arrow. */
function skillTrends(feed: readonly FeedEntry[]) {
  const out: Partial<Record<string, number>> = {};
  for (const f of feed) {
    if (f.kind !== 'development' || !f.data) continue;
    const s = f.message.params?.['skill'];
    if (typeof s === 'string') out[s] = Number(f.data['to']) - Number(f.data['from']);
  }
  return out;
}

export function TrainScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tt } = useT();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  const tipSeen = useSettings((s) => !!s.tipsSeen['plan']);
  const markTip = (id: string) => {
    useSettings.getState().markTip(id);
  };
  const [draft, setDraft] = useState<WeekPlan | null>(null);
  if (!state) return null;
  const u = userOf(state);
  const plan = draft ?? state.career.plan;
  const index = contentIndex();
  const used = planBlocks(plan);
  const left = PLAN_BLOCKS - used;
  const dirty = draft !== null;
  const forecast = Math.max(0, Math.min(100, u.energy + planEnergy(plan)));
  const trainTotal = practiceBlocks(plan);
  const pointsForecast = practicePoints(state, index, trainTotal);
  const points = state.career.skillPoints;
  const ovr = overallOf(u.skills, u.position, u.heightCm);
  const trends = skillTrends(state.career.feed);
  const earned = u.traits.map((id) => index.trait.get(id)).filter((x) => x !== undefined);
  const locked = index.content.traits.filter(
    (x) =>
      x.unlock && !u.traits.includes(x.id) && !(x.excludes ?? []).some((e) => u.traits.includes(e)),
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.c.canvas }} testID="train">
      <Screen contentStyle={{ paddingTop: insets.top + t.space.s }}>
        <Text variant="displayL" accessibilityRole="header">
          {tt('ui.train.title').toUpperCase()}
        </Text>
        {!tipSeen && state.career.stage === 'highSchool' ? (
          <View style={{ marginTop: t.space.m }}>
            <Banner
              tone="accent"
              title={tt('ui.home.tipPlan')}
              action={{
                label: tt('ui.common.done'),
                onPress: () => {
                  markTip('plan');
                },
              }}
            />
          </View>
        ) : null}

        <View
          style={[
            styles.points,
            { backgroundColor: t.c.accentTint, borderRadius: t.radii.md, marginTop: t.space.m },
          ]}
          testID="skill-points"
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="subhead" color="accentText">
              {tt('ui.train.pointsTitle')}
            </Text>
            <Text variant="footnote" color="inkSecondary">
              {tt('ui.train.pointsBody')}
            </Text>
          </View>
          <AnimatedNumber value={Math.floor(points)} style={{ color: t.c.accentText }} />
        </View>
        <SectionHeader
          title={tt('ui.train.skills')}
          detail={tt('ui.train.overall', { n: Math.round(ovr) })}
        />
        {SKILLS.map((s) => {
          const v = u.skills[s];
          const trend = trends[s] ?? 0;
          const cost = upgradeCost(u, s);
          const room = headroom(u, s);
          const affordable = points >= cost;
          return (
            <View
              key={s}
              style={[styles.skill, { borderBottomColor: t.c.hairline }]}
              accessibilityLabel={`${tt(`skills.${s}`)} ${Math.floor(v)}`}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text variant="subhead" style={{ flex: 1 }}>
                    {tt(`skills.${s}`)}
                  </Text>
                  <Text
                    variant="footnote"
                    color={trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'inkTertiary'}
                  >
                    {trend > 0 ? '↑' : trend < 0 ? '↓' : ''}
                  </Text>
                  <Text variant="stat" style={{ fontSize: 20, lineHeight: 24 }} align="right">
                    {Math.floor(v)}
                  </Text>
                </View>
                <View
                  style={[styles.track, { backgroundColor: t.c.sunken, borderRadius: t.radii.xs }]}
                >
                  <View
                    style={{
                      width: `${Math.min(100, v)}%`,
                      height: 6,
                      backgroundColor: t.c.accent,
                      borderRadius: t.radii.xs,
                    }}
                  />
                </View>
                <Text variant="footnote" color={room === 'none' ? 'caution' : 'inkSecondary'}>
                  {`${tt(`ui.train.room.${room}`)} · ${tt('ui.train.cost', { n: cost })}`}
                </Text>
              </View>
              <Button
                testID={`upgrade-${s}`}
                size="compact"
                variant={affordable ? 'primary' : 'secondary'}
                label="+1"
                disabled={!affordable}
                onPress={() => {
                  upgrade(s);
                }}
              />
            </View>
          );
        })}

        <SectionHeader
          title={tt('ui.train.plan')}
          detail={tt('ui.train.blocksLeft', { n: left })}
        />
        <View style={{ marginVertical: t.space.m }}>
          <PlanBar
            total={PLAN_BLOCKS}
            segments={[
              { id: 'train', value: trainTotal, tone: 'accent' },
              { id: 'rest', value: plan.rest, tone: 'positive' },
              { id: 'film', value: plan.film, tone: 'ink' },
              { id: 'bonding', value: plan.bonding, tone: 'brand' },
              { id: 'study', value: plan.study, tone: 'caution' },
              { id: 'media', value: plan.media, tone: 'inkTertiary' },
            ]}
          />
        </View>
        <Stepper
          testID="plan-practice"
          label={tt('ui.train.practice')}
          detail={tt('ui.train.practiceBody', { n: pointsForecast.toFixed(1) })}
          value={trainTotal}
          max={PLAN_BLOCKS}
          canIncrease={left > 0}
          onChange={(v) => {
            setDraft(withPractice(plan, v));
          }}
        />
        <Text variant="label" color="inkSecondary" style={{ marginTop: t.space.l }}>
          {tt('ui.train.life')}
        </Text>
        {LIFE.map((a) => (
          <Stepper
            key={a}
            testID={`plan-${a}`}
            label={tt(`ui.train.activities.${a}.name`)}
            detail={tt(`ui.train.activities.${a}.body`)}
            value={plan[a]}
            max={PLAN_BLOCKS}
            canIncrease={left > 0}
            onChange={(v) => {
              setDraft({ ...plan, [a]: v });
            }}
          />
        ))}

        <View
          style={[
            styles.forecast,
            { backgroundColor: t.c.surface, borderRadius: t.radii.md, marginTop: t.space.l },
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="subhead">{tt('ui.train.forecast')}</Text>
            <Text variant="footnote" color="inkSecondary">
              {forecast < 35 ? tt('ui.train.forecastLow') : tt('ui.train.forecastBody')}
            </Text>
          </View>
          <Text variant="stat" color={forecast < 35 ? 'caution' : 'ink'}>
            {`${Math.round(u.energy)} → ${Math.round(forecast)}`}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: t.space.s, marginTop: t.space.l }}>
          {dirty ? (
            <Button
              variant="secondary"
              label={tt('ui.train.reset')}
              onPress={() => {
                setDraft(null);
              }}
            />
          ) : null}
          <Button
            testID="save-plan"
            style={{ flex: 1 }}
            label={dirty ? tt('ui.train.savePlan') : tt('ui.train.saved')}
            disabled={!dirty}
            onPress={() => {
              setPlan(plan);
              setDraft(null);
              markTip('plan');
            }}
          />
        </View>

        <SectionHeader title={tt('ui.train.traits')} />
        <View style={{ gap: t.space.m, marginTop: t.space.s }}>
          {earned.map((tr) => (
            <View key={tr.id} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Text variant="bodyStrong">{tt(`traits.${tr.id}.name`)}</Text>
                <Tag
                  label={
                    tr.kind === 'gift'
                      ? tt('ui.train.gift')
                      : tr.kind === 'flaw'
                        ? tt('ui.train.flaw')
                        : tt('ui.train.earned')
                  }
                  tone={tr.kind === 'flaw' ? 'negative' : 'accent'}
                />
              </View>
              <Text variant="footnote" color="inkSecondary">
                {tt(`traits.${tr.id}.description`)}
              </Text>
            </View>
          ))}
          <Text variant="label" color="inkSecondary" style={{ marginTop: t.space.s }}>
            {tt('ui.train.locked')}
          </Text>
          {locked.map((tr) => {
            const u2 = tr.unlock;
            if (!u2) return null;
            const have = state.career.feats[u2.feat];
            return (
              <View key={tr.id} style={{ gap: 4, opacity: 0.85 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text variant="subhead">{tt(`traits.${tr.id}.name`)}</Text>
                  <Text variant="footnote" color="inkSecondary" tabular>
                    {`${tt('ui.train.progress', { n: Math.min(have, u2.count), of: u2.count })} ${tt(`ui.train.feats.${u2.feat}`)}`}
                  </Text>
                </View>
                <View
                  style={[
                    styles.track,
                    { backgroundColor: t.c.sunken, borderRadius: t.radii.xs, flex: 0 },
                  ]}
                >
                  <View
                    style={{
                      width: `${Math.min(100, (have / u2.count) * 100)}%`,
                      height: 6,
                      backgroundColor: t.c.inkTertiary,
                      borderRadius: t.radii.xs,
                    }}
                  />
                </View>
                <Text variant="footnote" color="inkSecondary">
                  {tt(`traits.${tr.id}.description`)}
                </Text>
              </View>
            );
          })}
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  forecast: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  skill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  track: { height: 6, overflow: 'hidden' },
  points: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
});
