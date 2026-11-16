// LUMENPOUR - the game loop and state machine.
// Screens: menu, playing, intermission (pick a gift), win, lose.
// The player pours pools of moonlight; shades burn only inside the light.
import { W, H, NIGHTS, SCORE, DIFFICULTIES, JUG } from './config.js';
import { makeGarden, pour, refillJug, bite } from './garden.js';
import { makePools, addPool, updatePools, darkenPools } from './pools.js';
import { makeEnemy, updateEnemy, enemyCount } from './enemies.js';
import { makeWaves, startNight, tickSpawner, nightCleared, offerUpgrades, takeUpgrade, takenUpgrades, nightTotal } from './waves.js';
import { draw, buttons } from './render.js';
import { mouse, keys, attach, consumeClick, consumeKey, clearTransient } from './input.js';
import { sfx, toggleMute, isMuted } from './sound.js';
import { seed, range } from './random.js';
import { applyShot, shotFromUrl } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
canvas.width = W;
canvas.height = H;

const BEST_KEY = 'lumenpour-best';

function loadBest() {
  try { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; }
  catch (e) { return 0; }
}
function saveBest(n) {
  try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) { /* storage is best-effort */ }
}

function newState(difficulty) {
  return {
    screen: 'menu',
    paused: false,
    difficulty,
    garden: makeGarden(difficulty),
    pools: makePools(),
    enemies: [],
    waves: makeWaves(),
    particles: [],
    score: 0,
    combo: 0,
    comboTimer: 0,
    kills: 0,
    best: loadBest(),
    banner: 0,
    time: 0,
    pourCooldown: 0,
    picked: null,
    takenList: [],
    shot: false,
  };
}

let state = newState(DIFFICULTIES[1]);
seed((Date.now() % 100000) + 1);

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function addParticles(x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = range(0, Math.PI * 2);
    const v = range(speed * 0.3, speed);
    state.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 20,
      r: range(1.5, 3.5),
      left: range(0.4, 0.9),
      max: 0.9,
      color,
    });
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.left -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 30 * dt;
    if (p.left <= 0) state.particles.splice(i, 1);
  }
  if (state.particles.length > 400) state.particles.splice(0, state.particles.length - 400);
}

function addScore(base, x, y) {
  const mult = Math.min(5, Math.max(1, state.combo));
  const pts = base * mult;
  state.score += pts;
  return pts;
}

function onKill(e) {
  state.kills++;
  state.combo = Math.min(5, state.combo + 1);
  state.comboTimer = 2;
  const pts = addScore(e.score, e.x, e.y);
  addParticles(e.x, e.y, 'rgba(255, 205, 90, A)', e.boss ? 26 : 10, 90);
  if (e.boss) addParticles(e.x, e.y, 'rgba(255, 233, 168, A)', 16, 130);
  sfx.burn();
  return pts;
}

function startGame() {
  state = newState(state.difficulty);
  state.screen = 'playing';
  startNight(state.waves, 1, state.difficulty);
  state.banner = 2.2;
  sfx.bell();
  setStatus('Night 1 of 8. Pour moonlight to burn the shades before they reach the seedling.');
}

function nextNight() {
  const n = state.waves.night + 1;
  state.enemies = [];
  state.pools = [];
  state.picked = null;
  state.screen = 'playing';
  startNight(state.waves, n, state.difficulty);
  state.banner = 2.2;
  sfx.bell();
  setStatus('Night ' + n + ' of 8.');
}

function endNight() {
  state.score += SCORE.nightBonus;
  state.enemies = [];
  state.pools = [];
  if (state.waves.night >= NIGHTS) {
    state.screen = 'win';
    state.garden.bloom = 1;
    state.score += SCORE.winBonus + state.garden.petals * SCORE.petalBonus;
    if (state.score > state.best) { state.best = state.score; saveBest(state.best); }
    sfx.win();
    setStatus('The seedling blooms. You win with ' + state.score + ' points.');
    return;
  }
  state.screen = 'intermission';
  offerUpgrades(state.waves);
  state.takenList = takenUpgrades(state.waves);
  sfx.pick();
  setStatus('Night ' + state.waves.night + ' cleared. Choose one gift, then start night ' + (state.waves.night + 1) + '.');
}

function loseGame() {
  state.screen = 'lose';
  if (state.score > state.best) { state.best = state.score; saveBest(state.best); }
  sfx.lose();
  setStatus('The dark takes the garden on night ' + state.waves.night + '. Score ' + state.score + '.');
}

