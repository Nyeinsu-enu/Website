const board = document.getElementById("board");
const timerBar = document.getElementById("timerBar");
const timerText = document.getElementById("timerText");
const moneyDisplay = document.getElementById("moneyValue");
const crownProgressText = document.getElementById("crownProgressText");
const missionImg = document.getElementById("missionAnimal");
const missionBar = document.getElementById("missionBar");
const overlay = document.getElementById("overlay");
const popup = document.getElementById("missionPopup");
const canvas = document.getElementById("lineCanvas");
const ctx = canvas.getContext("2d");
const crownCountDisplay = document.getElementById('crownCount');

const width = 6;
let squares = [];
let chain = [];
let isDragging = false;
let coins = parseInt(localStorage.getItem("animalBlitzMoney")) || 0;
let crownCount = 0;
let time = 180;
const totalTime = 180;
let missionAnimal = "";

const animals = [
    "../animals/dog.png",
    "../animals/cat.png",
    "../animals/rabbit.png",
    "../animals/frog.png",
    "../animals/fox.png"
];

// ========== SOUND ENGINE ==========
const sfx = (() => {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    let muted = false; // ← mute flag

    function tone(freq, type, vol, dur, attack, decay) {
        if (muted) return; // ← guard
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
        if (muted) return; // ← guard
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
        select:   () => tone(520, 'sine', 0.3, 0.08, 0.005, 0.02),
        chain:    () => tone(660 + chain.length * 40, 'sine', 0.25, 0.1, 0.005, 0.02),
        match:    () => { tone(440, 'triangle', 0.4, 0.15, 0.01, 0.05); setTimeout(() => tone(660, 'triangle', 0.3, 0.15, 0.01, 0.05), 80); },
        crown:    () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 'sine', 0.35, 0.2, 0.01, 0.05), i * 60)); },
        laser:    () => { tone(200, 'sawtooth', 0.5, 0.3, 0.01, 0.1); noise(0.15, 0.2); },
        coin:     () => { tone(880, 'sine', 0.2, 0.1, 0.005, 0.02); setTimeout(() => tone(1100, 'sine', 0.15, 0.08, 0.005, 0.02), 60); },
        win:      () => { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 'sine', 0.4, 0.3, 0.01, 0.08), i * 80)); },
        fail:     () => { [330, 277, 220].forEach((f, i) => setTimeout(() => tone(f, 'sawtooth', 0.3, 0.25, 0.01, 0.1), i * 100)); },
        resume:   () => ac.resume(),
        setMuted: (val) => { muted = val; }, // ← expose mute control
    };
})();
// ==================================

// Initialize
function init() {
    moneyDisplay.innerText = coins;
    createBoard();
    setMission();
    startTimer();
}

function createBoard() {
    board.innerHTML = "";
    squares = [];
    for (let i = 0; i < width * width; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;
        const img = document.createElement("img");
        img.src = animals[Math.floor(Math.random() * animals.length)];
        cell.appendChild(img);
        board.appendChild(cell);
        squares.push(cell);
    }
    setTimeout(resizeCanvas, 100);
}

function resizeCanvas() {
    const rect = board.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

function setMission() {
    missionAnimal = animals[Math.floor(Math.random() * animals.length)];
    const name = getAnimalName(missionAnimal);
    missionBar.innerText = `🎯 Mission: Collect 3 ${name} Crowns`;
    missionImg.src = missionAnimal;
    crownProgressText.innerText = `0/3`;
}

function getAnimalName(src) {
    let filename = src.split('/').pop().toLowerCase();
    if (filename.includes("dog")) return "Dog";
    if (filename.includes("cat")) return "Cat";
    if (filename.includes("rabbit")) return "Rabbit";
    if (filename.includes("frog")) return "Frog";
    if (filename.includes("fox")) return "Fox";
    return "Animal";
}

function startTimer() {
    let countdown = setInterval(() => {
        time--;
        let min = Math.floor(time / 60);
        let sec = time % 60;
        timerText.innerText = `${min}:${sec < 10 ? "0" : ""}${sec}`;
        let percentage = (time / totalTime) * 100;
        timerBar.style.width = percentage + "%";

        if (percentage < 20) timerBar.style.background = "#ff4747";
        if (time <= 0 || crownCount >= 3) clearInterval(countdown);
        if (time <= 0 && crownCount < 3) missionFail();
    }, 1000);
}

function resetGame() {
    let confirmReset = confirm("Are you sure you want to reset all coins to 100?");

    if (confirmReset) {
        coins = 100;
        localStorage.setItem('animalBlitzMoney', 100);
        const moneyDisplay = document.getElementById("moneyValue");
        if (moneyDisplay) {
            moneyDisplay.innerText = "100";
        }
        document.getElementById('settingsToggle').checked = false;
        alert("Coins have been reset to 100!");
    }
}

// Logic
function getCellFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    const cell = el?.closest(".cell");
    return cell ? parseInt(cell.dataset.index) : -1;
}

