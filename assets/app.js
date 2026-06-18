"use strict";
(() => {
  // src/generated/teams.ts
  var TEAMS = [
    {
      "id": "ar",
      "de": "Argentinien",
      "code": "ARG",
      "iso2": "ar",
      "flagFile": "assets/flags/ar.png"
    },
    {
      "id": "br",
      "de": "Brasilien",
      "code": "BRA",
      "iso2": "br",
      "flagFile": "assets/flags/br.png"
    },
    {
      "id": "de",
      "de": "Deutschland",
      "code": "GER",
      "iso2": "de",
      "flagFile": "assets/flags/de.png"
    },
    {
      "id": "ci",
      "de": "Elfenbeink\xFCste",
      "code": "CIV",
      "iso2": "ci",
      "flagFile": "assets/flags/ci.png"
    },
    {
      "id": "gb-eng",
      "de": "England",
      "code": "ENG",
      "iso2": "gb-eng",
      "flagFile": "assets/flags/gb-eng.png"
    },
    {
      "id": "fr",
      "de": "Frankreich",
      "code": "FRA",
      "iso2": "fr",
      "flagFile": "assets/flags/fr.png"
    },
    {
      "id": "gh",
      "de": "Ghana",
      "code": "GHA",
      "iso2": "gh",
      "flagFile": "assets/flags/gh.png"
    },
    {
      "id": "nl",
      "de": "Holland",
      "code": "NED",
      "iso2": "nl",
      "flagFile": "assets/flags/nl.png"
    },
    {
      "id": "jp",
      "de": "Japan",
      "code": "JPN",
      "iso2": "jp",
      "flagFile": "assets/flags/jp.png"
    },
    {
      "id": "ma",
      "de": "Marokko",
      "code": "MAR",
      "iso2": "ma",
      "flagFile": "assets/flags/ma.png"
    },
    {
      "id": "no",
      "de": "Norwegen",
      "code": "NOR",
      "iso2": "no",
      "flagFile": "assets/flags/no.png"
    },
    {
      "id": "at",
      "de": "\xD6sterreich",
      "code": "AUT",
      "iso2": "at",
      "flagFile": "assets/flags/at.png"
    },
    {
      "id": "pt",
      "de": "Portugal",
      "code": "POR",
      "iso2": "pt",
      "flagFile": "assets/flags/pt.png"
    },
    {
      "id": "se",
      "de": "Schweden",
      "code": "SWE",
      "iso2": "se",
      "flagFile": "assets/flags/se.png"
    },
    {
      "id": "ch",
      "de": "Schweiz",
      "code": "SUI",
      "iso2": "ch",
      "flagFile": "assets/flags/ch.png"
    },
    {
      "id": "es",
      "de": "Spanien",
      "code": "ESP",
      "iso2": "es",
      "flagFile": "assets/flags/es.png"
    },
    {
      "id": "kr",
      "de": "S\xFCdkorea",
      "code": "KOR",
      "iso2": "kr",
      "flagFile": "assets/flags/kr.png"
    },
    {
      "id": "tr",
      "de": "T\xFCrkei",
      "code": "TUR",
      "iso2": "tr",
      "flagFile": "assets/flags/tr.png"
    },
    {
      "id": "us",
      "de": "USA",
      "code": "USA",
      "iso2": "us",
      "flagFile": "assets/flags/us.png"
    }
  ];

  // src/teams.ts
  var ALL_TEAMS = TEAMS;
  function teamsById(teams = ALL_TEAMS) {
    return new Map(teams.map((t) => [t.id, t]));
  }

  // src/selectors.ts
  function availableTeams(allTeams, state2) {
    const placed = new Set(state2.placed.map((p) => p.teamId));
    return allTeams.filter((t) => !placed.has(t.id));
  }

  // src/state.ts
  function createInitialState() {
    return { placed: [] };
  }
  function isPlaced(state2, teamId) {
    return state2.placed.some((p) => p.teamId === teamId);
  }
  function placeTeam(state2, teamId, x, y) {
    if (isPlaced(state2, teamId)) return state2;
    return { placed: [...state2.placed, { teamId, x, y }] };
  }
  function moveTeam(state2, teamId, x, y) {
    return { placed: state2.placed.map((p) => p.teamId === teamId ? { teamId, x, y } : p) };
  }
  function removeTeam(state2, teamId) {
    return { placed: state2.placed.filter((p) => p.teamId !== teamId) };
  }

  // src/render.ts
  function renderList(container, teams) {
    container.innerHTML = "";
    for (const t of teams) {
      const row = document.createElement("div");
      row.className = "list-row";
      row.dataset.teamId = t.id;
      row.textContent = t.de;
      container.appendChild(row);
    }
  }
  function renderTokens(board, placed, byId2) {
    board.innerHTML = "";
    for (const p of placed) {
      const team = byId2.get(p.teamId);
      if (!team) continue;
      const tok = document.createElement("div");
      tok.className = "token";
      tok.dataset.teamId = p.teamId;
      tok.style.left = `${p.x}px`;
      tok.style.top = `${p.y}px`;
      const img = document.createElement("img");
      img.className = "token-flag";
      img.src = team.flagFile;
      img.alt = team.de;
      img.draggable = false;
      const code = document.createElement("span");
      code.className = "token-code";
      code.textContent = team.code;
      tok.append(img, code);
      board.appendChild(tok);
    }
  }

  // src/geometry.ts
  var STAGE_W = 2360;
  var STAGE_H = 1640;
  var LIST_RECT = { x: 1973, y: 283, w: 303, h: 1092 };
  function computeFit(viewportW, viewportH) {
    const scale = Math.min(viewportW / STAGE_W, viewportH / STAGE_H);
    const offsetX = (viewportW - STAGE_W * scale) / 2;
    const offsetY = (viewportH - STAGE_H * scale) / 2;
    return { scale, offsetX, offsetY };
  }
  function viewportToStage(clientX, clientY, fit2) {
    return { x: (clientX - fit2.offsetX) / fit2.scale, y: (clientY - fit2.offsetY) / fit2.scale };
  }
  function isOverList(stageX, stageY) {
    return stageX >= LIST_RECT.x && stageX <= LIST_RECT.x + LIST_RECT.w && stageY >= LIST_RECT.y && stageY <= LIST_RECT.y + LIST_RECT.h;
  }

  // src/persist.ts
  var KEY = "lothar-board-v1";
  function saveState(state2) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state2));
    } catch {
    }
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.placed)) return parsed;
      return null;
    } catch {
      return null;
    }
  }

  // src/drag.ts
  var DRAG_THRESHOLD = 8;
  function initDrag(stage2, _listEl, _boardEl, getFit, cb) {
    let active = null;
    function onDown(e) {
      const el = e.target.closest("[data-team-id]");
      if (!el) return;
      const fromBoard = el.classList.contains("token");
      const ghost = el.cloneNode(true);
      ghost.classList.add("drag-ghost");
      ghost.style.display = "none";
      document.body.appendChild(ghost);
      let grabOffsetX = 0;
      let grabOffsetY = 0;
      if (fromBoard) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        grabOffsetX = e.clientX - centerX;
        grabOffsetY = e.clientY - centerY;
      }
      active = {
        teamId: el.dataset.teamId,
        source: fromBoard ? "board" : "list",
        ghost,
        startX: e.clientX,
        startY: e.clientY,
        dragging: false,
        pointerId: e.pointerId,
        grabOffsetX,
        grabOffsetY
      };
      stage2.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!active || e.pointerId !== active.pointerId) return;
      const dx = e.clientX - active.startX;
      const dy = e.clientY - active.startY;
      if (!active.dragging) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        active.dragging = true;
        active.ghost.style.display = "";
        active.ghost.style.transform = `translate(-50%, -50%) scale(${getFit().scale})`;
      }
      active.ghost.style.left = `${e.clientX - active.grabOffsetX}px`;
      active.ghost.style.top = `${e.clientY - active.grabOffsetY}px`;
    }
    function onUp(e) {
      if (!active || e.pointerId !== active.pointerId) return;
      const a = active;
      active = null;
      a.ghost.remove();
      try {
        stage2.releasePointerCapture(e.pointerId);
      } catch {
      }
      if (!a.dragging) return;
      const { x, y } = viewportToStage(e.clientX - a.grabOffsetX, e.clientY - a.grabOffsetY, getFit());
      if (isOverList(x, y)) {
        if (a.source === "board") cb.onRemove(a.teamId);
        return;
      }
      if (a.source === "list") cb.onPlace(a.teamId, x, y);
      else cb.onMove(a.teamId, x, y);
    }
    stage2.addEventListener("pointerdown", onDown);
    stage2.addEventListener("pointermove", onMove);
    stage2.addEventListener("pointerup", onUp);
    stage2.addEventListener("pointercancel", onUp);
  }

  // src/main.ts
  var stage = document.getElementById("stage");
  var listEl = document.getElementById("list");
  var boardEl = document.getElementById("board");
  var resetBtn = document.getElementById("reset");
  var byId = teamsById();
  var state = loadState() ?? createInitialState();
  var fit = computeFit(window.innerWidth, window.innerHeight);
  function applyFit() {
    fit = computeFit(window.innerWidth, window.innerHeight);
    stage.style.transform = `translate(${fit.offsetX}px, ${fit.offsetY}px) scale(${fit.scale})`;
  }
  function render() {
    renderList(listEl, availableTeams(ALL_TEAMS, state));
    renderTokens(boardEl, state.placed, byId);
  }
  function update(next) {
    state = next;
    saveState(state);
    render();
  }
  initDrag(stage, listEl, boardEl, () => fit, {
    onPlace: (id, x, y) => update(placeTeam(state, id, x, y)),
    onMove: (id, x, y) => update(moveTeam(state, id, x, y)),
    onRemove: (id) => update(removeTeam(state, id))
  });
  resetBtn.addEventListener("click", () => update(createInitialState()));
  window.addEventListener("resize", applyFit);
  applyFit();
  render();
})();
