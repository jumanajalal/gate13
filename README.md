# Gate 13: Last Call

A travel-records detective game for **LAYOVER** (TinkerHub, TinkerSpace Calicut, 10-11 Oct 2026).
Judges get an incident file at a fictional gate. The records say one thing, the people say another, and they have 3 minutes to work out what the records actually prove and tell operations what to do.

Everything (airline, passengers, flights, records) is fictional. It is a game about reading evidence, not a model of real airport procedure.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (also on your LAN)
npm test           # engine tests (12)
npm run build && npm run preview   # production build, works fully offline
```

The camera QR scanner needs **https or localhost**. Every scan also has an on-screen button fallback, so the demo never depends on the camera.

## What is in it

| Feature | Where |
|---|---|
| 3 authored cases on one engine (status gap, bag gap, time-zone gap) | `src/engine/cases.ts` |
| Deterministic game state, scoring, contradiction checker (no AI judges truth) | `src/engine/game.ts` |
| Hard mode: the passenger moves at an authored time, visible banner + map pin | `moves` in a case |
| Score: +10 per bundle, +20 decision, small speed bonus, -3 hint, -5 wrong check, +10 hard mode | `game.ts` |
| Local leaderboard + settings (works without a server, falls back to memory) | `src/engine/store.ts` |
| Departure board with flip animation, 3:00 countdown, live status | `components/Board.tsx` |
| QR: scan an envelope to open a case, scan cards to add evidence | `components/Scanner.tsx` |
| Printable evidence kit with QR codes: open `/#/props` and print | `components/Props.tsx` |
| PA announcements in English, Malayalam, Arabic with on-screen captions, synthesized chime | `src/engine/pa.ts` |
| Optional recorded clips: `public/audio/<caseId>-<atLeft>-<en|ml|ar>.mp3` (see below) | `public/audio/` |

## Scoring and fairness rules

- Evidence is graded per bundle, first try only. Decisions never hard-fail: a wrong check costs 5 points and sends the team back to the evidence.
- Glossaries define terms (SCAN, ONBOARD, LOADED) without stating the answer.
- Everything needed (zone offsets, map labels) is printed inside the case.
- The LLM is not in the truth pipeline. There is no LLM in this repo at all, so it runs offline.

## Add a case

1. Copy a case object in `src/engine/cases.ts` and change the story, items, questions, decision and `correct`.
2. Every item event needs a unique `key` inside the case; conflicts reference those keys.
3. `npm test` checks that answers, decision ids and conflict keys are consistent.
4. Open `/#/props` to print the new envelope.

## Recorded PA clips (optional)

Drop MP3s into `public/audio/` named `<caseId>-<atLeft>-<lang>.mp3`, for example `nila-120-ml.mp3`, plus `<caseId>-win-en.mp3` / `-lose-` for outcomes. If a clip exists it plays instead of speech synthesis. Your own voice in Malayalam beats a synthetic one.

**Native review needed:** the Malayalam and Arabic PA lines are drafts. Have a fluent speaker check them before the demo.

## Docs

- `docs/CASE-BIBLE.md`: the truth, timeline and answer key for each case
- `docs/RUNBOOK.md`: booth setup, reset checklist, failure fallbacks, build order
- `docs/PITCH.md`: 10-second hook, 90-second core, 2-minute finalist script

## Ideas not built yet

Case variants with different last-seen locations, a physical lock souvenir, a text message to the judge's phone from "Nila", a 2D moving marker animation on the map.
