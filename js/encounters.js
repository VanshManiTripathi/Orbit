// ORBIT // Procedural Space Encounters & Launch Mini-Events

const SPACE_ENCOUNTERS = [
    {
        id: "asteroid_field",
        title: "Asteroid Mining Belt",
        category: "Resource Extraction",
        icon: "diamond",
        iconColor: "text-tertiary-fixed",
        badgeClass: "bg-tertiary-container/30 text-tertiary border border-tertiary/40",
        description: "Your long-range radar detected a dense cluster of glowing space crystals drifting across your trajectory.",
        getChoices: (p) => {
            const hasShieldBonus = (p.rocket.shield || 1) >= 2;
            const shieldExtra = hasShieldBonus ? 10 : 0;
            return [
                {
                    id: "mine_credits",
                    label: `Extract Pure Crystals (+${30 + shieldExtra} Credits)`,
                    subtext: hasShieldBonus ? "Shield deflected debris for bonus yield!" : "Harpoon crystal nodes",
                    action: () => {
                        const reward = 30 + shieldExtra;
                        p.credits += reward;
                        return { text: `Mined ${reward} Mission Credits from crystal asteroids!`, sound: "upgrade" };
                    }
                },
                {
                    id: "siphon_fuel",
                    label: `Compress Stardust Gases (+${20 + shieldExtra} Fuel)`,
                    subtext: hasShieldBonus ? "Shield magnetic sweep added bonus fuel!" : "Replenish thruster propellant",
                    action: () => {
                        const reward = 20 + shieldExtra;
                        p.fuelReady = (p.fuelReady || 0) + reward;
                        return { text: `Siphoned +${reward} Rocket Fuel! Ready for next burn.`, sound: "thruster" };
                    }
                }
            ];
        }
    },
    {
        id: "solar_flare",
        title: "Solar Radiation Flare",
        category: "Space Hazard",
        icon: "wb_sunny",
        iconColor: "text-amber-400",
        badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
        description: "A sudden Coronal Mass Ejection wave from the sun sweeps directly across your flight vector!",
        getChoices: (p) => {
            const shieldLevel = p.rocket.shield || 1;
            if (shieldLevel >= 2) {
                return [
                    {
                        id: "absorb_flare",
                        label: `Deflect & Absorb (+35 Credits, +15 Fuel)`,
                        subtext: `Level ${shieldLevel} Deflector Shield safely magnetizes the plasma!`,
                        action: () => {
                            p.credits += 35;
                            p.fuelReady = (p.fuelReady || 0) + 15;
                            return { text: "Deflector Shield neutralized the flare and harvested 35 Credits + 15 Fuel!", sound: "upgrade" };
                        }
                    }
                ];
            } else {
                return [
                    {
                        id: "weather_flare",
                        label: `Brace for Impact (+10 Credits Salvage)`,
                        subtext: "Unshielded hull takes radiation stress. Upgrade Deflector Shield in Hangar!",
                        action: () => {
                            p.credits += 10;
                            return { text: "Survived solar flare with minor salvage (+10 Credits). Upgrade Deflector Shield for protection!", sound: "click" };
                        }
                    }
                ];
            }
        }
    },
    {
        id: "derelict_probe",
        title: "Derelict Probe Signal",
        category: "Deep Space Mystery",
        icon: "settings_remote",
        iconColor: "text-primary-container",
        badgeClass: "bg-primary-container/20 text-primary-container border border-primary-container/40",
        description: "Your discovery scanner intercepted an automated radio transmission from an antique deep space probe (Voyager-Alpha) drifting in silent orbit.",
        getChoices: (p) => [
            {
                id: "download_data",
                label: "Download Exploration Telemetry (+45 Credits)",
                subtext: "Valuable scientific data recovered for Mission Control",
                action: () => {
                    p.credits += 45;
                    return { text: "Decoded deep-space telemetry from Voyager probe (+45 Credits)!", sound: "upgrade" };
                }
            },
            {
                id: "siphon_cells",
                label: "Siphon Auxiliary Power Cells (+25 Fuel)",
                subtext: "Vintage hydrazine canisters still pressurized",
                action: () => {
                    p.fuelReady = (p.fuelReady || 0) + 25;
                    return { text: "Pressurized 25 Fuel from ancient auxiliary canisters!", sound: "thruster" };
                }
            }
        ]
    },
    {
        id: "ion_slipstream",
        title: "Gravitational Ion Slipstream",
        category: "Propulsion Boost",
        icon: "fast_forward",
        iconColor: "text-secondary",
        badgeClass: "bg-secondary/20 text-secondary border border-secondary/40",
        description: "Your ship entered a high-speed gravitational wave channel, creating a natural relativistic acceleration vortex!",
        getChoices: (p) => {
            const engineLvl = p.rocket.engine || 1;
            const bonusProgress = Math.min(8, 4 + Math.round(engineLvl * 0.5));
            return [
                {
                    id: "ride_slipstream",
                    label: `Ride the Vortex (+${bonusProgress}% Extra Distance)`,
                    subtext: `Enhanced by Level ${engineLvl} Rocket Engine`,
                    action: () => {
                        p.journey.progress = Math.min(100, (p.journey.progress || 0) + bonusProgress);
                        return { text: `🚀 Turbo boost! Traveled an extra +${bonusProgress}% along the journey!`, sound: "thruster" };
                    }
                }
            ];
        }
    }
];

