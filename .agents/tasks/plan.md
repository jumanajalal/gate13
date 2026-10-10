# Gate 13 — Immersive Redesign Implementation Plan

## Codebase status (as of exploration)

**Build:** `npm run build` (tsc --noEmit + vite build)  
**Test:** `npm run test` (vitest run) — **31 tests, all passing**  
**Dev:** `npm run dev`

### What already works
- Five-view room (gate / win / seat / bag / ops) with SVG art, arrows, keyboard pan — **complete**
- Inventory (pick-up + re-inspect carried items) — **complete**
- Evidence board (Pinboard) with red-string conflicts — **complete**
- Dialogue system with portrait, typewriter, QA — **complete**
- Inspect sheet + LockPanel (terminal entry) — **complete**
- Ledger (SET_ROW / FILE_LEDGER) with VERIFIED stamps — **complete**
- Radio (PICK / SUBMIT) gated by ledger — **complete**
- QR scanner (Html5Qrcode, evidence + envelope modes) — **complete**
- PA captions, sfx hooks — **complete**
- MapView with pickable nodes — **complete**
- Intro cold-open with typing animation — **complete**
- Report (RESOLVED / UNRESOLVED stamp, score table, leaderboard) — **complete**
- Three authored cases (nila, anjali, ravi) — **complete**
- Printable props page — **complete**

### What is absent or incomplete (must implement)
- `State.outcome` and `State.mapOverlay` fields — **missing**
- `finish()` doesn't carry `outcome` — **missing**
- `REOPEN` action — **missing**
- `evidenceCount` export — **missing**
- `Obj.manualAlias` field — **missing**
- `manualAlias` values on nila `pass`, `notice`, `receipt`, `tag` — **missing**
- Ledger terminal-style UI — **form-on-paper look; must redesign**
- Radio console UI — **plain buttons; must redesign**
- Inspect artifact enhancements (watermark, stamp, scanlines) — **missing**
- Keyboard shortcuts (Escape, I, M) — **missing**
- Manual scan fallback in Inspect — **missing**
- Scanner flash animation + diegetic error + scan frame — **missing**
- MapView overlay prop — **missing**
- Aircraft beacon pulse in WindowWall — **missing**
- Rain-on-glass in WindowWall — **missing**
- Conveyor animation in BagWall — **missing**
- Departure board cinematic states (GateWall needs `s: State`) — **missing**
- `OpsWall` radio glow based on evidenceCount — **missing (evidenceCount not exported)**
- Pinboard pin-card mount animation — **missing**
- Intro CSS fade-in — **missing**
- Report: DEPARTED outcome (cleared) with REOPEN button — **missing**
- Report: WIN cinematic terminal line — **missing**
- Board: HOLD/WIN/DEPARTED colour distinction — **partial (hold blinks but no outcome colours)**

### Ordering constraints
1. Stage 1 (engine changes) must come first — all other stages read `State.outcome`, `State.mapOverlay`, `evidenceCount`, and `Obj.manualAlias`.
2. Stage 1d tests must pass before any later stage.
3. Stage 2 UI items are independent of each other (2a–2e can be done in any order after Stage 1).
4. Stage 4e (departure board cinematic) requires `GateWall` to accept `s: State`, which requires `WALLS` type update and `RoomSvg` to pass `s` — this must happen before any art.tsx item that reads State.
5. Stage 5b (DEPARTED cinematic) requires Stage 1a's `REOPEN` action.
6. `evidenceCount` (Stage 1a) is needed by Stage 4f (radio glow in OpsWall).

---

## Stage 1 — Correctness fixes

### ☐ 1. Add `outcome` and `mapOverlay` to State; update reducer  
**What:** In `src/engine/game.ts`:
- Add `outcome: 'win' | 'timeout' | 'cleared' | null` and `mapOverlay: boolean` to the `State` interface.
- Add `outcome: null` and `mapOverlay: false` to `initial`.
- Update `finish()` to accept an optional `outcome` param:
  ```ts
  function finish(s: State, win: boolean, outcome: State['outcome'] = win ? 'win' : 'timeout'): State {
    return { ...s, phase: 'result', outcome, result: computeResult(s, win) };
  }
  ```
