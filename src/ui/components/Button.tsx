import type { Icon } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { haptic } from '@/platform/haptics';

import { useTheme } from '../theme/theme';
import { TOUCH } from '../theme/tokens';
import { Text } from './Text';

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | undefined;
  readonly size?: 'regular' | 'compact' | undefined;
  readonly icon?: Icon | undefined;
  readonly disabled?: boolean | undefined;
  readonly loading?: boolean | undefined;
  readonly hint?: string | undefined;
  readonly style?: ViewStyle | undefined;
  readonly testID?: string | undefined;
  readonly trailing?: ReactNode | undefined;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  icon: IconCmp,
  disabled,
  loading,
  hint,
  style,
  testID,
  trailing,
}: ButtonProps) {
  const t = useTheme();
  const height = size === 'regular' ? 52 : TOUCH;
  const fill =
    variant === 'primary'
      ? t.c.accent
      : variant === 'secondary'
        ? t.c.surface
        : variant === 'destructive'
          ? t.c.negative
          : 'transparent';
  const fg =
    variant === 'primary'
      ? t.c.onAccent
      : variant === 'destructive'
        ? t.scheme === 'light'
          ? '#FFFFFF'
          : '#141414'
        : variant === 'tertiary'
          ? t.c.accentText
          : t.c.ink;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={() => {
        haptic(variant === 'primary' ? 'light' : 'selection');
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: height,
          backgroundColor: fill,
          borderRadius: t.radii.md,
          paddingHorizontal: variant === 'tertiary' ? t.space.s : t.space.l,
          opacity: disabled ? 0.4 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        variant === 'secondary' && {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.c.hairline,
          ...(t.scheme === 'light'
            ? {
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 },
              }
            : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {IconCmp ? <IconCmp size={20} color={fg} weight="bold" /> : null}
          <Text
            variant={variant === 'primary' && size === 'regular' ? 'displayS' : 'subhead'}
            style={{
              color: fg,
              ...(variant === 'primary' && size === 'regular'
                ? { textTransform: 'uppercase', letterSpacing: 0.6 }
                : {}),
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {trailing}
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon: IconCmp,
  label,
  onPress,
  variant = 'secondary',
  size = 52,
  disabled,
  testID,
  selected,
}: {
  readonly icon: Icon;
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'secondary' | 'plain' | undefined;
  readonly size?: number | undefined;
  readonly disabled?: boolean | undefined;
  readonly testID?: string | undefined;
  readonly selected?: boolean | undefined;
}) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      disabled={disabled}
      hitSlop={size < TOUCH ? (TOUCH - size) / 2 : 0}
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      style={({ pressed }) => [
        styles.icon,
        {
          width: size,
          height: size,
          borderRadius: t.radii.md,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        variant === 'secondary' && {
          backgroundColor: t.c.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.c.hairline,
        },
      ]}
    >
      <IconCmp size={size >= 44 ? 22 : 20} color={t.c.ink} weight={selected ? 'fill' : 'bold'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { alignItems: 'center', justifyContent: 'center' },
});
