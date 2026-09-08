// ORBIT // Space Journey & Multi-Planet Manual Rocket Launch

function launchRocket() {
    if (!player) return;

    // Check if Moon reached in Chapter 1 - prompt or transition to Chapter 2
    if (player.journey.chapter !== 2 && player.journey.progress >= 100 && player.unlockedPlanets.includes("Moon")) {
        startMarsExpedition();
        return;
    }

    // Check if Mars reached in Chapter 2
    if (player.journey.chapter === 2 && player.journey.progress >= 100 && player.journey.currentPlanet === "Mars") {
        if (typeof showToast === "function") {
            showToast("Mars Base established! Chapter 3: Jupiter Deep Space incoming soon.", "info");
        }
        return;
    }

    const availableFuel = player.fuelReady || 0;
    if (availableFuel <= 0) {
        if (typeof showToast === "function") {
            showToast("No fuel ready! Save money in the Save tab to earn fuel.", "error");
        }
        if (typeof playSound === "function") playSound("error");
        return;
    }

    // Maximum fuel capacity the rocket can consume per launch
    const maxBurn = (player.rocket.fuel || 1) * 25;
    const burnAmount = Math.min(availableFuel, maxBurn);

    player.fuelReady -= burnAmount;

    // Engine multiplier increases distance traveled
    const engineMultiplier = player.rocket.engine || 1;
    // Chapter 2 (Mars) requires slightly more power for deep space transit
    const divisor = player.journey.chapter === 2 ? 10 : 8;
    const minGain = player.journey.chapter === 2 ? 1 : 2;
    const progressGain = Math.max(minGain, Math.round((burnAmount / divisor) * engineMultiplier));

    player.journey.progress = Math.min(100, (player.journey.progress || 0) + progressGain);

    savePlayer(player);

    const targetName = player.journey.targetPlanet || "Moon";
    console.log(`🚀 Rocket Launched! Burned ${burnAmount} fuel towards ${targetName}. Progress is now ${player.journey.progress}%`);

    // Trigger Launch Animation & Sound
    if (typeof playSound === "function") {
        playSound("thruster");
    }

    if (typeof animateRocketLaunchSequence === "function") {
        animateRocketLaunchSequence(burnAmount, progressGain);
    }

    // Tuned Discovery Rarity: Base 8% chance, +2.5% per Scanner level (up to 30.5% at level 10)
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
            if (player.journey.chapter === 2 || player.journey.targetPlanet === "Mars") {
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

function reachMoon() {
    player.journey.currentPlanet = "Moon";
    player.journey.targetPlanet = "Mars";

    if (!player.unlockedPlanets.includes("Moon")) {
        player.unlockedPlanets.push("Moon");
        player.credits += 150; // Milestone bonus credits
    }

    // Update to Moon Theme
    player.currentTheme = "moon";
    savePlayer(player);

    if (typeof applyPlanetTheme === "function") {
        applyPlanetTheme("moon");
    }

    if (typeof playSound === "function") {
        playSound("arrival");
    }

    if (typeof showArrivalModal === "function") {
        showArrivalModal("Moon", "Luna Gate Base");
    } else if (typeof showToast === "function") {
        showToast("🌕 Landing Successful! Moon Unlocked (+150 Credits)", "success");
    }

    if (typeof renderHUD === "function") {
        renderHUD();
    }
}

function startMarsExpedition() {
    if (!player) return;

    player.journey.chapter = 2;
    player.journey.currentPlanet = "Moon";
    player.journey.targetPlanet = "Mars";
    player.journey.progress = 0;
    player.journey.totalDistanceKm = 54600000;

    savePlayer(player);

    if (typeof playSound === "function") {
        playSound("thruster");
    }

    if (typeof triggerParticleBurst === "function") {
        triggerParticleBurst();
    }

    if (typeof showToast === "function") {
        showToast("🚀 Chapter 2 Initiated: Moon to Mars Expedition (54.6M KM)!", "success");
    }

    if (typeof renderHUD === "function") {
        renderHUD();
    }
}

function reachMars() {
    player.journey.currentPlanet = "Mars";
    player.journey.targetPlanet = "Jupiter";

    if (!player.unlockedPlanets.includes("Mars")) {
        player.unlockedPlanets.push("Mars");
        player.credits += 300; // Epic Chapter 2 bonus
    }

    player.currentTheme = "mars";
    savePlayer(player);

    if (typeof applyPlanetTheme === "function") {
        applyPlanetTheme("mars");
    }

    if (typeof playSound === "function") {
        playSound("arrival");
    }

    if (typeof showArrivalModal === "function") {
        showArrivalModal("Mars", "Olympus Mons Outpost");
    } else if (typeof showToast === "function") {
        showToast("🔴 Mars Landing Successful! Olympus Mons Outpost Unlocked (+300 Credits)", "success");
    }

    if (typeof renderHUD === "function") {
        renderHUD();
    }
}

function getJourneyProgress() {
    return player ? player.journey.progress : 0;
}