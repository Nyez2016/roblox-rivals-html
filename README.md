# Roblox Rivals — HTML5 Edition

A fast-paced, browser-based 3D Arena FPS inspired by **Roblox Rivals**, built with pure HTML5, CSS, Three.js, and Web Audio API — zero build tools or local server required.

Play live on GitHub Pages: **[https://nyez2016.github.io/roblox-rivals-html/](https://nyez2016.github.io/roblox-rivals-html/)**

## Features

- **39 Authentic Roblox Rivals Weapons + Key Unlock Progression**:
  - Start with the classic **Starter Loadout**: **Assault Rifle**, **Handgun**, **Fists**, and **Grenade** (plus 40 bonus Keys!).
  - Earn **Keys** from eliminations (`+4`, `+6` for Headshot/Backstab/Wallbang), Round Wins (`+12`), Match Victories (`+40`), and Shooting Range Dummies (`+1` / `+20` Secret Boss) to unlock higher-tier **Standard**, **Pro**, **Exotic**, and **Mythic** weapons.
  - **Live Weapon Profile Inspector**: Click or hover any weapon in the Armory to inspect its tier, tactical description, pro tip, and stat bars (Damage, Fire Rate, Range, Mobility), and unlock or equip directly.
  - **Primary (13)**: Assault Rifle (Starter), Burst Rifle, Shotgun, Bow, **RPG** (Explosive + Rocket Jump), Crossbow, Gunblade, **Sniper** (**Scope-Only** — must hold `RMB` to fire!), Paintball Gun, **Flamethrower**, **Energy Rifle**, Minigun, **Phase Railgun** (pierces straight through solid walls!)
  - **Secondary (10)**: Handgun (Starter), Uzi, **Flare Gun** (ignites fire pools), Shorty, Revolver, Daggers, Spray, Slingshot, **Exogun** (explosive splash bolts), **Energy Pistols**
  - **Melee (8)**: Fists (Starter), Knife (105 Backstab), Chainsaw, Katana, Battle Axe, Imperial Saber (95 Backstab), **Scythe** (`RMB` Scythe Jump), **Trowel** (`RMB` builds solid 3D brick cover walls!)
  - **Utility (8)**: Grenade (Starter, Grenade Jump), Smoke Grenade, Flashbang, Molotov, **Satchel** (mega blast & jump), **Freeze Ray** (freezes rivals in ice for 2.2s), **War Horn** (+38% speed & +25% fire rate surge), **Medkit** (+50 HP heal)
- **Double Jump & Dynamic Movement**: Tap `Space` a second time in mid-air for a crisp **Double Jump** (`2x AIR JUMP`), paired with Slide Boost (`Shift`/`C`), Quick Dash (`E`/`Q`), Ladders, Jump Pads, Grenade Jumps, Rocket Jumps, and Scythe Jumps.
- **9 Vertically Enhanced Arena Maps** *(with live 3D menu preview)*:
  - **Arena (Classic)** — Symmetrical bridge, twin ladders & jump pads up to a **2nd-Story Sky Arch Overpass**
  - **Shooting Range** — Tactical firing bays, escapable perimeter & Golden Boss Dummy, plus a **3-Story Sniper Watchtower**
  - **Sky Islands** — Floating grassy islands above the clouds topped by an **Upper Cloud Citadel Peak**
  - **Cloud Spire** — Multi-tier airborne sky citadel crowned by the **Stratosphere Needle Peak**
  - **Orbital Zero-G** — Deep space station with `0.36x` low gravity, anti-grav jump pads, and **High Orbit Command Deck**
  - **Jade Courtyard** — Eastern palace with climbable pagoda roof and **3rd-Tier Spire**
  - **Neon Station** — Cyberpunk subway with a **live Express Train** hazard and elevated **Neon Skywalk Concourse** above the tracks
  - **Construction** — Airborne skyscraper site with climbable **Crane Ladder**, walkable **Crane Boom**, and **Upper Crane Jib Overlook**
  - **Splash Park** — Tropical pool island, water slides, geysers, and **High-Dive Sky Platform**
- **Realistic Procedural Audio Engine**: Web Audio API compressor + arena convolution reverb with layered gunshot punch, supersonic cracks, shell casing clinks, bolt racks, footsteps, double-jump air bursts, reload stages, and weapon-specific SFX.
- **8 Game Modes**: `Classic 1v1`, `2v2 Duel`, `Team Deathmatch (3v3)`, `Shooting Range`, `Practice Rounds`, `Ancient Assassin`, `Sniper Only`, and `Randomizer`.
- **Auto Shoot Mode & Gravity System**: Toggle Auto Shoot (`F`) or switch gravity (`Map Default`, `1.0x`, `Low-G 0.38x`, `Zero-G 0.22x`) on any map.
- **17 Skins, 5 Kill Effects, Weapon Inspects & 3rd-Person Emotes**: 11 weapon wraps (including animated Rainbow Prism), 6 rival skins, 5 kill effects, multi-stage reloads, weapon inspects (`G`/`I`), and Rivals emotes (`B`/`Z`/`X`/`V`).

## Controls

| Key / Input | Action |
|---|---|
| `W A S D` | Move |
| `Mouse` | Aim |
| `Left Click` | Shoot / Melee Slash / Use Utility |
| `Right Click` | Aim Down Sights (Required for Sniper!) / Melee Lunge / Trowel Build Wall |
| `Space` (x2) | Jump & **Double Jump** |
| `Shift` or `C` | Slide Boost |
| `E` or `Q` | Quick Dash |
| `F` | Toggle Auto Shoot |
| `G` or `I` | Weapon Inspect Flourish |
| `B` / `Z` / `X` / `V` | Emote Picker / Quick Emotes (Griddy, Take the L, Backflip, Blade Flex, GG Wave) |
| `1` `2` `3` `4` / Scroll | Switch Weapon |
| `R` | Reload |
| `Esc` | Pause / Armory, Profiles, Key Unlocks, Maps & Skins Menu |

## Run Locally

Just **double-click `index.html`** directly in your browser — no build step or local server required!

You can also serve it over HTTP if you prefer:

```bash
python -m http.server 8000
```

## License

MIT
