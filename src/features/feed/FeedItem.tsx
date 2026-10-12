import { router } from 'expo-router';
import { PlayIcon as Play } from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { replySocial } from '@/engine/career/social';
import type { FeedEntry, SocialPost } from '@/engine/model/career';
import { mutate, useGame } from '@/state/game';
import { Avatar } from '@/ui/components/Avatar';
import { AnimatedNumber } from '@/ui/components/AnimatedNumber';
import { Button } from '@/ui/components/Button';
import { StatLine, Scorebug } from '@/ui/components/Stats';
import { Text } from '@/ui/components/Text';
import { useT } from '@/ui/i18n';
import { useTheme } from '@/ui/theme/theme';

const num = (v: number | string | undefined) => (typeof v === 'number' ? v : Number(v ?? 0));

function Kicker({
  children,
  tone = 'inkSecondary',
}: {
  readonly children: string;
  readonly tone?: 'inkSecondary' | 'accentText' | 'negative' | 'positive' | 'brandText';
}) {
  return (
    <Text variant="label" color={tone}>
      {children}
    </Text>
  );
}

function GameItem({ f }: { readonly f: FeedEntry }) {
  const t = useTheme();
  const { t: tt, m, names } = useT();
  const state = useGame((g) => g.state);
  const d = f.data ?? {};
  const params = f.message.params ?? {};
  const teamParam = params['team'];
  const oppParam = params['opponent'];
  const teamId = typeof teamParam === 'object' && 'team' in teamParam ? teamParam.team : '';
  const oppId = typeof oppParam === 'object' && 'team' in oppParam ? oppParam.team : '';
  const us = num(d['us']);
  const them = num(d['them']);
  const game = f.gameId ? state?.world.games[f.gameId] : undefined;
  const userHome = game ? game.home === teamId : true;
  const venue = game?.neutral
    ? tt('ui.feed.neutral')
    : userHome
      ? tt('ui.feed.home')
      : tt('ui.feed.away');
  const ot = num(d['overtimes']);
  const kicker = [
    tt('ui.feed.final'),
    ot ? (ot === 1 ? tt('ui.feed.overtime') : tt('ui.feed.overtimes', { n: ot })) : null,
    venue,
  ]
    .filter(Boolean)
    .join(' · ');
  const teamA = state?.world.teams[teamId];
  const teamB = state?.world.teams[oppId];
  const mine = {
    name: names.team(teamId, 'name') || names.team(teamId),
    abbr: names.team(teamId, 'abbr'),
    score: us,
    colour: teamA?.colours.primary ?? t.c.ink,
    won: us > them,
  };
  const theirs = {
    name: names.team(oppId, 'name') || names.team(oppId),
    abbr: names.team(oppId, 'abbr'),
    score: them,
    colour: teamB?.colours.primary ?? t.c.inkTertiary,
    won: them > us,
  };
  const hasMoment = state?.career.feed.some((x) => x.kind === 'moment' && x.gameId === f.gameId);
  const min = num(d['min']);
  return (
    <View style={{ gap: t.space.s }}>
      <Scorebug kicker={kicker} home={userHome ? mine : theirs} away={userHome ? theirs : mine} />
      <Text variant="displayM" style={{ marginTop: 4 }}>
        {m(f.message)}
      </Text>
      {min > 0 ? (
        <StatLine
          items={[
            { value: num(d['pts']), label: 'PTS', spoken: `${num(d['pts'])} points` },
            { value: num(d['reb']), label: 'REB', spoken: `${num(d['reb'])} rebounds` },
            { value: num(d['ast']), label: 'AST', spoken: `${num(d['ast'])} assists` },
            {
              value: `${num(d['fgm'])}-${num(d['fga'])}`,
              label: 'FG',
              spoken: `${num(d['fgm'])} of ${num(d['fga'])} shooting`,
            },
            {
              value: `${num(d['pm']) > 0 ? '+' : ''}${num(d['pm'])}`,
              label: '',
              spoken: `plus-minus ${num(d['pm'])}`,
            },
          ]}
        />
      ) : (
        <Text variant="footnote" color="inkSecondary">
          {tt('ui.feed.didNotPlay')}
        </Text>
      )}
      {f.gameId ? (
        <View style={styles.actions}>
          {hasMoment ? (
            <Button
              variant="tertiary"
              size="compact"
              icon={Play}
              label={tt('ui.home.replay')}
              onPress={() => {
                const moment = state?.career.feed.find(
                  (x) => x.kind === 'moment' && x.gameId === f.gameId,
                );
                if (moment)
                  router.push({ pathname: '/clip/[feedId]', params: { feedId: moment.id } });
              }}
            />
          ) : null}
          <Button
            variant="tertiary"
            size="compact"
            label={tt('ui.home.boxScore')}
            onPress={() => {
              router.push({ pathname: '/game/[gameId]', params: { gameId: f.gameId ?? '' } });
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

function MomentItem({ f }: { readonly f: FeedEntry }) {
  const t = useTheme();
  const { t: tt, m } = useT();
  const success = num(f.data?.['success']) === 1;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={tt('ui.home.replay')}
      onPress={() => {
        router.push({ pathname: '/clip/[feedId]', params: { feedId: f.id } });
      }}
      style={({ pressed }) => [styles.momentRow, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View
        style={[
          styles.play,
          { backgroundColor: success ? t.c.accent : t.c.sunken, borderRadius: t.radii.full },
        ]}
      >
        <Play size={14} color={success ? t.c.onAccent : t.c.ink} weight="fill" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Kicker tone={success ? 'accentText' : 'inkSecondary'}>
          {tt('ui.feed.kicker.moment')}
        </Kicker>
        <Text variant="callout">{m(f.message)}</Text>
      </View>
    </Pressable>
  );
}

function Changes({ data }: { readonly data: Readonly<Record<string, number | string>> }) {
  const t = useTheme();
  const { t: tt } = useT();
  const items = Object.entries(data)
    .filter(
      ([k, v]) =>
        typeof v === 'number' &&
        Math.abs(v) >= 0.05 &&
        (k.startsWith('status:') || k.startsWith('skill:')),
    )
    .map(([k, v]) => {
      const [kind, key] = k.split(':') as [string, string];
      const label = kind === 'skill' ? tt(`skills.${key}`) : tt(`ui.feed.changes.${key}`);
      const n = v as number;
      const format = (x: number) => {
        const sign = x > 0 ? '+' : x < 0 ? '−' : '';
        const abs = Math.abs(x);
        const body =
          key === 'gpa'
            ? abs.toFixed(2)
            : key === 'money'
              ? `$${Math.round(abs)}`
              : String(Math.round(abs * 10) / 10);
        return `${sign}${body}`;
      };
      return { label, n, format, good: n > 0 };
    });
  if (!items.length) return null;
  return (
    <View style={styles.changes}>
      {items.map((i) => (
        <View
          key={i.label}
          style={[styles.change, { backgroundColor: t.c.sunken, borderRadius: t.radii.sm }]}
        >
          <Text variant="footnote" color="inkSecondary">
            {i.label}
          </Text>
          <AnimatedNumber
            value={i.n}
            from={0}
            format={i.format}
            variant="subhead"
            style={{ color: i.good ? t.c.positive : t.c.negative }}
          />
        </View>
      ))}
    </View>
  );
}

function EventItem({ f }: { readonly f: FeedEntry }) {
  const t = useTheme();
  const { t: tt, m } = useT();
  return (
    <View
      style={[
        styles.decision,
        { backgroundColor: t.c.surface, borderLeftColor: t.c.accent, borderRadius: t.radii.md },
      ]}
    >
      <Kicker tone="accentText">{tt('ui.feed.kicker.event')}</Kicker>
      <Text variant="callout">{m(f.message)}</Text>
      {f.data ? <Changes data={f.data} /> : null}
    </View>
  );
}

const REPLY_TONES = ['gracious', 'funny', 'sharp'] as const;

export function SocialItem({
  f,
  compact = false,
}: {
  readonly f: FeedEntry;
  readonly compact?: boolean;
}) {
  const { t: tt, m } = useT();
  const post = f.social as SocialPost;
  const reply = (tone: 'gracious' | 'funny' | 'sharp' | 'ignored') => {
    mutate((s, index) => {
      replySocial(s, index, f.id, tone);
    });
  };
  return (
    <View style={styles.social}>
      <Avatar name={post.authorName} size={36} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="footnote" color="inkSecondary" numberOfLines={1}>
          <Text variant="subhead">{post.authorName}</Text>
          {`  @${post.handle}`}
        </Text>
        <Text variant="callout">{m(f.message)}</Text>
        <Text variant="footnote" color="inkTertiary">
          {tt('ui.feed.likes', { n: post.likes })}
        </Text>
        {post.reply ? (
          <Text variant="footnote" color="inkSecondary">
            {tt(`ui.feed.replied.${post.reply}`)}
          </Text>
        ) : post.replies.length && !compact ? (
          <View style={[styles.actions, { flexWrap: 'wrap' }]}>
            {REPLY_TONES.filter((r) => post.replies.includes(r)).map((r) => (
              <Button
                key={r}
                variant="secondary"
                size="compact"
                label={tt(`ui.feed.reply.${r}`)}
                onPress={() => {
                  reply(r);
                }}
              />
            ))}
            <Button
              variant="tertiary"
              size="compact"
              label={tt('ui.feed.reply.ignored')}
              onPress={() => {
                reply('ignored');
              }}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function DevelopmentItem({ f }: { readonly f: FeedEntry }) {
  const { t: tt } = useT();
  const raw = f.message.params?.['skill'];
  const skill = typeof raw === 'string' ? raw : '';
  const from = f.data?.['from'];
  const to = f.data?.['to'];
  return (
    <View
      style={styles.dev}
      accessible
      accessibilityLabel={`${tt(`skills.${skill}`)} up from ${String(from)} to ${String(to)}`}
    >
      <Kicker>{tt('ui.feed.kicker.development')}</Kicker>
      <Text variant="callout" style={{ flex: 1 }}>
        {tt(`skills.${skill}`)}
      </Text>
      <Text variant="footnote" color="inkTertiary" tabular>
        {`${String(from)} → `}
      </Text>
      <Text variant="stat" style={{ fontSize: 19, lineHeight: 22 }}>
        {String(to)}
      </Text>
    </View>
  );
}

function TextItem({ f }: { readonly f: FeedEntry }) {
  const t = useTheme();
  const { t: tt, m } = useT();
  const tone =
    f.kind === 'injury'
      ? 'negative'
      : f.kind === 'milestone' || f.kind === 'draft'
        ? 'accentText'
        : 'inkSecondary';
  const strong = f.kind === 'milestone' || f.kind === 'draft' || f.kind === 'injury';
  return (
    <View
      style={[
        { gap: 4 },
        strong && {
          borderLeftWidth: 3,
          borderLeftColor: f.kind === 'injury' ? t.c.negative : t.c.accent,
          paddingLeft: t.space.m,
        },
      ]}
    >
      <Kicker tone={tone}>{tt(`ui.feed.kicker.${f.kind}`)}</Kicker>
      <Text variant={strong ? 'bodyStrong' : 'callout'}>{m(f.message)}</Text>
    </View>
  );
}

export function FeedItem({ f }: { readonly f: FeedEntry }) {
  switch (f.kind) {
    case 'game':
      return <GameItem f={f} />;
    case 'moment':
      return <MomentItem f={f} />;
    case 'event':
      return <EventItem f={f} />;
    case 'social':
      return f.social ? <SocialItem f={f} /> : <TextItem f={f} />;
    case 'development':
      return f.data ? <DevelopmentItem f={f} /> : <TextItem f={f} />;
    default:
      return <TextItem f={f} />;
  }
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  momentRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  play: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  decision: { padding: 14, gap: 6, borderLeftWidth: 3 },
  changes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  change: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'baseline',
  },
  social: { flexDirection: 'row', gap: 12 },
  dev: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
});
