// ORBIT // Space Journey & Multi-Planet Manual Rocket Launch (Chapters 1 - 5)

function launchRocket() {
    if (!player) return;

    // 1. Check Daily Launch Cap (Max 5 Launches per day unless disabled)
    const isCapDisabled = Boolean(player.dailyLaunchLimitDisabled);
    const launchesToday = player.dailyLimits ? (player.dailyLimits.launchesCountToday || 0) : 0;
    if (!isCapDisabled && launchesToday >= 5) {
        if (typeof showToast === "function") {
            showToast("Daily launch limit reached! (5/5 launches used today). Resets at midnight.", "error");
        }
        if (typeof playSound === "function") playSound("error");
        return;
    }

    // 2. Check if waiting for next chapter embarkation
    const ch = player.journey.chapter || 1;
    if (player.journey.progress >= 100) {
        if (ch === 1 && player.unlockedPlanets.includes("Moon")) {
            startMarsExpedition();
            return;
        } else if (ch === 2 && player.unlockedPlanets.includes("Mars")) {
            startJupiterExpedition();
            return;
        } else if (ch === 3 && player.unlockedPlanets.includes("Jupiter")) {
            startSaturnExpedition();
            return;
        } else if (ch === 4 && player.unlockedPlanets.includes("Saturn")) {
            startNeptuneExpedition();
            return;
        } else if (ch === 5 && player.unlockedPlanets.includes("Neptune")) {
            if (typeof showToast === "function") {
                showToast("🌟 Grand Fleet Master! All 6 Planets colonized and all Flagships unlocked!", "info");
            }
            return;
        }
    }

    // 3. Fuel Check
    const availableFuel = player.fuelReady || 0;
    if (availableFuel <= 0) {
        if (typeof showToast === "function") {
            showToast("No fuel ready! Save money in the Save tab to earn fuel.", "error");
        }
        if (typeof playSound === "function") playSound("error");
        return;
    }

    // Increment daily launch counter
    if (!player.dailyLimits) {
        player.dailyLimits = {
            date: new Date().toISOString().split("T")[0],
            savedToday: 0,
            depositsCountToday: 0,
            launchesCountToday: 0
        };
    }
    player.dailyLimits.launchesCountToday = launchesToday + 1;

    // Maximum fuel capacity the rocket can consume per launch
    const maxBurn = (player.rocket.fuel || 1) * 25;
    const burnAmount = Math.min(availableFuel, maxBurn);

    player.fuelReady -= burnAmount;

    // Engine multiplier increases distance traveled
    const engineMultiplier = player.rocket.engine || 1;
    // Deep space transit chapters scale distance divisor
    const divisor = ch >= 4 ? 14 : (ch >= 2 ? 10 : 8);
    const minGain = ch >= 3 ? 1 : 2;
    const progressGain = Math.max(minGain, Math.round((burnAmount / divisor) * engineMultiplier));

    player.journey.progress = Math.min(100, (player.journey.progress || 0) + progressGain);

    savePlayer(player);

    const targetName = player.journey.targetPlanet || "Moon";
    console.log(`🚀 Rocket Launched (${player.dailyLimits.launchesCountToday}/5 today)! Burned ${burnAmount} fuel towards ${targetName}. Progress is now ${player.journey.progress}%`);

    // Trigger Launch Animation & Sound
    if (typeof playSound === "function") {
        playSound("thruster");
    }

    if (typeof animateRocketLaunchSequence === "function") {
        animateRocketLaunchSequence(burnAmount, progressGain);
    }

    // Tuned Discovery Rarity: Base 8% chance, +2.5% per Scanner level
    const scannerLevel = player.rocket.scanner || 1;
    const discoveryChance = 0.08 + (scannerLevel - 1) * 0.025;

    let triggeredDiscovery = false;
    if (Math.random() < discoveryChance) {
        triggeredDiscovery = true;
        setTimeout(() => {
            generateDiscovery();
        }, 800);
    }

    // Procedural Space Encounter Trigger (~35% chance on launch)
    if (!triggeredDiscovery && Math.random() < 0.35 && typeof triggerRandomEncounter === "function") {
        setTimeout(() => {
            triggerRandomEncounter();
        }, 950);
    }

    // Check Milestone Arrival!
    if (player.journey.progress >= 100) {
        setTimeout(() => {
            if (ch === 5 || player.journey.targetPlanet === "Neptune") {
                reachNeptune();
            } else if (ch === 4 || player.journey.targetPlanet === "Saturn") {
                reachSaturn();
            } else if (ch === 3 || player.journey.targetPlanet === "Jupiter") {
                reachJupiter();
            } else if (ch === 2 || player.journey.targetPlanet === "Mars") {
                reachMars();
            } else {
                reachMoon();
            }
        }, 1200);
    }

    if (typeof renderHUD === "function") {
        renderHUD();
    }
}

