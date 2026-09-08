// ORBIT // Space Discoveries & Relics

const DISCOVERY_TYPES = [
    {
        id: "satellite",
        name: "Vintage Satellite",
        type: "Satellite",
        rarity: "COMMON",
        reward: 25,
        badgeClass: "bg-surface-container-lowest text-on-surface-variant border border-white/10",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBERmZkHpccCJlFUqouFvSdRK_SUATf7cG1o4rFbBrvDWBshLVybafRolfswpfzo56Iqj53KznZuBW9QSp0nm97o9ADgstYBhCq57RFzk62WijnhacSULSouG4WRYewDS-l6GK97MkJygdPd83FIQuPCY0ABJD4nUhSIsezaknUdrE3Mx_nq4ahifH76lXSjFCI-B_FwMYp9XsC6CeNPp2Y1UV1tvuL1OxAax7yZJr8VgTZUPkXjHUS",
        lore: "An early orbit satellite drifting through space. Its data transmitters are still buzzing with old space songs."
    },
    {
        id: "asteroid",
        name: "Crystal Asteroid",
        type: "Asteroid",
        rarity: "RARE",
        reward: 35,
        badgeClass: "bg-primary-container text-on-primary font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkT-TKaJl9TwQYtHmntmn2k0G4BmIgPc-SiUe01RondF5sPz_3qkpt8a4MCESf9n8uMXtbhD-ajBNfrtxXbeN0aTP-pUgBTq97MQz4lZqP4LhQpa5okAmew1JwQHrzJGwXKQ-2MIEmX18eppFYfOCM2jlIAOFoJ1ewRAdo887YFgKO4m0uzkYk8CWuzFJx42oOwph4xM2B8bTUDumUgJJDPR8hQPMZRke6axq0HSPOrnRhMKF2GG8u",
        lore: "A shiny meteorite packed with pure glowing space crystals. Yields extra rocket energy."
    },
    {
        id: "signal",
        name: "Mystery Radio Signal",
        type: "Unknown Signal",
        rarity: "EPIC",
        reward: 50,
        badgeClass: "bg-secondary text-on-secondary font-bold shadow-[0_0_12px_rgba(139,92,246,0.5)]",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlef-yx5ZfIR-2n6JrS7HEOBJd3WqaSj10n7lfHrQwAarkC65uvKgaE1RyVz8k5XJZcPhN5xSEWT2k1CesJR9kVtIFFrH59Z6qKstezC7Qt8C1cPqUGt-UQLrToPqgjHaIGE_-B0ebmyJ8778p0EVILxajKBdJ9LRt5fqLWPxfLdXqy-4AyD0k_YW6_ncTBYvt4RC6p8TQsXamsaKL-QaQ9ifeDGVU23sN97LdX1GDZh-2XRXfQAJU",
        lore: "A pulsing rhythmic transmission caught from a deep unknown star system. Sounds like alien music!"
    },
    {
        id: "relic",
        name: "Ancient Golden Artifact",
        type: "Space Artifact",
        rarity: "LEGENDARY",
        reward: 100,
        badgeClass: "bg-gradient-to-r from-tertiary-container to-tertiary-fixed-dim text-on-tertiary-fixed font-black shadow-[0_0_16px_rgba(255,185,95,0.6)]",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWXSBNXsNjr-GSoRYmK1h7HJRSl86wYefuG1AWmlGrmNp2L_GNdbk1o5_5ElBUzhVJpI0ozN5ylIo0ozuPWiOxlceOu1BBSnG_QMpPlZTXfIAbT4elTbXfQKhkFJLOLIz7uL1q5AeedXe2olPSWnlhk1c1Bkno8rxcYsMxKYoZ-eFTx-4MtcTiDDJEfEEV1hWYOHjzY2rmxKYk8ET5g7sX2w2Rg9PcjISXHb0Y01ETPCAUh407RDbj",
        lore: "A mysterious levitating gold relic from an ancient space civilization. Radiates warm cosmic luck."
    }
];

function generateDiscovery() {
    if (!player) return null;

    const collectedIds = new Set((player.discoveries || []).map(d => d.id));
    const uncollected = DISCOVERY_TYPES.filter(d => !collectedIds.has(d.id));

    // Weighted Rarity: Common (55%), Rare (25%), Epic (14%), Legendary (6%)
    const roll = Math.random();
    let targetRarity;
    if (roll < 0.55) targetRarity = "COMMON";
    else if (roll < 0.80) targetRarity = "RARE";
    else if (roll < 0.94) targetRarity = "EPIC";
    else targetRarity = "LEGENDARY";

    let template;
    const uncollectedMatching = uncollected.filter(d => d.rarity === targetRarity);
    if (uncollectedMatching.length > 0) {
        template = uncollectedMatching[Math.floor(Math.random() * uncollectedMatching.length)];
    } else if (uncollected.length > 0 && Math.random() < 0.65) {
        template = uncollected[Math.floor(Math.random() * uncollected.length)];
    } else {
        const matchingPool = DISCOVERY_TYPES.filter(d => d.rarity === targetRarity);
        template = matchingPool.length > 0
            ? matchingPool[Math.floor(Math.random() * matchingPool.length)]
            : DISCOVERY_TYPES[Math.floor(Math.random() * DISCOVERY_TYPES.length)];
    }

    const isFirstTime = !collectedIds.has(template.id);

    const item = {
        id: template.id,
        name: template.name,
        type: template.type,
        rarity: template.rarity,
        reward: template.reward,
        image: template.image,
        lore: template.lore,
        badgeClass: template.badgeClass,
        date: new Date().toISOString()
    };

    if (isFirstTime) {
        player.discoveries.push(item);
    }
    player.credits += item.reward;
    savePlayer(player);

    const toastMsg = isFirstTime 
        ? `🌟 NEW DISCOVERY! ${item.name} (+${item.reward} Credits)`
        : `Salvaged ${item.name} duplicate (+${item.reward} Credits)`;

    console.log(`Discovered: ${item.name} (${item.rarity}) (+${item.reward} Credits) - First time: ${isFirstTime}`);

    if (typeof playSound === "function") playSound("discovery");
    if (typeof showDiscoveryModal === "function") {
        showDiscoveryModal(item, isFirstTime);
    } else if (typeof showToast === "function") {
        showToast(toastMsg, "discovery");
    }

    if (typeof renderHUD === "function") renderHUD();

    return item;
}