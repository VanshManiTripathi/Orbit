// ORBIT // Rocket Upgrades System

function upgradeEngine() {
    const cost = player.rocket.engine * 50;

    if (player.credits < cost) {
        if (typeof showToast === "function") {
            showToast(`Need ${cost} Credits to upgrade engine. (You have ${player.credits})`, "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    player.credits -= cost;
    player.rocket.engine += 1;
    savePlayer(player);

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof showToast === "function") {
        showToast(`Engine upgraded to Level ${player.rocket.engine}! Rocket travels faster now.`, "upgrade");
    }
    if (typeof renderHUD === "function") renderHUD();

    return true;
}

function upgradeFuel() {
    const cost = player.rocket.fuel * 50;

    if (player.credits < cost) {
        if (typeof showToast === "function") {
            showToast(`Need ${cost} Credits to expand fuel tank. (You have ${player.credits})`, "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    player.credits -= cost;
    player.rocket.fuel += 1;
    savePlayer(player);

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof showToast === "function") {
        showToast(`Fuel Tank upgraded to Level ${player.rocket.fuel}! Can burn more fuel per launch.`, "upgrade");
    }
    if (typeof renderHUD === "function") renderHUD();

    return true;
}

function upgradeShield() {
    const cost = player.rocket.shield * 50;

    if (player.credits < cost) {
        if (typeof showToast === "function") {
            showToast(`Need ${cost} Credits to upgrade shield. (You have ${player.credits})`, "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    player.credits -= cost;
    player.rocket.shield += 1;
    savePlayer(player);

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof showToast === "function") {
        showToast(`Shield upgraded to Level ${player.rocket.shield}! Streak protection active.`, "upgrade");
    }
    if (typeof renderHUD === "function") renderHUD();

    return true;
}

function upgradeScanner() {
    player.rocket.scanner = player.rocket.scanner || 1;
    const cost = player.rocket.scanner * 50;

    if (player.credits < cost) {
        if (typeof showToast === "function") {
            showToast(`Need ${cost} Credits to upgrade scanner. (You have ${player.credits})`, "error");
        }
        if (typeof playSound === "function") playSound("error");
        return false;
    }

    player.credits -= cost;
    player.rocket.scanner += 1;
    savePlayer(player);

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof showToast === "function") {
        showToast(`Scanner upgraded to Level ${player.rocket.scanner}! Better chance to find rare discoveries.`, "upgrade");
    }
    if (typeof renderHUD === "function") renderHUD();

    return true;
}