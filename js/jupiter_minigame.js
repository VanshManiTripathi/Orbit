// ORBIT // Jovian Vortex Surfer: Great Red Spot Gravity Surfer Minigame
// Gated exclusively behind Jupiter arrival. Features circular orbital surfing,
// lightning arc evasion, shield pulse mechanics, persistent High Score tracking,
// and resets to base difficulty upon destruction.

(function () {
    const CANVAS_WIDTH = 400;
    const CANVAS_HEIGHT = 560;

    let canvas, ctx;
    let animFrameId = null;
    let lastTime = 0;
    let lightningSpawnTimer = 0;
    let plasmaSpawnTimer = 0;

    const CENTER_X = CANVAS_WIDTH / 2;
    const CENTER_Y = CANVAS_HEIGHT / 2 + 10;

    // 3 Orbital radii
    const TRACK_RADII = [70, 120, 170];

    // Base difficulty parameters
    const BASE_ORBIT_SPEED = 0.028; // radians per frame
    const BASE_LIGHTNING_INTERVAL = 1750; // ms

    const gameState = {
        active: false,
        paused: false,
        gameOver: false,
        score: 0,
        highScore: 0,
        threatLevel: 1,
        lives: 3,
        maxLives: 3,
        currentTrack: 1, // 0 = Inner, 1 = Mid, 2 = Outer
        targetTrack: 1,
        currentRadius: TRACK_RADII[1],
        angle: 0,
        orbitSpeed: BASE_ORBIT_SPEED,
        shieldPulseActive: false,
        shieldPulseTimer: 0,
        shieldEnergy: 100,
        vortexRotation: 0,
        hazards: [], // Lightning strikes & ionized storm clouds
        plasmaOrbs: [],
        particles: [],
        floatingTexts: [],
        vortexRays: []
    };

    // -------------------------------------------------------------
    // Audio Synthesizer Integration
    // -------------------------------------------------------------
    function playJupiterSound(type) {
        if (!window.player || window.player.soundEnabled === false) return;
        try {
            if (typeof initAudio === "function") initAudio();
            const audioCtx = window.audioCtx || (typeof getAudioCtx === "function" ? getAudioCtx() : null);
            const actx = audioCtx || (window.AudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null);
            if (!actx) return;
            if (actx.state === "suspended") actx.resume();

            const now = actx.currentTime;

            if (type === "shift") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(580, now + 0.14);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.14);
            } else if (type === "plasma") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(650, now);
                osc.frequency.setValueAtTime(980, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            } else if (type === "shield") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === "lightning") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            } else if (type === "gameover") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.6);
            }
        } catch (e) {
            // Audio context fallback
        }
    }

    // -------------------------------------------------------------
    // Gating Check
    // -------------------------------------------------------------
    function isJupiterUnlocked() {
        if (!window.player) return false;
        const list = window.player.unlockedPlanets || [];
        return list.includes("Jupiter") || (window.player.journey && (window.player.journey.chapter || 1) >= 3);
    }

    // -------------------------------------------------------------
    // Background Vortex Setup
    // -------------------------------------------------------------
    function initVortexEnvironment() {
        gameState.vortexRays = [];
        for (let i = 0; i < 24; i++) {
            gameState.vortexRays.push({
                angle: (i / 24) * Math.PI * 2,
                length: 60 + Math.random() * 120,
                color: Math.random() > 0.5 ? "rgba(255, 185, 95, 0.25)" : "rgba(234, 88, 12, 0.2)",
                speed: 0.015 + Math.random() * 0.01
            });
        }
    }

    // -------------------------------------------------------------
    // Difficulty & Reset Logic
    // -------------------------------------------------------------
    function updateDifficulty() {
        // Increases every 100 points
        const newLevel = Math.min(10, Math.floor(gameState.score / 100) + 1);
        if (newLevel > gameState.threatLevel) {
            gameState.threatLevel = newLevel;
            addFloatingText("STORM SURGE!", CENTER_X, CENTER_Y - 40, "#ffb95f");
            playJupiterSound("shift");
        }
        gameState.orbitSpeed = BASE_ORBIT_SPEED + (gameState.threatLevel - 1) * 0.004;

        const levelBadge = document.getElementById("jupiterSurferLevel");
        if (levelBadge) {
            levelBadge.textContent = `STORM TIER ${gameState.threatLevel}`;
        }
    }

    function resetJupiterToBaseDifficulty() {
        gameState.score = 0;
        gameState.threatLevel = 1;
        gameState.lives = gameState.maxLives;
        gameState.orbitSpeed = BASE_ORBIT_SPEED;
        gameState.currentTrack = 1;
        gameState.targetTrack = 1;
        gameState.currentRadius = TRACK_RADII[1];
        gameState.angle = 0;
        gameState.shieldPulseActive = false;
        gameState.shieldPulseTimer = 0;
        gameState.shieldEnergy = 100;
        gameState.gameOver = false;
        gameState.paused = false;

        gameState.hazards = [];
        gameState.plasmaOrbs = [];
        gameState.particles = [];
        gameState.floatingTexts = [];
        lightningSpawnTimer = 0;
        plasmaSpawnTimer = 0;

        initVortexEnvironment();
        updateUI();

        const goModal = document.getElementById("jupiterSurferGameOver");
        if (goModal) goModal.classList.add("hidden");

        const pauseBtn = document.getElementById("jupiterSurferPauseBtn");
        if (pauseBtn) pauseBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">pause</span>`;

        console.log("Jovian Vortex Surfer: Reset to Base Difficulty (Tier 1, 3 Shields, 0 Score).");
    }

    // -------------------------------------------------------------
    // Spawners: Lightning Hazards & Plasma Orbs
    // -------------------------------------------------------------
    function spawnLightningHazard() {
        // Random track for lightning strike
        const track = Math.floor(Math.random() * 3);
        const arcStartAngle = Math.random() * Math.PI * 2;
        const arcLength = (Math.PI / 3) + Math.random() * (Math.PI / 4);

        gameState.hazards.push({
            track,
            radius: TRACK_RADII[track],
            startAngle: arcStartAngle,
            endAngle: arcStartAngle + arcLength,
            state: "warning", // 'warning' -> 'striking' -> expired
            timer: 0,
            warningDuration: Math.max(550, 1100 - (gameState.threatLevel - 1) * 60),
            strikeDuration: 450
        });
    }

    function spawnPlasmaOrb() {
        const track = Math.floor(Math.random() * 3);
        const angle = Math.random() * Math.PI * 2;
        const isRepair = Math.random() < 0.12 && gameState.lives < gameState.maxLives;

        gameState.plasmaOrbs.push({
            track,
            radius: TRACK_RADII[track],
            angle,
            size: isRepair ? 14 : 10,
            type: isRepair ? "repair" : "plasma",
            color: isRepair ? "#34d399" : "#ffb95f"
        });
    }

    // -------------------------------------------------------------
    // Controls: Shift Orbits & Shield Pulse
    // -------------------------------------------------------------
    function shiftOrbit(direction) {
        if (!gameState.active || gameState.gameOver || gameState.paused) return;

        if (direction === "in") {
            gameState.targetTrack = Math.max(0, gameState.targetTrack - 1);
        } else if (direction === "out") {
            gameState.targetTrack = Math.min(2, gameState.targetTrack + 1);
        } else if (direction === "toggle") {
            // Cycle 0 -> 1 -> 2 -> 0
            gameState.targetTrack = (gameState.targetTrack + 1) % 3;
        }

        playJupiterSound("shift");
    }

    function triggerShieldPulse() {
        if (!gameState.active || gameState.gameOver || gameState.paused) return;
        if (gameState.shieldPulseActive || gameState.shieldEnergy < 40) return;

        gameState.shieldPulseActive = true;
        gameState.shieldPulseTimer = 1600; // ms
        gameState.shieldEnergy = Math.max(0, gameState.shieldEnergy - 40);
        playJupiterSound("shield");
        addFloatingText("DEFLECTOR PULSE!", CENTER_X, CENTER_Y - 50, "#38bdf8");

        // Forcefield burst particles
        for (let i = 0; i < 20; i++) {
            const a = (i / 20) * Math.PI * 2;
            gameState.particles.push({
                x: CENTER_X + Math.cos(a) * gameState.currentRadius,
                y: CENTER_Y + Math.sin(a) * gameState.currentRadius,
                vx: Math.cos(a) * 3,
                vy: Math.sin(a) * 3,
                color: "#38bdf8",
                size: 3,
                life: 1.0,
                decay: 0.05
            });
        }
    }

    function addFloatingText(text, x, y, color = "#ffb95f") {
        gameState.floatingTexts.push({
            text,
            x,
            y,
            color,
            life: 1.0,
            decay: 0.025
        });
    }

    // -------------------------------------------------------------
    // Game Loop Update
    // -------------------------------------------------------------
    function update(dt) {
        if (!gameState.active || gameState.paused || gameState.gameOver) return;

        // Rotate ship around vortex
        gameState.angle = (gameState.angle + gameState.orbitSpeed) % (Math.PI * 2);
        gameState.vortexRotation = (gameState.vortexRotation + 0.008) % (Math.PI * 2);

        // Smooth radius transition between tracks
        const targetRadius = TRACK_RADII[gameState.targetTrack];
        gameState.currentRadius += (targetRadius - gameState.currentRadius) * 0.15;

        // Shield pulse timer & energy regen
        if (gameState.shieldPulseActive) {
            gameState.shieldPulseTimer -= dt;
            if (gameState.shieldPulseTimer <= 0) {
                gameState.shieldPulseActive = false;
            }
        } else {
            gameState.shieldEnergy = Math.min(100, gameState.shieldEnergy + dt * 0.02);
        }

        // Score tick
        gameState.score += Math.round(dt * 0.04);
        updateDifficulty();

        // Spawn hazards
        lightningSpawnTimer += dt;
        const currentLightningInterval = Math.max(650, BASE_LIGHTNING_INTERVAL - (gameState.threatLevel - 1) * 110);
        if (lightningSpawnTimer >= currentLightningInterval) {
            lightningSpawnTimer = 0;
            spawnLightningHazard();
        }

        // Spawn plasma orbs
        plasmaSpawnTimer += dt;
        if (plasmaSpawnTimer >= 1200) {
            plasmaSpawnTimer = 0;
            spawnPlasmaOrb();
        }

        // Ship coordinates
        const shipX = CENTER_X + Math.cos(gameState.angle) * gameState.currentRadius;
        const shipY = CENTER_Y + Math.sin(gameState.angle) * gameState.currentRadius;

        // Update hazards
        for (let i = gameState.hazards.length - 1; i >= 0; i--) {
            const h = gameState.hazards[i];
            h.timer += dt;

            if (h.state === "warning" && h.timer >= h.warningDuration) {
                h.state = "striking";
                h.timer = 0;
                playJupiterSound("lightning");
            } else if (h.state === "striking") {
                // Check if ship is in hazardous track and angle arc
                if (gameState.targetTrack === h.track) {
                    let normAngle = gameState.angle;
                    while (normAngle < h.startAngle) normAngle += Math.PI * 2;
                    while (normAngle > h.endAngle + Math.PI * 2) normAngle -= Math.PI * 2;

                    const inArc = normAngle >= h.startAngle && normAngle <= h.endAngle;

                    if (inArc) {
                        if (gameState.shieldPulseActive) {
                            // Deflected!
                            addFloatingText("DEFLECTED!", shipX, shipY - 20, "#38bdf8");
                            h.state = "expired";
                        } else {
                            // Hit!
                            gameState.lives--;
                            h.state = "expired";
                            playJupiterSound("lightning");
                            addFloatingText("-1 SHIELD!", shipX, shipY - 20, "#ef4444");

                            // Impact sparks
                            for (let p = 0; p < 18; p++) {
                                gameState.particles.push({
                                    x: shipX,
                                    y: shipY,
                                    vx: (Math.random() - 0.5) * 6,
                                    vy: (Math.random() - 0.5) * 6,
                                    color: Math.random() > 0.5 ? "#38bdf8" : "#ffb95f",
                                    size: Math.random() * 4 + 2,
                                    life: 1.0,
                                    decay: 0.04
                                });
                            }

                            updateUI();

                            if (gameState.lives <= 0) {
                                triggerGameOver();
                                return;
                            }
                        }
                    }
                }

                if (h.timer >= h.strikeDuration) {
                    h.state = "expired";
                }
            }

            if (h.state === "expired") {
                gameState.hazards.splice(i, 1);
            }
        }

        // Update plasma orbs & collection
        for (let i = gameState.plasmaOrbs.length - 1; i >= 0; i--) {
            const orb = gameState.plasmaOrbs[i];
            const orbX = CENTER_X + Math.cos(orb.angle) * orb.radius;
            const orbY = CENTER_Y + Math.sin(orb.angle) * orb.radius;

            const dist = Math.hypot(orbX - shipX, orbY - shipY);
            if (dist < 26) {
                if (orb.type === "repair") {
                    gameState.lives = Math.min(gameState.maxLives, gameState.lives + 1);
                    addFloatingText("+1 SHIELD REPAIRED", shipX, shipY - 25, "#34d399");
                    playJupiterSound("plasma");
                } else {
                    gameState.score += 45;
                    gameState.shieldEnergy = Math.min(100, gameState.shieldEnergy + 15);
                    addFloatingText("+45", orbX, orbY, "#ffb95f");
                    playJupiterSound("plasma");
                }
                gameState.plasmaOrbs.splice(i, 1);
                updateUI();
                continue;
            }
        }

        // Clean up orbs over time (limit to 6 max)
        if (gameState.plasmaOrbs.length > 6) {
            gameState.plasmaOrbs.shift();
        }

        // Update particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const p = gameState.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) gameState.particles.splice(i, 1);
        }

        // Update floating text
        for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
            const ft = gameState.floatingTexts[i];
            ft.y -= 1.2;
            ft.life -= ft.decay;
            if (ft.life <= 0) gameState.floatingTexts.splice(i, 1);
        }

        updateUI();
    }

    // -------------------------------------------------------------
    // Drawing Routine
    // -------------------------------------------------------------
    function draw() {
        if (!ctx) return;

        // Jupiter Space Deep Void Background
        const bgGrad = ctx.createRadialGradient(CENTER_X, CENTER_Y, 20, CENTER_X, CENTER_Y, CANVAS_HEIGHT * 0.75);
        bgGrad.addColorStop(0, "#381503");
        bgGrad.addColorStop(0.5, "#1e0b02");
        bgGrad.addColorStop(1, "#070200");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Great Red Spot Vortex Eye in the center
        ctx.save();
        ctx.translate(CENTER_X, CENTER_Y);
        ctx.rotate(gameState.vortexRotation);

        const eyeGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 48);
        eyeGrad.addColorStop(0, "#dc2626");
        eyeGrad.addColorStop(0.6, "#ea580c");
        eyeGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
        ctx.fillStyle = eyeGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 48, 0, Math.PI * 2);
        ctx.fill();

        // Swirling storm bands
        gameState.vortexRays.forEach(ray => {
            ctx.strokeStyle = ray.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, ray.length * 0.45, ray.angle, ray.angle + Math.PI / 3);
            ctx.stroke();
        });
        ctx.restore();

        // Draw the 3 Orbit Tracks
        TRACK_RADII.forEach((r, idx) => {
            const isCurrent = idx === gameState.targetTrack;
            ctx.strokeStyle = isCurrent ? "rgba(255, 185, 95, 0.55)" : "rgba(255, 255, 255, 0.12)";
            ctx.lineWidth = isCurrent ? 2 : 1;
            ctx.setLineDash(isCurrent ? [6, 4] : [2, 6]);
            ctx.beginPath();
            ctx.arc(CENTER_X, CENTER_Y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Draw Hazards (Lightning Arcs)
        gameState.hazards.forEach(h => {
            ctx.beginPath();
            ctx.arc(CENTER_X, CENTER_Y, h.radius, h.startAngle, h.endAngle);

            if (h.state === "warning") {
                // Flashing amber warning arc
                const pulse = Math.sin(Date.now() / 60) * 0.5 + 0.5;
                ctx.strokeStyle = `rgba(255, 185, 95, ${0.4 + pulse * 0.5})`;
                ctx.lineWidth = 4;
                ctx.stroke();
            } else if (h.state === "striking") {
                // Blinding electric cyan/white lightning arc
                ctx.strokeStyle = "#38bdf8";
                ctx.lineWidth = 7;
                ctx.shadowColor = "#38bdf8";
                ctx.shadowBlur = 18;
                ctx.stroke();

                // Inner core
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });

        // Draw Plasma Orbs
        gameState.plasmaOrbs.forEach(orb => {
            const x = CENTER_X + Math.cos(orb.angle) * orb.radius;
            const y = CENTER_Y + Math.sin(orb.angle) * orb.radius;

            ctx.shadowBlur = 14;
            ctx.shadowColor = orb.color;
            ctx.fillStyle = orb.color;

            if (orb.type === "repair") {
                ctx.fillRect(x - 6, y - 2.5, 12, 5);
                ctx.fillRect(x - 2.5, y - 6, 5, 12);
            } else {
                ctx.beginPath();
                ctx.arc(x, y, orb.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        });

        // Draw Jovian Titan Flagship
        const shipX = CENTER_X + Math.cos(gameState.angle) * gameState.currentRadius;
        const shipY = CENTER_Y + Math.sin(gameState.angle) * gameState.currentRadius;
        const heading = gameState.angle + Math.PI / 2; // tangent to circle

        ctx.save();
        ctx.translate(shipX, shipY);
        ctx.rotate(heading);

        // Shield Pulse Bubble
        if (gameState.shieldPulseActive) {
            ctx.strokeStyle = "#38bdf8";
            ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Ship Hull (Titan Drednought)
        const shipGrad = ctx.createLinearGradient(-12, 0, 12, 0);
        shipGrad.addColorStop(0, "#f59e0b");
        shipGrad.addColorStop(0.5, "#d97706");
        shipGrad.addColorStop(1, "#b45309");
        ctx.fillStyle = shipGrad;

        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(12, 12);
        ctx.lineTo(0, 6);
        ctx.lineTo(-12, 12);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(0, 8, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw Particles
        gameState.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Draw Floating Text
        gameState.floatingTexts.forEach(ft => {
            ctx.fillStyle = ft.color;
            ctx.globalAlpha = ft.life;
            ctx.font = "bold 13px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(ft.text, ft.x, ft.y);
        });
        ctx.globalAlpha = 1.0;
    }

    // -------------------------------------------------------------
    // Loop Driver
    // -------------------------------------------------------------
    function loop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = Math.min(64, timestamp - lastTime);
        lastTime = timestamp;

        update(dt);
        draw();

        if (gameState.active) {
            animFrameId = requestAnimationFrame(loop);
        }
    }

    // -------------------------------------------------------------
    // UI HUD & Game Over Handling
    // -------------------------------------------------------------
    function updateUI() {
        const scoreEl = document.getElementById("jupiterSurferScore");
        const highEl = document.getElementById("jupiterSurferHigh");
        const shieldsEl = document.getElementById("jupiterSurferShields");
        const energyBar = document.getElementById("jupiterShieldEnergyBar");

        if (scoreEl) scoreEl.textContent = gameState.score.toLocaleString();
        if (highEl) highEl.textContent = (window.player ? (window.player.jupiterSurferHighScore || 0) : gameState.highScore).toLocaleString();

        if (shieldsEl) {
            let html = "";
            for (let i = 0; i < gameState.maxLives; i++) {
                if (i < gameState.lives) {
                    html += `<span class="material-symbols-outlined text-[16px] text-amber-400">shield</span>`;
                } else {
                    html += `<span class="material-symbols-outlined text-[16px] text-white/20">shield</span>`;
                }
            }
            shieldsEl.innerHTML = html;
        }

        if (energyBar) {
            energyBar.style.width = `${gameState.shieldEnergy}%`;
        }
    }

    function triggerGameOver() {
        gameState.gameOver = true;
        playJupiterSound("gameover");

        if (window.player) {
            const currentBest = window.player.jupiterSurferHighScore || 0;
            const isNewHigh = gameState.score > currentBest;

            if (isNewHigh) {
                window.player.jupiterSurferHighScore = gameState.score;
                if (typeof savePlayer === "function") savePlayer(window.player);
            }

            const recordBadge = document.getElementById("jupiterSurferRecordBadge");
            if (recordBadge) recordBadge.classList.toggle("hidden", !isNewHigh);

            const finalScoreEl = document.getElementById("jupiterSurferFinalScore");
            const bestScoreEl = document.getElementById("jupiterSurferBestScore");
            const waveReachedEl = document.getElementById("jupiterSurferWaveReached");

            if (finalScoreEl) finalScoreEl.textContent = gameState.score.toLocaleString();
            if (bestScoreEl) bestScoreEl.textContent = (window.player.jupiterSurferHighScore || gameState.score).toLocaleString();
            if (waveReachedEl) waveReachedEl.textContent = `Storm Tier ${gameState.threatLevel}`;
        }

        const goModal = document.getElementById("jupiterSurferGameOver");
        if (goModal) {
            goModal.classList.remove("hidden");
            goModal.classList.add("flex");
        }

        if (typeof renderHUD === "function") renderHUD();
    }

    // -------------------------------------------------------------
    // Modal Open / Close & Input Setup
    // -------------------------------------------------------------
    function openJupiterSurfer() {
        if (!isJupiterUnlocked()) {
            if (typeof showToast === "function") {
                showToast("🔒 Locked! Reach Jupiter first to unlock Jovian Vortex Surfer.", "error");
            }
            if (typeof playSound === "function") playSound("error");
            return;
        }

        const modal = document.getElementById("jupiterSurferModal");
        if (!modal) return;
        modal.classList.remove("hidden");
        modal.classList.add("flex");

        if (!canvas) canvas = document.getElementById("jupiterSurferCanvas");
        if (canvas) ctx = canvas.getContext("2d");

        gameState.active = true;
        gameState.highScore = window.player ? (window.player.jupiterSurferHighScore || 0) : 0;
        resetJupiterToBaseDifficulty();

        lastTime = performance.now();
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = requestAnimationFrame(loop);
    }

    function closeJupiterSurfer() {
        gameState.active = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        const modal = document.getElementById("jupiterSurferModal");
        if (modal) {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
        }
        if (typeof renderHUD === "function") renderHUD();
    }

    function togglePauseJupiterSurfer() {
        if (!gameState.active || gameState.gameOver) return;
        gameState.paused = !gameState.paused;
        const btn = document.getElementById("jupiterSurferPauseBtn");
        if (btn) {
            btn.innerHTML = gameState.paused
                ? `<span class="material-symbols-outlined text-[18px]">play_arrow</span>`
                : `<span class="material-symbols-outlined text-[18px]">pause</span>`;
        }
    }

    function setupInputs() {
        window.addEventListener("keydown", (e) => {
            if (!gameState.active) return;
            if (e.code === "ArrowUp" || e.code === "KeyW") {
                shiftOrbit("in");
                e.preventDefault();
            } else if (e.code === "ArrowDown" || e.code === "KeyS") {
                shiftOrbit("out");
                e.preventDefault();
            } else if (e.code === "Space") {
                shiftOrbit("toggle");
                e.preventDefault();
            } else if (e.code === "KeyF") {
                triggerShieldPulse();
                e.preventDefault();
            } else if (e.code === "KeyP") {
                togglePauseJupiterSurfer();
            }
        });

        // Pointer click to toggle track
        if (canvas) {
            canvas.addEventListener("pointerdown", () => {
                shiftOrbit("toggle");
            });
        }
    }

    function setupMobileControls() {
        const btnInner = document.getElementById("btnJupiterInner");
        const btnOuter = document.getElementById("btnJupiterOuter");
        const btnPulse = document.getElementById("btnJupiterPulse");

        if (btnInner) {
            btnInner.addEventListener("click", () => shiftOrbit("in"));
            btnInner.addEventListener("touchstart", (e) => { e.preventDefault(); shiftOrbit("in"); });
        }
        if (btnOuter) {
            btnOuter.addEventListener("click", () => shiftOrbit("out"));
            btnOuter.addEventListener("touchstart", (e) => { e.preventDefault(); shiftOrbit("out"); });
        }
        if (btnPulse) {
            btnPulse.addEventListener("click", () => triggerShieldPulse());
            btnPulse.addEventListener("touchstart", (e) => { e.preventDefault(); triggerShieldPulse(); });
        }
    }

    // Expose API globally
    window.isJupiterUnlocked = isJupiterUnlocked;
    window.openJupiterSurfer = openJupiterSurfer;
    window.closeJupiterSurfer = closeJupiterSurfer;
    window.togglePauseJupiterSurfer = togglePauseJupiterSurfer;
    window.restartJupiterSurfer = resetJupiterToBaseDifficulty;

    document.addEventListener("DOMContentLoaded", () => {
        canvas = document.getElementById("jupiterSurferCanvas");
        setupInputs();
        setupMobileControls();
    });
})();
