// A single lightweight particle: position, velocity, life, and a render kind.
class Particle {
  constructor(x, y, vx, vy, life, kind, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.kind = kind; // 'dust' | 'burst' | 'text'
    this.options = options;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this._ambientSpawnTimer = 0;
  }

  spawnAmbient(map) {
    // Slow floating dust motes drifting across the whole map, for atmosphere.
    for (let i = 0; i < 18; i++) {
      this.particles.push(
        new Particle(
          Math.random() * map.width,
          Math.random() * map.height,
          (Math.random() - 0.5) * 6,
          -4 - Math.random() * 6,
          999999,
          'dust',
          { radius: 1 + Math.random() * 1.5, alpha: 0.15 + Math.random() * 0.25, phase: Math.random() * Math.PI * 2 }
        )
      );
    }
  }

  spawnHitBurst(x, y, color = '#e2596b') {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 60 + Math.random() * 60;
      this.particles.push(
        new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.4, 'burst', { color, radius: 3 })
      );
    }
  }

  spawnDamageNumber(x, y, amount, color = '#e2596b') {
    this.particles.push(
      new Particle(x, y, (Math.random() - 0.5) * 20, -50, 0.8, 'text', { text: `-${amount}`, color })
    );
  }

  spawnCoinPop(x, y, amount) {
    this.particles.push(
      new Particle(x, y, 0, -40, 0.9, 'text', { text: `+${amount}`, color: '#f2a154' })
    );
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'burst') {
        p.vx *= 0.9;
        p.vy *= 0.9;
      }
      if (p.kind === 'text') {
        p.vy *= 0.94;
      }
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx, camera, elapsedTime) {
    for (const p of this.particles) {
      const screenX = p.x - camera.renderX;
      const screenY = p.y - camera.renderY;
      if (screenX < -20 || screenX > camera.viewWidth + 20 || screenY < -20 || screenY > camera.viewHeight + 20) {
        continue;
      }

      if (p.kind === 'dust') {
        const bob = Math.sin(elapsedTime * 0.8 + p.options.phase) * 4;
        ctx.globalAlpha = p.options.alpha;
        ctx.fillStyle = '#6fe3d4';
        ctx.beginPath();
        ctx.arc(screenX + bob, screenY, p.options.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.kind === 'burst') {
        const t = p.life / p.maxLife;
        ctx.globalAlpha = t;
        ctx.fillStyle = p.options.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.options.radius * t, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.kind === 'text') {
        const t = p.life / p.maxLife;
        ctx.globalAlpha = Math.min(1, t * 1.5);
        ctx.font = '700 15px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillText(p.options.text, screenX + 1, screenY + 1);
        ctx.fillStyle = p.options.color;
        ctx.fillText(p.options.text, screenX, screenY);
        ctx.globalAlpha = 1;
      }
    }
  }
}
