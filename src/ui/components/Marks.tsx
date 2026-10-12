import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Polygon, SvgXml } from 'react-native-svg';

import type { EmblemId } from '@/engine/content/world-types';

import { contrast } from '../theme/colour';
import { useTheme } from '../theme/theme';
import { FLAGS } from './flags';
import { Text } from './Text';

/** Small rectangular flag with its three-letter code beside it, broadcast style. */
export function Flag({
  code,
  size = 16,
  showCode = true,
  label,
}: {
  readonly code: string;
  readonly size?: number | undefined;
  readonly showCode?: boolean | undefined;
  readonly label?: string | undefined;
}) {
  const t = useTheme();
  const xml = FLAGS[code];
  return (
    <View style={styles.flagRow} accessible accessibilityLabel={label ?? code}>
      <View
        style={{
          width: size * 1.5,
          height: size,
          borderRadius: 2,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.c.hairline,
          backgroundColor: t.c.sunken,
        }}
      >
        {xml ? <SvgXml xml={xml} width={size * 1.5} height={size} /> : null}
      </View>
      {showCode ? (
        <Text variant="label" color="inkSecondary">
          {code}
        </Text>
      ) : null}
    </View>
  );
}

/** Emblem glyphs on a 24-unit grid, drawn to sit inside the badge shapes. */
const EMBLEMS: Record<EmblemId, string> = {
  comet: 'M17 5a4 4 0 1 1-4.2 6.6L4 20l1.6-4.9L4 13l4.2-.6L10.6 4l.9 4.6A4 4 0 0 1 17 5z',
  peak: 'M2 19 9 7l3.5 5L15 8l7 11z',
  wave: 'M2 14c3-4 5-4 7 0s4 4 6 0 4-4 7 0v4c-3-4-5-4-7 0s-4 4-6 0-4-4-7 0z',
  crown: 'M3 18 4.5 7l4.5 5L12 5l3 7 4.5-5L21 18z',
  anchor:
    'M11 3h2v3h3v2h-3v9.9c2.3-.4 4-2 4.6-3.9H15l3.5-4 3.5 4h-2.4C18.8 18.2 15.8 21 12 21s-6.8-2.8-7.6-7H2l3.5-4L9 14H6.4c.6 1.9 2.3 3.5 4.6 3.9V8H8V6h3z',
  wing: 'M3 17C6 9 12 5 21 4c-2 2-3 4-3.5 6H21c-1.5 2-3.5 3.5-6 4h3c-3 3-9 4-15 3z',
  star: 'M12 3l2.6 6 6.4.6-4.9 4.2 1.5 6.3L12 16.8 6.4 20.1l1.5-6.3L3 9.6 9.4 9z',
  bolt: 'M14 2 5 14h6l-2 8 10-13h-6z',
  flame: 'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6 0 2 1 3.5 2.5 4C11 9 10 6 12 2z',
  gear: 'M10.5 2h3l.5 2.6 1.8.8 2.2-1.5 2.1 2.1-1.5 2.2.8 1.8 2.6.5v3l-2.6.5-.8 1.8 1.5 2.2-2.1 2.1-2.2-1.5-1.8.8-.5 2.6h-3l-.5-2.6-1.8-.8-2.2 1.5-2.1-2.1 1.5-2.2-.8-1.8L2 13.5v-3l2.6-.5.8-1.8-1.5-2.2 2.1-2.1 2.2 1.5L10 4.6zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  oak: 'M11 22v-5c-4 0-7-2.5-7-6 0-2 1.2-3.5 2.7-4.2C7.3 4.1 9.5 2 12 2s4.7 2.1 5.3 4.8C18.8 7.5 20 9 20 11c0 3.5-3 6-7 6v5z',
  bridge: 'M2 9h20v2h-2v8h-3v-4a5 5 0 0 0-10 0v4H4v-8H2z',
  compass: 'M12 2 15 12 12 22 9 12zM2 12l10-2.2v4.4zm20 0-10 2.2V9.8z',
  arrow: 'M3 13h11v4l7-5-7-5v4H3z',
  shield: 'M12 2 20 5v6c0 5-3.5 9.2-8 11-4.5-1.8-8-6-8-11V5z',
  sun: 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM11 1h2v4h-2zm0 18h2v4h-2zM1 11h4v2H1zm18 0h4v2h-4zM4.2 5.6l1.4-1.4 2.8 2.8-1.4 1.4zm11.4 11.4 1.4-1.4 2.8 2.8-1.4 1.4zM4.2 18.4l2.8-2.8 1.4 1.4-2.8 2.8zM15.6 7l2.8-2.8 1.4 1.4-2.8 2.8z',
  moon: 'M15 2a10 10 0 1 0 7 15.5A8 8 0 0 1 15 2z',
  horn: 'M3 9c6 0 12-2 16-6l2 1c-2 6-2 12 0 18l-2 1c-4-4-10-6-16-6z',
  claw: 'M4 21c2-7 1-12-1-17 4 3 6 8 5.5 17zm5.5 0c1.5-7 1.5-12 .5-17 3 3.5 4 9 2.5 17zm5 0c.5-6 1.5-11 4.5-15-1 5-1 10-1.5 15z',
  feather: 'M20 3C12 3 6 8 5 16l-2 5 2-.8L7 17c7-.5 12-5.5 13-14zM8 16c2-4 5-7 9-9-3 3-5 6-6.5 9z',
  tower: 'M7 22V8L5 6V2h3v2h2V2h4v2h2V2h3v4l-2 2v14h-4v-5h-2v5z',
  river: 'M14 2c-6 4 2 8-4 12-2 1.5-4 3-4 8h4c0-3 1-4 3-5.5 6-4-2-8.5 4-14.5z',
  spark:
    'M12 2c.8 5.5 4.5 9.2 10 10-5.5.8-9.2 4.5-10 10-.8-5.5-4.5-9.2-10-10 5.5-.8 9.2-4.5 10-10z',
  key: 'M8 4a5 5 0 0 1 4.6 7H22v3h-2v3h-3v-3h-4.4A5 5 0 1 1 8 4zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  hammer: 'M4 4h11l3 3h3v4h-3l-2-2h-3v13H9V9H4z',
  sail: 'M12 2v15H4zm2 3 7 12h-7zM2 19h20l-2 3H4z',
  pine: 'M12 2 18 10h-3l5 6h-6v6h-4v-6H4l5-6H6z',
  mesa: 'M2 20 6 10h3l1-3h4l1 3h3l4 10z',
  orbit:
    'M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0-6c5.5 0 10 4 10 9s-4.5 9-10 9S2 17 2 12s4.5-9 10-9zm0 2c-4.4 0-8 3.1-8 7s3.6 7 8 7 8-3.1 8-7-3.6-7-8-7z',
  lantern:
    'M9 2h6v2h1.5l1.5 3v11l-1.5 3h-9L6 18V7l1.5-3H9zm3 7c-1.5 1.5-2 3-2 4.5a2 2 0 0 0 4 0c0-1.5-.5-3-2-4.5z',
};

