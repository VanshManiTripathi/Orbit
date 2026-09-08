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
    html.classList.remove("theme-earth", "theme-moon", "theme-mars", "theme-jupiter", "theme-saturn", "theme-neptune");

    const key = (planetKey || "earth").toLowerCase();
    if (key.includes("moon")) {
        html.classList.add("theme-moon");
    } else if (key.includes("mars")) {
        html.classList.add("theme-mars");
    } else if (key.includes("jupiter")) {
        html.classList.add("theme-jupiter");
    } else if (key.includes("saturn")) {
        html.classList.add("theme-saturn");
    } else if (key.includes("neptune")) {
        html.classList.add("theme-neptune");
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
        const isCh2 = window.player && (window.player.journey.chapter === 2 || window.player.journey.targetPlanet === "Mars");
        if (isCh2) {
            if (progressPercent >= 100) stageBadge.textContent = "Stage 5: Touchdown at Olympus Mons!";
            else if (progressPercent >= 75) stageBadge.textContent = "Stage 4: Martian Atmospheric Entry";
            else if (progressPercent >= 50) stageBadge.textContent = "Stage 3: Asteroid Belt Crossing";
            else if (progressPercent >= 25) stageBadge.textContent = "Stage 2: Deep Solar Transit";
            else stageBadge.textContent = "Stage 1: Lunar Orbit Departure";
        } else {
            if (progressPercent >= 100) stageBadge.textContent = "Stage 5: Lunar Landing!";
            else if (progressPercent >= 75) stageBadge.textContent = "Stage 4: Approaching Moon";
            else if (progressPercent >= 50) stageBadge.textContent = "Stage 3: Deep Space Transit";
            else if (progressPercent >= 25) stageBadge.textContent = "Stage 2: Earth Orbit Exit";
            else stageBadge.textContent = "Stage 1: Launchpad Ready";
        }
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

    // Daily Limit Tracker UI (Max 10 saves per day, ₹400 cap)
    const savedToday = p.dailyLimits ? p.dailyLimits.savedToday || 0 : 0;
    const depositsCount = p.dailyLimits ? p.dailyLimits.depositsCountToday || 0 : 0;
    const remainingDailyAmount = Math.max(0, 400 - savedToday);
    const savesRemaining = Math.max(0, 10 - depositsCount);

    const trackerSavedToday = document.getElementById("tracker-saved-today");
    if (trackerSavedToday) trackerSavedToday.textContent = `₹${savedToday} / ₹400`;

    const trackerAmountRemaining = document.getElementById("tracker-amount-remaining");
    if (trackerAmountRemaining) trackerAmountRemaining.textContent = `₹${remainingDailyAmount} left`;

    const trackerAmountBar = document.getElementById("tracker-amount-bar");
    if (trackerAmountBar) {
        const pct = Math.min(100, Math.round((savedToday / 400) * 100));
        trackerAmountBar.style.width = `${pct}%`;
    }

    const trackerDepositsCount = document.getElementById("tracker-deposits-count");
    if (trackerDepositsCount) trackerDepositsCount.textContent = `${depositsCount} / 10 used (${savesRemaining} left)`;

    // Render 10 deposit slot pills
    const slotsContainer = document.getElementById("tracker-deposit-slots");
    if (slotsContainer) {
        let slotsHtml = "";
        for (let i = 1; i <= 10; i++) {
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
        if (savedToday >= 400 || depositsCount >= 10) {
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
    // TAB 2: LAUNCH ROCKET (CHAPTERS 1 TO 5)
    // ------------------------------------
    const ch = p.journey ? (p.journey.chapter || 1) : 1;

    // Render Daily Launch Limit Slots (Max 5 per day)
    const isLimitDisabled = Boolean(p.dailyLaunchLimitDisabled);
    const launchesCount = p.dailyLimits ? (p.dailyLimits.launchesCountToday || 0) : 0;
    const maxLaunches = 5;
    const launchesLeft = Math.max(0, maxLaunches - launchesCount);

    const capStatusText = document.getElementById("launch-cap-status-text");
    if (capStatusText) {
        capStatusText.textContent = isLimitDisabled ? "Unlimited (Dev Mode)" : `${launchesLeft} of ${maxLaunches} Left Today`;
        capStatusText.className = isLimitDisabled
            ? "font-hud-label-sm text-[11px] font-bold text-secondary"
            : (launchesLeft <= 0 ? "font-hud-label-sm text-[11px] font-bold text-error" : "font-hud-label-sm text-[11px] font-bold text-primary-fixed");
    }

    const slotContainer = document.getElementById("launch-slot-indicators");
    if (slotContainer) {
        let slotsHtml = "";
        for (let s = 1; s <= maxLaunches; s++) {
            if (isLimitDisabled) {
                slotsHtml += `<div class="h-2 flex-1 rounded-full bg-secondary/80 shadow-[0_0_6px_rgba(208,188,255,0.4)]" title="Dev Mode Unlimited"></div>`;
            } else if (s <= launchesCount) {
                slotsHtml += `<div class="h-2 flex-1 rounded-full bg-surface-container-highest opacity-40" title="Launch ${s} used"></div>`;
            } else {
                slotsHtml += `<div class="h-2 flex-1 rounded-full bg-primary-container shadow-[0_0_6px_var(--planet-primary)]" title="Launch ${s} available"></div>`;
            }
        }
        slotContainer.innerHTML = slotsHtml;
    }

    const launchCapAlert = document.getElementById("launch-cap-alert");
    if (launchCapAlert) {
        if (!isLimitDisabled && launchesLeft <= 0) {
            launchCapAlert.classList.remove("hidden");
        } else {
            launchCapAlert.classList.add("hidden");
        }
    }

    // Flight Deck Configuration for Chapters 1 - 5
    const chapterConfigs = {
        1: { title: "Earth to Moon Flight", origin: "Earth", target: "Moon", km: 384400, targetColor: "text-secondary", stages: ["Earth", "Orbit", "Space", "Approach", "Moon"] },
        2: { title: "Moon to Mars Expedition (Chapter 2)", origin: "Moon", target: "Mars", km: 54600000, targetColor: "text-[#ff5555]", stages: ["Moon", "Transit", "Asteroids", "Entry", "Mars"] },
        3: { title: "Mars to Jupiter Voyage (Chapter 3)", origin: "Mars", target: "Jupiter", km: 588000000, targetColor: "text-[#ffb95f]", stages: ["Mars", "Belt", "Jovian Wave", "Europa", "Jupiter"] },
        4: { title: "Jupiter to Saturn Flight (Chapter 4)", origin: "Jupiter", target: "Saturn", km: 650000000, targetColor: "text-[#34d399]", stages: ["Jupiter", "Deep Void", "Titan Field", "Ice Rings", "Saturn"] },
        5: { title: "Saturn to Neptune Horizon (Chapter 5)", origin: "Saturn", target: "Neptune", km: 1500000000, targetColor: "text-[#38bdf8]", stages: ["Saturn", "Kuiper Edge", "Triton Drift", "Dark Void", "Neptune"] }
    };

    const currentChConfig = chapterConfigs[ch] || chapterConfigs[1];

    const flightTitle = document.getElementById("launch-flight-title");
    if (flightTitle) flightTitle.textContent = currentChConfig.title;

    const flightIcon = document.getElementById("launch-flight-icon");
    if (flightIcon) flightIcon.textContent = ch > 1 ? "rocket_launch" : "explore";

    const originName = document.getElementById("launch-origin-name");
    const targetName = document.getElementById("launch-target-name");
    if (originName) originName.textContent = currentChConfig.origin;
    if (targetName) {
        targetName.textContent = currentChConfig.target;
        targetName.className = `font-hud-label-sm text-[10px] ${currentChConfig.targetColor} uppercase tracking-wider mt-1.5 font-bold`;
    }

    const launchFuelBadge = document.getElementById("launch-fuel-badge");
    if (launchFuelBadge) launchFuelBadge.textContent = `${p.fuelReady || 0} Fuel Ready`;

    const launchProgressBar = document.getElementById("launch-progress-bar");
    if (launchProgressBar) launchProgressBar.style.width = `${p.journey.progress || 0}%`;

    const launchDistanceKm = document.getElementById("launch-distance-km");
    if (launchDistanceKm) {
        const totalKm = currentChConfig.km;
        const kmLeft = Math.max(0, Math.round((1 - (p.journey.progress || 0) / 100) * totalKm));
        if (kmLeft >= 1000000000) {
            launchDistanceKm.textContent = `${(kmLeft / 1000000000).toFixed(2)}B KM to ${currentChConfig.target}`;
        } else if (kmLeft >= 1000000) {
            launchDistanceKm.textContent = `${(kmLeft / 1000000).toFixed(1)}M KM to ${currentChConfig.target}`;
        } else {
            launchDistanceKm.textContent = `${kmLeft.toLocaleString()} KM to ${currentChConfig.target}`;
        }
    }

    const launchBtn = document.getElementById("launch-action-btn");
    if (launchBtn) {
        if (!isLimitDisabled && launchesLeft <= 0) {
            launchBtn.classList.add("opacity-50");
            launchBtn.innerHTML = `
                <span class="material-symbols-outlined text-[20px]">lock_clock</span>
                <span>DAILY LAUNCH LIMIT REACHED (0/5 LEFT)</span>
            `;
        } else if ((p.fuelReady || 0) <= 0) {
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
                <span>LAUNCH ROCKET NOW (Burns ${maxBurn} Fuel to ${currentChConfig.target})</span>
            `;
        }
    }

    const launchInfoText = document.getElementById("launch-info-text");
    if (launchInfoText) {
        launchInfoText.textContent = `Pressing launch burns ready fuel, propels your active flagship closer to ${currentChConfig.target}, and scans for rare space discoveries!`;
    }

    const stageGuide = document.getElementById("launch-stage-guide");
    if (stageGuide) {
        stageGuide.innerHTML = `
            <div class="p-1.5 rounded-lg bg-surface-container border border-white/5">0%<br/><span class="text-[9px] text-primary-container font-bold">${currentChConfig.stages[0]}</span></div>
            <div class="p-1.5 rounded-lg bg-surface-container border border-white/5">25%<br/><span class="text-[9px]">${currentChConfig.stages[1]}</span></div>
            <div class="p-1.5 rounded-lg bg-surface-container border border-white/5">50%<br/><span class="text-[9px]">${currentChConfig.stages[2]}</span></div>
            <div class="p-1.5 rounded-lg bg-surface-container border border-white/5">75%<br/><span class="text-[9px]">${currentChConfig.stages[3]}</span></div>
            <div class="p-1.5 rounded-lg bg-surface-container border border-white/5">100%<br/><span class="text-[9px] ${currentChConfig.targetColor} font-bold">${currentChConfig.stages[4]}</span></div>
        `;
    }

    // Toggle Chapter Embark Banners
    const ch2Banner = document.getElementById("chapter-2-banner");
    const ch3Banner = document.getElementById("chapter-3-banner");
    const ch4Banner = document.getElementById("chapter-4-banner");
    const ch5Banner = document.getElementById("chapter-5-banner");
    const chCompBanner = document.getElementById("chapter-completed-banner");

    const moonUnlocked = (p.unlockedPlanets || []).includes("Moon");
    const marsUnlocked = (p.unlockedPlanets || []).includes("Mars");
    const jupiterUnlocked = (p.unlockedPlanets || []).includes("Jupiter");
    const saturnUnlocked = (p.unlockedPlanets || []).includes("Saturn");
    const neptuneUnlocked = (p.unlockedPlanets || []).includes("Neptune");

    if (ch2Banner) ch2Banner.classList.toggle("hidden", !(moonUnlocked && ch === 1 && (p.journey.progress || 0) >= 100));
    if (ch3Banner) ch3Banner.classList.toggle("hidden", !(marsUnlocked && ch === 2 && (p.journey.progress || 0) >= 100));
    if (ch4Banner) ch4Banner.classList.toggle("hidden", !(jupiterUnlocked && ch === 3 && (p.journey.progress || 0) >= 100));
    if (ch5Banner) ch5Banner.classList.toggle("hidden", !(saturnUnlocked && ch === 4 && (p.journey.progress || 0) >= 100));
    if (chCompBanner) chCompBanner.classList.toggle("hidden", !neptuneUnlocked);

    updateSpaceshipPosition(p.journey.progress || 0);

    // ------------------------------------
    // TAB 3: FLEET HANGAR & ROCKET UPGRADES
    // ------------------------------------
    const hangarCredits = document.getElementById("hangar-credits-display");
    if (hangarCredits) hangarCredits.textContent = `${(p.credits || 0).toLocaleString()} Credits`;

    // Render Fleet Hangar Dock
    const fleetScroll = document.getElementById("hangar-fleet-scroll");
    const fleetCount = document.getElementById("hangar-fleet-count");
    if (fleetScroll && p.spaceships) {
        const shipsList = Object.values(p.spaceships);
        const unlockedCount = shipsList.filter(s => s.unlocked).length;
        if (fleetCount) fleetCount.textContent = `${unlockedCount} of ${shipsList.length} Flagships`;

        fleetScroll.innerHTML = shipsList.map(ship => {
            const isActive = ship.id === p.activeShipId;
            const isUnlocked = Boolean(ship.unlocked);

            let borderClass = isActive
                ? "border-primary-container shadow-[0_0_15px_var(--planet-primary)] bg-surface-container-high ring-1 ring-primary-container"
                : (isUnlocked ? "border-white/10 hover:border-white/30 bg-surface-container-low" : "border-white/5 opacity-50 bg-surface-container-lowest");

            let badgeHtml = isActive
                ? `<span class="px-1.5 py-0.2 rounded-full bg-primary-container text-[#050816] text-[8px] font-bold uppercase">ACTIVE</span>`
                : (isUnlocked ? `<span class="px-1.5 py-0.2 rounded-full bg-secondary/20 text-secondary text-[8px] font-bold uppercase">READY</span>` : `<span class="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant text-[8px] font-bold uppercase">LOCKED</span>`);

            return `
                <div onclick="selectActiveSpaceship('${ship.id}')" class="group min-w-[140px] p-2 rounded-xl border ${borderClass} flex flex-col gap-1.5 cursor-pointer transition-all shrink-0">
                    <div class="relative w-full h-20 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                        <img src="${ship.image}" alt="${ship.name}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isUnlocked ? '' : 'grayscale opacity-50'}"/>
                        <div class="absolute top-1 right-1">${badgeHtml}</div>
                    </div>
                    <div>
                        <h4 class="font-headline-sm text-[12px] font-bold text-on-surface truncate">${ship.name}</h4>
                        <span class="text-[9px] text-on-surface-variant">${isUnlocked ? ship.badge : 'Reach ' + ship.planet}</span>
                    </div>
                    <div class="flex items-center justify-between text-[9px] text-on-surface-variant pt-1 border-t border-white/5 font-hud-label-sm">
                        <span>ENG L${ship.engine || 1}</span>
                        <span>SHD L${ship.shield || 1}</span>
                    </div>
                </div>
            `;
        }).join("");
    }

    // Active ship specs & upgrades
    const activeShip = p.spaceships ? p.spaceships[p.activeShipId || "aegis"] : null;
    if (activeShip) {
        const activeName = document.getElementById("active-ship-name");
        const activeBadge = document.getElementById("active-ship-badge");
        const activeDesc = document.getElementById("active-ship-desc");
        const activeAvatar = document.getElementById("active-ship-avatar-img");
        const activeBlueprint = document.getElementById("active-ship-blueprint-img");
        if (activeName) activeName.textContent = activeShip.name;
        if (activeBadge) activeBadge.textContent = `${activeShip.planet} Origin • ${activeShip.badge}`;
        if (activeDesc) activeDesc.textContent = activeShip.desc;
        if (activeAvatar && activeShip.image) activeAvatar.src = activeShip.image;
        if (activeBlueprint && activeShip.image) activeBlueprint.src = activeShip.image;

        renderUpgradeCard("engine", activeShip.engine || 1);
        renderUpgradeCard("fuel", activeShip.fuel || 1);
        renderUpgradeCard("shield", activeShip.shield || 1);
        renderUpgradeCard("scanner", activeShip.scanner || 1);
    }

    // ------------------------------------
    // TAB 4: SPACE ATLAS & DISCOVERIES
    // ------------------------------------
    const atlasUnlockedCount = p.unlockedPlanets ? p.unlockedPlanets.length : 1;
    const atlasProgressText = document.getElementById("atlas-progress-text");
    if (atlasProgressText) atlasProgressText.textContent = `${atlasUnlockedCount} of 6 Planets Unlocked`;

    const atlasProgressBar = document.getElementById("atlas-progress-bar");
    if (atlasProgressBar) atlasProgressBar.style.width = `${Math.round((atlasUnlockedCount / 6) * 100)}%`;

    // Update Atlas Planet Cards (Moon & Mars status)

    const moonBadge = document.getElementById("atlas-moon-badge");
    const moonDesc = document.getElementById("atlas-moon-desc");
    const moonIcon = document.getElementById("atlas-moon-icon");
    if (moonBadge && moonDesc && moonIcon) {
        if (moonUnlocked) {
            moonBadge.textContent = "Base Active";
            moonBadge.className = "px-2 py-0.2 rounded-full bg-secondary/20 text-secondary text-[10px] font-bold";
            moonDesc.textContent = "Luna Gate Base unlocked • Tap to switch theme";
            moonIcon.textContent = "check_circle";
            moonIcon.className = "material-symbols-outlined text-secondary";
        } else {
            moonBadge.textContent = "Target";
            moonBadge.className = "px-2 py-0.2 rounded-full bg-secondary/20 text-secondary text-[10px] font-bold";
            moonDesc.textContent = "Reach 100% on Launch tab to unlock!";
            moonIcon.textContent = "explore";
        }
    }

    // Luna Defender Minigame Atlas Card & Launch Banner Status
    const lunaScoreBadge = document.getElementById("atlas-luna-score-badge");
    const launchLunaScoreBadge = document.getElementById("launch-luna-score-badge");
    const lunaStatusDesc = document.getElementById("atlas-luna-status-desc");
    const lunaBtn = document.getElementById("atlas-luna-btn");
    const launchShooterBanner = document.getElementById("launch-luna-shooter-banner");

    const bestScore = p.lunaShooterHighScore || 0;
    if (lunaScoreBadge) lunaScoreBadge.textContent = `Best: ${bestScore}`;
    if (launchLunaScoreBadge) launchLunaScoreBadge.textContent = `Best: ${bestScore}`;

    if (moonUnlocked) {
        if (lunaStatusDesc) lunaStatusDesc.textContent = "Luna Defense Active • Tap to play";
        if (lunaBtn) {
            lunaBtn.textContent = "Play";
            lunaBtn.className = "px-3 py-1 rounded-full bg-secondary text-[#050816] font-headline-sm text-[11px] font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all";
        }
        if (launchShooterBanner) launchShooterBanner.classList.remove("hidden");
    } else {
        if (lunaStatusDesc) lunaStatusDesc.textContent = "Reach Moon to unlock arcade";
        if (lunaBtn) {
            lunaBtn.textContent = "Locked";
            lunaBtn.className = "px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-headline-sm text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all";
        }
        if (launchShooterBanner) launchShooterBanner.classList.add("hidden");
    }

    // Mars Rover Rush Minigame Atlas Card & Launch Banner Status
    const marsScoreBadge = document.getElementById("atlas-mars-score-badge");
    const launchMarsScoreBadge = document.getElementById("launch-mars-score-badge");
    const marsStatusDesc = document.getElementById("atlas-mars-status-desc");
    const marsBtn = document.getElementById("atlas-mars-btn");
    const launchMarsBanner = document.getElementById("launch-mars-rover-banner");

    const marsBestScore = p.marsRoverHighScore || 0;
    if (marsScoreBadge) marsScoreBadge.textContent = `Best: ${marsBestScore}`;
    if (launchMarsScoreBadge) launchMarsScoreBadge.textContent = `Best: ${marsBestScore}`;

    if (marsUnlocked) {
        if (marsStatusDesc) marsStatusDesc.textContent = "Rover Rush Active • Tap to drive";
        if (marsBtn) {
            marsBtn.textContent = "Drive";
            marsBtn.className = "px-3 py-1 rounded-full bg-red-500 text-white font-headline-sm text-[11px] font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all";
        }
        if (launchMarsBanner) launchMarsBanner.classList.remove("hidden");
    } else {
        if (marsStatusDesc) marsStatusDesc.textContent = "Reach Mars to unlock canyon runner";
        if (marsBtn) {
            marsBtn.textContent = "Locked";
            marsBtn.className = "px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-headline-sm text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all";
        }
        if (launchMarsBanner) launchMarsBanner.classList.add("hidden");
    }

    // Jovian Vortex Surfer Minigame Atlas Card & Launch Banner Status
    const jupScoreBadge = document.getElementById("atlas-jupiter-score-badge");
    const launchJupScoreBadge = document.getElementById("launch-jupiter-score-badge");
    const jupStatusDesc = document.getElementById("atlas-jupiter-status-desc");
    const jupMinigameBtn = document.getElementById("atlas-jupiter-btn");
    const launchJupBanner = document.getElementById("launch-jupiter-surfer-banner");

    const jupBestScore = p.jupiterSurferHighScore || 0;
    if (jupScoreBadge) jupScoreBadge.textContent = `Best: ${jupBestScore}`;
    if (launchJupScoreBadge) launchJupScoreBadge.textContent = `Best: ${jupBestScore}`;

    if (jupiterUnlocked) {
        if (jupStatusDesc) jupStatusDesc.textContent = "Storm Surfer Active • Tap to ride";
        if (jupMinigameBtn) {
            jupMinigameBtn.textContent = "Surf";
            jupMinigameBtn.className = "px-3 py-1 rounded-full bg-[#ffb95f] text-[#050816] font-headline-sm text-[11px] font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all";
        }
        if (launchJupBanner) launchJupBanner.classList.remove("hidden");
    } else {
        if (jupStatusDesc) jupStatusDesc.textContent = "Reach Jupiter to unlock storm surfer";
        if (jupMinigameBtn) {
            jupMinigameBtn.textContent = "Locked";
            jupMinigameBtn.className = "px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-headline-sm text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all";
        }
        if (launchJupBanner) launchJupBanner.classList.add("hidden");
    }

    // Saturn Ringrunner Minigame Atlas Card & Launch Banner Status
    const satScoreBadge = document.getElementById("atlas-saturn-score-badge");
    const launchSatScoreBadge = document.getElementById("launch-saturn-score-badge");
    const satStatusDesc = document.getElementById("atlas-saturn-status-desc");
    const satMinigameBtn = document.getElementById("atlas-saturn-btn");
    const launchSatBanner = document.getElementById("launch-saturn-runner-banner");

    const satBestScore = p.saturnRingHighScore || 0;
    if (satScoreBadge) satScoreBadge.textContent = `Best: ${satBestScore}`;
    if (launchSatScoreBadge) launchSatScoreBadge.textContent = `Best: ${satBestScore}`;

    if (saturnUnlocked) {
        if (satStatusDesc) satStatusDesc.textContent = "Ring Slalom Active • Tap to fly";
        if (satMinigameBtn) {
            satMinigameBtn.textContent = "Fly";
            satMinigameBtn.className = "px-3 py-1 rounded-full bg-[#34d399] text-[#050816] font-headline-sm text-[11px] font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all";
        }
        if (launchSatBanner) launchSatBanner.classList.remove("hidden");
    } else {
        if (satStatusDesc) satStatusDesc.textContent = "Reach Saturn to unlock ring slalom";
        if (satMinigameBtn) {
            satMinigameBtn.textContent = "Locked";
            satMinigameBtn.className = "px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-headline-sm text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all";
        }
        if (launchSatBanner) launchSatBanner.classList.add("hidden");
    }

    // Neptune Void Pulse Minigame Atlas Card & Launch Banner Status
    const nepScoreBadge = document.getElementById("atlas-neptune-score-badge");
    const launchNepScoreBadge = document.getElementById("launch-neptune-score-badge");
    const nepStatusDesc = document.getElementById("atlas-neptune-status-desc");
    const nepMinigameBtn = document.getElementById("atlas-neptune-btn");
    const launchNepBanner = document.getElementById("launch-neptune-pulse-banner");

    const nepBestScore = p.neptuneVoidHighScore || 0;
    if (nepScoreBadge) nepScoreBadge.textContent = `Best: ${nepBestScore}`;
    if (launchNepScoreBadge) launchNepScoreBadge.textContent = `Best: ${nepBestScore}`;

    if (neptuneUnlocked) {
        if (nepStatusDesc) nepStatusDesc.textContent = "Void Phase Active • Tap to phase";
        if (nepMinigameBtn) {
            nepMinigameBtn.textContent = "Phase";
            nepMinigameBtn.className = "px-3 py-1 rounded-full bg-[#38bdf8] text-[#050816] font-headline-sm text-[11px] font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all";
        }
        if (launchNepBanner) launchNepBanner.classList.remove("hidden");
    } else {
        if (nepStatusDesc) nepStatusDesc.textContent = "Reach Neptune to unlock phase runner";
        if (nepMinigameBtn) {
            nepMinigameBtn.textContent = "Locked";
            nepMinigameBtn.className = "px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-headline-sm text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all";
        }
        if (launchNepBanner) launchNepBanner.classList.add("hidden");
    }

    const marsCard = document.getElementById("atlas-mars-card");
    const marsBadge = document.getElementById("atlas-mars-badge");
    const marsDesc = document.getElementById("atlas-mars-desc");
    const marsIcon = document.getElementById("atlas-mars-icon");
    if (marsBadge && marsDesc && marsIcon) {
        if (marsUnlocked) {
            marsBadge.textContent = "Colonized";
            marsBadge.className = "px-2 py-0.2 rounded-full bg-red-500/20 text-[#ff5555] text-[10px] font-bold";
            marsDesc.textContent = "Olympus Mons Outpost active • Tap to switch theme";
            marsIcon.textContent = "check_circle";
            marsIcon.className = "material-symbols-outlined text-[#ff5555]";
            if (marsCard) marsCard.classList.remove("opacity-75");
        } else if (ch === 2) {
            marsBadge.textContent = `Expedition (${p.journey.progress || 0}%)`;
            marsBadge.className = "px-2 py-0.2 rounded-full bg-primary-container/20 text-primary-container text-[10px] font-bold";
            const kmLeft = Math.max(0, Math.round((1 - (p.journey.progress || 0) / 100) * 54.6));
            marsDesc.textContent = `In transit to Mars • ~${kmLeft}M KM left • Tap to launch`;
            marsIcon.textContent = "rocket_launch";
            marsIcon.className = "material-symbols-outlined text-primary-container";
            if (marsCard) marsCard.classList.remove("opacity-75");
        } else {
            marsBadge.textContent = "Locked";
            marsBadge.className = "px-2 py-0.2 rounded-full bg-surface-container-highest text-[10px] font-bold";
            marsDesc.textContent = "Chapter II Expedition • Reach Moon first";
            marsIcon.textContent = "lock";
            marsIcon.className = "material-symbols-outlined text-on-surface-variant";
            if (marsCard) marsCard.classList.add("opacity-75");
        }
    }

    // Jupiter Status
    const jupCard = document.getElementById("atlas-jupiter-card");
    const jupBadge = document.getElementById("atlas-jupiter-badge");
    const jupDesc = document.getElementById("atlas-jupiter-desc");
    const jupIcon = document.getElementById("atlas-jupiter-icon");
    if (jupBadge && jupDesc && jupIcon) {
        if (jupiterUnlocked) {
            jupBadge.textContent = "Station Active";
            jupBadge.className = "px-2 py-0.2 rounded-full bg-[#ffb95f]/20 text-[#ffb95f] text-[10px] font-bold";
            jupDesc.textContent = "Great Jovian Harbor • Titan Dreadnought unlocked";
            jupIcon.textContent = "check_circle";
            jupIcon.className = "material-symbols-outlined text-[#ffb95f]";
            if (jupCard) jupCard.classList.remove("opacity-75");
        } else if (ch === 3) {
            jupBadge.textContent = `Expedition (${p.journey.progress || 0}%)`;
            jupBadge.className = "px-2 py-0.2 rounded-full bg-[#ffb95f]/20 text-[#ffb95f] text-[10px] font-bold";
            const kmLeft = Math.max(0, Math.round((1 - (p.journey.progress || 0) / 100) * 588));
            jupDesc.textContent = `In transit to Jupiter • ~${kmLeft}M KM left • Tap to launch`;
            jupIcon.textContent = "rocket_launch";
            jupIcon.className = "material-symbols-outlined text-[#ffb95f]";
            if (jupCard) jupCard.classList.remove("opacity-75");
        } else {
            jupBadge.textContent = "Locked";
            jupBadge.className = "px-2 py-0.2 rounded-full bg-surface-container-highest text-[10px] font-bold";
            jupDesc.textContent = "Chapter III • Colonize Mars first to unlock";
            jupIcon.textContent = "lock";
            jupIcon.className = "material-symbols-outlined text-on-surface-variant";
            if (jupCard) jupCard.classList.add("opacity-75");
        }
    }

    // Saturn Status
    const satCard = document.getElementById("atlas-saturn-card");
    const satBadge = document.getElementById("atlas-saturn-badge");
    const satDesc = document.getElementById("atlas-saturn-desc");
    const satIcon = document.getElementById("atlas-saturn-icon");
    if (satBadge && satDesc && satIcon) {
        if (saturnUnlocked) {
            satBadge.textContent = "Ring Colony";
            satBadge.className = "px-2 py-0.2 rounded-full bg-[#34d399]/20 text-[#34d399] text-[10px] font-bold";
            satDesc.textContent = "Cassini Ring Gate • Chronos Ringrunner unlocked";
            satIcon.textContent = "check_circle";
            satIcon.className = "material-symbols-outlined text-[#34d399]";
            if (satCard) satCard.classList.remove("opacity-75");
        } else if (ch === 4) {
            satBadge.textContent = `Expedition (${p.journey.progress || 0}%)`;
            satBadge.className = "px-2 py-0.2 rounded-full bg-[#34d399]/20 text-[#34d399] text-[10px] font-bold";
            const kmLeft = Math.max(0, Math.round((1 - (p.journey.progress || 0) / 100) * 650));
            satDesc.textContent = `In transit to Saturn • ~${kmLeft}M KM left • Tap to launch`;
            satIcon.textContent = "rocket_launch";
            satIcon.className = "material-symbols-outlined text-[#34d399]";
            if (satCard) satCard.classList.remove("opacity-75");
        } else {
            satBadge.textContent = "Locked";
            satBadge.className = "px-2 py-0.2 rounded-full bg-surface-container-highest text-[10px] font-bold";
            satDesc.textContent = "Chapter IV • Reach Jupiter first to unlock";
            satIcon.textContent = "lock";
            satIcon.className = "material-symbols-outlined text-on-surface-variant";
            if (satCard) satCard.classList.add("opacity-75");
        }
    }

    // Neptune Status
    const nepCard = document.getElementById("atlas-neptune-card");
    const nepBadge = document.getElementById("atlas-neptune-badge");
    const nepDesc = document.getElementById("atlas-neptune-desc");
    const nepIcon = document.getElementById("atlas-neptune-icon");
    if (nepBadge && nepDesc && nepIcon) {
        if (neptuneUnlocked) {
            nepBadge.textContent = "Deep Citadel";
            nepBadge.className = "px-2 py-0.2 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] text-[10px] font-bold";
            nepDesc.textContent = "Deep Void Citadel • Sovereign Flagship active";
            nepIcon.textContent = "check_circle";
            nepIcon.className = "material-symbols-outlined text-[#38bdf8]";
            if (nepCard) nepCard.classList.remove("opacity-75");
        } else if (ch === 5) {
            nepBadge.textContent = `Expedition (${p.journey.progress || 0}%)`;
            nepBadge.className = "px-2 py-0.2 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] text-[10px] font-bold";
            const kmLeft = Math.max(0, Math.round((1 - (p.journey.progress || 0) / 100) * 1500));
            nepDesc.textContent = `Final transit to Neptune • ~${kmLeft}M KM left • Tap to launch`;
            nepIcon.textContent = "rocket_launch";
            nepIcon.className = "material-symbols-outlined text-[#38bdf8]";
            if (nepCard) nepCard.classList.remove("opacity-75");
        } else {
            nepBadge.textContent = "Locked";
            nepBadge.className = "px-2 py-0.2 rounded-full bg-surface-container-highest text-[10px] font-bold";
            nepDesc.textContent = "Chapter V • Final Frontier of Solar System";
            nepIcon.textContent = "lock";
            nepIcon.className = "material-symbols-outlined text-on-surface-variant";
            if (nepCard) nepCard.classList.add("opacity-75");
        }
    }

    // Discoveries grid in Atlas tab - Enshroud uncollected relics!
    const discoveriesGrid = document.getElementById("discoveries-grid");
    if (discoveriesGrid && typeof DISCOVERY_TYPES !== "undefined") {
        const foundMap = new Map();
        (p.discoveries || []).forEach(d => foundMap.set(d.id, d));

        const countText = document.getElementById("discoveries-count-text");
        if (countText) countText.textContent = `${foundMap.size} of ${DISCOVERY_TYPES.length} Collected`;

        discoveriesGrid.innerHTML = DISCOVERY_TYPES.map((item, idx) => {
            const isFound = foundMap.has(item.id);
            if (!isFound) {
                // Enshrouded mystery card - DO NOT leak image, name, or rewards!
                return `
                    <div onclick="showToast('Classified Space Anomaly! Upgrade Scanner and launch missions to locate.', 'info')" class="group relative rounded-xl bg-surface-container/60 p-3 flex flex-col justify-between border border-dashed border-white/10 cursor-pointer hover:border-primary-container/30 transition-all">
                        <div class="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-lowest mb-2 flex items-center justify-center border border-white/5">
                            <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.04),transparent_70%)] pointer-events-none"></div>
                            <div class="flex flex-col items-center gap-1 text-on-surface-variant/40">
                                <span class="material-symbols-outlined text-[28px] animate-pulse">radar</span>
                                <span class="font-hud-label-sm text-[9px] tracking-wider font-semibold">SIGNAL ENCRYPTED</span>
                            </div>
                            <span class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-hud-label-sm text-[8px] uppercase font-bold tracking-wider">
                                UNDISCOVERED
                            </span>
                            <div class="absolute top-1.5 right-1.5">
                                <span class="material-symbols-outlined text-[14px] text-on-surface-variant/50">lock</span>
                            </div>
                        </div>
                        <div>
                            <h4 class="font-headline-sm text-[13px] font-bold text-on-surface-variant truncate">Classified Relic #${idx + 1}</h4>
                            <p class="font-body-sm text-[11px] text-on-surface-variant/70 line-clamp-1">Deep space frequency detected. Launch missions to identify.</p>
                            <div class="flex items-center justify-between pt-1">
                                <span class="font-hud-label-sm text-[10px] text-on-surface-variant/60 font-semibold">??? Credits</span>
                                <span class="font-hud-label-sm text-[10px] text-primary-container font-semibold">Scan</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Discovered item
            return `
                <div onclick="inspectArtifact('${item.id}')" class="group relative rounded-xl bg-surface-container p-3 flex flex-col justify-between border border-white/10 cursor-pointer hover:border-primary-container/40 transition-all shadow-md">
                    <div class="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-lowest mb-2">
                        <img class="w-full h-full object-cover group-hover:scale-105 transition-transform" src="${item.image}" alt="${item.name}">
                        <span class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full ${item.badgeClass} font-hud-label-sm text-[9px] uppercase font-bold">
                            ${item.rarity}
                        </span>
                    </div>
                    <div>
                        <h4 class="font-headline-sm text-[13px] font-bold text-on-surface truncate">${item.name}</h4>
                        <p class="font-body-sm text-[11px] text-on-surface-variant line-clamp-1">${item.lore}</p>
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

function showArrivalModal(planetName, stationName, shipName) {
    const modal = document.getElementById("arrivalCelebrationModal");
    if (!modal) return;

    const title = document.getElementById("arrivalModalTitle");
    const msg = document.getElementById("arrivalModalMsg");

    if (title) title.textContent = `${planetName.toUpperCase()} COLONIZED!`;

    const shipText = shipName ? ` You have also been awarded the new flagship: ${shipName}—head to the Hangar in the Rocket tab to view and upgrade your new vessel!` : "";

    if (planetName === "Mars") {
        if (msg) msg.textContent = `Incredible milestone, Commander! You completed Chapter 2 and safely touched down at ${stationName || 'Olympus Mons Outpost'}! Mars is unlocked, crimson theme active, +300 bonus credits awarded!${shipText}`;
    } else if (planetName === "Jupiter") {
        if (msg) msg.textContent = `Astonishing achievement! You crossed the Asteroid Belt and arrived at Jupiter's ${stationName || 'Great Jovian Harbor'}! Jupiter theme active, +500 bonus credits awarded!${shipText}`;
    } else if (planetName === "Saturn") {
        if (msg) msg.textContent = `Majestic victory! You navigated the ice rings of Saturn and established the ${stationName || 'Cassini Ring Gate'}! Saturn theme active, +750 bonus credits awarded!${shipText}`;
    } else if (planetName === "Neptune") {
        if (msg) msg.textContent = `Solar System Conquered! You reached the edge of deep space at Neptune's ${stationName || 'Deep Void Citadel'}! Deep Azure theme active, +1,000 bonus credits awarded!${shipText}`;
    } else {
        if (msg) msg.textContent = `Congratulations! You saved money and traveled all the way from Earth to the Moon! ${stationName || 'Luna Gate Base'} is unlocked, Moon theme active, +150 bonus credits added, and the Luna Defender Space Shooter simulator is ready!${shipText}`;
    }

    triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2);
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeArrivalModal() {
    if (typeof playSound === "function") playSound("click");
    const modal = document.getElementById("arrivalCelebrationModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
    if (typeof renderHUD === "function") {
        renderHUD();
    }
}

function handleAtlasPlanetClick(planetKey) {
    playSound("click");
    if (!window.player) return;
    const p = window.player;
    const key = planetKey.toLowerCase();
    const unlocked = (p.unlockedPlanets || []).map(x => x.toLowerCase());

    if (unlocked.includes(key)) {
        applyPlanetTheme(key);
        showToast(`View set to ${planetKey} Theme`, "info");
    } else {
        showToast(`Locked! Travel further in your journey to unlock ${planetKey}.`, "error");
    }
}

function handleAtlasMarsClick() {
    playSound("click");
    if (!window.player) return;
    const p = window.player;
    if (p.unlockedPlanets && p.unlockedPlanets.includes("Mars")) {
        applyPlanetTheme("mars");
        showToast("View set to Mars (Crimson Theme)", "info");
    } else if (p.journey && p.journey.chapter === 2) {
        showToast("Chapter 2 Expedition in progress to Mars!", "info");
        switchTab("launch");
    } else if (p.unlockedPlanets && p.unlockedPlanets.includes("Moon")) {
        startMarsExpedition();
        switchTab("launch");
    } else {
        showToast("Locked! Complete Chapter 1 (Earth to Moon) first to unlock Mars Expedition.", "error");
    }
}

function handleAtlasJupiterClick() {
    playSound("click");
    if (!window.player) return;
    const p = window.player;
    if (p.unlockedPlanets && p.unlockedPlanets.includes("Jupiter")) {
        applyPlanetTheme("jupiter");
        showToast("View set to Jupiter (Golden Amber Theme)", "info");
    } else if (p.journey && p.journey.chapter === 3) {
        showToast("Chapter 3 Expedition in progress to Jupiter!", "info");
        switchTab("launch");
    } else if (p.unlockedPlanets && p.unlockedPlanets.includes("Mars")) {
        startJupiterExpedition();
        switchTab("launch");
    } else {
        showToast("Locked! Colonize Mars first to unlock Chapter 3: Jupiter Voyage.", "error");
    }
}

function handleAtlasSaturnClick() {
    playSound("click");
    if (!window.player) return;
    const p = window.player;
    if (p.unlockedPlanets && p.unlockedPlanets.includes("Saturn")) {
        applyPlanetTheme("saturn");
        showToast("View set to Saturn (Emerald Ring Theme)", "info");
    } else if (p.journey && p.journey.chapter === 4) {
        showToast("Chapter 4 Expedition in progress to Saturn!", "info");
        switchTab("launch");
    } else if (p.unlockedPlanets && p.unlockedPlanets.includes("Jupiter")) {
        startSaturnExpedition();
        switchTab("launch");
    } else {
        showToast("Locked! Reach Jupiter first to unlock Chapter 4: Saturn Expedition.", "error");
    }
}

function handleAtlasNeptuneClick() {
    playSound("click");
    if (!window.player) return;
    const p = window.player;
    if (p.unlockedPlanets && p.unlockedPlanets.includes("Neptune")) {
        applyPlanetTheme("neptune");
        showToast("View set to Neptune (Deep Void Azure Theme)", "info");
    } else if (p.journey && p.journey.chapter === 5) {
        showToast("Chapter 5 Final Frontier in progress to Neptune!", "info");
        switchTab("launch");
    } else if (p.unlockedPlanets && p.unlockedPlanets.includes("Saturn")) {
        startNeptuneExpedition();
        switchTab("launch");
    } else {
        showToast("Locked! Reach Saturn first to unlock Chapter 5: Neptune Expedition.", "error");
    }
}

function devToggleMoonUnlock() {
    if (!window.player) return;
    const p = window.player;
    if (!p.unlockedPlanets) p.unlockedPlanets = ["Earth"];
    const idx = p.unlockedPlanets.indexOf("Moon");
    if (idx >= 0) {
        p.unlockedPlanets.splice(idx, 1);
        showToast("Dev: Moon LOCKED.", "info");
    } else {
        p.unlockedPlanets.push("Moon");
        if (p.spaceships && p.spaceships.artemis) p.spaceships.artemis.unlocked = true;
        showToast("Dev: Moon UNLOCKED! Luna Defender arcade ready.", "success");
    }
    savePlayer(p);
    renderHUD();
}

function devToggleMarsUnlock() {
    if (!window.player) return;
    const p = window.player;
    if (!p.unlockedPlanets) p.unlockedPlanets = ["Earth"];
    const idx = p.unlockedPlanets.indexOf("Mars");
    if (idx >= 0) {
        p.unlockedPlanets.splice(idx, 1);
        showToast("Dev: Mars LOCKED.", "info");
    } else {
        p.unlockedPlanets.push("Mars");
        if (p.spaceships && p.spaceships.ares) p.spaceships.ares.unlocked = true;
        showToast("Dev: Mars UNLOCKED! Mars Rover Rush ready.", "success");
    }
    savePlayer(p);
    renderHUD();
}

function devToggleJupiterUnlock() {
    if (!window.player) return;
    const p = window.player;
    if (!p.unlockedPlanets) p.unlockedPlanets = ["Earth"];
    const idx = p.unlockedPlanets.indexOf("Jupiter");
    if (idx >= 0) {
        p.unlockedPlanets.splice(idx, 1);
        showToast("Dev: Jupiter LOCKED.", "info");
    } else {
        p.unlockedPlanets.push("Jupiter");
        if (p.spaceships && p.spaceships.jovian) p.spaceships.jovian.unlocked = true;
        showToast("Dev: Jupiter UNLOCKED! Jovian Vortex Surfer ready.", "success");
    }
    savePlayer(p);
    renderHUD();
}

function devToggleSaturnUnlock() {
    if (!window.player) return;
    const p = window.player;
    if (!p.unlockedPlanets) p.unlockedPlanets = ["Earth"];
    const idx = p.unlockedPlanets.indexOf("Saturn");
    if (idx >= 0) {
        p.unlockedPlanets.splice(idx, 1);
        showToast("Dev: Saturn LOCKED.", "info");
    } else {
        p.unlockedPlanets.push("Saturn");
        if (p.spaceships && p.spaceships.chronos) p.spaceships.chronos.unlocked = true;
        showToast("Dev: Saturn UNLOCKED! Saturn Ringrunner ready.", "success");
    }
    savePlayer(p);
    renderHUD();
}

function devToggleNeptuneUnlock() {
    if (!window.player) return;
    const p = window.player;
    if (!p.unlockedPlanets) p.unlockedPlanets = ["Earth"];
    const idx = p.unlockedPlanets.indexOf("Neptune");
    if (idx >= 0) {
        p.unlockedPlanets.splice(idx, 1);
        showToast("Dev: Neptune LOCKED.", "info");
    } else {
        p.unlockedPlanets.push("Neptune");
        if (p.spaceships && p.spaceships.sovereign) p.spaceships.sovereign.unlocked = true;
        showToast("Dev: Neptune UNLOCKED! Neptune Void Pulse ready.", "success");
    }
    savePlayer(p);
    renderHUD();
}

function selectActiveSpaceship(shipId) {
    if (!window.player || !window.player.spaceships || !window.player.spaceships[shipId]) return;
    const targetShip = window.player.spaceships[shipId];
    if (!targetShip.unlocked) {
        showToast(`Reach ${targetShip.planet} to unlock the ${targetShip.name}!`, "warning");
        if (typeof playSound === "function") playSound("buzzer");
        return;
    }
    window.player.activeShipId = shipId;
    if (typeof syncPlayerRocketFromActiveShip === "function") {
        syncPlayerRocketFromActiveShip(window.player);
    }
    if (typeof savePlayer === "function") {
        savePlayer(window.player);
    }
    renderHUD();
    showToast(`Active flagship switched to ${targetShip.name}!`, "success");
    if (typeof playSound === "function") playSound("upgrade");
}

function devToggleLaunchLimit() {
    if (!window.player) return;
    window.player.dailyLaunchLimitDisabled = !window.player.dailyLaunchLimitDisabled;
    savePlayer(window.player);

    const toggleText = document.getElementById("dev-launch-limit-toggle-text");
    if (toggleText) {
        toggleText.textContent = window.player.dailyLaunchLimitDisabled
            ? "Dev: Enable 5-Launch Limit (Currently Disabled)"
            : "Dev: Disable 5-Launch Limit (Currently Enabled)";
    }

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof triggerParticleBurst === "function") triggerParticleBurst();
    if (typeof renderHUD === "function") renderHUD();
    if (typeof showToast === "function") {
        showToast(window.player.dailyLaunchLimitDisabled
            ? "⚡ Dev: 5-Launch daily limit DISABLED! Unlimited launches active."
            : "⚡ Dev: 5-Launch daily limit ENABLED!", "info");
    }
}

