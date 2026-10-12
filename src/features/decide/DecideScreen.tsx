import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MomentResult } from '@/engine/career/game';
import { castParams } from '@/engine/career/events';
import { userOf } from '@/engine/career/state';
import type { FeedEntry, Interrupt } from '@/engine/model/career';
import { haptic } from '@/platform/haptics';
import { decideMounted, liveActive } from '@/state/decide';
import { choose, contentIndex, playOn, useGame } from '@/state/game';
import { tournamentName } from '@/state/views';
import { Avatar } from '@/ui/components/Avatar';
import { Button } from '@/ui/components/Button';
import { TeamMark } from '@/ui/components/Marks';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { FeedItem } from '../feed/FeedItem';
import { ChoiceButton } from './ChoiceButton';
import { MomentView } from './MomentView';
import { becauseOf } from './labels';

interface Resolved {
  readonly interrupt: Interrupt;
  readonly outcome: unknown;
  /** Feed entries the decision produced. */
  readonly entries: readonly FeedEntry[];
}

function Header({
  kicker,
  title,
  body,
}: {
  readonly kicker: string;
  readonly title: string;
  readonly body?: string;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.s }}>
      <Text variant="label" color="accentText">
        {kicker}
      </Text>
      <Text variant="displayM" accessibilityRole="header">
        {title}
      </Text>
      {body ? <Text variant="body">{body}</Text> : null}
    </View>
  );
}