const SHAPES = ['circle', 'shield', 'hex', 'diamond', 'square'] as const;

function shapeOf(id: string): (typeof SHAPES)[number] {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SHAPES[h % SHAPES.length] ?? 'circle';
}

/** A team's mark: a monogram for colleges, an emblem in one of five shapes for pro teams. */
export function TeamMark({
  teamId,
  abbr,
  primary,
  secondary,
  emblem,
  size = 32,
  label,
}: {
  readonly teamId: string;
  readonly abbr: string;
  readonly primary: string;
  readonly secondary: string;
  readonly emblem?: EmblemId | undefined;
  readonly size?: number | undefined;
  readonly label?: string | undefined;
}) {
  // The secondary colour is used for the glyph only when it reads against the primary.
  const glyph =
    contrast(secondary, primary) >= 2.2
      ? secondary
      : contrast('#FFFFFF', primary) > 3
        ? '#FFFFFF'
        : '#141414';
  if (!emblem) {
    const letters = abbr.slice(0, 3);
    return (
      <View
        accessible
        accessibilityLabel={label ?? abbr}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: Math.max(1.5, size * 0.06),
          borderColor: glyph,
        }}
      >
        <Text
          variant="displayS"
          maxFontSizeMultiplier={1}
          style={{
            color: glyph,
            fontSize: size * (letters.length > 2 ? 0.34 : 0.44),
            lineHeight: size * 0.5,
          }}
        >
          {letters}
        </Text>
      </View>
    );
  }
  const shape = shapeOf(teamId);
  return (
    <View accessible accessibilityLabel={label ?? abbr}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        {shape === 'circle' ? <Circle cx={16} cy={16} r={15} fill={primary} /> : null}
        {shape === 'square' ? (
          <Path
            d="M7.5 1.5h17a6 6 0 0 1 6 6v17a6 6 0 0 1-6 6h-17a6 6 0 0 1-6-6v-17a6 6 0 0 1 6-6z"
            fill={primary}
          />
        ) : null}
        {shape === 'diamond' ? (
          <Polygon points="16,0.5 31.5,16 16,31.5 0.5,16" fill={primary} />
        ) : null}
        {shape === 'hex' ? (
          <Polygon points="16,1 29,8.5 29,23.5 16,31 3,23.5 3,8.5" fill={primary} />
        ) : null}
        {shape === 'shield' ? (
          <Path d="M16 1 29 5v10c0 8-6 14-13 16C9 29 3 23 3 15V5z" fill={primary} />
        ) : null}
        <G
          transform={`translate(${shape === 'diamond' ? 8.8 : 7.6} ${shape === 'diamond' ? 8.8 : 7.6}) scale(${shape === 'diamond' ? 0.6 : 0.7})`}
        >
          <Path d={EMBLEMS[emblem]} fill={glyph} fillRule="evenodd" />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
