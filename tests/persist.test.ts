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
