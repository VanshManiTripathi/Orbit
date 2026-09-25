const DEFAULT_SPACESHIPS = {
    aegis: {
        id: "aegis",
        name: "Aegis-VII Hopper",
        planet: "Earth",
        unlocked: true,
        desc: "Standard cadet atmospheric shuttle with balanced ion drives.",
        icon: "rocket_launch",
        badge: "Earth Origin",
        image: "assests/ship_aegis.jpg",
        engine: 1,
        fuel: 1,
        shield: 1,
        scanner: 1
    },
    artemis: {
        id: "artemis",
        name: "Luna Artemis Interceptor",
        planet: "Moon",
        unlocked: false,
        desc: "Low-gravity lunar interceptor equipped with hyper-efficient helium thrusters.",
        icon: "flight_takeoff",
        badge: "Luna Fleet",
        image: "assests/ship_artemis.jpg",
        engine: 1,
        fuel: 1,
        shield: 1,
        scanner: 1
    },
    ares: {
        id: "ares",
        name: "Ares Martian Vanguard",
        planet: "Mars",
        unlocked: false,
        desc: "Heavy deep-space cruiser reinforced with titanium heat plating for Martian atmospheres.",
        icon: "rocket",
        badge: "Martian Outpost",
        image: "assests/ship_ares.jpg",
        engine: 1,
        fuel: 1,
        shield: 1,
        scanner: 1
    },
    jovian: {
        id: "jovian",
        name: "Jovian Titan Dreadnought",
        planet: "Jupiter",
        unlocked: false,
        desc: "Massive gas-giant flagship equipped with electromagnetic radiation deflectors.",
        icon: "travel_explore",
        badge: "Jovian Station",
        image: "assests/ship_jovian.svg",
        engine: 1,
        fuel: 1,
        shield: 1,
        scanner: 1
    },
    chronos: {
        id: "chronos",
        name: "Chronos Ringrunner",
        planet: "Saturn",
        unlocked: false,
        desc: "High-maneuverability exploration craft designed to navigate ice rings and asteroid fields.",
        icon: "crisis_alert",
        badge: "Titan Ring",
        image: "assests/ship_chronos.svg",
        engine: 1,
        fuel: 1,
        shield: 1,
        scanner: 1
    },
    sovereign: {
        id: "sovereign",
        name: "Neptune Void Sovereign",
        planet: "Neptune",
        unlocked: false,
        desc: "Apex solar system vessel with dark-matter warp nacelles built for deep Kuiper transits.",
        icon: "stars",
        badge: "Deep Void",
        image: "assests/ship_sovereign.svg",
        engine: 1,
        fuel: 1,
        shield: 1,
        scanner: 1
    }
};

const DEFAULT_PLAYER = {
    callsign: "Commander Alex",
    rank: "Cadet",
    savings: {
        total: 0,
        history: []
    },
    credits: 0, // Starting credits start from 0
    fuelReady: 20, // Starting fuel (>= 10) so players can try their first launch right away!
    rocket: {
        engine: 1,
        fuel: 1,
        shield: 1,
        scanner: 1
    },
    spaceships: structuredClone(DEFAULT_SPACESHIPS),
    activeShipId: "aegis",
    journey: {
        chapter: 1, // 1: Earth -> Moon, 2: Moon -> Mars, 3: Mars -> Jupiter, 4: Jupiter -> Saturn, 5: Saturn -> Neptune
        currentPlanet: "Earth",
        targetPlanet: "Moon",
        progress: 0, // 0 to 100%
        totalDistanceKm: 384400
    },
    unlockedPlanets: [
        "Earth"
    ],
    discoveries: [],
    streak: {
        current: 1,
        lastSaveDate: null,
        longest: 1
    },
    missions: {
        dailySave: false,
        saveTwice: false,
        depositsToday: 0
    },
    dailyLimits: {
        date: new Date().toISOString().split("T")[0],
        savedToday: 0, // Max ₹400 a day
        depositsCountToday: 0, // Max 10 times a day
        launchesCountToday: 0 // Max 5 launches a day
    },
    dailyLaunchLimitDisabled: false, // Developer toggle to disable launch cap
    currentTheme: "earth",
    soundEnabled: true,
    lunaShooterHighScore: 0,
    marsRoverHighScore: 0,
    jupiterSurferHighScore: 0,
    saturnRingHighScore: 0,
    neptuneVoidHighScore: 0
};

function checkDailyReset(p) {
    const today = new Date().toISOString().split("T")[0];
    if (!p.dailyLimits || p.dailyLimits.date !== today) {
        p.dailyLimits = {
            date: today,
            savedToday: 0, // Max ₹400 a day
            depositsCountToday: 0, // Max 10 times a day
            launchesCountToday: 0 // Max 5 launches a day
        };
        // Reset daily challenges for the new day
        if (p.missions) {
            p.missions.dailySave = false;
            p.missions.saveTwice = false;
            p.missions.depositsToday = 0;
        }
    } else if (typeof p.dailyLimits.launchesCountToday !== "number") {
        p.dailyLimits.launchesCountToday = 0;
    }
}

