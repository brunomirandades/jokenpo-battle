class Player {
    constructor(id, x, y, type, speedMult, game) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type;
        this.justConverted = false;
        this.game = game;

        this.radius = 10;   // collision hitbox
        this.visualRadius = this.radius * 1.2; // emoji footprint
        this.speedMult = speedMult; // Speed multiplier taken from UI
        this.speed = (55 + Math.random() * 25) * this.speedMult; // add random variation on players' speed and consider speed multiplier

        this.vx = 0;
        this.vy = 0;

        this.alive = true;

        this.target = null;
        this.threat = null;

        this.mass = 1;
        this.bounce = 0.8;  // 0 = no bounce, 1 = elastic
    }

    update(dt) {
        if (!this.alive) return;

        this.think(this.game.players);
        this.move(dt);
        this.constrain();
    }

    think(players) {
        let closestTarget = null;
        let closestThreat = null;
        let minTargetDist = Infinity;
        let minThreatDist = Infinity;

        // TODO: optimize player checking by adding players to an analyze array
        // and removing the ones already checked
        for (const other of players) {
            if (!other.alive || other === this) continue;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const dist = Math.hypot(dx, dy);

            // TARGET: I beat them
            if (BEATS[this.type] === other.type) {
                if (dist < minTargetDist) {
                    minTargetDist = dist;
                    closestTarget = other;
                }
            }

            // THREAT: They beat me
            if (BEATS[other.type] === this.type) {
                if (dist < minThreatDist) {
                    minThreatDist = dist;
                    closestThreat = other;
                }
            }
        }

        this.target = closestTarget;
        this.threat = closestThreat;

        this.decide(minTargetDist, minThreatDist);
    }

    decide(targetDist, threatDist) {
        // TODO: add center property to game with x and y positions
        // for screen center to avoid calculation everytime
        const w = this.game.width;
        const h = this.game.height;
        const centerX = w / 2;
        const centerY = h / 2;

        // RULE 1 & 2: Chase target if safer than fleeing
        if (this.target && (!this.threat || targetDist < threatDist)) {
            this.seek(this.target.x, this.target.y);
            return;
        }

        // RULE 1: Flee closest threat
        if (this.threat) {
            this.flee(this.threat.x, this.threat.y);
            return;
        }

        // RULE 3: Move back to center if far from action
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const distFromCenter = Math.hypot(dx, dy);

        const maxDist = Math.min(w, h) * 0.2;
        if (distFromCenter > maxDist) {
            this.seek(centerX, centerY);
            return;
        }

        // WANDER
        this.vx += (Math.random() - 0.5) * 0.2;
        this.vy += (Math.random() - 0.5) * 0.2;
    }

    seek(x, y){
        const dx = x - this.x;
        const dy = y - this.y;
        const len = Math.hypot(dx, dy) || 1;

        this.vx = dx / len;
        this.vy = dy / len;
    }

    flee(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        const len = Math.hypot(dx, dy) || 1;

        this.vx = dx / len;
        this.vy = dy / len;
    }

    move(dt) {
        const max = 1.5;
        
        this.x += this.vx * this.speed * dt;
        this.y += this.vy * this.speed * dt;

        this.vx = Math.max(-max, Math.min(max, this.vx));
        this.vy = Math.max(-max, Math.min(max, this.vy));
    }

    constrain() {
        const r = this.visualRadius;
        const softBounce = -0.5;

        if (this.x < r) {
            this.x = r;
            this.vx *= softBounce;
        }
        if (this.x > this.game.width - r) {
            this.x = this.game.width - r;
            this.vx *= softBounce;
        }

        if (this.y < r) {
            this.y = r;
            this.vy *= softBounce;
        }
        if (this.y > this.game.height - r) {
            this.y = this.game.height - r;
            this.vy *= softBounce;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.font = `${this.visualRadius * 1.3}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            EMOJIS[this.type],
            this.x,
            this.y
        );
    }

    // Elimination game
    die() {
        this.alive = false;
    }

    // Assimilation game
    convertTo(type) {
        this.type = type;
    }
}