- In `TICK` case: `finish(next, false, 'timeout')`.
- In `SUBMIT` case: detect `clear` action → `finish({ ...s }, false, 'cleared')`; on win → `finish(s, true, 'win')`.
- Add `REOPEN` to the `Action` union (`| { type: 'REOPEN' }`).
- Add `REOPEN` to reducer: transitions from `result`/`cleared` back to `play`, incrementing `wrong`.
- In `OPEN` case: compute and set `mapOverlay` (true when both `map` and `notice` have been opened).
- Export `evidenceCount`: `export const evidenceCount = (s: State): number => Object.keys(s.events).length;`

**Files:** `src/engine/game.ts`  
**Verify:** `npm run test` — all 31 existing tests pass (no new tests yet; added in item 2).

---

### ☐ 2. Add `manualAlias` to Obj type; add aliases to nila case; fix receipt event label  
**What:**
- In `src/engine/types.ts`: add `manualAlias?: string` to the `Obj` interface.
- In `src/engine/cases.ts` (nila case): add `manualAlias` to four objects:
  - `pass`: `manualAlias: 'PASS-22C'`
  - `notice`: `manualAlias: 'NOTICE-G3'`
  - `receipt`: `manualAlias: 'REC-H2'`
  - `tag`: `manualAlias: 'TAG-482915'`
- Also fix the nila `receipt` event label to: `'Receipt places Nila with the boy at H2 counter'` (the spec says this exact string; current label is `'Receipt places Nila with the boy'` — update it).

**Files:** `src/engine/types.ts`, `src/engine/cases.ts`  
**Verify:** `npm run test` — all 31 tests pass (manualAlias is optional; existing layout and lock-code tests are unaffected).

---

### ☐ 3. Update tests for new State fields and new actions  
**What:** In `src/engine/game.test.ts`, add a new `describe('outcome and mapOverlay')` block with these four tests:
- `outcome` is `null` initially and on `begin()`.
- `outcome === 'win'` after a correct transmit.
- `outcome === 'cleared'` when `picks[0] === 'clear'` is transmitted.
- `outcome === 'timeout'` after LIMIT ticks.
- `REOPEN` transitions from `result`/`cleared` back to `play` with `wrong` incremented.
- `mapOverlay` becomes `true` when both `map` and `notice` objects are opened.

Also update `begin()` helper and any snapshot-style assertions that enumerate `initial` fields to include `outcome` and `mapOverlay` (search for references to `initial` shape in existing tests — none destructure all keys, so this is likely a no-op, but confirm).

**Files:** `src/engine/game.test.ts`  
**Verify:** `npm run test` — all tests including the new ones pass.

---

## Stage 2 — Immersive interaction redesign

### ☐ 4. Operations ledger → terminal record-reconciliation UI  
**What:** In `src/components/Wall.tsx`, rewrite the `Ledger` component. Keep all `dispatch` calls identical. Change only the visual:
- Remove the `<section>` / `<h2>Operations ledger</h2>` header and the `.form` wrapper; replace with a `.term` panel.
- Add a title line: `OPERATIONS RECORD RECONCILIATION TERMINAL`.
- Each row: show the label in a `.tl` line, then compact inline toggle buttons (Confirmed / Not confirmed / Not entered) styled as terminal command options (use existing `.seg` class; buttons inherit `.term` colour overrides).
- Keep VERIFIED `.stamp` on accepted rows.
- Change "File ledger" button text to `> SUBMIT RECORD`; keep `.pri` class; style is a terminal command button (add a `data-cmd` attribute or a sibling `.tl` decoration — CSS only).
- Validation message stays as `.tl` output within the panel.

**Files:** `src/components/Wall.tsx`, `src/styles.css` (add `.term .seg button` overrides and `.term .stamp` adjustments if needed)  
**Verify:** `npm run test` — the Nila and Ravi App.test.tsx play-throughs that exercise the ledger still pass (the tests use `getByLabelText('Operations ledger')` and `getByRole('button', { name: '...' })` so button labels must remain unchanged).

---

