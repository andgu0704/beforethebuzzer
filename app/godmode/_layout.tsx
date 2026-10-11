import { Stack } from 'expo-router';

import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

export default function GodModeLayout() {
  const t = useTheme();
  const { t: tt } = useT();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: tt('ui.godmode.title'),
        headerStyle: { backgroundColor: t.c.canvas },
        headerTintColor: t.c.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: t.c.canvas },
      }}
    />
  );
}
