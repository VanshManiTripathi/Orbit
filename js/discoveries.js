const DISCOVERY_TYPES = [
    {
        name: "Satellite",
        reward: 10
    },
    {
        name: "Asteroid",
        reward: 15
    },
    {
        name: "Unknown Signal",
        reward: 20
    },
    {
        name: "Space Artifact",
        reward: 25
    }
];


function generateDiscovery() {

    const randomIndex = Math.floor(
        Math.random() * DISCOVERY_TYPES.length
    );

    const discovery = DISCOVERY_TYPES[randomIndex];

    player.discoveries.push({
        name: discovery.name,
        reward: discovery.reward,
        date: new Date().toISOString()
    });

    player.credits += discovery.reward;

    savePlayer(player);

    console.log(`🔭 Discovery found: ${discovery.name}`);
    console.log(`+${discovery.reward} Mission Credits`);

    return discovery;
}


function getDiscoveries() {
    return player.discoveries;
}