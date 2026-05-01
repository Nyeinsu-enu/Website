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
// Overlay Logic (Session-based)
// =======================
function startEverything() {
    sessionStorage.setItem("seenOverlay", "true");

    const overlay = document.getElementById("welcome-overlay");
    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";

    setTimeout(() => {
        overlay.style.display = "none";
        document.body.style.overflow = "auto";
    }, 1000);

    // TAP TO START နှိပ်တဲ့အချိန် user interaction ရှိပြီဆိုတော့
    // browser က play ခွင့်ပေးမယ် — ဒီနေရာမှာပဲ play လုပ်ရမယ်
    if (localStorage.getItem("musicState") !== "off") {
        music.play().then(() => {
            updateMusicButton(true);
        }).catch(e => console.log("Autoplay blocked:", e));
    }
}

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
// Navigation
// =======================
const clickSound = new Audio("https://www.soundjay.com/buttons/sounds/button-16.mp3");

document.querySelectorAll("button, .game-card").forEach(btn => {
    btn.addEventListener("click", () => {
        clickSound.currentTime = 0;
        clickSound.play();
    });
});

function goToBlitz() {
    localStorage.setItem("shouldPlayMusic", "true");
    clickSound.currentTime = 0;
    clickSound.play();
    window.location.href = "index.html";
}

function goToMemory() {
    localStorage.setItem("autoPlayMemory", "true");
    clickSound.currentTime = 0;
    clickSound.play();
    window.location.href = "./animalmemory/homememory.html";
}

function goToDash() {
    localStorage.setItem("autoPlayDash", "true");
    clickSound.currentTime = 0;
    clickSound.play();
    window.location.href = "./animaldash/select.html";
}

// =======================
// Overlay IIFE - load မတိုင်ခင် ချက်ချင်း run
// =======================
(function () {
    if (sessionStorage.getItem("seenOverlay") === "true") return;
    const overlay = document.getElementById("welcome-overlay");
    if (overlay) overlay.style.display = "flex";
})();

// =======================
// On Page Load
// =======================
window.addEventListener("load", () => {

    // ── Overlay Check ───────────────────────────────────────
    if (sessionStorage.getItem("seenOverlay") === "true") {
        const overlay = document.getElementById("welcome-overlay");
        overlay.style.display = "none";
        document.body.style.overflow = "auto";
    }

    // ── Theme Restore ───────────────────────────────────────
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }

    // ── Music Restore ───────────────────────────────────────
    const musicState = localStorage.getItem("musicState");

    if (musicState === "off") {
        // User က ပိတ်ထားခဲ့တာ — button ကို Off ပြ၊ play မလုပ်ဘူး
        updateMusicButton(false);

    } else {
        // "on" ဖြစ်ဖြစ်၊ null (ပထမဆုံး) ဖြစ်ဖြစ် — music on အနေနဲ့ သဘောထား
        // Button ကို On ပြမယ် (music သံမထွက်သေးရင်တောင်)
        updateMusicButton(true);

        // Refresh ဆိုတော့ browser autoplay block ဖြစ်နိုင်တယ်
        // play() try လုပ်မယ်၊ block ဖြစ်ရင် ပထမဆုံး click မှ ဖွင့်မယ်
        music.play().catch(() => {
            document.addEventListener("click", () => {
                if (music.paused) music.play().catch(() => {});
            }, { once: true });
        });
    }

    // ── autoPlayBlitz signal ─────────────────────────────────
    const shouldPlay = localStorage.getItem("autoPlayBlitz");
    if (shouldPlay === "true") {
        music.play().catch(() => {
            document.addEventListener("click", () => music.play(), { once: true });
        });
        localStorage.removeItem("autoPlayBlitz");
    }

});

 
  //  IIFE က script tag အနေနဲ့ body ပိတ်ခါနီးမှာရှိတယ်။
 //   menu.js မတိုင်ခင် run မယ်၊ ဒါဆို overlay ကို
//  load event မတိုင်ခင်ကတည်းက ဆုံးဖြတ်နိုင်မယ်။

    (function () {
        if (sessionStorage.getItem("seenOverlay") === "true") {
            // Back to Menu ဆိုတော့ overlay မပြဘူး — display:none ဆိုတော့ ဘာမှမလုပ်တော့ဘူး ✅
            return;
        }
        // ပထမဆုံးဝင်တာဆိုတော့ overlay ကိုပြမယ်
        var overlay = document.getElementById("welcome-overlay");
        if (overlay) overlay.style.display = "flex";
    })();
