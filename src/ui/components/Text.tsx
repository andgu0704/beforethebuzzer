import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { useTheme, type Colours } from '../theme/theme';
import { type as typeScale, type TypeVariant } from '../theme/tokens';

export interface Props extends TextProps {
  readonly variant?: TypeVariant;
  readonly color?: keyof Colours;
  readonly align?: TextStyle['textAlign'];
  /** Forces tabular figures (on by default for scoreboard and stat). */
  readonly tabular?: boolean;
}

/** The only text component. Typed variants only (§10.1); colour by token name. */
export function Text({ variant = 'body', color = 'ink', align, tabular, style, ...rest }: Props) {
  const theme = useTheme();
  const t = typeScale[variant];
  const isTabular = tabular ?? ('tabular' in t && t.tabular);
  return (
    <RNText
      maxFontSizeMultiplier={t.maxScale}
      {...rest}
      style={[
        {
          fontFamily: t.fontFamily,
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          color: theme.c[color],
          ...('letterSpacing' in t ? { letterSpacing: t.letterSpacing } : {}),
          ...('textTransform' in t ? { textTransform: t.textTransform } : {}),
          ...(isTabular ? { fontVariant: ['tabular-nums'] as const } : {}),
          ...(align ? { textAlign: align } : {}),
        },
        style,
      ]}
    />
  );
}
