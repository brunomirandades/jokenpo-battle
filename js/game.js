class Game {
    constructor(canvas, teamSize, gameMode, speed, autoRestart) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.width = canvas.width;
        this.height = canvas.height;

        this.players = [];
        this.pendingConversions = [];

        this.speedMultiplier = speed;
        this.teamSize = teamSize;  // number of players in each team
        this.restartDelay = 5000;   // 5 seconds until new round

        this.gameOver = false;

        this.gameMode = gameMode;
        this.running = false;
        this.autoRestart = autoRestart;

        this.winnerType = null;
        this.winTime = 0;

        this.setUp();
    }

    setUp() {
        this.players.length = 0;
        this.gameOver = false;

        this.spawnTeam("rock");
        this.spawnTeam("paper");
        this.spawnTeam("scissors");
    }

    spawnTeam(type) {
        for (let i = 0; i < this.teamSize; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;

            this.players.push(new Player(i, x, y, type, this.speedMultiplier, this));
        }
    }

    update(dt) {
        // Update all players
        for (let i = this.players.length - 1; i >= 0; i--){
            const p = this.players[i];

            p.justConverted = false;
            p.update(dt);

            // Safety removal
            if (
                Number.isNaN(p.x) ||
                Number.isNaN(p.y) ||
                Number.isNaN(p.vx) ||
                Number.isNaN(p.vy)
            ) {
                console.log("NaN player removed", p.id);
                this.players.splice(i, 1);
            }
        }

        // Resolve fights
        this.handleCollisions();

        // Win detection
        this.checkWinCondition();
    }

    handleCollisions() {
        const players = this.players;

        for (let i = 0; i < players.length; i++) {
            const a = players[i];
            if (!a.alive) continue;

            for (let j = i + 1; j < players.length; j++) {
                const b = players[j];
                if (!b.alive) continue;

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.hypot(dx, dy);
                const minDist = a.radius + b.radius;

                if (dist < minDist) {
                    // 1. Separate (bounce)
                    this.bounce(a, b, dx, dy, dist, minDist);

                    this.resolveBattle(a, b);
                }
            }
        }

        if (this.gameMode === GAMEMODE.assimilation && this.pendingConversions.length > 0) {

            const map = new Map();

            for (const item of this.pendingConversions) {
                map.set(item.targetId, item); // last one wins
            }

            const result = Array.from(map.values());

            for (const c of result) {
                c.target.convertTo(c.type);
            }

            this.pendingConversions.length = 0;
        }
    }

    bounce(a, b, dx, dy, dist, minDist) {
        dist = Math.max(0.01, dist);
        const overlap = minDist - dist;

        // Normalized collision normal
        const nx = dx / dist;
        const ny = dy / dist;

        // Push apart
        const push = overlap * 0.5;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;

        // Velocity deflection (fake physics)
        const dvx = b.vx - a.vx;
        const dvy = b.vy - a.vy;
        const impact = dvx * nx + dvy * ny;

        if (impact > 0) return;

        const impulse = (-(1 + Math.min(a.bounce, b.bounce)) * impact) / (a.mass + b.mass);

        const ix = impulse * nx;
        const iy = impulse * ny;

        a.vx -= ix / a.mass;
        a.vy -= iy / a.mass;
        b.vx += ix / b.mass;
        b.vy += iy / b.mass;
    }

    resolveBattle(a, b) {
        if (a.type === b.type) return;

        // A beats B
        if (BEATS[a.type] === b.type) {
            this.handleWin(a, b);
            return;
        }

        // B beats A
        if (BEATS[b.type] === a.type) {
            this.handleWin(b, a);
            return;
        }
    }

    handleWin(winner, loser) {
        if (this.gameMode === GAMEMODE.elimination) {
            loser.die();
            return;
        }

        if (this.gameMode === GAMEMODE.assimilation) {
            if (loser.justConverted) return;

            this.pendingConversions.push({
                targetId: loser.id,
                target: loser,
                type: winner.type
            });

            loser.justConverted = true;
            return;
        }
    }

    checkWinCondition() {
        if (this.gameOver) return;

        const types = new Set();

        for (const p of this.players) {
            if (p.alive) types.add(p.type);
        }
        
        if (types.size === 1) {
            this.gameOver = true;
            this.winTime = performance.now();
            [this.winnerType] = types;

            // TODO: inject the main resetGame function in constructor
            if (this.gameOver && this.autoRestart){
                setTimeout(() => {
                    if (!this.running) return;  // if user hit stop
                    resetGame();
                }, this.restartDelay);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        for (const player of this.players) {
            player.draw(this.ctx);
        }

        if (this.gameOver) {
            this.drawWinScreen();
        }

        this.drawHUD();
    }

    drawWinScreen() {
        const ctx = this.ctx;
        const now = performance.now();

        // Darken background
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(0, 0, this.width, this.height);

        // Shadow Window Background
        ctx.shadowColor = "rgba(0,0,0,0.6";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 8;

        // Window format
        const w = 300;
        const h = 200;
        const x = (this.width - w) / 2;
        const y = (this.height - h) / 2;
        const radius = 16;

        // Window fill
        drawRoundedRect(ctx, x, y, w, h, radius);
        ctx.fillStyle = "#ffffffff";
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Emojis and text
        ctx.font = "64px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#000000ff";

        ctx.fillText(
            `${EMOJIS["trophy"]} ${EMOJIS[this.winnerType]} ${EMOJIS["trophy"]}`,
            this.width / 2,
            y + 60
        );

        ctx.font = "24px monospace";
        ctx.fillText(
            `${EMOJIS["medal"]} ${this.winnerType.toUpperCase()} WINS ${EMOJIS["medal"]}`,
            this.width / 2,
            y + 120
        );

        if (this.autoRestart){
            const timeLeft = Math.max(0, this.restartDelay - (now - this.winTime));
            const seconds = Math.ceil(timeLeft / 1000);
            
            ctx.font = "18px monospace";
            ctx.fillText(
                `Next round in ${seconds}...`,
                this.width / 2,
                y + 160
            );

            return;
        }

        ctx.font = "16px monospace";
        ctx.fillText(
            `Press Reset for new round!`,
            this.width / 2,
            y + 160
        );
    }

    drawHUD() {
        const counts = {rock: 0, paper: 0, scissors: 0};

        // TODO: set alive count as a property
        // get the total from spawn and decrease in resolveBattle
        for (const p of this.players) {
            if (p.alive) counts[p.type]++;
        }

        document.getElementById("rockcnt").innerHTML = `${EMOJIS["rock"]}: ${counts.rock}`;
        document.getElementById("papercnt").innerHTML = `${EMOJIS["paper"]}: ${counts.paper}`;
        document.getElementById("scissorscnt").innerHTML = `${EMOJIS["scissors"]}: ${counts.scissors}`;
    }
}