import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '../theme/theme';
import { Text } from './Text';

export interface StatItem {
  readonly value: string | number;
  readonly label: string;
  /** Spoken form, e.g. "27 points". */
  readonly spoken?: string;
}

/** "27 PTS · 6 REB · 4 AST", read by VoiceOver as a sentence. */
export function StatLine({
  items,
  size = 'regular',
}: {
  readonly items: readonly StatItem[];
  readonly size?: 'regular' | 'large';
}) {
  return (
    <View
      style={styles.statLine}
      accessible
      accessibilityLabel={items.map((i) => i.spoken ?? `${i.value} ${i.label}`).join(', ')}
    >
      {items.map((i) => (
        <View key={i.label} style={styles.statItem}>
          <Text
            variant="stat"
            style={size === 'regular' ? { fontSize: 19, lineHeight: 22 } : undefined}
          >
            {String(i.value)}
          </Text>
          <Text variant="label" color="inkSecondary">
            {i.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export interface ScorebugSide {
  readonly name: string;
  readonly abbr: string;
  readonly record?: string;
  readonly score: number;
  readonly colour: string;
  readonly won: boolean;
}

/** Final score block: two rows, team colour ticks, winner in ink and loser in tertiary. */
export function Scorebug({
  kicker,
  home,
  away,
  big = false,
}: {
  readonly kicker: string;
  readonly home: ScorebugSide;
  readonly away: ScorebugSide;
  readonly big?: boolean;
}) {
  const t = useTheme();
  const row = (s: ScorebugSide) => (
    <View style={styles.bugRow} key={s.abbr + s.name}>
      <View style={[styles.tick, { backgroundColor: s.colour }]} />
      <Text
        variant={big ? 'displayS' : 'bodyStrong'}
        color={s.won ? 'ink' : 'inkSecondary'}
        style={{ flex: 1 }}
        numberOfLines={1}
      >
        {s.name}
      </Text>
      {s.record ? (
        <Text variant="footnote" color="inkTertiary" tabular>
          {s.record}
        </Text>
      ) : null}
      <Text
        variant={big ? 'scoreboard' : 'stat'}
        color={s.won ? 'ink' : 'inkTertiary'}
        style={[{ minWidth: big ? 84 : 44 }, !big && { fontSize: 30, lineHeight: 32 }]}
        align="right"
      >
        {s.score}
      </Text>
    </View>
  );
  return (
    <View
      accessible
      accessibilityLabel={`${kicker}. ${home.name} ${home.score}, ${away.name} ${away.score}. ${home.won ? home.name : away.name} won.`}
      style={{ gap: big ? t.space.xs : 0 }}
    >
      <Text variant="label" color="inkSecondary">
        {kicker}
      </Text>
      {row(away)}
      {row(home)}
    </View>
  );
}

export interface BoxColumn {
  readonly key: string;
  readonly label: string;
  readonly width?: number;
}

/** Scrollable box score: the name column stays, numbers scroll sideways. */
export function BoxScoreTable({
  columns,
  rows,
  highlight,
}: {
  readonly columns: readonly BoxColumn[];
  readonly rows: readonly {
    readonly id: string;
    readonly name: string;
    readonly starter?: boolean;
    readonly cells: Readonly<Record<string, string | number>>;
  }[];
  readonly highlight?: string;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: 132 }}>
        <View style={[styles.boxHead, { borderBottomColor: t.c.ink }]}>
          <Text variant="label" color="inkSecondary">
            Player
          </Text>
        </View>
        {rows.map((r) => (
          <View
            key={r.id}
            style={[
              styles.boxCell,
              { borderBottomColor: t.c.hairline },
              r.id === highlight && { backgroundColor: t.c.accentTint },
            ]}
          >
            <Text variant={r.id === highlight ? 'subhead' : 'footnote'} numberOfLines={1}>
              {r.name}
            </Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.boxHead, { flexDirection: 'row', borderBottomColor: t.c.ink }]}>
            {columns.map((c) => (
              <Text
                key={c.key}
                variant="label"
                color="inkSecondary"
                align="right"
                style={{ width: c.width ?? 38 }}
              >
                {c.label}
              </Text>
            ))}
          </View>
          {rows.map((r) => (
            <View
              key={r.id}
              style={[
                styles.boxCell,
                { flexDirection: 'row', borderBottomColor: t.c.hairline },
                r.id === highlight && { backgroundColor: t.c.accentTint },
              ]}
            >
              {columns.map((c) => (
                <Text
                  key={c.key}
                  variant="footnote"
                  tabular
                  align="right"
                  style={{ width: c.width ?? 38 }}
                >
                  {String(r.cells[c.key] ?? '')}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/** A small trend line. Lower is better when `invert` (board ranks). */
export function Sparkline({
  values,
  width = 120,
  height = 32,
  invert = false,
}: {
  readonly values: readonly number[];
  readonly width?: number;
  readonly height?: number;
  readonly invert?: boolean;
}) {
  const t = useTheme();
  if (values.length < 2) return <View style={{ width, height }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - 4) + 2;
    const k = (v - min) / span;
    const y = (invert ? k : 1 - k) * (height - 4) + 2;
    return [x, y] as const;
  });
  const d = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const last = pts[pts.length - 1] ?? [0, 0];
  return (
    <Svg width={width} height={height} accessibilityElementsHidden>
      <Path d={d} stroke={t.c.accentText} strokeWidth={2} fill="none" strokeLinejoin="round" />
      <Circle cx={last[0]} cy={last[1]} r={3} fill={t.c.accentText} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  statLine: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4 },
  statItem: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  bugRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tick: { width: 4, alignSelf: 'stretch', marginVertical: 4, borderRadius: 1 },
  boxHead: { height: 30, justifyContent: 'center', borderBottomWidth: 2, paddingHorizontal: 4 },
  boxCell: {
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
});
