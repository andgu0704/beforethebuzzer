import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { userOf } from '@/engine/career/state';
import { haptic } from '@/platform/haptics';
import { useGame } from '@/state/game';
import { Avatar } from '@/ui/components/Avatar';
import { Button } from '@/ui/components/Button';
import { TeamMark } from '@/ui/components/Marks';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { motion } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/theme';

import { ordinal } from '../home/HomeHeader';

/** Draft night: the board fills pick by pick, the phone buzzes, and the reveal. */
export function DraftNightScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tt, names } = useT();
  const reduced = useReducedMotion();
  const state = useGame((g) => g.state);
  const picks = state?.world.draft?.picks ?? [];
  const userId = state ? userOf(state).id : '';
  const mine = picks.findIndex((p) => p.playerId === userId);
  const stopAt = mine >= 0 ? mine : picks.length - 1;
  const [shown, setShown] = useState(reduced ? stopAt + 1 : 0);
  const done = shown > stopAt;
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    if (done) {
      haptic(mine >= 0 ? 'success' : 'warning');
      return;
    }
    // Slower as his pick approaches, so the phone moment has room.
    const close = mine >= 0 && stopAt - shown <= 2;
    const id = setTimeout(
      () => {
        setShown((n) => n + 1);
        scroll.current?.scrollToEnd({ animated: true });
      },
      close ? 1400 : shown < 5 ? 500 : 180,
    );
    return () => {
      clearTimeout(id);
    };
  }, [shown, done, mine, stopAt]);

  if (!state) return null;
  const current = picks[Math.min(shown, picks.length - 1)];
  const mineTeam = mine >= 0 ? picks[mine]?.teamId : undefined;
  const phone = mine >= 0 && !done && stopAt - shown <= 1;

  return (
    <View
      style={{ flex: 1, backgroundColor: '#0F0F10', paddingTop: insets.top }}
      testID="draft-night"
    >
      <View style={{ padding: t.gutter, gap: 4 }}>
        <Text variant="label" style={{ color: '#FF5A1F' }}>
          {tt('ui.draftNight.title')}
        </Text>
        {current && !done ? (
          <View style={styles.clock}>
            <TeamMark
              teamId={current.teamId}
              abbr={names.team(current.teamId, 'abbr')}
              primary={state.world.teams[current.teamId]?.colours.primary ?? '#333'}
              secondary={state.world.teams[current.teamId]?.colours.secondary ?? '#FFF'}
              emblem={(() => {
                const tm = state.world.teams[current.teamId];
                return tm?.kind === 'pro' ? tm.emblem : undefined;
              })()}
              size={48}
            />
            <View style={{ flex: 1 }}>
              <Text variant="label" style={{ color: '#A8A49C' }}>
                {`${tt('ui.draftNight.onTheClock')} · ${tt('ui.draftNight.round', { n: current.round })}`}
              </Text>
              <Text variant="displayM" style={{ color: '#F1EFEA' }}>
                {`${current.pick}. ${names.team(current.teamId)}`}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
      {phone && mineTeam ? (
        <Animated.View
          entering={FadeIn.duration(motion.base)}
          style={[styles.phone, { marginHorizontal: t.gutter, borderRadius: t.radii.md }]}
        >
          <Text variant="subhead" style={{ color: '#141414' }}>
            {tt('ui.draftNight.phone')}
          </Text>
          <Text variant="callout" style={{ color: '#141414' }}>
            {tt('ui.draftNight.phoneBody', { team: names.team(mineTeam) })}
          </Text>
        </Animated.View>
      ) : null}
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: t.gutter, gap: 2 }}
      >
        {picks.slice(0, Math.min(shown, stopAt + 1)).map((p) => {
          const isMe = p.playerId === userId;
          const team = state.world.teams[p.teamId];
          return (
            <Animated.View
              key={p.pick}
              {...(reduced ? {} : { entering: FadeIn.duration(motion.fast) })}
              style={[styles.pick, isMe && { backgroundColor: '#FF5A1F22' }]}
            >
              <Text
                variant="stat"
                style={{ color: '#858179', width: 34, fontSize: 18, lineHeight: 22 }}
              >
                {p.pick}
              </Text>
              <View style={[styles.tick, { backgroundColor: team?.colours.primary ?? '#555' }]} />
              <Text variant="footnote" style={{ color: '#A8A49C', width: 52 }}>
                {names.team(p.teamId, 'abbr')}
              </Text>
              <Text
                variant={isMe ? 'bodyStrong' : 'callout'}
                style={{ color: isMe ? '#FF5A1F' : '#F1EFEA', flex: 1 }}
                numberOfLines={1}
              >
                {p.playerId ? names.person(p.playerId) : '—'}
              </Text>
            </Animated.View>
          );
        })}
      </ScrollView>
      {done ? (
        <Animated.View
          entering={
            reduced
              ? FadeIn
              : ZoomIn.springify()
                  .damping(motion.spring.celebrate.damping)
                  .stiffness(motion.spring.celebrate.stiffness)
          }
          style={[styles.reveal, { margin: t.gutter, borderRadius: t.radii.md }]}
        >
          {mine >= 0 && mineTeam ? (
            <>
              <Avatar
                name={names.person(userId)}
                portrait={userOf(state).portrait}
                size={96}
                primary={state.world.teams[mineTeam]?.colours.primary}
                secondary={state.world.teams[mineTeam]?.colours.secondary}
                jersey={userOf(state).jersey}
                expression="draft"
                shape="card"
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="label" style={{ color: '#5D5952' }}>
                  {tt('ui.draftNight.with', { pick: ordinal(mine + 1) })}
                </Text>
                <Text variant="displayS" style={{ color: '#141414' }}>
                  {tt('ui.draftNight.select', { team: names.team(mineTeam) })}
                </Text>
                <Text variant="displayM" style={{ color: '#C8461A' }}>
                  {names.person(userId)}
                </Text>
              </View>
            </>
          ) : (
            <Text variant="body" style={{ color: '#141414' }}>
              {tt('ui.draftNight.undraftedReveal')}
            </Text>
          )}
        </Animated.View>
      ) : null}
      <View style={{ paddingHorizontal: t.gutter, paddingBottom: insets.bottom + t.space.m }}>
        {done ? (
          <Button
            testID="draft-continue"
            label={tt('ui.draftNight.continue')}
            onPress={() => {
              router.replace('/ending');
            }}
          />
        ) : (
          <Button
            variant="secondary"
            label={tt('ui.draftNight.skip')}
            onPress={() => {
              setShown(stopAt + 1);
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clock: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  phone: { backgroundColor: '#F2B544', padding: 12, gap: 2 },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 34,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  tick: { width: 3, height: 18, borderRadius: 1 },
  reveal: {
    backgroundColor: '#F3F1EC',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
});
