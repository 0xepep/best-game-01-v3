// LUMENPOUR - configuration: every number the game tunes from lives here.
// Canvas is fixed at 1280x720; CSS scales it to the window. The play field is
// the area between the top HUD bar and the bottom control bar.
export const W = 1280;
export const H = 720;
export const HUD_H = 64;
export const BAR_H = 56;
export const FIELD = { x: 0, y: HUD_H, w: W, h: H - HUD_H - BAR_H };
export const CENTER = { x: W / 2, y: HUD_H + (H - HUD_H - BAR_H) / 2 };

// Palette: one strong pair, deep indigo night against warm gold moonlight.
export const COLORS = {
  night0: '#0b0e2a',
  night1: '#171c46',
  night2: '#232a5e',
  grass: '#1d2b3a',
  grassLight: '#24384a',
  path: '#3a3f5e',
  stone: '#4a4f6e',
  gold: '#ffd76a',
  goldBright: '#ffe9a8',
  goldDim: '#c9a13b',
  petal: '#ffb3d9',
  seedling: '#8dff9e',
  shade: '#2a2140',
  shadeEye: '#b78cff',
  danger: '#ff5d73',
  text: '#f2ead8',
  textDim: '#b9b3a4',
  panel: '#141a38',
  panelEdge: '#3d4a7a',
};

export const NIGHTS = 8;
export const SEEDLING_PETALS = 5;
export const SEEDLING_MAX_PETALS = 6;
export const SEEDLING_RADIUS = 26;

// The Moon Jug: light is a consumable. A pour costs JUG_POUR; the jug
// refills at JUG_REFILL per second. A pool burns anything inside it.
export const JUG = {
  capacity: 100,
  pourCost: 20,
  refill: 11,
  poolRadius: 70,
  poolDuration: 4.5,
  burnPerSec: 2,
};

// Enemy types. hp is in pool-seconds of burn; speed is px per second.
// bite is how many seedling petals the enemy eats when it reaches the plant.
export const ENEMIES = {
  moth: { name: 'Murk Moth', hp: 1, speed: 58, radius: 11, score: 10, bite: 1, wobble: 26 },
  slug: { name: 'Shade Slug', hp: 2, speed: 32, radius: 14, score: 20, bite: 1, wobble: 0, trail: true },
  root: { name: 'Gloom Root', hp: 4, speed: 22, radius: 17, score: 30, bite: 1, wobble: 0 },
  maw: { name: 'Night Maw', hp: 14, speed: 18, radius: 26, score: 150, bite: 2, wobble: 0, boss: true },
  king: { name: 'Gloom King', hp: 30, speed: 15, radius: 34, score: 500, bite: 2, wobble: 0, boss: true, spawns: true },
};

// What each night sends. Lists are counts by type; spawnInterval is seconds
// between spawns. Night 4 brings the Night Maw, night 8 the Gloom King.
export const NIGHT_WAVES = [
  { moth: 6, slug: 0, root: 0, interval: 1.4 },
  { moth: 8, slug: 2, root: 0, interval: 1.3 },
  { moth: 8, slug: 4, root: 2, interval: 1.2 },
  { moth: 10, slug: 4, root: 3, maw: 1, interval: 1.1 },
  { moth: 12, slug: 6, root: 4, interval: 1.05 },
  { moth: 14, slug: 6, root: 5, maw: 1, interval: 1.0 },
  { moth: 16, slug: 8, root: 6, interval: 0.95 },
  { moth: 14, slug: 8, root: 6, king: 1, interval: 0.9 },
];

// Upgrades offered between nights, pick 1 of 3. max is how many times the
// upgrade can be taken; effect is applied multiplicatively per take.
export const UPGRADES = [
  { id: 'wide', name: 'Wide Jug', desc: 'Pools are 40% wider.', max: 3, apply: (s) => { s.poolRadius *= 1.4; } },
  { id: 'long', name: 'Long Glow', desc: 'Pools last 50% longer.', max: 3, apply: (s) => { s.poolDuration *= 1.5; } },
  { id: 'well', name: 'Deep Well', desc: 'The jug refills 60% faster.', max: 3, apply: (s) => { s.jugRefill *= 1.6; } },
  { id: 'bright', name: 'Bright Burn', desc: 'Pools burn 50% harder.', max: 3, apply: (s) => { s.burnPerSec *= 1.5; } },
  { id: 'big', name: 'Big Jug', desc: 'The jug holds 40 more light.', max: 3, apply: (s) => { s.jugCapacity += 40; s.jug = Math.min(s.jug + 40, s.jugCapacity); } },
  { id: 'thorn', name: 'Thorn Ring', desc: 'Thorns slow foes near the seedling.', max: 1, apply: (s) => { s.thorn = true; } },
  { id: 'petal', name: 'Moonpetal', desc: 'The seedling grows one more petal.', max: 2, apply: (s) => { s.petals = Math.min(s.petals + 1, SEEDLING_MAX_PETALS); s.maxPetals = Math.min(s.maxPetals + 1, SEEDLING_MAX_PETALS); } },
];

// Difficulties: enemy health and speed, jug refill, seedling petals.
export const DIFFICULTIES = [
  { id: 'gentle', name: 'GENTLE', desc: 'Soft shade. Learn to pour.', hpMul: 0.75, speedMul: 0.85, refillMul: 1.25, petals: 6 },
  { id: 'normal', name: 'NORMAL', desc: 'The intended night. Fair and tense.', hpMul: 1, speedMul: 1, refillMul: 1, petals: 5 },
  { id: 'harsh', name: 'HARSH', desc: 'A black night. For keepers only.', hpMul: 1.3, speedMul: 1.15, refillMul: 0.85, petals: 4 },
];

export const SCORE = {
  nightBonus: 100,
  winBonus: 500,
  petalBonus: 50,
};
