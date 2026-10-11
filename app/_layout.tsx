import { Antonio_600SemiBold, Antonio_700Bold } from '@expo-google-fonts/antonio';
import {
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
} from '@expo-google-fonts/schibsted-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { loadSkia } from '@/platform/skia';
import { boot, useGame } from '@/state/game';
import { ThemeProvider, useTheme } from '@/ui/theme/theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Root() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.c.canvas },
          headerTintColor: t.c.ink,
          headerStyle: { backgroundColor: t.c.canvas },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: 'SchibstedGrotesk_600SemiBold', color: t.c.ink },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="create" />
        <Stack.Screen name="(game)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="godmode" />
        <Stack.Screen name="dev" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Antonio_600SemiBold,
    Antonio_700Bold,
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_600SemiBold,
  });
  const booted = useGame((g) => g.booted);
  const [skia, setSkia] = useState(false);
  useEffect(() => {
    void boot();
    void loadSkia()
      .catch(() => undefined)
      .finally(() => {
        setSkia(true);
      });
  }, []);
  const ready = (fontsLoaded || fontError !== null) && booted && skia;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Root />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
