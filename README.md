# Roblox Rivals — HTML5 Edition

A fast-paced, browser-based 3D 1v1 Arena FPS inspired by **Roblox Rivals**, built with pure HTML5, CSS, Three.js, and Web Audio API — zero build tools required.

Play live on GitHub Pages: **[https://nyez2016.github.io/roblox-rivals-html/](https://nyez2016.github.io/roblox-rivals-html/)**

## Features

- **First-to-5 1v1 Arena Duels**: Classic competitive round format with between-round loadout customization and round countdowns.
- **Roblox-Inspired Movement**: Fast strafing, jumping, momentum **Slide Boost** (`Shift` or `C`), and quick **Dash** (`E` or `Q`).
- **Rivals Loadout System**:
  - **Primary**: Assault Rifle, Burst Rifle, or Sniper (one-shot headshot + scope zoom)
  - **Secondary**: Revolver or Uzi
  - **Melee**: Katana (faster movement + right-click lunge slash)
  - **Utility**: Frag Grenade with physics bounce & blast radius
- **Smart Rival Bot AI**: Blocky Roblox-style opponent with distinct head/body hitboxes, strafing, high-ground navigation, cover peeking, and selectable difficulty (`Rookie`, `Pro`, `Nemesis`).
- **Zero External Assets**: Procedurally generated Roblox stud textures and synthesized Web Audio sound effects (gunshots, headshot dings, slides, explosions).

## Controls

| Key / Input | Action |
|---|---|
| `W A S D` | Move |
| `Mouse` | Aim |
| `Left Click` | Shoot / Melee Slash / Throw Grenade |
| `Right Click` | Aim Down Sights (ADS) / Katana Lunge |
| `Space` | Jump |
| `Shift` or `C` | Slide Boost |
| `E` or `Q` | Quick Dash |
| `1` `2` `3` `4` / Scroll | Switch Weapon |
| `R` | Reload |
| `Esc` | Pause / Settings & Loadout |

## Run Locally

Because the game uses ES modules, serve the directory with any static HTTP server:

```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx serve .
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## Project Structure

```text
roblox-rivals-html/
├── index.html       # Entry point, HUD, loadout menu & settings UI
├── styles.css       # Rivals-inspired esports HUD & overlay styling
├── src/
│   ├── game.js      # Main Three.js loop, player physics, shooting & round state
│   ├── arena.js     # Procedural Roblox stud arena geometry & collision engine
│   ├── weapons.js   # Weapon stats, viewmodel builders & recoil profiles
│   ├── bot.js       # Blocky rival avatar model & tactical combat AI
│   └── audio.js     # Web Audio API procedural SFX synthesizer
├── LICENSE
└── README.md
```

## License

MIT
