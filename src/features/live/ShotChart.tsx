/* eslint-disable @typescript-eslint/no-deprecated -- on <Rect> and <Text>, x and y are positions, not the deprecated transform props the shared type also names */
import { memo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { Side } from '@/engine/game/types';

import type { ShotDot } from './view';

/** Court in feet: 94 by 50, baskets 5.25 ft in from each baseline. */
const L = 94;
const W = 50;
const HOOP = 5.25;

const FLOOR = '#E3C08F';
const PAINT = '#D7AE77';
const LINE = '#FFFFFF';

/**
 * The whole floor with every shot so far: filled for makes, rings for misses, each with the
 * shooter's number. His side attacks the right-hand basket. The last shot is ringed.
 */
export const ShotChart = memo(function ShotChart({
  width,
  shots,
  jerseys,
  colours,
  rightSide,
  userSide,
  userPlayer,
}: {
  readonly width: number;
  readonly shots: readonly ShotDot[];
  /** Jersey number by side and player index. */
  readonly jerseys: readonly [readonly number[], readonly number[]];
  readonly colours: readonly [string, string];
  /** The side that attacks the right-hand basket. */
  readonly rightSide: Side;
  readonly userSide: Side;
  readonly userPlayer: number;
}) {
  const height = (width * W) / L;
  const place = (d: ShotDot) =>
    d.side === rightSide
      ? { x: L - HOOP - d.x, y: W / 2 + d.y }
      : { x: HOOP + d.x, y: W / 2 - d.y };
  const last = shots[shots.length - 1];
  return (
    <View testID="shot-chart" accessible accessibilityRole="image" accessibilityLabel="Shot chart">
      <Svg width={width} height={height} viewBox={`0 0 ${L} ${W}`}>
        <Rect x={0} y={0} width={L} height={W} fill={FLOOR} rx={1.5} />
        {/* Paint, half-court line and centre circle. */}
        <Rect x={0} y={W / 2 - 8} width={19} height={16} fill={PAINT} />
        <Rect x={L - 19} y={W / 2 - 8} width={19} height={16} fill={PAINT} />
        <G stroke={LINE} strokeWidth={0.35} fill="none">
          <Rect x={0.2} y={0.2} width={L - 0.4} height={W - 0.4} />
          <Line x1={L / 2} y1={0} x2={L / 2} y2={W} />
          <Circle cx={L / 2} cy={W / 2} r={6} />
          {[0, 1].map((end) => {
            const flip = (x: number) => (end === 0 ? x : L - x);
            const hoop = flip(HOOP);
            const dir = end === 0 ? 1 : -1;
            // The three-point line: straight corners 3 ft in from the sidelines, then the arc.
            const cornerX = flip(14);
            const arc = `M ${flip(0)} 3 L ${cornerX} 3 A 23.75 23.75 0 0 ${end === 0 ? 1 : 0} ${cornerX} ${W - 3} L ${flip(0)} ${W - 3}`;
            return (
              <G key={end}>
                <Path d={arc} />
                <Rect x={end === 0 ? 0 : L - 19} y={W / 2 - 8} width={19} height={16} />
                <Circle cx={flip(19)} cy={W / 2} r={6} />
                <Line x1={flip(4)} y1={W / 2 - 3} x2={flip(4)} y2={W / 2 + 3} strokeWidth={0.6} />
                <Circle cx={hoop} cy={W / 2} r={0.75} stroke="#FF5A1F" strokeWidth={0.4} />
                <Line
                  x1={hoop - dir * 0.75}
                  y1={W / 2}
                  x2={flip(4)}
                  y2={W / 2}
                  stroke="#FF5A1F"
                  strokeWidth={0.3}
                />
              </G>
            );
          })}
        </G>
        {shots.map((d, i) => {
          const at = place(d);
          const colour = colours[d.side];
          const mine = d.side === userSide && d.player === userPlayer;
          const r = mine ? 1.35 : 1.1;
          return (
            <G key={i}>
              <Circle
                cx={at.x}
                cy={at.y}
                r={r}
                fill={d.made ? colour : 'none'}
                stroke={mine ? '#FF5A1F' : colour}
                strokeWidth={d.made ? 0.25 : 0.4}
                opacity={d.made ? 0.95 : 0.8}
              />
              {d.made ? (
                <SvgText
                  x={at.x}
                  y={at.y + 0.55}
                  fontSize={1.4}
                  fontWeight="bold"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  {String(jerseys[d.side][d.player] ?? '')}
                </SvgText>
              ) : null}
            </G>
          );
        })}
        {last ? (
          <Circle
            cx={place(last).x}
            cy={place(last).y}
            r={2.4}
            fill="none"
            stroke="#141414"
            strokeWidth={0.35}
            strokeDasharray="0.8 0.6"
          />
        ) : null}
      </Svg>
    </View>
  );
});
