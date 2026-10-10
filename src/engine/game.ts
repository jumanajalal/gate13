import { caseById } from './cases';
import type { CaseDef, EvEvent, Obj, Row } from './types';

export const LIMIT = 180; // seconds
export const WRONG_PENALTY = 5;
export const HINT_PENALTY = 3;
export const EVIDENCE_POINTS = 10; // per ledger row accepted on the first filing
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
  phase: 'home' | 'intro' | 'play' | 'result';
  caseId: string;
  hard: boolean;
  left: number;
  evidence: number;
  hints: number;
  wrong: number;
  opened: Record<string, true>;
  unlocked: Record<string, true>;
  lockFails: Record<string, number>;
  asked: Record<string, true>;
  events: Record<string, EvEvent>;
  ledger: Record<string, string>;
  ledgerOk: Record<string, true>;
  ledgerFailed: Record<string, true>;
  ledgerMsg: string;
  picks: [string | null, string | null];
  msg: string;
  banner: string;
  movesApplied: number;
  result: Result | null;
  outcome: 'win' | 'timeout' | 'cleared' | null;
  mapOverlay: boolean;
}

export type Action =
  | { type: 'START'; caseId: string; hard: boolean }
  | { type: 'BEGIN' }
  | { type: 'TICK' }
  | { type: 'OPEN'; objId: string }
  | { type: 'UNLOCK'; objId: string; code: string }
  | { type: 'ASK'; objId: string; qi: number }
  | { type: 'SET_ROW'; rowId: string; value: string }
  | { type: 'FILE_LEDGER' }
  | { type: 'HINT' }
  | { type: 'PICK'; group: 0 | 1; value: string }
  | { type: 'SUBMIT' }
  | { type: 'HOME' }
  | { type: 'REOPEN' };

export const initial: State = {
  phase: 'home',
  caseId: 'nila',
  hard: false,
  left: LIMIT,
  evidence: 0,
  hints: 0,
  wrong: 0,
  opened: {},
  unlocked: {},
  lockFails: {},
  asked: {},
  events: {},
  ledger: {},
  ledgerOk: {},
  ledgerFailed: {},
  ledgerMsg: '',
  picks: [null, null],
  msg: '',
  banner: '',
  movesApplied: 0,
  result: null,
  outcome: null,
  mapOverlay: false,
};