function syncPlayerRocketFromActiveShip(p) {
    if (!p.spaceships) p.spaceships = structuredClone(DEFAULT_SPACESHIPS);
    if (!p.activeShipId || !p.spaceships[p.activeShipId]) p.activeShipId = "aegis";
    
    const active = p.spaceships[p.activeShipId];
    p.rocket = {
        engine: active.engine || 1,
        fuel: active.fuel || 1,
        shield: active.shield || 1,
        scanner: active.scanner || 1
    };
}

function loadPlayer() {
    try {
        const savedPlayer = localStorage.getItem("orbitPlayer");
        if (savedPlayer) {
            const parsed = JSON.parse(savedPlayer);

            // Merge spaceships with defaults to ensure all 6 ships exist
            const mergedShips = structuredClone(DEFAULT_SPACESHIPS);
            if (parsed.spaceships) {
                Object.keys(DEFAULT_SPACESHIPS).forEach(id => {
                    if (parsed.spaceships[id]) {
                        mergedShips[id] = {
                            ...DEFAULT_SPACESHIPS[id],
                            ...parsed.spaceships[id],
                            image: DEFAULT_SPACESHIPS[id].image // Always enforce canonical image so cached localstorage doesn't keep old duplicate pictures!
                        };
                    }
                });
            } else if (parsed.rocket) {
                // Migrate previous single-ship upgrades to starter ship
                mergedShips.aegis.engine = parsed.rocket.engine || 1;
                mergedShips.aegis.fuel = parsed.rocket.fuel || 1;
                mergedShips.aegis.shield = parsed.rocket.shield || 1;
                mergedShips.aegis.scanner = parsed.rocket.scanner || 1;
            }

            const unlockedPlanets = parsed.unlockedPlanets && parsed.unlockedPlanets.length ? parsed.unlockedPlanets : DEFAULT_PLAYER.unlockedPlanets;

            // Ensure any ship belonging to an unlocked planet is unlocked
            Object.values(mergedShips).forEach(ship => {
                if (unlockedPlanets.includes(ship.planet)) {
                    ship.unlocked = true;
                }
            });

            const p = {
                ...DEFAULT_PLAYER,
                ...parsed,
                savings: { ...DEFAULT_PLAYER.savings, ...(parsed.savings || {}) },
                journey: { ...DEFAULT_PLAYER.journey, ...(parsed.journey || {}) },
                streak: { ...DEFAULT_PLAYER.streak, ...(parsed.streak || {}) },
                missions: { ...DEFAULT_PLAYER.missions, ...(parsed.missions || {}) },
                dailyLimits: { ...DEFAULT_PLAYER.dailyLimits, ...(parsed.dailyLimits || {}) },
                spaceships: mergedShips,
                activeShipId: parsed.activeShipId && mergedShips[parsed.activeShipId] ? parsed.activeShipId : "aegis",
                dailyLaunchLimitDisabled: Boolean(parsed.dailyLaunchLimitDisabled),
                unlockedPlanets: unlockedPlanets,
                discoveries: parsed.discoveries || [],
                fuelReady: typeof parsed.fuelReady === "number" ? parsed.fuelReady : DEFAULT_PLAYER.fuelReady,
                lunaShooterHighScore: typeof parsed.lunaShooterHighScore === "number" ? parsed.lunaShooterHighScore : 0,
                marsRoverHighScore: typeof parsed.marsRoverHighScore === "number" ? parsed.marsRoverHighScore : 0,
                jupiterSurferHighScore: typeof parsed.jupiterSurferHighScore === "number" ? parsed.jupiterSurferHighScore : 0,
                saturnRingHighScore: typeof parsed.saturnRingHighScore === "number" ? parsed.saturnRingHighScore : 0,
                neptuneVoidHighScore: typeof parsed.neptuneVoidHighScore === "number" ? parsed.neptuneVoidHighScore : 0,
                currentTheme: parsed.currentTheme || (parsed.journey && parsed.journey.currentPlanet ? parsed.journey.currentPlanet.toLowerCase() : "earth")
            };

            checkDailyReset(p);
            syncPlayerRocketFromActiveShip(p);
            return p;
        }
    } catch (err) {
        console.error("Error loading orbit player from localStorage:", err);
    }

    const newPlayer = structuredClone(DEFAULT_PLAYER);
    checkDailyReset(newPlayer);
    syncPlayerRocketFromActiveShip(newPlayer);
    return newPlayer;
}

function savePlayer(player) {
    try {
        localStorage.setItem(
            "orbitPlayer",
            JSON.stringify(player)
        );
    } catch (err) {
        console.error("Error saving orbit player to localStorage:", err);
    }
}

function resetPlayer() {
    localStorage.removeItem("orbitPlayer");
    window.player = structuredClone(DEFAULT_PLAYER);
    checkDailyReset(window.player);
    savePlayer(window.player);
    if (typeof applyPlanetTheme === "function") {
        applyPlanetTheme("earth");
    }
    if (typeof renderHUD === "function") {
        renderHUD();
    }
}