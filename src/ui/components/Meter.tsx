import { ArrowDownIcon as ArrowDown, ArrowUpIcon as ArrowUp } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import { useLargeText, useTheme } from '../theme/theme';
import { AnimatedNumber } from './AnimatedNumber';
import { Text } from './Text';

/** A labelled 0–100 value with a bar under it, as in the header (§10.7). */
export function Meter({
  label,
  value,
  trend = 0,
  tone = 'ink',
  max = 100,
  accessibilityLabel,
  format,
}: {
  readonly label: string;
  readonly value: number;
  /** Change since last week: an arrow shows its sign. */
  readonly trend?: number | undefined;
  readonly tone?: 'ink' | 'caution' | 'negative' | undefined;
  readonly max?: number | undefined;
  readonly accessibilityLabel?: string | undefined;
  readonly format?: (n: number) => string | undefined;
}) {
  const t = useTheme();
  const large = useLargeText();
  const pct = Math.max(0, Math.min(1, value / max));
  const colour = tone === 'ink' ? t.c.ink : t.c[tone];
  return (
    <View
      style={[styles.wrap, large && { minWidth: '28%' }]}
      accessible
      accessibilityLabel={accessibilityLabel ?? `${label} ${Math.round(value)}`}
    >
      <Text variant="label" color="inkSecondary" numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <AnimatedNumber
          value={format ? value : Math.round(value)}
          variant="stat"
          style={{ color: colour }}
          {...(format ? { format } : {})}
        />
        {trend > 0.5 ? (
          <ArrowUp size={14} color={t.c.positive} weight="bold" />
        ) : trend < -0.5 ? (
          <ArrowDown size={14} color={t.c.negative} weight="bold" />
        ) : null}
      </View>
      <View style={[styles.track, { backgroundColor: t.c.sunken, borderRadius: t.radii.xs }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%`, backgroundColor: colour, borderRadius: t.radii.xs },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 52, gap: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  track: { height: 3, overflow: 'hidden', marginTop: 2 },
  fill: { height: 3 },
});
