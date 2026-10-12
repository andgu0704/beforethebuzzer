import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { Player } from '@/engine/model/person';
import { haptic } from '@/platform/haptics';
import { Avatar } from '@/ui/components/Avatar';
import { Button } from '@/ui/components/Button';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { ratingFor, timingQuality, zoneWidth, type SkillKind } from './skill';

/** One sweep of the bar, in milliseconds: harder moments move faster. */
const SWEEP_MS = 900;

/**
 * The skill check: the marker sweeps along the bar and he releases it in the zone. The zone's
 * width comes from his rating for the move; where it sits changes with every moment.
 */
export function SkillCheck({
  player,
  kind,
  seed,
  colour,
  onRelease,
}: {
  readonly player: Player;
  readonly kind: SkillKind;
  /** Places the zone; the same moment always puts it in the same spot. */
  readonly seed: number;
  readonly colour?: string | undefined;
  readonly onRelease: (quality: number) => void;
}) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const rating = ratingFor(player, kind);
  const width = zoneWidth(rating);
  const centre = useMemo(() => 0.35 + (((seed * 9301 + 49297) % 233280) / 233280) * 0.5, [seed]);
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(
      withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(x);
    };
  }, [x]);
  const marker = useAnimatedStyle(() => ({ left: `${x.value * 100}%` }));
  const release = () => {
    const at = x.value;
    cancelAnimation(x);
    const q = timingQuality(at, centre, width);
    haptic(q >= 0.75 ? 'success' : 'warning');
    onRelease(q);
  };
  return (
    <View style={{ gap: t.space.m }} testID="skill-check">
      <View style={[styles.banner, { backgroundColor: '#1D3557', borderRadius: t.radii.sm }]}>
        <Text variant="displayS" style={{ color: '#FFFFFF' }} align="center">
          {tt(`ui.skill.title.${kind}`).toUpperCase()}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tt('ui.skill.release')}
        onPress={release}
        style={[styles.bar, { backgroundColor: t.c.sunken, borderRadius: 6 }]}
      >
        <View
          style={[
            styles.zone,
            {
              left: `${(centre - width / 2) * 100}%`,
              width: `${width * 100}%`,
              backgroundColor: t.c.positive,
            },
          ]}
        />
        <Animated.View style={[styles.marker, marker]} />
      </Pressable>
      <View style={styles.card}>
        <Avatar
          name={names.person(player.id)}
          portrait={player.portrait}
          size={64}
          primary={colour}
          jersey={player.jersey}
          expression="focused"
          shape="card"
        />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text variant="scoreboard" style={{ fontSize: 34, lineHeight: 38 }}>
              {rating}
            </Text>
            <Text variant="label" color="inkSecondary">
              {tt(`ui.skill.rating.${kind}`)}
            </Text>
          </View>
          <Text variant="subhead">{`${player.position} · ${names.person(player.id)}`}</Text>
        </View>
      </View>
      <Button testID="skill-release" label={tt('ui.skill.release')} onPress={release} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingVertical: 10, paddingHorizontal: 12 },
  bar: { height: 34, overflow: 'hidden', justifyContent: 'center' },
  zone: { position: 'absolute', top: 0, bottom: 0, opacity: 0.85 },
  marker: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 6,
    marginLeft: -3,
    backgroundColor: '#141414',
    borderRadius: 3,
  },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
