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
import { dismissError, playAhead, playOn, save, useGame } from '@/state/game';
import { openDecide } from '@/state/decide';
import { useSettings } from '@/state/settings';
import { nextUserGame, opponentOf, ownTeamOf, venueOf, weeksUntil } from '@/state/live';
import { feedByWeek, fullTeamName, phaseOf, recordOf, recordText, weekRange } from '@/state/views';
import { TeamMark } from '@/ui/components/Marks';
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

/** His next game, plainly: who, where, when, and both records. Tapping it opens the game. */
function UpNext() {
  const t = useTheme();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  if (!state || state.career.ending) return null;
  const next = nextUserGame(state);
  if (!next) return null;
  const opp = opponentOf(state, next);
  const team = state.world.teams[opp];
  const own = state.world.teams[ownTeamOf(state, next)];
  const weeks = weeksUntil(state, next);
  return (
    <Pressable
      testID="up-next"
      accessibilityRole="button"
      onPress={() => {
        if (weeks <= 1 && !state.career.pending.length) router.push('/live');
      }}
      style={[
        styles.upNext,
        { backgroundColor: t.c.surface, borderRadius: t.radii.md, borderColor: t.c.hairline },
      ]}
    >
      {team ? (
        <TeamMark
          teamId={team.id}
          abbr={team.abbr}
          primary={team.colours.primary}
          secondary={team.colours.secondary}
          emblem={team.kind === 'pro' ? team.emblem : undefined}
          size={40}
        />
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" color="brandText">
          {weeks === 0 ? tt('ui.live.nextGame') : tt('ui.live.inWeeks', { n: weeks })}
        </Text>
        <Text variant="subhead" numberOfLines={1}>
          {tt(`ui.home.upNext.${venueOf(state, next)}`, {
            team: fullTeamName(names, opp),
          })}
        </Text>
        <Text variant="footnote" color="inkSecondary" numberOfLines={1}>
          {`${own ? `${names.team(own.id, 'abbr')} ${recordText(recordOf(state, own.id))}` : ''} · ${names.team(opp, 'abbr')} ${recordText(recordOf(state, opp))} · ${weekRange(next.date.week)}`}
        </Text>
      </View>
    </Pressable>
  );
}

/** The action dock: simulate ahead and next game (or week), or the pending decision. */
export function ActionDock() {
  const t = useTheme();
  const { t: tt, names } = useT();
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
  // A game this week or next: the main action is to play it.
  const next = nextUserGame(state);
  const soon = next && weeksUntil(state, next) <= 1 ? next : null;
  const gameSoon = soon !== null;
  const label = ended
    ? tt('ui.home.ended')
    : pending
      ? tt('ui.home.decide', { n: pending })
      : busy?.kind === 'ahead'
        ? tt('ui.home.simulatingAhead', { n: Math.min(busy.of, busy.weeks + 1), of: busy.of })
        : busy
          ? tt('ui.home.simulating')
          : soon
            ? tt('ui.home.nextGame', { team: names.team(opponentOf(state, soon), 'abbr') })
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
            else if (gameSoon) router.push('/live');
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
            <UpNext />
            {error ? (
              <Banner
                tone="negative"
                title={error.kind === 'save' ? tt('ui.home.saveError') : tt('ui.home.errorTitle')}
                body={error.message}
                action={
                  error.kind === 'engine'
                    ? {
                        label: tt('ui.common.retry'),
                        onPress: () => {
                          dismissError();
                          void playOn();
                        },
                      }
                    : error.kind === 'save'
                      ? {
                          label: tt('ui.common.retry'),
                          onPress: () => {
                            dismissError();
                            void save();
                          },
                        }
                      : { label: tt('ui.common.close'), onPress: dismissError }
                }
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
    flexWrap: 'wrap',
    columnGap: 12,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    paddingBottom: 4,
  },
  entry: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  tip: { paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  upNext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dock: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
