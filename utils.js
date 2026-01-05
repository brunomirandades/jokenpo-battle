const BEATS = {
    rock: "scissors",
    scissors: "paper",
    paper: "rock"
};

const EMOJIS = {
    rock: "🪨",
    paper: "📃",
    scissors: "✂️",
    trophy: "🏆",
    medal: "🥇"
};

const GAMEMODE = {
    elimination: 0,
    assimilation: 1
}

function getEmojiKey(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}