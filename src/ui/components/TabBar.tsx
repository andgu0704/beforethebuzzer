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
import { Platform, Pressable, StyleSheet, View } from 'react-native';
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
export function TabBar({
  state,
  navigation,
  badges = {},
}: BottomTabBarProps & { readonly badges?: Readonly<Record<string, number>> }) {
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
            aria-selected={focused}
            // The web names the tab from its content, badge included.
            accessibilityLabel={
              Platform.OS === 'web'
                ? undefined
                : badges[route.name]
                  ? `${label}, ${String(badges[route.name])}`
                  : label
            }
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
            <View>
              <IconCmp
                size={24}
                color={focused ? t.c.ink : t.c.inkTertiary}
                weight={focused ? 'fill' : 'regular'}
              />
              {badges[route.name] ? (
                <View
                  testID={`badge-${route.name}`}
                  style={[styles.badge, { backgroundColor: t.c.accent }]}
                >
                  <Text
                    variant="caption"
                    style={{ color: t.c.onAccent }}
                    maxFontSizeMultiplier={1.2}
                  >
                    {String(badges[route.name])}
                  </Text>
                </View>
              ) : null}
            </View>
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
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
