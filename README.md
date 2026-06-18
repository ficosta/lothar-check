# Der Lothar-Check — Interactive Board

A touch-driven, **offline** board for a presenter to use live on an iPad. A scrollable
list of the 48 FIFA World Cup 2026 nations (German names) sits on the right; drag a nation
onto the board and it becomes a circular flag + FIFA-trigramme token that can be moved,
removed (drag it back onto the list), or cleared with **Reset**.

## Running it (the presenter)

Copy the whole folder to the iPad and open **`index.html`** in Safari. No internet, no
server — everything is local. The board fills the screen in landscape; placed teams are
remembered across an accidental reload.

What ships at runtime: `index.html`, `assets/app.js` (bundled), `assets/background.png`,
`assets/flags/`, `assets/fonts/`, `assets/style.css`, `assets/teams.json`.

## Development

```bash
npm install
npm run typecheck   # tsc --noEmit (strict)
npm test            # vitest — pure-logic unit tests (state/geometry/persist/selectors/render)
npm run build       # esbuild -> assets/app.js (single IIFE, no runtime imports/fetch)
```

Source layout (`src/`): `types`, `state` (immutable transitions), `geometry` (stage-fit +
list hit-test), `persist` (localStorage), `selectors`, `render` (DOM), `drag` (Pointer
Events controller), `main` (wiring), `generated/teams.ts` (auto-generated team data).

> The drag controller and DOM wiring have no unit tests — Pointer Events / touch can't be
> exercised in jsdom. Verify touch behavior on a real iPad (see the on-device checklist in
> `docs/superpowers/plans/2026-06-18-lothar-check-board.md`, Task 7 Step 9).

## Regenerating assets

Assets are produced once (network required, dev machine only) by:

```bash
npm run export      # python3 scripts/export_assets.py
```

It renders `background.png` from `Lothar_Flags_v03.psd`, downloads the 48 flags
(insyde.one; England/Scotland via flagcdn), copies the Gotham fonts, and writes the team
data. Prerequisites:

- `Lothar_Flags_v03.psd` present in the repo root.
- Python packages: `psd_tools`, `Pillow`, and **`aggdraw`** (needed by psd_tools to
  rasterize the PSD's vector shapes — `pip install aggdraw`).
- The Gotham OTFs at the path in `scripts/export_assets.py` (`FONT_SRC`); adjust if yours
  live elsewhere. The fonts are already committed under `assets/fonts/`, so a re-export is
  only needed if the design changes.

## Design docs

- Spec: `docs/superpowers/specs/2026-06-18-lothar-check-board-design.md`
- Plan: `docs/superpowers/plans/2026-06-18-lothar-check-board.md`
