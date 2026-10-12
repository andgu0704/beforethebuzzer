import { MinusIcon as Minus, PlusIcon as Plus } from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptic } from '@/platform/haptics';

import { useLargeText, useTheme } from '../theme/theme';
import { TOUCH } from '../theme/tokens';
import { IconButton } from './Button';
import { Text } from './Text';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  testID,
}: {
  readonly options: readonly { readonly id: T; readonly label: string }[];
  readonly value: T;
  readonly onChange: (id: T) => void;
  readonly testID?: string | undefined;
}) {
  const t = useTheme();
  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      style={[styles.seg, { backgroundColor: t.c.sunken, borderRadius: t.radii.sm }]}
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            testID={testID ? `${testID}-${o.id}` : undefined}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            onPress={() => {
              if (!on) {
                haptic('selection');
                onChange(o.id);
              }
            }}
            style={[
              styles.segItem,
              {
                borderRadius: t.radii.sm - 2,
                backgroundColor: on ? t.c.surface : 'transparent',
              },
              on &&
                t.scheme === 'light' && {
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 2,
                  shadowOffset: { width: 0, height: 1 },
                },
            ]}
          >
            <Text
              variant="subhead"
              color={on ? 'ink' : 'inkSecondary'}
              numberOfLines={1}
              style={options.length > 3 ? { fontSize: 14, letterSpacing: -0.2 } : undefined}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max,
  canIncrease = true,
  detail,
  testID,
}: {
  readonly label: string;
  readonly value: number;
  readonly onChange: (v: number) => void;
  readonly min?: number | undefined;
  readonly max: number;
  readonly canIncrease?: boolean | undefined;
  readonly detail?: string | undefined;
  readonly testID?: string | undefined;
}) {
  const t = useTheme();
  const large = useLargeText();
  return (
    <View
      style={[styles.stepper, { borderBottomColor: t.c.hairline }, large && { flexWrap: 'wrap' }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`${label}, ${detail ?? String(value)}`}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment' && value < max && canIncrease)
          onChange(value + 1);
        if (e.nativeEvent.actionName === 'decrement' && value > min) onChange(value - 1);
      }}
    >
      <View style={large ? { width: '100%' } : { flex: 1 }}>
        <Text variant="subhead">{label}</Text>
        {detail ? (
          <Text variant="footnote" color="inkSecondary">
            {detail}
          </Text>
        ) : null}
      </View>
      <IconButton
        testID={testID ? `${testID}-minus` : undefined}
        icon={Minus}
        label={`Less ${label}`}
        size={36}
        disabled={value <= min}
        onPress={() => {
          onChange(value - 1);
        }}
      />
      <Text variant="stat" style={{ minWidth: 28 }} align="center">
        {value}
      </Text>
      <IconButton
        testID={testID ? `${testID}-plus` : undefined}
        icon={Plus}
        label={`More ${label}`}
        size={36}
        disabled={value >= max || !canIncrease}
        onPress={() => {
          onChange(value + 1);
        }}
      />
    </View>
  );
}

/** The stacked bar of a week's ten blocks, coloured by group. */
export function PlanBar({
  segments,
  total,
}: {
  readonly segments: readonly {
    readonly id: string;
    readonly value: number;
    readonly tone: 'accent' | 'ink' | 'positive' | 'caution' | 'inkTertiary' | 'brand';
  }[];
  readonly total: number;
}) {
  const t = useTheme();
  const cells = segments.flatMap((s) => Array.from({ length: s.value }, () => s.tone));
  return (
    <View
      style={styles.planBar}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: total }, (_, i) => {
        const tone = cells[i];
        return (
          <View
            key={i}
            style={[
              styles.planCell,
              {
                borderRadius: t.radii.xs,
                backgroundColor: tone ? (tone === 'accent' ? t.c.accent : t.c[tone]) : t.c.sunken,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', padding: 2, gap: 2 },
  segItem: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: TOUCH + 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  planBar: { flexDirection: 'row', gap: 3, height: 12 },
  planCell: { flex: 1 },
});
