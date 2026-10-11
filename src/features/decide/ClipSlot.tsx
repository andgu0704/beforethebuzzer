import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { MomentResult } from '@/engine/career/game';
import type { MomentSituation } from '@/engine/model/career';
import { useTheme } from '@/ui/theme/theme';

/** The court above a key moment: a still before the choice, the clip after it. */
export function ClipSlot({
  result: _result,
}: {
  readonly situation: MomentSituation;
  readonly result?: MomentResult | undefined;
}) {
  const t = useTheme();
  return (
    <View
      style={{ borderRadius: t.radii.md, overflow: 'hidden', aspectRatio: 50 / 30 }}
      accessibilityElementsHidden
    >
      <Svg width="100%" height="100%" viewBox="0 0 50 30">
        <Path d="M0 0h50v47H0z" fill={t.c.courtWood} />
        <Path d="M17 0h16v19H17z" fill={t.c.courtPaint} stroke={t.c.courtLine} strokeWidth={0.3} />
        <Path
          d="M3 0 V14 A22 22 0 0 0 47 14 V0"
          stroke={t.c.courtLine}
          strokeWidth={0.3}
          fill="none"
        />
        <Circle cx={25} cy={19} r={6} stroke={t.c.courtLine} strokeWidth={0.3} fill="none" />
        <Line x1={22} y1={4} x2={28} y2={4} stroke={t.c.courtLine} strokeWidth={0.4} />
        <Circle cx={25} cy={5.25} r={0.75} stroke="#FF5A1F" strokeWidth={0.3} fill="none" />
        <Line x1={0} y1={47} x2={50} y2={47} stroke={t.c.courtLine} strokeWidth={0.6} />
      </Svg>
    </View>
  );
}