let currentActiveEncounter = null;

function triggerRandomEncounter() {
    if (!window.player) return;
    const p = window.player;

    const randomIndex = Math.floor(Math.random() * SPACE_ENCOUNTERS.length);
    const encounter = SPACE_ENCOUNTERS[randomIndex];
    currentActiveEncounter = encounter;

    const modal = document.getElementById("spaceEncounterModal");
    if (!modal) return;

    const iconElem = document.getElementById("encounterModalIcon");
    const titleElem = document.getElementById("encounterModalTitle");
    const badgeElem = document.getElementById("encounterModalBadge");
    const descElem = document.getElementById("encounterModalDesc");
    const choicesContainer = document.getElementById("encounterModalChoices");

    if (iconElem) {
        iconElem.textContent = encounter.icon;
        iconElem.className = `material-symbols-outlined text-[32px] ${encounter.iconColor}`;
    }
    if (titleElem) titleElem.textContent = encounter.title;
    if (badgeElem) {
        badgeElem.textContent = encounter.category.toUpperCase();
        badgeElem.className = `px-2.5 py-0.5 rounded-full font-hud-label-sm text-[10px] font-bold ${encounter.badgeClass}`;
    }
    if (descElem) descElem.textContent = encounter.description;

    if (choicesContainer) {
        const choices = encounter.getChoices(p);
        choicesContainer.innerHTML = choices.map((c, idx) => `
            <button onclick="executeEncounterChoice(${idx})" class="w-full p-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/10 hover:border-primary-container/40 flex flex-col text-left transition-all active:scale-[0.98] group">
                <span class="font-headline-sm text-[13px] font-bold text-on-surface group-hover:text-primary-container transition-colors">${c.label}</span>
                <span class="font-body-sm text-[11px] text-on-surface-variant mt-0.5">${c.subtext}</span>
            </button>
        `).join("");
    }

    if (typeof playSound === "function") {
        playSound("discovery");
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function executeEncounterChoice(choiceIndex) {
    if (!currentActiveEncounter || !window.player) return;
    const choices = currentActiveEncounter.getChoices(window.player);
    const selected = choices[choiceIndex];

    if (selected && typeof selected.action === "function") {
        const result = selected.action();
        savePlayer(window.player);

        if (typeof playSound === "function" && result.sound) {
            playSound(result.sound);
        }
        if (typeof triggerParticleBurst === "function") {
            triggerParticleBurst();
        }
        if (typeof showToast === "function" && result.text) {
            showToast(result.text, "success");
        }
        if (typeof renderHUD === "function") {
            renderHUD();
        }
    }

    closeEncounterModal();
}

function closeEncounterModal() {
    playSound("click");
    currentActiveEncounter = null;
    const modal = document.getElementById("spaceEncounterModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}
