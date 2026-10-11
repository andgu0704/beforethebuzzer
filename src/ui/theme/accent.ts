import { contrast, mix, withContrast } from './colour';
import { palette, type Scheme } from './tokens';

export interface Accent {
  /** Button fill. */
  readonly accent: string;
  /** Text and icons on the accent fill: white or ink, whichever reaches 4.5:1. */
  readonly onAccent: string;
  /** The accent as text on the canvas and on surfaces, at least 4.5:1. */
  readonly accentText: string;
  /** A light wash for selected rows and decision cards. */
  readonly accentTint: string;
}

const WHITE = '#FFFFFF';

/** Derives the accent tokens from a team's primary colour for one scheme. */
export function deriveAccent(primary: string, scheme: Scheme): Accent {
  const p = palette[scheme];
  // The fill should carry white text; very light team colours are darkened in OKLCH until it does.
  let accent = withContrast(primary, WHITE, 4.5, 'darker');
  if (scheme === 'dark') {
    // On the dark canvas the fill must still read as a shape: lift it if it sinks into the canvas.
    if (contrast(accent, p.canvas) < 1.8) accent = withContrast(accent, p.canvas, 1.8, 'lighter');
  }
  const onAccent = contrast(accent, WHITE) >= 4.5 ? WHITE : p.ink;
  // Must read on the canvas and on surfaces, so it is pushed until both pass.
  const direction = scheme === 'light' ? 'darker' : 'lighter';
  const accentText = withContrast(
    withContrast(primary, p.canvas, 4.6, direction),
    p.surface,
    4.6,
    direction,
  );
  const accentTint = mix(accent, p.canvas, scheme === 'light' ? 0.08 : 0.14);
  return { accent, onAccent, accentText, accentTint };
}

/** The accent before a team exists: the brand orange, as in the creation flow. */
export function brandAccent(scheme: Scheme): Accent {
  const p = palette[scheme];
  return {
    accent: scheme === 'light' ? '#C8461A' : p.brand,
    onAccent: scheme === 'light' ? WHITE : '#141414',
    accentText: p.brandText,
    accentTint: mix(p.brand, p.canvas, scheme === 'light' ? 0.08 : 0.14),
  };
}