// -------------------------------------------------------------
// Planet Milestones & Spaceship Unlocks (1 per planet)
// -------------------------------------------------------------

function unlockShipForPlanet(planetName, shipId) {
    if (!player.spaceships) player.spaceships = structuredClone(DEFAULT_SPACESHIPS);
    if (player.spaceships[shipId]) {
        player.spaceships[shipId].unlocked = true;
        player.activeShipId = shipId;
        if (typeof syncPlayerRocketFromActiveShip === "function") {
            syncPlayerRocketFromActiveShip(player);
        }
    }
}

function reachMoon() {
    player.journey.currentPlanet = "Moon";
    player.journey.targetPlanet = "Mars";

    if (!player.unlockedPlanets.includes("Moon")) {
        player.unlockedPlanets.push("Moon");
        player.credits += 150; // Milestone bonus credits
    }

    unlockShipForPlanet("Moon", "artemis");
    player.currentTheme = "moon";
    savePlayer(player);

    if (typeof applyPlanetTheme === "function") applyPlanetTheme("moon");
    if (typeof playSound === "function") playSound("arrival");

    if (typeof showArrivalModal === "function") {
        showArrivalModal("Moon", "Luna Gate Base", "Luna Artemis Interceptor");
    } else if (typeof showToast === "function") {
        showToast("🌕 Landing Successful! Moon & Luna Artemis Interceptor Unlocked (+150 Credits)", "success");
    }

    if (typeof renderHUD === "function") renderHUD();
}

function startMarsExpedition() {
    if (!player) return;

    player.journey.chapter = 2;
    player.journey.currentPlanet = "Moon";
    player.journey.targetPlanet = "Mars";
    player.journey.progress = 0;
    player.journey.totalDistanceKm = 54600000;

    savePlayer(player);
    if (typeof playSound === "function") playSound("thruster");
    if (typeof triggerParticleBurst === "function") triggerParticleBurst();
    if (typeof showToast === "function") {
        showToast("🚀 Chapter 2 Initiated: Moon to Mars Expedition (54.6M KM)!", "success");
    }
    if (typeof renderHUD === "function") renderHUD();
}

function reachMars() {
    player.journey.currentPlanet = "Mars";
    player.journey.targetPlanet = "Jupiter";

    if (!player.unlockedPlanets.includes("Mars")) {
        player.unlockedPlanets.push("Mars");
        player.credits += 300; // Epic Chapter 2 bonus
    }

    unlockShipForPlanet("Mars", "ares");
    player.currentTheme = "mars";
    savePlayer(player);

    if (typeof applyPlanetTheme === "function") applyPlanetTheme("mars");
    if (typeof playSound === "function") playSound("arrival");

    if (typeof showArrivalModal === "function") {
        showArrivalModal("Mars", "Olympus Mons Outpost", "Ares Martian Vanguard");
    } else if (typeof showToast === "function") {
        showToast("🔴 Mars Landing Successful! Olympus Mons & Ares Vanguard Unlocked (+300 Credits)", "success");
    }

    if (typeof renderHUD === "function") renderHUD();
}

function startJupiterExpedition() {
    if (!player) return;

    player.journey.chapter = 3;
    player.journey.currentPlanet = "Mars";
    player.journey.targetPlanet = "Jupiter";
    player.journey.progress = 0;
    player.journey.totalDistanceKm = 588000000;

    savePlayer(player);
    if (typeof playSound === "function") playSound("thruster");
    if (typeof triggerParticleBurst === "function") triggerParticleBurst();
    if (typeof showToast === "function") {
        showToast("🪐 Chapter 3 Initiated: Mars to Jupiter Voyage (588M KM)!", "success");
    }
    if (typeof renderHUD === "function") renderHUD();
}

