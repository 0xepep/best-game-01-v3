// The garden: the Star Seedling in the center and the Moon Jug the player
// pours from. Pouring spends jug light and drops a pool of moonlight.
// The jug refills over time; the seedling loses a petal when a shade bites.
import { CENTER, SEEDLING_RADIUS, JUG, SEEDLING_MAX_PETALS } from './config.js';

export function makeGarden(difficulty) {
  return {
    x: CENTER.x,
    y: CENTER.y,
    radius: SEEDLING_RADIUS,
    petals: difficulty.petals,
    maxPetals: difficulty.petals,
    bloom: 0,
    jug: JUG.capacity,
    jugCapacity: JUG.capacity,
    jugRefill: JUG.refill * difficulty.refillMul,
    poolRadius: JUG.poolRadius,
    poolDuration: JUG.poolDuration,
    burnPerSec: JUG.burnPerSec,
    thorn: false,
    pulse: 0,
  };
}

// Try to pour a pool at (x, y). Returns the pool or null when the jug is
// too low. The pool is a circle of moonlight that burns shades inside it.
export function pour(garden, x, y) {
  if (garden.jug < JUG.pourCost) return null;
  garden.jug -= JUG.pourCost;
  return {
    x, y,
    radius: garden.poolRadius,
    maxRadius: garden.poolRadius,
    duration: garden.poolDuration,
    left: garden.poolDuration,
    burn: garden.burnPerSec,
  };
}

export function refillJug(garden, dt) {
  garden.jug = Math.min(garden.jugCapacity, garden.jug + garden.jugRefill * dt);
  garden.pulse = Math.max(0, garden.pulse - dt);
}

// A shade reaches the seedling and bites a petal. Returns true when the
// seedling has no petals left.
export function bite(garden, petals) {
  garden.petals -= petals;
  garden.pulse = 0.6;
  return garden.petals <= 0;
}

export function seedlingAlive(garden) {
  return garden.petals > 0;
}

export function maxPetals() {
  return SEEDLING_MAX_PETALS;
}
