const player = document.getElementById("player");
const game = document.getElementById("game");
const coinDisplay = document.getElementById("coinDisplay");
const lifeDisplay = document.getElementById("lifeDisplay");

// Character selection
const selectedAnimal = localStorage.getItem("selectedAnimal") || "dog";
const animalEmojis = { "dog": "🐶", "frog": "🐸", "fox": "🦊" };
player.innerText = animalEmojis[selectedAnimal];

/* ===================== BGM ===================== */
const BGM_URL = "https://soundimage.org/wp-content/uploads/2017/05/Hypnotic-Puzzle.mp3";

const bgmAudio = new Audio();
bgmAudio.loop = true;
bgmAudio.volume = 0.4;
bgmAudio.src = BGM_URL;

function startBGM() {
    bgmAudio.play().catch(() => {
        document.addEventListener("click",      () => bgmAudio.play(), { once: true });
        document.addEventListener("touchstart", () => bgmAudio.play(), { once: true });
        document.addEventListener("keydown",    () => bgmAudio.play(), { once: true });
    });
}

function setBGMMuted(muted) {
    bgmAudio.muted = muted;
}
/* =============================================== */

/* ===================== SFX (Web Audio API) ===================== */
const sfx = (() => {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    let muted = false;

    function tone(freq, type, vol, dur, attack, decay) {
        if (muted) return;
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = type; o.frequency.value = freq;
        const t = ac.currentTime;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.start(t); o.stop(t + dur + decay);
    }

    function noise(vol, dur) {
        if (muted) return;
        const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource();
        const g = ac.createGain();
        src.buffer = buf; src.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(vol, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
        src.start(); src.stop(ac.currentTime + dur);
    }

    return {
        // Jump
        jump:     () => tone(520, 'sine', 0.25, 0.15, 0.005, 0.05),
        // Coin collected
        coin:     () => { tone(880, 'sine', 0.2, 0.08, 0.005, 0.02); setTimeout(() => tone(1100, 'sine', 0.15, 0.07, 0.005, 0.02), 55); },
        // Star / bonus collected
        star:     () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 'sine', 0.25, 0.12, 0.005, 0.03), i * 55)); },
        // Hit obstacle
        hit:      () => { tone(200, 'sawtooth', 0.4, 0.2, 0.01, 0.08); noise(0.2, 0.18); },
        // Game over
        gameover: () => { [330, 277, 220].forEach((f, i) => setTimeout(() => tone(f, 'sawtooth', 0.3, 0.25, 0.01, 0.1), i * 110)); },

        resume:   () => ac.resume(),
        setMuted: (val) => { muted = val; },
    };
})();
/* ============================================================== */

/* ===================== GAME STATE & PHYSICS ===================== */
let totalCoins = localStorage.getItem("animalBlitzMoney")
    ? parseInt(localStorage.getItem("animalBlitzMoney"))
    : 100;

let runCoins = 0;
let lives = 2;
let gameRunning = true;
let position = 0;
player.style.bottom = "0px";
let velocity = 0;
let gravity = -0.8;
let isJumping = false;

let speed      = (selectedAnimal === "fox")  ? 10 : 6;
let jumpPower  = (selectedAnimal === "frog") ? 18 : 15;

coinDisplay.innerText = totalCoins;
lifeDisplay.innerText = lives;

/* ===================== GAME MAIN LOOP (60 FPS) ===================== */
setInterval(() => {
    if (!gameRunning) return;

    if (isJumping || position > 0) {
        velocity += gravity;
        position += velocity;

        if (position <= 0) {
            position = 0;
            velocity = 0;
            isJumping = false;
        }
        player.style.bottom = position + "px";
    }
}, 1000 / 60);

/* ===================== SPAWN SYSTEM ===================== */
let obstacleInterval = setInterval(createObstacle, 1800);
let coinInterval     = setInterval(createCoin, 900);

/* ===================== JUMP CONTROL ===================== */
function jump() {
    if (!isJumping && gameRunning) {
        sfx.resume();
        sfx.jump();
        isJumping = true;
        velocity = jumpPower;
    }
}

document.addEventListener("keydown",    (e) => { if (e.code === "Space") { e.preventDefault(); jump(); } });
document.addEventListener("touchstart", ()  => { jump(); });

