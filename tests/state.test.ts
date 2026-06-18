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
