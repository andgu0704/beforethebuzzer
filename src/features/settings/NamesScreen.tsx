import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { mutate, useGame } from '@/state/game';
import { Button } from '@/ui/components/Button';
import { TextField } from '@/ui/components/Field';
import { EmptyState, ListRow, Screen, SectionHeader } from '@/ui/components/Layout';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

type Target =
  { readonly kind: 'team'; readonly id: string } | { readonly kind: 'person'; readonly id: string };

/** The name editor: overrides are written next to the generated originals, which can be restored. */
export function NamesScreen() {
  const t = useTheme();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  const [q, setQ] = useState('');
  const [target, setTarget] = useState<Target | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const results = useMemo(() => {
    if (!state || q.trim().length < 2) return { teams: [], people: [] };
    const needle = q.trim().toLowerCase();
    const teams = Object.values(state.world.teams)
      .filter((x) => x.kind === 'college' || x.kind === 'pro')
      .filter(
        (x) => names.team(x.id).toLowerCase().includes(needle) || x.abbr.toLowerCase() === needle,
      )
      .slice(0, 20);
    const people = Object.values(state.world.people)
      .filter((p) => names.person(p.id).toLowerCase().includes(needle))
      .slice(0, 30);
    return { teams, people };
  }, [state, q, names]);

  if (!state) return <EmptyState title={tt('ui.names.noCareer')} />;

  const open = (next: Target) => {
    setTarget(next);
    if (next.kind === 'team') {
      setFields({
        name: names.team(next.id, 'name'),
        nickname: names.team(next.id, 'nickname'),
        abbr: names.team(next.id, 'abbr'),
      });
    } else {
      setFields({ given: names.person(next.id, 'given'), family: names.person(next.id, 'family') });
    }
  };

  const save = () => {
    if (!target) return;
    mutate((s) => {
      if (target.kind === 'team') {
        s.world.overrides.teams[target.id] = {
          ...(fields['name'] ? { name: fields['name'].trim() } : {}),
          ...(fields['nickname'] ? { nickname: fields['nickname'].trim() } : {}),
          ...(fields['abbr'] ? { abbr: fields['abbr'].trim().toUpperCase().slice(0, 4) } : {}),
        };
      } else {
        s.world.overrides.people[target.id] = {
          ...(fields['given'] ? { given: fields['given'].trim() } : {}),
          ...(fields['family'] ? { family: fields['family'].trim() } : {}),
        };
      }
    });
    setTarget(null);
  };

  const reset = () => {
    if (!target) return;
    mutate((s) => {
      if (target.kind === 'team') delete s.world.overrides.teams[target.id];
      else delete s.world.overrides.people[target.id];
    });
    setTarget(null);
  };

  if (target) {
    const team = target.kind === 'team' ? state.world.teams[target.id] : undefined;
    const person = target.kind === 'person' ? state.world.people[target.id] : undefined;
    const original = team
      ? `${team.name} ${team.nickname} (${team.abbr})`
      : person
        ? `${person.given} ${person.family}`
        : '';
    const keys = target.kind === 'team' ? ['name', 'nickname', 'abbr'] : ['given', 'family'];
    return (
      <Screen testID="name-edit">
        <View style={{ gap: t.space.l, marginTop: t.space.l }}>
          <Text variant="footnote" color="inkSecondary">
            {tt('ui.names.original', { name: original })}
          </Text>
          {keys.map((k) => (
            <TextField
              key={k}
              testID={`name-${k}`}
              label={tt(`ui.names.${k}`)}
              value={fields[k] ?? ''}
              maxLength={k === 'abbr' ? 4 : 24}
              autoCapitalize={k === 'abbr' ? 'characters' : 'words'}
              onChangeText={(v) => {
                setFields({ ...fields, [k]: v });
              }}
            />
          ))}
          <Button testID="save-name" label={tt('ui.common.save')} onPress={save} />
          <Button variant="secondary" label={tt('ui.names.reset')} onPress={reset} />
          <Button
            variant="tertiary"
            label={tt('ui.common.cancel')}
            onPress={() => {
              setTarget(null);
            }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="names">
      <View style={{ marginTop: t.space.l }}>
        <TextField
          testID="name-search"
          label={tt('ui.names.search')}
          value={q}
          onChangeText={setQ}
          autoCorrect={false}
        />
      </View>
      {q.trim().length < 2 ? (
        <EmptyState title={tt('ui.names.pick')} />
      ) : results.teams.length + results.people.length === 0 ? (
        <EmptyState title={tt('ui.names.empty')} />
      ) : (
        <>
          {results.teams.length ? <SectionHeader title={tt('ui.names.teams')} /> : null}
          {results.teams.map((x) => (
            <ListRow
              key={x.id}
              title={names.team(x.id)}
              subtitle={names.team(x.id, 'nickname')}
              onPress={() => {
                open({ kind: 'team', id: x.id });
              }}
            />
          ))}
          {results.people.length ? <SectionHeader title={tt('ui.names.people')} /> : null}
          {results.people.map((p) => (
            <ListRow
              key={p.id}
              title={names.person(p.id)}
              subtitle={p.kind}
              onPress={() => {
                open({ kind: 'person', id: p.id });
              }}
            />
          ))}
        </>
      )}
    </Screen>
  );
}
