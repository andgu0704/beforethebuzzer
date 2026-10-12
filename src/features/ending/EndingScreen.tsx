import { Stack, router } from 'expo-router';
import { ShareNetworkIcon as Share } from 'phosphor-react-native';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { closeCareer, useGame } from '@/state/game';
import { Button } from '@/ui/components/Button';
import { Screen } from '@/ui/components/Layout';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { CareerCard } from './CareerCard';
import { shareView } from './share';

/** The ending card, or the shareable card from the profile when the career is still going. */
export function EndingScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tt, m } = useT();
  const state = useGame((g) => g.state);
  const ref = useRef<View>(null);
  const [note, setNote] = useState<string | null>(null);
  if (!state) return null;
  const end = state.career.ending;
  const last = state.career.feed
    .filter(
      (f) =>
        f.message.key === 'feed.drafted' ||
        f.message.key === 'feed.undrafted' ||
        f.message.key === 'feed.pro.retired',
    )
    .pop();
  return (
    <View
      style={{ flex: 1, backgroundColor: t.c.canvas, paddingTop: end ? insets.top : 0 }}
      testID="ending"
    >
      <Stack.Screen options={{ headerShown: !end, gestureEnabled: !end, title: '' }} />
      <Screen>
        <Text variant="label" color="brandText" style={{ marginTop: t.space.l }}>
          {end ? tt('ui.ending.kicker') : tt('ui.ending.card')}
        </Text>
        {last ? (
          <Text variant="displayM" style={{ marginVertical: t.space.m }}>
            {m(last.message)}
          </Text>
        ) : null}
        {end?.reason === 'undrafted' || end?.reason === 'retired' ? (
          <Text variant="body" style={{ marginBottom: t.space.m }}>
            {tt(end.reason === 'retired' ? 'ui.ending.retiredBody' : 'ui.ending.undraftedBody')}
          </Text>
        ) : null}
        <CareerCard ref={ref} state={state} />
        <View style={{ gap: t.space.m, marginTop: t.space.xl }}>
          <Button
            testID="share-card"
            icon={Share}
            label={tt('ui.ending.share')}
            onPress={() =>
              void shareView(ref, tt('ui.ending.shareTitle')).then((ok) => {
                setNote(ok ? null : tt('ui.ending.shareUnavailable'));
              })
            }
          />
          {note ? (
            <Text variant="footnote" color="inkSecondary" align="center">
              {note}
            </Text>
          ) : null}
          <Button
            variant="secondary"
            label={tt('ui.ending.timeline')}
            onPress={() => {
              router.push('/profile');
            }}
          />
          {end ? (
            <Button
              variant="tertiary"
              label={tt('ui.ending.newCareer')}
              onPress={() => {
                closeCareer();
                router.replace('/welcome');
              }}
            />
          ) : null}
        </View>
      </Screen>
    </View>
  );
}
