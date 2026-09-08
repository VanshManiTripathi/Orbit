// ORBIT // Spaceship Fleet & Modular Upgrades System

function getActiveShip() {
    if (!player) return null;
    if (!player.spaceships) player.spaceships = structuredClone(DEFAULT_SPACESHIPS);
    if (!player.activeShipId || !player.spaceships[player.activeShipId]) {
        player.activeShipId = "aegis";
    }
    return player.spaceships[player.activeShipId];
}

function selectActiveSpaceship(shipId) {
    if (!player || !player.spaceships) return;
    const ship = player.spaceships[shipId];
    if (!ship) return;

    if (!ship.unlocked) {
        if (typeof showToast === "function") {
            showToast(`🔒 ${ship.name} is locked! Reach ${ship.planet} to unlock this vessel.`, "error");
        }
        if (typeof playSound === "function") playSound("error");
        return;
    }

    player.activeShipId = shipId;
    if (typeof syncPlayerRocketFromActiveShip === "function") {
        syncPlayerRocketFromActiveShip(player);
    }
    savePlayer(player);

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof triggerParticleBurst === "function") triggerParticleBurst();
    if (typeof showToast === "function") {
        showToast(`🚀 Flagship changed to ${ship.name}!`, "success");
    }
    if (typeof renderHUD === "function") renderHUD();
}

function upgradeEngine() {
    const ship = getActiveShip();
    if (!ship) return false;

    const currentLevel = ship.engine || 1;
    if (currentLevel >= 10) {
        if (typeof showToast === "function") showToast(`${ship.name} Engine is already at Max Level 10!`, "info");
        return false;
    }

    const cost = currentLevel * 50;
    if (player.credits < cost) {
        if (typeof showToast === "function") {
            showToast(`Need ${cost} Credits to upgrade engine. (You have ${player.credits})`, "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    player.credits -= cost;
    ship.engine = currentLevel + 1;
    if (typeof syncPlayerRocketFromActiveShip === "function") {
        syncPlayerRocketFromActiveShip(player);
    }
    savePlayer(player);

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof showToast === "function") {
        showToast(`⚡ ${ship.name} Engine upgraded to Level ${ship.engine}! Travels faster per burn.`, "upgrade");
    }
    if (typeof renderHUD === "function") renderHUD();

    return true;
}

function upgradeFuel() {
    const ship = getActiveShip();
    if (!ship) return false;

    const currentLevel = ship.fuel || 1;
    if (currentLevel >= 10) {
        if (typeof showToast === "function") showToast(`${ship.name} Fuel Tank is already at Max Level 10!`, "info");
        return false;
    }

    const cost = currentLevel * 50;
    if (player.credits < cost) {
        if (typeof showToast === "function") {
            showToast(`Need ${cost} Credits to expand fuel tank. (You have ${player.credits})`, "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    player.credits -= cost;
    ship.fuel = currentLevel + 1;
    if (typeof syncPlayerRocketFromActiveShip === "function") {
        syncPlayerRocketFromActiveShip(player);
    }
    savePlayer(player);

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof showToast === "function") {
        showToast(`⛽ ${ship.name} Fuel Tank upgraded to Level ${ship.fuel}! Can burn more fuel per launch.`, "upgrade");
    }
    if (typeof renderHUD === "function") renderHUD();

    return true;
}

function upgradeShield() {
    const ship = getActiveShip();
    if (!ship) return false;

    const currentLevel = ship.shield || 1;
    if (currentLevel >= 10) {
        if (typeof showToast === "function") showToast(`${ship.name} Deflector Shield is already at Max Level 10!`, "info");
        return false;
    }

    const cost = currentLevel * 50;
    if (player.credits < cost) {
        if (typeof showToast === "function") {
            showToast(`Need ${cost} Credits to upgrade shield. (You have ${player.credits})`, "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    player.credits -= cost;
    ship.shield = currentLevel + 1;
    if (typeof syncPlayerRocketFromActiveShip === "function") {
        syncPlayerRocketFromActiveShip(player);
    }
    savePlayer(player);

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof showToast === "function") {
        showToast(`🛡️ ${ship.name} Shield upgraded to Level ${ship.shield}! Streak protection active.`, "upgrade");
    }
    if (typeof renderHUD === "function") renderHUD();

    return true;
}

function upgradeScanner() {
    const ship = getActiveShip();
    if (!ship) return false;

    const currentLevel = ship.scanner || 1;
    if (currentLevel >= 10) {
        if (typeof showToast === "function") showToast(`${ship.name} Discovery Scanner is already at Max Level 10!`, "info");
        return false;
    }

    const cost = currentLevel * 50;
    if (player.credits < cost) {
        if (typeof showToast === "function") {
            showToast(`Need ${cost} Credits to upgrade scanner. (You have ${player.credits})`, "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    player.credits -= cost;
    ship.scanner = currentLevel + 1;
    if (typeof syncPlayerRocketFromActiveShip === "function") {
        syncPlayerRocketFromActiveShip(player);
    }
    savePlayer(player);

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof showToast === "function") {
        showToast(`📡 ${ship.name} Scanner upgraded to Level ${ship.scanner}! Higher chance for rare relics.`, "upgrade");
    }
    if (typeof renderHUD === "function") renderHUD();

    return true;
}