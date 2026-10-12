import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import {
  BarbellIcon as Barbell,
  BriefcaseIcon as Briefcase,
  ChatsCircleIcon as ChatsCircle,
  HouseIcon as House,
  UsersThreeIcon as UsersThree,
  type Icon,
} from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/platform/haptics';

import { useT } from '../i18n';
import { useTheme } from '../theme/theme';
import { Text } from './Text';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, Icon> = {
  home: House,
  train: Barbell,
  team: UsersThree,
  career: Briefcase,
  social: ChatsCircle,
};

/** Five tabs: regular icons when inactive, fill when active (§10.5). */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const { t: tt } = useT();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: t.c.canvas,
          borderTopColor: t.c.hairline,
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const IconCmp = ICONS[route.name] ?? House;
        const label = tt(`ui.tabs.${route.name}`);
        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                haptic('selection');
                navigation.navigate(route.name);
              }
            }}
            style={styles.tab}
          >
            <IconCmp
              size={24}
              color={focused ? t.c.ink : t.c.inkTertiary}
              weight={focused ? 'fill' : 'regular'}
            />
            <Text
              variant="caption"
              color={focused ? 'ink' : 'inkTertiary'}
              maxFontSizeMultiplier={1.4}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 48 },
});
