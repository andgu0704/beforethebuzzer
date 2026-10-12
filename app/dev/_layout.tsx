import { Stack } from 'expo-router';

import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

export default function DevLayout() {
  const t = useTheme();
  const { t: tt } = useT();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: t.c.canvas },
        headerTintColor: t.c.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: 'SchibstedGrotesk_600SemiBold', color: t.c.ink },
        contentStyle: { backgroundColor: t.c.canvas },
      }}
    >
      <Stack.Screen name="styleguide" options={{ title: tt('ui.styleguide.title') }} />
      <Stack.Screen name="portraits" options={{ title: tt('ui.godmode.portraitLab') }} />
    </Stack>
  );
}
