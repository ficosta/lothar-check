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
