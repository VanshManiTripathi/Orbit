// ORBIT // Luna Defender: Lunar Orbit Space Shooter Minigame
// Gated exclusively behind Moon arrival. Features progressive difficulty,
// persistent High Score tracking, and resets to base difficulty upon destruction.

(function () {
    // Game Configuration & State
    const CANVAS_WIDTH = 400;
    const CANVAS_HEIGHT = 560;

    let canvas, ctx;
    let animFrameId = null;
    let lastTime = 0;
    let spawnTimer = 0;

    // Base difficulty parameters
    const BASE_SPAWN_INTERVAL = 1350; // ms between enemy spawns at level 1
    const BASE_ENEMY_SPEED_MIN = 1.6;
    const BASE_ENEMY_SPEED_MAX = 2.4;

    const gameState = {
        active: false,
        paused: false,
        gameOver: false,
        score: 0,
        highScore: 0,
        threatLevel: 1,
        lives: 3,
        maxLives: 3,
        powerUp: null, // 'twin' | null
        powerUpTimer: 0,
        autoFire: true,
        lastShotTime: 0,
        fireRate: 200, // ms between shots
        player: {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 65,
            width: 34,
            height: 38,
            speed: 5.5,
            vx: 0,
            vy: 0,
            invulnerableTime: 0
        },
        bullets: [],
        enemies: [],
        particles: [],
        floatingTexts: [],
        stars: [],
        keys: {
            left: false,
            right: false,
            up: false,
            down: false,
            fire: false
        }
    };

    // -------------------------------------------------------------
    // Audio Synthesizer Integration
    // -------------------------------------------------------------
    function playShooterSound(type) {
        if (!window.player || window.player.soundEnabled === false) return;
        try {
            if (typeof initAudio === "function") initAudio();
            const audioCtx = window.audioCtx || (typeof getAudioCtx === "function" ? getAudioCtx() : null);
            const actx = audioCtx || (window.AudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null);
            if (!actx) return;
            if (actx.state === "suspended") actx.resume();

            const now = actx.currentTime;

            if (type === "laser") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === "twin_laser") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "square";
                osc.frequency.setValueAtTime(1100, now);
                osc.frequency.exponentialRampToValueAtTime(220, now + 0.14);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.14);
            } else if (type === "hit") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === "explosion") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                const filter = actx.createBiquadFilter();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
                filter.type = "lowpass";
                filter.frequency.setValueAtTime(450, now);
                filter.frequency.exponentialRampToValueAtTime(60, now + 0.35);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === "powerup") {
                [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                    const osc = actx.createOscillator();
                    const gain = actx.createGain();
                    const st = now + idx * 0.05;
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, st);
                    gain.gain.setValueAtTime(0.18, st);
                    gain.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
                    osc.connect(gain);
                    gain.connect(actx.destination);
                    osc.start(st);
                    osc.stop(st + 0.2);
                });
            } else if (type === "player_hit") {
                const osc = actx.createOscillator();
                const gain = actx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.linearRampToValueAtTime(70, now + 0.25);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(actx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === "game_over") {
                [330, 293.66, 261.63, 196].forEach((freq, idx) => {
                    const osc = actx.createOscillator();
                    const gain = actx.createGain();
                    const st = now + idx * 0.12;
                    osc.type = "sawtooth";
                    osc.frequency.setValueAtTime(freq, st);
                    gain.gain.setValueAtTime(0.22, st);
                    gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
                    osc.connect(gain);
                    gain.connect(actx.destination);
                    osc.start(st);
                    osc.stop(st + 0.35);
                });
            }
        } catch (e) {
            // Audio context fallback safe
        }
    }

    // -------------------------------------------------------------
    // Starfield Background
    // -------------------------------------------------------------
    function initStars() {
        gameState.stars = [];
        for (let i = 0; i < 65; i++) {
            gameState.stars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                speed: Math.random() * 1.8 + 0.4,
                radius: Math.random() * 1.6 + 0.4,
                alpha: Math.random() * 0.8 + 0.2,
                color: Math.random() > 0.8 ? "#d0bcff" : (Math.random() > 0.6 ? "#00f0ff" : "#ffffff")
            });
        }
    }

    function updateStars(dt) {
        const factor = dt / 16;
        gameState.stars.forEach(s => {
            s.y += s.speed * factor;
            if (s.y > CANVAS_HEIGHT) {
                s.y = 0;
                s.x = Math.random() * CANVAS_WIDTH;
            }
        });
    }

    function renderStars() {
        gameState.stars.forEach(s => {
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }

    // -------------------------------------------------------------
    // Player Ship Logic & Rendering
    // -------------------------------------------------------------
    function updatePlayer(dt) {
        const p = gameState.player;
        const factor = dt / 16;

        // Horizontal & Vertical bounds
        let moveX = 0;
        let moveY = 0;

        if (gameState.keys.left) moveX -= 1;
        if (gameState.keys.right) moveX += 1;
        if (gameState.keys.up) moveY -= 1;
        if (gameState.keys.down) moveY += 1;

        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071;
            moveY *= 0.7071;
        }

        p.x += moveX * p.speed * factor;
        p.y += moveY * p.speed * factor;

        // Clamp to canvas borders (keep in bottom 60% of arena)
        const halfW = p.width / 2;
        p.x = Math.max(halfW + 4, Math.min(CANVAS_WIDTH - halfW - 4, p.x));
        p.y = Math.max(CANVAS_HEIGHT * 0.35, Math.min(CANVAS_HEIGHT - p.height / 2 - 12, p.y));

        if (p.invulnerableTime > 0) {
            p.invulnerableTime -= dt;
        }

        // Auto or manual firing
        const now = performance.now();
        if ((gameState.autoFire || gameState.keys.fire) && now - gameState.lastShotTime >= gameState.fireRate) {
            shootLaser();
            gameState.lastShotTime = now;
        }

        // Power-up countdown
        if (gameState.powerUpTimer > 0) {
            gameState.powerUpTimer -= dt;
            if (gameState.powerUpTimer <= 0) {
                gameState.powerUp = null;
                updateShooterHUD();
            }
        }
    }

    function shootLaser() {
        const p = gameState.player;
        if (gameState.powerUp === "twin") {
            // Twin blasters
            gameState.bullets.push({
                x: p.x - 10,
                y: p.y - 18,
                vx: 0,
                vy: -9.5,
                radius: 3.5,
                color: "#d0bcff",
                power: 1.2
            });
            gameState.bullets.push({
                x: p.x + 10,
                y: p.y - 18,
                vx: 0,
                vy: -9.5,
                radius: 3.5,
                color: "#d0bcff",
                power: 1.2
            });
            playShooterSound("twin_laser");
        } else {
            // Standard laser
            gameState.bullets.push({
                x: p.x,
                y: p.y - 20,
                vx: 0,
                vy: -9,
                radius: 3,
                color: "#00f0ff",
                power: 1.0
            });
            playShooterSound("laser");
        }
    }

    function renderPlayer() {
        const p = gameState.player;

        // Invulnerability flicker
        if (p.invulnerableTime > 0 && Math.floor(p.invulnerableTime / 80) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        ctx.save();
        ctx.translate(p.x, p.y);

        // Thruster flame
        const flameLength = Math.random() * 8 + 12;
        const grad = ctx.createLinearGradient(0, 16, 0, 16 + flameLength);
        grad.addColorStop(0, "#00f0ff");
        grad.addColorStop(0.5, "#d0bcff");
        grad.addColorStop(1, "transparent");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-6, 16);
        ctx.lineTo(0, 16 + flameLength);
        ctx.lineTo(6, 16);
        ctx.closePath();
        ctx.fill();

        // Ship Body - Sleek Lunar Interceptor
        ctx.fillStyle = "#1e243b";
        ctx.strokeStyle = gameState.powerUp === "twin" ? "#d0bcff" : "#00f0ff";
        ctx.lineWidth = 2;
        ctx.shadowColor = gameState.powerUp === "twin" ? "#d0bcff" : "#00f0ff";
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(0, -19); // Nose
        ctx.lineTo(16, 15); // Right wing tip
        ctx.lineTo(8, 11);  // Right inner notch
        ctx.lineTo(0, 15);  // Engine center
        ctx.lineTo(-8, 11); // Left inner notch
        ctx.lineTo(-16, 15);// Left wing tip
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit canopy glow
        ctx.fillStyle = gameState.powerUp === "twin" ? "#e9ddff" : "#dbfcff";
        ctx.beginPath();
        ctx.ellipse(0, -4, 4.5, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wingtip canons
        ctx.fillStyle = "#00f0ff";
        ctx.fillRect(-16, 8, 3, 5);
        ctx.fillRect(13, 8, 3, 5);

        // Shield aura if invulnerable
        if (p.invulnerableTime > 0) {
            ctx.strokeStyle = "rgba(208, 188, 255, 0.7)";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
        ctx.globalAlpha = 1.0;
    }

    // -------------------------------------------------------------
    // Enemies & Dynamic Difficulty Scaling
    // -------------------------------------------------------------
    function updateDifficulty() {
        // Base difficulty = Level 1 (0 to 99 pts).
        // Each 100 points increases threat level!
        const newLevel = Math.floor(gameState.score / 100) + 1;
        if (newLevel !== gameState.threatLevel) {
            gameState.threatLevel = newLevel;
            addFloatingText(CANVAS_WIDTH / 2, 180, `THREAT LEVEL ${gameState.threatLevel}!`, "#d0bcff", 22);
            playShooterSound("powerup");
            updateShooterHUD();
        }
    }

    function spawnEnemy() {
        // Spawn rate scales with threat level:
        // Base = 1350ms, decreasing down to min 420ms
        const speedBoost = (gameState.threatLevel - 1) * 0.32;

        const x = Math.random() * (CANVAS_WIDTH - 60) + 30;
        const roll = Math.random();

        // Enemy Types based on Threat Level
        let type = "asteroid";
        let hp = 1;
        let points = 10;
        let radius = 16;
        let speed = Math.random() * (BASE_ENEMY_SPEED_MAX - BASE_ENEMY_SPEED_MIN) + BASE_ENEMY_SPEED_MIN + speedBoost;
        let color = "#b9cacb";

        if (gameState.threatLevel >= 3 && roll < 0.28) {
            // Armored Cyber Interceptor
            type = "interceptor";
            hp = 2;
            points = 45;
            radius = 20;
            speed = Math.max(1.5, speed * 0.85);
            color = "#ff5555";
        } else if (gameState.threatLevel >= 2 && roll < 0.6) {
            // Fast Zigzag Scout Drone
            type = "scout";
            hp = 1;
            points = 25;
            radius = 13;
            speed = speed * 1.25;
            color = "#ffd19c";
        }

        gameState.enemies.push({
            type,
            x,
            y: -radius - 5,
            startX: x,
            radius,
            hp,
            maxHp: hp,
            points,
            speed,
            color,
            t: 0,
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.05
        });
    }

    function updateEnemies(dt) {
        const factor = dt / 16;
        const p = gameState.player;

        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const e = gameState.enemies[i];
            e.t += dt * 0.003;
            e.angle += e.rotSpeed * factor;

            // Movement logic by type
            if (e.type === "scout") {
                e.y += e.speed * factor;
                e.x = e.startX + Math.sin(e.t * 3) * 45;
            } else if (e.type === "interceptor") {
                e.y += e.speed * factor;
                e.x = e.startX + Math.cos(e.t * 1.5) * 20;
            } else {
                e.y += e.speed * factor;
            }

            // Keep within bounds
            e.x = Math.max(e.radius, Math.min(CANVAS_WIDTH - e.radius, e.x));

            // Collision with Player
            if (p.invulnerableTime <= 0 && !gameState.gameOver) {
                const dist = Math.hypot(e.x - p.x, e.y - p.y);
                if (dist < e.radius + p.width * 0.35) {
                    // Player hit!
                    triggerExplosion(e.x, e.y, "#ff5555", 16);
                    gameState.enemies.splice(i, 1);
                    playerTakeDamage();
                    continue;
                }
            }

            // Removed if past screen
            if (e.y > CANVAS_HEIGHT + e.radius + 20) {
                gameState.enemies.splice(i, 1);
            }
        }
    }

    function renderEnemies() {
        gameState.enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.angle);

            if (e.type === "asteroid") {
                // Craggy Asteroid Polygon
                ctx.fillStyle = "#2c303f";
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                const points = 7;
                for (let j = 0; j < points; j++) {
                    const a = (j / points) * Math.PI * 2;
                    const r = e.radius * (0.8 + ((j % 3) * 0.15));
                    const px = Math.cos(a) * r;
                    const py = Math.sin(a) * r;
                    if (j === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Crater details
                ctx.fillStyle = "rgba(0,0,0,0.3)";
                ctx.beginPath();
                ctx.arc(e.radius * 0.25, e.radius * 0.2, e.radius * 0.25, 0, Math.PI * 2);
                ctx.fill();
            } else if (e.type === "scout") {
                // Sleek Amber Scout Drone
                ctx.fillStyle = "#352b1b";
                ctx.strokeStyle = "#ffd19c";
                ctx.shadowColor = "#ffd19c";
                ctx.shadowBlur = 8;
                ctx.lineWidth = 1.8;

                ctx.beginPath();
                ctx.moveTo(0, e.radius);
                ctx.lineTo(e.radius, -e.radius);
                ctx.lineTo(0, -e.radius * 0.5);
                ctx.lineTo(-e.radius, -e.radius);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Red drone eye
                ctx.fillStyle = "#ff5555";
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (e.type === "interceptor") {
                // Heavy Hex Cyber Interceptor
                ctx.fillStyle = "#3a171b";
                ctx.strokeStyle = "#ff5555";
                ctx.shadowColor = "#ff5555";
                ctx.shadowBlur = 12;
                ctx.lineWidth = 2;

                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                    const ang = (k / 6) * Math.PI * 2;
                    const hx = Math.cos(ang) * e.radius;
                    const hy = Math.sin(ang) * e.radius;
                    if (k === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Shield health bar if damaged
                if (e.hp < e.maxHp) {
                    ctx.fillStyle = "#ff5555";
                    ctx.fillRect(-12, -e.radius - 8, 24 * (e.hp / e.maxHp), 3);
                }
            }

            ctx.restore();
        });
    }

    // -------------------------------------------------------------
    // Bullets & Collision Handling
    // -------------------------------------------------------------
    function updateBullets(dt) {
        const factor = dt / 16;

        for (let bIdx = gameState.bullets.length - 1; bIdx >= 0; bIdx--) {
            const b = gameState.bullets[bIdx];
            b.x += b.vx * factor;
            b.y += b.vy * factor;

            // Check off-screen
            if (b.y < -10) {
                gameState.bullets.splice(bIdx, 1);
                continue;
            }

            // Bullet vs Enemy collisions
            let bulletHit = false;
            for (let eIdx = gameState.enemies.length - 1; eIdx >= 0; eIdx--) {
                const e = gameState.enemies[eIdx];
                const dist = Math.hypot(b.x - e.x, b.y - e.y);

                if (dist < e.radius + b.radius + 3) {
                    bulletHit = true;
                    e.hp -= b.power;
                    playShooterSound("hit");

                    // Small spark
                    createHitSparks(b.x, b.y, b.color);

                    if (e.hp <= 0) {
                        // Enemy Destroyed!
                        gameState.score += e.points;
                        playShooterSound("explosion");
                        triggerExplosion(e.x, e.y, e.color, e.type === "interceptor" ? 28 : 18);
                        addFloatingText(e.x, e.y, `+${e.points}`, "#00f0ff", 14);

                        // Random powerup drop (12% chance)
                        maybeSpawnPowerUp(e.x, e.y);

                        gameState.enemies.splice(eIdx, 1);
                        updateDifficulty();
                        updateShooterHUD();
                    }
                    break;
                }
            }

            if (bulletHit) {
                gameState.bullets.splice(bIdx, 1);
            }
        }
    }

    function renderBullets() {
        gameState.bullets.forEach(b => {
            ctx.save();
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();

            // Laser beam tail
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x, b.y + 10);
            ctx.stroke();

            ctx.restore();
        });
    }

    // -------------------------------------------------------------
    // Power-Ups & Collectibles
    // -------------------------------------------------------------
    const activePowerUps = [];

    function maybeSpawnPowerUp(x, y) {
        if (Math.random() < 0.12) {
            const types = ["shield", "twin"];
            const pType = types[Math.floor(Math.random() * types.length)];
            activePowerUps.push({
                type: pType,
                x,
                y,
                vy: 1.6,
                radius: 12,
                angle: 0
            });
        }
    }

    function updatePowerUps(dt) {
        const factor = dt / 16;
        const p = gameState.player;

        for (let i = activePowerUps.length - 1; i >= 0; i--) {
            const pu = activePowerUps[i];
            pu.y += pu.vy * factor;
            pu.angle += 0.04 * factor;

            // Player pickup collision
            const dist = Math.hypot(pu.x - p.x, pu.y - p.y);
            if (dist < pu.radius + p.width * 0.45) {
                if (pu.type === "shield") {
                    if (gameState.lives < gameState.maxLives) {
                        gameState.lives++;
                        addFloatingText(p.x, p.y - 25, "SHIELD REPAIRED! +1", "#00f0ff", 14);
                    } else {
                        gameState.score += 50;
                        addFloatingText(p.x, p.y - 25, "+50 BONUS!", "#ffd19c", 14);
                    }
                } else if (pu.type === "twin") {
                    gameState.powerUp = "twin";
                    gameState.powerUpTimer = 9000; // 9 seconds of twin blasters!
                    addFloatingText(p.x, p.y - 25, "TWIN BLASTERS READY!", "#d0bcff", 15);
                }

                playShooterSound("powerup");
                triggerExplosion(pu.x, pu.y, pu.type === "shield" ? "#00f0ff" : "#d0bcff", 14);
                activePowerUps.splice(i, 1);
                updateShooterHUD();
                continue;
            }

            if (pu.y > CANVAS_HEIGHT + 20) {
                activePowerUps.splice(i, 1);
            }
        }
    }

    function renderPowerUps() {
        activePowerUps.forEach(pu => {
            ctx.save();
            ctx.translate(pu.x, pu.y);
            ctx.rotate(pu.angle);

            const color = pu.type === "shield" ? "#00f0ff" : "#d0bcff";
            ctx.strokeStyle = color;
            ctx.fillStyle = "rgba(15, 19, 33, 0.85)";
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Icon
            ctx.fillStyle = color;
            ctx.font = "bold 10px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(pu.type === "shield" ? "🛡️" : "⚡", 0, 0);

            ctx.restore();
        });
    }

    // -------------------------------------------------------------
    // Particles & Explosions
    // -------------------------------------------------------------
    function triggerExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4.5 + 1.2;
            gameState.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 3 + 1.5,
                color,
                alpha: 1.0,
                decay: Math.random() * 0.03 + 0.02
            });
        }
    }

    function createHitSparks(x, y, color) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 0.5;
            gameState.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 1.5,
                color,
                alpha: 0.9,
                decay: 0.08
            });
        }
    }

    function updateParticles(dt) {
        const factor = dt / 16;
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const p = gameState.particles[i];
            p.x += p.vx * factor;
            p.y += p.vy * factor;
            p.alpha -= p.decay * factor;
            if (p.alpha <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
    }

    function renderParticles() {
        gameState.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        ctx.globalAlpha = 1.0;
    }

    // -------------------------------------------------------------
    // Floating Pop-up Text
    // -------------------------------------------------------------
    function addFloatingText(x, y, text, color = "#00f0ff", size = 14) {
        gameState.floatingTexts.push({
            x,
            y,
            text,
            color,
            size,
            alpha: 1.0,
            vy: -1.2
        });
    }

    function updateFloatingTexts(dt) {
        const factor = dt / 16;
        for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
            const ft = gameState.floatingTexts[i];
            ft.y += ft.vy * factor;
            ft.alpha -= 0.02 * factor;
            if (ft.alpha <= 0) {
                gameState.floatingTexts.splice(i, 1);
            }
        }
    }

    function renderFloatingTexts() {
        gameState.floatingTexts.forEach(ft => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.font = `bold ${ft.size}px 'Space Grotesk', sans-serif`;
            ctx.fillStyle = ft.color;
            ctx.textAlign = "center";
            ctx.shadowColor = ft.color;
            ctx.shadowBlur = 8;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        });
        ctx.globalAlpha = 1.0;
    }

    // -------------------------------------------------------------
    // Player Damage & Game Over
    // -------------------------------------------------------------
    function playerTakeDamage() {
        gameState.lives--;
        playShooterSound("player_hit");
        updateShooterHUD();

        if (gameState.lives > 0) {
            // Invulnerability window (1.8 seconds)
            gameState.player.invulnerableTime = 1800;
            addFloatingText(gameState.player.x, gameState.player.y - 25, "SHIELD HIT!", "#ff5555", 16);
        } else {
            // Player Destroyed - Game Over!
            handleGameOver();
        }
    }

    function handleGameOver() {
        gameState.gameOver = true;
        gameState.active = false;
        playShooterSound("game_over");
        triggerExplosion(gameState.player.x, gameState.player.y, "#00f0ff", 40);
        triggerExplosion(gameState.player.x, gameState.player.y, "#d0bcff", 30);

        // Check High Score
        let isNewRecord = false;
        const currentHigh = window.player ? (window.player.lunaShooterHighScore || 0) : gameState.highScore;
        if (gameState.score > currentHigh) {
            isNewRecord = true;
            gameState.highScore = gameState.score;
            if (window.player) {
                window.player.lunaShooterHighScore = gameState.score;
                // Optional achievement reward: 1 bonus credit per 25 pts on high score beat!
                const bonusCredits = Math.min(50, Math.floor(gameState.score / 25));
                if (bonusCredits > 0) {
                    window.player.credits = (window.player.credits || 0) + bonusCredits;
                }
                savePlayer(window.player);
            }
            if (typeof triggerParticleBurst === "function") {
                triggerParticleBurst();
            }
        }

        // Render Game Over Overlay
        const overlay = document.getElementById("lunaShooterGameOver");
        const finalScoreEl = document.getElementById("lunaShooterFinalScore");
        const highScoreEl = document.getElementById("lunaShooterBestScore");
        const recordBadge = document.getElementById("lunaShooterRecordBadge");
        const waveReachedEl = document.getElementById("lunaShooterWaveReached");

        if (finalScoreEl) finalScoreEl.textContent = gameState.score;
        if (highScoreEl) highScoreEl.textContent = gameState.highScore;
        if (waveReachedEl) waveReachedEl.textContent = `Threat Level ${gameState.threatLevel}`;
        if (recordBadge) {
            if (isNewRecord && gameState.score > 0) {
                recordBadge.classList.remove("hidden");
                recordBadge.textContent = "🏆 NEW ALL-TIME HIGH SCORE!";
            } else {
                recordBadge.classList.add("hidden");
            }
        }

        if (overlay) {
            overlay.classList.remove("hidden");
            overlay.classList.add("flex");
        }

        if (typeof renderHUD === "function") {
            renderHUD();
        }
    }

    // -------------------------------------------------------------
    // Reset to Base Difficulty (Crucial Requirement)
    // -------------------------------------------------------------
    function resetToBaseDifficulty() {
        gameState.gameOver = false;
        gameState.active = true;
        gameState.paused = false;
        gameState.score = 0;
        gameState.threatLevel = 1; // Strict Reset to Base Threat Level
        gameState.lives = gameState.maxLives;
        gameState.powerUp = null;
        gameState.powerUpTimer = 0;
        gameState.lastShotTime = 0;
        spawnTimer = 0;

        // Reset player position and invulnerability
        gameState.player.x = CANVAS_WIDTH / 2;
        gameState.player.y = CANVAS_HEIGHT - 65;
        gameState.player.invulnerableTime = 1200;

        // Clear active entities
        gameState.bullets = [];
        gameState.enemies = [];
        activePowerUps.length = 0;
        gameState.particles = [];
        gameState.floatingTexts = [];

        // Hide Game Over Screen
        const overlay = document.getElementById("lunaShooterGameOver");
        if (overlay) {
            overlay.classList.add("hidden");
            overlay.classList.remove("flex");
        }

        // Update High Score from player data
        if (window.player && typeof window.player.lunaShooterHighScore === "number") {
            gameState.highScore = window.player.lunaShooterHighScore;
        }

        updateShooterHUD();
        playShooterSound("laser");
    }

    // -------------------------------------------------------------
    // Main Game Loop (60 FPS)
    // -------------------------------------------------------------
    function gameLoop(timestamp) {
        if (!gameState.active || gameState.paused) {
            animFrameId = requestAnimationFrame(gameLoop);
            return;
        }

        if (!lastTime) lastTime = timestamp;
        const dt = Math.min(timestamp - lastTime, 64);
        lastTime = timestamp;

        // Spawn timer
        spawnTimer += dt;
        const currentSpawnInterval = Math.max(420, BASE_SPAWN_INTERVAL - (gameState.threatLevel - 1) * 125);
        if (spawnTimer >= currentSpawnInterval) {
            spawnEnemy();
            spawnTimer = 0;
        }

        // Updates
        updateStars(dt);
        updatePlayer(dt);
        updateBullets(dt);
        updateEnemies(dt);
        updatePowerUps(dt);
        updateParticles(dt);
        updateFloatingTexts(dt);

        // Render Canvas Frame
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Lunar Space Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        skyGrad.addColorStop(0, "#050816");
        skyGrad.addColorStop(0.75, "#0d1326");
        skyGrad.addColorStop(1, "#1c1538");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Moon Surface Horizon at bottom
        ctx.fillStyle = "rgba(208, 188, 255, 0.05)";
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT + 140, 220, 0, Math.PI * 2);
        ctx.fill();

        renderStars();
        renderBullets();
        renderPowerUps();
        renderEnemies();
        renderParticles();
        if (!gameState.gameOver) renderPlayer();
        renderFloatingTexts();

        animFrameId = requestAnimationFrame(gameLoop);
    }

    // -------------------------------------------------------------
    // DOM HUD Updates
    // -------------------------------------------------------------
    function updateShooterHUD() {
        const scoreEl = document.getElementById("lunaShooterScore");
        const highEl = document.getElementById("lunaShooterHigh");
        const levelEl = document.getElementById("lunaShooterLevel");
        const shieldsEl = document.getElementById("lunaShooterShields");
        const powerUpBadge = document.getElementById("lunaShooterPowerUpBadge");

        if (scoreEl) scoreEl.textContent = gameState.score;
        if (highEl) highEl.textContent = gameState.highScore;
        if (levelEl) levelEl.textContent = `WAVE ${gameState.threatLevel}`;

        if (shieldsEl) {
            let html = "";
            for (let i = 0; i < gameState.maxLives; i++) {
                if (i < gameState.lives) {
                    html += `<span class="material-symbols-outlined text-[18px] text-primary-container">shield</span>`;
                } else {
                    html += `<span class="material-symbols-outlined text-[18px] text-surface-container-highest opacity-40">shield</span>`;
                }
            }
            shieldsEl.innerHTML = html;
        }

        if (powerUpBadge) {
            if (gameState.powerUp === "twin") {
                powerUpBadge.classList.remove("hidden");
                const sec = Math.ceil(gameState.powerUpTimer / 1000);
                powerUpBadge.textContent = `⚡ TWIN BLASTERS (${sec}s)`;
            } else {
                powerUpBadge.classList.add("hidden");
            }
        }
    }

    // -------------------------------------------------------------
    // Moon Gating & Modal Controls
    // -------------------------------------------------------------
    function isMoonUnlocked() {
        if (!window.player) return false;
        const unlocked = window.player.unlockedPlanets || [];
        return unlocked.includes("Moon");
    }

    function openLunaShooter() {
        if (!isMoonUnlocked()) {
            if (typeof showToast === "function") {
                showToast("🔒 Locked! Reach the Moon first to unlock Luna Defender.", "error");
            }
            playShooterSound("player_hit");
            return;
        }

        const modal = document.getElementById("lunaShooterModal");
        if (!modal) return;

        modal.classList.remove("hidden");
        modal.classList.add("flex");

        // Init Canvas
        canvas = document.getElementById("lunaShooterCanvas");
        if (canvas) {
            ctx = canvas.getContext("2d");
            canvas.width = CANVAS_WIDTH;
            canvas.height = CANVAS_HEIGHT;
        }

        initStars();
        resetToBaseDifficulty();

        if (lastTime === 0) lastTime = performance.now();
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = requestAnimationFrame(gameLoop);
    }

    function closeLunaShooter() {
        gameState.active = false;
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }

        const modal = document.getElementById("lunaShooterModal");
        if (modal) {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
        }

        // Refresh main UI HUD to show updated high score
        if (typeof renderHUD === "function") {
            renderHUD();
        }
    }

    function togglePauseShooter() {
        gameState.paused = !gameState.paused;
        const pauseBtn = document.getElementById("lunaShooterPauseBtn");
        if (pauseBtn) {
            pauseBtn.textContent = gameState.paused ? "play_arrow" : "pause";
        }
    }

    // -------------------------------------------------------------
    // Input Handlers (Keyboard, Mouse, Touch)
    // -------------------------------------------------------------
    function setupInputs() {
        window.addEventListener("keydown", (e) => {
            if (!gameState.active) return;
            if (["ArrowLeft", "KeyA"].includes(e.code)) {
                gameState.keys.left = true;
            } else if (["ArrowRight", "KeyD"].includes(e.code)) {
                gameState.keys.right = true;
            } else if (["ArrowUp", "KeyW"].includes(e.code)) {
                gameState.keys.up = true;
            } else if (["ArrowDown", "KeyS"].includes(e.code)) {
                gameState.keys.down = true;
            } else if (e.code === "Space") {
                gameState.keys.fire = true;
                e.preventDefault();
            } else if (e.code === "Escape") {
                closeLunaShooter();
            }
        });

        window.addEventListener("keyup", (e) => {
            if (["ArrowLeft", "KeyA"].includes(e.code)) {
                gameState.keys.left = false;
            } else if (["ArrowRight", "KeyD"].includes(e.code)) {
                gameState.keys.right = false;
            } else if (["ArrowUp", "KeyW"].includes(e.code)) {
                gameState.keys.up = false;
            } else if (["ArrowDown", "KeyS"].includes(e.code)) {
                gameState.keys.down = false;
            } else if (e.code === "Space") {
                gameState.keys.fire = false;
            }
        });

        // Mouse & Pointer Drag on Canvas
        let isPointerDown = false;

        const getCanvasCoords = (e) => {
            if (!canvas) return null;
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width),
                y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
            };
        };

        const handlePointerMove = (e) => {
            if (!gameState.active || gameState.gameOver) return;
            const coords = getCanvasCoords(e);
            if (coords) {
                gameState.player.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, coords.x));
                gameState.player.y = Math.max(CANVAS_HEIGHT * 0.35, Math.min(CANVAS_HEIGHT - 30, coords.y));
            }
        };

        if (canvas) {
            canvas.addEventListener("pointerdown", (e) => {
                isPointerDown = true;
                handlePointerMove(e);
            });
            window.addEventListener("pointermove", (e) => {
                if (isPointerDown) handlePointerMove(e);
            });
            window.addEventListener("pointerup", () => {
                isPointerDown = false;
            });
        }
    }

    // Touch D-Pad / Arcade Buttons setup for mobile
    function setupMobileControls() {
        const btnLeft = document.getElementById("btnShooterLeft");
        const btnRight = document.getElementById("btnShooterRight");
        const btnFire = document.getElementById("btnShooterFire");

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
        addHoldListener(btnFire, () => { gameState.keys.fire = true; }, () => { gameState.keys.fire = false; });
    }

    // Expose Global API
    window.isMoonUnlocked = isMoonUnlocked;
    window.openLunaShooter = openLunaShooter;
    window.closeLunaShooter = closeLunaShooter;
    window.togglePauseShooter = togglePauseShooter;
    window.restartLunaShooter = resetToBaseDifficulty;

    document.addEventListener("DOMContentLoaded", () => {
        canvas = document.getElementById("lunaShooterCanvas");
        setupInputs();
        setupMobileControls();
    });

})();
