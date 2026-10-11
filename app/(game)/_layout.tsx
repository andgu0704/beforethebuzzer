import { Redirect, Stack, router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useGame } from '@/state/game';
import { useTheme } from '@/ui/theme/theme';

/**
 * The game stack: tabs, pushed screens and sheets. When the engine stops for a decision, the
 * decision sheet opens by itself; it cannot be swiped away.
 */
export default function GameLayout() {
  const t = useTheme();
  const state = useGame((g) => g.state);
  const busy = useGame((g) => g.busy);
  const pendingId = useGame((g) => g.state?.career.pending[0]?.id ?? null);
  const pathname = usePathname();
  const opened = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingId || busy || pathname === '/decide') return;
    if (opened.current === pendingId) return;
    opened.current = pendingId;
    router.push('/decide');
  }, [pendingId, busy, pathname]);

  if (!state) return <Redirect href="/welcome" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.c.canvas },
        headerStyle: { backgroundColor: t.c.canvas },
        headerTintColor: t.c.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: 'SchibstedGrotesk_600SemiBold', color: t.c.ink },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="decide"
        options={{
          presentation: 'formSheet',
          gestureEnabled: false,
          sheetAllowedDetents: [1],
          sheetCornerRadius: 20,
          contentStyle: { backgroundColor: t.c.canvas },
        }}
      />
      <Stack.Screen
        name="clip/[feedId]"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: t.c.canvas },
        }}
      />
      <Stack.Screen name="game/[gameId]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="profile" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="bracket/[tournamentId]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="ending" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
