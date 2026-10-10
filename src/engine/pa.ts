/**
 * Public-address layer. Everything works offline:
 * - the chime is synthesised with WebAudio (no assets);
 * - speech uses the browser's speechSynthesis voices (Malayalam/Arabic depend on the device);
 * - optional recorded clips in public/audio/<key>-<en|ml|ar>.mp3 override speech.
 * Every announcement is also shown as on-screen captions, so nothing depends on audio.
 */
export type Lang = 'en' | 'ml' | 'ar';
export type Line = Partial<Record<Lang, string>>;

const LOCALE: Record<Lang, string> = { en: 'en-IN', ml: 'ml-IN', ar: 'ar-SA' };
let ctx: AudioContext | null = null;
let token = 0;

export function unlock() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx ?? new AC();
    void ctx.resume();
  } catch {
    /* audio unavailable */
  }
}

export function chime() {
  if (!ctx) return;
  const now = ctx.currentTime;
  const c = ctx;
  [[659, 0], [523, 0.38]].forEach(([f, d]) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, now + d);
    g.gain.exponentialRampToValueAtTime(0.25, now + d + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + d + 0.7);
    o.connect(g).connect(c.destination);
    o.start(now + d);
    o.stop(now + d + 0.75);
  });
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function speak(text: string, lang: Lang): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LOCALE[lang];
    u.rate = 0.95;
    const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
    setTimeout(resolve, 12000); // never hang the queue
  });
}

function playFile(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const a = new Audio(url);
    const done = (ok: boolean) => resolve(ok);
    a.onerror = () => done(false);
    a.onended = () => done(true);
    a.play().catch(() => done(false));
    setTimeout(() => {
      if (a.paused && a.currentTime === 0) done(false);
    }, 1500);
  });
}

export async function announce(line: Line, enabled: boolean, key?: string) {
  if (!enabled) return;
  const mine = ++token;
  try {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
  chime();
  await sleep(900);
  for (const lang of ['en', 'ml', 'ar'] as Lang[]) {
    const text = line[lang];
    if (!text || mine !== token) continue;
    if (key && (await playFile(`${import.meta.env.BASE_URL}audio/${key}-${lang}.mp3`))) continue;
    await speak(text, lang);
  }
}

export function silence() {
  token++;
  try {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
