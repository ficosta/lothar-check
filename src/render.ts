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
