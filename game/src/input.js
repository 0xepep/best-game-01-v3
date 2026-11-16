// Mouse and keyboard input. The canvas is a fixed 1280x720; the page scales
// it with CSS, so mouse positions are converted back to game coordinates.
import { W, H } from './config.js';

export const mouse = { x: W / 2, y: H / 2, down: false, clicked: false, inside: false };
export const keys = new Set();
export let keyPressed = null;

export function attach(canvas, onKey) {
  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  }
  canvas.addEventListener('mousemove', (e) => {
    const p = toGame(e);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.inside = true;
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = toGame(e);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.down = true;
    mouse.clicked = true;
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });
  canvas.addEventListener('mouseleave', () => { mouse.inside = false; });
  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (!e.repeat) {
      keys.add(e.code);
      keyPressed = e.code;
      if (onKey) onKey(e.code);
    }
  });
  window.addEventListener('keyup', (e) => { keys.delete(e.code); });
  window.addEventListener('blur', () => { keys.clear(); mouse.down = false; });
}

export function consumeClick() {
  const c = mouse.clicked;
  mouse.clicked = false;
  return c;
}

export function consumeKey() {
  const k = keyPressed;
  keyPressed = null;
  return k;
}

export function clearTransient() {
  mouse.clicked = false;
  keyPressed = null;
}
