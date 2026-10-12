import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { haptic } from '@/platform/haptics';
import { Text } from '@/ui/components/Text';
import { useTheme } from '@/ui/theme/theme';

/** One answer to a decision; an optional read line and a "Because you…" badge. */
export function ChoiceButton({
  label,
  read,
  because,
  onPress,
  testID,
  selected,
  disabled,
}: {
  readonly label: string;
  readonly read?: string | undefined;
  readonly because?: string | null | undefined;
  readonly onPress: () => void;
  readonly testID?: string | undefined;
  readonly selected?: boolean | undefined;
  readonly disabled?: boolean | undefined;
}) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      // In the order they're shown, so the spoken name matches what's on screen. The web reads
      // the content itself.
      accessibilityLabel={
        Platform.OS === 'web' ? undefined : [because, label, read].filter(Boolean).join('. ')
      }
      aria-disabled={!!disabled}
      // Selected is a native state only: the web has no selected button.
      accessibilityState={{ selected: !!selected }}
      disabled={disabled}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      style={({ pressed }) => [
        styles.choice,
        {
          borderRadius: t.radii.md,
          backgroundColor: selected ? t.c.accentTint : t.c.surface,
          borderColor: selected ? t.c.accent : t.c.hairline,
          opacity: disabled && !selected ? 0.4 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {because ? (
        <View style={[styles.badge, { backgroundColor: t.c.accentTint, borderRadius: t.radii.sm }]}>
          <Text variant="label" color="accentText">
            {because}
          </Text>
        </View>
      ) : null}
      <Text variant="bodyStrong">{label}</Text>
      {read ? (
        <Text variant="footnote" color="inkSecondary">
          {read}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: { padding: 14, gap: 4, borderWidth: 1 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, marginBottom: 2 },
});
