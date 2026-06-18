# Der Lothar-Check Board — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline, touch-driven iPad board where a presenter drags FIFA World Cup 2026 nations (German names) from a scrollable list onto a free-placement board, where each becomes a circular flag + FIFA trigramme token that can be moved, removed, or reset.

**Architecture:** A fixed 2360×1640 stage (the PSD canvas) scaled to the viewport with a CSS transform. Pure, immutable TypeScript modules (state/geometry/persist/selectors) hold all logic and are unit-tested; thin DOM/Pointer-Events modules (render/drag/main) do the wiring. A committed Python script exports the PSD backdrop, downloads flags, and generates the team data. esbuild bundles `src/main.ts` into a single `assets/app.js` (required because `file://` blocks ES-module and `fetch` loading on iOS Safari).

**Tech Stack:** TypeScript (strict), esbuild (bundle), Vitest + jsdom (tests), Python 3 + psd_tools (asset export), Pointer Events (touch).

## Global Constraints

- Runtime is **fully offline** from a copied folder opened as `index.html` in iPad Safari — no server, no network calls, no CDN at runtime, no `fetch()`, no ES-module `import` in the browser (bundle to one classic-script `assets/app.js`).
- Stage size is exactly **2360 × 1640** px (PSD canvas). All placement coordinates are stage pixels; token coordinates are the token **center**.
- All state transitions are **immutable** — return a new `BoardState`, never mutate the input.
- Source-list panel rectangle (stage px): **x 1973, y 283, w 303, h 1092** (from PSD `Countries` group).
- Colors: field `#0F2F25`, list rows `#09302E`, title/text white `#FFFFFF`.
- Codes are **FIFA trigramme** (GER, ESP, NED, …). Team list = the **48** nations in the spec.
- Fonts: Gotham OTFs from `/Users/iasi/Documents/Gotham 3.202` (GothamCond-Black/Bold).
- `localStorage` key: `lothar-board-v1`.

---

