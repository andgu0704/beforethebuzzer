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
  const [tried, setTried] = useState(false);
  const target = last && saves.some((s) => s.id === last) ? last : null;
  useEffect(() => {
    if (target && !open && !tried)
      void openCareer(target).finally(() => {
        setTried(true);
      });
    else setTried(true);
  }, [target, open, tried]);
  if (!tried) return <View style={{ flex: 1, backgroundColor: t.c.canvas }} />;
  if (open) return <Redirect href="/home" />;
  return <Redirect href="/welcome" />;
}
