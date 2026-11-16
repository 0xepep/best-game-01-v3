// Nights: each night is a wave of shades. The spawner releases them on a
// schedule; the night ends when every spawned shade is burned or has bitten.
// Between nights the player picks 1 of 3 upgrades, then starts the next.
import { NIGHT_WAVES, UPGRADES } from './config.js';
import { shuffle } from './random.js';
import { makeEnemy } from './enemies.js';

export function makeWaves() {
  return {
    night: 0,
    queue: [],
    spawnTimer: 0,
    interval: 1.2,
    spawning: false,
    offered: [],
    taken: {},
  };
}

// Build the spawn queue for a night: a shuffled list of enemy types.
export function startNight(waves, night, difficulty) {
  const def = NIGHT_WAVES[night - 1];
  const queue = [];
  for (const [type, count] of Object.entries(def)) {
    if (type === 'interval') continue;
    for (let i = 0; i < count; i++) queue.push(type);
  }
  waves.night = night;
  waves.queue = shuffle(queue);
  waves.interval = def.interval;
  waves.spawnTimer = 0.8;
  waves.spawning = true;
  return waves.queue.length;
}

export function nightTotal(night) {
  const def = NIGHT_WAVES[night - 1];
  let n = 0;
  for (const [type, count] of Object.entries(def)) {
    if (type !== 'interval') n += count;
  }
  return n;
}

// Release the next shade when its time comes. Returns the enemy or null.
export function tickSpawner(waves, dt, difficulty) {
  if (!waves.spawning || waves.queue.length === 0) return null;
  waves.spawnTimer -= dt;
  if (waves.spawnTimer > 0) return null;
  waves.spawnTimer = waves.interval;
  const type = waves.queue.shift();
  return makeEnemy(type, difficulty);
}

export function nightCleared(waves, enemies) {
  if (waves.spawning && waves.queue.length > 0) return false;
  return enemies.every((e) => e.dead || e.reached);
}

// Offer 3 upgrades the player has not maxed out yet.
export function offerUpgrades(waves) {
  const available = UPGRADES.filter((u) => (waves.taken[u.id] || 0) < u.max);
  waves.offered = shuffle(available).slice(0, 3);
  return waves.offered;
}

export function takeUpgrade(waves, garden, id) {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) return null;
  if ((waves.taken[u.id] || 0) >= u.max) return null;
  waves.taken[u.id] = (waves.taken[u.id] || 0) + 1;
  u.apply(garden);
  return u;
}

export function takenUpgrades(waves) {
  return Object.entries(waves.taken).map(([id, n]) => {
    const u = UPGRADES.find((x) => x.id === id);
    return { name: u ? u.name : id, n };
  });
}
