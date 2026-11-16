// Seeded random numbers (mulberry32) so screenshot states are repeatable.
// The game uses one shared rng; shots.js reseeds it for each screenshot.
let state = 1;

export function seed(n) {
  state = (n >>> 0) || 1;
}

export function next() {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function range(min, max) {
  return min + next() * (max - min);
}

export function pick(arr) {
  return arr[Math.floor(next() * arr.length)];
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}
