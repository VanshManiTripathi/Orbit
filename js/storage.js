const DEFAULT_PLAYER = {
    savings: {
        total: 0,
        history: []
    },

    credits: 0,

    rocket: {
        engine: 1,
        fuel: 1,
        shield: 1
    },

    journey: {
        currentPlanet: "Earth",
        progress: 0
    },

    unlockedPlanets: [
        "Earth"
    ],

    discoveries: [],

    streak: {
        current: 0,
        lastSaveDate: null
    },

    missions: {
        dailySave: false,
        saveTwice: false
    }
};


function loadPlayer() {
    const savedPlayer = localStorage.getItem("orbitPlayer");

    if (savedPlayer) {
        return JSON.parse(savedPlayer);
    }

    return structuredClone(DEFAULT_PLAYER);
}


function savePlayer(player) {
    localStorage.setItem(
        "orbitPlayer",
        JSON.stringify(player)
    );
}