const PLANET_DISTANCE = {
    Earth: 100,
    Moon: 100
};


function startJourney() {

    if (player.journey.currentPlanet !== "Earth") {
        console.log("Journey cannot be started from here yet.");
        return false;
    }

    console.log("🚀 Journey to the Moon started!");

    return true;
}


function travel(amount) {

    if (amount <= 0) {
        console.log("Invalid travel amount.");
        return;
    }

    if (player.journey.progress >= 100) {
        console.log("The Moon has already been reached.");
        return;
    }

    // Fuel determines maximum distance per travel
    const fuelCapacity = player.rocket.fuel * 25;

    if (amount > fuelCapacity) {
        console.log(`Not enough fuel. Maximum travel: ${fuelCapacity}%`);
        return;
    }

    // Engine increases travel speed
    const speed = player.rocket.engine;

    player.journey.progress += amount * speed;

    if (player.journey.progress >= 100) {
        player.journey.progress = 100;
        reachMoon();
    }

    // 25% chance of a discovery
    if (Math.random() < 0.25) {
        generateDiscovery();
    }

    savePlayer(player);

    console.log(`🚀 Journey progress: ${player.journey.progress}%`);
}


function reachMoon() {

    player.journey.currentPlanet = "Moon";

    if (!player.unlockedPlanets.includes("Moon")) {
        player.unlockedPlanets.push("Moon");
    }

    console.log("🌕 Moon reached!");
    console.log("Moon unlocked!");

    savePlayer(player);
}


function getJourneyProgress() {
    return player.journey.progress;
}


function getCurrentPlanet() {
    return player.journey.currentPlanet;
}