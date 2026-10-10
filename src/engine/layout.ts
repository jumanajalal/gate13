import type { Kind, ViewId } from './types';

/** The room is drawn on a 1600x900 canvas. Prop footprints (w, h) by kind. */
export const CANVAS = { w: 1600, h: 900 };

export const KIND_SIZE: Record<Kind, [number, number]> = {
  pass: [150, 70],
  paper: [110, 140],
  terminal: [200, 150],
  receipt: [50, 110],
  tag: [80, 170],
  map: [230, 160],
  clock: [110, 110],
  person: [150, 380],
  phone: [70, 130],
};

/** Things you pick up and carry. Everything else is a fixture of the room. */
export const CARRYABLE: Kind[] = ['pass', 'paper', 'receipt', 'tag', 'clock', 'phone'];

export const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'gate', label: 'Gate counter' },
  { id: 'win', label: 'Window and jet bridge' },
  { id: 'seat', label: 'Seating area' },
  { id: 'bag', label: 'Baggage wall' },
  { id: 'ops', label: 'Operations wall' },
];
