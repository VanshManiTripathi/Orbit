// ORBIT // Saturn Ringrunner: Chronos Ice Ring Slalom Minigame
// Gated exclusively behind Saturn arrival. Features ice ring slalom,
// gravitational warp gates for combo scoring, cryo-diamonds, persistent High Score tracking,
// and resets to base difficulty upon destruction.

(function () {
    const CANVAS_WIDTH = 400;
    const CANVAS_HEIGHT = 560;

    let canvas, ctx;
    let animFrameId = null;
    let lastTime = 0;
    let obstacleSpawnTimer = 0;
    let gateSpawnTimer = 0;
    let diamondSpawnTimer = 0;

    // Base difficulty parameters
    const BASE_SPEED = 2.6;
    const BASE_OBSTACLE_INTERVAL = 1600; // ms

    const gameState = {
        active: false,
        paused: false,
        gameOver: false,
        score: 0,
        highScore: 0,
        threatLevel: 1,
        lives: 3,
        maxLives: 3,
        speed: BASE_SPEED,
        distanceTraveled: 0,
        scoreAccumulator: 0,
        comboStreak: 0,
        boostActive: false,
        boostTimer: 0,
        ship: {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 95,
            width: 36,
            height: 46,
            speedX: 5.5,
            speedY: 3.8,
            invulnerableTime: 0
        },
        obstacles: [],
        warpGates: [],
        diamonds: [],
        particles: [],
        floatingTexts: [],
        ringBands: [],
        iceCrystals: [],
        keys: {
            left: false,
            right: false,
            up: false,
            down: false,
            boost: false
        }
    };

    // -------------------------------------------------------------
    // Audio Synthesizer Integration
    // -------------------------------------------------------------
    function playSaturnSound(type) {
        if (!window.player || window.player.soundEnabled === false) return;
        try {
            if (typeof initAudio === "function") initAudio();
            const audioCtx = window.audioCtx || (typeof getAudioCtx === "function" ? getAudioCtx() : null);
            const actx = audioCtx || (window.AudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null);
            if (!actx) return;
            if (actx.state === "suspended") actx.resume();

            const now = actx.currentTime;

            if (type === "gate") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.16);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.16);
            } else if (type === "diamond") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(700, now);
                osc.frequency.setValueAtTime(1100, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === "hit") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(35, now + 0.26);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.26);
            } else if (type === "boost") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(620, now + 0.22);
                gain.gain.setValueAtTime(0.14, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            } else if (type === "gameover") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.exponentialRampToValueAtTime(45, now + 0.6);
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
    function isSaturnUnlocked() {
        if (!window.player) return false;
        const list = window.player.unlockedPlanets || [];
        return list.includes("Saturn") || (window.player.journey && (window.player.journey.chapter || 1) >= 4);
    }

    // -------------------------------------------------------------
    // Background Ice Rings & Sparkles Setup
    // -------------------------------------------------------------
    function initRingEnvironment() {
        gameState.ringBands = [];
        const bandColors = ["#0e222b", "#14323d", "#1a424e", "#0f262f", "#1e4d5b"];
        for (let y = 0; y < CANVAS_HEIGHT + 80; y += 30) {
            gameState.ringBands.push({
                y,
                color: bandColors[Math.floor(Math.random() * bandColors.length)],
                opacity: 0.25 + Math.random() * 0.35,
                height: 25 + Math.random() * 15
            });
        }

        gameState.iceCrystals = [];
        for (let i = 0; i < 45; i++) {
            gameState.iceCrystals.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: Math.random() * 2.2 + 0.8,
                speedX: (Math.random() - 0.5) * 0.8,
                speedY: 1.5 + Math.random() * 2.5,
                alpha: 0.3 + Math.random() * 0.6,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.04
            });
        }
    }

    // -------------------------------------------------------------
    // Difficulty & Reset Logic
    // -------------------------------------------------------------
    function updateDifficulty() {
        const newLevel = Math.min(10, Math.floor(gameState.score / 250) + 1);
        if (newLevel > gameState.threatLevel) {
            gameState.threatLevel = newLevel;
            addFloatingText("CASSINI GAP ACCELERATION!", gameState.ship.x, gameState.ship.y - 35, "#34d399");
            playSaturnSound("boost");
        }
        gameState.speed = BASE_SPEED + (gameState.threatLevel - 1) * 0.22;

        const levelBadge = document.getElementById("saturnRingLevel");
        if (levelBadge) {
            levelBadge.textContent = `RING SECTOR ${gameState.threatLevel}`;
        }
    }

    function resetSaturnToBaseDifficulty() {
        gameState.score = 0;
        gameState.threatLevel = 1;
        gameState.lives = gameState.maxLives;
        gameState.speed = BASE_SPEED;
        gameState.distanceTraveled = 0;
        gameState.scoreAccumulator = 0;
        gameState.comboStreak = 0;
        gameState.boostActive = false;
        gameState.boostTimer = 0;
        gameState.gameOver = false;
        gameState.paused = false;

        gameState.ship.x = CANVAS_WIDTH / 2;
        gameState.ship.y = CANVAS_HEIGHT - 95;
        gameState.ship.invulnerableTime = 0;

        gameState.obstacles = [];
        gameState.warpGates = [];
        gameState.diamonds = [];
        gameState.particles = [];
        gameState.floatingTexts = [];
        obstacleSpawnTimer = 0;
        gateSpawnTimer = 0;
        diamondSpawnTimer = 0;

        initRingEnvironment();
        updateUI();

        const goModal = document.getElementById("saturnRingGameOver");
        if (goModal) goModal.classList.add("hidden");

        const pauseBtn = document.getElementById("saturnRingPauseBtn");
        if (pauseBtn) pauseBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">pause</span>`;

        console.log("Saturn Ringrunner: Reset to Base Difficulty (Sector 1, 3 Shields, 0 Score).");
    }

    // -------------------------------------------------------------
    // Spawners
    // -------------------------------------------------------------
    function spawnObstacle() {
        // Types: 'glacier' (tumbling ice chunk), 'comet' (fast cryo projectile)
        const roll = Math.random();
        const type = roll < 0.7 ? "glacier" : "comet";
        const minX = 40;
        const maxX = CANVAS_WIDTH - 40;
        const x = minX + Math.random() * (maxX - minX);

        if (type === "glacier") {
            const size = 26 + Math.random() * 18;
            gameState.obstacles.push({
                x,
                y: -50,
                width: size,
                height: size,
                type: "glacier",
                speedBonus: (Math.random() - 0.5) * 0.8,
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 0.05,
                color: "#67e8f9"
            });
        } else {
            gameState.obstacles.push({
                x,
                y: -45,
                width: 22,
                height: 38,
                type: "comet",
                speedBonus: 1.8 + Math.random() * 1.2,
                rotation: 0,
                rotSpeed: 0,
                color: "#a7f3d0"
            });
        }
    }

    function spawnWarpGate() {
        const minX = 75;
        const maxX = CANVAS_WIDTH - 75;
        const x = minX + Math.random() * (maxX - minX);

        gameState.warpGates.push({
            x,
            y: -60,
            width: 72,
            height: 28,
            passed: false,
            color: "#34d399",
            pulse: 0
        });
    }

    function spawnDiamond() {
        const minX = 50;
        const maxX = CANVAS_WIDTH - 50;
        const x = minX + Math.random() * (maxX - minX);

        gameState.diamonds.push({
            x,
            y: -30,
            size: 14,
            rotation: 0,
            color: "#6ee7b7"
        });
    }

    function triggerBoost() {
        if (gameState.boostActive || gameState.gameOver || gameState.paused) return;
        gameState.boostActive = true;
        gameState.boostTimer = 1.2; // 1.2 seconds of turbo boost
        playSaturnSound("boost");

        for (let i = 0; i < 16; i++) {
            gameState.particles.push({
                x: gameState.ship.x + (Math.random() - 0.5) * 20,
                y: gameState.ship.y + 22,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 4 + 3,
                color: Math.random() > 0.5 ? "#34d399" : "#38bdf8",
                size: Math.random() * 4 + 2,
                life: 1.0,
                decay: 0.05
            });
        }
    }

    function addFloatingText(text, x, y, color = "#34d399") {
        gameState.floatingTexts.push({
            text,
            x,
            y,
            color,
            life: 1.0,
            decay: 0.024
        });
    }

    // -------------------------------------------------------------
    // Game Loop Update
    // -------------------------------------------------------------
    function update(dt) {
        if (!gameState.active || gameState.paused || gameState.gameOver) return;

        // Ship Steering
        const speedMultiplier = gameState.boostActive ? 1.4 : 1.0;
        if (gameState.keys.left) {
            gameState.ship.x -= gameState.ship.speedX * speedMultiplier;
        }
        if (gameState.keys.right) {
            gameState.ship.x += gameState.ship.speedX * speedMultiplier;
        }
        if (gameState.keys.up) {
            gameState.ship.y -= gameState.ship.speedY * speedMultiplier;
        }
        if (gameState.keys.down) {
            gameState.ship.y += gameState.ship.speedY * speedMultiplier;
        }

        // Clamp ship inside canvas
        const padX = 28;
        gameState.ship.x = Math.max(padX, Math.min(CANVAS_WIDTH - padX, gameState.ship.x));
        gameState.ship.y = Math.max(140, Math.min(CANVAS_HEIGHT - 45, gameState.ship.y));

        // Boost timer
        if (gameState.boostActive) {
            gameState.boostTimer -= dt / 1000;
            if (gameState.boostTimer <= 0) {
                gameState.boostActive = false;
            }
        }

        // Invulnerability
        if (gameState.ship.invulnerableTime > 0) {
            gameState.ship.invulnerableTime -= dt;
        }

        // Current effective forward speed
        const effectiveSpeed = gameState.speed * (gameState.boostActive ? 1.6 : 1.0);

        // Distance & smooth score accumulation
        gameState.distanceTraveled += effectiveSpeed * (dt / 1000) * 16;
        gameState.scoreAccumulator += effectiveSpeed * (dt / 1000) * 8.5;
        if (gameState.scoreAccumulator >= 1) {
            const added = Math.floor(gameState.scoreAccumulator);
            gameState.score += added;
            gameState.scoreAccumulator -= added;
            updateDifficulty();
        }

        // Update Ring Bands parallax
        gameState.ringBands.forEach(b => {
            b.y += effectiveSpeed * 0.85;
            if (b.y > CANVAS_HEIGHT + 30) b.y -= (CANVAS_HEIGHT + 60);
        });

        // Update Ice Crystals
        gameState.iceCrystals.forEach(c => {
            c.x += c.speedX;
            c.y += c.speedY + effectiveSpeed * 0.6;
            c.rotation += c.rotSpeed;
            if (c.y > CANVAS_HEIGHT + 10) {
                c.y = -10;
                c.x = Math.random() * CANVAS_WIDTH;
            }
        });

        // Spawn Timers
        obstacleSpawnTimer += dt;
        const currentObsInterval = Math.max(750, BASE_OBSTACLE_INTERVAL - (gameState.threatLevel - 1) * 85);
        if (obstacleSpawnTimer >= currentObsInterval) {
            obstacleSpawnTimer = 0;
            spawnObstacle();
        }

        gateSpawnTimer += dt;
        if (gateSpawnTimer >= 2200) {
            gateSpawnTimer = 0;
            spawnWarpGate();
        }

        diamondSpawnTimer += dt;
        if (diamondSpawnTimer >= 1400) {
            diamondSpawnTimer = 0;
            spawnDiamond();
        }

        // Update Warp Gates
        for (let i = gameState.warpGates.length - 1; i >= 0; i--) {
            const gate = gameState.warpGates[i];
            gate.y += effectiveSpeed;
            gate.pulse += 0.08;

            // Check if ship enters gate
            if (!gate.passed) {
                const insideGateX = Math.abs(gameState.ship.x - gate.x) < gate.width / 2;
                const insideGateY = Math.abs(gameState.ship.y - gate.y) < 22;

                if (insideGateX && insideGateY) {
                    gate.passed = true;
                    gameState.comboStreak += 1;
                    const bonus = 50 + (gameState.comboStreak - 1) * 15;
                    gameState.score += bonus;
                    addFloatingText(`GATE COMBO x${gameState.comboStreak}! +${bonus}`, gate.x, gate.y, "#34d399");
                    playSaturnSound("gate");
                    triggerBoost();

                    // Gate particle ring explosion
                    for (let p = 0; p < 18; p++) {
                        const angle = (p / 18) * Math.PI * 2;
                        gameState.particles.push({
                            x: gate.x,
                            y: gate.y,
                            vx: Math.cos(angle) * 4,
                            vy: Math.sin(angle) * 4,
                            color: "#34d399",
                            size: 3.5,
                            life: 1.0,
                            decay: 0.04
                        });
                    }
                }
            }

            if (gate.y > CANVAS_HEIGHT + 50) {
                gameState.warpGates.splice(i, 1);
            }
        }

        // Update Diamonds
        for (let i = gameState.diamonds.length - 1; i >= 0; i--) {
            const d = gameState.diamonds[i];
            d.y += effectiveSpeed;
            d.rotation += 0.04;

            const dist = Math.hypot(gameState.ship.x - d.x, gameState.ship.y - d.y);
            if (dist < 26) {
                // Collect diamond
                gameState.diamonds.splice(i, 1);
                gameState.score += 25;
                if (window.player) {
                    window.player.credits = (window.player.credits || 0) + 1;
                }
                addFloatingText("+25 CRYO GEM", d.x, d.y, "#6ee7b7");
                playSaturnSound("diamond");

                for (let p = 0; p < 10; p++) {
                    gameState.particles.push({
                        x: d.x,
                        y: d.y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        color: "#6ee7b7",
                        size: 3,
                        life: 1.0,
                        decay: 0.05
                    });
                }
                continue;
            }

            if (d.y > CANVAS_HEIGHT + 30) {
                gameState.diamonds.splice(i, 1);
            }
        }

        // Update Obstacles & Collisions
        for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
            const obs = gameState.obstacles[i];
            obs.y += effectiveSpeed + (obs.speedBonus || 0);
            obs.rotation += obs.rotSpeed || 0;

            const shipBox = {
                x: gameState.ship.x - gameState.ship.width / 2 + 4,
                y: gameState.ship.y - gameState.ship.height / 2 + 4,
                w: gameState.ship.width - 8,
                h: gameState.ship.height - 8
            };

            const obsBox = {
                x: obs.x - obs.width / 2 + 3,
                y: obs.y - obs.height / 2 + 3,
                w: obs.width - 6,
                h: obs.height - 6
            };

            const isOverlap = (
                shipBox.x < obsBox.x + obsBox.w &&
                shipBox.x + shipBox.w > obsBox.x &&
                shipBox.y < obsBox.y + obsBox.h &&
                shipBox.y + shipBox.h > obsBox.y
            );

            if (isOverlap && gameState.ship.invulnerableTime <= 0) {
                // Collision!
                gameState.obstacles.splice(i, 1);
                handleCollision(obs.x, obs.y);
                continue;
            }

            if (obs.y > CANVAS_HEIGHT + 60) {
                gameState.obstacles.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const p = gameState.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }

        // Update Floating Texts
        for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
            const ft = gameState.floatingTexts[i];
            ft.y -= 0.8;
            ft.life -= ft.decay;
            if (ft.life <= 0) {
                gameState.floatingTexts.splice(i, 1);
            }
        }

        updateUI();
    }

    function handleCollision(x, y) {
        gameState.lives -= 1;
        gameState.comboStreak = 0;
        gameState.ship.invulnerableTime = 1400; // ms
        playSaturnSound("hit");
        addFloatingText("SHIELD DAMAGED!", gameState.ship.x, gameState.ship.y - 25, "#ff5555");

        // Ice impact debris
        for (let i = 0; i < 22; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 4;
            gameState.particles.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: Math.random() > 0.5 ? "#67e8f9" : "#e0f2fe",
                size: Math.random() * 4 + 2,
                life: 1.0,
                decay: 0.04
            });
        }

        if (gameState.lives <= 0) {
            triggerGameOver();
        }
    }

    function triggerGameOver() {
        gameState.gameOver = true;
        gameState.active = false;
        playSaturnSound("gameover");

        if (window.player) {
            if (gameState.score > (window.player.saturnRingHighScore || 0)) {
                window.player.saturnRingHighScore = gameState.score;
                if (typeof savePlayer === "function") savePlayer(window.player);
            }
            gameState.highScore = window.player.saturnRingHighScore || 0;
        }

        const goModal = document.getElementById("saturnRingGameOver");
        const finalScore = document.getElementById("saturnRingFinalScore");
        const finalHigh = document.getElementById("saturnRingFinalHighScore");
        const finalSector = document.getElementById("saturnRingFinalSector");

        if (finalScore) finalScore.textContent = gameState.score.toLocaleString();
        if (finalHigh) finalHigh.textContent = (window.player ? window.player.saturnRingHighScore || 0 : gameState.score).toLocaleString();
        if (finalSector) finalSector.textContent = `Ring Sector ${gameState.threatLevel}`;
        if (goModal) goModal.classList.remove("hidden");

        if (typeof renderHUD === "function") renderHUD();
    }

    // -------------------------------------------------------------
    // Rendering Engine
    // -------------------------------------------------------------
    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Deep Saturn Outer Space Void
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, "#050e14");
        bgGrad.addColorStop(0.5, "#081820");
        bgGrad.addColorStop(1, "#03080b");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Saturn Ring Bands (Horizontal striped ice plane)
        gameState.ringBands.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.globalAlpha = b.opacity;
            ctx.fillRect(0, b.y, CANVAS_WIDTH, b.height);
        });
        ctx.globalAlpha = 1.0;

        // Ice Crystals & Stardust
        gameState.iceCrystals.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.fillStyle = "#a7f3d0";
            ctx.globalAlpha = c.alpha;
            ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
            ctx.restore();
        });
        ctx.globalAlpha = 1.0;

        // Draw Warp Gates
        gameState.warpGates.forEach(g => {
            ctx.save();
            ctx.translate(g.x, g.y);

            // Glowing Outer Ring
            const glowRadius = 38 + Math.sin(g.pulse) * 3;
            const gateGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, glowRadius);
            gateGrad.addColorStop(0, "rgba(52, 211, 153, 0.4)");
            gateGrad.addColorStop(0.7, "rgba(16, 185, 129, 0.2)");
            gateGrad.addColorStop(1, "rgba(52, 211, 153, 0)");
            ctx.fillStyle = gateGrad;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Ring Arc Pillars
            ctx.strokeStyle = g.passed ? "#10b981" : "#34d399";
            ctx.lineWidth = 3.5;
            ctx.shadowColor = "#34d399";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.ellipse(0, 0, g.width / 2, g.height / 2, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Inner Gate Chevron
            ctx.fillStyle = "#6ee7b7";
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            ctx.fillText("WARP GATE", 0, 3);

            ctx.restore();
        });

        // Draw Cryo-Diamonds
        gameState.diamonds.forEach(d => {
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.rotation);

            ctx.shadowColor = "#6ee7b7";
            ctx.shadowBlur = 8;
            ctx.fillStyle = "#6ee7b7";
            ctx.beginPath();
            ctx.moveTo(0, -d.size);
            ctx.lineTo(d.size * 0.8, 0);
            ctx.lineTo(0, d.size);
            ctx.lineTo(-d.size * 0.8, 0);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(0, 0, d.size * 0.25, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        // Draw Obstacles
        gameState.obstacles.forEach(obs => {
            ctx.save();
            ctx.translate(obs.x, obs.y);
            ctx.rotate(obs.rotation || 0);

            if (obs.type === "glacier") {
                ctx.shadowColor = "#67e8f9";
                ctx.shadowBlur = 8;
                ctx.fillStyle = "#1e3a5f";
                ctx.strokeStyle = "#38bdf8";
                ctx.lineWidth = 2;

                // Irregular jagged ice polygon
                ctx.beginPath();
                const r = obs.width / 2;
                ctx.moveTo(0, -r);
                ctx.lineTo(r * 0.9, -r * 0.4);
                ctx.lineTo(r * 0.7, r * 0.7);
                ctx.lineTo(-r * 0.2, r);
                ctx.lineTo(-r * 0.9, r * 0.3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Ice facet highlight
                ctx.strokeStyle = "#e0f2fe";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-r * 0.2, -r * 0.5);
                ctx.lineTo(r * 0.3, 0);
                ctx.lineTo(-r * 0.4, r * 0.4);
                ctx.stroke();
            } else {
                // Comet
                ctx.shadowColor = "#a7f3d0";
                ctx.shadowBlur = 12;
                ctx.fillStyle = "#6ee7b7";
                ctx.beginPath();
                ctx.ellipse(0, 0, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Comet trail
                ctx.fillStyle = "rgba(167, 243, 208, 0.4)";
                ctx.beginPath();
                ctx.moveTo(-obs.width / 2, 0);
                ctx.lineTo(0, -obs.height * 1.5);
                ctx.lineTo(obs.width / 2, 0);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        });

        // Draw Ship (Chronos Ringrunner)
        const ship = gameState.ship;
        const isFlicker = ship.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0;

        if (!isFlicker) {
            ctx.save();
            ctx.translate(ship.x, ship.y);

            // Dual Thruster Plumes
            const flameLen = (gameState.boostActive ? 32 : 18) + Math.random() * 6;
            ctx.fillStyle = gameState.boostActive ? "#34d399" : "#38bdf8";
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 12;

            // Left thruster
            ctx.beginPath();
            ctx.moveTo(-11, 16);
            ctx.lineTo(-7, 16 + flameLen);
            ctx.lineTo(-3, 16);
            ctx.closePath();
            ctx.fill();

            // Right thruster
            ctx.beginPath();
            ctx.moveTo(3, 16);
            ctx.lineTo(7, 16 + flameLen);
            ctx.lineTo(11, 16);
            ctx.closePath();
            ctx.fill();

            // Ship Hull (Sleek Emerald & Slate Ringrunner)
            ctx.fillStyle = "#0f2f24";
            ctx.strokeStyle = "#34d399";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(0, -22); // Nose
            ctx.lineTo(12, 6);   // Right wingtip
            ctx.lineTo(16, 18);  // Right fin
            ctx.lineTo(6, 14);
            ctx.lineTo(0, 18);   // Engine bay
            ctx.lineTo(-6, 14);
            ctx.lineTo(-16, 18); // Left fin
            ctx.lineTo(-12, 6);  // Left wingtip
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cockpit Canopy
            ctx.fillStyle = "#6ee7b7";
            ctx.shadowColor = "#34d399";
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.ellipse(0, -4, 4.5, 9, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shield Aura when invulnerable or active
            if (ship.invulnerableTime > 0) {
                ctx.strokeStyle = "rgba(52, 211, 153, 0.8)";
                ctx.lineWidth = 2.5;
                ctx.shadowColor = "#34d399";
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(0, 0, 26, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Draw Particles
        gameState.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        ctx.globalAlpha = 1.0;

        // Draw Floating Texts
        gameState.floatingTexts.forEach(ft => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.life);
            ctx.fillStyle = ft.color;
            ctx.shadowColor = ft.color;
            ctx.shadowBlur = 8;
            ctx.font = "bold 12px monospace";
            ctx.textAlign = "center";
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        });
        ctx.globalAlpha = 1.0;
    }

    // -------------------------------------------------------------
    // UI Updates
    // -------------------------------------------------------------
    function updateUI() {
        const scoreEl = document.getElementById("saturnRingScore");
        const highEl = document.getElementById("saturnRingHighScore");
        const shieldsEl = document.getElementById("saturnRingShields");

        if (scoreEl) scoreEl.textContent = gameState.score.toLocaleString();
        if (highEl) {
            const best = window.player ? Math.max(gameState.score, window.player.saturnRingHighScore || 0) : gameState.score;
            highEl.textContent = best.toLocaleString();
        }

        if (shieldsEl) {
            let pips = "";
            for (let i = 0; i < gameState.maxLives; i++) {
                if (i < gameState.lives) {
                    pips += `<span class="material-symbols-outlined text-[16px] text-[#34d399]">shield</span>`;
                } else {
                    pips += `<span class="material-symbols-outlined text-[16px] text-white/20">shield_with_heart</span>`;
                }
            }
            shieldsEl.innerHTML = pips;
        }
    }

    // -------------------------------------------------------------
    // Animation Loop
    // -------------------------------------------------------------
    function loop(timestamp) {
        if (!gameState.active) return;
        if (!lastTime) lastTime = timestamp;
        const dt = Math.min(100, timestamp - lastTime);
        lastTime = timestamp;

        if (!gameState.paused && !gameState.gameOver) {
            update(dt);
        }
        draw();
        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // Modal Controller
    // -------------------------------------------------------------
    function openSaturnRing() {
        if (!isSaturnUnlocked()) {
            if (typeof showToast === "function") {
                showToast("Reach Saturn to unlock Chronos Ringrunner!", "warning");
            }
            return;
        }

        const modal = document.getElementById("saturnRingModal");
        if (!modal) return;
        modal.classList.remove("hidden");
        modal.classList.add("flex");

        if (!canvas) {
            canvas = document.getElementById("saturnRingCanvas");
            if (canvas) ctx = canvas.getContext("2d");
        }

        resetSaturnToBaseDifficulty();
        gameState.active = true;
        lastTime = performance.now();
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = requestAnimationFrame(loop);
    }

    function closeSaturnRing() {
        gameState.active = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = null;

        const modal = document.getElementById("saturnRingModal");
        if (modal) {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
        }

        if (typeof renderHUD === "function") renderHUD();
    }

    function togglePauseSaturnRing() {
        if (!gameState.active || gameState.gameOver) return;
        gameState.paused = !gameState.paused;

        const pauseBtn = document.getElementById("saturnRingPauseBtn");
        if (pauseBtn) {
            pauseBtn.innerHTML = gameState.paused
                ? `<span class="material-symbols-outlined text-[18px]">play_arrow</span>`
                : `<span class="material-symbols-outlined text-[18px]">pause</span>`;
        }
    }

    // -------------------------------------------------------------
    // Inputs & Touch Controls
    // -------------------------------------------------------------
    function setupInputs() {
        window.addEventListener("keydown", (e) => {
            if (!gameState.active) return;
            if (e.code === "ArrowLeft" || e.code === "KeyA") {
                gameState.keys.left = true;
                e.preventDefault();
            } else if (e.code === "ArrowRight" || e.code === "KeyD") {
                gameState.keys.right = true;
                e.preventDefault();
            } else if (e.code === "ArrowUp" || e.code === "KeyW") {
                gameState.keys.up = true;
                e.preventDefault();
            } else if (e.code === "ArrowDown" || e.code === "KeyS") {
                gameState.keys.down = true;
                e.preventDefault();
            } else if (e.code === "Space" || e.code === "KeyF") {
                triggerBoost();
                e.preventDefault();
            } else if (e.code === "KeyP") {
                togglePauseSaturnRing();
            }
        });

        window.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft" || e.code === "KeyA") gameState.keys.left = false;
            if (e.code === "ArrowRight" || e.code === "KeyD") gameState.keys.right = false;
            if (e.code === "ArrowUp" || e.code === "KeyW") gameState.keys.up = false;
            if (e.code === "ArrowDown" || e.code === "KeyS") gameState.keys.down = false;
        });
    }

    function setupMobileControls() {
        const btnLeft = document.getElementById("btnSaturnLeft");
        const btnRight = document.getElementById("btnSaturnRight");
        const btnBoost = document.getElementById("btnSaturnBoost");

        if (btnLeft) {
            const startL = (e) => { e.preventDefault(); gameState.keys.left = true; };
            const stopL = (e) => { e.preventDefault(); gameState.keys.left = false; };
            btnLeft.addEventListener("mousedown", startL);
            btnLeft.addEventListener("mouseup", stopL);
            btnLeft.addEventListener("touchstart", startL);
            btnLeft.addEventListener("touchend", stopL);
        }

        if (btnRight) {
            const startR = (e) => { e.preventDefault(); gameState.keys.right = true; };
            const stopR = (e) => { e.preventDefault(); gameState.keys.right = false; };
            btnRight.addEventListener("mousedown", startR);
            btnRight.addEventListener("mouseup", stopR);
            btnRight.addEventListener("touchstart", startR);
            btnRight.addEventListener("touchend", stopR);
        }

        if (btnBoost) {
            btnBoost.addEventListener("click", () => triggerBoost());
            btnBoost.addEventListener("touchstart", (e) => { e.preventDefault(); triggerBoost(); });
        }
    }

    // Expose API globally
    window.isSaturnUnlocked = isSaturnUnlocked;
    window.openSaturnRing = openSaturnRing;
    window.closeSaturnRing = closeSaturnRing;
    window.togglePauseSaturnRing = togglePauseSaturnRing;
    window.restartSaturnRing = resetSaturnToBaseDifficulty;

    document.addEventListener("DOMContentLoaded", () => {
        canvas = document.getElementById("saturnRingCanvas");
        if (canvas) ctx = canvas.getContext("2d");
        setupInputs();
        setupMobileControls();
    });
})();
