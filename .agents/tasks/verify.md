# Verification Note

## Test results (`npm run test`)

```
 Test Files  2 passed (2)
      Tests  39 passed (39)
   Start at  03:48:07
   Duration  4.99s
```

All 39 tests pass:
- 33 engine tests (game.test.ts) — includes 8 new `outcome and mapOverlay` tests
- 6 App integration tests (App.test.tsx)

## Build results (`npm run build` / `npm run typecheck`)

```
> tsc --noEmit   ← exit 0, zero type errors

vite v5.4.21 building for production...
✓ 151 modules transformed.
dist/assets/index-MZ7lQDnh.css   23.20 kB │ gzip:   6.10 kB
dist/assets/index-DX7IEvzQ.js   585.78 kB │ gzip: 182.67 kB
✓ built in 2.31s   ← exit 0
```

No type errors. Build is clean (chunk size warning is informational, not an error).

## What was implemented

### Stage 1 — Correctness fixes
- Added `outcome: 'win' | 'timeout' | 'cleared' | null` and `mapOverlay: boolean` to `State`
- Updated `finish()` to accept outcome parameter
- TICK timeout calls `finish(next, false, 'timeout')`
- SUBMIT detects `'clear'` → `finish(..., 'cleared')` while preserving `msg` from `messages.first.clear`
- Added `REOPEN` action: transitions `result/cleared` → `play` with `wrong++`
- OPEN case now computes `mapOverlay` (true when both `map` and `notice` opened)
- Exported `evidenceCount` function
- Added `manualAlias?: string` to `Obj` interface
- Added `manualAlias` to nila `pass` (PASS-22C), `notice` (NOTICE-G3), `receipt` (REC-H2), `tag` (TAG-482915)
- Fixed nila `receipt` event label: `'Receipt places Nila with the boy at H2 counter'`
- Added 8 new tests for `outcome` and `mapOverlay` behavior

### Stage 2 — Immersive interaction redesign
- **Ledger** (`Wall.tsx`): terminal-style `.term` panel with green-on-black color, `> SUBMIT RECORD` button (aria-label preserved for tests), VERIFIED stamp, terminal output for validation
- **Radio** (`Wall.tsx`): `.opscon` dark console panel with grid overlay, `OPS FREQ 121.9 ● GATE 13` frequency display, `■ RADIO LOCKED` / `■ READY` status, pending transmission line, pulsing glow on Transmit when both picks selected, `mapglow` border on map
- **Inspect** (`Inspect.tsx`): scanline overlay on terminals, MALABAR AIR watermark on boarding pass, OPERATIONAL UPDATE rubber stamp on paper kind, `overlay` prop on MapView for map kind
- **Keyboard shortcuts** (`App.tsx`): Escape closes top layer, I focuses inventory, M opens board
- **Manual scan fallback**: collapsible `<details>` with `ManualScanField` for objects with `manualAlias`

### Stage 3 — QR scanner polish
- Flash state on successful scan with `.scanflash` overlay animation
- `.scanframe` wrapper with `.scanreticle` amber corner markers
- Diegetic `HAND SCANNER OFFLINE` error block replacing plain `<p>` error

### Stage 4 — Environmental reactions
- **MapView**: `overlay?: boolean` prop draws amber dashed path Gate 13 → H2 with glow filter and "← Group 3 redirected" label; `Inspect` passes `s.mapOverlay`
- **Aircraft beacon**: pulsing red circles at cx=560, cy=400 in WindowWall
- **Rain on glass**: 28 animated rain lines with clipPath in WindowWall
- **Conveyor belt**: animated stripe rects with clipPath in BagWall
- **Departure board cinematic**: GateWall accepts `s?: State`; MA 613 status shows `ON HOLD` (flicker), `DEPARTED` (#ff6b68), or `RECONCILIATION IN PROGRESS` (#41c98a) based on outcome; `WALLS` type updated; Room.tsx passes `s`
- **OpsWall radio glow**: bloom animation circle whose opacity increases when `evidenceCount >= 4`; imports `evidenceCount`
- **Pinboard pin animation**: `@keyframes pinmount` with CSS `--rot` custom property

### Stage 5 — Cinematic outcome
- **Intro**: `.intro { animation: fadein 1.2s ease-out }` in CSS; reduced-motion guard updated
- **Report**: cleared outcome shows UNRESOLVED stamp + narrative paragraph + "Reopen Incident" button dispatching `REOPEN`; win outcome shows RESOLVED stamp + terminal line with departure message
- **Board**: `outcome` prop; `.board.departed .st { color: var(--bad) }`, `.board.resolved .st { color: var(--ok) }` in CSS
- **App.tsx**: passes `outcome={s.outcome}` to Board; shows Report for `cleared` outcome; status string handles cleared case

## Commit

`d368ba3 feat: immersive redesign — all 5 stages (engine fixes, UI, scanner, art, cinematic)`
