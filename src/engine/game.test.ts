import { describe, expect, it } from 'vitest';
import { CASES, caseById } from './cases';
import { detectConflicts, initial, LIMIT, reducer, correctNow, liveScore, type State } from './game';

function play(caseId: string, hard = false): State {
  return reducer(initial, { type: 'START', caseId, hard });
}

function solveEvidence(s: State): State {
  const c = caseById(s.caseId);
  for (const b of c.bundles) {
    for (const i of b.items) s = reducer(s, { type: 'INSPECT', itemId: i.id });
    s = reducer(s, { type: 'ANSWER', bundleId: b.id, index: b.question.answer });
  }
  return s;
}

describe('case data integrity', () => {
  for (const c of CASES) {
    it(`${c.id}: answers, decisions and ids are consistent`, () => {
      const ids = c.bundles.flatMap((b) => b.items.map((i) => i.id));
      // item ids only need to be unique inside a case
      expect(new Set(ids).size).toBe(ids.length);
      for (const b of c.bundles) {
        expect(b.question.answer).toBeGreaterThanOrEqual(0);
        expect(b.question.answer).toBeLessThan(b.question.options.length);
      }
      c.decision.groups.forEach((g, i) => {
        expect(g.options.map((o) => o.id)).toContain(c.decision.correct[i]);
      });
      if (c.map) expect(c.map.nodes.map((n) => n.id)).toContain(c.decision.correct[1]);
      const keys = new Set(
        c.bundles.flatMap((b) => [...b.items.flatMap((i) => i.events ?? []), ...(b.onCorrect ?? [])]).map((e) => e.key),
      );
      for (const x of c.conflicts) {
        expect(keys.has(x.a)).toBe(true);
        expect(keys.has(x.b)).toBe(true);
      }
    });
  }
});

describe('scoring and flow', () => {
  it('perfect fast run scores evidence + decision + speed bonus', () => {
    for (const c of CASES) {
      let s = solveEvidence(play(c.id));
      s = reducer(s, { type: 'PICK', group: 0, value: c.decision.correct[0] });
      s = reducer(s, { type: 'PICK', group: 1, value: c.decision.correct[1] });
      s = reducer(s, { type: 'SUBMIT' });
      expect(s.phase).toBe('result');
      expect(s.result?.win).toBe(true);
      expect(s.result?.total).toBe(30 + 20 + Math.floor(LIMIT / 15));
    }
  });

  it('hints and wrong checks cost points but never end the run', () => {
    let s = solveEvidence(play('nila'));
    s = reducer(s, { type: 'HINT' });
    s = reducer(s, { type: 'HINT' });
    s = reducer(s, { type: 'HINT' }); // third is ignored
    expect(s.hints).toBe(2);
    s = reducer(s, { type: 'PICK', group: 0, value: 'hold' });
    s = reducer(s, { type: 'PICK', group: 1, value: 'door' });
    s = reducer(s, { type: 'SUBMIT' });
    expect(s.phase).toBe('play');
    expect(s.wrong).toBe(1);
    expect(liveScore(s)).toBe(30 - 6 - 5);
    expect(s.msg).toMatch(/No confirmation/);
  });

  it('clearing the flight shows the consequence message', () => {
    let s = play('nila');
    s = reducer(s, { type: 'PICK', group: 0, value: 'clear' });
    s = reducer(s, { type: 'PICK', group: 1, value: 'H2' });
    s = reducer(s, { type: 'SUBMIT' });
    expect(s.msg).toMatch(/Flight released/);
  });

  it('answers only count once and require the whole bundle to be inspected', () => {
    let s = play('nila');
    s = reducer(s, { type: 'ANSWER', bundleId: 'A', index: 1 });
    expect(s.evidence).toBe(0);
    s = reducer(s, { type: 'INSPECT', itemId: 'pass' });
    s = reducer(s, { type: 'INSPECT', itemId: 'scan' });
    s = reducer(s, { type: 'ANSWER', bundleId: 'A', index: 0 });
    s = reducer(s, { type: 'ANSWER', bundleId: 'A', index: 1 });
    expect(s.evidence).toBe(0);
  });

  it('timeout ends the run as a loss', () => {
    let s = play('nila');
    for (let i = 0; i < LIMIT; i++) s = reducer(s, { type: 'TICK' });
    expect(s.phase).toBe('result');
    expect(s.result?.win).toBe(false);
  });
});

describe('hard mode: the passenger moves', () => {
  it('correct location changes at the authored time and a banner appears', () => {
    let s = play('nila', true);
    expect(correctNow(s)[1]).toBe('H2');
    for (let i = 0; i < 100; i++) s = reducer(s, { type: 'TICK' });
    expect(s.banner).toMatch(/main lounge/);
    expect(correctNow(s)[1]).toBe('lounge');
    s = reducer(s, { type: 'PICK', group: 0, value: 'hold' });
    s = reducer(s, { type: 'PICK', group: 1, value: 'H2' });
    s = reducer(s, { type: 'SUBMIT' });
    expect(s.phase).toBe('play');
    s = reducer(s, { type: 'PICK', group: 0, value: 'hold' });
    s = reducer(s, { type: 'PICK', group: 1, value: 'lounge' });
    s = reducer(s, { type: 'SUBMIT' });
    expect(s.result?.win).toBe(true);
    expect(s.result?.hardBonus).toBe(10);
  });

  it('normal mode never moves the passenger', () => {
    let s = play('nila', false);
    for (let i = 0; i < 150; i++) s = reducer(s, { type: 'TICK' });
    expect(s.banner).toBe('');
    expect(correctNow(s)[1]).toBe('H2');
  });
});

describe('contradiction checker', () => {
  it('flags the staff note vs relative statement only when both are on the timeline', () => {
    const c = caseById('nila');
    let s = play('nila');
    s = reducer(s, { type: 'INSPECT', itemId: 'note' });
    expect(detectConflicts(s.events, c)).toHaveLength(0);
    s = reducer(s, { type: 'INSPECT', itemId: 'stmt' });
    expect(detectConflicts(s.events, c)).toHaveLength(1);
  });

  it('time-zone case: the converted scan time contradicts the no-show flag', () => {
    const c = caseById('ravi');
    let s = play('ravi');
    for (const id of ['pass', 'flag', 'scan', 'close', 'zones']) s = reducer(s, { type: 'INSPECT', itemId: id });
    expect(detectConflicts(s.events, c)).toHaveLength(0);
    s = reducer(s, { type: 'ANSWER', bundleId: 'B', index: 1 });
    expect(s.events.conv.when).toBe('22:55 IST');
    expect(detectConflicts(s.events, c)).toHaveLength(1);
  });
});
