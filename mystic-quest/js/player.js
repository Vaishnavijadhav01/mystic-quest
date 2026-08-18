import { Entity } from './entity.js';

const MOVE_SPEED = 190; // px/sec
const ATTACK_DURATION = 0.28;
const ATTACK_COOLDOWN = 0.34;
const ATTACK_RANGE = 34;
const ATTACK_ARC_WIDTH = 30;

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, 28, 34);
    this.hp = 100;
    this.maxHp = 100;
    this.damage = 20;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 100;
    this.coins = 0;

    this.moving = false;
    this.attackTimer = 0; // counts down while an attack animation is playing
    this.attackCooldown = 0; // counts down before another attack can start
    this.hasHitThisSwing = false; // ensures one attack only damages each enemy once
  }

  get isAttacking() {
    return this.attackTimer > 0;
  }

  update(dt, input, map) {
    this.updateFlash(dt);
    this.animTime += dt;

    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // --- Attack input ---
    if (input.wasJustPressed('Space') && this.attackCooldown <= 0) {
      this.attackTimer = ATTACK_DURATION;
      this.attackCooldown = ATTACK_COOLDOWN;
      this.hasHitThisSwing = false;
    }

    // --- Movement input (locked out mid-swing so attacks feel weighty) ---
    let dx = 0;
    let dy = 0;
    const movementLocked = this.attackTimer > ATTACK_DURATION * 0.35;

    if (!movementLocked) {
      if (input.isDown('KeyW', 'ArrowUp')) dy -= 1;
      if (input.isDown('KeyS', 'ArrowDown')) dy += 1;
      if (input.isDown('KeyA', 'ArrowLeft')) dx -= 1;
      if (input.isDown('KeyD', 'ArrowRight')) dx += 1;
    }

    this.moving = dx !== 0 || dy !== 0;

    if (this.moving) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? 'right' : 'left';
      } else {
        this.facing = dy > 0 ? 'down' : 'up';
      }

      const moveX = dx * MOVE_SPEED * dt;
      const moveY = dy * MOVE_SPEED * dt;

      // Resolve X and Y separately so sliding along walls feels natural.
      if (!map.isRectBlocked(this.x + moveX, this.y, this.width, this.height)) {
        this.x += moveX;
      }
      if (!map.isRectBlocked(this.x, this.y + moveY, this.width, this.height)) {
        this.y += moveY;
      }
    }

    this.applyKnockback(dt);

    // Clamp inside map bounds as a final safety net.
    this.x = Math.min(Math.max(this.x, 0), map.width - this.width);
    this.y = Math.min(Math.max(this.y, 0), map.height - this.height);
  }

  // Returns the attack hitbox while mid-swing, else null.
  getAttackHitbox() {
    if (this.attackTimer <= 0 || this.attackTimer < ATTACK_DURATION * 0.55) return null;

    const cx = this.centerX;
    const cy = this.centerY;
    switch (this.facing) {
      case 'up':
        return { x: cx - ATTACK_ARC_WIDTH / 2, y: this.y - ATTACK_RANGE, width: ATTACK_ARC_WIDTH, height: ATTACK_RANGE };
      case 'down':
        return { x: cx - ATTACK_ARC_WIDTH / 2, y: this.y + this.height, width: ATTACK_ARC_WIDTH, height: ATTACK_RANGE };
      case 'left':
        return { x: this.x - ATTACK_RANGE, y: cy - ATTACK_ARC_WIDTH / 2, width: ATTACK_RANGE, height: ATTACK_ARC_WIDTH };
      case 'right':
        return { x: this.x + this.width, y: cy - ATTACK_ARC_WIDTH / 2, width: ATTACK_RANGE, height: ATTACK_ARC_WIDTH };
      default:
        return null;
    }
  }

  gainXp(amount) {
    this.xp += amount;
    let leveledUp = false;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = this.level * 100;
      this.maxHp += 20;
      this.hp = this.maxHp;
      this.damage += 10;
      leveledUp = true;
    }
    return leveledUp;
  }

  draw(ctx, camera) {
    const screenX = Math.round(this.x - camera.renderX);
    const screenY = Math.round(this.y - camera.renderY);
    const cx = screenX + this.width / 2;

    // Soft ground shadow sells depth/weight.
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(cx, screenY + this.height + 2, this.width * 0.42, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Walk-cycle bob: subtle vertical oscillation while moving.
    const bob = this.moving ? Math.sin(this.animTime * 10) * 2 : Math.sin(this.animTime * 2) * 0.6;
    const legSwing = this.moving ? Math.sin(this.animTime * 10) * 6 : 0;

    ctx.save();
    ctx.translate(cx, screenY + bob);

    const flashing = this.flashTimer > 0;
    const bodyColor = flashing ? '#ffffff' : '#3a7d63';
    const cloakColor = flashing ? '#ffffff' : '#2b5c48';
    const skinColor = flashing ? '#ffffff' : '#e8c39e';

    // Legs
    ctx.fillStyle = flashing ? '#ffffff' : '#28211a';
    ctx.fillRect(-9, 10 - legSwing * 0.15, 6, 12 + legSwing * 0.2);
    ctx.fillRect(3, 10 + legSwing * 0.15, 6, 12 - legSwing * 0.2);

    // Cloak/body
    ctx.fillStyle = cloakColor;
    ctx.beginPath();
    ctx.moveTo(-11, 10);
    ctx.lineTo(-13, -8);
    ctx.quadraticCurveTo(0, -16, 13, -8);
    ctx.lineTo(11, 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.fillRect(-9, -8, 18, 16);

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, -18, 8, 0, Math.PI * 2);
    ctx.fill();

    // Hood shadow
    ctx.fillStyle = flashing ? 'rgba(255,255,255,0.7)' : 'rgba(30,20,10,0.35)';
    ctx.beginPath();
    ctx.arc(0, -20, 9, Math.PI, Math.PI * 2);
    ctx.fill();

    // Facing indicator: small eyes / direction dot
    if (!flashing) {
      ctx.fillStyle = '#1a140c';
      if (this.facing === 'left') ctx.fillRect(-6, -19, 2, 2);
      else if (this.facing === 'right') ctx.fillRect(4, -19, 2, 2);
      else if (this.facing === 'down') {
        ctx.fillRect(-4, -19, 2, 2);
        ctx.fillRect(2, -19, 2, 2);
      }
    }

    // Sword swing arc, only while attack hitbox is active.
    if (this.isAttacking) {
      const swingT = 1 - this.attackTimer / ATTACK_DURATION;
      ctx.save();
      ctx.strokeStyle = flashing ? '#ffffff' : '#e8dfc8';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      let baseAngle = 0;
      if (this.facing === 'up') baseAngle = -Math.PI / 2;
      else if (this.facing === 'down') baseAngle = Math.PI / 2;
      else if (this.facing === 'left') baseAngle = Math.PI;
      else baseAngle = 0;

      const swingAngle = baseAngle + (swingT - 0.5) * 1.6;
      const len = 24;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(Math.cos(swingAngle) * len, -4 + Math.sin(swingAngle) * len);
      ctx.stroke();

      // Glint at blade tip
      ctx.fillStyle = flashing ? '#ffffff' : '#6fe3d4';
      ctx.beginPath();
      ctx.arc(Math.cos(swingAngle) * len, -4 + Math.sin(swingAngle) * len, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}
