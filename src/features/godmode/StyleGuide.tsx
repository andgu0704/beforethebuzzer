import { HouseIcon as House } from 'phosphor-react-native';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { colleges } from '@/content/world/colleges';
import { proTeams } from '@/content/world/pro-teams';
import { generatePortrait } from '@/engine/world/portrait';
import { createRng } from '@/engine/core/rng';
import { content } from '@/content';
import { Avatar } from '@/ui/components/Avatar';
import { Button, IconButton } from '@/ui/components/Button';
import { PlanBar, SegmentedControl, Stepper } from '@/ui/components/Controls';
import { ChipRow, OptionRow, TextField } from '@/ui/components/Field';
import {
  Banner,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  Rule,
  Screen,
  SectionHeader,
  Skeleton,
} from '@/ui/components/Layout';
import { Flag, TeamMark } from '@/ui/components/Marks';
import { Meter } from '@/ui/components/Meter';
import { BoxScoreTable, Scorebug, Sparkline, StatLine } from '@/ui/components/Stats';
import { Tag } from '@/ui/components/Tag';
import { Text } from '@/ui/components/Text';
import { PortraitLab } from '@/ui/portrait/Portrait';
import { useT } from '@/ui/i18n';
import { ThemeProvider, useTheme } from '@/ui/theme/theme';
import { palette, radii, space, type as typeScale, type TypeVariant } from '@/ui/theme/tokens';

import { ChoiceButton } from '../decide/ChoiceButton';

