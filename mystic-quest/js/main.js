import { InputManager } from './input.js';
import { GameState } from './gameState.js';
import { createVillageMap, TILE_SIZE } from './map.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Slime } from './enemy.js';
import { ParticleSystem } from './particles.js';
import { resolvePlayerAttack } from './combat.js';

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 540;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const hud = document.getElementById('hud');
const healthFill = document.getElementById('health-fill');
const hpText = document.getElementById('hp-text');
const xpFill = document.getElementById('xp-fill');
const areaNameEl = document.getElementById('area-name');
const coinCountEl = document.getElementById('coin-count');
const hudToast = document.getElementById('hud-toast');

const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const startButton = document.getElementById('start-button');
const resumeButton = document.getElementById('resume-button');
const restartButton = document.getElementById('restart-button');

const input = new InputManager();
const state = new GameState();

let map, camera, player, enemies, particles, elapsedTime, lastTimestamp;

function spawnEnemies(map) {
  // Fixed, hand-placed-feeling spawn spots away from the player's start tile.
  const spots = [
    [6, 4], [22, 5], [8, 13], [20, 12], [14, 3], [24, 14],
  ];
  return spots.map(([col, row]) => new Slime(col * TILE_SIZE, row * TILE_SIZE));
}

function initGame() {
  map = createVillageMap();
  camera = new Camera(VIEW_WIDTH, VIEW_HEIGHT);
  player = new Player(map.width / 2 - 14, map.height / 2 + TILE_SIZE);
  enemies = spawnEnemies(map);
  particles = new ParticleSystem();
  particles.spawnAmbient(map);
  elapsedTime = 0;
  lastTimestamp = performance.now();

  camera.x = Math.min(Math.max(player.centerX - VIEW_WIDTH / 2, 0), map.width - VIEW_WIDTH);
  camera.y = Math.min(Math.max(player.centerY - VIEW_HEIGHT / 2, 0), map.height - VIEW_HEIGHT);

  state.areaName = map.name;
  areaNameEl.textContent = map.name;
}

function showToast(text) {
  hudToast.textContent = text;
  hudToast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => hudToast.classList.remove('show'), 1400);
}

function updateHud() {
  const hpPct = Math.max(0, player.hp / player.maxHp) * 100;
  healthFill.style.height = `${hpPct}%`;
  hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
  xpFill.style.width = `${(player.xp / player.xpToNext) * 100}%`;
  coinCountEl.textContent = player.coins;
}

function update(dt) {
  player.update(dt, input, map);

  resolvePlayerAttack(player, enemies, particles, camera, (killedEnemy) => {
    player.coins += killedEnemy.coinDrop;
    const leveledUp = player.gainXp(killedEnemy.xpDrop);
    if (leveledUp) {
      camera.shake(4, 0.25);
      showToast(`Level ${player.level}!`);
    }
  });

  for (const enemy of enemies) {
    enemy.update(dt, player, map);
  }
  // Death particles are already spawned in resolvePlayerAttack, so it's
  // safe to drop dead enemies immediately.
  enemies = enemies.filter((e) => e.alive);

  particles.update(dt);
  camera.follow(player.centerX, player.centerY, map, dt);

  if (player.hp <= 0) {
    // Simple respawn-in-place recovery for the MVP slice (no game-over screen yet).
    player.hp = player.maxHp;
    player.x = map.width / 2 - 14;
    player.y = map.height / 2 + TILE_SIZE;
    showToast('You were knocked out... and revived.');
  }
}

function draw() {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // Sky/backdrop gradient behind the map (visible near map edges).
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  grad.addColorStop(0, '#1a2a2e');
  grad.addColorStop(1, '#12101b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  map.draw(ctx, camera);
  particles.draw(ctx, camera, elapsedTime);

  // Depth-sort player and enemies by their Y position so entities lower on
  // screen draw in front of ones higher up (classic top-down trick).
  const drawables = [player, ...enemies].sort((a, b) => a.y + a.height - (b.y + b.height));
  for (const d of drawables) {
    d.draw(ctx, camera);
  }

  // Vignette for atmosphere.
  const vignette = ctx.createRadialGradient(
    VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_HEIGHT * 0.35,
    VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_HEIGHT * 0.75
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

function loop(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000); // clamp to avoid huge steps on tab-switch
  lastTimestamp = timestamp;
  elapsedTime += dt;

  input.beginFrame();

  if (input.wasJustPressed('Escape') && state.status !== 'start') {
    togglePause();
  }

  if (state.status === 'playing') {
    update(dt);
    updateHud();
  }

  // The world is initialized up-front (see bottom of file) so it can render
  // as a calm backdrop behind the start screen too, not just once playing.
  if (map) draw();

  requestAnimationFrame(loop);
}

function togglePause() {
  if (state.status === 'playing') {
    state.status = 'paused';
    pauseScreen.classList.remove('hidden');
  } else if (state.status === 'paused') {
    state.status = 'playing';
    pauseScreen.classList.add('hidden');
    lastTimestamp = performance.now();
  }
}

function startGame() {
  initGame();
  state.status = 'playing';
  startScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  updateHud();
  lastTimestamp = performance.now();
}

// Initialize the world immediately so it renders as a calm backdrop behind
// the start screen, rather than crashing on the first frame before Start
// is clicked (draw() needs map/camera/player/enemies to exist).
initGame();

startButton.addEventListener('click', startGame);
resumeButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', () => {
  togglePause();
  startGame();
});

// --- Responsive canvas scaling: fit viewport while preserving aspect ratio ---
function resizeCanvas() {
  const container = document.getElementById('game-container');
  const availW = container.clientWidth;
  const availH = container.clientHeight;
  const scale = Math.min(availW / VIEW_WIDTH, availH / VIEW_HEIGHT, 1.4);
  canvas.style.width = `${VIEW_WIDTH * scale}px`;
  canvas.style.height = `${VIEW_HEIGHT * scale}px`;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

requestAnimationFrame((t) => {
  lastTimestamp = t;
  requestAnimationFrame(loop);
});
