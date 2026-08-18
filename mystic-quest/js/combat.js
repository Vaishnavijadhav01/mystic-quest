import { rectsOverlap } from './entity.js';

// Checks the player's active attack hitbox against all living enemies.
// Each swing can only hit a given enemy once (tracked via player.hasHitThisSwing
// combined with a per-enemy "hit this swing" set to keep it simple).
export function resolvePlayerAttack(player, enemies, particles, camera, onEnemyKilled) {
  const hitbox = player.getAttackHitbox();
  if (!hitbox || player.hasHitThisSwing) return;

  let hitSomething = false;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (rectsOverlap(hitbox, enemy.getBounds())) {
      enemy.takeDamage(player.damage, player.centerX, player.centerY);
      particles.spawnHitBurst(enemy.centerX, enemy.centerY - enemy.height / 2, '#e2596b');
      particles.spawnDamageNumber(enemy.centerX, enemy.y - 4, player.damage);
      camera.shake(3, 0.12);
      hitSomething = true;

      if (!enemy.alive) {
        particles.spawnCoinPop(enemy.centerX, enemy.y - 10, enemy.coinDrop);
        onEnemyKilled(enemy);
      }
    }
  }

  // Once this swing has connected with anyone, don't let it hit again
  // until the next attack starts (getAttackHitbox already gates timing,
  // this flag prevents multi-hit within the same active window).
  if (hitSomething) {
    player.hasHitThisSwing = true;
  }
}
