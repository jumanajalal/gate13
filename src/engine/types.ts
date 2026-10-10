export type Status = 'confirmed' | 'unconfirmed';

/** One fact on the evidence wall. `t` = minutes before departure; `when` overrides the label (clock times). */
export interface EvEvent {
  key: string;
  t: number | null;
  when?: string;
  label: string;
  status: Status;
}

export type ViewId = 'gate' | 'win' | 'seat' | 'bag' | 'ops';

export type Kind = 'pass' | 'paper' | 'terminal' | 'receipt' | 'tag' | 'person' | 'map' | 'clock' | 'phone';

/** A code the player must find elsewhere in the room (escape-room gate). */
export interface Lock {
  prompt: string;
  placeholder: string;
  answers: string[];
  hint: string;
}

export interface QA {
  q: string;
  a: string;
  events?: EvEvent[];
}

export interface Talk {
  who: string;
  role: string;
  intro: string;
  qa: QA[];
}

/** An object on the gate desk: a prop, a terminal, a map or a person. */
export interface Obj {
  id: string;
  kind: Kind;
  /** Where the prop sits in the room: wall view and top-left position on a 1600x900 canvas. */
  at: { v: ViewId; x: number; y: number };
  title: string;
  heading?: string;
  fields?: [string, string][];
  lines?: string[];
  note?: string;
  lock?: Lock;
  events?: EvEvent[];
  talk?: Talk;
  manualAlias?: string;
  optional?: boolean;
}

interface RowBase {
  id: string;
  label: string;
  /** Shown in the debrief. */
  why: string;
  /** Facts added to the wall when this row is accepted. */
  onOk?: EvEvent[];
}
export type Row =
  | (RowBase & { kind: 'choice'; options: string[]; answer: string })
  | (RowBase & { kind: 'time'; answer: string });

export interface MapNode {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapDef {
  nodes: MapNode[];
  edges: [number, number, number, number][];
}

export interface Choice {
  id: string;
  label: string;
}

export interface DecisionGroup {
  title: string;
  options: Choice[];
}

export interface Decision {
  groups: [DecisionGroup, DecisionGroup];
  /** Correct option id per group. For map cases group 1 is the location id. */
  correct: [string, string];
  messages: { first: Record<string, string>; fallback: string };
}

export interface PaLine {
  atLeft: number;
  en: string;
  ml: string;
  ar: string;
}

export interface CaseDef {
  id: string;
  title: string;
  tagline: string;
  flight: string;
  passenger: string;
  /** Cold-open lines shown one by one before the clock starts. */
  opening: string[];
  boardHold: string;
  boardWin: string;
  boardLose: string;
  winText: string;
  loseText: string;
  objects: Obj[];
  ledger: Row[];
  map?: MapDef;
  decision: Decision;
  hints: string[];
  conflicts: { a: string; b: string; note: string }[];
  /** Hard mode only: the passenger moves; the correct location for group 1 changes. */
  moves?: { atElapsed: number; loc: string; text: string }[];
  pa: PaLine[];
  winPa: { en: string; ml: string; ar: string };
  losePa: { en: string; ml: string; ar: string };
}
