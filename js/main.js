const canvas = document.getElementById("game");
canvas.width = 800;
canvas.height = 600;

let game = null;
let animationId = null;
let lastTime = 0;

resizeCanvas(canvas);
window.addEventListener("resize", () => resizeCanvas(canvas));

document.getElementById("startBtn").onclick = startGame;
document.getElementById("stopBtn").onclick = stopGame;
document.getElementById("resetBtn").onclick = resetGame;

function getSettings() {
    const teamSize = parseInt(document.getElementById("players").value);
    const speed = parseFloat(document.getElementById("speed").value);
    const autoRestart = document.getElementById("autoRestart").checked;
    const modeValue = parseInt(document.querySelector("input[name='mode']:checked").value);
    const mode = modeValue ? GAMEMODE.assimilation : GAMEMODE.elimination;

    return {
        teamSize,
        speed,
        autoRestart,
        mode
    };
}

function startGame() {
    if (game && game.running) return; // avoid double loops

    // TODO: Limit the size of teams based on canvas size
    // around 50 for Mobile and 100 for Desktop
    const { teamSize, speed, autoRestart, mode } = getSettings();

    if (!game) {
        game = new Game(canvas, teamSize, mode, speed, autoRestart);
    }

    game.running = true;
    game.autoRestart = autoRestart;
    game.speedMultiplier = speed;
    game.teamSize = teamSize;
    game.gameMode = mode;
    
    lastTime = performance.now();
    animationId = requestAnimationFrame(runLoop);
}

function runLoop(timestamp) {
    if (!game || !game.running) return;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
    lastTime = timestamp;

    game.update(dt);
    game.draw();

    // Start animation loop and get its ID
    animationId = requestAnimationFrame(runLoop);
}

function stopGame() {
    if (!game) return;

    if (game.running){
        game.running = false;
        // Stop current animation loop
        cancelAnimationFrame(animationId);
    }
}

function resetGame() {
    stopGame();

    const { teamSize, speed, autoRestart, mode } = getSettings();

    game = new Game(canvas, teamSize, mode, speed, autoRestart);

    startGame();
}

function resizeCanvas(canvas) {
    const isMobile = window.innerWidth < 900;

    if (isMobile) {
        canvas.width = Math.min(window.innerWidth, 360);
        canvas.height = Math.floor(window.innerHeight * 0.7);
    } else {
        canvas.width = 800;
        canvas.height = 600;
    }

    if (game) {
        game.width = canvas.width;
        game.height = canvas.height;
        resetGame();
    }
}