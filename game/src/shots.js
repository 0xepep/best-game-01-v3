// Screenshot states: the URL query picks a fixed scene so the dossier
// screenshots are real renders of the game's own code, repeatable by seed.
//   ?shot=start  the title menu
//   ?shot=play   mid-game on night 3, pools burning, HUD on
//   ?shot=boss   night 8, the Gloom King and a crowd of shades
//   ?shot=end    the bloom (win) screen with its report and restart
import { seed, range } from './random.js';
import { makeEnemy } from './enemies.js';
import { pour } from './garden.js';

function scatterEnemies(state, count, types) {
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const e = makeEnemy(type, state.difficulty);
    // Place them mid-field, walking in, instead of at the border.
    e.x = range(80, 1200);
    e.y = range(120, 620);
    const d = Math.hypot(e.x - state.garden.x, e.y - state.garden.y);
    if (d < 160) { e.x = 120; e.y = 140; }
    state.enemies.push(e);
  }
}

function scatterPools(state, spots) {
  for (const [x, y] of spots) {
    const p = pour(state.garden, x, y);
    if (p) {
      p.left = p.duration * 0.8;
      state.pools.push(p);
    }
  }
}

export function applyShot(state, shot, seedValue) {
  seed(seedValue || 1);
  state.garden.jug = 64;
  if (shot === 'start') {
    state.screen = 'menu';
    return;
  }
  if (shot === 'play') {
    state.screen = 'playing';
    state.waves.night = 3;
    state.score = 1240;
    state.combo = 3;
    state.kills = 41;
    state.garden.petals = 4;
    scatterEnemies(state, 9, ['moth', 'slug', 'root', 'moth', 'slug']);
    scatterPools(state, [[420, 300], [820, 420], [640, 240]]);
    state.garden.jug = 64;
    return;
  }
  if (shot === 'boss') {
    state.screen = 'playing';
    state.waves.night = 8;
    state.score = 6890;
    state.combo = 4;
    state.kills = 118;
    state.garden.petals = 3;
    const king = makeEnemy('king', state.difficulty);
    king.x = 640;
    king.y = 200;
    state.enemies.push(king);
    scatterEnemies(state, 10, ['moth', 'slug', 'root', 'moth', 'slug', 'root']);
    scatterPools(state, [[520, 330], [780, 300], [640, 470]]);
    state.garden.jug = 64;
    return;
  }
  if (shot === 'end') {
    state.screen = 'win';
    state.waves.night = 8;
    state.score = 9420;
    state.kills = 156;
    state.garden.petals = 4;
    state.garden.bloom = 1;
    return;
  }
  state.screen = 'menu';
}

export function shotFromUrl() {
  const q = new URLSearchParams(window.location.search);
  return { shot: q.get('shot'), seed: parseInt(q.get('seed') || '1', 10) };
}
