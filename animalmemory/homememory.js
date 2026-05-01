// =======================
// Variable များ ကြေညာခြင်း
// =======================
const bgMusic = document.getElementById("bgMusic");
const clickSound = document.getElementById("clickSound");

// Music Volume ညှိရန်
bgMusic.volume = 0.4;

window.onload = function() {
    loadHomeCoins();
    initSettings(); // Settings များကို စစ်ဆေးရန်
};

// Coin များပြသခြင်း
function loadHomeCoins() {
    let savedCoins = localStorage.getItem("animalBlitzMoney") || 100;
    document.getElementById("homeCoin").innerText = savedCoins;
}

// =======================
// Music & Sound Logic
// =======================

function initSettings() {
    // Storage ကနေ အသံ settings များ ယူယူမယ်
    const musicEnabled = localStorage.getItem("memoryMusicEnabled") !== "false";
    const sfxEnabled = localStorage.getItem("memorySfxEnabled") !== "false";

    document.getElementById("musicToggle").checked = musicEnabled;
    document.getElementById("soundToggle").checked = sfxEnabled;

    // Menu ကနေ လာတာဆိုရင် သီချင်းတန်းဖွင့်မယ်
    const shouldPlay = localStorage.getItem("autoPlayMemory") === "true";

    if (shouldPlay && musicEnabled) {
        bgMusic.play().catch(() => {
            // Browser block ဖြစ်ရင် click မှ ဖွင့်မယ်
            document.addEventListener("click", () => {
                if (bgMusic.paused && document.getElementById("musicToggle").checked) bgMusic.play();
            }, { once: true });
        });
        localStorage.removeItem("autoPlayMemory");
    }
}

// Background Music အဖွင့်အပိတ်
function handleMusic() {
    const isMusicOn = document.getElementById("musicToggle").checked;
    localStorage.setItem("memoryMusicEnabled", isMusicOn);

    if (isMusicOn) {
        bgMusic.play().catch(e => console.log("Music blocked"));
    } else {
        bgMusic.pause();
    }
}

// SFX အဖွင့်အပိတ်
function handleSFX() {
    const isSFXOn = document.getElementById("soundToggle").checked;
    localStorage.setItem("memorySfxEnabled", isSFXOn);
}

// ခလုတ်နှိပ်သံ
function playSound() {
    const isSFXOn = localStorage.getItem("memorySfxEnabled") !== "false";
    const clickSound = document.getElementById("clickSound");

    if (isSFXOn && clickSound) {
        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.log("Sound blocked:", e));
    }
}

// =======================
// Modal & Buttons (အသံထည့်ထားသည်)
// =======================

function openResetModal() {
    playSound();
    document.getElementById("resetModal").style.display = "flex";
}

function closeResetModal() {
    playSound();
    document.getElementById("resetModal").style.display = "none";
}

function confirmReset() {
    playSound();
    localStorage.setItem("animalBlitzMoney", "100");
    localStorage.setItem("totalStars", "0");
    localStorage.setItem("bestScore", "0");
    location.reload();
}

// Play button နဲ့ About button အတွက် အသံထည့်ရန်
document.querySelectorAll('.play-btn, .about-btn, .settings-btn,.reset-btn, .menu-link, .close-btn').forEach(btn => {
    btn.addEventListener('click', playSound);
});

// စာမျက်နှာအသစ်သို့ မသွားခင် အသံအရင်ပေးမယ့် function
function navTo(url) {
    playSound();
    setTimeout(() => {
        window.location.href = url;
    }, 200);
}