import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { planBlocks, planEnergy } from '@/engine/career/progress';
import { userOf } from '@/engine/career/state';
import { PLAN_BLOCKS, type Activity, type FeedEntry, type WeekPlan } from '@/engine/model/career';
import { SKILLS, type Skill } from '@/engine/model/skills';
import { contentIndex, setPlan, useGame } from '@/state/game';
import { useSettings } from '@/state/settings';
import { Button } from '@/ui/components/Button';
import { PlanBar, Stepper } from '@/ui/components/Controls';
import { Banner, Screen, SectionHeader } from '@/ui/components/Layout';
import { Tag } from '@/ui/components/Tag';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

const LIFE: readonly Activity[] = ['rest', 'film', 'bonding', 'study', 'media'];

function withTrain(plan: WeekPlan, skill: Skill, v: number): WeekPlan {
  const train = { ...plan.train, [skill]: v };
  if (v === 0) delete train[skill];
  return { ...plan, train };
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
  const markTip = useSettings((s) => s.markTip);
  const [draft, setDraft] = useState<WeekPlan | null>(null);
  if (!state) return null;
  const u = userOf(state);
  const plan = draft ?? state.career.plan;
  const used = planBlocks(plan);
  const left = PLAN_BLOCKS - used;
  const dirty = draft !== null;
  const forecast = Math.max(0, Math.min(100, u.energy + planEnergy(plan)));
  const trainTotal = Object.values(plan.train).reduce((a, b) => a + b, 0);
  const trends = skillTrends(state.career.feed);
  const index = contentIndex();
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
        <Text variant="label" color="inkSecondary" style={{ marginTop: t.space.s }}>
          {tt('ui.train.training')}
        </Text>
        {SKILLS.map((s) => (
          <Stepper
            key={s}
            testID={`plan-${s}`}
            label={tt(`skills.${s}`)}
            value={plan.train[s] ?? 0}
            max={PLAN_BLOCKS}
            canIncrease={left > 0}
            onChange={(v) => {
              setDraft(withTrain(plan, s, v));
            }}
          />
        ))}
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

        <SectionHeader title={tt('ui.train.skills')} />
        {SKILLS.map((s) => {
          const v = u.skills[s];
          const trend = trends[s] ?? 0;
          return (
            <View
              key={s}
              style={[styles.skill, { borderBottomColor: t.c.hairline }]}
              accessible
              accessibilityLabel={`${tt(`skills.${s}`)} ${Math.round(v)}`}
            >
              <Text variant="subhead" style={{ width: 120 }}>
                {tt(`skills.${s}`)}
              </Text>
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
              <Text
                variant="stat"
                style={{ width: 40, fontSize: 20, lineHeight: 24 }}
                align="right"
              >
                {Math.round(v)}
              </Text>
              <Text
                variant="footnote"
                color={trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'inkTertiary'}
                style={{ width: 22 }}
                align="right"
              >
                {trend > 0 ? '↑' : trend < 0 ? '↓' : ''}
              </Text>
            </View>
          );
        })}

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
    gap: 10,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  track: { flex: 1, height: 6, overflow: 'hidden' },
});
