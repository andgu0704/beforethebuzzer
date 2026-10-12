import { router } from 'expo-router';
import { ArrowLeftIcon as ArrowLeft, ShuffleIcon as Shuffle } from 'phosphor-react-native';
import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { content } from '@/content';
import type { Portrait } from '@/engine/model/person';
import { PLAY_STYLES, POSITION_HEIGHT, POSITIONS } from '@/engine/model/skills';
import { PORTRAIT_PARTS } from '@/engine/world/portrait';
import { newCareer, useGame } from '@/state/game';
import { Avatar } from '@/ui/components/Avatar';
import { Button, IconButton } from '@/ui/components/Button';
import { Stepper } from '@/ui/components/Controls';
import { ChipRow, OptionRow, TextField } from '@/ui/components/Field';
import { Rule } from '@/ui/components/Layout';
import { Flag } from '@/ui/components/Marks';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

import {
  defaultDraft,
  FLAWS,
  formatHeight,
  GIFTS,
  randomPortrait,
  STYLE_FOR,
  toInput,
  validate,
  type CreationDraft,
} from './draft';

const STEPS = ['who', 'body', 'game', 'look', 'traits', 'review'] as const;
type Step = (typeof STEPS)[number];

function PlayerCard({ d }: { readonly d: CreationDraft }) {
  const t = useTheme();
  const { t: tt } = useT();
  const name = [d.given.trim(), d.family.trim()].filter(Boolean).join(' ') || '—';
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.c.surface, borderRadius: t.radii.md, borderColor: t.c.hairline },
      ]}
    >
      <Avatar
        name={name}
        portrait={d.portrait}
        size={64}
        primary={t.c.brand}
        jersey={Number(d.jersey) || 0}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="displayS" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="footnote" color="inkSecondary" numberOfLines={1}>
          {`#${d.jersey || '—'} · ${tt(`ui.positions.${d.position}`)} · ${tt(`ui.styles.${d.style}.name`)}`}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Flag code={d.nation} size={12} />
          <Text variant="footnote" color="inkSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>
            {`${d.hometown} · ${formatHeight(d.heightCm)}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function CreateScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tt } = useT();
  const [d, setD] = useState<CreationDraft>(defaultDraft);
  const [step, setStep] = useState<Step>('who');
  const [touched, setTouched] = useState(false);
  const [nationOpen, setNationOpen] = useState(false);
  const familyField = useRef<TextInput>(null);
  const busy = useGame((g) => g.busy);
  const engineError = useGame((g) => g.error);
  const errors = validate(d);
  const i = STEPS.indexOf(step);
  const patch = (p: Partial<CreationDraft>) => {
    setD((prev) => ({ ...prev, ...p }));
  };

  const nations = useMemo(
    () =>
      [...content.nations].sort((a, b) =>
        tt(`nations.${a.code}`).localeCompare(tt(`nations.${b.code}`)),
      ),
    [tt],
  );
  const nation = content.nations.find((n) => n.code === d.nation);

  const stepValid =
    step === 'who' ? !errors.given && !errors.family : step === 'game' ? !errors.jersey : true;

  const next = async () => {
    setTouched(true);
    if (!stepValid) return;
    setTouched(false);
    if (step === 'review') {
      await newCareer(toInput(d));
      if (!useGame.getState().error) router.replace('/home');
      return;
    }
    setStep(STEPS[i + 1] ?? 'review');
  };

  const randomiseAll = () => {
    const base = defaultDraft();
    const n = content.nations[Math.floor(Math.random() * content.nations.length)];
    patch({
      ...base,
      given: d.given,
      family: d.family,
      nation: n?.code ?? base.nation,
      hometown: n?.cities[Math.floor(Math.random() * (n.cities.length || 1))] ?? base.hometown,
      gift: GIFTS[Math.floor(Math.random() * GIFTS.length)]?.id ?? base.gift,
      flaw: FLAWS[Math.floor(Math.random() * FLAWS.length)]?.id ?? base.flaw,
    });
  };

  if (busy?.kind === 'create')
    return (
      <View style={[styles.center, { backgroundColor: t.c.canvas }]} testID="creating">
        <View style={[styles.pulse, { backgroundColor: t.c.brand }]} />
        <Text variant="displayM" align="center">
          {tt('ui.create.starting').toUpperCase()}
        </Text>
        <Text variant="callout" color="inkSecondary" align="center" style={{ maxWidth: 300 }}>
          {tt('ui.create.startingBody')}
        </Text>
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.c.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{ paddingTop: insets.top + t.space.s, paddingHorizontal: t.gutter, gap: t.space.m }}
      >
        <View style={styles.header}>
          <IconButton
            testID="create-back"
            icon={ArrowLeft}
            variant="plain"
            label={tt('ui.common.back')}
            onPress={() => {
              if (i === 0) router.back();
              else setStep(STEPS[i - 1] ?? 'who');
            }}
          />
          <View style={{ flex: 1 }}>
            <Text variant="label" color="brandText">
              {tt('ui.create.stepOf', { n: i + 1, total: STEPS.length })}
            </Text>
            <Text variant="displayM">{tt(`ui.create.steps.${step}`).toUpperCase()}</Text>
          </View>
          <IconButton
            testID="create-randomise"
            icon={Shuffle}
            variant="plain"
            label={tt('ui.common.randomise')}
            onPress={() => {
              if (step === 'look') patch({ portrait: randomPortrait() });
              else randomiseAll();
            }}
          />
        </View>
        <View style={styles.progress}>
          {STEPS.map((s, k) => (
            <View
              key={s}
              style={[styles.progressCell, { backgroundColor: k <= i ? t.c.brand : t.c.sunken }]}
            />
          ))}
        </View>
        <PlayerCard d={d} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: t.gutter, gap: t.space.l, paddingBottom: t.space.x5 }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'who' ? (
          <>
            <TextField
              testID="given"
              label={tt('ui.create.given')}
              value={d.given}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="givenName"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => familyField.current?.focus()}
              onChangeText={(given) => {
                patch({ given });
              }}
              error={touched && errors.given ? tt(errors.given) : undefined}
            />
            <TextField
              ref={familyField}
              testID="family"
              label={tt('ui.create.family')}
              value={d.family}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="familyName"
              returnKeyType="done"
              onChangeText={(family) => {
                patch({ family });
              }}
              error={touched && errors.family ? tt(errors.family) : undefined}
            />
            <View style={{ gap: 6 }}>
              <Text variant="label" color="inkSecondary">
                {tt('ui.create.nation')}
              </Text>
              <OptionRow
                testID="nation-toggle"
                title={tt(`nations.${d.nation}`)}
                selected={false}
                leading={<Flag code={d.nation} size={14} showCode={false} />}
                onPress={() => {
                  setNationOpen((o) => !o);
                }}
              />
              {nationOpen ? (
                <View style={{ gap: 6 }}>
                  {nations.map((n) => (
                    <OptionRow
                      key={n.code}
                      testID={`nation-${n.code}`}
                      title={tt(`nations.${n.code}`)}
                      selected={n.code === d.nation}
                      leading={<Flag code={n.code} size={14} showCode={false} />}
                      onPress={() => {
                        patch({ nation: n.code, hometown: n.cities[0] ?? '' });
                        setNationOpen(false);
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </View>
            <View style={{ gap: 6 }}>
              <Text variant="label" color="inkSecondary">
                {tt('ui.create.hometown')}
              </Text>
              <ChipRow
                testID="hometown"
                options={(nation?.cities ?? []).slice(0, 12).map((c) => ({ id: c, label: c }))}
                value={d.hometown}
                onChange={(hometown) => {
                  patch({ hometown });
                }}
              />
            </View>
          </>
        ) : null}

        {step === 'body' ? (
          <>
            <View style={{ gap: 6 }}>
              <Text variant="label" color="inkSecondary">
                {tt('ui.create.position')}
              </Text>
              <ChipRow
                testID="position"
                options={POSITIONS.map((p) => ({ id: p, label: p, a11y: tt(`ui.positions.${p}`) }))}
                value={d.position}
                onChange={(position) => {
                  patch({
                    position,
                    heightCm: POSITION_HEIGHT[position],
                    style: STYLE_FOR[position],
                  });
                }}
              />
              <Text variant="footnote" color="inkSecondary">
                {tt('ui.create.positionHint', {
                  position: tt(`ui.positions.${d.position}`).toLowerCase(),
                  height: formatHeight(POSITION_HEIGHT[d.position]),
                })}
              </Text>
            </View>
            <Stepper
              testID="height"
              label={tt('ui.create.height')}
              detail={formatHeight(d.heightCm)}
              value={d.heightCm}
              min={175}
              max={225}
              onChange={(heightCm) => {
                patch({ heightCm });
              }}
            />
          </>
        ) : null}

        {step === 'game' ? (
          <>
            <Text variant="label" color="inkSecondary">
              {tt('ui.create.style')}
            </Text>
            {PLAY_STYLES.map((s) => (
              <OptionRow
                key={s}
                testID={`style-${s}`}
                title={tt(`ui.styles.${s}.name`)}
                body={tt(`ui.styles.${s}.body`)}
                selected={d.style === s}
                onPress={() => {
                  patch({ style: s });
                }}
              />
            ))}
            <TextField
              testID="jersey"
              label={tt('ui.create.jersey')}
              value={d.jersey}
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(jersey) => {
                patch({ jersey: jersey.replace(/\D/g, '') });
              }}
              error={touched && errors.jersey ? tt(errors.jersey) : undefined}
            />
          </>
        ) : null}

        {step === 'look' ? (
          <>
            <View style={{ alignItems: 'center', paddingVertical: t.space.m }}>
              <Avatar
                name={`${d.given} ${d.family}`}
                portrait={d.portrait}
                size={168}
                primary={t.c.brand}
                jersey={Number(d.jersey) || 0}
                shape="card"
              />
            </View>
            {(Object.keys(PORTRAIT_PARTS) as (keyof Portrait)[]).map((part) => (
              <Stepper
                key={part}
                testID={`look-${part}`}
                label={tt(`ui.create.look.${part}`)}
                value={d.portrait[part] + 1}
                min={1}
                max={PORTRAIT_PARTS[part]}
                onChange={(v) => {
                  patch({ portrait: { ...d.portrait, [part]: v - 1 } });
                }}
              />
            ))}
          </>
        ) : null}

        {step === 'traits' ? (
          <>
            <Text variant="label" color="inkSecondary">
              {tt('ui.create.gift')}
            </Text>
            <Text variant="footnote" color="inkSecondary">
              {tt('ui.create.giftHint')}
            </Text>
            {GIFTS.map((g) => (
              <OptionRow
                key={g.id}
                testID={`gift-${g.id}`}
                title={tt(`traits.${g.id}.name`)}
                body={tt(`traits.${g.id}.description`)}
                selected={d.gift === g.id}
                onPress={() => {
                  patch({ gift: g.id });
                }}
              />
            ))}
            <Rule />
            <Text variant="label" color="inkSecondary">
              {tt('ui.create.flaw')}
            </Text>
            <Text variant="footnote" color="inkSecondary">
              {tt('ui.create.flawHint')}
            </Text>
            {FLAWS.map((f) => (
              <OptionRow
                key={f.id}
                testID={`flaw-${f.id}`}
                title={tt(`traits.${f.id}.name`)}
                body={tt(`traits.${f.id}.description`)}
                selected={d.flaw === f.id}
                onPress={() => {
                  patch({ flaw: f.id });
                }}
              />
            ))}
          </>
        ) : null}

        {step === 'review' ? (
          <View style={{ gap: t.space.m }}>
            <Text variant="body">{tt('ui.create.review')}</Text>
            <Rule />
            <Text variant="subhead">{`${tt('ui.create.gift')}: ${tt(`traits.${d.gift}.name`)}`}</Text>
            <Text variant="footnote" color="inkSecondary">
              {tt(`traits.${d.gift}.description`)}
            </Text>
            <Text variant="subhead">{`${tt('ui.create.flaw')}: ${tt(`traits.${d.flaw}.name`)}`}</Text>
            <Text variant="footnote" color="inkSecondary">
              {tt(`traits.${d.flaw}.description`)}
            </Text>
            {engineError?.kind === 'engine' ? (
              <Text variant="footnote" color="negative">
                {engineError.message}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: t.gutter,
          paddingBottom: insets.bottom + t.space.m,
          paddingTop: t.space.s,
        }}
      >
        <Button
          testID="create-next"
          label={step === 'review' ? tt('ui.create.start') : tt('ui.common.next')}
          onPress={() => void next()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progress: { flexDirection: 'row', gap: 4 },
  progressCell: { flex: 1, height: 3, borderRadius: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  pulse: { width: 40, height: 6, borderRadius: 1 },
});
