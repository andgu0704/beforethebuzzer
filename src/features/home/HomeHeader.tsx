import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { userOf } from '@/engine/career/state';
import { useGame } from '@/state/game';
import {
  conferencePlace,
  currentTeam,
  gradesAtRisk,
  pollRank,
  recordOf,
  recordText,
} from '@/state/views';
import { Avatar } from '@/ui/components/Avatar';
import { Meter } from '@/ui/components/Meter';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useLargeText, useTheme } from '@/ui/theme/theme';

/** Portrait, name, team and record, and the five meters with a contextual sixth. */
export function HomeHeader() {
  const t = useTheme();
  const { t: tt, names } = useT();
  const large = useLargeText();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  if (!state) return null;
  const u = userOf(state);
  const c = state.career;
  const team = currentTeam(state);
  const rec = team ? recordOf(state, team.id) : null;
  const place = team ? conferencePlace(state, team.id) : null;
  const rank = team ? pollRank(state, team.id) : null;
  const classYear =
    u.affiliation.kind === 'college'
      ? tt(`ui.classYears.${u.affiliation.classYear}`)
      : tt(`ui.stages.${c.stage}`);
  const name = names.person(u.id);
  const status = u.injury
    ? { text: tt('ui.home.injured', { weeks: u.injury.weeksLeft }), tone: 'negative' as const }
    : c.ineligible
      ? { text: tt('ui.home.ineligible'), tone: 'caution' as const }
      : c.suspendedGames > 0
        ? { text: tt('ui.home.suspended', { n: c.suspendedGames }), tone: 'caution' as const }
        : null;
  return (
    <View style={{ gap: t.space.m }}>
      <View style={styles.top}>
        <Pressable
          testID="open-profile"
          accessibilityRole="button"
          accessibilityLabel={tt('ui.home.profile')}
          onPress={() => {
            router.push('/profile');
          }}
          style={({ pressed }) => [styles.who, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Avatar
            name={name}
            portrait={u.portrait}
            size={44}
            primary={team?.colours.primary}
            secondary={team?.colours.secondary}
            jersey={u.jersey}
          />
          <View style={{ flexShrink: 1 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="footnote" color="inkSecondary" numberOfLines={1}>
              {`#${u.jersey} · ${tt(`ui.positions.${u.position}`)} · ${classYear}`}
            </Text>
          </View>
        </Pressable>
        {team ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="label">
              {`${rank ? `${tt('ui.home.pollRank', { rank })} ` : ''}${names.team(team.id, 'nickname')} ${recordText(rec)}`}
            </Text>
            <Text variant="footnote" color="inkSecondary" numberOfLines={1}>
              {place && place.place > 0
                ? tt('ui.home.place', { place: ordinal(place.place), conference: place.conference })
                : names.team(team.id, 'name')}
            </Text>
          </View>
        ) : null}
      </View>
      {status ? (
        <Text variant="label" color={status.tone}>
          {status.text}
        </Text>
      ) : null}
      <View style={[styles.meters, large && styles.metersLarge]}>
        <Meter
          label={tt('ui.meters.energy')}
          accessibilityLabel={`${tt('ui.meters.energyLong')} ${Math.round(u.energy)}`}
          value={u.energy}
          tone={u.energy < 30 ? 'caution' : 'ink'}
        />
        <Meter
          label={tt('ui.meters.health')}
          accessibilityLabel={`${tt('ui.meters.healthLong')} ${Math.round(u.health)}`}
          value={u.health}
          tone={u.health < 50 ? 'negative' : 'ink'}
        />
        <Meter
          label={tt('ui.meters.confidence')}
          accessibilityLabel={`${tt('ui.meters.confidenceLong')} ${Math.round(u.confidence)}`}
          value={u.confidence}
        />
        <Meter
          label={tt('ui.meters.trust')}
          accessibilityLabel={`${tt('ui.meters.trustLong')} ${Math.round(c.coachTrust)}`}
          value={c.coachTrust}
        />
        <Meter
          label={tt('ui.meters.reputation')}
          accessibilityLabel={`${tt('ui.meters.reputationLong')} ${Math.round(c.reputation)}`}
          value={c.reputation}
        />
        {gradesAtRisk(state) ? (
          <Meter
            label={tt('ui.meters.gpa')}
            value={c.gpa}
            max={4}
            format={(n) => n.toFixed(2)}
            tone={c.gpa < 2 ? 'negative' : 'caution'}
            accessibilityLabel={`GPA ${c.gpa.toFixed(2)}`}
          />
        ) : null}
      </View>
    </View>
  );
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th'}`;
}

const styles = StyleSheet.create({
  topLarge: { flexDirection: 'column', alignItems: 'flex-start' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1, minHeight: 44 },
  meters: { flexDirection: 'row', gap: 12 },
  metersLarge: { flexWrap: 'wrap', rowGap: 12 },
});
