import type { Icon } from 'phosphor-react-native';
import {
  CaretRightIcon as CaretRight,
  WarningCircleIcon as WarningCircle,
} from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/theme';
import { TOUCH } from '../theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

/** A scrolling screen on the canvas with the gutter applied. */
export function Screen({
  children,
  scroll = true,
  padded = true,
  bottomInset = true,
  testID,
  contentStyle,
}: {
  readonly children: ReactNode;
  readonly scroll?: boolean | undefined;
  readonly padded?: boolean | undefined;
  readonly bottomInset?: boolean | undefined;
  readonly testID?: string | undefined;
  readonly contentStyle?: ViewStyle | undefined;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingHorizontal: padded ? t.gutter : 0,
    paddingBottom: (bottomInset ? insets.bottom : 0) + t.space.xxl,
  };
  if (!scroll)
    return (
      <View testID={testID} style={[{ flex: 1, backgroundColor: t.c.canvas }, pad, contentStyle]}>
        {children}
      </View>
    );
  return (
    <ScrollView
      testID={testID}
      style={{ flex: 1, backgroundColor: t.c.canvas }}
      contentContainerStyle={[pad, contentStyle]}
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  );
}

export function SectionHeader({
  title,
  detail,
  action,
}: {
  readonly title: string;
  readonly detail?: string | undefined;
  readonly action?: { readonly label: string; readonly onPress: () => void };
}) {
  const t = useTheme();
  return (
    <View
      style={[styles.section, { borderBottomColor: t.c.ink, marginTop: t.space.xxl }]}
      accessibilityRole="header"
    >
      <Text variant="displayM" style={{ flexShrink: 1 }}>
        {title}
      </Text>
      {detail ? (
        <Text variant="footnote" color="inkSecondary" style={{ flexShrink: 1 }} align="right">
          {detail}
        </Text>
      ) : null}
      {action ? (
        <Button label={action.label} onPress={action.onPress} variant="tertiary" size="compact" />
      ) : null}
    </View>
  );
}

export function Kicker({
  children,
  color,
}: {
  readonly children: string;
  readonly color?:
    'accentText' | 'inkSecondary' | 'brandText' | 'negative' | 'caution' | 'positive';
}) {
  return (
    <Text variant="label" color={color ?? 'inkSecondary'}>
      {children}
    </Text>
  );
}

export function ListRow({
  title,
  subtitle,
  value,
  leading,
  onPress,
  icon: IconCmp,
  chevron = !!onPress,
  testID,
  accessibilityLabel,
}: {
  readonly title: string;
  readonly subtitle?: string | undefined;
  readonly value?: string | undefined;
  readonly leading?: ReactNode | undefined;
  readonly onPress?: () => void | undefined;
  readonly icon?: Icon | undefined;
  readonly chevron?: boolean | undefined;
  readonly testID?: string | undefined;
  readonly accessibilityLabel?: string | undefined;
}) {
  const t = useTheme();
  const body = (
    <View style={[styles.row, { borderBottomColor: t.c.hairline }]}>
      {leading}
      {IconCmp ? <IconCmp size={22} color={t.c.inkSecondary} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="subhead" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color="inkSecondary" numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="stat" style={{ fontSize: 20, lineHeight: 24 }}>
          {value}
        </Text>
      ) : null}
      {chevron ? <CaretRight size={16} color={t.c.inkTertiary} weight="bold" /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle, value].filter(Boolean).join(', ')}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {body}
    </Pressable>
  );
}

export function Rule({ strong }: { readonly strong?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        height: strong ? 2 : StyleSheet.hairlineWidth,
        backgroundColor: strong ? t.c.ink : t.c.hairline,
      }}
    />
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon: IconCmp,
}: {
  readonly title: string;
  readonly body?: string | undefined;
  readonly action?: { readonly label: string; readonly onPress: () => void };
  readonly icon?: Icon | undefined;
}) {
  const t = useTheme();
  return (
    <View style={[styles.empty, { paddingVertical: t.space.x3 }]}>
      {IconCmp ? <IconCmp size={28} color={t.c.inkTertiary} /> : null}
      <Text variant="displayS" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="callout" color="inkSecondary" align="center">
          {body}
        </Text>
      ) : null}
      {action ? (
        <Button label={action.label} onPress={action.onPress} variant="secondary" size="compact" />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title,
  body,
  retry,
}: {
  readonly title: string;
  readonly body?: string | undefined;
  readonly retry?: { readonly label: string; readonly onPress: () => void };
}) {
  return (
    <EmptyState
      icon={WarningCircle}
      title={title}
      {...(body ? { body } : {})}
      {...(retry ? { action: retry } : {})}
    />
  );
}

export function Banner({
  tone = 'caution',
  title,
  body,
  action,
}: {
  readonly tone?: 'caution' | 'negative' | 'positive' | 'accent' | undefined;
  readonly title: string;
  readonly body?: string | undefined;
  readonly action?: { readonly label: string; readonly onPress: () => void };
}) {
  const t = useTheme();
  const bar = tone === 'accent' ? t.c.accent : t.c[tone];
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: t.c.surface,
          borderLeftColor: bar,
          borderRadius: t.radii.sm,
          padding: t.space.m,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="subhead">{title}</Text>
        {body ? (
          <Text variant="footnote" color="inkSecondary">
            {body}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Button label={action.label} onPress={action.onPress} variant="tertiary" size="compact" />
      ) : null}
    </View>
  );
}

export function Skeleton({
  width,
  height = 16,
}: {
  readonly width: number | `${number}%`;
  readonly height?: number | undefined;
}) {
  const t = useTheme();
  return (
    <View
      accessibilityLabel="Loading"
      style={{ width, height, borderRadius: t.radii.xs, backgroundColor: t.c.sunken }}
    />
  );
}

export function Card({
  children,
  style,
}: {
  readonly children: ReactNode;
  readonly style?: ViewStyle | undefined;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.c.surface,
          borderRadius: t.radii.md,
          padding: t.space.l,
          ...(t.scheme === 'light'
            ? {
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: t.c.hairline,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 },
              }
            : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    paddingBottom: 6,
    marginBottom: 4,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: TOUCH + 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  empty: { alignItems: 'center', gap: 8, paddingHorizontal: 24 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderLeftWidth: 3 },
});
