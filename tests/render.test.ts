// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderList, renderTokens } from '../src/render';
import type { Team } from '../src/types';

const team = (id: string): Team => ({ id, de: `Name-${id}`, code: id.toUpperCase(), iso2: id, flagFile: `assets/flags/${id}.png` });

let host: HTMLElement;
beforeEach(() => { host = document.createElement('div'); });

describe('renderList', () => {
  it('renders one row per team with id and German name', () => {
    renderList(host, [team('de'), team('fr')]);
    const rows = host.querySelectorAll('.list-row');
    expect(rows.length).toBe(2);
    expect((rows[0] as HTMLElement).dataset.teamId).toBe('de');
    expect(rows[0].textContent).toBe('Name-de');
  });

  it('clears previous content on re-render', () => {
    renderList(host, [team('de'), team('fr')]);
    renderList(host, [team('br')]);
    expect(host.querySelectorAll('.list-row').length).toBe(1);
  });
});

describe('renderTokens', () => {
  it('renders a positioned token with flag and code', () => {
    const byId = new Map([['de', team('de')]]);
    renderTokens(host, [{ teamId: 'de', x: 120, y: 240 }], byId);
    const tok = host.querySelector('.token') as HTMLElement;
    expect(tok.dataset.teamId).toBe('de');
    expect(tok.style.left).toBe('120px');
    expect(tok.style.top).toBe('240px');
    expect((tok.querySelector('img.token-flag') as HTMLImageElement).getAttribute('src')).toBe('assets/flags/de.png');
    expect(tok.querySelector('.token-code')!.textContent).toBe('DE');
  });

  it('skips a placed id with no matching team', () => {
    renderTokens(host, [{ teamId: 'zz', x: 0, y: 0 }], new Map());
    expect(host.querySelectorAll('.token').length).toBe(0);
  });
});
