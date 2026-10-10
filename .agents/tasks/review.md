# Gate 13 Immersive Redesign — Semantic Code Review

The change transforms Gate 13 from a form-driven quiz into an explorable airport incident investigation. All five implementation stages are present: engine state extensions, immersive UI redesigns, QR scanner polish, SVG environmental animations, and a cinematic outcome sequence. The build and test suite pass cleanly (39/39 tests, zero type errors) per the verification note.

**Watch for:** REOPEN is gated too narrowly — it only transitions out of `cleared` and silently ignores other `result` states, including `timeout`. The plan called for `result` broadly. The test for "REOPEN does nothing from a non-cleared result" was written to match this narrower behavior, so the test passes but the gap is real: a timeout player can never REOPEN. Also watch for the `showManual` flag in Inspect: it checks `!s.opened[o.id]` but the OPEN action fires on first click before Inspect renders, so the manual fallback may never display for objects that auto-open on click.

**Verdict**: NEEDS_CHANGES

## High-level view

The engine additions are structurally correct. `outcome`, `mapOverlay`, `REOPEN`, and `evidenceCount` are all present and the 8 new tests cover them. The narrowing of REOPEN to `cleared`-only diverges from the plan's "result/cleared" specification and leaves timeout players unable to reopen the investigation.

The Ledger and Radio components are convincingly redesigned as terminal consoles. The Ledger uses a `.term` panel with `> SUBMIT RECORD`, the Radio uses `.opscon` with frequency display, pending transmission line, and pulsing glow. Both preserve the exact aria-labels and dispatch calls that the integration tests rely on.

The Inspect component adds scanlines on terminals, a MALABAR AIR watermark on the boarding pass, and an OPERATIONAL UPDATE stamp on paper. The manual scan fallback (`ManualScanField`) is implemented with a `<details>` element, but a logic gap means `showManual` evaluates against `s.opened[o.id]` while the OPEN dispatch fires before the Inspect sheet renders, potentially hiding the fallback immediately.

The SVG art additions — rain, beacon pulse, conveyor belt, departure board cinematic states, OpsWall radio glow — are all present and structurally correct. The `WALLS` type now accepts `{ c, s? }` and `Room.tsx` passes `s` through. The Map overlay in MapView draws the amber dashed path with glow filter and label only when both `map` and `notice` have been opened.

The CSS additions are all in `styles.css` with no new npm packages. The intro fade, pin-card mount animation, board departure/resolved classes, and scanner flash are all accounted for in CSS and their respective components.

<details>
<summary>Issues (3)</summary>

1. **REOPEN gating too narrow** — `reducer` transitions on `REOPEN` only when `s.outcome === 'cleared'`; a `timeout` result returns the state unchanged. The plan and tests both say "result/cleared" as the guard. Add `|| s.outcome === 'timeout'` to the REOPEN condition so players who timed out can also reopen.
2. **`showManual` fires too late** — `Inspect` computes `showManual` as `!!(o.manualAlias && !s.opened[o.id] && !locked)`, but `onObj` dispatches `OPEN` before pushing the layer, so `s.opened[o.id]` is already `true` by the time `Inspect` renders. The manual fallback will never be visible for objects that are not locked. Gate on `!s.opened[o.id]` only for locked objects, or defer the OPEN dispatch to after the inspect sheet closes.
3. **`manualentry` `<details>` still shows after OPEN fires** — related to issue 2: even if the condition were fixed, the `<details>` will collapse to invisible on the next render because `s.opened` transitions synchronously. The UX intent (player types the alias, presses REGISTER, sees confirmation) requires a local "confirmed" state in `ManualScanField` that persists through at least one render after the dispatch.

</details>

<details>
<summary>Details</summary>

### REOPEN only transitions cleared, not timeout

In `game.ts` lines 149-152:

```ts
case 'REOPEN':
  if (s.phase !== 'result' || s.outcome !== 'cleared') return s;
  return { ...s, phase: 'play', result: null, outcome: null, wrong: s.wrong + 1, ... };
```

The guard `s.outcome !== 'cleared'` blocks the transition for any other outcome. A player who ran out of time lands at `phase: 'result'` with `outcome: 'timeout'`; dispatching `REOPEN` returns the unchanged state. The plan says "transitions from `result/cleared` back to `play`" meaning both `result` phase generally and `cleared` outcome specifically. The test `'REOPEN does nothing from a non-cleared result'` was written to match the current narrow behavior, so it passes — but it was written to test a win outcome, not a timeout. A timeout player gets silently stuck.

