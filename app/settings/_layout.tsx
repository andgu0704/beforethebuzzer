import { Stack } from 'expo-router';

import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

export default function SettingsLayout() {
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
      <Stack.Screen name="index" options={{ title: tt('ui.settings.title') }} />
      <Stack.Screen name="names" options={{ title: tt('ui.names.title') }} />
    </Stack>
  );
}