### ☐ 5. Radio panel → operational console UI  
**What:** In `src/components/Wall.tsx`, rewrite the `Radio` component's render. Keep all `dispatch` calls identical. Change the visual:
- Wrap the radio content in a dark console panel (`.opscon` class): dark background, subtle grid lines as CSS `background-image`.
- Add a static frequency display line: `OPS FREQ 121.9 ● GATE 13` (`.tl dim` style).
- Action selection: keep `.seg` button row.
- When both picks are selected, show a pending transmission line: `> [ACTION_LABEL] · [LOCATION_LABEL]` (derive from `c.decision.groups` options).
- "Transmit" button: keep `.pri.big`; add `pulsing` CSS class when both picks are selected (`s.picks[0] && s.picks[1]`).
- MapView: keep existing but add `.mapglow` wrapper class.
- Lock indicator: show `■ LOCKED` in amber when not open, `■ READY` in green when open (`.tl dim` / `.tl` style span).

**Files:** `src/components/Wall.tsx`, `src/styles.css`  
**Verify:** `npm run test` — all radio-related App.test.tsx tests still pass (button labels "Hold and verify", "Transmit", map node buttons unchanged).

---

### ☐ 6. Inspect panels → artifact close-ups with decorative overlays  
**What:** In `src/components/Inspect.tsx`, update the `Artifact` function's rendered output for four kinds:
- `terminal` kind: add `<div className="scanlines" aria-hidden />` as a sibling inside the `.term` block (absolutely positioned scanline overlay).
- `pass` kind: add `<div className="pass-watermark" aria-hidden>MALABAR AIR</div>` inside `.pass`, positioned behind the dl fields (use CSS `position: absolute`, `opacity: 0.07`, `transform: rotate(20deg)`).
- `paper` kind: add `<div className="op-stamp" aria-hidden>OPERATIONAL UPDATE</div>` over the content (red rubber-stamp style, CSS `position: absolute; transform: rotate(-12deg)`).
- `map` kind: pass `overlay={s.mapOverlay}` to `<MapView>` (requires `s` prop — see item 8 below for the `Inspect` signature change, which happens in the same item).

