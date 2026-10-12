import { View } from 'react-native';

import type { Portrait as PortraitData } from '@/engine/model/person';

import { Portrait } from '../portrait/Portrait';

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
  /** Next to the name already: hidden from assistive tech. */
  readonly decorative?: boolean | undefined;
}

/** A person's face. Falls back to initials in the team colour. */
export function Avatar({
  portrait,
  name,
  size = 40,
  primary,
  secondary,
  jersey,
  expression = 'neutral',
  staff = false,
  shape = 'circle',
  decorative = false,
}: AvatarProps) {
  const spoken = decorative ? '' : name;
  const t = useTheme();
  if (portrait)
    return (
      <Portrait
        portrait={portrait}
        size={size}
        expression={expression}
        primary={primary ?? (t.scheme === 'light' ? '#3A3A3D' : '#5D5952')}
        secondary={secondary ?? '#F1EFEA'}
        staff={staff}
        background={t.c.sunken}
        shape={shape}
        accessibilityLabel={spoken}
        {...(jersey !== undefined ? { jersey } : {})}
      />
    );
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
      {...(spoken === ''
        ? { 'aria-hidden': true }
        : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: spoken })}
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
