import { Fit, viewportToStage, isOverList } from './geometry';

export type DragCallbacks = {
  onPlace(teamId: string, x: number, y: number): void; // from list onto board
  onMove(teamId: string, x: number, y: number): void;  // reposition a placed token
  onRemove(teamId: string): void;                       // a placed token dropped over the list
};

const DRAG_THRESHOLD = 8; // px of movement before a press becomes a drag (lets the list scroll)

type Active = {
  teamId: string;
  source: 'list' | 'board';
  ghost: HTMLElement;
  startX: number;
  startY: number;
  dragging: boolean;
  pointerId: number;
};

export function initDrag(
  stage: HTMLElement,
  _listEl: HTMLElement,
  _boardEl: HTMLElement,
  getFit: () => Fit,
  cb: DragCallbacks,
): void {
  let active: Active | null = null;

  function onDown(e: PointerEvent): void {
    const el = (e.target as HTMLElement).closest('[data-team-id]') as HTMLElement | null;
    if (!el) return;
    const fromBoard = el.classList.contains('token');
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.classList.add('drag-ghost');
    ghost.style.display = 'none';
    document.body.appendChild(ghost);
    active = {
      teamId: el.dataset.teamId!,
      source: fromBoard ? 'board' : 'list',
      ghost,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      pointerId: e.pointerId,
    };
    stage.setPointerCapture(e.pointerId);
  }

  function onMove(e: PointerEvent): void {
    if (!active || e.pointerId !== active.pointerId) return;
    const dx = e.clientX - active.startX;
    const dy = e.clientY - active.startY;
    if (!active.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      active.dragging = true;
      active.ghost.style.display = '';
      active.ghost.style.transform = `translate(-50%, -50%) scale(${getFit().scale})`;
    }
    active.ghost.style.left = `${e.clientX}px`;
    active.ghost.style.top = `${e.clientY}px`;
  }

  function onUp(e: PointerEvent): void {
    if (!active || e.pointerId !== active.pointerId) return;
    const a = active;
    active = null;
    a.ghost.remove();
    try { stage.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    if (!a.dragging) return; // tap or scroll, not a drag
    const { x, y } = viewportToStage(e.clientX, e.clientY, getFit());
    if (isOverList(x, y)) {
      if (a.source === 'board') cb.onRemove(a.teamId);
      return; // list-to-list drop is a no-op
    }
    if (a.source === 'list') cb.onPlace(a.teamId, x, y);
    else cb.onMove(a.teamId, x, y);
  }

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
}