function devResetLaunchCount() {
    if (!window.player) return;
    if (!window.player.dailyLimits) {
        window.player.dailyLimits = {
            date: new Date().toISOString().split("T")[0],
            savedToday: 0,
            depositsCountToday: 0,
            launchesCountToday: 0
        };
    }
    window.player.dailyLimits.launchesCountToday = 0;
    savePlayer(window.player);

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof renderHUD === "function") renderHUD();
    if (typeof showToast === "function") {
        showToast("⚡ Dev: Daily launch count reset to 0/5!", "success");
    }
}

function devUnlockAllPlanetsAndShips() {
    if (!window.player) return;
    const p = window.player;
    p.unlockedPlanets = ["Earth", "Moon", "Mars", "Jupiter", "Saturn", "Neptune"];
    if (!p.spaceships) p.spaceships = structuredClone(DEFAULT_SPACESHIPS);
    Object.values(p.spaceships).forEach(ship => { ship.unlocked = true; });
    p.credits += 2000;
    p.fuelReady += 200;
    p.activeShipId = "sovereign";
    if (typeof syncPlayerRocketFromActiveShip === "function") {
        syncPlayerRocketFromActiveShip(p);
    }
    savePlayer(p);

    if (typeof playSound === "function") playSound("upgrade");
    if (typeof triggerParticleBurst === "function") triggerParticleBurst();
    if (typeof renderHUD === "function") renderHUD();
    if (typeof showToast === "function") {
        showToast("🚀 Dev: All 6 Planets & Spaceships Unlocked! Sovereign Flagship Active.", "success");
    }
}

