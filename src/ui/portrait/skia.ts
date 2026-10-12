/**
 * Turns portrait layers into Skia paths. Shared by the app component and the headless review
 * script, so both draw exactly the same thing; the Skia API is passed in because the app and
 * Node get it from different entry points.
 */
import type { Skia, SkPath } from '@shopify/react-native-skia';

import type { Layer } from './types';

export interface SkiaLayer {
  readonly path: SkPath;
  readonly color: string;
  readonly opacity: number;
}

export function toSkiaLayers(skia: typeof Skia, layers: readonly Layer[]): SkiaLayer[] {
  const out: SkiaLayer[] = [];
  for (const layer of layers) {
    // Every layer fills with the default non-zero rule; holes are anticlockwise contours.
    const path = skia.Path.MakeFromSVGString(layer.path);
    if (path === null) continue;
    out.push({ path, color: layer.color, opacity: layer.opacity ?? 1 });
  }
  return out;
}
