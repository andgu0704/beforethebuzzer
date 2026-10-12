import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { GOD_MODE_AVAILABLE } from '@/features/godmode';
import { closeCareer, useGame } from '@/state/game';
import { useSettings } from '@/state/settings';
import { SegmentedControl } from '@/ui/components/Controls';
import { ListRow, Screen, SectionHeader } from '@/ui/components/Layout';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

function Toggle({
  label,
  body,
  value,
  onChange,
  testID,
}: {
  readonly label: string;
  readonly body: string;
  readonly value: boolean;
  readonly onChange: (v: boolean) => void;
  readonly testID: string;
}) {
  const t = useTheme();
  return (
    <View style={[styles.toggle, { borderBottomColor: t.c.hairline }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="subhead">{label}</Text>
        <Text variant="footnote" color="inkSecondary">
          {body}
        </Text>
      </View>
      <Switch
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: t.c.accent, false: t.c.sunken }}
        thumbColor={t.c.surface}
        {...{ activeThumbColor: t.c.surface }}
      />
    </View>
  );
}

export function SettingsScreen() {
  const t = useTheme();
  const { t: tt } = useT();
  const s = useSettings();
  const hasCareer = useGame((g) => g.state !== null);
  const taps = useRef<number[]>([]);
  const version = Constants.expoConfig?.version ?? '0.0.0';

  const tapVersion = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((x) => now - x < 3000), now];
    if (taps.current.length >= 7 && GOD_MODE_AVAILABLE) {
      taps.current = [];
      router.push('/godmode');
    }
  };

  return (
    <Screen testID="settings">
      <SectionHeader title={tt('ui.settings.appearance')} />
      <View style={{ marginTop: t.space.m }}>
        <SegmentedControl
          testID="theme"
          value={s.theme}
          onChange={(theme) => {
            s.update({ theme });
          }}
          options={(['system', 'light', 'dark'] as const).map((id) => ({
            id,
            label: tt(`ui.settings.theme.${id}`),
          }))}
        />
      </View>
      <SectionHeader title={tt('ui.settings.play')} />
      <Toggle
        testID="haptics"
        label={tt('ui.settings.haptics')}
        body={tt('ui.settings.hapticsBody')}
        value={s.haptics}
        onChange={(haptics) => {
          s.update({ haptics });
        }}
      />
      <Toggle
        testID="stop-every"
        label={tt('ui.settings.stopEvery')}
        body={tt('ui.settings.stopEveryBody')}
        value={s.stopAtEveryMoment}
        onChange={(stopAtEveryMoment) => {
          s.update({ stopAtEveryMoment });
        }}
      />
      <Toggle
        testID="autoplay"
        label={tt('ui.settings.autoplay')}
        body={tt('ui.settings.autoplayBody')}
        value={s.clipAutoplay}
        onChange={(clipAutoplay) => {
          s.update({ clipAutoplay });
        }}
      />
      {hasCareer ? (
        <>
          <ListRow
            testID="edit-names"
            title={tt('ui.settings.names')}
            subtitle={tt('ui.settings.namesBody')}
            onPress={() => {
              router.push('/settings/names');
            }}
          />
          <ListRow
            testID="close-career"
            title={tt('ui.settings.closeCareer')}
            onPress={() => {
              closeCareer();
              router.replace('/welcome');
            }}
          />
        </>
      ) : null}
      <SectionHeader title={tt('ui.settings.about')} />
      <Text variant="callout" color="inkSecondary" style={{ marginTop: t.space.m }}>
        {tt('ui.settings.aboutBody')}
      </Text>
      <Pressable
        testID="version"
        onPress={tapVersion}
        style={{ minHeight: 44, justifyContent: 'center', marginTop: t.space.m }}
        accessibilityRole="text"
      >
        <Text variant="footnote" color="inkTertiary">
          {tt('ui.settings.version', { version })}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
