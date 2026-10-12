import { Tabs } from 'expo-router';

import { useGame } from '@/state/game';
import { TabBar } from '@/ui/components/TabBar';

export default function TabsLayout() {
  // Unspent skill points show on the Train tab.
  const points = useGame((g) => Math.floor(g.state?.career.skillPoints ?? 0));
  return (
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
  );
}
