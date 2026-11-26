# Roblox Rivals — HTML5 Edition

A fast-paced, browser-based 3D 1v1 Arena FPS inspired by **Roblox Rivals**, built with pure HTML5, CSS, Three.js, and Web Audio API — zero build tools required.

Play live on GitHub Pages: **[https://nyez2016.github.io/roblox-rivals-html/](https://nyez2016.github.io/roblox-rivals-html/)**

## Features

- **4 Playable Arena Maps** *(with live 3D menu preview)*:
  - **Arena (Classic)** — Symmetrical bridge, side ramps, sniper perches, and stud crates
  - **Neon Station** — Cyberpunk nighttime subway platforms & climbable central metro train
  - **Construction** — Sunset rooftop scaffolding tower, overhead crane & shipping containers
  - **Splash Park** — Tropical pool island, twin water slides & colorful cabanas
- **16 Weapons Across All 4 Loadout Slots**:
  - **Primary (6)**: Assault Rifle, Sniper (1-shot headshot + scope), Burst Rifle, Shotgun (8-pellet spread), Paintball Gun (colorful paint splats), Minigun (rotary barrels, 60-round drum)
  - **Secondary (4)**: Revolver, Uzi, Handgun, Shorty (sawed-off 6-pellet pocket shotgun)
  - **Melee (3)**: Katana (fast dash lunge), Scythe (high upward reap dash), Battle Axe (heavy cleave)
  - **Utility (3)**: Frag Grenade (bouncing AoE blast), Molotov (shattering fire pool DoT), Flashbang (blinds & stuns Rival Bot)
- **12 Skins & Wraps**:
  - **8 Weapon Wraps** *(also customize tracer colors)*: Standard, Cyber Neon, 24K Gold, Sakura, Crimson Dragon, Cosmic Galaxy, Toxic Emerald, and animated **Rainbow Prism**
  - **4 Rival Avatar Skins**: Red Rival, Shadow Ninja, Golden Champ, Frost Knight
- **Roblox-Inspired Movement**: Fast strafing, jumping, momentum **Slide Boost** (`Shift` or `C`), quick **Dash** (`E` or `Q`), and melee **RMB Lunge**.
- **Saved Preferences**: Loadout, map, skins, sensitivity, and FOV are automatically saved in `localStorage`.

## Controls

| Key / Input | Action |
|---|---|
| `W A S D` | Move |
| `Mouse` | Aim |
| `Left Click` | Shoot / Melee Slash / Throw Utility |
| `Right Click` | Aim Down Sights (ADS) / Melee Lunge |
| `Space` | Jump |
| `Shift` or `C` | Slide Boost |
| `E` or `Q` | Quick Dash |
| `1` `2` `3` `4` / Scroll | Switch Weapon |
| `R` | Reload |
| `Esc` | Pause / Loadout, Maps & Skins Menu |

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
├── index.html       # Entry point, HUD & tabbed Loadout / Maps / Skins menu
├── styles.css       # Rivals-inspired esports HUD & overlay styling
├── src/
│   ├── game.js      # Main Three.js loop, player physics, combat, Molotov/Flash & round state
│   ├── arena.js     # 4 procedural Roblox stud-textured maps & collision engine
│   ├── weapons.js   # 16 weapons, stats & 3D viewmodel builders
│   ├── skins.js     # 8 weapon wraps (including procedural Galaxy/Sakura/Prism) & 4 Rival skins
│   ├── bot.js       # Blocky rival avatar, skin support, flashbang stun & tactical AI
│   └── audio.js     # Web Audio API procedural SFX synthesizer
├── LICENSE
└── README.md
```

## License

MIT
