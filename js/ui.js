// ORBIT // User Interface Controller, Interactivity & Audio FX

// -------------------------------------------------------------
// 1. Procedural Audio Synthesizer
// -------------------------------------------------------------
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!window.player || player.soundEnabled === false) return;
    try {
        initAudio();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;

        if (type === "thruster") {
            // Deep rocket roar with sweep
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(85, now);
            osc.frequency.exponentialRampToValueAtTime(380, now + 0.4);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.9);

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(320, now);
            filter.frequency.linearRampToValueAtTime(1400, now + 0.35);
            filter.frequency.exponentialRampToValueAtTime(150, now + 0.9);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.9);
        } else if (type === "upgrade") {
            // Ascending power chime
            [392, 523.25, 659.25, 783.99].forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                const startTime = now + idx * 0.07;

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.2, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.3);
            });
        } else if (type === "discovery") {
            // Radiant discovery bell
            [587.33, 880, 1174.66, 1760].forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                const startTime = now + idx * 0.08;

                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.25, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.45);
            });
        } else if (type === "arrival") {
            // Victory fanfare
            [440, 554.37, 659.25, 880, 1108.73].forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                const startTime = now + idx * 0.1;

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.6);
            });
        } else if (type === "click") {
            // Tactile click
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(700, now);
            osc.frequency.exponentialRampToValueAtTime(350, now + 0.03);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.03);
        } else if (type === "error") {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.15);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    } catch (e) {}
}

