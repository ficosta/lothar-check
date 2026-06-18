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
