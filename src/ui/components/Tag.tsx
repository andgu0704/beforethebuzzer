import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/theme';
import { Text } from './Text';

export function Tag({
  label,
  tone = 'neutral',
}: {
  readonly label: string;
  readonly tone?: 'neutral' | 'accent' | 'positive' | 'negative' | 'caution' | 'brand' | undefined;
}) {
  const t = useTheme();
  const fg =
    tone === 'neutral'
      ? t.c.inkSecondary
      : tone === 'accent'
        ? t.c.accentText
        : tone === 'brand'
          ? t.c.brandText
          : t.c[tone];
  return (
    <View
      style={[
        styles.tag,
        {
          borderRadius: t.radii.sm,
          backgroundColor: tone === 'accent' ? t.c.accentTint : t.c.sunken,
        },
      ]}
    >
      <Text variant="label" style={{ color: fg }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
});
