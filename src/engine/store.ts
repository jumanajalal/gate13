export interface Entry {
  name: string;
  points: number;
  caseId: string;
  hard: boolean;
  at: number;
}

export interface Settings {
  sound: boolean;
  hard: boolean;
  hotspots: boolean;
}

const LB_KEY = 'gate13.leaderboard.v1';
const SET_KEY = 'gate13.settings.v1';
let memBoard: Entry[] = [];
let memSettings: Settings = { sound: true, hard: false, hotspots: true };

export function loadBoard(): Entry[] {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (raw) memBoard = JSON.parse(raw);
  } catch {
    /* storage unavailable: fall back to memory */
  }
  return memBoard;
}

function persistBoard() {
  try {
    localStorage.setItem(LB_KEY, JSON.stringify(memBoard));
  } catch {
    /* ignore */
  }
}

export function addEntry(e: Entry): Entry[] {
  memBoard = [...loadBoard(), e].sort((a, b) => b.points - a.points || a.at - b.at).slice(0, 30);
  persistBoard();
  return memBoard;
}

export function clearBoard() {
  memBoard = [];
  persistBoard();
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SET_KEY);
    if (raw) memSettings = { ...memSettings, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return memSettings;
}

export function saveSettings(s: Settings) {
  memSettings = s;
  try {
    localStorage.setItem(SET_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
