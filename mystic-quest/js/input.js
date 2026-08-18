// Tracks which keys are currently held down, plus one-shot "just pressed" events.
export class InputManager {
  constructor() {
    this.keysDown = new Set();
    this.justPressed = new Set();
    this._pendingJustPressed = new Set();

    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._onKeyUp(e));
    window.addEventListener('blur', () => this.keysDown.clear());
  }

  _onKeyDown(e) {
    const code = e.code;
    if (!this.keysDown.has(code)) {
      this._pendingJustPressed.add(code);
    }
    this.keysDown.add(code);

    // Prevent page scroll on game keys.
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    this.keysDown.delete(e.code);
  }

  isDown(...codes) {
    return codes.some((c) => this.keysDown.has(c));
  }

  wasJustPressed(...codes) {
    return codes.some((c) => this.justPressed.has(c));
  }

  // Call once at the start of each frame, before game logic reads wasJustPressed.
  beginFrame() {
    this.justPressed = this._pendingJustPressed;
    this._pendingJustPressed = new Set();
  }
}
