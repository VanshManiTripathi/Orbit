// ORBIT // Space Journey & Manual Rocket Launch

function launchRocket() {
    if (!player) return;

    if (player.journey.progress >= 100 && player.journey.currentPlanet === "Moon") {
        if (typeof showToast === "function") {
            showToast("Moon reached! Prepare for Chapter 2: Mars Expedition.", "info");
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
    const progressGain = Math.max(2, Math.round((burnAmount / 8) * engineMultiplier));

    player.journey.progress = Math.min(100, (player.journey.progress || 0) + progressGain);

    savePlayer(player);

    console.log(`🚀 Rocket Launched! Burned ${burnAmount} fuel. Progress is now ${player.journey.progress}%`);

    // Trigger Launch Animation & Sound
    if (typeof playSound === "function") {
        playSound("thruster");
    }

    if (typeof animateRocketLaunchSequence === "function") {
        animateRocketLaunchSequence(burnAmount, progressGain);
    }

    // Scanner Array increases chance of finding space relics
    const scannerLevel = player.rocket.scanner || 1;
    const discoveryChance = 0.25 + (scannerLevel - 1) * 0.08;

    if (Math.random() < discoveryChance) {
        setTimeout(() => {
            generateDiscovery();
        }, 800);
    }

    // Check if Moon reached!
    if (player.journey.progress >= 100) {
        setTimeout(() => {
            reachMoon();
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

function getJourneyProgress() {
    return player ? player.journey.progress : 0;
}