import { Team, BoardState } from './types';

export function availableTeams(allTeams: Team[], state: BoardState): Team[] {
  const placed = new Set(state.placed.map((p) => p.teamId));
  return allTeams.filter((t) => !placed.has(t.id));
}