### Task 1: Project scaffolding + state module

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`
- Create: `src/types.ts`
- Create: `src/state.ts`
- Test: `tests/state.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `types.ts`: `type Team = { id: string; de: string; code: string; iso2: string; flagFile: string }`; `type Placed = { teamId: string; x: number; y: number }`; `type BoardState = { placed: Placed[] }`.
  - `state.ts`: `createInitialState(): BoardState`, `isPlaced(s: BoardState, teamId: string): boolean`, `placeTeam(s: BoardState, teamId: string, x: number, y: number): BoardState`, `moveTeam(s: BoardState, teamId: string, x: number, y: number): BoardState`, `removeTeam(s: BoardState, teamId: string): BoardState`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "lothar-check",
  "private": true,
  "type": "module",
  "scripts": {
    "export": "python3 scripts/export_assets.py",
    "typecheck": "tsc --noEmit",
    "build": "esbuild src/main.ts --bundle --format=iife --outfile=assets/app.js",
    "test": "vitest run"
  },
  "devDependencies": {
    "esbuild": "^0.24.0",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
```

- [ ] **Step 4: Install dev dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Create `src/types.ts`**

```ts
export type Team = {
  id: string;       // stable id, equals iso2 except gb-eng / gb-sct
  de: string;       // German display name
  code: string;     // FIFA trigramme, e.g. "GER"
  iso2: string;     // ISO2 reference, e.g. "de"
  flagFile: string; // relative path, e.g. "assets/flags/de.png"
};

export type Placed = { teamId: string; x: number; y: number }; // x,y = token center in stage px

export type BoardState = { placed: Placed[] };
```

- [ ] **Step 6: Write the failing test `tests/state.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { createInitialState, isPlaced, placeTeam, moveTeam, removeTeam } from '../src/state';

describe('state transitions', () => {
  it('starts empty', () => {
    expect(createInitialState()).toEqual({ placed: [] });
  });

  it('placeTeam adds a placed token and does not mutate input', () => {
    const s0 = createInitialState();
    const s1 = placeTeam(s0, 'de', 100, 200);
    expect(s1.placed).toEqual([{ teamId: 'de', x: 100, y: 200 }]);
    expect(s0.placed).toEqual([]); // immutability
    expect(isPlaced(s1, 'de')).toBe(true);
  });

  it('placeTeam ignores a team that is already placed', () => {
    const s1 = placeTeam(createInitialState(), 'de', 10, 10);
    const s2 = placeTeam(s1, 'de', 999, 999);
    expect(s2.placed).toEqual([{ teamId: 'de', x: 10, y: 10 }]);
  });

  it('moveTeam updates only the target coordinates', () => {
    const s1 = placeTeam(placeTeam(createInitialState(), 'de', 10, 10), 'fr', 20, 20);
    const s2 = moveTeam(s1, 'de', 300, 400);
    expect(s2.placed).toContainEqual({ teamId: 'de', x: 300, y: 400 });
    expect(s2.placed).toContainEqual({ teamId: 'fr', x: 20, y: 20 });
    expect(s1.placed).toContainEqual({ teamId: 'de', x: 10, y: 10 }); // immutability
  });

  it('removeTeam drops the token', () => {
    const s1 = placeTeam(createInitialState(), 'de', 10, 10);
    const s2 = removeTeam(s1, 'de');
    expect(isPlaced(s2, 'de')).toBe(false);
    expect(isPlaced(s1, 'de')).toBe(true); // immutability
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../src/state`.

- [ ] **Step 8: Create `src/state.ts`**

```ts
import { BoardState } from './types';

export function createInitialState(): BoardState {
  return { placed: [] };
}

export function isPlaced(state: BoardState, teamId: string): boolean {
  return state.placed.some((p) => p.teamId === teamId);
}

export function placeTeam(state: BoardState, teamId: string, x: number, y: number): BoardState {
  if (isPlaced(state, teamId)) return state;
  return { placed: [...state.placed, { teamId, x, y }] };
}

export function moveTeam(state: BoardState, teamId: string, x: number, y: number): BoardState {
  return { placed: state.placed.map((p) => (p.teamId === teamId ? { teamId, x, y } : p)) };
}

export function removeTeam(state: BoardState, teamId: string): BoardState {
  return { placed: state.placed.filter((p) => p.teamId !== teamId) };
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (5 tests).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore src/types.ts src/state.ts tests/state.test.ts
git commit -m "feat: scaffolding and immutable board state module"
```

---

### Task 2: Geometry module

**Files:**
- Create: `src/geometry.ts`
- Test: `tests/geometry.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `STAGE_W = 2360`, `STAGE_H = 1640`, `LIST_RECT = { x: 1973, y: 283, w: 303, h: 1092 }`; `type Fit = { scale: number; offsetX: number; offsetY: number }`; `computeFit(viewportW: number, viewportH: number): Fit`; `viewportToStage(clientX: number, clientY: number, fit: Fit): { x: number; y: number }`; `isOverList(stageX: number, stageY: number): boolean`.

- [ ] **Step 1: Write the failing test `tests/geometry.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeFit, viewportToStage, isOverList, STAGE_W, STAGE_H } from '../src/geometry';

describe('geometry', () => {
  it('computeFit letterboxes to the limiting dimension', () => {
    // Wider-than-stage viewport -> height is the limit
    const fit = computeFit(4000, 1640);
    expect(fit.scale).toBeCloseTo(1, 5);
    expect(fit.offsetX).toBeCloseTo((4000 - STAGE_W) / 2, 5);
    expect(fit.offsetY).toBeCloseTo(0, 5);
  });

  it('viewportToStage inverts computeFit (round-trip of stage center)', () => {
    const fit = computeFit(1180, 820);
    const cx = fit.offsetX + (STAGE_W / 2) * fit.scale;
    const cy = fit.offsetY + (STAGE_H / 2) * fit.scale;
    const p = viewportToStage(cx, cy, fit);
    expect(p.x).toBeCloseTo(STAGE_W / 2, 3);
    expect(p.y).toBeCloseTo(STAGE_H / 2, 3);
  });

  it('isOverList covers the list rectangle and excludes the board', () => {
    expect(isOverList(2100, 800)).toBe(true);   // inside list
    expect(isOverList(1973, 283)).toBe(true);    // top-left corner
    expect(isOverList(1000, 800)).toBe(false);   // left board area
    expect(isOverList(2100, 1500)).toBe(false);  // below list
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../src/geometry`.

- [ ] **Step 3: Create `src/geometry.ts`**

```ts
export const STAGE_W = 2360;
export const STAGE_H = 1640;
export const LIST_RECT = { x: 1973, y: 283, w: 303, h: 1092 };

export type Fit = { scale: number; offsetX: number; offsetY: number };

export function computeFit(viewportW: number, viewportH: number): Fit {
  const scale = Math.min(viewportW / STAGE_W, viewportH / STAGE_H);
  const offsetX = (viewportW - STAGE_W * scale) / 2;
  const offsetY = (viewportH - STAGE_H * scale) / 2;
  return { scale, offsetX, offsetY };
}

export function viewportToStage(clientX: number, clientY: number, fit: Fit): { x: number; y: number } {
  return { x: (clientX - fit.offsetX) / fit.scale, y: (clientY - fit.offsetY) / fit.scale };
}

export function isOverList(stageX: number, stageY: number): boolean {
  return (
    stageX >= LIST_RECT.x &&
    stageX <= LIST_RECT.x + LIST_RECT.w &&
    stageY >= LIST_RECT.y &&
    stageY <= LIST_RECT.y + LIST_RECT.h
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/geometry.ts tests/geometry.test.ts
git commit -m "feat: stage-fit geometry and list hit-testing"
```

---

### Task 3: Persistence module

**Files:**
- Create: `src/persist.ts`
- Test: `tests/persist.test.ts`

**Interfaces:**
- Consumes: `BoardState` from `types.ts`.
- Produces: `saveState(s: BoardState): void`, `loadState(): BoardState | null`.

- [ ] **Step 1: Write the failing test `tests/persist.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { saveState, loadState } from '../src/persist';

// Minimal localStorage stub for the Node test environment
beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
});

describe('persist', () => {
  it('returns null when nothing is stored', () => {
    expect(loadState()).toBeNull();
  });

  it('round-trips a board state', () => {
    saveState({ placed: [{ teamId: 'de', x: 1, y: 2 }] });
    expect(loadState()).toEqual({ placed: [{ teamId: 'de', x: 1, y: 2 }] });
  });

  it('returns null for corrupt JSON', () => {
    (globalThis as any).localStorage.setItem('lothar-board-v1', '{not json');
    expect(loadState()).toBeNull();
  });

  it('returns null when shape is wrong', () => {
    (globalThis as any).localStorage.setItem('lothar-board-v1', '{"foo":1}');
    expect(loadState()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../src/persist`.

- [ ] **Step 3: Create `src/persist.ts`**

```ts
import { BoardState } from './types';

const KEY = 'lothar-board-v1';

export function saveState(state: BoardState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable / quota — ignore, board still works in-memory */
  }
}

export function loadState(): BoardState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.placed)) return parsed as BoardState;
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/persist.ts tests/persist.test.ts
git commit -m "feat: localStorage persistence with corrupt-data guards"
```

---

### Task 4: Selectors (available teams)

**Files:**
- Create: `src/selectors.ts`
- Test: `tests/selectors.test.ts`

**Interfaces:**
- Consumes: `Team`, `BoardState` from `types.ts`.
- Produces: `availableTeams(allTeams: Team[], state: BoardState): Team[]` — returns teams not currently placed, preserving the original order of `allTeams`.

- [ ] **Step 1: Write the failing test `tests/selectors.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { availableTeams } from '../src/selectors';
import type { Team } from '../src/types';

const T = (id: string): Team => ({ id, de: id, code: id.toUpperCase(), iso2: id, flagFile: `assets/flags/${id}.png` });

describe('availableTeams', () => {
  const all = [T('ar'), T('de'), T('fr'), T('br')];

  it('returns all teams when none placed, preserving order', () => {
    expect(availableTeams(all, { placed: [] }).map((t) => t.id)).toEqual(['ar', 'de', 'fr', 'br']);
  });

  it('excludes placed teams but keeps original order of the rest', () => {
    const state = { placed: [{ teamId: 'fr', x: 0, y: 0 }, { teamId: 'ar', x: 0, y: 0 }] };
    expect(availableTeams(all, state).map((t) => t.id)).toEqual(['de', 'br']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../src/selectors`.

- [ ] **Step 3: Create `src/selectors.ts`**

```ts
import { Team, BoardState } from './types';

export function availableTeams(allTeams: Team[], state: BoardState): Team[] {
  const placed = new Set(state.placed.map((p) => p.teamId));
  return allTeams.filter((t) => !placed.has(t.id));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/selectors.ts tests/selectors.test.ts
git commit -m "feat: availableTeams selector preserving canonical order"
```

---

### Task 5: Asset export script (background, flags, fonts, team data)

**Files:**
- Create: `scripts/export_assets.py`
- Generates: `assets/background.png`, `assets/flags/<id>.png` (48), `assets/fonts/*.otf`, `assets/teams.json`, `src/generated/teams.ts`

**Interfaces:**
- Consumes: `Lothar_Flags_v03.psd`; insyde/flagcdn flag CDNs (download-time only).
- Produces: `src/generated/teams.ts` exporting `const TEAMS: Team[]` (consumed by `teams.ts` in Task 7).

- [ ] **Step 1: Create `scripts/export_assets.py`**

```python
#!/usr/bin/env python3
"""One-time, reproducible asset export for the Lothar-Check board.

Outputs:
  assets/background.png         board backdrop (PSD, Flags + Countries hidden)
  assets/flags/<id>.png         48 flag images (square, downloaded)
  assets/fonts/*.otf            Gotham fonts (copied)
  assets/teams.json             team data (reference + tests)
  src/generated/teams.ts        team data (bundled into app.js)

Requires: psd_tools, Pillow (both already installed). Network needed ONLY here.
"""
import json
import os
import shutil
import urllib.request
from psd_tools import PSDImage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PSD_PATH = os.path.join(ROOT, "Lothar_Flags_v03.psd")
FONT_SRC = "/Users/iasi/Documents/Gotham 3.202"
ASSETS = os.path.join(ROOT, "assets")
FLAGS = os.path.join(ASSETS, "flags")
FONTS = os.path.join(ASSETS, "fonts")
GEN = os.path.join(ROOT, "src", "generated")

# (German name, id, FIFA code). id == iso2 except England/Scotland.
TEAMS = [
    ("Argentinien", "ar", "ARG"), ("Australien", "au", "AUS"), ("Ägypten", "eg", "EGY"),
    ("Algerien", "dz", "ALG"), ("Belgien", "be", "BEL"), ("Bosnien und Herzegowina", "ba", "BIH"),
    ("Brasilien", "br", "BRA"), ("Curaçao", "cw", "CUW"), ("Deutschland", "de", "GER"),
    ("DR Kongo", "cd", "COD"), ("Ecuador", "ec", "ECU"), ("Elfenbeinküste", "ci", "CIV"),
    ("England", "gb-eng", "ENG"), ("Frankreich", "fr", "FRA"), ("Ghana", "gh", "GHA"),
    ("Haiti", "ht", "HAI"), ("Irak", "iq", "IRQ"), ("Iran", "ir", "IRN"),
    ("Japan", "jp", "JPN"), ("Jordanien", "jo", "JOR"), ("Kanada", "ca", "CAN"),
    ("Kap Verde", "cv", "CPV"), ("Katar", "qa", "QAT"), ("Kolumbien", "co", "COL"),
    ("Kroatien", "hr", "CRO"), ("Marokko", "ma", "MAR"), ("Mexiko", "mx", "MEX"),
    ("Neuseeland", "nz", "NZL"), ("Niederlande", "nl", "NED"), ("Norwegen", "no", "NOR"),
    ("Österreich", "at", "AUT"), ("Panama", "pa", "PAN"), ("Paraguay", "py", "PAR"),
    ("Portugal", "pt", "POR"), ("Saudi-Arabien", "sa", "KSA"), ("Schottland", "gb-sct", "SCO"),
    ("Schweden", "se", "SWE"), ("Schweiz", "ch", "SUI"), ("Senegal", "sn", "SEN"),
    ("Spanien", "es", "ESP"), ("Südafrika", "za", "RSA"), ("Südkorea", "kr", "KOR"),
    ("Tschechien", "cz", "CZE"), ("Tunesien", "tn", "TUN"), ("Türkei", "tr", "TUR"),
    ("Uruguay", "uy", "URU"), ("USA", "us", "USA"), ("Usbekistan", "uz", "UZB"),
]

# IDs not on the insyde country endpoint -> flagcdn fallback.
FLAGCDN = {"gb-eng": "gb-eng", "gb-sct": "gb-sct"}


def export_background():
    psd = PSDImage.open(PSD_PATH)
    for layer in psd:
        if layer.name in ("Flags", "Countries"):
            layer.visible = False
    img = psd.composite(force=True)
    img.convert("RGB").save(os.path.join(ASSETS, "background.png"))
    print("background.png", img.size)


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "lothar-export"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    with open(dest, "wb") as f:
        f.write(data)


def export_flags():
    os.makedirs(FLAGS, exist_ok=True)
    for de, tid, code in TEAMS:
        dest = os.path.join(FLAGS, f"{tid}.png")
        if tid in FLAGCDN:
            url = f"https://flagcdn.com/w160/{FLAGCDN[tid]}.png"
        else:
            url = f"https://flags.api.insyde.one/img/c/{tid}/square/h160.png"
        try:
            download(url, dest)
            print("flag", tid, "OK")
        except Exception as e:
            print("flag", tid, "FAILED", url, e)
            raise


def export_fonts():
    os.makedirs(FONTS, exist_ok=True)
    for name in os.listdir(FONT_SRC):
        if name.lower().endswith(".otf"):
            shutil.copy(os.path.join(FONT_SRC, name), os.path.join(FONTS, name))
    print("fonts copied")


def write_team_data():
    os.makedirs(GEN, exist_ok=True)
    records = [
        {"id": tid, "de": de, "code": code, "iso2": tid, "flagFile": f"assets/flags/{tid}.png"}
        for de, tid, code in TEAMS
    ]
    with open(os.path.join(ASSETS, "teams.json"), "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    ts = (
        "// AUTO-GENERATED by scripts/export_assets.py — do not edit by hand.\n"
        "import { Team } from '../types';\n\n"
        "export const TEAMS: Team[] = " + json.dumps(records, ensure_ascii=False, indent=2) + ";\n"
    )
    with open(os.path.join(GEN, "teams.ts"), "w", encoding="utf-8") as f:
        f.write(ts)
    print("teams data:", len(records), "teams")


if __name__ == "__main__":
    os.makedirs(ASSETS, exist_ok=True)
    export_background()
    export_flags()
    export_fonts()
    write_team_data()
    print("DONE")
```

- [ ] **Step 2: Run the export script**

Run: `python3 scripts/export_assets.py`
Expected: prints `background.png (2360, 1640)`, `flag <id> OK` for 48 ids, `fonts copied`, `teams data: 48 teams`, `DONE`. No `FAILED` lines.

- [ ] **Step 3: Verify outputs exist and counts are right**

Run:
```bash
echo "flags:" $(ls assets/flags | wc -l); \
python3 -c "import json;print('teams.json:', len(json.load(open('assets/teams.json'))))"; \
ls assets/background.png src/generated/teams.ts; ls assets/fonts
```
Expected: `flags: 48`, `teams.json: 48`, both files listed, OTF fonts listed.

- [ ] **Step 4: Visually confirm the backdrop**

Read `assets/background.png` and confirm: title "DER LOTHAR-CHECK", BILD logo, two empty panels, red down-arrow, and NO flag grid / NO country list text baked in.

- [ ] **Step 5: Commit**

```bash
git add scripts/export_assets.py assets/background.png assets/flags assets/fonts assets/teams.json src/generated/teams.ts
git commit -m "feat: PSD asset export, 48 flags, fonts, generated team data"
```

---

### Task 6: Render module (list + tokens)

**Files:**
- Create: `src/render.ts`
- Test: `tests/render.test.ts`

**Interfaces:**
- Consumes: `Team`, `Placed` from `types.ts`.
- Produces: `renderList(container: HTMLElement, teams: Team[]): void` — one `.list-row[data-team-id]` per team, text = `team.de`; `renderTokens(board: HTMLElement, placed: Placed[], byId: Map<string, Team>): void` — one `.token[data-team-id]` per placed team, positioned by `left`/`top` (center via CSS), containing `img.token-flag` + `span.token-code`.

- [ ] **Step 1: Write the failing test `tests/render.test.ts`**

```ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderList, renderTokens } from '../src/render';
import type { Team } from '../src/types';

const team = (id: string): Team => ({ id, de: `Name-${id}`, code: id.toUpperCase(), iso2: id, flagFile: `assets/flags/${id}.png` });

let host: HTMLElement;
beforeEach(() => { host = document.createElement('div'); });

describe('renderList', () => {
  it('renders one row per team with id and German name', () => {
    renderList(host, [team('de'), team('fr')]);
    const rows = host.querySelectorAll('.list-row');
    expect(rows.length).toBe(2);
    expect((rows[0] as HTMLElement).dataset.teamId).toBe('de');
    expect(rows[0].textContent).toBe('Name-de');
  });

  it('clears previous content on re-render', () => {
    renderList(host, [team('de'), team('fr')]);
    renderList(host, [team('br')]);
    expect(host.querySelectorAll('.list-row').length).toBe(1);
  });
});

describe('renderTokens', () => {
  it('renders a positioned token with flag and code', () => {
    const byId = new Map([['de', team('de')]]);
    renderTokens(host, [{ teamId: 'de', x: 120, y: 240 }], byId);
    const tok = host.querySelector('.token') as HTMLElement;
    expect(tok.dataset.teamId).toBe('de');
    expect(tok.style.left).toBe('120px');
    expect(tok.style.top).toBe('240px');
    expect((tok.querySelector('img.token-flag') as HTMLImageElement).getAttribute('src')).toBe('assets/flags/de.png');
    expect(tok.querySelector('.token-code')!.textContent).toBe('DE');
  });

  it('skips a placed id with no matching team', () => {
    renderTokens(host, [{ teamId: 'zz', x: 0, y: 0 }], new Map());
    expect(host.querySelectorAll('.token').length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../src/render`.

- [ ] **Step 3: Create `src/render.ts`**

```ts
import { Team, Placed } from './types';

export function renderList(container: HTMLElement, teams: Team[]): void {
  container.innerHTML = '';
  for (const t of teams) {
    const row = document.createElement('div');
    row.className = 'list-row';
    row.dataset.teamId = t.id;
    row.textContent = t.de;
    container.appendChild(row);
  }
}

export function renderTokens(board: HTMLElement, placed: Placed[], byId: Map<string, Team>): void {
  board.innerHTML = '';
  for (const p of placed) {
    const team = byId.get(p.teamId);
    if (!team) continue;
    const tok = document.createElement('div');
    tok.className = 'token';
    tok.dataset.teamId = p.teamId;
    tok.style.left = `${p.x}px`;
    tok.style.top = `${p.y}px`;

    const img = document.createElement('img');
    img.className = 'token-flag';
    img.src = team.flagFile;
    img.alt = team.de;

    const code = document.createElement('span');
    code.className = 'token-code';
    code.textContent = team.code;

    tok.append(img, code);
    board.appendChild(tok);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all suites green).

- [ ] **Step 5: Commit**

```bash
git add src/render.ts tests/render.test.ts
git commit -m "feat: list and token DOM rendering"
```

---

### Task 7: Drag controller, app wiring, page shell, build, manual verification

**Files:**
- Create: `src/teams.ts`, `src/drag.ts`, `src/main.ts`
- Create: `index.html`, `assets/style.css`
- Build: `assets/app.js` (generated by esbuild, committed)

**Interfaces:**
- Consumes: `ALL_TEAMS`/`teamsById` (`teams.ts`), `availableTeams` (`selectors.ts`), state transitions (`state.ts`), `renderList`/`renderTokens` (`render.ts`), `computeFit`/`viewportToStage`/`isOverList`/`Fit` (`geometry.ts`), `saveState`/`loadState` (`persist.ts`), `initDrag` (`drag.ts`), `TEAMS` (`src/generated/teams.ts`).
- Produces: `teams.ts`: `ALL_TEAMS: Team[]`, `teamsById(teams?: Team[]): Map<string, Team>`. `drag.ts`: `type DragCallbacks = { onPlace(teamId,x,y): void; onMove(teamId,x,y): void; onRemove(teamId): void }`, `initDrag(stage, listEl, boardEl, getFit: () => Fit, cb: DragCallbacks): void`.

> Note: this task is wiring over already-tested pure modules (state/geometry/render/persist/selectors). Its deliverable is verified by build success + the manual iPad checklist in Step 9; Pointer-Events behavior cannot be meaningfully unit-tested in jsdom.

- [ ] **Step 1: Create `src/teams.ts`**

```ts
import { Team } from './types';
import { TEAMS } from './generated/teams';

export const ALL_TEAMS: Team[] = TEAMS;

export function teamsById(teams: Team[] = ALL_TEAMS): Map<string, Team> {
  return new Map(teams.map((t) => [t.id, t]));
}
```

- [ ] **Step 2: Create `src/drag.ts`**

```ts
import { Fit, viewportToStage, isOverList } from './geometry';

export type DragCallbacks = {
  onPlace(teamId: string, x: number, y: number): void; // from list onto board
  onMove(teamId: string, x: number, y: number): void;  // reposition a placed token
  onRemove(teamId: string): void;                       // a placed token dropped over the list
};

const DRAG_THRESHOLD = 8; // px of movement before a press becomes a drag (lets the list scroll)

type Active = {
  teamId: string;
  source: 'list' | 'board';
  ghost: HTMLElement;
  startX: number;
  startY: number;
  dragging: boolean;
  pointerId: number;
};

export function initDrag(
  stage: HTMLElement,
  _listEl: HTMLElement,
  _boardEl: HTMLElement,
  getFit: () => Fit,
  cb: DragCallbacks,
): void {
  let active: Active | null = null;

  function onDown(e: PointerEvent): void {
    const el = (e.target as HTMLElement).closest('[data-team-id]') as HTMLElement | null;
    if (!el) return;
    const fromBoard = el.classList.contains('token');
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.classList.add('drag-ghost');
    ghost.style.display = 'none';
    document.body.appendChild(ghost);
    active = {
      teamId: el.dataset.teamId!,
      source: fromBoard ? 'board' : 'list',
      ghost,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      pointerId: e.pointerId,
    };
    stage.setPointerCapture(e.pointerId);
  }

  function onMove(e: PointerEvent): void {
    if (!active || e.pointerId !== active.pointerId) return;
    const dx = e.clientX - active.startX;
    const dy = e.clientY - active.startY;
    if (!active.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      active.dragging = true;
      active.ghost.style.display = '';
      active.ghost.style.transform = `translate(-50%, -50%) scale(${getFit().scale})`;
    }
    active.ghost.style.left = `${e.clientX}px`;
    active.ghost.style.top = `${e.clientY}px`;
  }

  function onUp(e: PointerEvent): void {
    if (!active || e.pointerId !== active.pointerId) return;
    const a = active;
    active = null;
    a.ghost.remove();
    try { stage.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    if (!a.dragging) return; // tap or scroll, not a drag
    const { x, y } = viewportToStage(e.clientX, e.clientY, getFit());
    if (isOverList(x, y)) {
      if (a.source === 'board') cb.onRemove(a.teamId);
      return; // list-to-list drop is a no-op
    }
    if (a.source === 'list') cb.onPlace(a.teamId, x, y);
    else cb.onMove(a.teamId, x, y);
  }

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
}
```

- [ ] **Step 3: Create `src/main.ts`**

```ts
import { ALL_TEAMS, teamsById } from './teams';
import { availableTeams } from './selectors';
import { createInitialState, placeTeam, moveTeam, removeTeam } from './state';
import { renderList, renderTokens } from './render';
import { computeFit, Fit } from './geometry';
import { saveState, loadState } from './persist';
import { initDrag } from './drag';
import { BoardState } from './types';

const stage = document.getElementById('stage') as HTMLElement;
const listEl = document.getElementById('list') as HTMLElement;
const boardEl = document.getElementById('board') as HTMLElement;
const resetBtn = document.getElementById('reset') as HTMLElement;

const byId = teamsById();
let state: BoardState = loadState() ?? createInitialState();
let fit: Fit = computeFit(window.innerWidth, window.innerHeight);

function applyFit(): void {
  fit = computeFit(window.innerWidth, window.innerHeight);
  stage.style.transform = `translate(${fit.offsetX}px, ${fit.offsetY}px) scale(${fit.scale})`;
}

function render(): void {
  renderList(listEl, availableTeams(ALL_TEAMS, state));
  renderTokens(boardEl, state.placed, byId);
}

function update(next: BoardState): void {
  state = next;
  saveState(state);
  render();
}

initDrag(stage, listEl, boardEl, () => fit, {
  onPlace: (id, x, y) => update(placeTeam(state, id, x, y)),
  onMove: (id, x, y) => update(moveTeam(state, id, x, y)),
  onRemove: (id) => update(removeTeam(state, id)),
});

resetBtn.addEventListener('click', () => update(createInitialState()));
window.addEventListener('resize', applyFit);

applyFit();
render();
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <title>Der Lothar-Check</title>
    <link rel="stylesheet" href="assets/style.css" />
  </head>
  <body>
    <div id="stage">
      <img id="bg" src="assets/background.png" alt="" />
      <div id="board"></div>
      <div id="list"></div>
      <button id="reset" type="button">Reset</button>
    </div>
    <script src="assets/app.js"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `assets/style.css`**

```css
@font-face {
  font-family: 'Gotham Cond';
  src: url('fonts/GothamCond-Bold.otf') format('opentype');
  font-weight: 700;
}
@font-face {
  font-family: 'Gotham Cond';
  src: url('fonts/GothamCond-Black.otf') format('opentype');
  font-weight: 900;
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  height: 100%;
  background: #0a1f18;
  overflow: hidden;
  font-family: 'Gotham Cond', sans-serif;
  -webkit-user-select: none;
  user-select: none;
}

#stage {
  position: absolute;
  top: 0;
  left: 0;
  width: 2360px;
  height: 1640px;
  transform-origin: 0 0;
}

#bg {
  position: absolute;
  inset: 0;
  width: 2360px;
  height: 1640px;
  pointer-events: none;
}

/* Source list — rebuilt over the PSD's empty Countries panel */
#list {
  position: absolute;
  left: 1973px;
  top: 283px;
  width: 303px;
  height: 1092px;
  overflow-y: auto;
  overflow-x: hidden;
}
.list-row {
  height: 57px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  color: #fff;
  font-weight: 700;
  font-size: 26px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  touch-action: none; /* dragging a row must not scroll the page */
}
.list-row:nth-child(odd)  { background: #09302e; }
.list-row:nth-child(even) { background: #0f3a36; }

/* Free-placement board surface */
#board {
  position: absolute;
  inset: 0;
}
.token {
  position: absolute;
  transform: translate(-50%, -50%); /* left/top is the token center */
  display: flex;
  align-items: center;
  gap: 14px;
  touch-action: none;
}
.token-flag {
  width: 79px;
  height: 79px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.15);
}
.token-code {
  color: #fff;
  font-weight: 900;
  font-size: 34px;
  letter-spacing: 1px;
}

/* Floating element that follows the finger while dragging */
.drag-ghost {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  opacity: 0.9;
  transform: translate(-50%, -50%);
}

#reset {
  position: absolute;
  left: 1973px;
  top: 1395px;
  width: 303px;
  height: 70px;
  border: none;
  border-radius: 8px;
  background: #c8102e;
  color: #fff;
  font-family: inherit;
  font-weight: 900;
  font-size: 30px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

- [ ] **Step 6: Type-check the whole project**

Run: `npm run typecheck`
Expected: no errors (the generated `src/generated/teams.ts` from Task 5 must exist).

- [ ] **Step 7: Build the bundle**

Run: `npm run build`
Expected: `assets/app.js` written, no errors.

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: all suites PASS.

- [ ] **Step 9: Manual verification**

Open `index.html` in a desktop browser first (mouse acts as a pointer), then on iPad Safari. Confirm each:
- Background fills the window centered, aspect ratio preserved; resizing keeps it centered.
- Right-hand list shows all 48 German names; the list scrolls vertically with a finger.
- Dragging a name onto the board drops a circular flag + code where the finger releases.
- A placed token can be dragged to a new position.
- Dragging a placed token back over the list removes it; it reappears in the list.
- The team is no longer offered in the list once placed (no duplicates).
- "Reset" clears all tokens and restores the full list.
- Reload the page: previously placed tokens are still there.

- [ ] **Step 10: Commit**

```bash
git add src/teams.ts src/drag.ts src/main.ts index.html assets/style.css assets/app.js
git commit -m "feat: drag controller, app wiring, page shell, and bundle"
```

---

## Notes for the implementer

- Run `npm run export` (Task 5) **before** `npm run typecheck`/`npm run build` — the build imports the generated `src/generated/teams.ts`.
- Network is used **only** by the export script. The shipped folder (`index.html`, `assets/`) has zero runtime network dependencies.
- If any flag download prints `FAILED`, the script raises; fix the URL/fallback for that id and re-run before committing assets.
- German team names are the working set from the spec; confirm against FIFA.de during Task 5 and adjust the `TEAMS` table if needed.