function confirmResetPlayer() {
    if (confirm("Reset all Orbit savings and progress to start fresh?")) {
        resetPlayer();
        showToast("Game data reset. Ready for a new journey!", "info");
    }
}

function devResetDailyLimits() {
    if (!window.player) return;
    window.player.dailyLimits = {
        date: new Date().toISOString().split("T")[0],
        savedToday: 0,
        depositsCountToday: 0,
        launchesCountToday: 0
    };
    if (window.player.missions) {
        window.player.missions.dailySave = false;
        window.player.missions.saveTwice = false;
        window.player.missions.depositsToday = 0;
    }
    if (typeof savePlayer === "function") savePlayer(window.player);
    if (typeof playSound === "function") playSound("upgrade");
    if (typeof renderHUD === "function") renderHUD();
    if (typeof showToast === "function") {
        showToast("⚡ Dev: Daily limits reset (₹0 saved, 10 saves left, 5 launches ready)!", "success");
    }
}

// Explicit window bindings
window.closeArrivalModal = closeArrivalModal;
window.showArrivalModal = showArrivalModal;
window.selectActiveSpaceship = selectActiveSpaceship;
window.devResetDailyLimits = devResetDailyLimits;
window.devToggleMoonUnlock = devToggleMoonUnlock;
window.devToggleMarsUnlock = devToggleMarsUnlock;
window.devToggleJupiterUnlock = devToggleJupiterUnlock;
window.devToggleSaturnUnlock = devToggleSaturnUnlock;
window.devToggleNeptuneUnlock = devToggleNeptuneUnlock;
window.devToggleLaunchLimit = devToggleLaunchLimit;
window.devResetLaunchCount = devResetLaunchCount;
window.devUnlockAllPlanetsAndShips = devUnlockAllPlanetsAndShips;
window.confirmResetPlayer = confirmResetPlayer;

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
