// ORBIT // Mars Rover Rush: Martian Canyon Runner Minigame
// Gated exclusively behind Mars arrival. Features progressive difficulty,
// persistent High Score tracking, obstacle jumping, and resets to base difficulty upon destruction.

(function () {
    const CANVAS_WIDTH = 400;
    const CANVAS_HEIGHT = 560;

    let canvas, ctx;
    let animFrameId = null;
    let lastTime = 0;
    let spawnTimer = 0;
    let crystalSpawnTimer = 0;

    // Base difficulty parameters (regulated for smooth, responsive arcade feel)
    const BASE_SPEED = 2.4;
    const BASE_SPAWN_INTERVAL = 1800; // ms

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
        jumpEnergy: 100,
        isJumping: false,
        jumpZ: 0,
        jumpVelocity: 0,
        rover: {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 90,
            width: 38,
            height: 48,
            speed: 6.0,
            invulnerableTime: 0
        },
        obstacles: [],
        crystals: [],
        particles: [],
        floatingTexts: [],
        canyonStripes: [],
        dustParticles: [],
        keys: {
            left: false,
            right: false,
            jump: false
        }
    };

    // -------------------------------------------------------------
    // Audio Synthesizer Integration
    // -------------------------------------------------------------
    function playMarsSound(type) {
        if (!window.player || window.player.soundEnabled === false) return;
        try {
            if (typeof initAudio === "function") initAudio();
            const audioCtx = window.audioCtx || (typeof getAudioCtx === "function" ? getAudioCtx() : null);
            const actx = audioCtx || (window.AudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null);
            if (!actx) return;
            if (actx.state === "suspended") actx.resume();

            const now = actx.currentTime;

            if (type === "jump") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(240, now);
                osc.frequency.exponentialRampToValueAtTime(680, now + 0.18);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === "crystal") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(540, now);
                osc.frequency.setValueAtTime(820, now + 0.08);
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
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === "gameover") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(45, now + 0.55);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.55);
            }
        } catch (e) {
            // Audio context fallback
        }
    }

    // -------------------------------------------------------------
    // Gating Check
    // -------------------------------------------------------------
    function isMarsUnlocked() {
        if (!window.player) return false;
        const list = window.player.unlockedPlanets || [];
        return list.includes("Mars") || (window.player.journey && (window.player.journey.chapter || 1) >= 2);
    }

    // -------------------------------------------------------------
    // Background Canyon & Dust Setup
    // -------------------------------------------------------------
    function initCanyonEnvironment() {
        gameState.canyonStripes = [];
        for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
            gameState.canyonStripes.push({ y, shade: Math.random() > 0.5 ? "#2a0e0e" : "#3b1414" });
        }

        gameState.dustParticles = [];
        for (let i = 0; i < 35; i++) {
            gameState.dustParticles.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: Math.random() * 2.5 + 1,
                speedX: -1.5 - Math.random() * 2,
                speedY: 2 + Math.random() * 3,
                alpha: Math.random() * 0.5 + 0.2
            });
        }
    }

    // -------------------------------------------------------------
    // Difficulty & Reset Logic
    // -------------------------------------------------------------
    function updateDifficulty() {
        // Increases gently every 250 points (instead of rapid 100 points)
        const newLevel = Math.min(10, Math.floor(gameState.score / 250) + 1);
        if (newLevel > gameState.threatLevel) {
            gameState.threatLevel = newLevel;
            addFloatingText("SPEED SURGE!", gameState.rover.x, gameState.rover.y - 30, "#ff5555");
            playMarsSound("jump");
        }
        // Smooth regulated speed ramp: +0.25 per level
        gameState.speed = BASE_SPEED + (gameState.threatLevel - 1) * 0.25;

        const levelBadge = document.getElementById("marsRoverLevel");
        if (levelBadge) {
            levelBadge.textContent = `VALLES SECTOR ${gameState.threatLevel}`;
        }
    }

    function resetMarsToBaseDifficulty() {
        gameState.score = 0;
        gameState.threatLevel = 1;
        gameState.lives = gameState.maxLives;
        gameState.speed = BASE_SPEED;
        gameState.distanceTraveled = 0;
        gameState.scoreAccumulator = 0;
        gameState.isJumping = false;
        gameState.jumpZ = 0;
        gameState.jumpVelocity = 0;
        gameState.jumpEnergy = 100;
        gameState.gameOver = false;
        gameState.paused = false;

        gameState.rover.x = CANVAS_WIDTH / 2;
        gameState.rover.y = CANVAS_HEIGHT - 90;
        gameState.rover.invulnerableTime = 0;

        gameState.obstacles = [];
        gameState.crystals = [];
        gameState.particles = [];
        gameState.floatingTexts = [];
        spawnTimer = 0;
        crystalSpawnTimer = 0;

        initCanyonEnvironment();
        updateUI();

        const goModal = document.getElementById("marsRoverGameOver");
        if (goModal) goModal.classList.add("hidden");

        const pauseBtn = document.getElementById("marsRoverPauseBtn");
        if (pauseBtn) pauseBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">pause</span>`;

        console.log("Mars Rover Rush: Reset to Base Difficulty (Sector 1, 3 Armor, 0 Score).");
    }

    // -------------------------------------------------------------
    // Spawners & Obstacles
    // -------------------------------------------------------------
    function spawnObstacle() {
        // Types: 'boulder' (jumpable or dodgeable), 'chasm' (MUST jump), 'fissure' (narrow deep gap)
        const roll = Math.random();
        const type = roll < 0.55 ? "boulder" : (roll < 0.85 ? "chasm" : "fissure");

        const minX = 65;
        const maxX = CANVAS_WIDTH - 65;
        const x = minX + Math.random() * (maxX - minX);

        if (type === "boulder") {
            gameState.obstacles.push({
                x,
                y: -50,
                width: 32 + Math.random() * 12,
                height: 28,
                type: "boulder",
                color: "#7f1d1d",
                jumpable: true
            });
        } else if (type === "chasm") {
            gameState.obstacles.push({
                x: CANVAS_WIDTH / 2,
                y: -60,
                width: CANVAS_WIDTH - 90,
                height: 38,
                type: "chasm",
                color: "#180606",
                jumpable: true
            });
        } else {
            gameState.obstacles.push({
                x,
                y: -40,
                width: 26,
                height: 45,
                type: "fissure",
                color: "#ff3b30",
                jumpable: false
            });
        }
    }

    function spawnCrystal() {
        const minX = 70;
        const maxX = CANVAS_WIDTH - 70;
        const isRepair = Math.random() < 0.12 && gameState.lives < gameState.maxLives;

        gameState.crystals.push({
            x: minX + Math.random() * (maxX - minX),
            y: -30,
            size: isRepair ? 16 : 12,
            type: isRepair ? "repair" : "crystal",
            color: isRepair ? "#34d399" : "#ff9f43"
        });
    }

    // -------------------------------------------------------------
    // Jump Mechanic
    // -------------------------------------------------------------
    function triggerJump() {
        if (gameState.isJumping || gameState.gameOver || gameState.paused) return;
        gameState.isJumping = true;
        gameState.jumpZ = 0;
        gameState.jumpVelocity = 11.5;
        playMarsSound("jump");

        // Jump thruster particles
        for (let i = 0; i < 14; i++) {
            gameState.particles.push({
                x: gameState.rover.x + (Math.random() - 0.5) * 20,
                y: gameState.rover.y + 20,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                color: Math.random() > 0.5 ? "#f97316" : "#ef4444",
                size: Math.random() * 4 + 2,
                life: 1.0,
                decay: 0.05
            });
        }
    }

    function addFloatingText(text, x, y, color = "#ff5555") {
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

        // Steering movement
        if (gameState.keys.left) {
            gameState.rover.x -= gameState.rover.speed;
        }
        if (gameState.keys.right) {
            gameState.rover.x += gameState.rover.speed;
        }

        // Clamp inside canyon walls
        const wallPadding = 55;
        gameState.rover.x = Math.max(wallPadding, Math.min(CANVAS_WIDTH - wallPadding, gameState.rover.x));

        // Jump physics
        if (gameState.isJumping) {
            gameState.jumpZ += gameState.jumpVelocity;
            gameState.jumpVelocity -= 0.65; // gravity
            if (gameState.jumpZ <= 0) {
                gameState.jumpZ = 0;
                gameState.isJumping = false;
                gameState.jumpVelocity = 0;
            }
        }

        // Invulnerability countdown
        if (gameState.rover.invulnerableTime > 0) {
            gameState.rover.invulnerableTime -= dt;
        }

        // Distance & gentle score accumulation (regulated, frame-rate independent)
        gameState.distanceTraveled += gameState.speed * (dt / 1000) * 15;
        gameState.scoreAccumulator += gameState.speed * (dt / 1000) * 8;
        if (gameState.scoreAccumulator >= 1) {
            const added = Math.floor(gameState.scoreAccumulator);
            gameState.score += added;
            gameState.scoreAccumulator -= added;
            updateDifficulty();
        }

        // Canyon stripes scroll
        gameState.canyonStripes.forEach(s => {
            s.y += gameState.speed;
            if (s.y > CANVAS_HEIGHT) s.y -= CANVAS_HEIGHT;
        });

        // Dust particles update
        gameState.dustParticles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY + gameState.speed * 0.5;
            if (p.y > CANVAS_HEIGHT) { p.y = -10; p.x = Math.random() * CANVAS_WIDTH; }
            if (p.x < 0) { p.x = CANVAS_WIDTH; }
        });

        // Obstacles spawn
        spawnTimer += dt;
        const currentSpawnInterval = Math.max(700, BASE_SPAWN_INTERVAL - (gameState.threatLevel - 1) * 80);
        if (spawnTimer >= currentSpawnInterval) {
            spawnTimer = 0;
            spawnObstacle();
        }

        // Crystals spawn
        crystalSpawnTimer += dt;
        if (crystalSpawnTimer >= 1100) {
            crystalSpawnTimer = 0;
            spawnCrystal();
        }

        // Update obstacles & collisions
        for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
            const obs = gameState.obstacles[i];
            obs.y += gameState.speed;

            // Collision check with Rover
            const roverBox = {
                x: gameState.rover.x - gameState.rover.width / 2,
                y: gameState.rover.y - gameState.rover.height / 2,
                w: gameState.rover.width,
                h: gameState.rover.height
            };

            const obsBox = {
                x: obs.x - obs.width / 2,
                y: obs.y - obs.height / 2,
                w: obs.width,
                h: obs.height
            };

            const isOverlap = (
                roverBox.x < obsBox.x + obsBox.w &&
                roverBox.x + roverBox.w > obsBox.x &&
                roverBox.y < obsBox.y + obsBox.h &&
                roverBox.y + roverBox.h > obsBox.y
            );

            if (isOverlap && gameState.rover.invulnerableTime <= 0) {
                // If jumping high enough over jumpable obstacles (boulder, chasm)
                const isCleared = obs.jumpable && gameState.isJumping && gameState.jumpZ > 22;

                if (!isCleared) {
                    // Collision!
                    gameState.lives--;
                    gameState.rover.invulnerableTime = 1200; // ms
                    playMarsSound("hit");
                    addFloatingText("-1 ARMOR!", gameState.rover.x, gameState.rover.y - 20, "#ff3333");

                    // Impact particles
                    for (let p = 0; p < 18; p++) {
                        gameState.particles.push({
                            x: gameState.rover.x,
                            y: gameState.rover.y,
                            vx: (Math.random() - 0.5) * 8,
                            vy: (Math.random() - 0.5) * 8,
                            color: Math.random() > 0.5 ? "#f97316" : "#ef4444",
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

            if (obs.y > CANVAS_HEIGHT + 80) {
                gameState.obstacles.splice(i, 1);
            }
        }

        // Update crystals & collection
        for (let i = gameState.crystals.length - 1; i >= 0; i--) {
            const c = gameState.crystals[i];
            c.y += gameState.speed;

            const dist = Math.hypot(c.x - gameState.rover.x, c.y - gameState.rover.y);
            if (dist < 28) {
                if (c.type === "repair") {
                    gameState.lives = Math.min(gameState.maxLives, gameState.lives + 1);
                    addFloatingText("+1 ARMOR REPAIRED", gameState.rover.x, gameState.rover.y - 25, "#34d399");
                    playMarsSound("crystal");
                } else {
                    gameState.score += 35;
                    addFloatingText("+35", c.x, c.y, "#ffb95f");
                    playMarsSound("crystal");
                }
                gameState.crystals.splice(i, 1);
                updateUI();
                continue;
            }

            if (c.y > CANVAS_HEIGHT + 40) {
                gameState.crystals.splice(i, 1);
            }
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

        // Canyon background (deep rusty red gradient)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, "#1f0707");
        bgGrad.addColorStop(1, "#361010");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Ground textures & canyon tracks
        ctx.fillStyle = "#2d0e0e";
        gameState.canyonStripes.forEach(s => {
            ctx.fillRect(50, s.y, CANVAS_WIDTH - 100, 18);
        });

        // Canyon Wall Borders (left & right)
        ctx.fillStyle = "#160404";
        ctx.fillRect(0, 0, 48, CANVAS_HEIGHT);
        ctx.fillRect(CANVAS_WIDTH - 48, 0, 48, CANVAS_HEIGHT);

        // Ridge highlights
        ctx.strokeStyle = "#7f1d1d";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(48, 0); ctx.lineTo(48, CANVAS_HEIGHT);
        ctx.moveTo(CANVAS_WIDTH - 48, 0); ctx.lineTo(CANVAS_WIDTH - 48, CANVAS_HEIGHT);
        ctx.stroke();

        // Draw Dust Particles
        ctx.fillStyle = "#e25822";
        gameState.dustParticles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Draw Obstacles
        gameState.obstacles.forEach(obs => {
            if (obs.type === "boulder") {
                // Rock shadow
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.beginPath();
                ctx.ellipse(obs.x, obs.y + 12, obs.width / 2 + 2, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // 3D Martian Boulder
                const bGrad = ctx.createRadialGradient(obs.x - 4, obs.y - 6, 4, obs.x, obs.y, obs.width / 2);
                bGrad.addColorStop(0, "#b91c1c");
                bGrad.addColorStop(0.6, "#7f1d1d");
                bGrad.addColorStop(1, "#450a0a");
                ctx.fillStyle = bGrad;
                ctx.beginPath();
                ctx.arc(obs.x, obs.y, obs.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 1.5;
                ctx.stroke();
            } else if (obs.type === "chasm") {
                // Deep glowing canyon fissure
                ctx.fillStyle = "#0c0202";
                ctx.fillRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
                ctx.strokeStyle = "#ff4444";
                ctx.lineWidth = 1.5;
                ctx.strokeRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);

                // Lava/Core glow lines inside
                ctx.strokeStyle = "#ff7733";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(obs.x - obs.width / 3, obs.y);
                ctx.lineTo(obs.x + obs.width / 3, obs.y);
                ctx.stroke();
            } else {
                // Geothermal Steam Vent
                ctx.fillStyle = "#ff5500";
                ctx.beginPath();
                ctx.arc(obs.x, obs.y, 14, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw Crystals
        gameState.crystals.forEach(c => {
            ctx.shadowBlur = 12;
            ctx.shadowColor = c.color;
            ctx.fillStyle = c.color;

            if (c.type === "repair") {
                // Shield cross
                ctx.fillRect(c.x - 7, c.y - 3, 14, 6);
                ctx.fillRect(c.x - 3, c.y - 7, 6, 14);
            } else {
                // Diamond shape
                ctx.beginPath();
                ctx.moveTo(c.x, c.y - c.size);
                ctx.lineTo(c.x + c.size, c.y);
                ctx.lineTo(c.x, c.y + c.size);
                ctx.lineTo(c.x - c.size, c.y);
                ctx.closePath();
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        });

        // Draw Ares Rover
        const r = gameState.rover;
        const z = gameState.jumpZ;

        // Rover Shadow (scales down when jumping)
        const shadowScale = Math.max(0.4, 1 - z / 80);
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(r.x, r.y + 16, (r.width / 2 + 6) * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rover Body (with jump offset)
        const renderY = r.y - z;

        if (r.invulnerableTime <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
            // Wheels (4 tracks/wheels)
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(r.x - r.width / 2 - 4, renderY - 18, 7, 14); // Front left
            ctx.fillRect(r.x + r.width / 2 - 3, renderY - 18, 7, 14); // Front right
            ctx.fillRect(r.x - r.width / 2 - 4, renderY + 8, 7, 14);  // Rear left
            ctx.fillRect(r.x + r.width / 2 - 3, renderY + 8, 7, 14);  // Rear right

            // Chassis
            const roverGrad = ctx.createLinearGradient(r.x - r.width / 2, renderY, r.x + r.width / 2, renderY);
            roverGrad.addColorStop(0, "#ef4444");
            roverGrad.addColorStop(0.5, "#dc2626");
            roverGrad.addColorStop(1, "#991b1b");
            ctx.fillStyle = roverGrad;
            ctx.beginPath();
            ctx.roundRect(r.x - r.width / 2, renderY - r.height / 2, r.width, r.height, 8);
            ctx.fill();

            // Cabin Window
            ctx.fillStyle = "#38bdf8";
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = z > 0 ? 10 : 4;
            ctx.beginPath();
            ctx.roundRect(r.x - 10, renderY - 14, 20, 10, 4);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Headlight Beams
            ctx.fillStyle = "rgba(255, 230, 150, 0.18)";
            ctx.beginPath();
            ctx.moveTo(r.x - 12, renderY - 24);
            ctx.lineTo(r.x - 30, renderY - 95);
            ctx.lineTo(r.x + 30, renderY - 95);
            ctx.lineTo(r.x + 12, renderY - 24);
            ctx.closePath();
            ctx.fill();
        }

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
        const scoreEl = document.getElementById("marsRoverScore");
        const highEl = document.getElementById("marsRoverHigh");
        const shieldsEl = document.getElementById("marsRoverShields");

        if (scoreEl) scoreEl.textContent = gameState.score.toLocaleString();
        if (highEl) highEl.textContent = (window.player ? (window.player.marsRoverHighScore || 0) : gameState.highScore).toLocaleString();

        if (shieldsEl) {
            let html = "";
            for (let i = 0; i < gameState.maxLives; i++) {
                if (i < gameState.lives) {
                    html += `<span class="material-symbols-outlined text-[16px] text-red-400">shield</span>`;
                } else {
                    html += `<span class="material-symbols-outlined text-[16px] text-white/20">shield</span>`;
                }
            }
            shieldsEl.innerHTML = html;
        }
    }

    function triggerGameOver() {
        gameState.gameOver = true;
        playMarsSound("gameover");

        if (window.player) {
            const currentBest = window.player.marsRoverHighScore || 0;
            const isNewHigh = gameState.score > currentBest;

            if (isNewHigh) {
                window.player.marsRoverHighScore = gameState.score;
                if (typeof savePlayer === "function") savePlayer(window.player);
            }

            const recordBadge = document.getElementById("marsRoverRecordBadge");
            if (recordBadge) recordBadge.classList.toggle("hidden", !isNewHigh);

            const finalScoreEl = document.getElementById("marsRoverFinalScore");
            const bestScoreEl = document.getElementById("marsRoverBestScore");
            const waveReachedEl = document.getElementById("marsRoverWaveReached");

            if (finalScoreEl) finalScoreEl.textContent = gameState.score.toLocaleString();
            if (bestScoreEl) bestScoreEl.textContent = (window.player.marsRoverHighScore || gameState.score).toLocaleString();
            if (waveReachedEl) waveReachedEl.textContent = `Valles Sector ${gameState.threatLevel}`;
        }

        const goModal = document.getElementById("marsRoverGameOver");
        if (goModal) {
            goModal.classList.remove("hidden");
            goModal.classList.add("flex");
        }

        if (typeof renderHUD === "function") renderHUD();
    }

    // -------------------------------------------------------------
    // Modal Open / Close & Input Setup
    // -------------------------------------------------------------
    function openMarsRover() {
        if (!isMarsUnlocked()) {
            if (typeof showToast === "function") {
                showToast("🔒 Locked! Reach Mars first to unlock Mars Rover Rush.", "error");
            }
            if (typeof playSound === "function") playSound("error");
            return;
        }

        const modal = document.getElementById("marsRoverModal");
        if (!modal) return;
        modal.classList.remove("hidden");
        modal.classList.add("flex");

        if (!canvas) canvas = document.getElementById("marsRoverCanvas");
        if (canvas) ctx = canvas.getContext("2d");

        gameState.active = true;
        gameState.highScore = window.player ? (window.player.marsRoverHighScore || 0) : 0;
        resetMarsToBaseDifficulty();

        lastTime = performance.now();
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = requestAnimationFrame(loop);
    }

    function closeMarsRover() {
        gameState.active = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        const modal = document.getElementById("marsRoverModal");
        if (modal) {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
        }
        if (typeof renderHUD === "function") renderHUD();
    }

    function togglePauseMarsRover() {
        if (!gameState.active || gameState.gameOver) return;
        gameState.paused = !gameState.paused;
        const btn = document.getElementById("marsRoverPauseBtn");
        if (btn) {
            btn.innerHTML = gameState.paused
                ? `<span class="material-symbols-outlined text-[18px]">play_arrow</span>`
                : `<span class="material-symbols-outlined text-[18px]">pause</span>`;
        }
    }

    function setupInputs() {
        window.addEventListener("keydown", (e) => {
            if (!gameState.active) return;
            if (e.code === "ArrowLeft" || e.code === "KeyA") {
                gameState.keys.left = true;
                e.preventDefault();
            } else if (e.code === "ArrowRight" || e.code === "KeyD") {
                gameState.keys.right = true;
                e.preventDefault();
            } else if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") {
                triggerJump();
                e.preventDefault();
            } else if (e.code === "KeyP") {
                togglePauseMarsRover();
            }
        });

        window.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft" || e.code === "KeyA") gameState.keys.left = false;
            if (e.code === "ArrowRight" || e.code === "KeyD") gameState.keys.right = false;
        });

        // Pointer controls
        let isPointerDown = false;
        if (canvas) {
            canvas.addEventListener("pointerdown", (e) => {
                isPointerDown = true;
                const rect = canvas.getBoundingClientRect();
                const clientX = e.clientX - rect.left;
                const targetX = clientX * (CANVAS_WIDTH / rect.width);
                gameState.rover.x = Math.max(55, Math.min(CANVAS_WIDTH - 55, targetX));
            });
            window.addEventListener("pointermove", (e) => {
                if (!isPointerDown || !gameState.active || gameState.paused) return;
                const rect = canvas.getBoundingClientRect();
                const clientX = e.clientX - rect.left;
                const targetX = clientX * (CANVAS_WIDTH / rect.width);
                gameState.rover.x = Math.max(55, Math.min(CANVAS_WIDTH - 55, targetX));
            });
            window.addEventListener("pointerup", () => { isPointerDown = false; });
        }
    }

    function setupMobileControls() {
        const btnLeft = document.getElementById("btnMarsLeft");
        const btnRight = document.getElementById("btnMarsRight");
        const btnJump = document.getElementById("btnMarsJump");

        const addHoldListener = (el, onStart, onEnd) => {
            if (!el) return;
            el.addEventListener("touchstart", (e) => { e.preventDefault(); onStart(); });
            el.addEventListener("touchend", (e) => { e.preventDefault(); onEnd(); });
            el.addEventListener("mousedown", () => onStart());
            el.addEventListener("mouseup", () => onEnd());
            el.addEventListener("mouseleave", () => onEnd());
        };

        addHoldListener(btnLeft, () => { gameState.keys.left = true; }, () => { gameState.keys.left = false; });
        addHoldListener(btnRight, () => { gameState.keys.right = true; }, () => { gameState.keys.right = false; });
        if (btnJump) {
            btnJump.addEventListener("click", () => triggerJump());
            btnJump.addEventListener("touchstart", (e) => { e.preventDefault(); triggerJump(); });
        }
    }

    // Expose API globally
    window.isMarsUnlocked = isMarsUnlocked;
    window.openMarsRover = openMarsRover;
    window.closeMarsRover = closeMarsRover;
    window.togglePauseMarsRover = togglePauseMarsRover;
    window.restartMarsRover = resetMarsToBaseDifficulty;

    document.addEventListener("DOMContentLoaded", () => {
        canvas = document.getElementById("marsRoverCanvas");
        setupInputs();
        setupMobileControls();
    });
})();
