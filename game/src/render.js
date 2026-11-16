// All drawing: the night garden, the seedling, the pools, the shades, the
// HUD, and every menu. The canvas is a fixed 1280x720; the page scales it.
// draw() returns the clickable button rects for the current screen so the
// state machine can hit-test mouse clicks against them.
import { W, H, HUD_H, BAR_H, COLORS, FIELD, CENTER, NIGHTS, DIFFICULTIES } from './config.js';

export const buttons = {};

function rect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color || COLORS.text;
  ctx.font = (weight || 'bold') + ' ' + size + 'px Verdana, Geneva, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function starsFor(seed) {
  const stars = [];
  let s = seed;
  for (let i = 0; i < 90; i++) {
    s = (s * 16807) % 2147483647;
    const x = (s % 1280);
    s = (s * 16807) % 2147483647;
    const y = (s % 560);
    s = (s * 16807) % 2147483647;
    stars.push({ x, y, r: 0.6 + (s % 100) / 100 * 1.1, tw: (s % 100) / 100 });
  }
  return stars;
}
const STARS = starsFor(12345);

function drawBackground(ctx, time) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, COLORS.night0);
  g.addColorStop(0.55, COLORS.night1);
  g.addColorStop(1, COLORS.night2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (const st of STARS) {
    const a = 0.35 + 0.45 * Math.abs(Math.sin(time * 0.7 + st.tw * 6));
    ctx.fillStyle = 'rgba(255, 244, 200, ' + a.toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // The moon, top right, the source of all the light you pour.
  const mx = 1150, my = 96;
  const mg = ctx.createRadialGradient(mx, my, 8, mx, my, 70);
  mg.addColorStop(0, 'rgba(255, 240, 190, 0.85)');
  mg.addColorStop(0.35, 'rgba(255, 230, 160, 0.28)');
  mg.addColorStop(1, 'rgba(255, 230, 160, 0)');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(mx, my, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffedbe';
  ctx.beginPath();
  ctx.arc(mx, my, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(200, 180, 130, 0.5)';
  ctx.beginPath();
  ctx.arc(mx - 8, my - 5, 5, 0, Math.PI * 2);
  ctx.arc(mx + 7, my + 8, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGarden(ctx, state, time) {
  const f = FIELD;
  // Grass: darker patches so the field reads as a garden, not a void.
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(f.x, f.y, f.w, f.h);
  ctx.fillStyle = COLORS.grassLight;
  const patches = [[120, 130, 150, 90], [980, 120, 180, 110], [150, 480, 190, 100], [950, 470, 170, 110], [560, 90, 160, 70], [520, 560, 200, 70]];
  for (const [x, y, w, h] of patches) {
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Stone path ring around the seedling.
  ctx.strokeStyle = COLORS.path;
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, 120, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, 128, 0, Math.PI * 2);
  ctx.stroke();
  // Decorative stones.
  ctx.fillStyle = COLORS.stone;
  const stones = [[300, 200], [980, 300], [340, 540], [960, 540], [640, 120]];
  for (const [x, y] of stones) {
    ctx.beginPath();
    ctx.ellipse(x, y, 16, 11, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Thorn ring upgrade: a circle of thorns that slows foes near the plant.
  if (state.garden.thorn) {
    ctx.strokeStyle = '#7ddb8a';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, 130, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + time * 0.1;
      const x = CENTER.x + Math.cos(a) * 130;
      const y = CENTER.y + Math.sin(a) * 130;
      ctx.fillStyle = '#7ddb8a';
      ctx.beginPath();
      ctx.moveTo(x, y - 7);
      ctx.lineTo(x + 4, y + 5);
      ctx.lineTo(x - 4, y + 5);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Ambient fireflies drifting over the grass.
  for (let i = 0; i < 12; i++) {
    const fx = 120 + ((i * 97 + time * 12) % 1040);
    const fy = 110 + ((i * 61 + time * 9) % 480);
    const a = 0.25 + 0.35 * Math.abs(Math.sin(time * 1.3 + i));
    ctx.fillStyle = 'rgba(255, 220, 120, ' + a.toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSeedling(ctx, garden, time, bloom) {
  const { x, y } = garden;
  const pulse = 1 + 0.06 * Math.sin(time * 2);
  const glowR = bloom ? 90 : 60;
  const gg = ctx.createRadialGradient(x, y, 4, x, y, glowR);
  gg.addColorStop(0, 'rgba(255, 215, 106, 0.55)');
  gg.addColorStop(1, 'rgba(255, 215, 106, 0)');
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();
  // Stem.
  ctx.strokeStyle = COLORS.seedling;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 16);
  ctx.quadraticCurveTo(x + 4, y, x, y - 18 * pulse);
  ctx.stroke();
  // Petals: one per petal of health, golden and open. Bloomed: full flower.
  const petals = bloom ? 8 : Math.max(0, garden.petals);
  const pr = bloom ? 26 : 15;
  for (let i = 0; i < petals; i++) {
    const a = (i / Math.max(1, petals)) * Math.PI * 2 - Math.PI / 2 + time * 0.15;
    const px = x + Math.cos(a) * pr;
    const py = y - 18 * pulse + Math.sin(a) * pr * 0.7;
    ctx.fillStyle = bloom ? COLORS.gold : COLORS.petal;
    ctx.beginPath();
    ctx.ellipse(px, py, 9, 6, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.goldBright;
  ctx.beginPath();
  ctx.arc(x, y - 18 * pulse, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a5b00';
  ctx.beginPath();
  ctx.arc(x - 2, y - 20 * pulse, 2, 0, Math.PI * 2);
  ctx.arc(x + 3, y - 16 * pulse, 2, 0, Math.PI * 2);
  ctx.fill();
  // Hurt flash when bitten.
  if (garden.pulse > 0) {
    ctx.strokeStyle = 'rgba(255, 93, 115, ' + Math.min(1, garden.pulse).toFixed(2) + ')';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 44, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPools(ctx, pools, time) {
  for (const p of pools) {
    const flick = 1 + 0.05 * Math.sin(time * 9 + p.x);
    const fade = Math.min(1, (p.left / p.duration) * 1.6);
    const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.radius * flick);
    g.addColorStop(0, 'rgba(255, 233, 168, ' + (0.95 * fade).toFixed(2) + ')');
    g.addColorStop(0.55, 'rgba(255, 205, 90, ' + (0.55 * fade).toFixed(2) + ')');
    g.addColorStop(1, 'rgba(255, 205, 90, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 233, 168, ' + (0.8 * fade).toFixed(2) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 0.82, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemy(ctx, e, time) {
  const flash = e.flash > 0;
  const body = flash ? '#ffd76a' : COLORS.shade;
  const eye = COLORS.shadeEye;
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.burning > 0) {
    ctx.fillStyle = 'rgba(255, 160, 60, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (e.type === 'moth') {
    const flap = Math.sin(time * 14 + e.wobblePhase) * 0.5;
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(-e.radius * 0.7, -2, e.radius * 0.7, e.radius * 0.45, -0.5 - flap * 0.3, 0, Math.PI * 2);
    ctx.ellipse(e.radius * 0.7, -2, e.radius * 0.7, e.radius * 0.45, 0.5 + flap * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, e.radius * 0.55, e.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === 'slug') {
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 2, e.radius, e.radius * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2f5e';
    ctx.beginPath();
    ctx.arc(-e.radius * 0.4, -e.radius * 0.5, 3, 0, Math.PI * 2);
    ctx.arc(e.radius * 0.3, -e.radius * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === 'root') {
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = body;
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * e.radius * 0.6, Math.sin(a) * e.radius * 0.6);
      ctx.lineTo(Math.cos(a) * (e.radius + 9), Math.sin(a) * (e.radius + 9));
      ctx.stroke();
    }
  } else if (e.type === 'maw' || e.type === 'king') {
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    // Mouth: a dark grin that opens and closes.
    const open = 4 + 3 * Math.sin(time * 4 + e.id);
    ctx.fillStyle = '#12081f';
    ctx.beginPath();
    ctx.ellipse(0, e.radius * 0.25, e.radius * 0.6, open, 0, 0, Math.PI * 2);
    ctx.fill();
    if (e.type === 'king') {
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.moveTo(-e.radius * 0.6, -e.radius * 0.75);
      ctx.lineTo(-e.radius * 0.3, -e.radius * 1.25);
      ctx.lineTo(0, -e.radius * 0.85);
      ctx.lineTo(e.radius * 0.3, -e.radius * 1.25);
      ctx.lineTo(e.radius * 0.6, -e.radius * 0.75);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Eyes: two glowing dots that face the seedling.
  const dx = CENTER.x - e.x, dy = CENTER.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const ex = dx / d, ey = dy / d;
  const px = -ey, py = ex;
  ctx.fillStyle = eye;
  ctx.beginPath();
  ctx.arc(ex * 4 + px * 5, ey * 4 + py * 5 - 2, 2.6, 0, Math.PI * 2);
  ctx.arc(ex * 4 - px * 5, ey * 4 - py * 5 - 2, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // Health pips for bosses and tough foes.
  if (e.maxHp >= 4) {
    const w = e.radius * 2;
    const frac = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(-w / 2, -e.radius - 12, w, 5);
    ctx.fillStyle = COLORS.danger;
    ctx.fillRect(-w / 2, -e.radius - 12, w * frac, 5);
  }
  ctx.restore();
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    const a = Math.max(0, p.left / p.max);
    ctx.fillStyle = p.color.replace('A', a.toFixed(2));
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHUD(ctx, state) {
  // Top bar.
  ctx.fillStyle = 'rgba(10, 13, 38, 0.92)';
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = COLORS.panelEdge;
  ctx.fillRect(0, HUD_H - 2, W, 2);
  text(ctx, 'LUMENPOUR', 18, 20, 17, COLORS.gold, 'left');
  text(ctx, 'pour the light', 18, 42, 11, COLORS.textDim, 'left');
  const night = state.waves.night || 1;
  text(ctx, 'NIGHT ' + night + ' / ' + NIGHTS, 250, 32, 22, COLORS.text, 'left');
  // Night pips.
  for (let i = 0; i < NIGHTS; i++) {
    ctx.fillStyle = i < night ? COLORS.gold : 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(400 + i * 20, 32, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Petals (seedling health).
  text(ctx, 'PETALS', 590, 20, 11, COLORS.textDim, 'left');
  for (let i = 0; i < state.garden.maxPetals; i++) {
    const on = i < state.garden.petals;
    ctx.fillStyle = on ? COLORS.petal : 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.ellipse(600 + i * 22, 40, 8, 5.5, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Jug meter.
  text(ctx, 'MOON JUG', 760, 20, 11, COLORS.textDim, 'left');
  const jugFrac = state.garden.jug / state.garden.jugCapacity;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  rect(ctx, 760, 30, 150, 16, 8, 'rgba(255, 255, 255, 0.15)');
  ctx.fillStyle = jugFrac >= 0.2 ? COLORS.gold : COLORS.danger;
  rect(ctx, 760, 30, 150 * jugFrac, 16, 8, jugFrac >= 0.2 ? COLORS.gold : COLORS.danger);
  text(ctx, Math.floor(state.garden.jug) + ' / ' + state.garden.jugCapacity, 918, 38, 12, COLORS.text, 'left');
  // Score and combo.
  text(ctx, 'SCORE', 1010, 20, 11, COLORS.textDim, 'left');
  text(ctx, String(state.score), 1010, 42, 20, COLORS.text, 'left');
  if (state.combo > 1) {
    text(ctx, 'COMBO x' + state.combo, 1160, 32, 18, COLORS.gold, 'left');
  }
  // Bottom bar.
  ctx.fillStyle = 'rgba(10, 13, 38, 0.92)';
  ctx.fillRect(0, H - BAR_H, W, BAR_H);
  ctx.fillStyle = COLORS.panelEdge;
  ctx.fillRect(0, H - BAR_H, W, 2);
  const owned = state.takenList || [];
  text(ctx, owned.length ? 'GIFTS: ' + owned.map((u) => u.name + (u.n > 1 ? ' x' + u.n : '')).join('  ·  ') : 'No gifts yet: survive a night to earn one.', 18, H - BAR_H / 2, 13, COLORS.textDim, 'left');
  text(ctx, 'Click: pour light   SPACE: next night   P: pause   M: mute   R: restart', 1280 - 18, H - BAR_H / 2, 12, COLORS.textDim, 'right');
}

function panel(ctx, x, y, w, h, title) {
  rect(ctx, x, y, w, h, 14, 'rgba(20, 26, 56, 0.96)', COLORS.panelEdge);
  if (title) text(ctx, title, x + w / 2, y + 26, 20, COLORS.gold, 'center');
}

function drawMenu(ctx, state) {
  buttons.play = { x: 440, y: 560, w: 400, h: 64 };
  // Title.
  text(ctx, 'LUMENPOUR', W / 2, 108, 72, COLORS.gold, 'center');
  text(ctx, 'The Night Gardener pours moonlight to keep one seedling alive.', W / 2, 152, 18, COLORS.text, 'center');
  text(ctx, 'Eight nights of shade. One Star Seedling. Light is the only weapon.', W / 2, 178, 15, COLORS.textDim, 'center');
  // Rules panel, the whole game in seven labeled lines.
  panel(ctx, 190, 210, 900, 250, 'HOW THE GARDEN IS KEPT');
  const rows = [
    ['GOAL', 'Shade crawls out of the dark to eat the Star Seedling.'],
    ['POUR', 'Click to pour a pool of moonlight. It costs 20 jug light.'],
    ['LIGHT', 'Shades burn ONLY while standing in the light. Dark is safe for them.'],
    ['JUG', 'The Moon Jug refills on its own. A slug\'s dark trail eats pools.'],
    ['NIGHTS', 'Survive 8 nights, one petal earned per night. Bosses on nights 4 and 8.'],
    ['WIN', 'Hold all 8 nights and the seedling blooms.'],
    ['LOSE', 'The seedling\'s petals run out.'],
  ];
  rows.forEach((r, i) => {
    const y = 258 + i * 28;
    rect(ctx, 215, y - 11, 74, 22, 5, COLORS.gold);
    text(ctx, r[0], 252, y, 12, '#241a00', 'center');
    text(ctx, r[1], 300, y, 14, COLORS.text, 'left');
  });
  // Difficulty buttons.
  buttons.difficulty = [];
  DIFFICULTIES.forEach((d, i) => {
    const x = 300 + i * 230;
    const y = 478;
    const sel = state.difficulty.id === d.id;
    rect(ctx, x, y, 210, 62, 10, sel ? COLORS.gold : COLORS.panel, sel ? COLORS.gold : COLORS.panelEdge);
    text(ctx, d.name, x + 105, y + 20, 16, sel ? '#241a00' : COLORS.text, 'center');
    text(ctx, d.desc, x + 105, y + 42, 11, sel ? '#5a4a00' : COLORS.textDim, 'center');
    buttons.difficulty.push({ x, y, w: 210, h: 62, id: d.id });
  });
  // Play button.
  rect(ctx, buttons.play.x, buttons.play.y, buttons.play.w, buttons.play.h, 12, COLORS.gold);
  text(ctx, 'BEGIN THE FIRST NIGHT', 640, buttons.play.y + 32, 22, '#241a00', 'center');
  text(ctx, 'Click BEGIN or press ENTER', 640, buttons.play.y + 82, 13, COLORS.textDim, 'center');
  if (state.best > 0) text(ctx, 'BEST SCORE  ' + state.best, 640, 668, 14, COLORS.textDim, 'center');
}

function drawIntermission(ctx, state) {
  const offered = state.waves.offered;
  text(ctx, 'NIGHT ' + state.waves.night + ' CLEARED', W / 2, 130, 40, COLORS.gold, 'center');
  text(ctx, 'The seedling keeps ' + state.garden.petals + ' petals. Choose one gift, then face the next night.', W / 2, 172, 16, COLORS.text, 'center');
  text(ctx, 'SCORE ' + state.score + '   ·   NEXT: NIGHT ' + (state.waves.night + 1) + ' OF ' + NIGHTS, W / 2, 200, 14, COLORS.textDim, 'center');
  buttons.upgrades = [];
  offered.forEach((u, i) => {
    const x = 250 + i * 270;
    const y = 240;
    rect(ctx, x, y, 250, 190, 14, COLORS.panel, COLORS.panelEdge);
    text(ctx, (i + 1), x + 125, y + 34, 22, COLORS.gold, 'center');
    text(ctx, u.name.toUpperCase(), x + 125, y + 74, 19, COLORS.text, 'center');
    // Wrap the description to two lines.
    const words = u.desc.split(' ');
    let line = '';
    let ly = y + 112;
    for (const w of words) {
      if ((line + ' ' + w).trim().length > 26) {
        text(ctx, line.trim(), x + 125, ly, 13, COLORS.textDim, 'center');
        line = w;
        ly += 20;
      } else {
        line += ' ' + w;
      }
    }
    if (line.trim()) text(ctx, line.trim(), x + 125, ly, 13, COLORS.textDim, 'center');
    buttons.upgrades.push({ x, y, w: 250, h: 190, id: u.id });
  });
  buttons.next = { x: 490, y: 470, w: 300, h: 60 };
  rect(ctx, buttons.next.x, buttons.next.y, buttons.next.w, buttons.next.h, 12, COLORS.gold);
  text(ctx, 'START NIGHT ' + (state.waves.night + 1), 640, buttons.next.y + 30, 20, '#241a00', 'center');
  text(ctx, 'Press 1, 2 or 3 to pick a gift, then SPACE or click to begin.', 640, 570, 13, COLORS.textDim, 'center');
}

function drawEnd(ctx, state, won) {
  const cx = W / 2;
  if (won) {
    text(ctx, 'THE SEEDLING BLOOMS', cx, 150, 52, COLORS.gold, 'center');
    text(ctx, 'Eight nights of shade, and the Star Seedling opens at last.', cx, 196, 17, COLORS.text, 'center');
    text(ctx, 'Every petal you kept is a star that will not go out tonight.', cx, 222, 14, COLORS.textDim, 'center');
  } else {
    text(ctx, 'THE DARK TAKES THE GARDEN', cx, 150, 44, COLORS.danger, 'center');
    text(ctx, 'The seedling\'s last petal falls on night ' + state.waves.night + ' of ' + NIGHTS + '.', cx, 196, 17, COLORS.text, 'center');
    text(ctx, 'The shade eats in the dark. Pour the light sooner next time.', cx, 222, 14, COLORS.textDim, 'center');
  }
  panel(ctx, 390, 260, 500, 170, won ? 'BLOOM REPORT' : 'NIGHT REPORT');
  const lines = [
    ['SCORE', String(state.score)],
    ['BEST', String(Math.max(state.best, state.score))],
    ['NIGHTS HELD', String(won ? NIGHTS : state.waves.night - 1) + ' / ' + NIGHTS],
    ['SHADES BANISHED', String(state.kills)],
    ['PETALS KEPT', String(state.garden.petals) + ' / ' + state.garden.maxPetals],
  ];
  lines.forEach((r, i) => {
    const y = 310 + i * 26;
    text(ctx, r[0], 430, y, 14, COLORS.textDim, 'left');
    text(ctx, r[1], 850, y, 15, COLORS.text, 'right');
  });
  buttons.restart = { x: 490, y: 470, w: 300, h: 60 };
  rect(ctx, buttons.restart.x, buttons.restart.y, buttons.restart.w, buttons.restart.h, 12, COLORS.gold);
  text(ctx, 'PLAY AGAIN', 640, buttons.restart.y + 30, 20, '#241a00', 'center');
  text(ctx, 'Click PLAY AGAIN or press R', 640, 560, 13, COLORS.textDim, 'center');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(8, 10, 30, 0.72)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'PAUSED', W / 2, 330, 48, COLORS.text, 'center');
  text(ctx, 'Press P or click to keep pouring.', W / 2, 380, 16, COLORS.textDim, 'center');
}

function drawNightBanner(ctx, state) {
  if (state.banner <= 0) return;
  const a = Math.min(1, state.banner);
  ctx.fillStyle = 'rgba(8, 10, 30, ' + (0.55 * a).toFixed(2) + ')';
  ctx.fillRect(0, 250, W, 90);
  const n = state.waves.night;
  const boss = n === 4 ? ' - the Night Maw stirs' : n === 8 ? ' - the Gloom King comes' : '';
  text(ctx, 'NIGHT ' + n + boss, W / 2, 295, 34, 'rgba(255, 215, 106, ' + a.toFixed(2) + ')', 'center');
}

export function draw(ctx, state, time) {
  buttons.play = null;
  buttons.difficulty = null;
  buttons.upgrades = null;
  buttons.next = null;
  buttons.restart = null;
  drawBackground(ctx, time);
  if (state.screen === 'menu') {
    drawGarden(ctx, state, time);
    drawSeedling(ctx, state.garden, time, false);
    drawMenu(ctx, state);
    return;
  }
  drawGarden(ctx, state, time);
  drawPools(ctx, state.pools, time);
  for (const e of state.enemies) {
    if (!e.dead) drawEnemy(ctx, e, time);
  }
  drawSeedling(ctx, state.garden, time, state.screen === 'win');
  drawParticles(ctx, state.particles);
  drawHUD(ctx, state);
  drawNightBanner(ctx, state);
  if (state.screen === 'intermission') drawIntermission(ctx, state);
  if (state.screen === 'win') drawEnd(ctx, state, true);
  if (state.screen === 'lose') drawEnd(ctx, state, false);
  if (state.paused) drawPaused(ctx);
}
