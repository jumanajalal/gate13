import { describe, expect, it } from 'vitest';
import { CASES, caseById } from './cases';
import {
  correctNow,
  detectConflicts,
  initial,
  LIMIT,
  liveScore,
  normCode,
  normTime,
  radioUnlocked,
  reducer,
  type State,
} from './game';
import type { CaseDef } from './types';

const begin = (caseId: string, hard = false): State =>
  reducer(reducer(initial, { type: 'START', caseId, hard }), { type: 'BEGIN' });

/** Play every object, crack every lock, ask every question. */
function investigate(s: State): State {
  const c = caseById(s.caseId);
  for (const o of c.objects) {
    s = reducer(s, { type: 'OPEN', objId: o.id });
    if (o.lock) s = reducer(s, { type: 'UNLOCK', objId: o.id, code: o.lock.answers[0] });
    (o.talk?.qa ?? []).forEach((_, qi) => {
      s = reducer(s, { type: 'ASK', objId: o.id, qi });
    });
  }
  return s;
}

function fileCorrectLedger(s: State): State {
  const c = caseById(s.caseId);
  for (const r of c.ledger) s = reducer(s, { type: 'SET_ROW', rowId: r.id, value: r.answer });
  return reducer(s, { type: 'FILE_LEDGER' });
}

function transmit(s: State, g0: string, g1: string): State {
  s = reducer(s, { type: 'PICK', group: 0, value: g0 });
  s = reducer(s, { type: 'PICK', group: 1, value: g1 });
  return reducer(s, { type: 'SUBMIT' });
}

const searchable = (c: CaseDef, skip: string) =>
  c.objects
    .filter((o) => o.id !== skip)
    .flatMap((o) => [...(o.fields ?? []).flat(), ...(o.lines ?? []), o.note ?? '', o.heading ?? ''])
    .map(normCode)
    .join('|');

describe('case data integrity', () => {
  for (const c of CASES) {
    it(`${c.id}: ids, answers, decisions and conflicts are consistent`, () => {
      const ids = c.objects.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(c.objects.length).toBeLessThanOrEqual(9);
      for (const r of c.ledger) if (r.kind === 'choice') expect(r.options).toContain(r.answer);
      c.decision.groups.forEach((g, i) => expect(g.options.map((o) => o.id)).toContain(c.decision.correct[i]));
      if (c.map) expect(c.map.nodes.map((n) => n.id)).toContain(c.decision.correct[1]);
      const keys = new Set([
        ...c.objects.flatMap((o) => [...(o.events ?? []), ...(o.talk?.qa ?? []).flatMap((q) => q.events ?? [])]),
        ...c.ledger.flatMap((r) => r.onOk ?? []),
      ].map((e) => e.key));
      for (const x of c.conflicts) {
        expect(keys.has(x.a)).toBe(true);
        expect(keys.has(x.b)).toBe(true);
      }
    });

    it(`${c.id}: every lock code can be found on another prop (the room is solvable)`, () => {
      for (const o of c.objects.filter((x) => x.lock)) {
        const hay = searchable(c, o.id);
        expect(o.lock!.answers.some((a) => hay.includes(normCode(a)))).toBe(true);
      }
    });
  }
});

describe('input normalisation', () => {
  it('codes and times are forgiving', () => {
    expect(normCode(' ma613-482915 ')).toBe('MA613482915');
    expect(normTime('22:55')).toBe('22:55');
    expect(normTime('2255')).toBe('22:55');
    expect(normTime('22.55')).toBe('22:55');
    expect(normTime('9:05')).toBe('09:05');
    expect(normTime('nope')).toBe('');
  });
});