**Files:** `src/components/Inspect.tsx`, `src/styles.css`  
**Verify:** `npm run test` — all 31 tests pass (overlays are `aria-hidden` and don't affect accessible queries).

---

### ☐ 7. Manual scan fallback in Inspect  
**What:** In `src/components/Inspect.tsx`:
- Add `ManualScanField` component (internal, same file) as specified in Stage 2e of the brief.
- In the `Inspect` component, below the `Artifact` / `LockPanel` block but before the pinned count paragraph, add the collapsible `<details className="manualentry">` section when `o.manualAlias && !s.opened[o.id]`.
- The `onConfirm` callback calls `dispatch({ type: 'OPEN', objId: o.id })`.
- Import `useState` is already imported; no new imports needed.
- Add CSS for `.manualentry`, `.manualentry summary`, and `.shake` (`.shake` already exists in styles.css — verify and skip if duplicate).

**Files:** `src/components/Inspect.tsx`, `src/styles.css`  
**Verify:** `npm run test` — all 31 tests pass. Manual note: manually test that entering `PASS-22C` in the inspect sheet for the boarding pass fires OPEN (requires browser run).

---

### ☐ 8. Keyboard shortcuts — Escape, I, M  
**What:** In `src/App.tsx`, add a second `useEffect` for keyboard shortcuts (separate from the arrow-key effect). The effect activates only when `s.phase === 'play'`:
- `Escape` → `pop()` (close topmost layer).
- `i` / `I` → focus `.inv button` if no layers are open (put focus on inventory).
- `m` / `M` → `push({ type: 'board' })` if no layers are open.
- Guard: skip if `e.target` is an `INPUT`.

Note: `pop` and `push` are defined inline via `setLayers` — they are stable enough for this effect; use them directly in the closure. Add `layers.length` and `s.phase` to the dependency array.

**Files:** `src/App.tsx`  
**Verify:** `npm run test` — all 31 tests pass (the new effect is never triggered in jsdom tests; no behavioural change in automated flow).

---

## Stage 3 — QR scanner polish

### ☐ 9. Scanner: flash animation, diegetic error, and scan frame  
**What:** In `src/components/Scanner.tsx`, implement all three Stage 3 items together:
- Add `const [flash, setFlash] = useState(false)`.
- In the scan success callback (the `(text) => { ... }` function), before `cb.current(text)`, set `flash = true` and schedule a 450 ms reset.
- Replace `<div id="qr-reader" />` with the `.scanframe` structure containing `#qr-reader`, the `.scanreticle` with four corner spans, and the `{flash && <div className="scanflash" />}` overlay.
- Make the `.sheet` inside the Scanner use `position: relative` (add inline style or add to CSS for `.sheet` when inside a `.modal` — use the most specific selector that won't break other sheets).
- Replace the plain error `<p>` with the `.term` diegetic error panel as specified in Stage 3b.

**Files:** `src/components/Scanner.tsx`, `src/styles.css`  
**Verify:** `npm run test` — all 31 tests pass (Scanner is not rendered in current tests). Manual: open scanner on localhost, point at a QR code — amber flash visible on success; camera permission denied → green-on-black "HAND SCANNER OFFLINE" panel shown.

---

## Stage 4 — Environmental reactions

### ☐ 10. Pass `s: State` through to wall art; update GateWall and WALLS type  
**What:** This is a prerequisite for items 11–14. In `src/components/art.tsx`:
- Update `GateWall` signature to `function GateWall({ c, s }: { c: CaseDef; s?: State }): SceneBits`.
- Update `WALLS` type:
  ```ts
  export const WALLS: Record<Exclude<ViewId, 'ops'>, (a: { c: CaseDef; s?: State }) => SceneBits>
  ```
- In `src/components/Room.tsx`, update the `WALLS[view]({ c })` call to `WALLS[view]({ c, s })`.

**Files:** `src/components/art.tsx`, `src/components/Room.tsx`  
**Verify:** `npm run test` — all 31 tests pass (WALLS[view] now passes `s`, which GateWall uses as optional with default fallback).

---

### ☐ 11. Departure board cinematic states in GateWall  
**What:** In `src/components/art.tsx`, in `GateWall`, update the MA 613 status cell SVG text based on `s`:
- Default (no `s` or `s.phase !== 'result'`): current `'ON HOLD'` text with opacity flicker animation.
- `s.outcome === 'cleared'`: text `'DEPARTED'`, fill `#ff6b68`, no animation.
- `s.outcome === 'win'`: text `'RECONCILIATION IN PROGRESS'`, fill `#41c98a`, no animation.
- Use inline SVG `<animate>` for the flicker (same pattern as aircraft beacon in item 12), or a CSS `animationName` attribute.

Also update `OpsWall` to call `evidenceCount(s)` to increase radio glow opacity when `evidenceCount(s) >= 4` and the ledger is not yet filed. Import `evidenceCount` from `'../engine/game'`.

**Files:** `src/components/art.tsx`  
**Verify:** `npm run test` — all 31 tests pass. Manual: start nila case, win → board shows RECONCILIATION IN PROGRESS; use clear → shows DEPARTED.

---

### ☐ 12. Aircraft beacon pulse in WindowWall  
**What:** In `src/components/art.tsx`, in `WindowWall`'s `back` JSX, add two `<circle>` elements near the aircraft nose (approximately `cx=560, cy=400`):
- A solid red circle (`r=7`, fill `#ff3b3b`) with `<animate>` for opacity: values `"0;0;1;0;0"` over 3 s.
- A bloom ring (`r=18`, fill `#ff3b3b`, opacity `0.25`) with `<animate>` for radius and opacity as specified.

These are purely decorative SVG elements inside the existing `<g>` back group.

**Files:** `src/components/art.tsx`  
**Verify:** `npm run test` — all 31 tests pass.

---

### ☐ 13. Rain on glass in WindowWall  
**What:** In `src/components/art.tsx`, in `WindowWall`'s `back` JSX, after the window frame elements, add:
- A `<clipPath id="rainclip">` with a `<rect x="150" y="140" width="1020" height="440" />` to constrain rain to the window.
- A `<g clipPath="url(#rainclip)">` containing 20–30 animated rain lines (`<line>` elements) with varying x positions, each using `<animateTransform>` to slide down diagonally, staggered with different `begin` offsets and `dur` values (1.5–2.2 s range) to look like rain streaks on glass.
- Lines should be thin (`strokeWidth="1.5"`), `stroke="#9fd0ff"` with low opacity (0.18–0.35).

The `<clipPath>` element belongs in the SVG `<defs>` section. Add `rainclip` to the `<Defs>` component in art.tsx.

**Files:** `src/components/art.tsx`  
**Verify:** `npm run test` — all 31 tests pass.

---

### ☐ 14. Conveyor belt animation in BagWall  
**What:** In `src/components/art.tsx`, in `BagWall`'s `back` JSX, after the existing floor elements, add a conveyor belt group at y≈718–790:
- A base `<rect>` for the belt surface.
- 8–10 thin vertical stripe `<rect>` elements, each with `<animateTransform>` for continuous horizontal translation (belt stripes moving left, loop with `repeatCount="indefinite"`).
- Use a `<clipPath>` to keep stripes within the belt bounds. Add the clip path id to `<Defs>`.

**Files:** `src/components/art.tsx`  
**Verify:** `npm run test` — all 31 tests pass.

---

### ☐ 15. Map overlay for Group 3 route (MapView.tsx)  
**What:** In `src/components/MapView.tsx`:
- Add `overlay?: boolean` to the `Props` interface.
- When `overlay === true`, render an extra `<path>` between the Gate 13 node and the H2 node (use their coordinates from `map.nodes`), with `stroke="#ffb938"`, `strokeWidth={3}`, and a `filter="url(#mapglow)"`.
- Add a `<defs>` inside the SVG containing a `<filter id="mapglow">` with `feGaussianBlur` and `feComposite` to create a subtle glow.
- Add a `<text>` label near the H2 node: `"← Group 3 redirected"` in amber.

In `src/components/Inspect.tsx`, in the `map` case of `Artifact`, pass `overlay={s.mapOverlay}` to `MapView`. This requires `Artifact` to receive `s` — change the `Artifact` signature to `function Artifact({ o, c, s }: { o: Obj; c: CaseDef; s: State })` and update its call site in `Inspect`.

**Files:** `src/components/MapView.tsx`, `src/components/Inspect.tsx`  
**Verify:** `npm run test` — all 31 tests pass. Manual: open both `map` and `notice` objects in nila case; then open the map → Group 3 route highlighted in amber.

---

### ☐ 16. Evidence board pin-card mount animation  
**What:** In `src/components/Wall.tsx`, in `Pinboard`, add a CSS variable `--rot` to each pin card's `style` prop alongside the existing `transform`. The variable feeds a `@keyframes pinmount` animation defined in `src/styles.css`:
```css
@keyframes pinmount {
  from { transform: rotate(var(--rot)) translateY(-10px) scale(0.88); opacity: 0; }
  to   { transform: rotate(var(--rot)) translateY(0) scale(1); opacity: 1; }
}
.card.pin { animation: pinmount 0.3s ease-out both; }
```
Change the existing inline `transform: rotate(...)` to set `--rot` and let the animation handle it.

**Files:** `src/components/Wall.tsx`, `src/styles.css`  
**Verify:** `npm run test` — all 31 tests pass.

---

## Stage 5 — Cinematic outcome

### ☐ 17. Intro CSS fade-in and stamp line  
**What:** In `src/styles.css`:
```css
.intro { animation: fadein 1.2s ease-out; }
@keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
```
The `@media (prefers-reduced-motion: reduce)` rule already suppresses `.introlines p` animation; add `.intro` to that block too.

In `src/components/Intro.tsx`, confirm the `stamp-line` class is on the first line (`i === 0`) — it already is. No code change needed there beyond the CSS.

**Files:** `src/styles.css`  
**Verify:** `npm run test` — all 31 tests pass (animation is CSS-only; JSDOM strips it).

---

### ☐ 18. Report: DEPARTED cinematic (cleared outcome) + REOPEN button  
**What:** In `src/components/Report.tsx`:
- Add an `outcome` branch at the top of the render. When `s.outcome === 'cleared'`:
  - `bigstamp` text: `'UNRESOLVED'`, class `lose` (same as existing lose path).
  - Narrative paragraph: `"Flight {c.flight} departed. Passenger status remains unconfirmed. The incident is still open."`.
  - Add a `<button onClick={() => dispatch({ type: 'REOPEN' })}>Reopen Incident</button>`.
  - Import `type Action` is already imported. `REOPEN` is now part of `Action` after item 1.
- When `s.result?.win === true`:
  - Keep RESOLVED stamp, existing `c.winText`.
  - Add terminal output line: `<div className="term" style={{marginTop: 8}}><div className="tl">{"> DEPARTURE HOLD LIFTED · " + c.flight + " DEPARTED 14 MINUTES LATE · ALL PAX ACCOUNTED FOR"}</div></div>`.

Note: The `cleared` outcome has `s.result === null` (finish sets result only on win/loss). Guard: `if (!s.result && s.outcome !== 'cleared') return null` to prevent a blank render on the cleared path. On the cleared path, skip the score table and ledger debrief (nothing was correctly filed in a clear action).

**Files:** `src/components/Report.tsx`  
**Verify:** `npm run test` — all 31 tests pass. Manual: nila case, choose "Clear the flight" → outcome screen shows "UNRESOLVED" + "Reopen Incident" button; clicking it returns to play.

---

### ☐ 19. Board: HOLD / WIN / DEPARTED colour distinction  
**What:** In `src/components/Board.tsx`:
- Add `outcome?: 'win' | 'timeout' | 'cleared' | null` prop.
- Current `hold` prop drives `board.hold` class for amber blink. Extend:
  - `outcome === 'cleared'`: add class `board.departed` (no blink, red text for status).
  - `outcome === 'win'`: add class `board.resolved` (no blink, green text for status).
- In `src/styles.css`:
  ```css
  .board.departed .st { color: var(--bad); animation: none; }
  .board.resolved .st { color: var(--ok); animation: none; }
  ```
- In `src/App.tsx`, pass `outcome={s.outcome}` to `<Board>`.

**Files:** `src/components/Board.tsx`, `src/styles.css`, `src/App.tsx`  
**Verify:** `npm run test` — all 31 tests pass. Manual: win → board status in green; clear → board status in red.

---

## Final verification

### ☐ 20. Full regression pass  
**What:** After all items above are implemented, run the complete test suite and the TypeScript type-check.

```
npm run test
npm run typecheck
```

- All 31 original tests + new tests from item 3 must pass.
- `tsc --noEmit` must exit 0 (no type errors).
- Spot-check: open the app in a browser, play nila end-to-end (win, cleared/REOPEN, timeout), verify all five walls render with animations, manual scan fallback works in Inspect, scanner flash shows on QR read.

**Files:** (none — verification only)  
**Verify:** `npm run test` and `npm run typecheck` both exit 0.

---

## Summary table

| # | Stage | File(s) | Status |
|---|-------|---------|--------|
| 1 | 1a — `outcome`, `mapOverlay`, `REOPEN`, `evidenceCount` | game.ts | Missing |
| 2 | 1b/1c — `manualAlias` type + nila aliases + receipt label fix | types.ts, cases.ts | Missing |
| 3 | 1d — new engine tests | game.test.ts | Missing |
| 4 | 2a — Ledger terminal UI | Wall.tsx, styles.css | Redesign |
| 5 | 2b — Radio console UI | Wall.tsx, styles.css | Redesign |
| 6 | 2c — Inspect artifact overlays + map overlay wiring | Inspect.tsx, styles.css | Missing |
| 7 | 2e — Manual scan fallback | Inspect.tsx, styles.css | Missing |
| 8 | 2d — Keyboard shortcuts | App.tsx | Missing |
| 9 | 3a/3b/3c — Scanner flash + diegetic error + frame | Scanner.tsx, styles.css | Missing |
| 10 | 4e prerequisite — pass `s` to WALLS, update GateWall sig | art.tsx, Room.tsx | Missing |
| 11 | 4e/4f — Departure board cinematic + OpsWall radio glow | art.tsx | Missing |
| 12 | 4b — Aircraft beacon | art.tsx | Missing |
| 13 | 4c — Rain on glass | art.tsx | Missing |
| 14 | 4d — Conveyor animation | art.tsx | Missing |
| 15 | 4a — MapView overlay | MapView.tsx, Inspect.tsx | Missing |
| 16 | 4g — Pinboard mount animation | Wall.tsx, styles.css | Missing |
| 17 | 5a — Intro fade-in CSS | styles.css | Missing |
| 18 | 5b/5c — Report DEPARTED + WIN cinematic | Report.tsx | Missing |
| 19 | 5d — Board HOLD/WIN/DEPARTED colours | Board.tsx, styles.css, App.tsx | Missing |
| 20 | Final regression | — | Verify |
