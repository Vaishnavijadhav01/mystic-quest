// Camera position is the top-left of the viewport in world space. It eases
// toward the target (the player) rather than snapping, and clamps to the
// map bounds so you never see past the edge of the world.
export class Camera {
  constructor(viewWidth, viewHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;

    this.shakeTimer = 0;
    this.shakeMagnitude = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  follow(targetCenterX, targetCenterY, map, dt) {
    const desiredX = targetCenterX - this.viewWidth / 2;
    const desiredY = targetCenterY - this.viewHeight / 2;

    // Exponential smoothing, frame-rate independent.
    const smoothing = 1 - Math.pow(0.001, dt);
    this.x += (desiredX - this.x) * smoothing;
    this.y += (desiredY - this.y) * smoothing;

    const maxX = Math.max(0, map.width - this.viewWidth);
    const maxY = Math.max(0, map.height - this.viewHeight);
    this.x = Math.min(Math.max(this.x, 0), maxX);
    this.y = Math.min(Math.max(this.y, 0), maxY);

    this._updateShake(dt);
  }

  shake(magnitude, duration) {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  _updateShake(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const falloff = Math.max(0, this.shakeTimer);
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeMagnitude * falloff;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeMagnitude * falloff;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeMagnitude = 0;
    }
  }

  // World-space camera position including the current shake offset,
  // used when translating the canvas context for rendering.
  get renderX() {
    return this.x + this.shakeOffsetX;
  }

  get renderY() {
    return this.y + this.shakeOffsetY;
  }
}
