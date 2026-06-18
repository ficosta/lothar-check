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
