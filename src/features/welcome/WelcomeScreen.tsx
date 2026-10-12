import { router } from 'expo-router';
import { GearIcon as Gear, PlusIcon as Plus } from 'phosphor-react-native';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { content } from '@/content';
import { createRng } from '@/engine/core/rng';
import type { SaveSummary } from '@/engine/save/store';
import { generatePortrait } from '@/engine/world/portrait';
import { deleteCareer, openCareer, useGame } from '@/state/game';
import { Avatar } from '@/ui/components/Avatar';
import { Button, IconButton } from '@/ui/components/Button';
import { Banner, Rule, Screen } from '@/ui/components/Layout';
import { Tag } from '@/ui/components/Tag';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

/** Four faces from a fixed seed, in four teams' colours: the cast of a career. */
const CAST = (() => {
  const rng = createRng('welcome', 'cast');
  const looks = [
    { nation: 'USA', primary: '#FF5A1F', secondary: '#FFFFFF', jersey: 7 },
    { nation: 'SEN', primary: '#14634A', secondary: '#F1EFEA', jersey: 23 },
    { nation: 'LTU', primary: '#1F3A68', secondary: '#C9A227', jersey: 11 },
    { nation: 'BRA', primary: '#8A2432', secondary: '#F2B544', jersey: 4 },
  ];
  return looks.map((l) => {
    const nation = content.nations.find((n) => n.code === l.nation) ?? content.nations[0];
    return { ...l, portrait: nation ? generatePortrait(rng, nation) : undefined };
  });
})();

function SaveRow({
  save,
  onOpen,
  onLongPress,
}: {
  readonly save: SaveSummary;
  readonly onOpen: () => void;
  readonly onLongPress: () => void;
}) {
  const t = useTheme();
  const { t: tt } = useT();
  const d = save.detail;
  const where = d
    ? d.teamName
      ? tt('ui.welcome.savedAt', { team: d.teamName, week: d.week, year: String(d.year) })
      : tt('ui.welcome.noTeam', { week: d.week, year: String(d.year) })
    : '';
  return (
    <Pressable
      testID={`save-${save.id}`}
      onPress={onOpen}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${save.name}. ${where}`}
      accessibilityHint={tt('ui.welcome.continue')}
      style={({ pressed }) => [
        styles.save,
        { opacity: pressed ? 0.6 : 1, borderBottomColor: t.c.hairline },
      ]}
    >
      <Avatar
        name={save.name}
        portrait={d?.portrait}
        primary={d?.colour || undefined}
        jersey={d?.jersey}
        size={52}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {save.name}
        </Text>
        <Text variant="footnote" color="inkSecondary" numberOfLines={1}>
          {d ? `${tt(`ui.stages.${d.stage}`)} · ${where}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          {d?.ended ? (
            <Tag
              tone="accent"
              label={
                d.pick
                  ? tt('ui.welcome.endedPick', { pick: d.pick })
                  : tt('ui.welcome.endedUndrafted')
              }
            />
          ) : null}
          {save.godMode ? <Tag tone="caution" label={tt('ui.common.godModeBadge')} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function WelcomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tt } = useT();
  const saves = useGame((g) => g.saves);
  const busy = useGame((g) => g.busy);
  const error = useGame((g) => g.error);
  const [failed, setFailed] = useState<string | null>(null);

  const open = async (id: string, backup = false) => {
    const ok = await openCareer(id, backup);
    if (ok) {
      setFailed(null);
      router.replace('/home');
    } else setFailed(id);
  };

  const confirmDelete = (save: SaveSummary) => {
    const message = tt('ui.welcome.deleteConfirm', { name: save.name });
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) void deleteCareer(save.id);
      return;
    }
    Alert.alert(tt('ui.welcome.delete'), message, [
      { text: tt('ui.common.cancel'), style: 'cancel' },
      {
        text: tt('ui.welcome.delete'),
        style: 'destructive',
        onPress: () => void deleteCareer(save.id),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.c.canvas, paddingTop: insets.top }}>
      <Screen testID="welcome">
        <View style={styles.top}>
          <View style={[styles.mark, { backgroundColor: t.c.brand }]} />
          <IconButton
            testID="open-settings"
            icon={Gear}
            variant="plain"
            label={tt('ui.welcome.settings')}
            onPress={() => {
              router.push('/settings');
            }}
          />
        </View>
        <Text variant="displayL" style={{ fontSize: 48, lineHeight: 50, marginTop: t.space.xxl }}>
          {tt('ui.welcome.title').toUpperCase()}
        </Text>
        <Text variant="callout" color="inkSecondary" style={{ marginTop: t.space.s }}>
          {saves.length ? tt('ui.welcome.tagline') : tt('ui.welcome.invite')}
        </Text>

        {saves.length ? null : (
          <View
            style={styles.cast}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {CAST.map((c, i) => (
              <Avatar
                key={i}
                name=""
                portrait={c.portrait}
                size={72}
                primary={c.primary}
                secondary={c.secondary}
                jersey={c.jersey}
                expression={i === 0 ? 'smile' : 'focused'}
                shape="card"
              />
            ))}
          </View>
        )}

        {failed ? (
          <View style={{ marginTop: t.space.xl }}>
            <Banner
              tone="negative"
              title={tt('ui.welcome.damaged')}
              body={
                error?.message
                  ? `${tt('ui.welcome.damagedBody')} (${error.message})`
                  : tt('ui.welcome.damagedBody')
              }
              action={{ label: tt('ui.welcome.restore'), onPress: () => void open(failed, true) }}
            />
          </View>
        ) : null}

        {saves.length ? (
          <View style={{ marginTop: t.space.x3 }}>
            <Text variant="label" color="inkSecondary" style={{ marginBottom: t.space.xs }}>
              {tt('ui.welcome.saves')}
            </Text>
            <Rule strong />
            {saves.map((s) => (
              <SaveRow
                key={s.id}
                save={s}
                onOpen={() => void open(s.id)}
                onLongPress={() => {
                  confirmDelete(s);
                }}
              />
            ))}
          </View>
        ) : null}

        <View style={{ marginTop: t.space.x3, gap: t.space.m }}>
          {saves[0] ? (
            <Button
              testID="continue"
              label={tt('ui.welcome.continue')}
              loading={busy?.kind === 'load'}
              onPress={() => void open(saves[0]?.id ?? '')}
            />
          ) : null}
          <Button
            testID="new-career"
            label={tt('ui.welcome.newCareer')}
            icon={Plus}
            variant={saves.length ? 'secondary' : 'primary'}
            onPress={() => {
              router.push('/create');
            }}
          />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  mark: { width: 28, height: 6, borderRadius: 1 },
  cast: { flexDirection: 'row', gap: 10, marginTop: 28 },
  save: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