function inRect(x, y, r) {
  return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function handleMenuClick() {
  const { x, y } = mouse;
  if (buttons.difficulty) {
    for (const b of buttons.difficulty) {
      if (inRect(x, y, b)) {
        state.difficulty = DIFFICULTIES.find((d) => d.id === b.id) || state.difficulty;
        state.garden = makeGarden(state.difficulty);
        sfx.click();
        return;
      }
    }
  }
  if (inRect(x, y, buttons.play)) {
    sfx.click();
    startGame();
  }
}

function handleIntermissionClick() {
  const { x, y } = mouse;
  if (buttons.upgrades) {
    for (const b of buttons.upgrades) {
      if (inRect(x, y, b) && !state.picked) {
        const u = takeUpgrade(state.waves, state.garden, b.id);
        if (u) {
          state.picked = u.id;
          state.takenList = takenUpgrades(state.waves);
          sfx.pick();
        }
        return;
      }
    }
  }
  if (inRect(x, y, buttons.next)) {
    if (!state.picked && state.waves.offered.length > 0) {
      const u = takeUpgrade(state.waves, state.garden, state.waves.offered[0].id);
      if (u) { state.picked = u.id; state.takenList = takenUpgrades(state.waves); }
    }
    sfx.click();
    nextNight();
  }
}

function handleEndClick() {
  if (inRect(mouse.x, mouse.y, buttons.restart)) {
    sfx.click();
    startGame();
  }
}

function tryPour() {
  if (state.pourCooldown > 0) return;
  const { x, y } = mouse;
  if (y < 64 || y > H - 56) return;
  const pool = pour(state.garden, x, y);
  if (!pool) return;
  addPool(state.pools, pool);
  state.pourCooldown = 0.22;
  addParticles(x, y, 'rgba(255, 233, 168, A)', 6, 60);
  sfx.pour();
}

function update(dt) {
  state.time += dt;
  state.banner = Math.max(0, state.banner - dt);
  state.pourCooldown = Math.max(0, state.pourCooldown - dt);
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }
  updateParticles(dt);
  if (state.screen !== 'playing' || state.paused) return;

  refillJug(state.garden, dt);

  // Pour while the mouse is held down over the field.
  if (mouse.down && mouse.inside) tryPour();

  // Spawn the night's shades.
  const spawned = tickSpawner(state.waves, dt, state.difficulty);
  if (spawned) state.enemies.push(spawned);

  // Move shades; bites, trails, and boss spawns.
  for (const e of state.enemies) {
    if (e.dead || e.reached) continue;
    const ev = updateEnemy(e, dt, state.garden, state.time);
    if (ev === 'reached') {
      const lost = bite(state.garden, e.bite);
      addParticles(state.garden.x, state.garden.y, 'rgba(255, 93, 115, A)', 14, 80);
      sfx.bite();
      setStatus('A shade bit the seedling. ' + Math.max(0, state.garden.petals) + ' petals left.');
      if (lost) { loseGame(); return; }
    } else if (ev === 'trail') {
      darkenPools(state.pools, e.x, e.y);
    } else if (ev === 'spawn-moth') {
      const m = makeEnemy('moth', state.difficulty);
      m.x = e.x + range(-30, 30);
      m.y = e.y + range(-30, 30);
      state.enemies.push(m);
    }
  }

  // Pools burn shades standing in the light.
  const killed = updatePools(state.pools, state.enemies, dt);
  for (const e of killed) onKill(e);

  // Night cleared when nothing is left to spawn and nothing is alive.
  if (nightCleared(state.waves, state.enemies)) {
    endNight();
  }
}

function handleKey(code) {
  if (code === 'KeyM') { toggleMute(); return; }
  if (state.screen === 'menu') {
    if (code === 'Enter' || code === 'Space') startGame();
    if (code === 'Digit1') state.difficulty = DIFFICULTIES[0];
    if (code === 'Digit2') state.difficulty = DIFFICULTIES[1];
    if (code === 'Digit3') state.difficulty = DIFFICULTIES[2];
    return;
  }
  if (state.screen === 'playing') {
    if (code === 'KeyP' || code === 'Escape') { state.paused = !state.paused; return; }
    if (code === 'KeyR') { startGame(); return; }
    if (state.paused) return;
    if (code === 'Space') tryPour();
    return;
  }
  if (state.screen === 'intermission') {
    if (code === 'Digit1' || code === 'Digit2' || code === 'Digit3') {
      const idx = parseInt(code.slice(-1), 10) - 1;
      const u = state.waves.offered[idx];
      if (u && !state.picked) {
        const taken = takeUpgrade(state.waves, state.garden, u.id);
        if (taken) { state.picked = u.id; state.takenList = takenUpgrades(state.waves); sfx.pick(); }
      }
      return;
    }
    if (code === 'Space' || code === 'Enter') {
      if (!state.picked && state.waves.offered.length > 0) {
        const u = takeUpgrade(state.waves, state.garden, state.waves.offered[0].id);
        if (u) { state.picked = u.id; state.takenList = takenUpgrades(state.waves); }
      }
      nextNight();
    }
    return;
  }
  if (state.screen === 'win' || state.screen === 'lose') {
    if (code === 'KeyR' || code === 'Enter' || code === 'Space') startGame();
  }
}

function handleClick() {
  if (!consumeClick()) return;
  if (state.paused) { state.paused = false; return; }
  if (state.screen === 'menu') handleMenuClick();
  else if (state.screen === 'intermission') handleIntermissionClick();
  else if (state.screen === 'win' || state.screen === 'lose') handleEndClick();
  else if (state.screen === 'playing') tryPour();
}

// Test hook: lets a headless driver read the live state (screen, night,
// enemies, jug) and drive the game. Single-player, no leaderboard, so this
// changes nothing about the game itself.
window.__LUMENPOUR__ = {
  get state() { return state; },
  start: startGame,
};

let last = 0;
function frame(t) {
  requestAnimationFrame(frame);
  const now = t / 1000;
  let dt = Math.min(0.05, now - (last || now));
  last = now;
  if (dt < 0) dt = 0;
  const key = consumeKey();
  if (key) handleKey(key);
  handleClick();
  if (!state.paused) update(dt);
  else updateParticles(0);
  draw(ctx, state, state.time);
  if (state.shot) return;
}

// Screenshot mode: a fixed scene, no input, one frame then stop.
const shotInfo = shotFromUrl();
if (shotInfo.shot) {
  state.shot = true;
  applyShot(state, shotInfo.shot, shotInfo.seed);
  state.time = 3.2;
  draw(ctx, state, state.time);
  setStatus('LUMENPOUR screenshot: ' + shotInfo.shot);
} else {
  attach(canvas, null);
  setStatus('LUMENPOUR. Pour moonlight to defend the Star Seedling through eight nights.');
  requestAnimationFrame(frame);
}
