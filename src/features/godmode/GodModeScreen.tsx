import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { content } from '@/content';
import {
  forceCallUp,
  forceNextGame,
  forceNextMoment,
  heal,
  injure,
  jumpTo,
  revealHidden,
  setCeiling,
  setDraftingTeam,
  setDraftStock,
  setSkill,
  setStatus,
  triggerEvent,
  unlockGodMode,
  type HiddenValues,
} from '@/engine/career/godmode';
import { userOf } from '@/engine/career/state';
import { addWeeks } from '@/engine/core/calendar';
import { SKILLS } from '@/engine/model/skills';
import { kv } from '@/platform/storage';
import { mutate, useGame } from '@/state/game';
import { Button } from '@/ui/components/Button';
import { Stepper } from '@/ui/components/Controls';
import { ChipRow, TextField } from '@/ui/components/Field';
import { Banner, EmptyState, ListRow, Screen, SectionHeader } from '@/ui/components/Layout';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import { checkPasscode, MAX_ATTEMPTS, OPEN, recordAttempt, tick, type LockState } from './lock';

/** A string only this module contains; CI checks it is absent from release bundles. */
export const GOD_MODE_SENTINEL = 'GODMODE-SENTINEL-7f3a91';

const LOCK_KEY = 'godmode.lock.v1';

function readLock(): LockState {
  try {
    const raw = kv.get(LOCK_KEY);
    return raw ? { ...OPEN, ...(JSON.parse(raw) as Partial<LockState>) } : OPEN;
  } catch {
    return OPEN;
  }
}

function writeLock(s: LockState): void {
  kv.set(LOCK_KEY, JSON.stringify(s));
}