describe('escape-room flow', () => {
  it('the clock does not run during the cold open', () => {
    let s = reducer(initial, { type: 'START', caseId: 'nila', hard: false });
    expect(s.phase).toBe('intro');
    s = reducer(s, { type: 'TICK' });
    expect(s.left).toBe(LIMIT);
    s = reducer(s, { type: 'BEGIN' });
    expect(s.phase).toBe('play');
  });

  it('locked terminals reveal nothing until the right code is entered', () => {
    let s = begin('nila');
    s = reducer(s, { type: 'OPEN', objId: 'scanlog' });
    expect(s.events.scan).toBeUndefined();
    s = reducer(s, { type: 'UNLOCK', objId: 'scanlog', code: '99Z' });
    expect(s.lockFails.scanlog).toBe(1);
    expect(s.events.scan).toBeUndefined();
    s = reducer(s, { type: 'UNLOCK', objId: 'scanlog', code: ' 22c ' });
    expect(s.unlocked.scanlog).toBe(true);
    expect(s.events.scan.status).toBe('confirmed');
    expect(s.events.onb.status).toBe('unconfirmed');
  });

  it('interrogating a witness pins their account, and contradictions are flagged', () => {
    const c = caseById('nila');
    let s = begin('nila');
    s = reducer(s, { type: 'ASK', objId: 'agent', qi: 0 });
    expect(detectConflicts(s.events, c)).toHaveLength(0);
    s = reducer(s, { type: 'ASK', objId: 'relative', qi: 0 });
    expect(detectConflicts(s.events, c)).toHaveLength(1);
  });

  it('a wrong ledger loses that row\'s points but never ends the run, and the radio stays locked', () => {
    const c = caseById('nila');
    let s = begin('nila');
    s = reducer(s, { type: 'SET_ROW', rowId: 'scan', value: 'Confirmed' });
    s = reducer(s, { type: 'SET_ROW', rowId: 'onboard', value: 'Confirmed' }); // wrong
    s = reducer(s, { type: 'SET_ROW', rowId: 'bag', value: 'Not confirmed' });
    s = reducer(s, { type: 'FILE_LEDGER' });
    expect(s.phase).toBe('play');
    expect(s.evidence).toBe(20);
    expect(radioUnlocked(s, c)).toBe(false);
    expect(s.ledgerMsg).toMatch(/Operations rejected/);
    s = reducer(s, { type: 'SET_ROW', rowId: 'onboard', value: 'Not confirmed' });
    s = reducer(s, { type: 'FILE_LEDGER' });
    expect(radioUnlocked(s, c)).toBe(true);
    expect(s.evidence).toBe(20); // the retried row earns nothing
  });

  it('the radio cannot transmit until the ledger is accepted', () => {
    let s = begin('nila');
    s = transmit(s, 'hold', 'H2');
    expect(s.phase).toBe('play');
    expect(s.wrong).toBe(0);
  });

  it('filing with an empty row asks for every row', () => {
    let s = begin('nila');
    s = reducer(s, { type: 'FILE_LEDGER' });
    expect(s.ledgerMsg).toMatch(/Fill in every row/);
  });
});

describe('every case is winnable end to end', () => {
  for (const c of CASES) {
    it(`${c.id}: perfect run scores 30 + 20 + speed`, () => {
      let s = fileCorrectLedger(investigate(begin(c.id)));
      expect(radioUnlocked(s, c)).toBe(true);
      s = transmit(s, c.decision.correct[0], c.decision.correct[1]);
      expect(s.result?.win).toBe(true);
      expect(s.result?.total).toBe(30 + 20 + Math.floor(LIMIT / 15));
    });
  }

  it('time-zone case: accepting the converted scan time contradicts the no-show flag', () => {
    const c = caseById('ravi');
    let s = investigate(begin('ravi'));
    expect(detectConflicts(s.events, c)).toHaveLength(0);
    s = reducer(s, { type: 'SET_ROW', rowId: 'ist', value: '2255' }); // forgiving format
    s = reducer(s, { type: 'SET_ROW', rowId: 'before', value: 'Yes' });
    s = reducer(s, { type: 'SET_ROW', rowId: 'flag', value: 'Not valid' });
    s = reducer(s, { type: 'FILE_LEDGER' });
    expect(s.events.conv.when).toBe('22:55 IST');
    expect(detectConflicts(s.events, c)).toHaveLength(1);
  });
});

describe('scoring, penalties and the clock', () => {
  it('hints and wrong radio calls cost points but never end the run', () => {
    let s = fileCorrectLedger(investigate(begin('nila')));
    s = reducer(s, { type: 'HINT' });
    s = reducer(s, { type: 'HINT' });
    s = reducer(s, { type: 'HINT' }); // third ignored
    expect(s.hints).toBe(2);
    s = transmit(s, 'hold', 'door');
    expect(s.phase).toBe('play');
    expect(s.wrong).toBe(1);
    expect(s.msg).toMatch(/No confirmation/);
    expect(liveScore(s)).toBe(30 - 6 - 5);
  });

  it('clearing the flight shows the consequence message', () => {
    let s = fileCorrectLedger(investigate(begin('nila')));
    s = transmit(s, 'clear', 'H2');
    expect(s.msg).toMatch(/Flight released/);
  });

  it('timeout ends the run as a loss', () => {
    let s = begin('nila');
    for (let i = 0; i < LIMIT; i++) s = reducer(s, { type: 'TICK' });
    expect(s.phase).toBe('result');
    expect(s.result?.win).toBe(false);
  });
});

describe('hard mode: the passenger moves', () => {
  it('correct location changes at the authored time, with a banner and a map pin', () => {
    let s = fileCorrectLedger(investigate(begin('nila', true)));
    expect(correctNow(s)[1]).toBe('H2');
    for (let i = 0; i < 100; i++) s = reducer(s, { type: 'TICK' });
    expect(s.banner).toMatch(/main lounge/);
    expect(correctNow(s)[1]).toBe('lounge');
    s = transmit(s, 'hold', 'H2');
    expect(s.phase).toBe('play');
    s = transmit(s, 'hold', 'lounge');
    expect(s.result?.win).toBe(true);
    expect(s.result?.hardBonus).toBe(10);
  });

  it('normal mode never moves the passenger', () => {
    let s = begin('nila', false);
    for (let i = 0; i < 150; i++) s = reducer(s, { type: 'TICK' });
    expect(s.banner).toBe('');
    expect(correctNow(s)[1]).toBe('H2');
  });
});
