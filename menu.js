// =======================
// Persistent Music System
// =======================
const music = new Audio("./music/menu.mp3");
music.loop = true;
music.volume = 0.3;

// သီချင်းချိန်ကို သိမ်းမယ်
setInterval(() => {
    if (!music.paused) {
        localStorage.setItem("musicCurrentTime", music.currentTime);
    }
}, 500);

// =======================
// Music Controls
// =======================
function toggleMusic() {
    if (!music.paused) {
        music.pause();
        localStorage.setItem("musicState", "off");
        updateMusicButton(false);
    } else {
        music.play();
        localStorage.setItem("musicState", "on");
        updateMusicButton(true);
    }
}

function updateMusicButton(isOn) {
    const musicBtn = document.querySelector("button[onclick='toggleMusic()']");
    if (!musicBtn) return;
    musicBtn.innerText = isOn ? "🎶 Music On" : "🎵 Music Off";
    musicBtn.style.background = isOn ? "#ffe066" : "white";
}

// =======================
// Theme
// =======================
function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
}

// =======================
// Navigation & Persistence Logic
// =======================
const clickSound = new Audio("https://www.soundjay.com/buttons/sounds/button-16.mp3");

function handleNavigation(url) {
    // ဂိမ်းထဲကို ဝင်တော့မှာဖြစ်လို့ Overlay ကို ကြည့်ပြီးသားအဖြစ် သတ်မှတ်မယ်
    sessionStorage.setItem("seenWelcome", "true"); 
    
    clickSound.currentTime = 0;
    clickSound.play();
    
    // ခဏစောင့်ပြီးမှ သွားမယ် (Sound လေးကြားရအောင်)
    setTimeout(() => {
        window.location.href = url;
    }, 150);
}

function goToBlitz() {
    localStorage.setItem("autoPlayBlitz", "true");
    handleNavigation("menu.html");
}

function goToMemory() {
    handleNavigation("./animalmemory/homememory.html");
}

function goToDash() {
    handleNavigation("./animaldash/select.html");
}

// =======================
// Overlay Logic (IIFE)
// =======================
(function () {
    // sessionStorage မှာ seenWelcome ရှိနေရင် Overlay ကို လုံးဝ မပြတော့ဘူး
    if (sessionStorage.getItem("seenWelcome") === "true") {
        return; 
    }
    const overlay = document.getElementById("welcome-overlay");
    if (overlay) overlay.style.display = "flex";
})();

function startEverything() {
    const overlay = document.getElementById("welcome-overlay");
    overlay.style.opacity = "0";

    setTimeout(() => {
        overlay.style.display = "none";
        document.body.style.overflow = "auto";

        // Music Auto-play check
        if (localStorage.getItem("musicState") !== "off") {
            music.play().catch(() => {
                // Autoplay block ဖြစ်ရင် interaction တစ်ခုခုမှ ဖွင့်မယ်
                document.addEventListener("click", () => {
                    if (music.paused) music.play();
                }, { once: true });
            });
            updateMusicButton(true);
        }
    }, 800);
}

// =======================
// On Page Load
// =======================
window.addEventListener("load", () => {

    // ── Theme Restore ───────────────────────────────────────
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }

    // ── Music Restore ───────────────────────────────────────
    const musicState = localStorage.getItem("musicState");
    if (musicState === "off") {
        updateMusicButton(false);
    } else {
        updateMusicButton(true);
        // Blitz ကနေ ပြန်လာတာဆိုရင် တန်းဖွင့်ပေးမယ်
        if (localStorage.getItem("autoPlayBlitz") === "true") {
            music.play().catch(() => {});
            localStorage.removeItem("autoPlayBlitz");
        }
    }
    
    // ── Overlay Interaction Support ─────────────────────────
    // အကယ်၍ Overlay ပျောက်နေရင် (Back to Menu ဆိုရင်) Scroll ကို တန်းဖွင့်ထားမယ်
    if (sessionStorage.getItem("seenWelcome") === "true") {
        document.body.style.overflow = "auto";
    }
});