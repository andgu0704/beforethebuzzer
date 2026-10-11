import type { FeedId } from '../core/ids';
import { createRng, type Rng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import type { SocialAuthor, SocialTrigger } from '../content/story-types';
import type { FeedEntry, MessageParam } from '../model/career';
import { meets } from './conditions';
import { changeStatus } from './effects';
import { msg, pushFeed, userOf, userTeamId, type GameState } from './state';

const HANDLE_SUFFIXES = [
  'hoops',
  'buckets',
  'courtside',
  'onthewing',
  'fastbreak',
  'and1',
  'fullcourt',
  'baseline',
  'sixthman',
  'tipoff',
  'glass',
  'hardwood',
  'paint',
  'topofthekey',
  'cornerthree',
  'boxout',
  'shotclock',
  'halfcourt',
  'pickandpop',
  'lob',
] as const;

/** Display name and handle for a post's author. */
function author(
  state: GameState,
  index: ContentIndex,
  kind: SocialAuthor,
  rng: Rng,
): { name: string; handle: string } {
  const career = state.career;
  const ref = (id: string | null) => {
    const p = id ? state.world.people[id] : undefined;
    return p ? `${p.given} ${p.family}` : null;
  };
  if (kind === 'journalist') {
    const name = ref(career.journalistId);
    if (name) return { name, handle: name.toLowerCase().replace(/[^a-z]/g, '') };
  }
  if (kind === 'rival') {
    const name = ref(career.rivalId);
    if (name) return { name, handle: name.toLowerCase().replace(/[^a-z]/g, '') };
  }
  const nation =
    index.nation.get(kind === 'hometown' ? userOf(state).nation : 'USA') ??
    index.content.nations[0];
  const culture =
    index.culture.get(nation ? rng.weighted(nation.naming, (n) => n.weight).id : 'american') ??
    index.content.namingCultures[0];
  const given = culture ? rng.pick(culture.given) : 'Sam';
  const family = culture ? rng.pick(culture.family) : 'Lee';
  const suffix = rng.pick(HANDLE_SUFFIXES);
  const plain = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[^A-Za-z]/g, '')
      .toLowerCase();
  const handle = rng.chance(0.5)
    ? `${plain(given)}${suffix}`
    : `${plain(given)}_${plain(family).slice(0, 6)}${rng.int(1, 99)}`;
  return { name: `${given} ${family}`, handle };
}

export function postSocial(
  state: GameState,
  index: ContentIndex,
  templateId: string,
  rng: Rng,
): FeedEntry | null {
  const t = index.content.social.find((s) => s.id === templateId);
  if (!t) return null;
  const who = author(state, index, t.author, rng);
  const reputation = state.career.reputation;
  const likes = Math.round((20 + reputation * reputation * 4) * (0.4 + rng.next() * 1.6));
  const params: Record<string, MessageParam> = {
    player: { person: state.career.playerId },
    surname: { person: state.career.playerId, part: 'family' },
  };
  if (state.career.rivalId) params['rival'] = { person: state.career.rivalId, part: 'family' };
  const own = userTeamId(state);
  if (own) params['team'] = { team: own, part: 'nickname' };
  return pushFeed(state, 'social', msg(`social.${t.id}`, params), {
    social: {
      template: t.id,
      authorName: who.name,
      handle: who.handle,
      likes,
      replies: t.replies,
      reply: null,
    },
  });
}

/** Posts reacting to what just happened. At most `max` per trigger set. */
export function socialReactions(
  state: GameState,
  index: ContentIndex,
  triggers: readonly SocialTrigger[],
  seedLabel: string,
  max = 2,
): void {
  const rng = createRng(state.world.seed, 'social', seedLabel);
  let posted = 0;
  for (const trigger of triggers) {
    if (posted >= max) break;
    const options = index.content.social.filter(
      (s) => s.trigger === trigger && meets(state, index, s.when),
    );
    if (options.length === 0) continue;
    const t = rng.weighted(options, (s) => s.weight);
    if (postSocial(state, index, t.id, rng)) posted++;
  }
}

export type ReplyTone = 'gracious' | 'funny' | 'sharp' | 'ignored';

/** Answers (or deliberately ignores) a post. Effects depend on tone and who wrote it. */
export function replySocial(
  state: GameState,
  index: ContentIndex,
  feedId: FeedId,
  tone: ReplyTone,
): void {
  const entry = state.career.feed.find((f) => f.id === feedId);
  const post = entry?.social;
  if (!post || post.reply !== null) return;
  if (tone !== 'ignored' && !post.replies.includes(tone)) return;
  post.reply = tone;
  const t = index.content.social.find((s) => s.id === post.template);
  const rng = createRng(state.world.seed, 'reply', feedId);
  const career = state.career;
  if (tone === 'gracious') {
    changeStatus(state, index, 'reputation', 1);
    career.relations.fans = Math.min(100, career.relations.fans + 2);
  } else if (tone === 'funny') {
    const landed = rng.chance(0.6);
    changeStatus(state, index, 'reputation', landed ? 3 : 1);
    career.relations.fans = Math.min(100, career.relations.fans + (landed ? 4 : 1));
  } else if (tone === 'sharp') {
    const landed = rng.chance(0.5);
    changeStatus(state, index, 'reputation', landed ? 3 : -3);
    changeStatus(state, index, 'confidence', landed ? 3 : -1);
    if (!landed) {
      changeStatus(state, index, 'coachTrust', -2);
      changeStatus(state, index, 'chemistry', -1);
    }
    if (t?.author === 'journalist')
      career.relations.journalist = Math.max(0, career.relations.journalist - 8);
    if (t?.author === 'rival') career.relations.rival = Math.max(0, career.relations.rival - 6);
  }
}
