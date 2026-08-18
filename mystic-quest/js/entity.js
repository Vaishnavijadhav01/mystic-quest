let nextEntityId = 1;

// Shared behavior for anything that lives in the world: position, health,
// knockback physics, and the hit-flash effect used when something is struck.
export class Entity {
  constructor(x, y, width, height) {
    this.id = nextEntityId++;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.hp = 100;
    this.maxHp = 100;
    this.alive = true;

    this.facing = 'down'; // 'up' | 'down' | 'left' | 'right'

    this.knockbackX = 0;
    this.knockbackY = 0;

    this.flashTimer = 0; // seconds remaining of white hit-flash
    this.animTime = 0; // accumulates for walk-cycle sine waves
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  // Axis-aligned bounding box used for collision + attack hit-testing.
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  takeDamage(amount, sourceX, sourceY) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 0.14;

    // Knockback away from the damage source.
    const dx = this.centerX - sourceX;
    const dy = this.centerY - sourceY;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const KNOCKBACK_FORCE = 260;
    this.knockbackX = (dx / dist) * KNOCKBACK_FORCE;
    this.knockbackY = (dy / dist) * KNOCKBACK_FORCE;

    if (this.hp <= 0) {
      this.alive = false;
      this.onDeath && this.onDeath();
    }
  }

  // Applies and decays knockback velocity; call from subclass update().
  applyKnockback(dt) {
    if (Math.abs(this.knockbackX) > 1 || Math.abs(this.knockbackY) > 1) {
      this.x += this.knockbackX * dt;
      this.y += this.knockbackY * dt;
      const decay = Math.pow(0.001, dt); // exponential decay, frame-rate independent
      this.knockbackX *= decay;
      this.knockbackY *= decay;
    } else {
      this.knockbackX = 0;
      this.knockbackY = 0;
    }
  }

  updateFlash(dt) {
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
    }
  }
}

export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
