import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MomentResult } from '@/engine/career/game';
import { APPROACHES, type Approach, type FeedEntry, type Interrupt } from '@/engine/model/career';
import type { PlayEvent } from '@/engine/game/types';
import { haptic } from '@/platform/haptics';
import { liveMounted } from '@/state/decide';
import { choose, playLive, setApproach, toNextGame, useGame, type LiveStep } from '@/state/game';
import {
  clockAt,
  lineSoFar,
  nextUserGame,
  opponentOf,
  ownTeamOf,
  playerOf,
  pointsOf,
  shownGame,
  sideOf,
  venueOf,
  weeksUntil,
} from '@/state/live';
import { fullTeamName, recordOf, recordText, tournamentName, weekRange } from '@/state/views';
import { Button } from '@/ui/components/Button';
import { SegmentedControl } from '@/ui/components/Controls';
import { TeamMark } from '@/ui/components/Marks';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { ChoiceButton } from '../decide/ChoiceButton';
import { MomentView } from '../decide/MomentView';
import { clockText, periodText } from '../decide/labels';

type Phase = 'pregame' | 'starting' | 'waiting' | 'watching' | 'moment' | 'final';
type Speed = '1' | '2' | '4';
const MS_PER_PLAY: Record<Speed, number> = { '1': 420, '2': 200, '4': 80 };

