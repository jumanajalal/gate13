export type Status = 'confirmed' | 'unconfirmed';

/** One fact on the evidence timeline. `t` = minutes before departure; `when` overrides the label (e.g. clock times). */
export interface EvEvent {
  key: string;
  t: number | null;
  when?: string;
  label: string;
  status: Status;
}

export interface Item {
  id: string;
  title: string;
  body: string;
  events?: EvEvent[];
}

export interface Question {
  text: string;
  options: string[];
  answer: number;
}

export interface Bundle {
  id: 'A' | 'B' | 'C';
  title: string;
  items: Item[];
  question: Question;
  /** Derived facts added to the timeline when the question is answered correctly. */
  onCorrect?: EvEvent[];
  showMap?: boolean;
}

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
  /** Correct option id for each group. For map cases group 1 is the location id. */
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
  intro: string;
  boardHold: string;
  boardWin: string;
  boardLose: string;
  winText: string;
  loseText: string;
  bundles: [Bundle, Bundle, Bundle];
  map?: MapDef;
  decision: Decision;
  hints: [string, string];
  conflicts: { a: string; b: string; note: string }[];
  /** Hard mode only: the passenger moves; the correct location for group 1 changes. */
  moves?: { atElapsed: number; loc: string; text: string }[];
  pa: PaLine[];
  winPa: { en: string; ml: string; ar: string };
  losePa: { en: string; ml: string; ar: string };
}