// -------------------------------------------------------------
// 2. Interactive Confetti & Starburst Effect
// -------------------------------------------------------------
function triggerParticleBurst(originX, originY) {
    const count = 20;
    const colors = ["#00f0ff", "#ffd19c", "#d0bcff", "#ffffff", "#10b981"];
    const x = originX || window.innerWidth / 2;
    const y = originY || window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement("div");
        particle.className = "particle-star";
        const size = Math.floor(Math.random() * 8) + 4;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 120 + 40;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 10px ${color}`;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty("--tx", `${tx}px`);
        particle.style.setProperty("--ty", `${ty}px`);

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 900);
    }
}

// -------------------------------------------------------------
// 3. Planet Color Theme Engine
// -------------------------------------------------------------
function applyPlanetTheme(planetKey) {
    const html = document.documentElement;
    html.classList.remove("theme-earth", "theme-moon", "theme-mars");

    const key = (planetKey || "earth").toLowerCase();
    if (key.includes("moon")) {
        html.classList.add("theme-moon");
    } else if (key.includes("mars")) {
        html.classList.add("theme-mars");
    } else {
        html.classList.add("theme-earth");
    }

    if (window.player) {
        window.player.currentTheme = key;
        savePlayer(window.player);
    }
}

// -------------------------------------------------------------
// 4. Tab Navigation System (Max 5 Tabs)
// -------------------------------------------------------------
function switchTab(tabId) {
    playSound("click");

    const tabs = ["save", "launch", "rocket", "planets", "profile"];
    tabs.forEach(tab => {
        const pane = document.getElementById(`tab-${tab}`);
        const btn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
        if (pane) {
            if (tab === tabId) {
                pane.classList.remove("hidden");
                pane.classList.add("active");
            } else {
                pane.classList.add("hidden");
                pane.classList.remove("active");
            }
        }
        if (btn) {
            if (tab === tabId) {
                btn.classList.add("active");
                btn.classList.remove("text-on-surface-variant");
            } else {
                btn.classList.remove("active");
                btn.classList.add("text-on-surface-variant");
            }
        }
    });

    const titleElem = document.getElementById("header-title");
    if (titleElem) {
        const titles = {
            save: "Save Money",
            launch: "Launch Mission",
            rocket: "Upgrade Rocket",
            planets: "Space Atlas",
            profile: "My Profile"
        };
        titleElem.textContent = titles[tabId] || "Orbit";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    renderHUD();
}

// -------------------------------------------------------------
// 5. Trajectory Bézier Math & Spaceship Position
// -------------------------------------------------------------
function updateSpaceshipPosition(progressPercent) {
    const vessel = document.getElementById("vesselContainer");
    if (!vessel) return;

    const t = Math.max(0, Math.min(100, progressPercent)) / 100;

    const p0 = { x: 45, y: 95 };
    const p1 = { x: 190, y: 25 };
    const p2 = { x: 335, y: 95 };

    const oneMinusT = 1 - t;
    const x = Math.pow(oneMinusT, 2) * p0.x + 2 * oneMinusT * t * p1.x + Math.pow(t, 2) * p2.x;
    const y = Math.pow(oneMinusT, 2) * p0.y + 2 * oneMinusT * t * p1.y + Math.pow(t, 2) * p2.y;

    const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 45;

    vessel.style.left = `${(x / 380) * 100}%`;
    vessel.style.top = `${(y / 190) * 100}%`;

    const shipIcon = vessel.querySelector(".ship-sprite");
    if (shipIcon) {
        shipIcon.style.transform = `rotate(${angleDeg}deg)`;
    }

    const beamStop = document.getElementById("beamActiveStop");
    if (beamStop) {
        beamStop.setAttribute("offset", `${Math.max(5, progressPercent)}%`);
    }

    // Update current visual stage badge on the Launch tab
    const stageBadge = document.getElementById("launch-stage-badge");
    if (stageBadge) {
        if (progressPercent >= 100) stageBadge.textContent = "Stage 5: Lunar Landing!";
        else if (progressPercent >= 75) stageBadge.textContent = "Stage 4: Approaching Moon";
        else if (progressPercent >= 50) stageBadge.textContent = "Stage 3: Deep Space Transit";
        else if (progressPercent >= 25) stageBadge.textContent = "Stage 2: Earth Orbit Exit";
        else stageBadge.textContent = "Stage 1: Launchpad Ready";
    }
}

// Dramatic launch animation
function animateRocketLaunchSequence(burnAmount, progressGain) {
    const flightDeck = document.getElementById("launch-flight-deck");
    const vessel = document.getElementById("vesselContainer");

    if (flightDeck) {
        flightDeck.classList.add("launching-shake");
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight * 0.4);

        setTimeout(() => {
            flightDeck.classList.remove("launching-shake");
        }, 850);
    }

    if (vessel) {
        vessel.classList.add("scale-125");
        setTimeout(() => vessel.classList.remove("scale-125"), 600);
    }

    showToast(`Liftoff! Burned ${burnAmount} Fuel → Traveled +${progressGain}% closer to Moon!`, "thruster");
}

// Interactive highlight for rocket parts in Hangar
function highlightRocketModule(moduleType) {
    playSound("click");
    const card = document.getElementById(`up-${moduleType}-card`);
    if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("ring-2", "ring-primary-container", "shadow-[0_0_20px_var(--planet-glow)]");
        setTimeout(() => {
            card.classList.remove("ring-2", "ring-primary-container", "shadow-[0_0_20px_var(--planet-glow)]");
        }, 1400);
    }
}

// -------------------------------------------------------------
// 6. Toast Notifications
// -------------------------------------------------------------
let toastTimer = null;

function showToast(message, type = "info") {
    const toast = document.getElementById("orbitToast");
    const msg = document.getElementById("toastMsg");
    const icon = document.getElementById("toastIcon");
    if (!toast || !msg) return;

    msg.textContent = message;

    if (icon) {
        if (type === "thruster") icon.textContent = "rocket_launch";
        else if (type === "discovery") icon.textContent = "satellite_alt";
        else if (type === "success" || type === "upgrade") icon.textContent = "check_circle";
        else if (type === "error") icon.textContent = "warning";
        else icon.textContent = "info";
    }

    toast.classList.remove("opacity-0", "translate-y-3", "pointer-events-none");
    toast.classList.add("opacity-100", "translate-y-0");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("opacity-100", "translate-y-0");
        toast.classList.add("opacity-0", "translate-y-3", "pointer-events-none");
    }, 3000);
}

// -------------------------------------------------------------
// 7. Reactive HUD Synchronization
// -------------------------------------------------------------
function renderHUD() {
    if (!window.player) return;
    const p = window.player;

    // Check daily limits reset
    if (typeof checkDailyReset === "function") {
        checkDailyReset(p);
    }

    // Synchronize Planet Theme
    if (p.currentTheme) {
        applyPlanetTheme(p.currentTheme);
    }

    // Top Header
    const headerCredits = document.getElementById("header-credits");
    if (headerCredits) headerCredits.textContent = (p.credits || 0).toLocaleString();

    const headerRank = document.getElementById("header-rank");
    if (headerRank) {
        if (p.savings.total >= 10000) headerRank.textContent = "Admiral";
        else if (p.savings.total >= 5000) headerRank.textContent = "Captain";
        else if (p.savings.total >= 1000) headerRank.textContent = "Pilot";
        else headerRank.textContent = "Cadet";
    }

    // ------------------------------------
    // TAB 1: SAVE MONEY & DAILY LIMIT TRACKER
    // ------------------------------------
    const saveTotalVault = document.getElementById("save-total-vault");
    if (saveTotalVault) saveTotalVault.textContent = `₹${(p.savings.total || 0).toLocaleString()}`;

    const saveCreditsAvail = document.getElementById("save-credits-avail");
    if (saveCreditsAvail) saveCreditsAvail.textContent = `${(p.credits || 0).toLocaleString()} Credits`;

    const saveFuelReady = document.getElementById("save-fuel-ready");
    if (saveFuelReady) saveFuelReady.textContent = `${p.fuelReady || 0} Fuel`;

    const saveStreakCount = document.getElementById("save-streak-count");
    if (saveStreakCount) saveStreakCount.textContent = `${p.streak.current || 1} Days`;

    // Daily Limit Tracker UI
    const savedToday = p.dailyLimits ? p.dailyLimits.savedToday || 0 : 0;
    const depositsCount = p.dailyLimits ? p.dailyLimits.depositsCountToday || 0 : 0;
    const remainingDailyAmount = Math.max(0, 250 - savedToday);
    const savesRemaining = Math.max(0, 6 - depositsCount);

    const trackerSavedToday = document.getElementById("tracker-saved-today");
    if (trackerSavedToday) trackerSavedToday.textContent = `₹${savedToday} / ₹250`;

    const trackerAmountRemaining = document.getElementById("tracker-amount-remaining");
    if (trackerAmountRemaining) trackerAmountRemaining.textContent = `₹${remainingDailyAmount} left`;

    const trackerAmountBar = document.getElementById("tracker-amount-bar");
    if (trackerAmountBar) {
        const pct = Math.min(100, Math.round((savedToday / 250) * 100));
        trackerAmountBar.style.width = `${pct}%`;
    }

    const trackerDepositsCount = document.getElementById("tracker-deposits-count");
    if (trackerDepositsCount) trackerDepositsCount.textContent = `${depositsCount} / 6 used (${savesRemaining} left)`;

    // Render 6 deposit slot pills
    const slotsContainer = document.getElementById("tracker-deposit-slots");
    if (slotsContainer) {
        let slotsHtml = "";
        for (let i = 1; i <= 6; i++) {
            const isUsed = i <= depositsCount;
            slotsHtml += `
                <div class="h-2 flex-1 rounded-full ${isUsed ? 'bg-primary-container shadow-[0_0_8px_var(--planet-glow)]' : 'bg-surface-container-highest'} transition-colors"></div>
            `;
        }
        slotsContainer.innerHTML = slotsHtml;
    }

    // Daily Cap Banner if achieved
    const capBanner = document.getElementById("tracker-cap-banner");
    if (capBanner) {
        if (savedToday >= 250 || depositsCount >= 6) {
            capBanner.classList.remove("hidden");
        } else {
            capBanner.classList.add("hidden");
        }
    }

    // Daily missions in Save tab
    const saveM1Check = document.getElementById("save-m1-check");
    if (saveM1Check) {
        saveM1Check.innerHTML = p.missions.dailySave
            ? `<span class="material-symbols-outlined text-[18px] text-green-400">check_circle</span>`
            : `<span class="material-symbols-outlined text-[18px] text-on-surface-variant">radio_button_unchecked</span>`;
    }
    const saveM2Check = document.getElementById("save-m2-check");
    if (saveM2Check) {
        saveM2Check.innerHTML = p.missions.saveTwice
            ? `<span class="material-symbols-outlined text-[18px] text-green-400">check_circle</span>`
            : `<span class="material-symbols-outlined text-[18px] text-on-surface-variant">radio_button_unchecked</span>`;
    }

    // ------------------------------------
    // TAB 2: LAUNCH ROCKET
    // ------------------------------------
    const launchFuelBadge = document.getElementById("launch-fuel-badge");
    if (launchFuelBadge) launchFuelBadge.textContent = `${p.fuelReady || 0} Fuel Ready`;

    const launchProgressBar = document.getElementById("launch-progress-bar");
    if (launchProgressBar) launchProgressBar.style.width = `${p.journey.progress || 0}%`;

    const launchDistanceKm = document.getElementById("launch-distance-km");
    if (launchDistanceKm) {
        const kmLeft = Math.max(0, Math.round((1 - (p.journey.progress || 0) / 100) * 384400));
        launchDistanceKm.textContent = `${kmLeft.toLocaleString()} KM to Moon`;
    }

    const launchBtn = document.getElementById("launch-action-btn");
    if (launchBtn) {
        if ((p.fuelReady || 0) <= 0) {
            launchBtn.classList.add("opacity-50");
            launchBtn.innerHTML = `
                <span class="material-symbols-outlined text-[20px]">local_gas_station</span>
                <span>NO FUEL READY (SAVE MONEY TO EARN FUEL)</span>
            `;
        } else {
            launchBtn.classList.remove("opacity-50");
            const maxBurn = Math.min(p.fuelReady, (p.rocket.fuel || 1) * 25);
            launchBtn.innerHTML = `
                <span class="material-symbols-outlined text-[20px]">rocket_launch</span>
                <span>LAUNCH ROCKET NOW (Burns ${maxBurn} Fuel)</span>
            `;
        }
    }

    updateSpaceshipPosition(p.journey.progress || 0);

    // ------------------------------------
    // TAB 3: ROCKET UPGRADES
    // ------------------------------------
    const hangarCredits = document.getElementById("hangar-credits-display");
    if (hangarCredits) hangarCredits.textContent = `${(p.credits || 0).toLocaleString()} Credits`;

    renderUpgradeCard("engine", p.rocket.engine || 1);
    renderUpgradeCard("fuel", p.rocket.fuel || 1);
    renderUpgradeCard("shield", p.rocket.shield || 1);
    renderUpgradeCard("scanner", p.rocket.scanner || 1);

    // ------------------------------------
    // TAB 4: SPACE ATLAS & DISCOVERIES
    // ------------------------------------
    const atlasUnlockedCount = p.unlockedPlanets ? p.unlockedPlanets.length : 1;
    const atlasProgressText = document.getElementById("atlas-progress-text");
    if (atlasProgressText) atlasProgressText.textContent = `${atlasUnlockedCount} of 6 Planets Unlocked`;

    const atlasProgressBar = document.getElementById("atlas-progress-bar");
    if (atlasProgressBar) atlasProgressBar.style.width = `${Math.round((atlasUnlockedCount / 6) * 100)}%`;

    // Discoveries grid in Atlas tab
    const discoveriesGrid = document.getElementById("discoveries-grid");
    if (discoveriesGrid && typeof DISCOVERY_TYPES !== "undefined") {
        const foundMap = new Map();
        (p.discoveries || []).forEach(d => foundMap.set(d.id, d));

        const countText = document.getElementById("discoveries-count-text");
        if (countText) countText.textContent = `${foundMap.size} of ${DISCOVERY_TYPES.length} Collected`;

        discoveriesGrid.innerHTML = DISCOVERY_TYPES.map(item => {
            const isFound = foundMap.has(item.id);
            return `
                <div onclick="inspectArtifact('${item.id}')" class="group relative rounded-xl bg-surface-container p-3 flex flex-col justify-between border border-white/5 cursor-pointer hover:border-primary-container/40 transition-all ${!isFound ? 'opacity-55' : ''}">
                    <div class="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-lowest mb-2">
                        <img class="w-full h-full object-cover group-hover:scale-105 transition-transform ${!isFound ? 'grayscale' : ''}" src="${item.image}" alt="${item.name}">
                        <span class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full ${item.badgeClass} font-hud-label-sm text-[9px] uppercase font-bold">
                            ${item.rarity}
                        </span>
                        ${!isFound ? `
                            <div class="absolute inset-0 flex items-center justify-center bg-black/40">
                                <span class="material-symbols-outlined text-[20px] text-on-surface-variant">lock</span>
                            </div>
                        ` : ''}
                    </div>
                    <div>
                        <h4 class="font-headline-sm text-[13px] font-bold text-on-surface truncate">${item.name}</h4>
                        <p class="font-body-sm text-[11px] text-on-surface-variant line-clamp-1">${isFound ? item.lore : 'Launch missions to discover this!'}</p>
                        <div class="flex items-center justify-between pt-1">
                            <span class="font-hud-label-sm text-[10px] text-tertiary-fixed font-bold">+${item.reward} Credits</span>
                            <span class="font-hud-label-sm text-[10px] text-primary-container font-semibold">Inspect</span>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    // ------------------------------------
    // TAB 5: CADET PROFILE
    // ------------------------------------
    const profCallsign = document.getElementById("profile-callsign");
    if (profCallsign) profCallsign.textContent = p.callsign || "Commander Alex";

    const profTotal = document.getElementById("profile-total-saved");
    if (profTotal) profTotal.textContent = `₹${(p.savings.total || 0).toLocaleString()}`;

    const profCredits = document.getElementById("profile-total-credits");
    if (profCredits) profCredits.textContent = `${(p.credits || 0).toLocaleString()}`;

    const profStreak = document.getElementById("profile-streak");
    if (profStreak) profStreak.textContent = `${p.streak.current || 1} Days`;

    const soundToggle = document.getElementById("profile-sound-toggle");
    if (soundToggle) soundToggle.checked = p.soundEnabled !== false;
}

