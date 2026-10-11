import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { openCareer, useGame } from '@/state/game';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/ui/theme/theme';

/** Continues the last career straight away; otherwise the welcome screen. */
export default function Index() {
  const t = useTheme();
  const saves = useGame((g) => g.saves);
  const open = useGame((g) => g.state);
  const last = useSettings((s) => s.lastCareer);
  const target = last && saves.some((s) => s.id === last) ? last : null;
  const [tried, setTried] = useState(!target);
  useEffect(() => {
    if (target && !open && !tried)
      void openCareer(target).finally(() => {
        setTried(true);
      });
  }, [target, open, tried]);
  if (!tried && !open) return <View style={{ flex: 1, backgroundColor: t.c.canvas }} />;
  if (open) return <Redirect href="/home" />;
  return <Redirect href="/welcome" />;
}
