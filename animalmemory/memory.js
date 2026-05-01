const coinDisplay = document.getElementById("coinValue");
const timerDisplay = document.getElementById("timerDisplay");
const starDisplay = document.getElementById("stars");
const board = document.getElementById("board");

let totalStars = parseInt(localStorage.getItem("totalStars")) || 0;
let coins = parseInt(localStorage.getItem("animalBlitzMoney")) || 100;

let time = 60;
let totalPairsFound = 0;
let firstCard = null, secondCard = null;
let lockBoard = true;
let mistakes = 0;
let countdown;

const animals = ["🐶", "🐶", "🐱", "🐱", "🐰", "🐰", "🐼", "🐼", "🐯", "🐯", "🦊", "🦊", "🐸", "🐸", "🐻", "🐻"];

// ========== Settings Storage Logic ==========
// LocalStorage ကနေ အရင်သိမ်းခဲ့တဲ့ setting တွေကို ယူမယ်
let bgmEnabled = localStorage.getItem("bgmEnabled") !== "false"; // Default true
let sfxEnabled = localStorage.getItem("sfxEnabled") !== "false"; // Default true

// ========== BGM Section ==========
const BGM_URL = "https://soundimage.org/wp-content/uploads/2017/05/Hypnotic-Puzzle.mp3";
const bgmAudio = new Audio();
bgmAudio.loop = true;
bgmAudio.volume = 0.4;
bgmAudio.src = BGM_URL;

function startBGM() {
    if (bgmEnabled) {
        bgmAudio.play().catch(() => {
            const playOnce = () => { 
                if(bgmEnabled) bgmAudio.play(); 
                document.removeEventListener('click', playOnce); 
            };
            document.addEventListener('click', playOnce);
        });
    }
}

function setBGMMuted(muted) {
    bgmEnabled = !muted;
    bgmAudio.muted = muted;
    localStorage.setItem("bgmEnabled", bgmEnabled);
    if (bgmEnabled && bgmAudio.paused) {
        bgmAudio.play();
    } else if (!bgmEnabled) {
        bgmAudio.pause();
    }
}

// ========== SFX Section ==========
const sfx = (() => {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    
    function tone(freq, type, vol, dur, attack, decay) {
        if (!sfxEnabled) return;
        if (ac.state === 'suspended') ac.resume();
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

    return {
        flip:    () => tone(600, 'sine', 0.2, 0.08, 0.005, 0.02),
        match:   () => {
            tone(523, 'triangle', 0.3, 0.12, 0.01, 0.04);
            setTimeout(() => tone(659, 'triangle', 0.3, 0.12, 0.01, 0.04), 80);
        },
        wrong:   () => {
            tone(300, 'sawtooth', 0.25, 0.1, 0.01, 0.05);
            setTimeout(() => tone(220, 'sawtooth', 0.2, 0.15, 0.01, 0.06), 100);
        },
        coin:    () => { 
            tone(880, 'sine', 0.2, 0.08, 0.005, 0.02); 
            setTimeout(() => tone(1100, 'sine', 0.15, 0.07, 0.005, 0.02), 60); 
        },
        win:     () => { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 'sine', 0.3, 0.2), i * 100)); },
        fail:    () => { [330, 220].forEach((f, i) => setTimeout(() => tone(f, 'sawtooth', 0.3, 0.3), i * 150)); },
        setMuted: (muted) => { 
            sfxEnabled = !muted; 
            localStorage.setItem("sfxEnabled", sfxEnabled);
        }
    };
})();

// ========== Initialization Function ==========
function initSettingsUI() {
    // UI checkbox တွေကို သိမ်းထားတဲ့အတိုင်း ပြန်ပြင်ပေးမယ်
    const bgmToggle = document.getElementById('bgmToggle');
    const sfxToggle = document.getElementById('sfxToggle');
    
    bgmToggle.checked = bgmEnabled;
    sfxToggle.checked = sfxEnabled;
    
    bgmAudio.muted = !bgmEnabled;
}

