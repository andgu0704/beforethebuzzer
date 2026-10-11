/**
 * Plays a key moment as a 2D clip (PLAN.md §12). One Skia canvas; one Reanimated shared value,
 * `progress`, drives everything through a derived picture, so playback does no React work per
 * frame. Tap to skip to the result; a replay button appears at the end. With reduced motion the
 * clip opens on its final frame with the result line and a play button.
 */

import { Antonio_600SemiBold, Antonio_700Bold } from '@expo-google-fonts/antonio';
import { Canvas, Picture, Skia, useFont } from '@shopify/react-native-skia';
import { ArrowCounterClockwiseIcon, PlayIcon } from 'phosphor-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { fonts as fontNames, palette, TOUCH, type Scheme } from '@/ui/theme/tokens';

import { COURTS } from './court';
import { recordCourt, recordFrame } from './paint';
import { buildPlay, gameClockAt, sample } from './plays';
import {
  BOARD_H,
  describeFrame,
  FONT_SIZES,
  resolveLook,
  VIEW_H,
  VIEW_W,
  type TeamLook,
} from './scene';
import { clipTextEn, resultText, sceneLabels, type ClipText } from './text';
import { mainEnd, timelineAt, totalSeconds } from './timeline';
import type { PlayParams, PlaySpec } from './types';

export type { TeamLook } from './scene';
export type { ClipText } from './text';

export interface ClipPlayerProps {
  /** The moment's ClipSpec, or a feed entry's clip data. */
  readonly spec: PlaySpec;
  /** Side 0 of the spec. */
  readonly home: TeamLook;
  /** Side 1 of the spec. */
  readonly away: TeamLook;
  readonly params?: PlayParams;
  /** Replays the final beat in slow motion after the play. */
  readonly signature?: boolean;
  /** Start playing on mount (default true; ignored with reduced motion). */
  readonly autoPlay?: boolean;
  /** Colour scheme; follows the system when absent. */
  readonly scheme?: Scheme;
  /** The moment's result sentence, shown with reduced motion and read by screen readers. */
  readonly resultLine?: string;
  readonly text?: ClipText;
  /** Called once when the clip reaches its end, or is skipped to it. */
  readonly onFinished?: () => void;
  /** Called when the game clock hits zero during the clip (the final buzzer), for haptics. */
  readonly onBuzzer?: () => void;
  readonly style?: StyleProp<ViewStyle>;
}

