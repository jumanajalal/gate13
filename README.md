# Gate 13: Last Call

An escape-room style detective game for **LAYOVER** (TinkerHub, TinkerSpace Calicut, 10-11 Oct 2026).
You are the response team at a fictional gate. The system says one thing, the people say another, and you have 3 minutes to work out what the records really prove and radio operations.

Everything (airline, passengers, flights, records) is fictional. It is a game about reading evidence, not a model of real airport procedure.

## How it plays

You stand inside a gate area at night and **turn through five walls** (arrow buttons, the dots, or your keyboard arrow keys).

1. **Cold open.** A short briefing sets the scene. The clock starts when you enter Gate 13.
2. **Gate counter:** a departure board, the gate agent, a locked terminal. **Window and jet bridge:** a notice taped on the glass and the closed aircraft door. **Seating area:** a worried witness, a receipt on the table, the sign for Holding Point H2. **Baggage wall:** the terminal map, a hanging bag tag, a locked baggage terminal. **Operations wall:** the evidence board, a ledger clipboard, the radio and a countdown.
3. **Pick things up.** Boarding pass, notice, receipt and bag tag leave the wall and go into your **inventory**. Tap an inventory item while you are at a locked terminal to read the code you need.
4. **Talk to people** in a dialogue panel with a portrait. They answer authored questions; what they say is pinned on the board.
5. **Evidence board.** Facts pin themselves as CONFIRMED or UNCONFIRMED. When two records contradict each other, a red string is drawn between them. The contradiction checker is plain deterministic code, never an AI.
6. **Ledger clipboard.** A paper form with one row per claim. Operations stamps rows VERIFIED or rejects them. Wrong rows cost that row's points, never the game.
7. **Radio.** Locked until the ledger is right. Choose the action, tap the place on the map, transmit. The board flips and an incident report explains what the records proved.

The art is drawn in code (SVG), so there are no image files to lose and it works offline. Best on a laptop in fullscreen (there is a Fullscreen button) or a phone in landscape.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 31 tests: engine rules, layout, and full click-through playthroughs of the room
npm run build      # then: npm run preview  (http://localhost:4173, works offline)
```

On Windows PowerShell run the commands one per line (no `&&` in older versions).
The camera QR scanner needs **https or localhost**. Every card can also be opened from the desk, so the demo never depends on the camera.

## Cases

| Case | The gap between record and reality |
|---|---|
| The Group 3 Redirect | A scan is not the same as being onboard (and a bag is not loaded until a load event says so) |
| The Sent-Back Group | A loaded bag still is not a passenger |
| The Wrong Clock | Same moment, different clocks: a time-zone misread raises a false no-show flag |

Add a case by copying an object in `src/engine/cases.ts`. `npm test` checks that ids, answers, decisions, conflicts and **lock codes** are consistent, including that every lock code can actually be found on another prop.

## Features

- 3 authored cases on one engine; "Draw an envelope" picks one at random and avoids repeating the last
- A five-wall room with drawn props, character portraits, inventory, locks, evidence board with red strings, ledger, radio
- Hotspot dots (switch off in settings) and a Hint button that makes every uninspected hotspot pulse for 5 seconds
- Hard mode: the passenger moves at an authored time (visible banner, PA line and map pin), +10 points
- Scoring: +10 per ledger row filed correctly the first time, +20 radio call, small speed bonus, -3 per hint, -5 per wrong radio call
- Local leaderboard (works with no server)
- Departure board with flip animation and a 3:00 countdown
- Printable evidence kit with QR codes at `/#/props`; scan an envelope QR to open a case, scan a card to open its object
- PA announcements in English, Malayalam and Arabic with on-screen captions, a synthesised chime and room sound effects (all offline)
- Optional recorded clips: `public/audio/<caseId>-<atLeft>-<en|ml|ar>.mp3`, plus `<caseId>-win-<lang>.mp3` and `-lose-`. A clip plays instead of speech synthesis if present.

**Native review needed:** the Malayalam and Arabic PA lines are drafts. Have a fluent speaker check them before the demo.

## Project layout

- `src/engine/`: case data, state machine, scoring, store, PA and sound (no UI code, fully tested)
- `src/components/`: art (all drawings), Room (one wall plus hotspots), Dialogue, Inventory, Inspect (zoom + locks), Wall (board, ledger, radio), Intro, Report, Props
- `docs/CASE-BIBLE.md`: truth, codes and answer keys. `docs/RUNBOOK.md`: booth setup. `docs/PITCH.md`: pitch script.

## Ideas not built yet

More case variants, a physical lock souvenir, a text message to the judge's phone from the passenger, animated passenger movement on the map.

## Changing the room

- Where a prop sits: the `at: { v, x, y }` field on each object in `src/engine/cases.ts` (1600x900 canvas, `v` is the wall). `npm test` fails if props overlap or fall off the canvas.
- How a wall looks: `src/components/art.tsx`. Preview walls as images with `npx vite-node scripts/render.tsx` (writes SVGs to /tmp/walls).
