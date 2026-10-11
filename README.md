# Gate 13: Last Call

**An escape-room detective game about travel records.** Built overnight for **LAYOVER** (TinkerHub, TinkerSpace Calicut, 10-11 October 2026).

> The system says the passenger boarded. Her brother says she never reached the plane. You have three minutes before the aircraft is cleared.

| | |
|---|---|
| Play it | **https://gate13.vercel.app/** |
| Source | https://github.com/jumanajalal/gate13 |
| Solo | Jumana Jalal |

## What it is

You stand inside a fictional airport gate at night. You turn through five walls, pick things up, crack locked terminals with codes you find on other props, question witnesses, and pin facts on an evidence board. When two records contradict each other, a red string appears between them. Then you file an operations ledger and radio operations with your call.

The game is about one idea: **a travel record is not the same as what happened.**

- A boarding pass scan is not the same as being onboard.
- A loaded bag is not a passenger.
- A timestamp is meaningless until you know which clock it was written in.

Everything in it (the airline, passengers, flights and records) is fictional. It is a game about reading evidence, not a model of real airport procedure.

## Why it fits the LAYOVER theme

The brief asks for something built around travel, with no need to solve a real problem. Here travel is the machinery, not a skin: the clues are boarding passes, gate changes, bag tags, scan logs, terminal maps and time zones, and every deduction depends on understanding how those records relate.

## How to play

1. **Cold open.** A short briefing sets the scene. The clock starts when you enter Gate 13.
2. **Turn through the room.** Five walls: gate counter, window and jet bridge, seating area, baggage wall, and operations wall. Use the arrow buttons, the dots, or your keyboard arrow keys.
3. **Pick things up.** Boarding pass, notice, receipt and bag tag go into your inventory. Open an inventory item while you are at a locked terminal to read the code you need.
4. **Talk to people.** Witnesses answer authored questions. What they say is pinned on the evidence board.
5. **Read the evidence board.** Facts are marked CONFIRMED or UNCONFIRMED. Contradictions get a red string.
6. **File the ledger.** One row per claim. Operations stamps rows VERIFIED or rejects them.
7. **Radio operations.** Locked until the ledger is right. Choose the action, tap the place on the map, and transmit. An incident report explains what the records really proved.

**QR scanning.** Each case ships as a printable evidence kit. Scan an envelope QR to open a case, or scan a physical card to open that object in the game. Every card can also be opened inside the room, so the game never depends on the camera.

## The cases

| Case | The gap between record and reality |
|---|---|
| The Group 3 Redirect | A scan is not the same as being onboard (and a bag is not loaded until a load event says so) |
| The Sent-Back Group | A loaded bag still is not a passenger |
| The Wrong Clock | Same moment, different clocks: a time-zone misread raises a false no-show flag |
| The Suitcase That Travelled Alone | A bag on the gate chute is not on this flight: an optical scanner error diverted an interline bag |
| The Phone Left Behind | Independent receipt and notification trails identify the passenger already seated before door closure |

## Features

- Five authored cases on one deterministic engine; a case archive separates available cases from cleared ones, with a best score and star rating per case
- A five-wall point-and-click room with drawn props, character portraits, a dialogue panel, and an inventory
- Locked terminals whose codes are found on other props
- An evidence board with automatic contradiction detection (plain code, never an AI)
- Progressive three-tier hints: attention, then relationship, then direct deduction
- Investigation rating based on decision accuracy, first-attempt ledger filing, speed and hint conservation
- Hard mode: stricter hint penalties, time pressure, and a passenger who can move
- Departure board with a countdown, PA announcements in English, Malayalam and Arabic with on-screen captions, and synthesised sound effects
- Fast replay of any case without losing the archive
- Printable QR evidence kit at `/#/props`
- Works fully offline once built: no backend, no live AI, no external APIs

## Scoring

+10 per ledger row filed correctly the first time, +20 for the radio call, a small speed bonus, -3 per hint (-5 in hard mode), -5 per wrong radio call. Wrong ledger rows lose that row's points but never end the game.

## Tech

React 18, TypeScript, Vite. The art is drawn in code as SVG, so there are no image assets. Game logic lives in `src/engine/` with no UI code, and is covered by automated tests plus click-through playthroughs of the room. QR scanning uses `html5-qrcode`; the printable kit uses `qrcode`.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine rules, layout checks and click-through playthroughs
npm run build
npm run preview    # http://localhost:4173, works offline
```

On Windows PowerShell, run the commands one per line.

## Honest notes and limitations

- **The leaderboard is local to each device.** Scores are stored in the browser, so a deployed copy shows each visitor only their own board. It works well as a single booth board on one laptop. A shared online board would need a small backend.
- **QR codes hold in-app codes, not web links.** Scan them with the in-game scanner. The phone's default camera app will not open the game from them.
- **The Malayalam and Arabic announcements are drafts** and should be reviewed by a fluent speaker. Recorded clips can replace them (see below).
- **It is built for a laptop in fullscreen, or a phone in landscape.**
- The scenario facts are fictional by design.

## Recorded announcements (optional)

Drop MP3 files into `public/audio/` named `<caseId>-<atLeft>-<en|ml|ar>.mp3`, plus `<caseId>-win-<lang>.mp3` and `<caseId>-lose-<lang>.mp3`. A clip plays instead of speech synthesis if present.

## Project layout

```
src/engine/       case data, state machine, scoring, storage, announcements, sound (no UI code)
src/components/   room art, wall hotspots, dialogue, inventory, evidence board, ledger, radio, reports
docs/             case bible (answer keys), booth runbook, pitch script
scripts/          renders walls and portraits to images for checking
```

## Adding a case

Add a case object in `src/engine/cases.ts`: objects with positions, locks, witnesses, ledger rows, and the radio decision. `npm test` checks that ids, answers, decisions, conflicts and lock codes are consistent, that every lock code can be found on another prop, and that props do not overlap or fall off the room.

## Credits

Built by YOUR NAME and TEAMMATE NAME for LAYOVER 2026.