function startDrag(x, y) {
    const idx = getCellFromPoint(x, y);
    if (idx === -1) return;
    isDragging = true;
    chain = [idx];
    squares[idx].classList.add("selected");
    sfx.resume();
    sfx.select();
}

function moveDrag(x, y) {
    if (!isDragging) return;
    const idx = getCellFromPoint(x, y);
    if (idx === -1 || chain.includes(idx)) return;

    const last = chain[chain.length - 1];
    const ar = Math.floor(last / width), ac = last % width;
    const br = Math.floor(idx / width), bc = idx % width;

    if (Math.abs(ar - br) <= 1 && Math.abs(ac - bc) <= 1) {
        let firstAnimalName = getAnimalName(squares[chain[0]].querySelector("img").src);
        let currentAnimalName = getAnimalName(squares[idx].querySelector("img").src);

        if (firstAnimalName === currentAnimalName) {
            chain.push(idx);
            squares[idx].classList.add("selected");
            sfx.chain();
            drawLine();
        }
    }
}

function drawLine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (chain.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ff6f91";
    ctx.lineCap = "round";

    const bRect = board.getBoundingClientRect();
    chain.forEach((idx, i) => {
        const cRect = squares[idx].getBoundingClientRect();
        const x = (cRect.left - bRect.left) + cRect.width / 2;
        const y = (cRect.top - bRect.top) + cRect.height / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (chain.length >= 3) {
        resolveChain();
    }

    squares.forEach(square => square.classList.remove("selected"));
    chain = [];
}

function resolveChain() {
    const len = chain.length;
    const firstImg = squares[chain[0]].querySelector("img").src;
    const animalName = getAnimalName(firstImg);
    const targetName = getAnimalName(missionAnimal);

    let hasCrown = false;
    chain.forEach(idx => {
        if (squares[idx].querySelector("img").src.includes("crown")) {
            hasCrown = true;
        }
    });

    let finalClearedIndices = [...chain];

    if (hasCrown) {
        const first = chain[0];
        const last = chain[chain.length - 1];
        const row = Math.floor(last / width);
        const col = last % width;
        const isHorizontal = Math.floor(first / width) === Math.floor(last / width);
        const isVertical = (first % width) === (last % width);

        sfx.laser();

        if (isHorizontal) {
            for (let i = 0; i < width; i++) finalClearedIndices.push(row * width + i);
            createLaserEffect(last, "horizontal");
        }
        else if (isVertical) {
            for (let i = 0; i < width; i++) finalClearedIndices.push(i * width + col);
            createLaserEffect(last, "vertical");
        }
        else {
            for (let i = 0; i < width; i++) {
                finalClearedIndices.push(row * width + i);
                finalClearedIndices.push(i * width + col);
            }
            createLaserEffect(last, "cross");
        }
        finalClearedIndices = [...new Set(finalClearedIndices)];
    }

    if (len >= 4 && !hasCrown) {
        if (animalName === targetName) {
            crownCount++;
            if (crownCountDisplay) crownCountDisplay.innerText = crownCount;
            sfx.crown();
            if (crownCount >= 3) { setTimeout(missionComplete, 500); return; }
        }
        const midIdx = chain[Math.floor(len / 2)];
        const crownSrc = `../animals/crown${animalName.toLowerCase()}.png`;

        finalClearedIndices.forEach(i => squares[i].classList.add("pop"));
        setTimeout(() => dropAndFill(finalClearedIndices, midIdx, crownSrc), 300);
    } else {
        if (hasCrown && animalName === targetName) {
            crownCount++;
            if (crownCountDisplay) crownCountDisplay.innerText = crownCount;
            sfx.crown();
            if (crownCount >= 3) { setTimeout(missionComplete, 500); return; }
        }

        sfx.match();
        finalClearedIndices.forEach(i => squares[i].classList.add("pop"));
        setTimeout(() => dropAndFill(finalClearedIndices), 300);
    }

    coins += finalClearedIndices.length * 2;
    sfx.coin();
    if (moneyDisplay) moneyDisplay.innerText = coins;
    localStorage.setItem("animalBlitzMoney", coins);
}

function createLaserEffect(centralIdx, type) {
    const effectContainer = document.getElementById("effectContainer");
    if (!effectContainer) return;

    const centralCell = squares[centralIdx];
    const cellRect = centralCell.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    const centerX = cellRect.left + cellRect.width / 2;
    const centerY = cellRect.top + cellRect.height / 2;

    const spawnBeam = (isVert) => {
        const beam = document.createElement("div");
        beam.className = isVert ? "laser-beam laser-vert" : "laser-beam laser-horiz";

        if (isVert) {
            beam.style.left = `${centerX}px`;
            beam.style.top = `${boardRect.top}px`;
            beam.style.height = `${boardRect.height}px`;
        } else {
            beam.style.top = `${centerY}px`;
            beam.style.left = `${boardRect.left}px`;
            beam.style.width = `${boardRect.width}px`;
        }

        effectContainer.appendChild(beam);
        setTimeout(() => beam.remove(), 500);
    };

    if (type === "horizontal") spawnBeam(false);
    else if (type === "vertical") spawnBeam(true);
    else if (type === "cross") { spawnBeam(false); spawnBeam(true); }

    const mainContainer = document.getElementById("mainContainer");
    if (mainContainer) {
        mainContainer.classList.add("shake-screen");
        setTimeout(() => mainContainer.classList.remove("shake-screen"), 500);
    }
}

function dropAndFill(cleared, spawnIdx = -1, crownPath = "") {
    const clearedSet = new Set(cleared);

    cleared.forEach(idx => squares[idx].classList.remove("pop"));

    for (let col = 0; col < width; col++) {
        let columnAnimals = [];

        for (let row = 0; row < width; row++) {
            let idx = row * width + col;
            if (!clearedSet.has(idx) && idx !== spawnIdx) {
                columnAnimals.push(squares[idx].querySelector("img").src);
            }
        }

        let isCrownInThisCol = (spawnIdx !== -1 && (spawnIdx % width === col));
        let needed = width - (columnAnimals.length + (isCrownInThisCol ? 1 : 0));

        for (let i = 0; i < needed; i++) {
            let randomAnimal = animals[Math.floor(Math.random() * animals.length)];
            columnAnimals.unshift(randomAnimal);
        }

        let animalPointer = columnAnimals.length - 1;
        for (let row = width - 1; row >= 0; row--) {
            let idx = row * width + col;

            if (idx === spawnIdx) {
                squares[idx].querySelector("img").src = crownPath;
            } else if (animalPointer >= 0) {
                squares[idx].querySelector("img").src = columnAnimals[animalPointer];
                animalPointer--;
            }
        }
    }
}

function missionComplete() {
    sfx.win();
    document.getElementById("popupTitle").innerText = "SWEET!";
    document.getElementById("popupSub").innerText = "Mission Complete";
    document.getElementById("statusEmoji").innerText = "🤩";

    const actionBtn = document.querySelector(".popup-buttons .btn-pink");
    actionBtn.innerText = "Mission Complete";
    actionBtn.style.background = "var(--pink)";

    popup.style.background = "linear-gradient(180deg, #ff9a9e 0%, #fecfef 100%)";

    overlay.style.display = "block";
    popup.classList.add("show");
}

function missionFail() {
    sfx.fail();
    document.getElementById("popupTitle").innerText = "OOPS!";
    document.getElementById("popupSub").innerText = "Time is up!";
    document.getElementById("statusEmoji").innerText = "😢";

    const actionBtn = document.querySelector(".popup-buttons .btn-pink");
    actionBtn.innerText = "TRY AGAIN";
    actionBtn.style.background = "#6a5acd";

    popup.style.background = "linear-gradient(180deg, #a1887f 0%, #4a4a4a 100%)";

    overlay.style.display = "block";
    popup.classList.add("show");
}

// Events
board.addEventListener("mousedown", e => startDrag(e.clientX, e.clientY));
window.addEventListener("mousemove", e => moveDrag(e.clientX, e.clientY));
window.addEventListener("mouseup", endDrag);
board.addEventListener("touchstart", e => startDrag(e.touches[0].clientX, e.touches[0].clientY));
window.addEventListener("touchmove", e => moveDrag(e.touches[0].clientX, e.touches[0].clientY));
window.addEventListener("touchend", endDrag);

init();