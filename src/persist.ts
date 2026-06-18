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
