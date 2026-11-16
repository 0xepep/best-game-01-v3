// Enemies: shade creatures that crawl out of the dark toward the seedling.
// Each one walks straight at the plant (moths wobble), bites a petal when
// it arrives, and burns only while standing inside a pool of moonlight.
import { ENEMIES, FIELD, CENTER } from './config.js';
import { range } from './random.js';

let nextId = 1;

export function makeEnemy(type, difficulty) {
  const def = ENEMIES[type];
  // Spawn on a random point of the field border, out of the light.
  const side = Math.floor(range(0, 4));
  let x, y;
  if (side === 0) { x = range(FIELD.x + 20, FIELD.x + FIELD.w - 20); y = FIELD.y + 16; }
  else if (side === 1) { x = range(FIELD.x + 20, FIELD.x + FIELD.w - 20); y = FIELD.y + FIELD.h - 16; }
  else if (side === 2) { x = FIELD.x + 16; y = range(FIELD.y + 20, FIELD.y + FIELD.h - 20); }
  else { x = FIELD.x + FIELD.w - 16; y = range(FIELD.y + 20, FIELD.y + FIELD.h - 20); }
  const hp = Math.max(1, Math.round(def.hp * difficulty.hpMul));
  return {
    id: nextId++,
    type,
    name: def.name,
    x, y,
    hp, maxHp: hp,
    speed: def.speed * difficulty.speedMul,
    radius: def.radius,
    score: def.score,
    bite: def.bite,
    wobble: def.wobble,
    wobblePhase: range(0, Math.PI * 2),
    boss: !!def.boss,
    spawns: !!def.spawns,
    spawnTimer: 0,
    trail: !!def.trail,
    trailTimer: 0,
    burning: 0,
    flash: 0,
    slow: 0,
    dead: false,
    reached: false,
  };
}

// Move toward the seedling. Returns 'reached' when the enemy touches it.
export function updateEnemy(e, dt, garden, time) {
  if (e.dead) return null;
  const dx = garden.x - e.x;
  const dy = garden.y - e.y;
  const dist = Math.hypot(dx, dy) || 1;
  let sp = e.speed;
  if (e.slow > 0) { sp *= 0.6; e.slow -= dt; }
  // Thorn ring slows foes close to the seedling.
  if (garden.thorn && dist < 130) sp *= 0.6;
  let vx = (dx / dist) * sp;
  let vy = (dy / dist) * sp;
  if (e.wobble > 0) {
    const w = Math.sin(time * 3 + e.wobblePhase) * e.wobble;
    vx += (-dy / dist) * w * 0.4;
    vy += (dx / dist) * w * 0.4;
  }
  e.x += vx * dt;
  e.y += vy * dt;
  e.flash = Math.max(0, e.flash - dt);
  e.burning = Math.max(0, e.burning - dt);
  if (e.spawns) {
    e.spawnTimer -= dt;
    if (e.spawnTimer <= 0) {
      e.spawnTimer = 6;
      return 'spawn-moth';
    }
  }
  if (e.trail) {
    e.trailTimer -= dt;
    if (e.trailTimer <= 0) {
      e.trailTimer = 0.5;
      return 'trail';
    }
  }
  if (dist <= garden.radius + e.radius * 0.6) {
    e.reached = true;
    return 'reached';
  }
  return null;
}

// Damage from standing in moonlight. Returns true when the enemy burns out.
export function burnEnemy(e, dps, dt) {
  if (e.dead) return false;
  e.hp -= dps * dt;
  e.burning = 0.15;
  e.flash = 0.08;
  if (e.hp <= 0) {
    e.dead = true;
    return true;
  }
  return false;
}

export function enemyCount(list) {
  return list.filter((e) => !e.dead).length;
}