export function ClipPlayer({
  spec,
  home,
  away,
  params,
  signature = false,
  autoPlay = true,
  scheme: schemeProp,
  resultLine,
  text = clipTextEn,
  onFinished,
  onBuzzer,
  style,
}: ClipPlayerProps) {
  const system = useColorScheme();
  const scheme: Scheme = schemeProp ?? (system === 'dark' ? 'dark' : 'light');
  const colours = palette[scheme];
  const reduced = useReducedMotion();

  const play = useMemo(() => buildPlay(spec, params), [spec, params]);
  const look = useMemo(() => resolveLook(scheme, home, away), [scheme, home, away]);
  const labels = useMemo(
    () => sceneLabels(play, text, [home.abbr, away.abbr]),
    [play, text, home.abbr, away.abbr],
  );
  const court = useMemo(() => recordCourt(Skia, COURTS[play.court], look), [play.court, look]);
  const total = totalSeconds(play, signature);
  const end = mainEnd(play, signature);

  const jersey = useFont(Antonio_700Bold, FONT_SIZES[0]);
  const boardL = useFont(Antonio_700Bold, FONT_SIZES[1]);
  const boardS = useFont(Antonio_600SemiBold, FONT_SIZES[2]);
  const label = useFont(Antonio_600SemiBold, FONT_SIZES[3]);

  const [width, setWidth] = useState(0);
  const height = (width * VIEW_H) / VIEW_W;
  const scale = width > 0 ? width / VIEW_W : 1;
  const autoStart = autoPlay && !reduced;
  const [state, setState] = useState<'idle' | 'playing' | 'done'>(autoStart ? 'playing' : 'idle');
  const progress = useSharedValue(autoStart ? 0 : end);

  // Callbacks from the parent are read through refs so a new closure does not restart the clip.
  const onFinishedRef = useRef(onFinished);
  const onBuzzerRef = useRef(onBuzzer);
  useEffect(() => {
    onFinishedRef.current = onFinished;
    onBuzzerRef.current = onBuzzer;
  });

  const finish = useCallback(() => {
    setState('done');
    onFinishedRef.current?.();
  }, []);

  const buzz = useCallback(() => {
    onBuzzerRef.current?.();
  }, []);

  const run = useCallback(() => {
    cancelAnimation(progress);
    progress.set(0);
    progress.set(
      withTiming(1, { duration: total * 1000, easing: Easing.linear }, (finished) => {
        if (finished) scheduleOnRN(finish);
      }),
    );
  }, [progress, total, finish]);

  const start = useCallback(() => {
    setState('playing');
    run();
  }, [run]);

  const skip = useCallback(() => {
    cancelAnimation(progress);
    progress.set(end);
    finish();
  }, [progress, end, finish]);

  useEffect(() => {
    if (autoStart) run();
    return () => {
      cancelAnimation(progress);
    };
  }, [autoStart, run, progress]);

  const picture = useDerivedValue(() => {
    const tl = [0, 0];
    timelineAt(play, progress.get(), signature, tl);
    const frame = sample(play, tl[0] ?? 0);
    const ops = describeFrame(play, frame, look, labels, (tl[1] ?? 0) > 0);
    return recordFrame(
      Skia,
      ops,
      [jersey, boardL, boardS, label],
      court,
      Math.max(1, width),
      Math.max(1, height),
      scale,
    );
  }, [play, look, labels, court, jersey, boardL, boardS, label, width, height, scale, signature]);

  useAnimatedReaction(
    () => {
      const tl = [0, 0];
      timelineAt(play, progress.get(), signature, tl);
      return (tl[1] ?? 0) > 0 ? 1 : gameClockAt(play, tl[0] ?? 0);
    },
    (clock, previous) => {
      if (play.buzzerAt >= 0 && previous !== null && previous > 0 && clock <= 0) {
        scheduleOnRN(buzz);
      }
    },
    [play, signature, buzz],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const result = resultLine ?? resultText(play, text);
  const showPlay = reduced && state !== 'playing';
  const showReplay = !reduced && state === 'done';

  return (
    <View style={style} onLayout={onLayout}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${labels.phases[0] ?? ''}. ${result}`}
        accessibilityHint={state === 'playing' ? text.skip : undefined}
        disabled={state !== 'playing'}
        onPress={skip}
      >
        <Canvas style={{ width, height, backgroundColor: colours.canvas }}>
          <Picture picture={picture} />
        </Canvas>
      </Pressable>
      {showReplay ? (
        <View style={[styles.corner, { bottom: BOARD_H * scale + 8 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.playAgain}
            onPress={start}
            hitSlop={8}
            style={[styles.round, { backgroundColor: colours.scrim }]}
          >
            <ArrowCounterClockwiseIcon size={20} color="#FFFFFF" weight="bold" />
          </Pressable>
        </View>
      ) : null}
      {showPlay ? (
        <View style={[styles.centre, { height: height - BOARD_H * scale }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.play}
            onPress={start}
            style={[styles.big, { backgroundColor: colours.brand }]}
          >
            <PlayIcon size={26} color="#FFFFFF" weight="fill" />
          </Pressable>
        </View>
      ) : null}
      {reduced ? (
        <Text style={[styles.result, { color: colours.ink }]} accessibilityRole="text">
          {result}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', right: 8 },
  round: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  big: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  result: {
    fontFamily: fontNames.text,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 8,
  },
});