// ========== Core Game Functions (Shuffle, Flip, CheckMatch... etc) ==========
// (User ပေးထားတဲ့ function မူရင်းအတိုင်း ဆက်သုံးပါ)
function shuffleCards() {
    board.innerHTML = "";
    const shuffled = [...animals].sort(() => 0.5 - Math.random());
    shuffled.forEach((animal, index) => {
        const cardContainer = document.createElement("div");
        cardContainer.className = "card-container";
        cardContainer.innerHTML = `
            <input type="checkbox" id="c${index}" disabled>
            <label for="c${index}" class="card" data-animal="${animal}">
                <div class="inner">
                    <div class="front">?</div>
                    <div class="back">${animal}</div>
                </div>
            </label>
        `;
        board.appendChild(cardContainer);
    });

    setTimeout(() => {
        document.querySelectorAll("input[type='checkbox']").forEach(input => input.checked = true);
        setTimeout(() => {
            document.querySelectorAll("input[type='checkbox']").forEach(input => input.checked = false);
            lockBoard = false;
            startTimer();
        }, 2000);
    }, 500);

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", flipCard);
    });
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;
    sfx.flip();
    const checkbox = document.getElementById(this.getAttribute("for"));
    checkbox.checked = true;
    if (!firstCard) { firstCard = this; return; }
    secondCard = this;
    checkMatch();
}

function checkMatch() {
    lockBoard = true;
    let isMatch = firstCard.dataset.animal === secondCard.dataset.animal;
    if (isMatch) {
        firstCard.classList.add("matched");
        secondCard.classList.add("matched");
        totalPairsFound++;
        coins += 15;
        sfx.match();
        sfx.coin();
        if (totalPairsFound === 8) { clearInterval(countdown); winGame(); } 
        else { resetBoard(); }
    } else {
        mistakes++;
        sfx.wrong();
        if (coins >= 5) coins -= 5;
        setTimeout(() => {
            document.getElementById(firstCard.getAttribute("for")).checked = false;
            document.getElementById(secondCard.getAttribute("for")).checked = false;
            resetBoard();
        }, 1000);
    }
    updateStats();
}

function winGame() {
    sfx.win();
    let totalWin = 50 + (time * 5);
    coins += totalWin;
    let finalStars = mistakes <= 3 ? 3 : mistakes <= 8 ? 2 : 1;
    totalStars += finalStars;
    localStorage.setItem("totalStars", totalStars);
    updateStats();
    setTimeout(() => {
        const resultBox = document.getElementById("resultBox");
        resultBox.classList.remove("hidden");
        document.getElementById("finalScore").innerHTML = `Score Stars: ${"⭐".repeat(finalStars)} <br> Reward: +${totalWin} 💰`;
    }, 500);
}

function resetBoard() { [firstCard, secondCard] = [null, null]; lockBoard = false; }

function updateStats() {
    coinDisplay.innerText = `💰 ${coins}`;
    starDisplay.innerText = totalStars;
    localStorage.setItem("animalBlitzMoney", coins);
}

function startTimer() {
    countdown = setInterval(() => {
        time--;
        timerDisplay.innerText = `⏳ ${time}s`;
        if (time <= 0) {
            clearInterval(countdown);
            lockBoard = true;
            sfx.fail();
            document.getElementById("resultBox").innerHTML = `<h2>❌ Time Up!</h2><button onclick="location.reload()">🔄 Try Again</button>`;
            document.getElementById("resultBox").classList.remove("hidden");
        }
    }, 1000);
}

function useEyeBooster() {
    if (totalStars >= 5) {
        totalStars -= 5;
        updateStats();
        sfx.reveal();
        document.querySelectorAll(".card").forEach(card => {
            const checkbox = document.getElementById(card.getAttribute("for"));
            if (!checkbox.checked) {
                checkbox.checked = true;
                setTimeout(() => { if (!card.classList.contains("matched")) checkbox.checked = false; }, 1500);
            }
        });
    }
}

// Toggle Function
function toggleSettings() {
    const panel = document.querySelector(".settings-panel");
    panel.classList.toggle("show");
}

// Start Game
initSettingsUI();
startBGM();
shuffleCards();
updateStats();