/** His game, played out in front of him: pre-game, the score as it moves, his calls, the final. */
export function LiveScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  const busy = useGame((g) => g.busy);
  const pending = state?.career.pending[0] ?? null;
  const [phase, setPhase] = useState<Phase>(() =>
    state?.career.cursor.live ? 'watching' : 'pregame',
  );
  const [shown, setShown] = useState(0);
  const [speed, setSpeed] = useState<Speed>('2');
  // A key moment he has answered, kept on screen with its clip until he goes back to the game.
  const [resolved, setResolved] = useState<{
    readonly i: Extract<Interrupt, { kind: 'keyMoment' }>;
    readonly result: MomentResult;
    readonly entry?: FeedEntry;
  } | null>(null);
  const [pointsAtStart, setPointsAtStart] = useState(state?.career.skillPointsEarned ?? 0);

  useEffect(() => {
    liveMounted(true);
    return () => {
      liveMounted(false);
    };
  }, []);

  const live = state ? shownGame(state) : null;
  const plays = live?.live.plays ?? [];
  const caughtUp = shown >= plays.length;
  const openMoment =
    resolved?.i ??
    (phase === 'watching' && caughtUp && pending?.kind === 'keyMoment' ? pending : null);
  const view: Phase | 'moment' | 'final' = openMoment
    ? 'moment'
    : phase === 'watching' && caughtUp && live && !state?.career.cursor.live
      ? 'final'
      : phase;

  // Hand control back to the engine: run on to the next key moment or the final buzzer.
  const runGame = () => {
    const step = playLive();
    if (step === 'busy') return;
    setPhase('watching');
  };

  const after = (step: LiveStep) => {
    if (step === 'gameStart') {
      setPointsAtStart(useGame.getState().state?.career.skillPointsEarned ?? 0);
      setShown(0);
      runGame();
    } else if (step === 'interrupt') setPhase('waiting');
    else if (step === 'ended') router.replace('/ending');
    else setPhase('pregame');
  };

  const tipOff = () => {
    setPhase('starting');
    void toNextGame().then(after);
  };

  // A decision came up on the way to the game (it opens in its own sheet): carry on once answered.
  useEffect(() => {
    if (phase !== 'waiting' || pending || busy) return;
    void toNextGame().then(after);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, pending, busy]);

  // Reopened in the middle of a game: let the engine run on from where it stopped.
  useEffect(() => {
    if (
      useGame.getState().state?.career.cursor.live &&
      !useGame.getState().state?.career.pending.length
    )
      playLive();
  }, []);

  // The clock runs: one play at a time until the engine's log is caught up.
  useEffect(() => {
    if (phase !== 'watching' || shown >= plays.length) return;
    const id = setTimeout(() => {
      setShown((n) => Math.min(plays.length, n + 1));
    }, MS_PER_PLAY[speed]);
    return () => {
      clearTimeout(id);
    };
  }, [phase, shown, plays.length, speed]);

  // A buzz when the game stops for him, and when it ends.
  useEffect(() => {
    if (view === 'moment') haptic('warning');
    if (view === 'final') haptic('success');
  }, [view]);

  if (!state) return null;
  const career = state.career;

  if (phase === 'pregame' || phase === 'starting' || phase === 'waiting') {
    const next = nextUserGame(state);
    return (
      <View style={{ flex: 1, backgroundColor: t.c.canvas, paddingTop: insets.top }} testID="live">
        <ScrollView
          contentContainerStyle={{ padding: t.gutter, gap: t.space.l, paddingBottom: t.space.x5 }}
        >
          <View style={styles.topRow}>
            <Button
              variant="tertiary"
              size="compact"
              label={tt('ui.common.close')}
              onPress={() => {
                router.back();
              }}
            />
          </View>
          {next ? <Matchup gameId={next.id} /> : <Text variant="body">{tt('ui.live.noGame')}</Text>}
          {next ? (
            <View style={{ gap: t.space.s }}>
              <Text variant="label" color="inkSecondary">
                {tt('ui.live.approach.title')}
              </Text>
              {APPROACHES.map((a) => (
                <ApproachOption
                  key={a}
                  approach={a}
                  selected={career.approach === a}
                  onPress={() => {
                    setApproach(a);
                  }}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
        <View
          style={[
            styles.dock,
            {
              paddingHorizontal: t.gutter,
              paddingBottom: insets.bottom + 10,
              borderTopColor: t.c.hairline,
            },
          ]}
        >
          <Button
            testID="tip-off"
            style={{ flex: 1 }}
            label={
              phase === 'pregame'
                ? next && weeksUntil(state, next) > 0
                  ? tt('ui.live.toGameDay')
                  : tt('ui.live.tipOff')
                : tt('ui.home.simulating')
            }
            disabled={!next || phase !== 'pregame' || !!busy}
            onPress={tipOff}
          />
        </View>
      </View>
    );
  }

  if (!live) return null;
  const side = live.userSide;
  const other = side === 0 ? 1 : 0;
  const last = plays[shown - 1];
  const score: readonly [number, number] = last ? last.score : [0, 0];
  const at = clockAt(live.live, last?.t ?? 0);
  const gameRecord = state.world.games[live.gameId];
  const us = side === 0 ? gameRecord?.home : gameRecord?.away;
  const them = side === 0 ? gameRecord?.away : gameRecord?.home;
  const mine = lineSoFar(live.live, career.playerId, shown);
  const final = view === 'final';

  return (
    <View style={{ flex: 1, backgroundColor: t.c.canvas, paddingTop: insets.top }} testID="live">
      <View style={{ paddingHorizontal: t.gutter, paddingTop: t.space.s, gap: t.space.s }}>
        {view === 'moment' ? null : (
          <Board
            us={us ?? ''}
            them={them ?? ''}
            scoreUs={final ? live.live.score[side] : score[side]}
            scoreThem={final ? live.live.score[other] : score[other]}
            clock={final ? tt('ui.live.final') : clockText(at.clock)}
            period={final ? '' : periodText(state, live.gameId, at.period, tt)}
          />
        )}
        <Text variant="footnote" color="inkSecondary" testID="live-line">
          {live.absent
            ? tt(`ui.live.absent.${live.absent}`)
            : tt('ui.live.line', {
                name: names.person(career.playerId, 'family'),
                pts: mine.pts,
                reb: mine.reb,
                ast: mine.ast,
                fgm: mine.fgm,
                fga: mine.fga,
              })}
        </Text>
      </View>

      {view === 'moment' && openMoment ? (
        <ScrollView contentContainerStyle={{ padding: t.gutter, gap: t.space.l }}>
          <MomentView
            i={openMoment}
            result={resolved?.result}
            entry={resolved?.entry}
            onChoose={(c) => {
              const mark = career.feed.length;
              const outcome = choose(openMoment.id, c) as MomentResult;
              haptic(outcome.success ? 'success' : 'warning');
              const entry = useGame
                .getState()
                .state?.career.feed.slice(mark)
                .find((f) => f.kind === 'moment');
              setResolved({ i: openMoment, result: outcome, ...(entry ? { entry } : {}) });
            }}
          />
          {resolved ? (
            <Button
              testID="moment-continue"
              label={tt('ui.live.continue')}
              onPress={() => {
                setResolved(null);
                runGame();
              }}
            />
          ) : null}
        </ScrollView>
      ) : final ? (
        <FinalView
          gameId={live.gameId}
          won={live.live.score[side] > live.live.score[other]}
          points={career.skillPointsEarned - pointsAtStart}
        />
      ) : (
        <FlatList
          testID="play-by-play"
          data={plays.slice(0, shown).reverse()}
          keyExtractor={(_, i) => String(shown - i)}
          contentContainerStyle={{ padding: t.gutter, gap: 2 }}
          renderItem={({ item }) => <PlayRow p={item} side={side} live={live.live} />}
        />
      )}

      {view === 'watching' ? (
        <View
          style={[
            styles.dock,
            {
              paddingHorizontal: t.gutter,
              paddingBottom: insets.bottom + 10,
              borderTopColor: t.c.hairline,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <SegmentedControl
              testID="live-speed"
              options={[
                { id: '1', label: '1×' },
                { id: '2', label: '2×' },
                { id: '4', label: '4×' },
              ]}
              value={speed}
              onChange={setSpeed}
            />
          </View>
          <Button
            testID="live-skip"
            size="compact"
            variant="secondary"
            label={tt('ui.live.skip')}
            onPress={() => {
              setShown(plays.length);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

function Board({
  us,
  them,
  scoreUs,
  scoreThem,
  clock,
  period,
}: {
  readonly us: string;
  readonly them: string;
  readonly scoreUs: number;
  readonly scoreThem: number;
  readonly clock: string;
  readonly period: string;
}) {
  const t = useTheme();
  const { names } = useT();
  const state = useGame((g) => g.state);
  const usTeam = state?.world.teams[us];
  const themTeam = state?.world.teams[them];
  return (
    <View
      testID="live-board"
      style={[
        styles.board,
        {
          backgroundColor: t.scheme === 'light' ? '#141414' : t.c.surface,
          borderRadius: t.radii.md,
        },
      ]}
      accessible
      accessibilityLabel={`${names.team(us)} ${scoreUs}, ${names.team(them)} ${scoreThem}. ${clock} ${period}`}
    >
      <View style={styles.boardSide}>
        <View style={[styles.tick, { backgroundColor: usTeam?.colours.primary ?? t.c.accent }]} />
        <Text variant="displayS" style={{ color: '#F1EFEA' }}>
          {names.team(us, 'abbr')}
        </Text>
        <Text variant="scoreboard" style={{ color: '#F1EFEA', fontSize: 34, lineHeight: 38 }}>
          {scoreUs}
        </Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text variant="stat" style={{ color: '#FF5A1F' }}>
          {clock}
        </Text>
        <Text variant="label" style={{ color: '#A8A49C' }}>
          {period}
        </Text>
      </View>
      <View style={[styles.boardSide, { justifyContent: 'flex-end' }]}>
        <Text variant="scoreboard" style={{ color: '#F1EFEA', fontSize: 34, lineHeight: 38 }}>
          {scoreThem}
        </Text>
        <Text variant="displayS" style={{ color: '#F1EFEA' }}>
          {names.team(them, 'abbr')}
        </Text>
        <View
          style={[styles.tick, { backgroundColor: themTeam?.colours.primary ?? t.c.inkTertiary }]}
        />
      </View>
    </View>
  );
}

function PlayRow({
  p,
  side,
  live,
}: {
  readonly p: PlayEvent;
  readonly side: 0 | 1;
  readonly live: Parameters<typeof playerOf>[0];
}) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const career = useGame((g) => g.state?.career);
  const who = playerOf(live, p);
  const me = who === career?.playerId;
  const ours = p.side === side;
  const at = clockAt(live, p.t);
  const pts = pointsOf(p);
  return (
    <View
      style={[
        styles.play,
        {
          borderLeftColor: ours ? t.c.accent : t.c.hairline,
          backgroundColor: me ? t.c.accentTint : 'transparent',
          borderRadius: t.radii.xs,
        },
      ]}
    >
      <Text variant="caption" color="inkTertiary" style={{ width: 44 }}>
        {clockText(at.clock)}
      </Text>
      <Text
        variant={me ? 'subhead' : 'callout'}
        color={me ? 'accentText' : 'ink'}
        style={{ flex: 1 }}
      >
        {tt(`ui.live.play.${p.kind}`, { name: who ? names.person(who, 'family') : '' })}
      </Text>
      <Text variant="caption" color={pts ? 'ink' : 'inkTertiary'}>
        {`${p.score[side]}–${p.score[side === 0 ? 1 : 0]}`}
      </Text>
    </View>
  );
}

function FinalView({
  gameId,
  won,
  points,
}: {
  readonly gameId: string;
  readonly won: boolean;
  readonly points: number;
}) {
  const t = useTheme();
  const { t: tt, m } = useT();
  const state = useGame((g) => g.state);
  if (!state) return null;
  const entry = [...state.career.feed]
    .reverse()
    .find((f) => f.kind === 'game' && f.gameId === gameId);
  const d = entry?.data;
  const spend = Math.floor(state.career.skillPoints);
  return (
    <ScrollView contentContainerStyle={{ padding: t.gutter, gap: t.space.l }} testID="live-final">
      <Text variant="displayM" color={won ? 'positive' : 'negative'}>
        {won ? tt('ui.live.won') : tt('ui.live.lost')}
      </Text>
      {entry ? <Text variant="body">{m(entry.message)}</Text> : null}
      {entry && d && Number(d['min']) > 0 ? (
        <View
          style={[styles.coach, { borderLeftColor: t.c.accent, backgroundColor: t.c.surface }]}
          testID="live-coach"
        >
          <Text variant="label" color="inkSecondary">
            {tt('ui.live.coach.kicker')}
          </Text>
          <Text variant="callout">
            {tt(`ui.live.coach.${state.career.approach}.${verdictOf(entry.message.key, won)}`)}
          </Text>
        </View>
      ) : null}
      {d && Number(d['min']) > 0 ? (
        <View style={styles.statRow}>
          {(
            [
              ['min', 'ui.game.min'],
              ['pts', 'ui.game.pts'],
              ['reb', 'ui.game.reb'],
              ['ast', 'ui.game.ast'],
              ['stl', 'ui.game.stl'],
              ['blk', 'ui.game.blk'],
            ] as const
          ).map(([k, label]) => (
            <View key={k} style={{ alignItems: 'center', gap: 2 }}>
              <Text variant="label" color="inkSecondary">
                {tt(label)}
              </Text>
              <Text variant="stat">{String(d[k] ?? 0)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {points > 0.05 ? (
        <Text variant="subhead" color="accentText">
          {tt('ui.live.earned', { n: points.toFixed(1) })}
        </Text>
      ) : null}
      <View style={{ gap: t.space.s }}>
        {spend > 0 ? (
          <Button
            testID="live-upgrade"
            variant="secondary"
            label={tt('ui.live.upgrade', { n: spend })}
            onPress={() => {
              router.replace('/train');
            }}
          />
        ) : null}
        <Button
          testID="live-box"
          variant="secondary"
          label={tt('ui.live.boxScore')}
          onPress={() => {
            router.push(`/game/${gameId}`);
          }}
        />
        <Button
          testID="live-done"
          label={tt('ui.live.done')}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/home');
          }}
        />
      </View>
    </ScrollView>
  );
}

/** How the night went, from the feed headline: a big game, a poor one, or somewhere between. */
function verdictOf(key: string, won: boolean): 'good' | 'bad' | 'ok' {
  if (/bigGame|gameWinner/.test(key)) return 'good';
  if (/badGame/.test(key)) return 'bad';
  return won ? 'ok' : 'bad';
}

/** Both teams, their records, where and when, and what is at stake. */
function Matchup({ gameId }: { readonly gameId: string }) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  const game = state?.world.games[gameId];
  const view = useMemo(() => {
    if (!state || !game) return null;
    const own = ownTeamOf(state, game);
    const opp = opponentOf(state, game);
    return { own, opp, side: sideOf(state, game), venue: venueOf(state, game) };
  }, [state, game]);
  if (!state || !game || !view?.own) return null;
  const teams = [view.own, view.opp] as const;
  const weeks = weeksUntil(state, game);
  const tour = game.tournamentId ? state.world.tournaments[game.tournamentId] : undefined;
  const competition = tour ? tournamentName(tour, tt) : tt(`ui.game.kinds.${game.kind}`);
  return (
    <View style={{ gap: t.space.m }} testID="matchup">
      <Text variant="label" color="brandText">
        {weeks === 0 ? tt('ui.live.nextGame') : tt('ui.live.inWeeks', { n: weeks })}
      </Text>
      <View style={styles.matchRow}>
        {teams.map((id, i) => {
          const team = state.world.teams[id];
          return (
            <View key={id} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              {team ? (
                <TeamMark
                  teamId={team.id}
                  abbr={team.abbr}
                  primary={team.colours.primary}
                  secondary={team.colours.secondary}
                  emblem={team.kind === 'pro' ? team.emblem : undefined}
                  size={64}
                />
              ) : null}
              <Text variant="displayS" align="center" numberOfLines={2}>
                {fullTeamName(names, id)}
              </Text>
              <Text variant="footnote" color="inkSecondary">
                {i === 0 ? tt('ui.live.you') : tt('ui.live.them')}
                {` · ${recordText(recordOf(state, id))}`}
              </Text>
            </View>
          );
        })}
      </View>
      <Text variant="callout" color="inkSecondary" align="center">
        {[
          tt(`ui.live.venue.${view.venue}`),
          competition,
          weekRange(game.date.week),
          tt('ui.live.role', { role: state.career.role }),
        ].join(' · ')}
      </Text>
    </View>
  );
}

function ApproachOption({
  approach,
  selected,
  onPress,
}: {
  readonly approach: Approach;
  readonly selected: boolean;
  readonly onPress: () => void;
}) {
  const { t: tt } = useT();
  return (
    <ChoiceButton
      testID={`approach-${approach}`}
      label={tt(`ui.live.approach.${approach}`)}
      read={tt(`ui.live.approach.${approach}Body`)}
      selected={selected}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  board: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  boardSide: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  tick: { width: 4, height: 26, borderRadius: 1 },
  play: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderLeftWidth: 3,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  matchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  coach: { gap: 4, padding: 12, borderLeftWidth: 3, borderRadius: 6 },
});