function renderUpgradeCard(type, level) {
    const levelElem = document.getElementById(`up-${type}-level`);
    if (levelElem) levelElem.innerHTML = `Level ${level}<span class="text-on-surface-variant text-[12px]">/10</span>`;

    const cost = level * 50;
    const costElem = document.getElementById(`up-${type}-cost`);
    if (costElem) costElem.textContent = `${cost} Credits`;

    const dotsContainer = document.getElementById(`up-${type}-dots`);
    if (dotsContainer) {
        let dotsHtml = "";
        for (let i = 1; i <= 10; i++) {
            dotsHtml += `<div class="rounded-full h-1.5 ${i <= level ? 'bg-primary-container shadow-[0_0_6px_var(--planet-primary)]' : 'bg-surface-container-highest'}"></div>`;
        }
        dotsContainer.innerHTML = dotsHtml;
    }

    const btn = document.getElementById(`up-${type}-btn`);
    if (btn) {
        if (player.credits < cost) {
            btn.classList.add("opacity-50");
        } else {
            btn.classList.remove("opacity-50");
        }
    }
}

// -------------------------------------------------------------
// 8. Modals (Artifact Inspect, Custom Save, Arrival)
// -------------------------------------------------------------
function inspectArtifact(artifactId) {
    playSound("click");
    const modal = document.getElementById("artifactInspectorModal");
    if (!modal || typeof DISCOVERY_TYPES === "undefined") return;

    const item = DISCOVERY_TYPES.find(d => d.id === artifactId);
    if (!item) return;

    document.getElementById("modalArtifactImg").src = item.image;
    document.getElementById("modalArtifactName").textContent = item.name;
    document.getElementById("modalArtifactRarity").textContent = item.rarity;
    document.getElementById("modalArtifactRarity").className = `px-2 py-0.5 rounded-full ${item.badgeClass} font-hud-label-sm text-[10px] uppercase font-bold`;
    document.getElementById("modalArtifactReward").textContent = `+${item.reward} Mission Credits`;
    document.getElementById("modalArtifactLore").textContent = item.lore;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeArtifactModal() {
    playSound("click");
    const modal = document.getElementById("artifactInspectorModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

function openCustomSaveModal() {
    playSound("click");
    const modal = document.getElementById("customSaveModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function closeCustomSaveModal() {
    playSound("click");
    const modal = document.getElementById("customSaveModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

function submitCustomSave() {
    const input = document.getElementById("customSaveInput");
    if (!input) return;
    const val = parseFloat(input.value);
    if (!val || val <= 0) {
        showToast("Enter an amount greater than 0", "error");
        return;
    }
    if (val > 50) {
        showToast("Maximum single save is ₹50 at a time.", "error");
        return;
    }
    const success = recordSaving(val, "Custom Save");
    if (success) {
        input.value = "";
        closeCustomSaveModal();
    }
}

function setCustomSaveVal(val) {
    playSound("click");
    const input = document.getElementById("customSaveInput");
    if (input) input.value = val;
}

function showArrivalModal(planetName, stationName) {
    const modal = document.getElementById("arrivalCelebrationModal");
    if (!modal) return;

    document.getElementById("arrivalModalTitle").textContent = `${planetName.toUpperCase()} REACHED!`;
    document.getElementById("arrivalModalMsg").textContent = `Congratulations! You saved money and traveled all the way from Earth to the Moon! Luna Gate Base is unlocked, and +150 bonus credits are added to your wallet.`;

    triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2);
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeArrivalModal() {
    playSound("click");
    const modal = document.getElementById("arrivalCelebrationModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

function toggleSound(checkbox) {
    if (!window.player) return;
    player.soundEnabled = checkbox.checked;
    savePlayer(player);
    if (player.soundEnabled) playSound("click");
}

function confirmResetPlayer() {
    if (confirm("Reset all Orbit savings and progress to start fresh?")) {
        resetPlayer();
        showToast("Game data reset. Ready for a new journey!", "info");
    }
}

// -------------------------------------------------------------
// 9. Initialization
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", () => {
        initAudio();
    }, { once: true });

    renderHUD();

    window.addEventListener("resize", () => {
        if (window.player) {
            updateSpaceshipPosition(window.player.journey.progress || 0);
        }
    });
});
