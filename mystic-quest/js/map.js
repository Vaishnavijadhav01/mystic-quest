export const TILE_SIZE = 64;

export const TILE = {
  GRASS: 0,
  PATH: 1,
  TREE: 2,
  WATER: 3,
  FLOWER: 4,
  ROCK: 5,
};

const SOLID_TILES = new Set([TILE.TREE, TILE.WATER, TILE.ROCK]);

// Small deterministic pseudo-random generator so the village layout is
// reproducible across reloads instead of different every time.
function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s / 0x7fffffff);
  };
}

export class GameMap {
  constructor(cols, rows, name) {
    this.cols = cols;
    this.rows = rows;
    this.name = name;
    this.width = cols * TILE_SIZE;
    this.height = rows * TILE_SIZE;
    this.tiles = new Array(cols * rows).fill(TILE.GRASS);
    this.tileVariant = new Array(cols * rows).fill(0); // for subtle texture noise
  }

  index(col, row) {
    return row * this.cols + col;
  }

  getTile(col, row) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return TILE.TREE;
    return this.tiles[this.index(col, row)];
  }

  setTile(col, row, value) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return;
    this.tiles[this.index(col, row)] = value;
  }

  isSolidTile(col, row) {
    return SOLID_TILES.has(this.getTile(col, row));
  }

  // Checks whether a rectangle (in world pixels) overlaps any solid tile.
  isRectBlocked(x, y, width, height) {
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.floor((x + width - 1) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.floor((y + height - 1) / TILE_SIZE);

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (this.isSolidTile(col, row)) return true;
      }
    }
    return false;
  }

  draw(ctx, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const endCol = Math.min(this.cols - 1, Math.floor((camera.x + camera.viewWidth) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endRow = Math.min(this.rows - 1, Math.floor((camera.y + camera.viewHeight) / TILE_SIZE) + 1);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        this._drawTile(ctx, col, row, camera);
      }
    }
  }

  _drawTile(ctx, col, row, camera) {
    const tile = this.getTile(col, row);
    const variant = this.tileVariant[this.index(col, row)];
    const screenX = Math.round(col * TILE_SIZE - camera.renderX);
    const screenY = Math.round(row * TILE_SIZE - camera.renderY);

    switch (tile) {
      case TILE.GRASS: {
        ctx.fillStyle = variant === 1 ? '#3f6152' : variant === 2 ? '#48705f' : '#436a58';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        if (variant === 2) {
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(screenX + 10, screenY + 18, 3, 3);
          ctx.fillRect(screenX + 40, screenY + 40, 3, 3);
        }
        break;
      }
      case TILE.PATH: {
        ctx.fillStyle = variant === 1 ? '#8a7455' : '#7c6849';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(screenX, screenY, TILE_SIZE, 3);
        break;
      }
      case TILE.FLOWER: {
        ctx.fillStyle = '#436a58';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = variant === 1 ? '#f2a154' : '#e8dfc8';
        ctx.beginPath();
        ctx.arc(screenX + 22, screenY + 30, 3, 0, Math.PI * 2);
        ctx.arc(screenX + 40, screenY + 40, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case TILE.WATER: {
        ctx.fillStyle = '#2b4a5e';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = 'rgba(111,227,212,0.12)';
        ctx.fillRect(screenX, screenY + 26, TILE_SIZE, 4);
        break;
      }
      case TILE.ROCK: {
        ctx.fillStyle = '#3f6152';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#5b5a63';
        ctx.beginPath();
        ctx.ellipse(screenX + 32, screenY + 40, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78767f';
        ctx.beginPath();
        ctx.ellipse(screenX + 26, screenY + 34, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case TILE.TREE: {
        ctx.fillStyle = '#3f6152';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        // Trunk
        ctx.fillStyle = '#4a3524';
        ctx.fillRect(screenX + 27, screenY + 38, 10, 22);
        // Canopy (layered circles for a soft painterly look)
        ctx.fillStyle = '#1f4a3a';
        ctx.beginPath();
        ctx.arc(screenX + 32, screenY + 24, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2c5c46';
        ctx.beginPath();
        ctx.arc(screenX + 24, screenY + 18, 16, 0, Math.PI * 2);
        ctx.arc(screenX + 42, screenY + 22, 14, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      default:
        break;
    }
  }
}

// Builds the Village area: grass field bordered by trees, a crossing path,
// a small pond, scattered rocks, and flower patches. Deterministic seed
// keeps the layout stable across reloads.
export function createVillageMap() {
  const cols = 30;
  const rows = 18;
  const map = new GameMap(cols, rows, 'Village');
  const rng = makeRng(7331);

  // Base grass with subtle variant noise for texture.
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      map.tileVariant[map.index(col, row)] = Math.floor(rng() * 3);
    }
  }

  // Border of trees.
  for (let col = 0; col < cols; col++) {
    map.setTile(col, 0, TILE.TREE);
    map.setTile(col, rows - 1, TILE.TREE);
  }
  for (let row = 0; row < rows; row++) {
    map.setTile(0, row, TILE.TREE);
    map.setTile(cols - 1, row, TILE.TREE);
  }

  // Cross-shaped path through the village center.
  const midRow = Math.floor(rows / 2);
  const midCol = Math.floor(cols / 2);
  for (let col = 1; col < cols - 1; col++) {
    map.setTile(col, midRow, TILE.PATH);
    map.setTile(col, midRow + 1, TILE.PATH);
  }
  for (let row = 1; row < rows - 1; row++) {
    map.setTile(midCol, row, TILE.PATH);
    map.setTile(midCol + 1, row, TILE.PATH);
  }

  // Small pond, bottom-right quadrant.
  for (let row = rows - 6; row < rows - 3; row++) {
    for (let col = cols - 8; col < cols - 4; col++) {
      map.setTile(col, row, TILE.WATER);
    }
  }

  // Scattered decorative trees and rocks (avoiding the path).
  for (let i = 0; i < 26; i++) {
    const col = 2 + Math.floor(rng() * (cols - 4));
    const row = 2 + Math.floor(rng() * (rows - 4));
    if (map.getTile(col, row) !== TILE.GRASS) continue;
    const roll = rng();
    if (roll < 0.55) map.setTile(col, row, TILE.TREE);
    else if (roll < 0.75) map.setTile(col, row, TILE.ROCK);
    else map.setTile(col, row, TILE.FLOWER);
  }

  return map;
}
