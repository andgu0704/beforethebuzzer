import { createContext, use, useMemo, type ReactNode } from 'react';
import { StyleSheet, useColorScheme, useWindowDimensions } from 'react-native';

import { useGame } from '@/state/game';
import { useSettings } from '@/state/settings';
import { userTeamId } from '@/engine/career/state';

import { brandAccent, deriveAccent, type Accent } from './accent';
import { palette, radii, space, type Scheme } from './tokens';

export type Colours = { [K in keyof (typeof palette)['light']]: string } & Accent;

export interface Theme {
  readonly scheme: Scheme;
  readonly c: Colours;
  readonly space: typeof space;
  readonly radii: typeof radii;
  /** Screen gutter: 16 up to 375 pt wide, 20 above. */
  readonly gutter: number;
}

export function buildTheme(scheme: Scheme, primary: string | null, width = 390): Theme {
  const accent = primary ? deriveAccent(primary, scheme) : brandAccent(scheme);
  return {
    scheme,
    c: { ...palette[scheme], ...accent },
    space,
    radii,
    gutter: width <= 375 ? 16 : 20,
  };
}

const ThemeContext = createContext<Theme>(buildTheme('light', null));

/** The current team's primary colour, or null before he has a team (brand orange then). */
function useTeamPrimary(): string | null {
  return useGame((g) => {
    const s = g.state;
    if (!s) return null;
    const id = userTeamId(s) ?? s.career.committedTo;
    return id ? (s.world.teams[id]?.colours.primary ?? null) : null;
  });
}

export function ThemeProvider({
  children,
  forceScheme,
  forcePrimary,
}: {
  children: ReactNode;
  forceScheme?: Scheme;
  forcePrimary?: string | null;
}) {
  const system = useColorScheme();
  const setting = useSettings((s) => s.theme);
  const teamPrimary = useTeamPrimary();
  const { width } = useWindowDimensions();
  const scheme: Scheme =
    forceScheme ?? (setting === 'system' ? (system === 'dark' ? 'dark' : 'light') : setting);
  const primary = forcePrimary === undefined ? teamPrimary : forcePrimary;
  const theme = useMemo(() => buildTheme(scheme, primary, width), [scheme, primary, width]);
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  return use(ThemeContext);
}

/** Styles built from the theme: `const useStyles = makeStyles((t) => ({ … }))`. */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(fn: (t: Theme) => T): () => T {
  const cache = new WeakMap<Theme, T>();
  return () => {
    const theme = useTheme();
    let styles = cache.get(theme);
    if (!styles) {
      styles = StyleSheet.create(fn(theme));
      cache.set(theme, styles);
    }
    return styles;
  };
}
