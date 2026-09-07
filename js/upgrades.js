function upgradeEngine() {

    const cost = player.rocket.engine * 50;

    if (player.credits < cost) {
        console.log("Not enough Mission Credits.");
        return false;
    }

    player.credits -= cost;
    player.rocket.engine += 1;

    savePlayer(player);

    console.log(`Engine upgraded to Level ${player.rocket.engine}`);
    console.log(`Mission Credits remaining: ${player.credits}`);

    return true;
}


function upgradeFuel() {

    const cost = player.rocket.fuel * 50;

    if (player.credits < cost) {
        console.log("Not enough Mission Credits.");
        return false;
    }

    player.credits -= cost;
    player.rocket.fuel += 1;

    savePlayer(player);

    console.log(`Fuel Tank upgraded to Level ${player.rocket.fuel}`);
    console.log(`Mission Credits remaining: ${player.credits}`);

    return true;
}


function upgradeShield() {

    const cost = player.rocket.shield * 50;

    if (player.credits < cost) {
        console.log("Not enough Mission Credits.");
        return false;
    }

    player.credits -= cost;
    player.rocket.shield += 1;

    savePlayer(player);

    console.log(`Shield upgraded to Level ${player.rocket.shield}`);
    console.log(`Mission Credits remaining: ${player.credits}`);

    return true;
}