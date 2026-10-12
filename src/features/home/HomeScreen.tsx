import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import {
  BasketballIcon as Basketball,
  FastForwardIcon as FastForward,
} from 'phosphor-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FeedEntry } from '@/engine/model/career';
import { dismissError, playAhead, playOn, useGame } from '@/state/game';
import { openDecide } from '@/state/decide';
import { useSettings } from '@/state/settings';
import { feedByWeek, phaseOf, weekRange } from '@/state/views';
import { Button, IconButton } from '@/ui/components/Button';
import { Banner, EmptyState } from '@/ui/components/Layout';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { FeedItem } from '../feed/FeedItem';
import { HomeHeader } from './HomeHeader';

type Row =
  | {
      readonly type: 'header';
      readonly key: string;
      readonly week: number;
      readonly year: number;
      readonly phase: string;
    }
  | {
      readonly type: 'entry';
      readonly key: string;
      readonly entry: FeedEntry;
      readonly fresh: boolean;
    };

function WeekHeader({ week, phase }: { readonly week: number; readonly phase: string }) {
  const t = useTheme();
  const { t: tt } = useT();
  return (
    <View
      style={[styles.weekHeader, { borderBottomColor: t.c.ink, marginTop: t.space.xxl }]}
      accessibilityRole="header"
    >
      <Text variant="displayL">{tt('ui.home.weekHeader', { week }).toUpperCase()}</Text>
      <Text variant="footnote" color="inkSecondary" style={{ marginBottom: 4 }}>
        {`${weekRange(week)} · ${phase}`}
      </Text>
    </View>
  );
}

/** The action dock: simulate ahead and next week, or the pending decision. */
export function ActionDock() {
  const t = useTheme();
  const { t: tt } = useT();
  const state = useGame((g) => g.state);
  const busy = useGame((g) => g.busy);
  useGame((g) => g.rev);
  const tips = useSettings((s) => s.tipsSeen);
  if (!state) return null;
  const pending = state.career.pending.length;
  // Onboarding by doing: one line next to the control it describes, once each.
  const firstWeek = state.career.stage === 'highSchool' && state.career.feed.length <= 2;
  const tip =
    !firstWeek || pending || busy ? null : !tips['plan'] ? 'plan' : !tips['next'] ? 'next' : null;
  const ended = state.career.ending !== null;
  const label = ended
    ? tt('ui.home.ended')
    : pending
      ? tt('ui.home.decide', { n: pending })
      : busy?.kind === 'ahead'
        ? tt('ui.home.simulatingAhead', { n: Math.min(busy.of, busy.weeks + 1), of: busy.of })
        : busy
          ? tt('ui.home.simulating')
          : tt('ui.home.nextWeek');
  return (
    <View style={{ backgroundColor: t.c.canvas }}>
      {tip ? (
        <Pressable
          testID={`tip-${tip}`}
          onPress={() => {
            if (tip === 'plan') router.push('/train');
            else useSettings.getState().markTip('next');
          }}
          style={[
            styles.tip,
            {
              marginHorizontal: t.gutter,
              backgroundColor: t.c.accentTint,
              borderRadius: t.radii.sm,
            },
          ]}
        >
          <Text variant="footnote" color="accentText">
            {tip === 'plan' ? tt('ui.home.tipPlan') : tt('ui.home.tipNext')}
          </Text>
        </Pressable>
      ) : null}
      <View
        style={[
          styles.dock,
          {
            paddingHorizontal: t.gutter,
            backgroundColor: t.c.canvas,
            borderTopColor: t.c.hairline,
          },
        ]}
      >
        <IconButton
          testID="simulate-ahead"
          icon={FastForward}
          label={tt('ui.home.simulateAhead')}
          disabled={!!busy || pending > 0 || ended}
          onPress={() => void playAhead()}
        />
        <Button
          testID="next-week"
          style={{ flex: 1 }}
          label={label}
          disabled={!!busy}
          onPress={() => {
            if (tip === 'next') useSettings.getState().markTip('next');
            if (ended) router.push('/ending');
            else if (pending) openDecide();
            else void playOn();
          }}
          trailing={busy ? <Basketball size={18} color={t.c.onAccent} weight="fill" /> : undefined}
        />
      </View>
    </View>
  );
}

export function HomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tt } = useT();
  const state = useGame((g) => g.state);
  const rev = useGame((g) => g.rev);
  const feedMark = useGame((g) => g.feedMark);
  const error = useGame((g) => g.error);

  const rows = useMemo<Row[]>(() => {
    if (!state) return [];
    const out: Row[] = [];
    for (const g of feedByWeek(state.career.feed)) {
      out.push({
        type: 'header',
        key: `w${g.key}`,
        week: g.date.week,
        year: g.date.year,
        phase: tt(`ui.phases.${phaseOf(state, g.date)}`),
      });
      for (const e of g.entries) {
        const idx = state.career.feed.indexOf(e);
        out.push({ type: 'entry', key: e.id, entry: e, fresh: idx >= feedMark });
      }
    }
    return out;
    // rev: the feed array is mutated in place by the engine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, rev, feedMark, tt]);

  if (!state) return null;

  return (
    <View style={{ flex: 1, backgroundColor: t.c.canvas }} testID="home">
      <FlashList
        data={rows}
        keyExtractor={(r) => r.key}
        getItemType={(r) => (r.type === 'header' ? 'header' : r.entry.kind)}
        contentContainerStyle={{
          paddingHorizontal: t.gutter,
          paddingTop: insets.top + t.space.s,
          paddingBottom: t.space.x5,
        }}
        ListHeaderComponent={
          <View style={{ gap: t.space.m }}>
            <HomeHeader />
            {error ? (
              <Banner
                tone="negative"
                title={error.kind === 'save' ? tt('ui.home.saveError') : tt('ui.home.errorTitle')}
                body={error.message}
                action={{ label: tt('ui.common.close'), onPress: dismissError }}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState title={tt('ui.home.emptyTitle')} body={tt('ui.home.emptyBody')} />
        }
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <WeekHeader week={item.week} phase={item.phase} />
          ) : (
            <Animated.View
              {...(item.fresh ? { entering: FadeInDown.duration(220) } : {})}
              style={[styles.entry, { borderBottomColor: t.c.hairline }]}
            >
              <FeedItem f={item.entry} />
            </Animated.View>
          )
        }
      />
      <ActionDock />
    </View>
  );
}

const styles = StyleSheet.create({
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    paddingBottom: 4,
  },
  entry: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  tip: { paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  dock: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
