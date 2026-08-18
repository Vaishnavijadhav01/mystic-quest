# Mystic Quest

A browser-based 2D adventure game built with vanilla HTML5 Canvas, CSS3, and
JavaScript — no game engine, no framework. The village crystal has been
stolen; explore, fight slimes, and take it back.

![Mystic Quest gameplay](screenshots/gameplay.png)

## Play it

Open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

No build step, no `npm install` — it's plain ES modules loaded straight by
the browser.

## Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` / Arrow keys | Move |
| `Space` | Attack |
| `Esc` | Pause / Resume |

## What's implemented (Phase 1 vertical slice)

- Smooth 4-directional player movement with a procedurally-animated sprite
  (walk bob, leg swing, sword-swing arc on attack) — no static rectangles.
- One fully realized Village area: a seeded, deterministic tilemap with
  grass texture variation, a path crossing, a pond, scattered trees/rocks,
  and ambient floating particles for atmosphere.
- Combat: directional attack hitbox, enemy knockback, hit-flash, floating
  damage numbers, camera screen-shake on hit, and coin/XP drops on kill.
- Slime enemies with wander/chase AI and squash-and-stretch bounce animation.
- A styled HUD (animated liquid health orb, XP bar, coin counter, area
  label) and custom start/pause screens — no default browser UI anywhere.
- Smooth camera-follow with easing, clamped to map bounds.
- Level-up system (HP/damage scale with XP gained from kills).

## Built with

Vanilla JavaScript (ES modules) and the Canvas 2D API. No game engine, no
build tooling — chosen deliberately to demonstrate the underlying
fundamentals (game loop, collision, camera math, animation) rather than
lean on a framework.

## Architecture

The game follows a small entity/state structure: `Entity` is a base class
(`js/entity.js`) providing shared position, health, knockback, and hit-flash
logic; `Player` and `Slime` extend it with their own movement/AI and
rendering. A single `requestAnimationFrame` loop in `js/main.js` drives
delta-time-based updates, so movement speed stays consistent regardless of
frame rate. World state (`GameMap`, `Camera`, `ParticleSystem`) is passed
into each entity's `update()`/`draw()` rather than living in globals.

## Project structure

```
mystic-quest/
├── index.html
├── css/
│   ├── style.css     # layout, canvas container
│   ├── hud.css        # health orb, coin counter, area label
│   └── menu.css       # start/pause screens
├── js/
│   ├── main.js         # game loop, init, HUD sync, menu wiring
│   ├── gameState.js
│   ├── entity.js        # base class: position, health, knockback, hit-flash
│   ├── player.js
│   ├── enemy.js          # Slime: wander/chase AI
│   ├── map.js             # tilemap generation, collision, rendering
│   ├── camera.js          # smooth follow-camera + screen shake
│   ├── combat.js          # attack resolution
│   ├── particles.js       # ambient + hit + damage-number particles
│   └── input.js            # keyboard state tracking
└── screenshots/
```

## Roadmap (not yet built)

Phase 2: a second area, inventory panel, an NPC with dialogue + a quest,
and a lock puzzle. Phase 3: a boss battle, save/load via `localStorage`,
win/lose screens, and audio. See the original design brief for the full
scope — this repo currently ships the Phase 1 vertical slice: one polished,
playable area with full combat and UI.

## License

MIT — see [LICENSE](LICENSE).
