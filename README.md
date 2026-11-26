# Roblox Rivals — HTML5 Edition

A fast-paced, browser-based 3D 1v1 Arena FPS inspired by **Roblox Rivals**, built with pure HTML5, CSS, Three.js, and Web Audio API — zero build tools or local server required.

Play live on GitHub Pages: **[https://nyez2016.github.io/roblox-rivals-html/](https://nyez2016.github.io/roblox-rivals-html/)**

## Features

- **9 Playable Arena Maps** *(with live 3D menu preview)*:
  - **Arena (Classic)** — Symmetrical bridge, side ramps, sniper perches, and stud crates
  - **Shooting Range** — Tactical firing bays, distance markers, sniper balcony, and 6 interactive static/strafing Test Dummies
  - **Sky Islands** — Floating grassy islands high above the clouds with sky bridges, jump pads, and void ring-outs
  - **Cloud Spire** — Multi-tier airborne sky citadel with glass walkways, floating monoliths, and open-air sky edges
  - **Orbital Zero-G** — Deep space station with starfield, ringed planet, **0.36x low gravity**, and 4 Anti-Gravity Jump Pads
  - **Jade Courtyard** — Eastern palace with lotus pond, central Jade Arch Bridge, climbable Vermilion Pagoda rooftops, hanging lanterns, stone archways, bamboo groves, and 2 Wind Jump Pads
  - **Neon Station** — Cyberpunk nighttime subway platforms, climbable central metro train, and a **live speeding Express Train** that flashes warning lights and squashes anyone caught on the tracks
  - **Construction** — High-altitude airborne skyscraper construction site floating over clouds & city skyline with suspended steel platforms, **walkable yellow Crane Boom** (reachable via Grenade Jump or Scythe Jump!), hoist launch pads, and open-air drops
  - **Splash Park** — Tropical pool island, twin water slides & water geyser launch pads
- **Auto Shoot Mode**: Toggle **Auto Shoot** in Settings or press `F` mid-match to automatically fire whenever your crosshair locks onto a target!
- **Gravity System**: Switch between `Map Default`, `Earth 1.0x`, `Lunar Low-G (0.38x)`, and `Zero-G Bounce (0.22x)` on any map.
- **8 Game Modes**: `Classic 1v1`, `2v2 Duel` (You + AI Blue Ally vs 2 Red Rivals, First to 5 rounds), `Team Deathmatch` (3v3 with fast respawns, First to 25 kills), `Shooting Range` (free-play test dummies with instant weapon swapping & infinite ammo), `Practice Rounds` (3 moving, strafing & jumping NPCs that never shoot back), `Ancient Assassin`, `Sniper Only`, and `Randomizer`.
- **23 Weapons Across All 4 Loadout Slots**:
  - **Primary (9)**: Assault Rifle, **Phase Railgun (pierces straight through walls!)**, Sniper, Repeating Crossbow, Frost Longbow, Burst Rifle, Shotgun, Paintball Gun, Minigun
  - **Secondary (5)**: Revolver, Shadow Kunai, Uzi, Handgun, Shorty
  - **Melee (5)**: Katana, Shadow Daggers (105 Backstab), Imperial Saber (95 Backstab), Scythe, Battle Axe
  - **Utility (4)**: Frag Grenade, Smoke Bomb (blocks Rival Bot vision), Molotov, Flashbang
- **17 Skins & 5 Kill Effects**:
  - **11 Weapon Wraps**: Standard, Blue Porcelain, Jade Dragon, Starlight Orbital, Cyber Neon, 24K Gold, Sakura, Crimson Dragon, Cosmic Galaxy, Toxic Emerald, and animated **Rainbow Prism**
  - **6 Rival Avatar Skins**: Red Rival, Imperial Assassin (with conical hat), Space Astronaut (with jetpack), Shadow Ninja, Golden Champ, Frost Knight
  - **5 Kill Effects**: Classic, Golden Thunder, Sakura Burst, Void Black Hole, and Voxel Shatter

## Controls

| Key / Input | Action |
|---|---|
| `W A S D` | Move |
| `Mouse` | Aim |
| `Left Click` | Shoot / Melee Slash / Throw Utility |
| `Right Click` | Aim Down Sights (ADS) / Melee Lunge / Backstab |
| `F` | Toggle Auto Shoot |
| `G` or `I` | Weapon Inspect Flourish |
| `B` / `Z` / `X` / `V` | Emote Picker / Quick Emotes (Griddy, Take the L, Backflip, Blade Flex, GG Wave) |
| `Space` | Jump |
| `Shift` or `C` | Slide Boost |
| `E` or `Q` | Quick Dash |
| `1` `2` `3` `4` / Scroll | Switch Weapon |
| `R` | Reload |
| `Esc` | Pause / Loadout, Maps, Gravity, Modes & Skins Menu |

## Run Locally

Just **double-click `index.html`** directly in your browser — no build step or local server required!

You can also serve it over HTTP if you prefer:

```bash
python -m http.server 8000
```

## License

MIT
