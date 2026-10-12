import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGame } from '@/state/game';
import { TabBar } from '@/ui/components/TabBar';
import { useTheme } from '@/ui/theme/theme';

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  // Unspent skill points show on the Train tab.
  const points = useGame((g) => Math.floor(g.state?.career.skillPoints ?? 0));
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <TabBar {...props} badges={{ train: points }} />}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="train" />
        <Tabs.Screen name="team" />
        <Tabs.Screen name="career" />
        <Tabs.Screen name="social" />
      </Tabs>
      {/* The tabs have no header, so scrolled content would run under the status bar. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: t.c.canvas,
          opacity: 0.96,
        }}
      />
    </View>
  );
}
