import { Tabs } from 'expo-router';

import { TabBar } from '@/ui/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
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
