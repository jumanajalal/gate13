import { caseById } from './cases';
import type { CaseDef, EvEvent } from './types';

export const LIMIT = 180; // seconds
export const WRONG_PENALTY = 5;
export const HINT_PENALTY = 3;
export const EVIDENCE_POINTS = 10;
export const DECISION_POINTS = 20;
export const HARD_BONUS = 10;

export interface Result {
  win: boolean;
  evidence: number;
  decision: number;
  speed: number;
  hints: number;
  wrong: number;
  hardBonus: number;
  total: number;
}

export interface State {
  phase: 'home' | 'play' | 'result';
  caseId: string;
  hard: boolean;
  left: number;
  evidence: number;
  hints: number;
  wrong: number;
  opened: Record<string, true>;
  answers: Record<string, number>;
  events: Record<string, EvEvent>;
  picks: [string | null, string | null];
  msg: string;
  banner: string;
  movesApplied: number;
  result: Result | null;
}

export type Action =
  | { type: 'START'; caseId: string; hard: boolean }
  | { type: 'TICK' }
  | { type: 'INSPECT'; itemId: string }
  | { type: 'ANSWER'; bundleId: string; index: number }
  | { type: 'HINT' }
  | { type: 'PICK'; group: 0 | 1; value: string }
  | { type: 'SUBMIT' }
  | { type: 'HOME' };

export const initial: State = {
  phase: 'home',
  caseId: 'nila',
  hard: false,
  left: LIMIT,
  evidence: 0,
  hints: 0,
  wrong: 0,
  opened: {},
  answers: {},
  events: {},
  picks: [null, null],
  msg: '',
  banner: '',
  movesApplied: 0,
  result: null,
};

/** Correct answer for both decision groups at this moment (the passenger may have moved in hard mode). */
export function correctNow(s: State, c: CaseDef = caseById(s.caseId)): [string, string] {
  const base: [string, string] = [...c.decision.correct];
  if (s.hard) {
    const elapsed = LIMIT - s.left;
    for (const m of c.moves ?? []) if (elapsed >= m.atElapsed) base[1] = m.loc;
  }
  return base;
}

export function liveScore(s: State): number {
  return Math.max(0, s.evidence - s.hints * HINT_PENALTY - s.wrong * WRONG_PENALTY);
}

export function computeResult(s: State, win: boolean): Result {
  const decision = win ? DECISION_POINTS : 0;
  const speed = win ? Math.floor(Math.max(0, s.left) / 15) : 0;
  const hardBonus = win && s.hard ? HARD_BONUS : 0;
  const hints = s.hints * HINT_PENALTY;
  const wrong = s.wrong * WRONG_PENALTY;
  const total = Math.max(0, s.evidence + decision + speed + hardBonus - hints - wrong);
  return { win, evidence: s.evidence, decision, speed, hints, wrong, hardBonus, total };
}

function finish(s: State, win: boolean): State {
  return { ...s, phase: 'result', result: computeResult(s, win) };
}

export function bundleDone(s: State, c: CaseDef, bundleId: string): boolean {
  const b = c.bundles.find((x) => x.id === bundleId);
  return !!b && b.items.every((i) => s.opened[i.id]);
}

/** Conflict notes whose two events are both on the timeline. Deterministic: no AI judges truth. */
export function detectConflicts(events: Record<string, EvEvent>, c: CaseDef): string[] {
  return c.conflicts.filter((x) => events[x.a] && events[x.b]).map((x) => x.note);
}

/** Map pin: shown once the movement bundle is answered correctly, and follows the passenger in hard mode. */
export function pinNode(s: State, c: CaseDef): string | null {
  const mb = c.bundles.find((b) => b.showMap);
  if (!mb || s.answers[mb.id] !== mb.question.answer) return null;
  return correctNow(s, c)[1];
}

export function reducer(s: State, a: Action): State {
  const c = caseById(s.caseId);
  switch (a.type) {
    case 'START':
      return { ...initial, phase: 'play', caseId: a.caseId, hard: a.hard };
    case 'HOME':
      return { ...initial };
    case 'TICK': {
      if (s.phase !== 'play') return s;
      let next: State = { ...s, left: s.left - 1 };
      const elapsed = LIMIT - next.left;
      if (next.hard) {
        const moves = c.moves ?? [];
        while (next.movesApplied < moves.length && elapsed >= moves[next.movesApplied].atElapsed) {
          next = { ...next, banner: moves[next.movesApplied].text, movesApplied: next.movesApplied + 1 };
        }
      }
      return next.left <= 0 ? finish(next, false) : next;
    }
    case 'INSPECT': {
      if (s.phase !== 'play' || s.opened[a.itemId]) return s;
      const item = c.bundles.flatMap((b) => b.items).find((i) => i.id === a.itemId);
      if (!item) return s;
      const events = { ...s.events };
      for (const e of item.events ?? []) events[e.key] = e;
      return { ...s, opened: { ...s.opened, [a.itemId]: true }, events };
    }
    case 'ANSWER': {
      const b = c.bundles.find((x) => x.id === a.bundleId);
      if (s.phase !== 'play' || !b || s.answers[b.id] !== undefined || !bundleDone(s, c, b.id)) return s;
      const ok = a.index === b.question.answer;
      const events = { ...s.events };
      if (ok) for (const e of b.onCorrect ?? []) events[e.key] = e;
      return {
        ...s,
        answers: { ...s.answers, [b.id]: a.index },
        evidence: s.evidence + (ok ? EVIDENCE_POINTS : 0),
        events,
      };
    }
    case 'HINT':
      return s.phase === 'play' && s.hints < 2 ? { ...s, hints: s.hints + 1 } : s;
    case 'PICK': {
      const picks: [string | null, string | null] = [...s.picks];
      picks[a.group] = a.value;
      return { ...s, picks };
    }
    case 'SUBMIT': {
      if (s.phase !== 'play' || !s.picks[0] || !s.picks[1]) return s;
      const want = correctNow(s, c);
      if (s.picks[0] === want[0] && s.picks[1] === want[1]) return finish(s, true);
      const msg = c.decision.messages.first[s.picks[0]] ?? c.decision.messages.fallback;
      const msgFinal = s.picks[0] !== want[0] ? msg : c.decision.messages.fallback;
      return { ...s, wrong: s.wrong + 1, msg: msgFinal, picks: [null, null] };
    }
    default:
      return s;
  }
}