export const normCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** "2255", "22.55", "22:55" and "2:55" (as 02:55) all normalise to HH:MM. */
export function normTime(v: string): string {
  const digits = v.replace(/\D/g, '');
  if (digits.length < 3 || digits.length > 4) return '';
  const d = digits.padStart(4, '0');
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

export function rowCorrect(r: Row, value: string | undefined): boolean {
  if (!value) return false;
  return r.kind === 'time' ? normTime(value) === r.answer : value === r.answer;
}

export function lockOk(o: Obj, code: string): boolean {
  return !!o.lock && o.lock.answers.some((a) => normCode(a) === normCode(code));
}

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

function finish(s: State, win: boolean, outcome: State['outcome'] = win ? 'win' : 'timeout'): State {
  return { ...s, phase: 'result', outcome, result: computeResult(s, win) };
}

export const evidenceCount = (s: State): number => Object.keys(s.events).length;

/** Conflict notes whose two events are both on the wall. Deterministic: no AI judges truth. */
export function detectConflicts(events: Record<string, EvEvent>, c: CaseDef): string[] {
  return c.conflicts.filter((x) => events[x.a] && events[x.b]).map((x) => x.note);
}

export const radioUnlocked = (s: State, c: CaseDef) => c.ledger.every((r) => s.ledgerOk[r.id]);

/** Hard mode only: the last place a staff update reported the passenger. */
export function pinNode(s: State, c: CaseDef): string | null {
  if (!s.hard || s.movesApplied === 0) return null;
  return (c.moves ?? [])[s.movesApplied - 1]?.loc ?? null;
}

export function askedFor(s: State, objId: string): number[] {
  return Object.keys(s.asked)
    .filter((k) => k.startsWith(objId + ':'))
    .map((k) => Number(k.split(':')[1]));
}

function withEvents(events: Record<string, EvEvent>, list?: EvEvent[]) {
  const out = { ...events };
  for (const e of list ?? []) out[e.key] = e;
  return out;
}

export function reducer(s: State, a: Action): State {
  const c = caseById(s.caseId);
  switch (a.type) {
    case 'START':
      return { ...initial, phase: 'intro', caseId: a.caseId, hard: a.hard };
    case 'BEGIN':
      return s.phase === 'intro' ? { ...s, phase: 'play' } : s;
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
      return next.left <= 0 ? finish(next, false, 'timeout') : next;
    }
    case 'OPEN': {
      const o = c.objects.find((x) => x.id === a.objId);
      if (s.phase !== 'play' || !o) return s;
      const locked = !!o.lock && !s.unlocked[o.id];
      const mapOverlay = s.mapOverlay ||
        (a.objId === 'map' && !!s.opened['notice']) ||
        (a.objId === 'notice' && !!s.opened['map']);
      return {
        ...s,
        opened: { ...s.opened, [o.id]: true },
        mapOverlay,
        events: locked ? s.events : withEvents(s.events, o.events),
      };
    }
    case 'UNLOCK': {
      const o = c.objects.find((x) => x.id === a.objId);
      if (s.phase !== 'play' || !o?.lock || s.unlocked[o.id]) return s;
      if (!lockOk(o, a.code)) return { ...s, lockFails: { ...s.lockFails, [o.id]: (s.lockFails[o.id] ?? 0) + 1 } };
      return {
        ...s,
        unlocked: { ...s.unlocked, [o.id]: true },
        opened: { ...s.opened, [o.id]: true },
        events: withEvents(s.events, o.events),
      };
    }
    case 'ASK': {
      const o = c.objects.find((x) => x.id === a.objId);
      const qa = o?.talk?.qa[a.qi];
      const key = `${a.objId}:${a.qi}`;
      if (s.phase !== 'play' || !o || !qa || s.asked[key]) return s;
      return {
        ...s,
        asked: { ...s.asked, [key]: true },
        opened: { ...s.opened, [o.id]: true },
        events: withEvents(s.events, qa.events),
      };
    }
    case 'SET_ROW':
      return s.ledgerOk[a.rowId] ? s : { ...s, ledger: { ...s.ledger, [a.rowId]: a.value } };
    case 'FILE_LEDGER': {
      if (s.phase !== 'play') return s;
      const rows = c.ledger;
      if (rows.some((r) => !s.ledgerOk[r.id] && !(s.ledger[r.id] ?? '').trim())) {
        return { ...s, ledgerMsg: 'Fill in every row before filing.' };
      }
      let evidence = s.evidence;
      let events = s.events;
      const ok = { ...s.ledgerOk };
      const failed = { ...s.ledgerFailed };
      const bad: string[] = [];
      for (const r of rows) {
        if (ok[r.id]) continue;
        if (rowCorrect(r, s.ledger[r.id])) {
          ok[r.id] = true;
          if (!failed[r.id]) evidence += EVIDENCE_POINTS;
          events = withEvents(events, r.onOk);
        } else {
          failed[r.id] = true;
          bad.push(r.label);
        }
      }
      const all = rows.every((r) => ok[r.id]);
      return {
        ...s,
        evidence,
        events,
        ledgerOk: ok,
        ledgerFailed: failed,
        ledgerMsg: all ? 'Ledger accepted. The radio is unlocked.' : `Operations rejected: ${bad.join('; ')}. Recheck the records.`,
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
      if (s.phase !== 'play' || !radioUnlocked(s, c) || !s.picks[0] || !s.picks[1]) return s;
      if (s.picks[0] === 'clear') {
        return finish({ ...s, msg: c.decision.messages.first['clear'] ?? c.decision.messages.fallback }, false, 'cleared');
      }
      const want = correctNow(s, c);
      if (s.picks[0] === want[0] && s.picks[1] === want[1]) return finish(s, true, 'win');
      const msg = s.picks[0] !== want[0] ? c.decision.messages.first[s.picks[0]] ?? c.decision.messages.fallback : c.decision.messages.fallback;
      return { ...s, wrong: s.wrong + 1, msg, picks: [null, null] };
    }
    case 'REOPEN':
      if (s.phase !== 'result' || (s.outcome !== 'cleared' && s.outcome !== 'timeout')) return s;
      return { ...s, phase: 'play', result: null, outcome: null, wrong: s.wrong + 1,
               picks: [null, null], msg: 'Incident reopened. Passenger status remains unresolved.' };
    default:
      return s;
  }
}