Fix: change the guard to `s.outcome !== 'cleared' && s.outcome !== 'timeout'`, or just `s.outcome === null` to block it from non-result states.

### Manual scan fallback visibility gap

In `App.tsx`, `openObj` dispatches before pushing the layer:

```ts
const openObj = (o: Obj) => {
  dispatch({ type: 'OPEN', objId: o.id });            // sets s.opened[o.id] = true
  push({ type: o.kind === 'person' ? 'talk' : 'obj', id: o.id });
};
```

In `Inspect.tsx`:

```ts
const showManual = !!(o.manualAlias && !s.opened[o.id] && !locked);
```

By the time the `<Inspect>` component renders, `s.opened[o.id]` is already `true`. For unlocked objects with a `manualAlias` (pass, notice, receipt, tag), `showManual` will always be `false`. The `<details>` block never appears.

The manual entry is intended for the physical artifact scanning workflow: a player points the webcam at a printed card, the scanner fires `OPEN` on the object directly — but the fallback is for when the webcam isn't available. In that flow, the player has not yet opened the object, so `s.opened[o.id]` is false. The problem only exists when the player clicks the room hotspot (which fires `openObj`). One fix: change `openObj` to not dispatch `OPEN` for objects that have a `manualAlias` and are not locked — let the inspect sheet handle the open. This keeps the webcam scanner path (which dispatches `OPEN` directly) working as-is.

### Checklist verification: all 26 items

**Items confirmed passing (confirmed by reading code):**

1. `State.outcome` and `State.mapOverlay` present — confirmed, `game.ts` lines 38-39; `initial` sets both to `null`/`false`.
2. `finish()` accepts outcome param — confirmed, `game.ts` line 91; TICK uses `'timeout'`; SUBMIT detects `'clear'` → `'cleared'`; win → `'win'`.
3. `REOPEN` action exists — confirmed in `Action` union and reducer. **Gating concern: see above.**
4. `evidenceCount` exported — confirmed, `game.ts` line 94.
5. `manualAlias` added to `Obj` — confirmed, `types.ts` line 46.
6. Nila objects have `manualAlias` values — confirmed: `pass: 'PASS-22C'`, `notice: 'NOTICE-G3'`, `receipt: 'REC-H2'`, `tag: 'TAG-482915'` in `cases.ts`.
7. Tests cover outcome, REOPEN, mapOverlay — confirmed, 8 tests in the `describe('outcome and mapOverlay')` block. The REOPEN test passes because it only tests the `cleared` path; timeout path is not covered.
8. Ledger terminal UI — confirmed: `.term termledger` panel, `OPERATIONS RECORD RECONCILIATION TERMINAL` title, `> SUBMIT RECORD` button with `aria-label="File ledger"`.
9. Radio console — confirmed: `.opscon radio`, `OPS FREQ 121.9 ● GATE 13`, `■ RADIO LOCKED`/`■ READY`, pending transmission line, `pulsing` class on Transmit when both picks selected.
10. Inspect scanline overlay for terminal kind — confirmed, `.scanlines` div with `aria-hidden` in `Artifact` terminal case.
11. Inspect MALABAR AIR watermark on pass — confirmed, `.pass-watermark` div in pass case.
12. Inspect OPERATIONAL UPDATE stamp on paper — confirmed, `.op-stamp` div in paper case.
13. `ManualScanField` with collapsible `<details>` — confirmed in `Inspect.tsx`. **Visibility concern: see above.**
14. Keyboard shortcuts in `App.tsx` — confirmed: second `useEffect` handles Escape, I/i, M/m with correct guards.
15. Scanner flash animation — confirmed: `flash` state, `setFlash(true)` before `cb.current(text)`, `.scanflash` div in JSX.
16. Scanner diegetic error — confirmed: `.term scanerr` block with `HAND SCANNER OFFLINE`.
17. Scanner `.scanframe` with `.scanreticle` corner spans — confirmed.
18. `MapView.overlay` prop — confirmed; amber dashed path Gate 13 → H2, glow filter, `← Group 3 redirected` label.
19. `Inspect` passes `s.mapOverlay` to MapView — confirmed in map case of `Artifact`.
20. `WindowWall` beacon pulse — confirmed: two circles at cx=560, cy=400 with `<animate>` elements.
21. `WindowWall` rain effect — confirmed: 28 lines via `RAIN_LINES`, `clipPath="url(#rainclip)"`, `animateTransform` elements.
22. `BagWall` conveyor animation — confirmed: 10 stripe rects with `animateTransform`, clipped by `beltclip`.
23. `GateWall` accepts `s?: State` — confirmed; shows `DEPARTED`/`RECONCILIATION IN PROGRESS`/`ON HOLD` based on `s.outcome`.
24. `OpsWall` radio bloom — confirmed: circle with opacity driven by `evCount >= 4 && !radioReady`.
25. `WALLS` type updated — confirmed: `Record<Exclude<ViewId, 'ops'>, (a: { c: CaseDef; s?: State }) => SceneBits>`.
26. `Room.tsx` passes `s` to `WALLS[view]` — confirmed.
27. Pin cards have `--rot` CSS variable — confirmed in `Wall.tsx` Pinboard; `@keyframes pinmount` in `styles.css`.
28. Intro fade-in — confirmed: `.intro { animation: fadein 1.2s ease-out }` in `styles.css`; reduced-motion guard updated.
29. Report UNRESOLVED/REOPEN for cleared — confirmed: cleared branch in `Report.tsx` renders `.bigstamp.lose`, narrative, and Reopen Incident button.
30. Report RESOLVED + terminal line for win — confirmed: win path renders `.term` block with departure message.
31. Board HOLD/WIN/DEPARTED handled distinctly — confirmed: `board.hold`, `board.resolved`, `board.departed` classes applied by outcome; CSS sets colors correctly.
32. All CSS in `styles.css` — confirmed; no inline style injection beyond `position: relative` and `marginTop` on specific elements.
33. No new npm packages — confirmed; no changes to `package.json`.
34. Thomas and Sana names preserved in `cases.ts` — confirmed: `who: 'Sana'` (agent), `who: 'Thomas'` (relative), `flight: 'MA 613'`.
35. Build and tests pass per verify.md — confirmed per coder's report: 39/39 tests, tsc exit 0, vite build clean.

