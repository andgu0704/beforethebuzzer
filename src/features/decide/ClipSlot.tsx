import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { userOf } from '@/engine/career/state';
import type { MomentResult } from '@/engine/career/game';
import type { MomentSituation } from '@/engine/model/career';
import { haptic } from '@/platform/haptics';
import { useGame } from '@/state/game';
import { useSettings } from '@/state/settings';
import { ClipPlayer } from '@/ui/clips/ClipPlayer';
import { useClipText } from '@/ui/clips/useClipText';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { clipSetup } from './clipProps';

/** The half court the clips are drawn on, empty, with the basket on the right. */
function CourtStill() {
  const t = useTheme();
  const line = { stroke: t.c.courtLine, strokeWidth: 0.35, fill: 'none' } as const;
  return (
    <View
      style={{ borderRadius: t.radii.md, overflow: 'hidden', aspectRatio: 51 / 50 }}
      accessibilityElementsHidden
    >
      <Svg width="100%" height="100%" viewBox="-4 0 51 50">
        <Path d="M-4 0h55v50h-55z" fill={t.c.courtWood} />
        <Path d="M28 17h19v16H28z" {...line} fill={t.c.courtPaint} />
        <Path d="M47 3.35H37.07A22.15 22.15 0 0 0 37.07 46.65H47" {...line} />
        <Circle cx={28} cy={25} r={6} {...line} />
        <Circle cx={0} cy={25} r={6} {...line} />
        <Circle cx={0} cy={25} r={2} {...line} />
        <Line x1={0} y1={0} x2={0} y2={50} stroke={t.c.courtLine} strokeWidth={0.35} />
        <Path d="M0 0.2H46.8V49.8H0" {...line} />
        <Line x1={43} y1={22} x2={43} y2={28} stroke={t.c.courtLine} strokeWidth={0.5} />
        <Circle cx={41.75} cy={25} r={0.75} stroke="#FF5A1F" strokeWidth={0.35} fill="none" />
      </Svg>
    </View>
  );
}

/** The court above a key moment: a still before the choice, the clip after it. */
export function ClipSlot({
  situation,
  result,
  resultLine,
}: {
  readonly situation: MomentSituation;
  readonly result?: MomentResult | undefined;
  readonly resultLine?: string | undefined;
}) {
  const t = useTheme();
  const { names } = useT();
  const state = useGame((g) => g.state);
  const clipText = useClipText();
  const autoPlay = useSettings((s) => s.clipAutoplay);
  if (!state || !result) return <CourtStill />;
  const setup = clipSetup(state, situation.gameId, names);
  const close = Math.abs(situation.score[0] - situation.score[1]) <= 3;
  return (
    <ClipPlayer
      spec={result.clip}
      home={setup.home}
      away={setup.away}
      params={setup.params}
      signature={state.career.signature === result.clip.template && result.success}
      autoPlay={autoPlay}
      scheme={t.scheme}
      text={clipText}
      {...(resultLine ? { resultLine } : {})}
      onBuzzer={() => {
        haptic(close ? 'heavy' : 'light');
      }}
      key={`${situation.gameId}-${userOf(state).jersey}-${result.clip.clock}`}
    />
  );
}
