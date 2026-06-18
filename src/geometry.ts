export const STAGE_W = 2360;
export const STAGE_H = 1640;
export const LIST_RECT = { x: 1973, y: 283, w: 303, h: 1092 };

export type Fit = { scale: number; offsetX: number; offsetY: number };

export function computeFit(viewportW: number, viewportH: number): Fit {
  const scale = Math.min(viewportW / STAGE_W, viewportH / STAGE_H);
  const offsetX = (viewportW - STAGE_W * scale) / 2;
  const offsetY = (viewportH - STAGE_H * scale) / 2;
  return { scale, offsetX, offsetY };
}

export function viewportToStage(clientX: number, clientY: number, fit: Fit): { x: number; y: number } {
  return { x: (clientX - fit.offsetX) / fit.scale, y: (clientY - fit.offsetY) / fit.scale };
}

export function isOverList(stageX: number, stageY: number): boolean {
  return (
    stageX >= LIST_RECT.x &&
    stageX <= LIST_RECT.x + LIST_RECT.w &&
    stageY >= LIST_RECT.y &&
    stageY <= LIST_RECT.y + LIST_RECT.h
  );
}
