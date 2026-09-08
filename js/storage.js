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
    journey: {
        chapter: 1, // 1: Earth -> Moon, 2: Moon -> Mars
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
        depositsCountToday: 0 // Max 10 times a day
    },
    currentTheme: "earth",
    soundEnabled: true,
    lunaShooterHighScore: 0
};

function checkDailyReset(p) {
    const today = new Date().toISOString().split("T")[0];
    if (!p.dailyLimits || p.dailyLimits.date !== today) {
        p.dailyLimits = {
            date: today,
            savedToday: 0,
            depositsCountToday: 0
        };
        // Reset daily challenges for the new day
        if (p.missions) {
            p.missions.dailySave = false;
            p.missions.saveTwice = false;
            p.missions.depositsToday = 0;
        }
    }
}

function loadPlayer() {
    try {
        const savedPlayer = localStorage.getItem("orbitPlayer");
        if (savedPlayer) {
            const parsed = JSON.parse(savedPlayer);
            const p = {
                ...DEFAULT_PLAYER,
                ...parsed,
                savings: { ...DEFAULT_PLAYER.savings, ...(parsed.savings || {}) },
                rocket: { ...DEFAULT_PLAYER.rocket, ...(parsed.rocket || {}) },
                journey: { ...DEFAULT_PLAYER.journey, ...(parsed.journey || {}) },
                streak: { ...DEFAULT_PLAYER.streak, ...(parsed.streak || {}) },
                missions: { ...DEFAULT_PLAYER.missions, ...(parsed.missions || {}) },
                dailyLimits: { ...DEFAULT_PLAYER.dailyLimits, ...(parsed.dailyLimits || {}) },
                unlockedPlanets: parsed.unlockedPlanets && parsed.unlockedPlanets.length ? parsed.unlockedPlanets : DEFAULT_PLAYER.unlockedPlanets,
                discoveries: parsed.discoveries || [],
                fuelReady: typeof parsed.fuelReady === "number" ? parsed.fuelReady : DEFAULT_PLAYER.fuelReady,
                lunaShooterHighScore: typeof parsed.lunaShooterHighScore === "number" ? parsed.lunaShooterHighScore : 0,
                currentTheme: parsed.currentTheme || (parsed.journey && parsed.journey.currentPlanet === "Mars" ? "mars" : (parsed.journey && parsed.journey.currentPlanet === "Moon" ? "moon" : "earth"))
            };
            checkDailyReset(p);
            return p;
        }
    } catch (err) {
        console.error("Error loading orbit player from localStorage:", err);
    }

    const newPlayer = structuredClone(DEFAULT_PLAYER);
    checkDailyReset(newPlayer);
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