</details>

<details>
<summary>File map</summary>

| File | What changed |
|------|--------------|
| `src/engine/game.ts` | Added `outcome`, `mapOverlay` to State; `REOPEN` action; `finish()` outcome param; `mapOverlay` in OPEN; `evidenceCount` export |
| `src/engine/types.ts` | Added `manualAlias?: string` to `Obj` interface |
| `src/engine/cases.ts` | Added `manualAlias` to 4 nila objects; fixed receipt event label |
| `src/engine/game.test.ts` | Added 8 tests for outcome, REOPEN, and mapOverlay behaviors |
| `src/App.tsx` | Added keyboard shortcut effect (Esc/I/M); passes `outcome` to Board; shows Report for cleared outcome |
| `src/styles.css` | Added terminal ledger, radio console, artifact overlays, scanner, pin-card, intro, board outcome CSS |
| `src/components/Wall.tsx` | Ledger → terminal UI; Radio → opscon console; Pinboard pin cards use `--rot` CSS variable |
| `src/components/Inspect.tsx` | `ManualScanField` component; artifact overlays (scanlines, watermark, stamp); MapView overlay wired |
| `src/components/Scanner.tsx` | Flash state; scanframe/scanreticle structure; diegetic error block |
| `src/components/art.tsx` | Rain, beacon, conveyor, GateWall cinematic states, OpsWall radio glow, WALLS type |
| `src/components/Room.tsx` | Passes `s` to `WALLS[view]` call |
| `src/components/Board.tsx` | `outcome` prop; `resolved`/`departed` CSS class application |
| `src/components/Intro.tsx` | No code change (CSS fade-in applied via existing `.intro` class) |
| `src/components/Report.tsx` | Cleared branch (UNRESOLVED + Reopen); win branch adds terminal departure line |
| `src/components/MapView.tsx` | `overlay` prop; amber path with glow filter; Group 3 label |

Full diff: `git diff main` from `c:\Users\LENOVO\Downloads\gate13-repo (1)\gate13`

</details>
