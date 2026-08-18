// Minimal shared state that doesn't naturally belong to a single entity.
// Kept intentionally small — most state lives on Player/Map/Camera directly.
export class GameState {
  constructor() {
    this.status = 'start'; // 'start' | 'playing' | 'paused'
    this.areaName = 'Village';
  }
}
