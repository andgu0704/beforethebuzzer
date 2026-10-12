import { router, useLocalSearchParams } from 'expo-router';
import { PlayIcon as Play } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import type { PlayerLine, TeamBox } from '@/engine/model/game';
import { useGame } from '@/state/game';
import { dayLabel, userGameLine } from '@/state/views';
import { Button } from '@/ui/components/Button';
import { EmptyState, Rule, Screen, SectionHeader } from '@/ui/components/Layout';
import { BoxScoreTable, Scorebug, StatLine } from '@/ui/components/Stats';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { FeedItem } from '../feed/FeedItem';
import { statItems } from '../feed/statItems';

const COLUMN_KEYS = [
  { key: 'min' },
  { key: 'pts' },
  { key: 'reb' },
  { key: 'ast' },
  { key: 'stl' },
  { key: 'blk' },
  { key: 'tov' },
  { key: 'fg', width: 52 },
  { key: 'tp', width: 52 },
  { key: 'ft', width: 52 },
  { key: 'pf' },
  { key: 'pm' },
] as const;

function cells(l: PlayerLine): Record<string, string | number> {
  return {
    min: Math.round(l.sec / 60),
    pts: l.pts,
    reb: l.orb + l.drb,
    ast: l.ast,
    stl: l.stl,
    blk: l.blk,
    tov: l.tov,
    fg: `${l.fgm}-${l.fga}`,
    tp: `${l.tpm}-${l.tpa}`,
    ft: `${l.ftm}-${l.fta}`,
    pf: l.pf,
    pm: l.pm > 0 ? `+${l.pm}` : l.pm,
  };
}

export function GameReport() {
  const t = useTheme();
  const { t: tt, names } = useT();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  const game = state?.world.games[gameId];
  if (!state || !game?.result) return <EmptyState title={tt('ui.game.missing')} />;
  const r = game.result;
  const homeTeam = state.world.teams[game.home];
  const awayTeam = state.world.teams[game.away];
  const line = userGameLine(state, game);
  const moments = state.career.feed.filter((f) => f.kind === 'moment' && f.gameId === game.id);
  const side = (id: string, score: number, other: number, colour: string | undefined) => ({
    name: names.team(id),
    abbr: names.team(id, 'abbr'),
    score,
    colour: colour ?? t.c.inkTertiary,
    won: score > other,
  });
  const box = (b: TeamBox) => (
    <View key={b.teamId} style={{ marginTop: t.space.m }}>
      <Text variant="label" color="inkSecondary" style={{ marginBottom: 4 }}>
        {names.team(b.teamId)}
      </Text>
      <BoxScoreTable
        columns={COLUMN_KEYS.map((c) => ({ ...c, label: tt(`ui.game.${c.key}`) }))}
        highlight={state.career.playerId}
        rows={[...b.players]
          .sort((x, y) => Number(y.starter) - Number(x.starter) || y.sec - x.sec)
          .map((l) => ({
            id: l.id,
            name: names.person(l.id) || '—',
            starter: l.starter,
            cells: l.sec > 0 ? cells(l) : { min: tt('ui.game.dnp') },
          }))}
      />
    </View>
  );
  return (
    <Screen testID="game-report">
      <Scorebug
        big
        kicker={`${tt(`ui.game.kinds.${game.kind}`)} · ${dayLabel(game.date.week, game.slot * 3)}, ${game.date.year}${r.overtimes ? ` · ${r.overtimes}OT` : ''}`}
        home={side(game.home, r.home, r.away, homeTeam?.colours.primary)}
        away={side(game.away, r.away, r.home, awayTeam?.colours.primary)}
      />
      {line ? (
        <>
          <SectionHeader title={tt('ui.game.yourLine')} />
          <View style={{ marginTop: t.space.s }}>
            <StatLine
              size="large"
              items={statItems(tt, {
                pts: line.pts,
                reb: line.orb + line.drb,
                ast: line.ast,
                fgm: line.fgm,
                fga: line.fga,
                min: Math.round(line.sec / 60),
              })}
            />
          </View>
        </>
      ) : null}
      {moments.length ? (
        <>
          <SectionHeader title={tt('ui.game.moments')} />
          {moments.map((m) => (
            <View key={m.id} style={[styles.moment, { borderBottomColor: t.c.hairline }]}>
              <FeedItem f={m} />
            </View>
          ))}
        </>
      ) : null}
      <SectionHeader title={tt('ui.game.box')} />
      {r.box ? (
        [r.box.away, r.box.home].map(box)
      ) : (
        <Text variant="callout" color="inkSecondary">
          {tt('ui.game.noBox')}
        </Text>
      )}
      <Rule />
      <View style={{ marginTop: t.space.xl }}>
        <Button
          variant="secondary"
          icon={Play}
          label={tt('ui.game.back')}
          onPress={() => {
            router.back();
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  moment: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
