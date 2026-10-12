import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { userOf } from '@/engine/career/state';
import { haptic } from '@/platform/haptics';
import { useGame } from '@/state/game';
import { ClipPlayer } from '@/ui/clips/ClipPlayer';
import { Button } from '@/ui/components/Button';
import { EmptyState, Screen } from '@/ui/components/Layout';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { clipSetup, specFromFeed } from '../decide/clipProps';

/** Replays a key moment from the feed or a game report. */
export function ClipScreen() {
  const t = useTheme();
  const { t: tt, m, names } = useT();
  const { feedId } = useLocalSearchParams<{ feedId: string }>();
  const state = useGame((g) => g.state);
  const entry = state?.career.feed.find((f) => f.id === feedId);
  if (!state || !entry?.data) return <EmptyState title={tt('ui.game.missing')} />;
  const setup = clipSetup(state, entry.gameId, names);
  const spec = specFromFeed(entry.data, setup.userSide, userOf(state).jersey);
  return (
    <View style={{ flex: 1, backgroundColor: t.c.canvas }} testID="clip">
      <Screen>
        <View style={{ paddingTop: t.space.xl, gap: t.space.l }}>
          <Text variant="label" color="brandText">
            {tt('ui.decide.moment.kicker')}
          </Text>
          <ClipPlayer
            spec={spec}
            home={setup.home}
            away={setup.away}
            params={setup.params}
            scheme={t.scheme}
            signature={state.career.signature === spec.template && spec.success}
            resultLine={m(entry.message)}
            onBuzzer={() => {
              haptic('heavy');
            }}
          />
          <Text variant="bodyStrong">{m(entry.message)}</Text>
          <Button
            variant="secondary"
            label={tt('ui.common.close')}
            onPress={() => {
              router.back();
            }}
          />
        </View>
      </Screen>
    </View>
  );
}
