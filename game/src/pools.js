// Pools of moonlight: circles the player pours onto the garden. Anything
// standing inside one burns. A shade slug's dark trail shortens pools it
// crosses, so slugs fight the light back.
import { burnEnemy } from './enemies.js';

export function makePools() {
  return [];
}

export function addPool(pools, pool) {
  pools.push(pool);
}

// Tick every pool: shrink it as its light fades, burn enemies inside it.
// Returns the list of enemies that burned out this tick.
export function updatePools(pools, enemies, dt) {
  const killed = [];
  for (let i = pools.length - 1; i >= 0; i--) {
    const p = pools[i];
    p.left -= dt;
    if (p.left <= 0) {
      pools.splice(i, 1);
      continue;
    }
    const fade = p.left / p.duration;
    p.radius = p.maxRadius * (0.55 + 0.45 * fade);
    for (const e of enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < p.radius + e.radius * 0.5) {
        if (burnEnemy(e, p.burn, dt)) killed.push(e);
      }
    }
  }
  return killed;
}

// A slug's dark trail crosses a pool and eats some of its remaining light.
export function darkenPools(pools, x, y) {
  for (const p of pools) {
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < p.radius) p.left = Math.max(0.2, p.left - 0.8);
  }
}

export function poolCount(pools) {
  return pools.length;
}
