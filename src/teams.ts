import { Team } from './types';
import { TEAMS } from './generated/teams';

export const ALL_TEAMS: Team[] = TEAMS;

export function teamsById(teams: Team[] = ALL_TEAMS): Map<string, Team> {
  return new Map(teams.map((t) => [t.id, t]));
}
