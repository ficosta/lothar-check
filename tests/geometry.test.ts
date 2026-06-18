import { describe, it, expect } from 'vitest';
import { computeFit, viewportToStage, isOverList, STAGE_W, STAGE_H } from '../src/geometry';

describe('geometry', () => {
  it('computeFit letterboxes to the limiting dimension', () => {
    // Wider-than-stage viewport -> height is the limit
    const fit = computeFit(4000, 1640);
    expect(fit.scale).toBeCloseTo(1, 5);
    expect(fit.offsetX).toBeCloseTo((4000 - STAGE_W) / 2, 5);
    expect(fit.offsetY).toBeCloseTo(0, 5);
  });

  it('viewportToStage inverts computeFit (round-trip of stage center)', () => {
    const fit = computeFit(1180, 820);
    const cx = fit.offsetX + (STAGE_W / 2) * fit.scale;
    const cy = fit.offsetY + (STAGE_H / 2) * fit.scale;
    const p = viewportToStage(cx, cy, fit);
    expect(p.x).toBeCloseTo(STAGE_W / 2, 3);
    expect(p.y).toBeCloseTo(STAGE_H / 2, 3);
  });

  it('isOverList covers the list rectangle and excludes the board', () => {
    expect(isOverList(2100, 800)).toBe(true);   // inside list
    expect(isOverList(1973, 283)).toBe(true);    // top-left corner
    expect(isOverList(1000, 800)).toBe(false);   // left board area
    expect(isOverList(2100, 1500)).toBe(false);  // below list
  });
});