/* ===================== OBSTACLE LOGIC ===================== */
function createObstacle() {
    if (!gameRunning) return;

    const existingObstacles = document.querySelectorAll('.obstacle');
    if (existingObstacles.length > 0) {
        const lastObstacle = existingObstacles[existingObstacles.length - 1];
        const lastLeft = parseInt(lastObstacle.style.left);
        if (lastLeft > game.offsetWidth - 300) return;
    }

    const obstacle = document.createElement("div");
    obstacle.classList.add("obstacle");
    obstacle.innerText = "🌵";
    obstacle.style.left = game.offsetWidth + "px";
    game.appendChild(obstacle);

    let move = setInterval(() => {
        if (!gameRunning) { clearInterval(move); obstacle.remove(); return; }

        let left = parseInt(obstacle.style.left);
        obstacle.style.left = left - speed + "px";

        if (left < -50) { clearInterval(move); obstacle.remove(); }

        if (left < 130 && left > 70 && position < 60) {
            clearInterval(move);
            obstacle.remove();
            handleHit();
        }
    }, 16);
}

/* ===================== COIN LOGIC ===================== */
function createCoin() {
    if (!gameRunning) return;

    const coin = document.createElement("div");
    coin.classList.add("coin");

    let isBonus = Math.random() < 0.05;
    coin.innerText = isBonus ? "🌟" : "🪙";

    if (isBonus) {
        coin.style.filter = "drop-shadow(0 0 10px gold)";
    }

    coin.style.left   = game.offsetWidth + "px";
    coin.style.bottom = (Math.random() * 100 + 100) + "px";
    game.appendChild(coin);

    let currentMoveSpeed = isBonus ? speed + 3 : speed;

    let move = setInterval(() => {
        if (!gameRunning) { clearInterval(move); coin.remove(); return; }

        let left       = parseInt(coin.style.left);
        let coinBottom = parseInt(coin.style.bottom);
        coin.style.left = left - currentMoveSpeed + "px";

        if (left < 130 && left > 70 && position > (coinBottom - 60) && position < (coinBottom + 60)) {
            let pointsEarned = isBonus ? 20 : 5;
            runCoins   += pointsEarned;
            totalCoins += pointsEarned;

            localStorage.setItem("animalBlitzMoney", totalCoins);
            coinDisplay.innerText = totalCoins;

            // Play matching SFX
            sfx.resume();
            isBonus ? sfx.star() : sfx.coin();

            coin.remove();
            clearInterval(move);
        }

        if (left < -50) { clearInterval(move); coin.remove(); }
    }, 16);
}

/* ===================== SYSTEM FUNCTIONS ===================== */
function handleHit() {
    sfx.resume();
    sfx.hit();

    lives--;
    lifeDisplay.innerText = lives;
    gameRunning = false;

    let highScore = localStorage.getItem("animalDashHighScore") || 0;
    if (runCoins > highScore) {
        highScore = runCoins;
        localStorage.setItem("animalDashHighScore", highScore);
    }

    if (lives > 0) {
        showCustomAlert("⚠️ WARNING!", `One life left!\nBest Score: ${highScore}`, "⚠️", "#ff9800");
    } else {
        sfx.gameover();
        showCustomAlert("💀 GAME OVER", `This Run: ${runCoins}\nBest Score: ${highScore}`, "💀", "#ff4444");
    }
}

function showCustomAlert(title, message, icon, color) {
    const alertBox = document.getElementById("customAlert");
    alertBox.querySelector("h3").innerText       = title;
    alertBox.querySelector("h3").style.color     = color;
    alertBox.querySelector("#alertMessage").innerText = message;
    const iconDiv = alertBox.querySelector(".confirm-icon");
    iconDiv.innerHTML   = icon;
    iconDiv.style.color = color;
    alertBox.style.display = "flex";
}

function closeAlert() {
    document.getElementById("customAlert").style.display = "none";
    if (lives > 0) {
        position  = 0;
        velocity  = 0;
        player.style.bottom = "0px";
        gameRunning = true;
    } else {
        location.reload();
    }
}

// Start BGM
startBGM();