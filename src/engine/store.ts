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

export interface CaseRecord {
  caseId: string;
  cleared: boolean;
  bestScore: number;
  bestStars: number;
  ratingTitle: string;
  bestTimeSeconds: number;
  attempts: number;
  lastPlayed: number;
}

export type CaseArchive = Record<string, CaseRecord>;

const ARCHIVE_KEY = 'gate13.archive.v1';
let memArchive: CaseArchive = {};

export function loadArchive(): CaseArchive {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (raw) memArchive = JSON.parse(raw);
  } catch {
    /* storage unavailable: fall back to memory */
  }
  return memArchive;
}

function persistArchive() {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(memArchive));
  } catch {
    /* ignore */
  }
}

export function recordCaseAttempt(
  caseId: string,
  win: boolean,
  score: number,
  stars: number,
  ratingTitle: string,
  elapsedSeconds: number,
): CaseArchive {
  const current = loadArchive();
  const prev = current[caseId];
  const attempts = (prev?.attempts ?? 0) + 1;
  const cleared = (prev?.cleared ?? false) || win;
  const bestScore = Math.max(prev?.bestScore ?? 0, score);
  const bestStars = Math.max(prev?.bestStars ?? 0, stars);
  const title = bestStars > (prev?.bestStars ?? 0) ? ratingTitle : prev?.ratingTitle || ratingTitle;
  const bestTimeSeconds = prev?.bestTimeSeconds
    ? win ? Math.min(prev.bestTimeSeconds, elapsedSeconds) : prev.bestTimeSeconds
    : elapsedSeconds;

  memArchive = {
    ...current,
    [caseId]: {
      caseId,
      cleared,
      bestScore,
      bestStars,
      ratingTitle: title,
      bestTimeSeconds,
      attempts,
      lastPlayed: Date.now(),
    },
  };
  persistArchive();
  return memArchive;
}

export function clearArchive() {
  memArchive = {};
  persistArchive();
}

