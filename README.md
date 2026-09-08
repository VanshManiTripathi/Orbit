# 🚀 Orbit: Interplanetary Savings Voyage

> Turn your daily savings into an epic journey across the Solar System. Save money, fuel your rocket, discover cosmic relics, and conquer retro-arcade minigames at every planet you reach!

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## ✨ What is Orbit?

**Orbit** is a gamified savings tracker that transforms financial habits into space exploration. Every rupee saved adds fuel to your spaceship, pushing your voyage further from **Earth** all the way to **Neptune** at the edge of the solar system.

---

## 🌟 Key Features

### 💰 Save to Fly (Gamified Finance)
- **Daily Piggy Bank**: Deposit small savings daily to produce refined rocket fuel.
- **Streak Tracker**: Build consecutive saving streaks to earn extra fuel and bonus credits.
- **Daily Limits & Fair Caps**: Built-in limits (max ₹400/day, max 5 rocket launches/day) encourage healthy, consistent habits.

### 🪐 6 Planets to Explore
Travel through 5 expedition chapters, unlocking new dynamic color themes, stations, and lore:
1. **Earth** (Origin) — Atmospheric launch pad.
2. **Moon** (384,400 KM) — Luna Gate Base.
3. **Mars** (54.6M KM) — Olympus Mons Outpost.
4. **Jupiter** (588M KM) — Great Jovian Harbor.
5. **Saturn** (650M KM) — Cassini Ring Gate.
6. **Neptune** (1.5B KM) — Deep Void Citadel.

### 🛸 Fleet Hangar (6 Unique Spaceships)
Unlock a brand-new flagship at every celestial body, each with distinct visuals and upgrades:
- **Aegis-VII Hopper** (Earth) — Balanced cadet ion shuttle.
- **Luna Artemis Interceptor** (Moon) — Helium-3 thruster interceptor.
- **Ares Martian Vanguard** (Mars) — Titanium-reinforced planetary explorer.
- **Jovian Titan Dreadnought** (Jupiter) — Heavy radiation-shielded dreadnought.
- **Chronos Ringrunner** (Saturn) — High-maneuverability ice ring runner.
- **Neptune Void Sovereign** (Neptune) — Dark-matter warp flagship.
- **Avionics Upgrades**: Upgrade **Engine**, **Fuel Tank**, **Shields**, and **Scanner** using credits found during missions.

### 🕹️ 5 Retro-Arcade Minigames
Each destination features its own custom 60fps arcade simulator with high-score tracking:
- 🌙 **Luna Defender (Moon)**: Classic wave shooter — blast asteroids and alien UFOs before they hit your lunar base.
- 🔴 **Mars Rover Rush (Mars)**: Fast canyon runner — jump over chasms, dodge boulders, and collect solar crystals.
- 🟠 **Jovian Vortex Surfer (Jupiter)**: Orbit switcher — surf 3 concentric bands around the Great Red Spot while deflecting lightning arcs.
- 🟢 **Saturn Ringrunner (Saturn)**: Slalom runner — dodge ice glaciers and fly through glowing Gravitational Warp Gates for combo multipliers.
- 🔵 **Neptune Void Pulse (Neptune)**: Phase-shift runner — activate dark matter intangibility to phase unharmed through cosmic void rifts.

### 💎 10 Collectible Space Relics
Equip your scanner to discover 10 rare space relics during launches, ranging from **Vintage Satellites** to the legendary **Archon Solar Monolith**.

---

## 🎮 Controls

The app works seamlessly on both **Desktop** and **Mobile / Tablets**:

| Action | Desktop Keys | Mobile / Touch |
| :--- | :--- | :--- |
| **Steer / Move** | `Arrow Keys` or `W`, `A`, `S`, `D` | On-screen tactile buttons `[◀]` `[▶]` |
| **Action / Jump / Phase** | `Spacebar` or `F` | On-screen Action buttons (`Jump`, `Pulse`, `Boost`, `Phase`) |
| **Pause Game** | `P` or Pause button | Top bar `[⏸]` button |

---

## ⚡ Quick Start

Orbit runs **100% in the browser** with zero dependencies, no build tools, and no server installation required!

### Option 1: Direct File
Simply double-click `index.html` to open it in any modern browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server (Recommended)
Using Python:
```bash
python -m http.server 3000
```
Or using Node.js:
```bash
npx serve .
```
Then open `http://localhost:3000` in your browser.

---

## 🛠️ Project Structure

```text
Orbit/
├── index.html              # Main single-page web app & UI modals
├── assests/                # High-res photos & spaceship artwork
│   ├── jupiter.jpg
│   ├── saturn.jpg
│   ├── neptune.jpg
│   ├── ship_aegis.jpg
│   ├── ship_artemis.jpg
│   ├── ship_ares.jpg
│   ├── ship_jovian.svg
│   ├── ship_chronos.svg
│   └── ship_sovereign.svg
├── js/
│   ├── storage.js          # LocalStorage save/load & spaceship definitions
│   ├── player.js           # Core state & credit management
│   ├── savings.js          # Savings piggy bank & streak logic
│   ├── journey.js          # Planetary progress & chapters
│   ├── upgrades.js         # Rocket module upgrade system
│   ├── encounters.js       # Launch anomalies & events
│   ├── discoveries.js      # 10 Space Relics catalog
│   ├── shooter.js          # Moon: Luna Defender minigame
│   ├── mars_minigame.js    # Mars: Mars Rover Rush minigame
│   ├── jupiter_minigame.js # Jupiter: Jovian Vortex Surfer minigame
│   ├── saturn_minigame.js  # Saturn: Saturn Ringrunner minigame
│   ├── neptune_minigame.js # Neptune: Neptune Void Pulse minigame
│   └── ui.js               # HUD rendering, theme switcher & dev tools
└── README.md
```

---

## 👨‍💻 Developer Tools

Head to the **Profile (Tab 5)** and scroll to **Developer Testing Tools** for convenient one-click testing shortcuts:
- Toggle planet unlocks (Moon, Mars, Jupiter, Saturn, Neptune).
- Toggle / reset daily savings and 5-launch caps.
- Unlock all 6 planets and flagships instantly.

---

## 📄 License

This project is licensed under the MIT License - feel free to use and customize it!