function Swatches() {
  const t = useTheme();
  return (
    <View style={styles.swatches}>
      {(Object.entries(t.c) as [string, string][]).map(([name, value]) => (
        <View key={name} style={styles.swatch}>
          <View
            style={[
              styles.chip,
              { backgroundColor: value, borderColor: t.c.hairline, borderRadius: radii.sm },
            ]}
          />
          <Text variant="footnote">{name}</Text>
          <Text variant="caption" color="inkTertiary">
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Everything() {
  const t = useTheme();
  const { t: tt } = useT();
  const [seg, setSeg] = useState<'a' | 'b' | 'c'>('a');
  const [n, setN] = useState(3);
  const rng = createRng('styleguide', 'faces');
  const nation = content.nations[0];
  return (
    <View style={{ backgroundColor: t.c.canvas, padding: t.gutter, gap: t.space.m }}>
      <SectionHeader title={tt('ui.styleguide.colour')} detail={t.scheme} />
      <Swatches />
      <SectionHeader title={tt('ui.styleguide.type')} />
      {(Object.keys(typeScale) as TypeVariant[]).map((v) => (
        <View key={v} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text variant="caption" color="inkTertiary" style={{ width: 70 }}>
            {v}
          </Text>
          <Text variant={v} style={{ flex: 1 }} numberOfLines={1}>
            {v === 'scoreboard' || v === 'stat' ? '81–78' : tt('ui.styleguide.sample')}
          </Text>
        </View>
      ))}
      <SectionHeader title={tt('ui.styleguide.spacing')} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
        {Object.entries(space).map(([k, v]) => (
          <View key={k} style={{ alignItems: 'center' }}>
            <View style={{ width: v, height: v, backgroundColor: t.c.accent }} />
            <Text variant="caption" color="inkTertiary">
              {v}
            </Text>
          </View>
        ))}
      </View>
      <SectionHeader title={tt('ui.styleguide.components')} />
      <Button label="Primary" onPress={() => undefined} />
      <Button label="Secondary" variant="secondary" onPress={() => undefined} />
      <Button label="Tertiary" variant="tertiary" onPress={() => undefined} />
      <Button label="Destructive" variant="destructive" onPress={() => undefined} />
      <Button label="Disabled" disabled onPress={() => undefined} />
      <Button label="Loading" loading onPress={() => undefined} />
      <Button label="Compact" size="compact" variant="secondary" onPress={() => undefined} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <IconButton icon={House} label="Home" onPress={() => undefined} />
        <IconButton icon={House} label="Home" selected onPress={() => undefined} />
        <IconButton icon={House} label="Home" disabled onPress={() => undefined} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Meter label="Energy" value={62} />
        <Meter label="Health" value={88} trend={-2} tone="negative" />
        <Meter label="Confid." value={74} trend={3} />
        <Meter label="GPA" value={2.1} max={4} format={(x) => x.toFixed(2)} tone="caution" />
      </View>
      <Scorebug
        kicker="Final · Overtime · Home"
        home={{
          name: 'Halcyon State',
          abbr: 'HSU',
          score: 81,
          colour: '#14634A',
          won: true,
          record: '13–4',
        }}
        away={{
          name: 'Tulsa Plains',
          abbr: 'TPW',
          score: 78,
          colour: '#8A2432',
          won: false,
          record: '10–7',
        }}
      />
      <StatLine
        items={[
          { value: 27, label: 'PTS' },
          { value: 6, label: 'REB' },
          { value: 4, label: 'AST' },
          { value: '9-14', label: 'FG' },
        ]}
      />
      <BoxScoreTable
        columns={[
          { key: 'pts', label: 'PTS' },
          { key: 'reb', label: 'REB' },
          { key: 'ast', label: 'AST' },
        ]}
        rows={[
          { id: 'a', name: 'Nika Beridze', cells: { pts: 27, reb: 6, ast: 4 } },
          { id: 'b', name: 'Ade Nwaneri', cells: { pts: 12, reb: 9, ast: 1 } },
        ]}
        highlight="a"
      />
      <Sparkline values={[40, 35, 31, 33, 24, 19, 17]} invert />
      <SegmentedControl
        value={seg}
        onChange={setSeg}
        options={[
          { id: 'a', label: 'Roster' },
          { id: 'b', label: 'Coach' },
          { id: 'c', label: 'Schedule' },
        ]}
      />
      <Stepper label="Shooting" value={n} max={10} onChange={setN} detail="3 blocks" />
      <PlanBar
        total={10}
        segments={[
          { id: 'a', value: 4, tone: 'accent' },
          { id: 'b', value: 2, tone: 'positive' },
          { id: 'c', value: 2, tone: 'caution' },
        ]}
      />
      <ChipRow
        value="SG"
        onChange={() => undefined}
        options={[
          { id: 'PG', label: 'PG' },
          { id: 'SG', label: 'SG' },
          { id: 'SF', label: 'SF' },
        ]}
      />
      <OptionRow title="Shooter" body="Catch, rise, release." selected onPress={() => undefined} />
      <TextField label="First name" value="Nika" onChangeText={() => undefined} />
      <TextField
        label="Last name"
        value=""
        onChangeText={() => undefined}
        error="Add a last name."
      />
      <ChoiceButton
        label="Go to the party"
        read="Chemistry up, energy down."
        because="Because you: told the coach the truth"
        onPress={() => undefined}
      />
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <Tag label="Neutral" />
        <Tag label="Accent" tone="accent" />
        <Tag label="Positive" tone="positive" />
        <Tag label="Negative" tone="negative" />
        <Tag label="Caution" tone="caution" />
        <Tag label="Brand" tone="brand" />
      </View>
      <Banner
        title="Grades at risk"
        body="One more bad week and you sit."
        action={{ label: 'Study', onPress: () => undefined }}
      />
      <Card>
        <Text variant="callout">Card</Text>
      </Card>
      <ListRow title="List row" subtitle="With a subtitle" value="12" onPress={() => undefined} />
      <Rule strong />
      <SectionHeader title={tt('ui.styleguide.states')} />
      <EmptyState
        title="Empty state"
        body="Nothing here yet."
        action={{ label: 'Do something', onPress: () => undefined }}
      />
      <ErrorState
        title="Error state"
        body="It went wrong."
        retry={{ label: 'Try again', onPress: () => undefined }}
      />
      <View style={{ gap: 6 }}>
        <Skeleton width="60%" />
        <Skeleton width="90%" />
        <Skeleton width={120} height={40} />
      </View>
      <SectionHeader title={tt('ui.styleguide.marks')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {colleges.slice(0, 8).map((c) => (
          <TeamMark
            key={c.id}
            teamId={c.id}
            abbr={c.abbr}
            primary={c.colours.primary}
            secondary={c.colours.secondary}
            size={36}
          />
        ))}
        {proTeams.map((p) => (
          <TeamMark
            key={p.id}
            teamId={p.id}
            abbr={p.abbr}
            primary={p.colours.primary}
            secondary={p.colours.secondary}
            emblem={p.emblem}
            size={36}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {content.nations.slice(0, 12).map((x) => (
          <Flag key={x.code} code={x.code} />
        ))}
      </View>
      <SectionHeader title={tt('ui.styleguide.portraits')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(['neutral', 'smile', 'focused', 'frustrated', 'stunned', 'draft'] as const).map((e) => (
          <Avatar
            key={e}
            name={e}
            portrait={nation ? generatePortrait(rng, nation) : undefined}
            expression={e}
            size={56}
            primary="#14634A"
            secondary="#F1EFEA"
            jersey={7}
          />
        ))}
      </View>
    </View>
  );
}

/** Every token and component in every state, in both themes (§10.7). */
export function StyleGuideScreen() {
  return (
    <Screen padded={false} testID="styleguide">
      <ThemeProvider forceScheme="light">
        <Everything />
      </ThemeProvider>
      <ThemeProvider forceScheme="dark">
        <Everything />
      </ThemeProvider>
      <View style={{ height: 1, backgroundColor: palette.light.hairline }} />
    </Screen>
  );
}

/** The portrait lab: 100 random faces, light and dark, to catch weak combinations. */
export function PortraitLabScreen() {
  const { width } = useWindowDimensions();
  const [seed, setSeed] = useState(1);
  const teams = proTeams.map((p) => ({
    primary: p.colours.primary,
    secondary: p.colours.secondary,
  }));
  return (
    <Screen padded={false} testID="portrait-lab">
      <View style={{ padding: 16 }}>
        <Button
          label={`Seed ${seed} · next`}
          variant="secondary"
          onPress={() => {
            setSeed(seed + 1);
          }}
        />
      </View>
      <View style={{ backgroundColor: palette.light.canvas, padding: 8 }}>
        <PortraitLab
          seed={seed}
          width={width - 16}
          background={palette.light.sunken}
          teams={teams}
        />
      </View>
      <View style={{ backgroundColor: palette.dark.canvas, padding: 8 }}>
        <PortraitLab
          seed={seed}
          width={width - 16}
          background={palette.dark.sunken}
          teams={teams}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 104, gap: 2 },
  chip: { height: 40, borderWidth: StyleSheet.hairlineWidth },
});
