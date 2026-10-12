/**
 * Illustrated portraits (PLAN.md §10.6), drawn with Skia from the pure geometry in
 * `geometry.ts`. `Portrait` draws one face; `PortraitLab` draws a seeded grid of random faces
 * in a single canvas for the hidden QA screen.
 */
import { Canvas, Group, Path, Rect, Skia } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

import type { Portrait as PortraitParts } from '../../engine/model/person';
import { radii } from '../theme/tokens';
import {
  type Expression,
  framingFor,
  labFaces,
  portraitLayers,
  type TeamColours,
} from './geometry';
import { type SkiaLayer, toSkiaLayers } from './skia';

export type PortraitShape = 'circle' | 'card';

export interface PortraitProps {
  readonly portrait: PortraitParts;
  /** Width and height in points. */
  readonly size: number;
  readonly expression?: Expression;
  /** Jersey number; omitted, the jersey is plain. */
  readonly jersey?: number;
  /** Team colours (#RRGGBB) for the jersey, trim and number, or the staff tie. */
  readonly primary: string;
  readonly secondary: string;
  /** Shirt, tie and blazer instead of a jersey; glasses allowed. */
  readonly staff?: boolean;
  /** Fill behind the face; pass the theme's `sunken` token. Transparent when omitted. */
  readonly background?: string;
  /** `circle` (default) for avatars, `card` for a rounded rectangle. */
  readonly shape?: PortraitShape;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
}

function clipFor(shape: PortraitShape, size: number) {
  const r = shape === 'circle' ? size / 2 : Math.min(radii.md, size * 0.12);
  return Skia.RRectXY(Skia.XYWHRect(0, 0, size, size), r, r);
}

/** The Skia transform that places the 100×100 portrait box in a view of `size` points. */
function placement(size: number) {
  const f = framingFor(size);
  const s = (size / 100) * f.scale;
  return [{ translateX: size / 2 - f.cx * s }, { translateY: size / 2 - f.cy * s }, { scale: s }];
}

function Layers({ layers }: { readonly layers: readonly SkiaLayer[] }) {
  return (
    <>
      {layers.map((l, i) => (
        <Path key={i} path={l.path} color={l.color} opacity={l.opacity} />
      ))}
    </>
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
  const { head, skin, eyes, brows, nose, mouth, hair, hairColour, facialHair, accessory } =
    portrait;
  const layers = useMemo(
    () =>
      toSkiaLayers(
        Skia,
        portraitLayers(
          { head, skin, eyes, brows, nose, mouth, hair, hairColour, facialHair, accessory },
          {
            expression,
            primary,
            secondary,
            staff,
            ...(jersey !== undefined ? { jersey } : {}),
          },
        ),
      ),
    [
      head,
      skin,
      eyes,
      brows,
      nose,
      mouth,
      hair,
      hairColour,
      facialHair,
      accessory,
      expression,
      jersey,
      primary,
      secondary,
      staff,
    ],
  );
  const clip = useMemo(() => clipFor(shape, size), [shape, size]);
  const transform = useMemo(() => placement(size), [size]);

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
      <Canvas style={{ width: size, height: size }}>
        <Group clip={clip}>
          {background !== undefined ? (
            <Rect x={0} y={0} width={size} height={size} color={background} />
          ) : null}
          <Group transform={transform}>
            <Layers layers={layers} />
          </Group>
        </Group>
      </Canvas>
    </View>
  );
}

export const Portrait = memo(PortraitView);

export interface PortraitLabProps {
  readonly seed: number;
  /** Number of faces (default 100). */
  readonly count?: number;
  /** Face size in points (default 64). */
  readonly size?: number;
  /** Width available for the grid in points. */
  readonly width: number;
  /** Fill behind each face; pass the theme's `sunken` token. */
  readonly background: string;
  /** Team colours to dress the faces in; a default pair when empty. */
  readonly teams?: readonly TeamColours[];
  readonly gap?: number;
}

const NO_TEAMS: readonly TeamColours[] = [];

/**
 * The portrait lab: `count` seeded random faces in one canvas, so weak part combinations show
 * up together. Same seed, same faces.
 */
function PortraitLabView({
  seed,
  count = 100,
  size = 64,
  width,
  background,
  teams = NO_TEAMS,
  gap = 8,
}: PortraitLabProps) {
  const cols = Math.max(1, Math.floor((width + gap) / (size + gap)));
  const rows = Math.ceil(count / cols);
  const faces = useMemo(
    () =>
      labFaces(seed, count, teams).map((face) =>
        toSkiaLayers(Skia, portraitLayers(face.portrait, face.opts)),
      ),
    [seed, count, teams],
  );
  const clip = useMemo(() => clipFor('circle', size), [size]);
  const transform = useMemo(() => placement(size), [size]);
  const height = rows * size + (rows - 1) * gap;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Portrait lab, ${count} random faces`}
      style={{ width, height }}
    >
      <Canvas style={{ width, height }}>
        {faces.map((layers, i) => (
          <Group
            key={i}
            transform={[
              { translateX: (i % cols) * (size + gap) },
              { translateY: Math.floor(i / cols) * (size + gap) },
            ]}
          >
            <Group clip={clip}>
              <Rect x={0} y={0} width={size} height={size} color={background} />
              <Group transform={transform}>
                <Layers layers={layers} />
              </Group>
            </Group>
          </Group>
        ))}
      </Canvas>
    </View>
  );
}

export const PortraitLab = memo(PortraitLabView);
