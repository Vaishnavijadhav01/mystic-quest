import { Entity } from './entity.js';

const CHASE_RADIUS = 150;
const CONTACT_DAMAGE_COOLDOWN = 0.7;

export class Slime extends Entity {
  constructor(x, y) {
    super(x, y, 24, 20);
    this.hp = 50;
    this.maxHp = 50;
    this.damage = 5;
    this.speed = 55;
    this.contactDamageTimer = 0;

    this._wanderAngle = Math.random() * Math.PI * 2;
    this._wanderTimer = 0;
    this.coinDrop = 8 + Math.floor(Math.random() * 8);
    this.xpDrop = 15;
  }

  update(dt, player, map) {
    if (!this.alive) return;
    this.updateFlash(dt);
    this.animTime += dt;
    if (this.contactDamageTimer > 0) this.contactDamageTimer -= dt;

    const dxToPlayer = player.centerX - this.centerX;
    const dyToPlayer = player.centerY - this.centerY;
    const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer);

    let moveX = 0;
    let moveY = 0;

    if (distToPlayer < CHASE_RADIUS) {
      // Chase: move toward the player.
      moveX = (dxToPlayer / distToPlayer) * this.speed * dt;
      moveY = (dyToPlayer / distToPlayer) * this.speed * dt;
      this.facing = Math.abs(dxToPlayer) > Math.abs(dyToPlayer) ? (dxToPlayer > 0 ? 'right' : 'left') : (dyToPlayer > 0 ? 'down' : 'up');
    } else {
      // Wander: pick a new random direction periodically.
      this._wanderTimer -= dt;
      if (this._wanderTimer <= 0) {
        this._wanderAngle = Math.random() * Math.PI * 2;
        this._wanderTimer = 1.5 + Math.random() * 1.5;
      }
      moveX = Math.cos(this._wanderAngle) * this.speed * 0.4 * dt;
      moveY = Math.sin(this._wanderAngle) * this.speed * 0.4 * dt;
    }

    if (!map.isRectBlocked(this.x + moveX, this.y, this.width, this.height)) {
      this.x += moveX;
    }
    if (!map.isRectBlocked(this.x, this.y + moveY, this.width, this.height)) {
      this.y += moveY;
    }

    this.applyKnockback(dt);

    this.x = Math.min(Math.max(this.x, 0), map.width - this.width);
    this.y = Math.min(Math.max(this.y, 0), map.height - this.height);

    // Contact damage to player if overlapping and cooldown elapsed.
    if (this.contactDamageTimer <= 0) {
      const overlap =
        this.x < player.x + player.width &&
        this.x + this.width > player.x &&
        this.y < player.y + player.height &&
        this.y + this.height > player.y;
      if (overlap) {
        player.takeDamage(this.damage, this.centerX, this.centerY);
        this.contactDamageTimer = CONTACT_DAMAGE_COOLDOWN;
      }
    }
  }

  draw(ctx, camera) {
    const screenX = Math.round(this.x - camera.renderX);
    const screenY = Math.round(this.y - camera.renderY);
    const cx = screenX + this.width / 2;
    const cy = screenY + this.height / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, screenY + this.height + 1, this.width * 0.4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Squash-and-stretch bounce cycle.
    const bounce = Math.sin(this.animTime * 6) * 0.5 + 0.5;
    const squashX = 1 + bounce * 0.12;
    const squashY = 1 - bounce * 0.16;

    const flashing = this.flashTimer > 0;
    const bodyColor = flashing ? '#ffffff' : '#4fd1a5';
    const bodyDark = flashing ? '#ffffff' : '#2fa87e';

    ctx.save();
    ctx.translate(cx, cy + this.height / 2);
    ctx.scale(squashX, squashY);

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, -this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.ellipse(0, -this.height / 4, this.width / 2.4, this.height / 4, 0, 0, Math.PI);
    ctx.fill();

    // Eyes
    if (!flashing) {
      ctx.fillStyle = '#12281f';
      const eyeOffsetX = this.facing === 'left' ? -3 : this.facing === 'right' ? 3 : 0;
      ctx.beginPath();
      ctx.arc(-4 + eyeOffsetX, -this.height / 2, 1.6, 0, Math.PI * 2);
      ctx.arc(4 + eyeOffsetX, -this.height / 2, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shine highlight
    ctx.fillStyle = flashing ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(-this.width / 5, -this.height * 0.75, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // HP sliver above the slime, only when damaged.
    if (this.hp < this.maxHp) {
      const barWidth = this.width;
      const pct = this.hp / this.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(screenX, screenY - 8, barWidth, 3);
      ctx.fillStyle = '#e2596b';
      ctx.fillRect(screenX, screenY - 8, barWidth * pct, 3);
    }
  }
}