function Prompt({ onUnlock }: { readonly onUnlock: () => void }) {
  const t = useTheme();
  const { t: tt } = useT();
  const [code, setCode] = useState('');
  const [lock, setLock] = useState<LockState>(() => tick(readLock(), Date.now()));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lock.lockLeft <= 0) return;
    const id = setInterval(() => {
      setLock((l) => {
        const next = tick(l, Date.now());
        writeLock(next);
        return next;
      });
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [lock.lockLeft]);

  const submit = () => {
    const now = tick(lock, Date.now());
    if (now.lockLeft > 0) return;
    const ok = checkPasscode(code);
    const next = recordAttempt(now, ok);
    writeLock(next);
    setLock(next);
    setCode('');
    if (ok) onUnlock();
    else
      setError(
        next.lockLeft > 0 ? null : tt('ui.godmode.wrong', { n: MAX_ATTEMPTS - next.failures }),
      );
  };

  const mins = Math.floor(lock.lockLeft / 60000);
  const secs = Math.ceil((lock.lockLeft % 60000) / 1000);
  return (
    <View style={{ gap: t.space.l, marginTop: t.space.xl }}>
      <Text variant="displayM">{tt('ui.godmode.prompt')}</Text>
      {lock.lockLeft > 0 ? (
        <Banner
          tone="negative"
          title={tt('ui.godmode.locked', { time: `${mins}:${String(secs).padStart(2, '0')}` })}
        />
      ) : (
        <>
          <TextField
            testID="passcode"
            label={tt('ui.godmode.prompt')}
            value={code}
            onChangeText={(v) => {
              setCode(v.replace(/\D/g, '').slice(0, 6));
            }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            error={error ?? undefined}
          />
          <Button
            testID="unlock"
            label={tt('ui.godmode.unlock')}
            disabled={code.length !== 6}
            onPress={submit}
          />
        </>
      )}
    </View>
  );
}

function Panel() {
  const t = useTheme();
  const { t: tt, names } = useT();
  const state = useGame((g) => g.state);
  useGame((g) => g.rev);
  const [hidden, setHidden] = useState<HiddenValues | null>(null);
  const [eventId, setEventId] = useState('');
  const [busy, setBusy] = useState(false);
  if (!state) return null;
  const u = userOf(state);
  const c = state.career;
  const proTeams = Object.values(state.world.teams).filter((x) => x.kind === 'pro');
  const events = content.events
    .filter((e) => e.id.includes(eventId.trim().toLowerCase()))
    .slice(0, 8);
  return (
    <View>
      <Banner tone="caution" title={tt('ui.godmode.warning')} />
      <SectionHeader title={tt('ui.godmode.skills')} />
      {SKILLS.map((s) => (
        <Stepper
          key={s}
          label={tt(`skills.${s}`)}
          value={Math.round(u.skills[s])}
          min={1}
          max={99}
          onChange={(v) => {
            mutate((st) => {
              setSkill(st, s, v);
            });
          }}
        />
      ))}
      <SectionHeader title={tt('ui.godmode.ceilings')} />
      <Stepper
        label={tt('ui.godmode.ceilings')}
        value={Math.round(Math.max(...SKILLS.map((s) => u.ceiling[s])))}
        min={1}
        max={99}
        onChange={(v) => {
          mutate((st) => {
            setCeiling(st, 'all', v);
          });
        }}
      />
      <SectionHeader title={tt('ui.godmode.status')} />
      {(
        [
          ['energy', u.energy, 100, 1],
          ['health', u.health, 100, 1],
          ['confidence', u.confidence, 100, 1],
          ['coachTrust', c.coachTrust, 100, 1],
          ['reputation', c.reputation, 100, 1],
          ['money', c.money / 100, 1000, 100],
          ['gpa', c.gpa * 10, 40, 0.1],
        ] as const
      ).map(([key, value, max, scale]) => (
        <Stepper
          key={key}
          label={tt(`ui.feed.changes.${key}`)}
          value={Math.round(value)}
          detail={
            key === 'gpa'
              ? c.gpa.toFixed(2)
              : key === 'money'
                ? `$${Math.round(c.money)}`
                : undefined
          }
          max={max}
          onChange={(v) => {
            mutate((st, index) => {
              setStatus(st, index, key, v * scale);
            });
          }}
        />
      ))}
      <SectionHeader title={tt('ui.godmode.health')} />
      <View style={styles.buttons}>
        <Button
          size="compact"
          variant="secondary"
          label={tt('ui.godmode.heal')}
          onPress={() => {
            mutate((st) => {
              heal(st);
            });
          }}
        />
        {[2, 8].map((w) => (
          <Button
            key={w}
            size="compact"
            variant="secondary"
            label={tt('ui.godmode.injure', { weeks: w })}
            onPress={() => {
              mutate((st) => {
                injure(st, w > 4 ? 'hamstringStrain' : 'ankleSprain', w);
              });
            }}
          />
        ))}
      </View>
      <SectionHeader title={tt('ui.godmode.forcing')} />
      <View style={styles.buttons}>
        <Button
          size="compact"
          variant="secondary"
          label={tt('ui.godmode.momentWin')}
          onPress={() => {
            mutate((st) => {
              forceNextMoment(st, 'success');
            });
          }}
        />
        <Button
          size="compact"
          variant="secondary"
          label={tt('ui.godmode.momentLose')}
          onPress={() => {
            mutate((st) => {
              forceNextMoment(st, 'failure');
            });
          }}
        />
        <Button
          size="compact"
          variant="secondary"
          label={tt('ui.godmode.gameWin')}
          onPress={() => {
            mutate((st) => {
              forceNextGame(st, 'win');
            });
          }}
        />
        <Button
          size="compact"
          variant="secondary"
          label={tt('ui.godmode.gameLose')}
          onPress={() => {
            mutate((st) => {
              forceNextGame(st, 'loss');
            });
          }}
        />
        <Button
          size="compact"
          variant="secondary"
          label={tt('ui.godmode.callUp')}
          onPress={() => {
            mutate((st) => {
              forceCallUp(st);
            });
          }}
        />
      </View>
      <SectionHeader title={tt('ui.godmode.draft')} />
      <Stepper
        label={tt('ui.godmode.stock', { n: c.stock.toFixed(1) })}
        value={Math.round(c.stock)}
        min={-20}
        max={20}
        onChange={(v) => {
          mutate((st) => {
            setDraftStock(st, v);
          });
        }}
      />
      <Text variant="label" color="inkSecondary" style={{ marginVertical: t.space.s }}>
        {tt('ui.godmode.draftTeam')}
      </Text>
      <ChipRow
        options={[
          { id: '', label: tt('ui.godmode.none') },
          ...proTeams.map((x) => ({ id: x.id, label: x.abbr })),
        ]}
        value={c.godMode.draftTeam ?? ''}
        onChange={(id) => {
          mutate((st) => {
            setDraftingTeam(st, proTeams.find((x) => x.id === id)?.id ?? null);
          });
        }}
      />
      <SectionHeader title={tt('ui.godmode.events')} />
      <View style={{ marginTop: t.space.s }}>
        <TextField
          label={tt('ui.godmode.events')}
          value={eventId}
          onChangeText={setEventId}
          autoCapitalize="none"
        />
      </View>
      {events.map((e) => (
        <ListRow
          key={e.id}
          title={e.id}
          subtitle={e.category}
          onPress={() => {
            mutate((st, index) => {
              triggerEvent(st, index, e.id);
            });
          }}
        />
      ))}
      <SectionHeader title={tt('ui.godmode.jump')} />
      <View style={styles.buttons}>
        {[4, 12, 26].map((w) => (
          <Button
            key={w}
            size="compact"
            variant="secondary"
            loading={busy}
            label={tt('ui.godmode.jumpWeeks', { n: w })}
            onPress={() => {
              setBusy(true);
              setTimeout(() => {
                mutate((st, index) => {
                  jumpTo(st, index, addWeeks(st.world.date, w));
                });
                setBusy(false);
              }, 30);
            }}
          />
        ))}
      </View>
      <SectionHeader title={tt('ui.godmode.hidden')} />
      {hidden ? (
        <View style={{ gap: 4, marginTop: t.space.s }}>
          <Text variant="callout">
            {tt('ui.godmode.ceilingOverall', { n: hidden.ceilingOverall.toFixed(1) })}
          </Text>
          <Text variant="callout">
            {tt('ui.godmode.growth', { n: hidden.growthRate.toFixed(2) })}
          </Text>
          {SKILLS.map((s) => (
            <Text
              key={s}
              variant="footnote"
              color="inkSecondary"
            >{`${tt(`skills.${s}`)}: ${Math.round(u.skills[s])} / ${Math.round(hidden.ceiling[s])}`}</Text>
          ))}
          <Text variant="label" color="inkSecondary" style={{ marginTop: t.space.s }}>
            {tt('ui.godmode.flags')}
          </Text>
          <Text variant="footnote">{hidden.flags.join(', ') || '—'}</Text>
          <Text variant="label" color="inkSecondary" style={{ marginTop: t.space.s }}>
            {tt('ui.godmode.scheduled')}
          </Text>
          {hidden.scheduled.map((s, i) => (
            <Text
              key={i}
              variant="footnote"
            >{`${s.consequence} · ${Math.round(s.chance * 100)}%`}</Text>
          ))}
        </View>
      ) : (
        <Button
          variant="secondary"
          label={tt('ui.godmode.reveal')}
          onPress={() => {
            mutate((st) => {
              setHidden(revealHidden(st));
            });
          }}
        />
      )}
      <SectionHeader title={tt('ui.godmode.log')} />
      {state.meta.integrity.log
        .slice(-10)
        .reverse()
        .map((l, i) => (
          <Text
            key={i}
            variant="footnote"
            color="inkSecondary"
          >{`${l.date.year}-w${l.date.week} ${l.action}`}</Text>
        ))}
      <View style={{ gap: t.space.s, marginTop: t.space.xl }}>
        <Button
          variant="secondary"
          label={tt('ui.godmode.styleguide')}
          onPress={() => {
            router.push('/dev/styleguide');
          }}
        />
        <Button
          variant="secondary"
          label={tt('ui.godmode.portraitLab')}
          onPress={() => {
            router.push('/dev/portraits');
          }}
        />
      </View>
      <Text variant="footnote" color="inkTertiary" style={{ marginTop: t.space.l }}>
        {names.person(u.id)}
      </Text>
    </View>
  );
}

export function GodModeScreen() {
  const { t: tt } = useT();
  const state = useGame((g) => g.state);
  const unlocked = useGame((g) => g.state?.career.godMode.unlocked ?? false);
  if (!state) return <EmptyState title={tt('ui.godmode.noCareer')} />;
  return (
    <Screen testID="godmode">
      {unlocked ? (
        <Panel />
      ) : (
        <Prompt
          onUnlock={() => {
            mutate((st) => {
              unlockGodMode(st);
            });
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