function reachJupiter() {
    player.journey.currentPlanet = "Jupiter";
    player.journey.targetPlanet = "Saturn";

    if (!player.unlockedPlanets.includes("Jupiter")) {
        player.unlockedPlanets.push("Jupiter");
        player.credits += 500;
    }

    unlockShipForPlanet("Jupiter", "jovian");
    player.currentTheme = "jupiter";
    savePlayer(player);

    if (typeof applyPlanetTheme === "function") applyPlanetTheme("jupiter");
    if (typeof playSound === "function") playSound("arrival");

    if (typeof showArrivalModal === "function") {
        showArrivalModal("Jupiter", "Great Jovian Harbor", "Jovian Titan Dreadnought");
    } else if (typeof showToast === "function") {
        showToast("🟠 Jupiter Arrival! Jovian Station & Titan Dreadnought Unlocked (+500 Credits)", "success");
    }

    if (typeof renderHUD === "function") renderHUD();
}

function startSaturnExpedition() {
    if (!player) return;

    player.journey.chapter = 4;
    player.journey.currentPlanet = "Jupiter";
    player.journey.targetPlanet = "Saturn";
    player.journey.progress = 0;
    player.journey.totalDistanceKm = 650000000;

    savePlayer(player);
    if (typeof playSound === "function") playSound("thruster");
    if (typeof triggerParticleBurst === "function") triggerParticleBurst();
    if (typeof showToast === "function") {
        showToast("🪐 Chapter 4 Initiated: Jupiter to Saturn Expedition (650M KM)!", "success");
    }
    if (typeof renderHUD === "function") renderHUD();
}

function reachSaturn() {
    player.journey.currentPlanet = "Saturn";
    player.journey.targetPlanet = "Neptune";

    if (!player.unlockedPlanets.includes("Saturn")) {
        player.unlockedPlanets.push("Saturn");
        player.credits += 750;
    }

    unlockShipForPlanet("Saturn", "chronos");
    player.currentTheme = "saturn";
    savePlayer(player);

    if (typeof applyPlanetTheme === "function") applyPlanetTheme("saturn");
    if (typeof playSound === "function") playSound("arrival");

    if (typeof showArrivalModal === "function") {
        showArrivalModal("Saturn", "Cassini Ring Gate", "Chronos Ringrunner");
    } else if (typeof showToast === "function") {
        showToast("🪐 Saturn Reached! Cassini Ring Gate & Chronos Ringrunner Unlocked (+750 Credits)", "success");
    }

    if (typeof renderHUD === "function") renderHUD();
}

function startNeptuneExpedition() {
    if (!player) return;

    player.journey.chapter = 5;
    player.journey.currentPlanet = "Saturn";
    player.journey.targetPlanet = "Neptune";
    player.journey.progress = 0;
    player.journey.totalDistanceKm = 1500000000;

    savePlayer(player);
    if (typeof playSound === "function") playSound("thruster");
    if (typeof triggerParticleBurst === "function") triggerParticleBurst();
    if (typeof showToast === "function") {
        showToast("🌌 Chapter 5 Initiated: Final Frontier to Neptune (1.5 Billion KM)!", "success");
    }
    if (typeof renderHUD === "function") renderHUD();
}

function reachNeptune() {
    player.journey.currentPlanet = "Neptune";
    player.journey.targetPlanet = "Solar System Edge";

    if (!player.unlockedPlanets.includes("Neptune")) {
        player.unlockedPlanets.push("Neptune");
        player.credits += 1000; // Grand Victory bonus
    }

    unlockShipForPlanet("Neptune", "sovereign");
    player.currentTheme = "neptune";
    savePlayer(player);

    if (typeof applyPlanetTheme === "function") applyPlanetTheme("neptune");
    if (typeof playSound === "function") playSound("arrival");

    if (typeof showArrivalModal === "function") {
        showArrivalModal("Neptune", "Deep Void Citadel", "Neptune Void Sovereign");
    } else if (typeof showToast === "function") {
        showToast("🔵 Neptune Colony Established! Sovereign Flagship Unlocked (+1000 Credits)", "success");
    }

    if (typeof renderHUD === "function") renderHUD();
}

function getJourneyProgress() {
    return player ? player.journey.progress : 0;
}