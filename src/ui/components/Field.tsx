import { CheckIcon as Check } from 'phosphor-react-native';
import type { ReactNode, Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { haptic } from '@/platform/haptics';

import { useTheme } from '../theme/theme';
import { fonts, TOUCH } from '../theme/tokens';
import { Text } from './Text';

/** A labelled text input with its validation message inline, never in an alert. */
export function TextField({
  label,
  error,
  testID,
  ref,
  ...input
}: TextInputProps & {
  readonly ref?: Ref<TextInput> | undefined;
  readonly label: string;
  readonly error?: string | undefined;
  readonly testID?: string | undefined;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color="inkSecondary">
        {label}
      </Text>
      <TextInput
        ref={ref}
        testID={testID}
        accessibilityLabel={label}
        placeholderTextColor={t.c.inkTertiary}
        {...input}
        style={[
          styles.input,
          {
            backgroundColor: t.c.surface,
            borderColor: error ? t.c.negative : t.c.hairline,
            borderRadius: t.radii.sm,
            color: t.c.ink,
            fontFamily: fonts.text,
          },
        ]}
      />
      {error ? (
        <Text variant="footnote" color="negative" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** A selectable row with a title, an optional description and a check when chosen. */
export function OptionRow({
  title,
  body,
  selected,
  onPress,
  leading,
  trailing,
  testID,
  disabled,
}: {
  readonly title: string;
  readonly body?: string | undefined;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly leading?: ReactNode | undefined;
  readonly trailing?: ReactNode | undefined;
  readonly testID?: string | undefined;
  readonly disabled?: boolean | undefined;
}) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      accessibilityLabel={body ? `${title}. ${body}` : title}
      disabled={disabled}
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      style={({ pressed }) => [
        styles.option,
        {
          borderRadius: t.radii.md,
          backgroundColor: selected ? t.c.accentTint : t.c.surface,
          borderColor: selected ? t.c.accent : t.c.hairline,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="subhead">{title}</Text>
        {body ? (
          <Text variant="footnote" color="inkSecondary">
            {body}
          </Text>
        ) : null}
      </View>
      {trailing}
      {selected ? <Check size={20} color={t.c.accentText} weight="bold" /> : null}
    </Pressable>
  );
}

/** A row of small choice chips (positions, filters). */
export function ChipRow<T extends string | number>({
  options,
  value,
  onChange,
  testID,
}: {
  readonly options: readonly { readonly id: T; readonly label: string; readonly a11y?: string }[];
  readonly value: T;
  readonly onChange: (v: T) => void;
  readonly testID?: string | undefined;
}) {
  const t = useTheme();
  return (
    <View style={styles.chips} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={String(o.id)}
            testID={testID ? `${testID}-${String(o.id)}` : undefined}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.a11y ?? o.label}
            onPress={() => {
              haptic('selection');
              onChange(o.id);
            }}
            style={[
              styles.chip,
              {
                borderRadius: t.radii.sm,
                backgroundColor: on ? t.c.accent : t.c.surface,
                borderColor: on ? t.c.accent : t.c.hairline,
              },
            ]}
          >
            <Text variant="subhead" style={{ color: on ? t.c.onAccent : t.c.ink }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: TOUCH + 4, borderWidth: 1, paddingHorizontal: 12, fontSize: 17 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: TOUCH,
    minWidth: TOUCH,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
