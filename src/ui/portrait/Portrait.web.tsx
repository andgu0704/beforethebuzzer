/**
 * Portraits on the web, drawn as SVG from the same geometry as the Skia version. Browsers allow
 * only a handful of WebGL contexts per page, and a roster shows fifteen faces, so each face
 * here is plain SVG; the native app keeps Skia.
 */
import { memo, useId, useMemo } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import type { Portrait as PortraitParts } from '../../engine/model/person';
import { radii } from '../theme/tokens';
import {
  type Expression,
  framingFor,
  labFaces,
  portraitLayers,
  type TeamColours,
} from './geometry';
import type { Layer } from './types';

export type PortraitShape = 'circle' | 'card';

export interface PortraitProps {
  readonly portrait: PortraitParts;
  readonly size: number;
  readonly expression?: Expression;
  readonly jersey?: number;
  readonly primary: string;
  readonly secondary: string;
  readonly staff?: boolean;
  readonly background?: string;
  readonly shape?: PortraitShape;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
}

function transformFor(size: number): string {
  const f = framingFor(size);
  const s = (size / 100) * f.scale;
  return `translate(${size / 2 - f.cx * s} ${size / 2 - f.cy * s}) scale(${s})`;
}

function Face({
  layers,
  size,
  shape,
  background,
}: {
  readonly layers: readonly Layer[];
  readonly size: number;
  readonly shape: PortraitShape;
  readonly background: string | undefined;
}) {
  const id = useId().replace(/:/g, '');
  const r = shape === 'circle' ? size / 2 : Math.min(radii.md, size * 0.12);
  return (
    <Svg width={size} height={size}>
      <Defs>
        <ClipPath id={`c${id}`}>
          <Rect width={size} height={size} rx={r} ry={r} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#c${id})`}>
        {background !== undefined ? <Rect width={size} height={size} fill={background} /> : null}
        <G transform={transformFor(size)}>
          {layers.map((l, i) => (
            <Path
              key={i}
              d={l.path}
              fill={l.color}
              {...(l.opacity !== undefined ? { opacity: l.opacity } : {})}
            />
          ))}
        </G>
      </G>
    </Svg>
  );
}

function PortraitView({
  portrait,
  size,
  expression = 'neutral',
  jersey,
  primary,
  secondary,
  staff = false,
  background,
  shape = 'circle',
  accessibilityLabel,
  style,
}: PortraitProps) {
  const layers = useMemo(
    () =>
      portraitLayers(portrait, {
        expression,
        primary,
        secondary,
        staff,
        ...(jersey !== undefined ? { jersey } : {}),
      }),
    [portrait, expression, primary, secondary, staff, jersey],
  );
  return (
    <View
      {...(accessibilityLabel === ''
        ? // An empty label marks a decorative face: hidden from assistive tech.
          { 'aria-hidden': true }
        : {
            accessible: true,
            accessibilityRole: 'image' as const,
            accessibilityLabel: accessibilityLabel ?? 'Portrait',
          })}
      style={[{ width: size, height: size }, style]}
    >
      <Face layers={layers} size={size} shape={shape} background={background} />
    </View>
  );
}

export const Portrait = memo(PortraitView);

export interface PortraitLabProps {
  readonly seed: number;
  readonly count?: number;
  readonly size?: number;
  readonly width: number;
  readonly background: string;
  readonly teams?: readonly TeamColours[];
  readonly gap?: number;
}

const NO_TEAMS: readonly TeamColours[] = [];

function PortraitLabView({
  seed,
  count = 100,
  size = 64,
  width,
  background,
  teams = NO_TEAMS,
  gap = 8,
}: PortraitLabProps) {
  const faces = useMemo(
    () => labFaces(seed, count, teams).map((f) => portraitLayers(f.portrait, f.opts)),
    [seed, count, teams],
  );
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Portrait lab, ${count} random faces`}
      style={{ width, flexDirection: 'row', flexWrap: 'wrap', gap }}
    >
      {faces.map((layers, i) => (
        <Face key={i} layers={layers} size={size} shape="circle" background={background} />
      ))}
    </View>
  );
}

export const PortraitLab = memo(PortraitLabView);