function EventCard({
  i,
  onChoose,
}: {
  readonly i: Extract<Interrupt, { kind: 'event' }>;
  readonly onChoose: (c: string) => void;
}) {
  const t = useTheme();
  const { t: tt, m, names, tr } = useT();
  const state = useGame((g) => g.state);
  if (!state) return null;
  const def = contentIndex().event.get(i.eventId);
  const params = castParams(i.cast);
  const castPerson = Object.entries(i.cast).find(([role]) => role !== 'opponent')?.[1];
  const person = castPerson ? state.world.people[castPerson] : undefined;
  return (
    <View style={{ gap: t.space.l }}>
      {person ? (
        <View style={styles.castRow}>
          <Avatar
            name={names.person(person.id)}
            portrait={person.portrait}
            size={56}
            staff={person.kind !== 'player'}
            expression="focused"
          />
          <Text variant="subhead" color="inkSecondary">
            {names.person(person.id)}
          </Text>
        </View>
      ) : null}
      <Header
        kicker={tt(`ui.decide.categories.${def?.category ?? 'team'}`)}
        title={m({ key: `events.${i.eventId}.title`, params })}
        body={m({ key: `events.${i.eventId}.body`, params })}
      />
      <View style={{ gap: t.space.s }}>
        {i.choices.map((c) => {
          const choice = def?.choices.find((x) => x.id === c);
          return (
            <ChoiceButton
              key={c}
              testID={`choice-${c}`}
              label={m({ key: `events.${i.eventId}.choices.${c}.label`, params })}
              because={becauseOf(state, contentIndex(), choice?.requires, tt, (key) =>
                tr.message({ key }, names),
              )}
              onPress={() => {
                onChoose(c);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function OffersCard({
  i,
  onChoose,
}: {
  readonly i: Extract<Interrupt, { kind: 'offers' }>;
  readonly onChoose: (c: string) => void;
}) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  if (!state) return null;
  return (
    <View style={{ gap: t.space.l }}>
      <Header
        kicker={tt('ui.decide.offers.kicker')}
        title={tt('ui.decide.offers.title')}
        body={tt('ui.decide.offers.body')}
      />
      {i.offers.map((o) => {
        const team = state.world.teams[o.teamId];
        const college = team?.kind === 'college' ? team : null;
        return (
          <View
            key={o.teamId}
            style={[
              styles.offer,
              { backgroundColor: t.c.surface, borderRadius: t.radii.md, borderColor: t.c.hairline },
            ]}
          >
            <View style={styles.castRow}>
              {team ? (
                <TeamMark
                  teamId={team.id}
                  abbr={team.abbr}
                  primary={team.colours.primary}
                  secondary={team.colours.secondary}
                  size={44}
                />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text variant="displayS">{`${names.team(o.teamId)} ${names.team(o.teamId, 'nickname')}`}</Text>
                <Text variant="footnote" color="inkSecondary">
                  {[
                    team?.city,
                    college ? tt('ui.decide.offers.prestige', { n: college.prestige }) : null,
                    college ? tt('ui.decide.offers.academics', { n: college.academics }) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </View>
            <Text variant="subhead">
              {tt('ui.decide.offers.role', { role: o.role, minutes: o.minutes })}
            </Text>
            <Text variant="callout" color="inkSecondary">
              {tt(`offers.pitch.${o.pitch}`)}
            </Text>
            <Button
              testID={`offer-${o.teamId}`}
              variant="secondary"
              size="compact"
              label={tt('ui.decide.offers.commit', { team: names.team(o.teamId) })}
              onPress={() => {
                onChoose(o.teamId);
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

function ContractCard({
  i,
  onChoose,
}: {
  readonly i: Extract<Interrupt, { kind: 'contract' }>;
  readonly onChoose: (c: string) => void;
}) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  if (!state) return null;
  return (
    <View style={{ gap: t.space.l }}>
      <Header
        kicker={tt('ui.decide.contract.kicker')}
        title={tt('ui.decide.contract.title')}
        body={tt('ui.decide.contract.body')}
      />
      {i.offers.map((o) => {
        const team = state.world.teams[o.teamId];
        return (
          <View
            key={o.teamId}
            style={[
              styles.offer,
              { backgroundColor: t.c.surface, borderRadius: t.radii.md, borderColor: t.c.hairline },
            ]}
          >
            <View style={styles.castRow}>
              {team ? (
                <TeamMark
                  teamId={team.id}
                  abbr={team.abbr}
                  primary={team.colours.primary}
                  secondary={team.colours.secondary}
                  size={44}
                />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text variant="displayS">{`${names.team(o.teamId)} ${names.team(o.teamId, 'nickname')}`}</Text>
                {o.current ? (
                  <Text variant="footnote" color="accentText">
                    {tt('ui.decide.contract.stay')}
                  </Text>
                ) : null}
              </View>
            </View>
            <Text variant="subhead">
              {tt('ui.decide.contract.terms', {
                years: o.years,
                salary: (o.salary / 1_000_000).toFixed(1),
              })}
            </Text>
            <Text variant="callout" color="inkSecondary">
              {tt('ui.decide.contract.role', { role: o.role })}
            </Text>
            <Button
              testID={`offer-${o.teamId}`}
              variant={o.current ? 'primary' : 'secondary'}
              size="compact"
              label={tt('ui.decide.contract.sign', { team: names.team(o.teamId) })}
              onPress={() => {
                onChoose(o.teamId);
              }}
            />
          </View>
        );
      })}
      {i.canRetire ? (
        <ChoiceButton
          testID="choice-retire"
          label={tt('ui.decide.contract.retire')}
          read={tt('ui.decide.contract.retireBody')}
          onPress={() => {
            onChoose('retire');
          }}
        />
      ) : null}
    </View>
  );
}

function SimpleCard({
  kicker,
  title,
  body,
  options,
  onChoose,
}: {
  readonly kicker: string;
  readonly title: string;
  readonly body: string;
  readonly options: readonly {
    readonly id: string;
    readonly label: string;
    readonly read?: string;
  }[];
  readonly onChoose: (c: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.l }}>
      <Header kicker={kicker} title={title} body={body} />
      <View style={{ gap: t.space.s }}>
        {options.map((o) => (
          <ChoiceButton
            key={o.id}
            testID={`choice-${o.id}`}
            label={o.label}
            read={o.read}
            onPress={() => {
              onChoose(o.id);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function WorkoutsCard({
  i,
  onChoose,
}: {
  readonly i: Extract<Interrupt, { kind: 'workouts' }>;
  readonly onChoose: (c: readonly string[]) => void;
}) {
  const t = useTheme();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  const [picked, setPicked] = useState<string[]>([]);
  if (!state) return null;
  return (
    <View style={{ gap: t.space.l }}>
      <Header
        kicker={tt('ui.decide.workouts.kicker')}
        title={tt('ui.decide.workouts.title')}
        body={tt('ui.decide.workouts.body', { max: i.max })}
      />
      <View style={{ gap: t.space.s }}>
        {i.teams.map((id) => {
          const team = state.world.teams[id];
          const on = picked.includes(id);
          const interest = state.career.draft.interest[id];
          return (
            <ChoiceButton
              key={id}
              testID={`workout-${id}`}
              label={names.team(id)}
              read={
                interest !== undefined
                  ? `${team?.kind === 'pro' ? team.division : ''} · ${Math.round(interest)}`
                  : undefined
              }
              selected={on}
              disabled={!on && picked.length >= i.max}
              onPress={() => {
                setPicked(on ? picked.filter((x) => x !== id) : [...picked, id]);
              }}
            />
          );
        })}
      </View>
      <Button
        testID="confirm-workouts"
        label={tt('ui.decide.workouts.confirm', { n: picked.length })}
        onPress={() => {
          onChoose(picked);
        }}
      />
    </View>
  );
}

function InterruptView({
  i,
  onChoose,
}: {
  readonly i: Interrupt;
  readonly onChoose: (c: string | readonly string[]) => void;
}) {
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  if (!state) return null;
  switch (i.kind) {
    case 'event':
      return <EventCard i={i} onChoose={onChoose} />;
    case 'keyMoment':
      return <MomentView i={i} onChoose={onChoose} />;
    case 'offers':
      return <OffersCard i={i} onChoose={onChoose} />;
    case 'callUp': {
      const tournament = state.world.tournaments[i.tournamentId];
      return (
        <SimpleCard
          kicker={tt('ui.decide.callUp.kicker')}
          title={tt('ui.decide.callUp.title', { nation: tt(`nations.${userOf(state).nation}`) })}
          body={tt('ui.decide.callUp.body', {
            level: i.level,
            tournament: tournament ? tournamentName(tournament, tt) : '',
          })}
          options={[
            { id: 'accept', label: tt('ui.decide.callUp.accept') },
            { id: 'decline', label: tt('ui.decide.callUp.decline') },
          ]}
          onChoose={onChoose}
        />
      );
    }
    case 'draftDecision': {
      const [best, worst] = state.career.draft.projected;
      const p = (n: number) =>
        n > 60
          ? tt('ui.decide.draftDecision.undrafted')
          : tt('ui.decide.draftDecision.pick', { n });
      return (
        <SimpleCard
          kicker={tt('ui.decide.draftDecision.kicker')}
          title={tt('ui.decide.draftDecision.title')}
          body={tt('ui.decide.draftDecision.body', { best: p(best), worst: p(worst) })}
          options={i.options.map((o) => ({
            id: o,
            label: tt(`ui.decide.draftDecision.${o}`),
            read: tt(`ui.decide.draftDecision.${o}Body`),
          }))}
          onChoose={onChoose}
        />
      );
    }
    case 'withdraw': {
      const [best, worst] = state.career.draft.projected;
      return (
        <SimpleCard
          kicker={tt('ui.decide.withdraw.kicker')}
          title={tt('ui.decide.withdraw.title')}
          body={tt('ui.decide.withdraw.body', { range: `${best}–${worst > 60 ? '—' : worst}` })}
          options={[
            { id: 'stay', label: tt('ui.decide.withdraw.stay') },
            { id: 'return', label: tt('ui.decide.withdraw.return') },
          ]}
          onChoose={onChoose}
        />
      );
    }
    case 'workouts':
      return <WorkoutsCard i={i} onChoose={onChoose} />;
    case 'agent':
      return (
        <SimpleCard
          kicker={tt('ui.decide.agent.kicker')}
          title={tt('ui.decide.agent.title')}
          body={tt('ui.decide.agent.body')}
          options={[
            ...i.agents.map((id) => {
              const a = state.world.people[id];
              return {
                id,
                label: names.person(id),
                read:
                  a?.kind === 'agent'
                    ? `${tt('ui.decide.agent.quality', { n: a.quality })} · ${tt('ui.decide.agent.fee', { fee: `${Math.round(a.fee * 1000) / 10}%` })}`
                    : '',
              };
            }),
            { id: 'none', label: tt('ui.decide.agent.none'), read: tt('ui.decide.agent.noneBody') },
          ]}
          onChoose={onChoose}
        />
      );
    case 'afterDraft':
      return (
        <SimpleCard
          kicker={tt('ui.decide.afterDraft.kicker')}
          title={tt('ui.decide.afterDraft.title')}
          body={tt('ui.decide.afterDraft.body', { n: i.seasonsLeft })}
          options={i.options.map((o) => ({
            id: o,
            label: tt(`ui.decide.afterDraft.${o}`),
            read: tt(`ui.decide.afterDraft.${o}Body`),
          }))}
          onChoose={onChoose}
        />
      );
    case 'contract':
      return <ContractCard i={i} onChoose={onChoose} />;
    case 'retire':
      return (
        <SimpleCard
          kicker={tt('ui.decide.retire.kicker')}
          title={tt('ui.decide.retire.title')}
          body={tt('ui.decide.retire.body', { age: i.age })}
          options={(['continue', 'retire'] as const).map((o) => ({
            id: o,
            label: tt(`ui.decide.retire.${o}`),
            read: tt(`ui.decide.retire.${o}Body`),
          }))}
          onChoose={onChoose}
        />
      );
    case 'draftNight':
      return (
        <SimpleCard
          kicker={tt('ui.decide.draftNight.kicker')}
          title={tt('ui.decide.draftNight.title')}
          body={tt('ui.decide.draftNight.body')}
          options={[{ id: 'go', label: tt('ui.decide.draftNight.go') }]}
          onChoose={onChoose}
        />
      );
  }
}

function OutcomeView({ r }: { readonly r: Resolved }) {
  const t = useTheme();
  const { t: tt } = useT();
  if (r.interrupt.kind === 'keyMoment')
    return (
      <MomentView
        i={r.interrupt}
        result={r.outcome as MomentResult}
        entry={r.entries.find((e) => e.kind === 'moment')}
        onChoose={() => undefined}
      />
    );
  return (
    <View style={{ gap: t.space.l }}>
      <Text variant="label" color="accentText">
        {tt('ui.decide.outcome')}
      </Text>
      {r.entries.length ? (
        r.entries.map((e) => (
          <View key={e.id} style={[styles.outcome, { borderBottomColor: t.c.hairline }]}>
            <FeedItem f={e} />
          </View>
        ))
      ) : (
        <Text variant="body">{tt('ui.decide.outcome')}</Text>
      )}
    </View>
  );
}

/** The decision sheet. Must-make decisions cannot be swiped away; the week carries on after. */
export function DecideScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tt } = useT();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  const pending = state?.career.pending[0] ?? null;
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const closing = useRef(false);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  const finish = () => {
    setResolved(null);
    const s = useGame.getState().state;
    if (s && s.career.pending.length === 0) {
      close();
      if (s.career.ending) router.push('/ending');
      // The live game screen carries on to tip-off itself; elsewhere the week plays on.
      else if (s.career.cursor.stage !== 'idle' && !liveActive()) void playOn();
    }
  };

  useEffect(() => {
    decideMounted(true);
    return () => {
      decideMounted(false);
    };
  }, []);

  const pendingKey = pending?.id;
  useEffect(() => {
    if (pendingKey) closing.current = false;
  }, [pendingKey]);

  useEffect(() => {
    if (!pending && !resolved) close();
  });

  if (!state) return null;

  const onChoose = (c: string | readonly string[]) => {
    if (!pending) return;
    const mark = state.career.feed.length;
    const outcome = choose(pending.id, c);
    if (pending.kind === 'draftNight') {
      close();
      router.push('/draft/night');
      return;
    }
    const entries = state.career.feed.slice(mark);
    if (pending.kind === 'keyMoment')
      haptic((outcome as MomentResult).success ? 'success' : 'warning');
    // Choices with nothing to show close at once; the rest show what happened first.
    if (pending.kind === 'keyMoment' || entries.length > 0)
      setResolved({ interrupt: pending, outcome, entries });
    else finish();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.c.canvas }} testID="decide">
      <ScrollView
        contentContainerStyle={{
          padding: t.gutter,
          paddingTop: t.space.xxl,
          gap: t.space.l,
          paddingBottom: t.space.x5,
        }}
      >
        {resolved ? (
          <OutcomeView r={resolved} />
        ) : pending ? (
          <InterruptView key={pending.id} i={pending} onChoose={onChoose} />
        ) : null}
      </ScrollView>
      {resolved ? (
        <View
          style={{
            paddingHorizontal: t.gutter,
            paddingBottom: insets.bottom + t.space.m,
            paddingTop: t.space.s,
          }}
        >
          <Button testID="decide-continue" label={tt('ui.decide.continue')} onPress={finish} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  castRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  offer: { padding: 16, gap: 8, borderWidth: StyleSheet.hairlineWidth },
  outcome: { paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
});
