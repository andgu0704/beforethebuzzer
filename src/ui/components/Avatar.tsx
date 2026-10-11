import { View } from 'react-native';

import type { Portrait as PortraitData } from '@/engine/model/person';

import { contrast } from '../theme/colour';
import { useTheme } from '../theme/theme';
import { Text } from './Text';

export type Expression = 'neutral' | 'smile' | 'focused' | 'frustrated' | 'stunned' | 'draft';

export interface AvatarProps {
  readonly portrait?: PortraitData | undefined;
  readonly name: string;
  readonly size?: number | undefined;
  readonly primary?: string | undefined;
  readonly secondary?: string | undefined;
  readonly jersey?: number | undefined;
  readonly expression?: Expression | undefined;
  readonly staff?: boolean | undefined;
  readonly shape?: 'circle' | 'card' | undefined;
}

/** A person's face. Falls back to initials in the team colour. */
export function Avatar({ name, size = 40, primary, shape = 'circle' }: AvatarProps) {
  const t = useTheme();
  const bg = primary ?? t.c.sunken;
  const fg = primary ? (contrast('#FFFFFF', bg) >= 3 ? '#FFFFFF' : '#141414') : t.c.inkSecondary;
  const initials = name
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: shape === 'circle' ? size / 2 : t.radii.md,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        variant="displayS"
        maxFontSizeMultiplier={1}
        style={{ color: fg, fontSize: size * 0.38, lineHeight: size * 0.46 }}
      >
        {initials}
      </Text>
    </View>
  );
}
