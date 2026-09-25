// ORBIT // Neptune Void Pulse: Dark Matter Phase-Shift Runner Minigame
// Gated exclusively behind Neptune arrival. Features dark matter phase-shifting intangibility,
// rift phasing bonuses, resonance node collection, persistent High Score tracking,
// and resets to base difficulty upon destruction.

(function () {
    const CANVAS_WIDTH = 400;
    const CANVAS_HEIGHT = 560;

    let canvas, ctx;
    let animFrameId = null;
    let lastTime = 0;
    let obstacleSpawnTimer = 0;
    let nodeSpawnTimer = 0;
    let coreSpawnTimer = 0;

    // Base difficulty parameters
    const BASE_SPEED = 2.5;
    const BASE_OBSTACLE_INTERVAL = 1700; // ms

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
        phaseEnergy: 100, // 0 to 100
        isPhased: false,
        phaseDuration: 0,
        ship: {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 95,
            width: 38,
            height: 48,
            speedX: 5.6,
            speedY: 4.0,
            invulnerableTime: 0
        },
        obstacles: [],
        nodes: [],
        cores: [],
        particles: [],
        floatingTexts: [],
        voidClouds: [],
        quantumStars: [],
        shipEchoes: [],
        keys: {
            left: false,
            right: false,
            up: false,
            down: false,
            phase: false
        }
    };

    // -------------------------------------------------------------
    // Audio Synthesizer Integration
    // -------------------------------------------------------------
    function playNeptuneSound(type) {
        if (!window.player || window.player.soundEnabled === false) return;
        try {
            if (typeof initAudio === "function") initAudio();
            const audioCtx = window.audioCtx || (typeof getAudioCtx === "function" ? getAudioCtx() : null);
            const actx = audioCtx || (window.AudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null);
            if (!actx) return;
            if (actx.state === "suspended") actx.resume();

            const now = actx.currentTime;

            if (type === "phase") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(750, now + 0.25);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === "node") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(580, now);
                osc.frequency.setValueAtTime(1050, now + 0.09);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === "rift_pass") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(450, now);
                osc.frequency.exponentialRampToValueAtTime(920, now + 0.18);
                gain.gain.setValueAtTime(0.16, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === "hit") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.26);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.26);
            } else if (type === "gameover") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.65);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.65);
            }
        } catch (e) {
            // Audio context fallback
        }
    }

    // -------------------------------------------------------------
    // Gating Check
    // -------------------------------------------------------------
    function isNeptuneUnlocked() {
        if (!window.player) return false;
        const list = window.player.unlockedPlanets || [];
        return list.includes("Neptune") || (window.player.journey && (window.player.journey.chapter || 1) >= 5);
    }

    // -------------------------------------------------------------
    // Background Kuiper Void Setup
    // -------------------------------------------------------------
    function initVoidEnvironment() {
        gameState.voidClouds = [];
        for (let i = 0; i < 7; i++) {
            gameState.voidClouds.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                radius: 65 + Math.random() * 55,
                color: Math.random() > 0.5 ? "rgba(30, 58, 138, 0.22)" : "rgba(14, 116, 144, 0.18)",
                speed: 0.4 + Math.random() * 0.4
            });
        }

        gameState.quantumStars = [];
        for (let i = 0; i < 50; i++) {
            gameState.quantumStars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: Math.random() * 2 + 0.7,
                speedY: 1.2 + Math.random() * 2.2,
                alpha: Math.random() * 0.7 + 0.3,
                twinkle: Math.random() * Math.PI * 2
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
            addFloatingText("KUIPER SURGE DETECTED!", gameState.ship.x, gameState.ship.y - 35, "#38bdf8");
            playNeptuneSound("phase");
        }
        gameState.speed = BASE_SPEED + (gameState.threatLevel - 1) * 0.22;

        const levelBadge = document.getElementById("neptuneVoidLevel");
        if (levelBadge) {
            levelBadge.textContent = `VOID SECTOR ${gameState.threatLevel}`;
        }
    }

    function resetNeptuneToBaseDifficulty() {
        gameState.score = 0;
        gameState.threatLevel = 1;
        gameState.lives = gameState.maxLives;
        gameState.speed = BASE_SPEED;
        gameState.distanceTraveled = 0;
        gameState.scoreAccumulator = 0;
        gameState.phaseEnergy = 100;
        gameState.isPhased = false;
        gameState.phaseDuration = 0;
        gameState.gameOver = false;
        gameState.paused = false;

        gameState.ship.x = CANVAS_WIDTH / 2;
        gameState.ship.y = CANVAS_HEIGHT - 95;
        gameState.ship.invulnerableTime = 0;

        gameState.obstacles = [];
        gameState.nodes = [];
        gameState.cores = [];
        gameState.particles = [];
        gameState.floatingTexts = [];
        gameState.shipEchoes = [];
        obstacleSpawnTimer = 0;
        nodeSpawnTimer = 0;
        coreSpawnTimer = 0;

        initVoidEnvironment();
        updateUI();

        const goModal = document.getElementById("neptuneVoidGameOver");
        if (goModal) goModal.classList.add("hidden");

        const pauseBtn = document.getElementById("neptuneVoidPauseBtn");
        if (pauseBtn) pauseBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">pause</span>`;

        console.log("Neptune Void Pulse: Reset to Base Difficulty (Sector 1, 3 Shields, 0 Score).");
    }

    // -------------------------------------------------------------
    // Spawners
    // -------------------------------------------------------------
    function spawnObstacle() {
        // Types: 'void_rift' (can be phased through for bonus points!), 'cryo_spire' (solid icy obstacle)
        const roll = Math.random();
        const type = roll < 0.6 ? "void_rift" : "cryo_spire";
        const minX = 45;
        const maxX = CANVAS_WIDTH - 45;
        const x = minX + Math.random() * (maxX - minX);

        if (type === "void_rift") {
            gameState.obstacles.push({
                x,
                y: -60,
                width: 52,
                height: 52,
                type: "void_rift",
                color: "#818cf8",
                pulse: 0,
                phasedThrough: false
            });
        } else {
            gameState.obstacles.push({
                x,
                y: -50,
                width: 32,
                height: 48,
                type: "cryo_spire",
                color: "#38bdf8",
                rotation: 0
            });
        }
    }

    function spawnResonanceNode() {
        const minX = 45;
        const maxX = CANVAS_WIDTH - 45;
        const x = minX + Math.random() * (maxX - minX);

        gameState.nodes.push({
            x,
            y: -30,
            size: 13,
            pulse: 0,
            color: "#38bdf8"
        });
    }

    function spawnQuantumCore() {
        const minX = 60;
        const maxX = CANVAS_WIDTH - 60;
        const x = minX + Math.random() * (maxX - minX);

        gameState.cores.push({
            x,
            y: -35,
            size: 18,
            rotation: 0,
            color: "#818cf8"
        });
    }

    // -------------------------------------------------------------
    // Phase Shift Mechanic
    // -------------------------------------------------------------
    function triggerPhaseShift() {
        if (gameState.isPhased || gameState.gameOver || gameState.paused) return;
        if (gameState.phaseEnergy < 35) {
            addFloatingText("RECHARGING PHASE...", gameState.ship.x, gameState.ship.y - 30, "#94a3b8");
            return;
        }

        gameState.isPhased = true;
        gameState.phaseDuration = 2.0; // 2.0 seconds of intangibility
        gameState.phaseEnergy -= 40;
        playNeptuneSound("phase");
        addFloatingText("PHASE SHIFT ACTIVE!", gameState.ship.x, gameState.ship.y - 35, "#38bdf8");

        // Phase flash burst
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            gameState.particles.push({
                x: gameState.ship.x,
                y: gameState.ship.y,
                vx: Math.cos(angle) * 4.5,
                vy: Math.sin(angle) * 4.5,
                color: "#38bdf8",
                size: 3.5,
                life: 1.0,
                decay: 0.04
            });
        }
    }

    function addFloatingText(text, x, y, color = "#38bdf8") {
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
        if (gameState.keys.left) {
            gameState.ship.x -= gameState.ship.speedX;
        }
        if (gameState.keys.right) {
            gameState.ship.x += gameState.ship.speedX;
        }
        if (gameState.keys.up) {
            gameState.ship.y -= gameState.ship.speedY;
        }
        if (gameState.keys.down) {
            gameState.ship.y += gameState.ship.speedY;
        }

        // Clamp inside canvas
        const padX = 28;
        gameState.ship.x = Math.max(padX, Math.min(CANVAS_WIDTH - padX, gameState.ship.x));
        gameState.ship.y = Math.max(140, Math.min(CANVAS_HEIGHT - 45, gameState.ship.y));

        // Phase Energy Recharge
        if (!gameState.isPhased && gameState.phaseEnergy < 100) {
            gameState.phaseEnergy = Math.min(100, gameState.phaseEnergy + (dt / 1000) * 22); // Recharges in ~4.5s
        }

        // Phase Duration Count
        if (gameState.isPhased) {
            gameState.phaseDuration -= dt / 1000;

            // Spawn holographic trailing echo
            if (Math.random() < 0.35) {
                gameState.shipEchoes.push({
                    x: gameState.ship.x,
                    y: gameState.ship.y,
                    alpha: 0.55
                });
            }

            if (gameState.phaseDuration <= 0) {
                gameState.isPhased = false;
                addFloatingText("RE-MATERIALIZED", gameState.ship.x, gameState.ship.y - 25, "#818cf8");
            }
        }

        // Update Echoes
        for (let i = gameState.shipEchoes.length - 1; i >= 0; i--) {
            const echo = gameState.shipEchoes[i];
            echo.y += gameState.speed * 0.5;
            echo.alpha -= 0.035;
            if (echo.alpha <= 0) {
                gameState.shipEchoes.splice(i, 1);
            }
        }

        // Invulnerability
        if (gameState.ship.invulnerableTime > 0) {
            gameState.ship.invulnerableTime -= dt;
        }

        // Distance & smooth score accumulation
        gameState.distanceTraveled += gameState.speed * (dt / 1000) * 16;
        gameState.scoreAccumulator += gameState.speed * (dt / 1000) * 8.5;
        if (gameState.scoreAccumulator >= 1) {
            const added = Math.floor(gameState.scoreAccumulator);
            gameState.score += added;
            gameState.scoreAccumulator -= added;
            updateDifficulty();
        }

        // Update Void Clouds
        gameState.voidClouds.forEach(c => {
            c.y += c.speed + gameState.speed * 0.4;
            if (c.y > CANVAS_HEIGHT + c.radius) {
                c.y = -c.radius;
                c.x = Math.random() * CANVAS_WIDTH;
            }
        });

        // Update Quantum Stars
        gameState.quantumStars.forEach(s => {
            s.y += s.speedY + gameState.speed * 0.6;
            s.twinkle += 0.06;
            if (s.y > CANVAS_HEIGHT + 5) {
                s.y = -5;
                s.x = Math.random() * CANVAS_WIDTH;
            }
        });

        // Spawn Timers
        obstacleSpawnTimer += dt;
        const currentObsInterval = Math.max(780, BASE_OBSTACLE_INTERVAL - (gameState.threatLevel - 1) * 85);
        if (obstacleSpawnTimer >= currentObsInterval) {
            obstacleSpawnTimer = 0;
            spawnObstacle();
        }

        nodeSpawnTimer += dt;
        if (nodeSpawnTimer >= 1500) {
            nodeSpawnTimer = 0;
            spawnResonanceNode();
        }

        coreSpawnTimer += dt;
        if (coreSpawnTimer >= 4800) {
            coreSpawnTimer = 0;
            spawnQuantumCore();
        }

        // Update Nodes
        for (let i = gameState.nodes.length - 1; i >= 0; i--) {
            const n = gameState.nodes[i];
            n.y += gameState.speed;
            n.pulse += 0.08;

            const dist = Math.hypot(gameState.ship.x - n.x, gameState.ship.y - n.y);
            if (dist < 26) {
                gameState.nodes.splice(i, 1);
                gameState.score += 35;
                if (window.player) {
                    window.player.credits = (window.player.credits || 0) + 1;
                }
                addFloatingText("+35 RESONANCE", n.x, n.y, "#38bdf8");
                playNeptuneSound("node");

                for (let p = 0; p < 10; p++) {
                    gameState.particles.push({
                        x: n.x,
                        y: n.y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        color: "#38bdf8",
                        size: 3,
                        life: 1.0,
                        decay: 0.05
                    });
                }
                continue;
            }

            if (n.y > CANVAS_HEIGHT + 30) {
                gameState.nodes.splice(i, 1);
            }
        }

        // Update Cores
        for (let i = gameState.cores.length - 1; i >= 0; i--) {
            const c = gameState.cores[i];
            c.y += gameState.speed;
            c.rotation += 0.05;

            const dist = Math.hypot(gameState.ship.x - c.x, gameState.ship.y - c.y);
            if (dist < 30) {
                gameState.cores.splice(i, 1);
                gameState.score += 100;
                gameState.phaseEnergy = 100; // Instantly refill phase power!
                addFloatingText("QUANTUM CORE! PHASE FULL!", c.x, c.y, "#818cf8");
                playNeptuneSound("node");

                for (let p = 0; p < 16; p++) {
                    gameState.particles.push({
                        x: c.x,
                        y: c.y,
                        vx: (Math.random() - 0.5) * 5,
                        vy: (Math.random() - 0.5) * 5,
                        color: "#818cf8",
                        size: 4,
                        life: 1.0,
                        decay: 0.04
                    });
                }
                continue;
            }

            if (c.y > CANVAS_HEIGHT + 30) {
                gameState.cores.splice(i, 1);
            }
        }

        // Update Obstacles & Collisions
        for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
            const obs = gameState.obstacles[i];
            obs.y += gameState.speed;
            if (obs.pulse !== undefined) obs.pulse += 0.07;

            const shipBox = {
                x: gameState.ship.x - gameState.ship.width / 2 + 3,
                y: gameState.ship.y - gameState.ship.height / 2 + 3,
                w: gameState.ship.width - 6,
                h: gameState.ship.height - 6
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

            if (isOverlap) {
                if (gameState.isPhased) {
                    // Intangible! Phase through safely and earn bonus!
                    if (!obs.phasedThrough) {
                        obs.phasedThrough = true;
                        gameState.score += 75;
                        addFloatingText("RIFT PHASE! +75", obs.x, obs.y, "#38bdf8");
                        playNeptuneSound("rift_pass");

                        for (let p = 0; p < 12; p++) {
                            gameState.particles.push({
                                x: obs.x,
                                y: obs.y,
                                vx: (Math.random() - 0.5) * 4,
                                vy: (Math.random() - 0.5) * 4,
                                color: "#818cf8",
                                size: 3.5,
                                life: 1.0,
                                decay: 0.04
                            });
                        }
                    }
                } else if (gameState.ship.invulnerableTime <= 0) {
                    // Solid Collision!
                    gameState.obstacles.splice(i, 1);
                    handleCollision(obs.x, obs.y);
                    continue;
                }
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
        gameState.ship.invulnerableTime = 1400; // ms
        playNeptuneSound("hit");
        addFloatingText("VOID SHIELD BREACHED!", gameState.ship.x, gameState.ship.y - 25, "#ff5555");

        for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2.5 + Math.random() * 4;
            gameState.particles.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: Math.random() > 0.5 ? "#38bdf8" : "#818cf8",
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
        playNeptuneSound("gameover");

        if (window.player) {
            if (gameState.score > (window.player.neptuneVoidHighScore || 0)) {
                window.player.neptuneVoidHighScore = gameState.score;
                if (typeof savePlayer === "function") savePlayer(window.player);
            }
            gameState.highScore = window.player.neptuneVoidHighScore || 0;
        }

        const goModal = document.getElementById("neptuneVoidGameOver");
        const finalScore = document.getElementById("neptuneVoidFinalScore");
        const finalHigh = document.getElementById("neptuneVoidFinalHighScore");
        const finalSector = document.getElementById("neptuneVoidFinalSector");

        if (finalScore) finalScore.textContent = gameState.score.toLocaleString();
        if (finalHigh) finalHigh.textContent = (window.player ? window.player.neptuneVoidHighScore || 0 : gameState.score).toLocaleString();
        if (finalSector) finalSector.textContent = `Void Sector ${gameState.threatLevel}`;
        if (goModal) goModal.classList.remove("hidden");

        if (typeof renderHUD === "function") renderHUD();
    }

    // -------------------------------------------------------------
    // Rendering Engine
    // -------------------------------------------------------------
    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Deep Kuiper Void Atmosphere
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, "#030712");
        bgGrad.addColorStop(0.5, "#0b1329");
        bgGrad.addColorStop(1, "#02040a");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Nebula Clouds
        gameState.voidClouds.forEach(c => {
            const radGrad = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, c.radius);
            radGrad.addColorStop(0, c.color);
            radGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Quantum Stars
        gameState.quantumStars.forEach(s => {
            ctx.save();
            ctx.fillStyle = "#38bdf8";
            ctx.globalAlpha = Math.min(1, s.alpha * (0.6 + Math.sin(s.twinkle) * 0.4));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw Echoes (Phase trails)
        gameState.shipEchoes.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.globalAlpha = Math.max(0, e.alpha);
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.5;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.moveTo(0, -22);
            ctx.lineTo(14, 8);
            ctx.lineTo(18, 20);
            ctx.lineTo(0, 16);
            ctx.lineTo(-18, 20);
            ctx.lineTo(-14, 8);
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        });
        ctx.globalAlpha = 1.0;

        // Draw Nodes
        gameState.nodes.forEach(n => {
            ctx.save();
            ctx.translate(n.x, n.y);

            const glow = 14 + Math.sin(n.pulse) * 3;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = glow;
            ctx.fillStyle = "#38bdf8";
            ctx.beginPath();
            ctx.arc(0, 0, n.size * 0.65, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(0, 0, n.size * 0.25, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        // Draw Quantum Cores
        gameState.cores.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);

            ctx.shadowColor = "#818cf8";
            ctx.shadowBlur = 12;
            ctx.strokeStyle = "#818cf8";
            ctx.lineWidth = 2.5;

            // Diamond prism
            ctx.strokeRect(-c.size / 2, -c.size / 2, c.size, c.size);

            ctx.fillStyle = "#c084fc";
            ctx.beginPath();
            ctx.arc(0, 0, c.size * 0.35, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        // Draw Obstacles
        gameState.obstacles.forEach(obs => {
            ctx.save();
            ctx.translate(obs.x, obs.y);

            if (obs.type === "void_rift") {
                // Swirling Void Rift
                const pulseRadius = obs.width / 2 + Math.sin(obs.pulse) * 4;
                const riftGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, pulseRadius);
                riftGrad.addColorStop(0, "#09090b");
                riftGrad.addColorStop(0.6, "rgba(99, 102, 241, 0.4)");
                riftGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
                ctx.fillStyle = riftGrad;
                ctx.beginPath();
                ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = obs.phasedThrough ? "rgba(56, 189, 248, 0.3)" : "#818cf8";
                ctx.lineWidth = 2;
                ctx.shadowColor = "#818cf8";
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, 0, obs.width / 2 - 4, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = "#818cf8";
                ctx.font = "bold 9px monospace";
                ctx.textAlign = "center";
                ctx.fillText("VOID RIFT", 0, 3);
            } else {
                // Methane Cryo-Spire
                ctx.shadowColor = "#38bdf8";
                ctx.shadowBlur = 8;
                ctx.fillStyle = "#0c2744";
                ctx.strokeStyle = "#38bdf8";
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.moveTo(0, -obs.height / 2);
                ctx.lineTo(obs.width / 2, obs.height / 2);
                ctx.lineTo(0, obs.height / 2 - 6);
                ctx.lineTo(-obs.width / 2, obs.height / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            ctx.restore();
        });

        // Draw Ship (Neptune Void Sovereign)
        const ship = gameState.ship;
        const isFlicker = ship.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0;

        if (!isFlicker) {
            ctx.save();
            ctx.translate(ship.x, ship.y);

            // Phase State Visuals
            if (gameState.isPhased) {
                ctx.globalAlpha = 0.55; // Ethereal / Intangible
            }

            // Dark Matter Nacelle Plumes
            const flameLen = (gameState.isPhased ? 26 : 16) + Math.random() * 5;
            ctx.fillStyle = gameState.isPhased ? "#818cf8" : "#38bdf8";
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 12;

            // Left engine
            ctx.beginPath();
            ctx.moveTo(-10, 18);
            ctx.lineTo(-6, 18 + flameLen);
            ctx.lineTo(-2, 18);
            ctx.closePath();
            ctx.fill();

            // Right engine
            ctx.beginPath();
            ctx.moveTo(2, 18);
            ctx.lineTo(6, 18 + flameLen);
            ctx.lineTo(10, 18);
            ctx.closePath();
            ctx.fill();

            // Hull
            ctx.fillStyle = "#081b2f";
            ctx.strokeStyle = gameState.isPhased ? "#818cf8" : "#38bdf8";
            ctx.lineWidth = 2.2;

            ctx.beginPath();
            ctx.moveTo(0, -24);  // Needle nose
            ctx.lineTo(14, 6);   // Right wing
            ctx.lineTo(18, 20);  // Right nacelle
            ctx.lineTo(6, 15);
            ctx.lineTo(0, 19);   // Center engine
            ctx.lineTo(-6, 15);
            ctx.lineTo(-18, 20); // Left nacelle
            ctx.lineTo(-14, 6);  // Left wing
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cockpit Core
            ctx.fillStyle = "#38bdf8";
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(0, -3, 4, 0, Math.PI * 2);
            ctx.fill();

            // Phase / Invulnerability Aura
            if (gameState.isPhased || ship.invulnerableTime > 0) {
                ctx.strokeStyle = gameState.isPhased ? "rgba(129, 140, 248, 0.9)" : "rgba(56, 189, 248, 0.9)";
                ctx.lineWidth = 2.5;
                ctx.shadowColor = gameState.isPhased ? "#818cf8" : "#38bdf8";
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(0, 0, 28, 0, Math.PI * 2);
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
        const scoreEl = document.getElementById("neptuneVoidScore");
        const highEl = document.getElementById("neptuneVoidHighScore");
        const shieldsEl = document.getElementById("neptuneVoidShields");
        const phaseBar = document.getElementById("neptunePhaseBar");

        if (scoreEl) scoreEl.textContent = gameState.score.toLocaleString();
        if (highEl) {
            const best = window.player ? Math.max(gameState.score, window.player.neptuneVoidHighScore || 0) : gameState.score;
            highEl.textContent = best.toLocaleString();
        }

        if (shieldsEl) {
            let pips = "";
            for (let i = 0; i < gameState.maxLives; i++) {
                if (i < gameState.lives) {
                    pips += `<span class="material-symbols-outlined text-[16px] text-[#38bdf8]">shield</span>`;
                } else {
                    pips += `<span class="material-symbols-outlined text-[16px] text-white/20">shield_with_heart</span>`;
                }
            }
            shieldsEl.innerHTML = pips;
        }

        if (phaseBar) {
            phaseBar.style.width = `${Math.min(100, Math.max(0, gameState.phaseEnergy))}%`;
            if (gameState.isPhased) {
                phaseBar.className = "h-full rounded-full bg-[#818cf8] shadow-[0_0_10px_#818cf8] transition-all animate-pulse";
            } else {
                phaseBar.className = "h-full rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] transition-all";
            }
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
    function openNeptuneVoid() {
        if (!isNeptuneUnlocked()) {
            if (typeof showToast === "function") {
                showToast("Reach Neptune to unlock Void Sovereign!", "warning");
            }
            return;
        }

        const modal = document.getElementById("neptuneVoidModal");
        if (!modal) return;
        modal.classList.remove("hidden");
        modal.classList.add("flex");

        if (!canvas) {
            canvas = document.getElementById("neptuneVoidCanvas");
            if (canvas) ctx = canvas.getContext("2d");
        }

        resetNeptuneToBaseDifficulty();
        gameState.active = true;
        lastTime = performance.now();
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = requestAnimationFrame(loop);
    }

    function closeNeptuneVoid() {
        gameState.active = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = null;

        const modal = document.getElementById("neptuneVoidModal");
        if (modal) {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
        }

        if (typeof renderHUD === "function") renderHUD();
    }

    function togglePauseNeptuneVoid() {
        if (!gameState.active || gameState.gameOver) return;
        gameState.paused = !gameState.paused;

        const pauseBtn = document.getElementById("neptuneVoidPauseBtn");
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
                triggerPhaseShift();
                e.preventDefault();
            } else if (e.code === "KeyP") {
                togglePauseNeptuneVoid();
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
        const btnLeft = document.getElementById("btnNeptuneLeft");
        const btnRight = document.getElementById("btnNeptuneRight");
        const btnPhase = document.getElementById("btnNeptunePhase");

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

        if (btnPhase) {
            btnPhase.addEventListener("click", () => triggerPhaseShift());
            btnPhase.addEventListener("touchstart", (e) => { e.preventDefault(); triggerPhaseShift(); });
        }
    }

    // Expose API globally
    window.isNeptuneUnlocked = isNeptuneUnlocked;
    window.openNeptuneVoid = openNeptuneVoid;
    window.closeNeptuneVoid = closeNeptuneVoid;
    window.togglePauseNeptuneVoid = togglePauseNeptuneVoid;
    window.restartNeptuneVoid = resetNeptuneToBaseDifficulty;

    document.addEventListener("DOMContentLoaded", () => {
        canvas = document.getElementById("neptuneVoidCanvas");
        if (canvas) ctx = canvas.getContext("2d");
        setupInputs();
        setupMobileControls();
    });
})();
