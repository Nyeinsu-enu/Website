// =======================
// Variable တွေ ကြေညာမယ်
// =======================
const settingsPanel = document.getElementById("settingsPanel");
const bgMusic       = document.getElementById("bgMusic");       // တစ်ကြိမ်ပဲ ကြေညာ
const clickSound    = document.getElementById("clickSound");
const moneyDisplay  = document.getElementById("moneyValue");

// Coin တွေကို Storage ကနေ ယူမယ်
let coins = localStorage.getItem("animalBlitzMoney") || 0;
moneyDisplay.innerText = coins;

// =======================
// Music Volume
// =======================
bgMusic.volume = 0.4;

// =======================
// ၁။ Settings Panel ဖွင့်/ပိတ်
// =======================
function toggleSettings() {
    const isOpen = settingsPanel.style.display === "flex";
    settingsPanel.style.display = isOpen ? "none" : "flex";
}

function closeSettings() {
    settingsPanel.style.display = "none";
    playSound();
}

// =======================
// ၂။ Background Music
// =======================
function handleMusic() {
    const isMusicOn = document.getElementById("musicToggle").checked;
    localStorage.setItem("musicEnabled", isMusicOn);

    if (isMusicOn) {
        bgMusic.play().catch(e => console.log("Music blocked:", e));
    } else {
        bgMusic.pause();
    }
}

// =======================
// ၃။ Sound Effects
// =======================
function handleSFX() {
    const isSFXOn = document.getElementById("soundToggle").checked;
    localStorage.setItem("sfxEnabled", isSFXOn);
}

// =======================
// ၄။ Click Sound
// =======================
function playSound() {
    const isSFXOn = document.getElementById("soundToggle").checked;
    if (isSFXOn && clickSound) {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
    }
}

// =======================
// ၅။ Back to Menu
// =======================
function backToMenu() {
    let confirmLeave = confirm("Are you sure you want to exit to menu? Your current progress will be lost.");
    if (confirmLeave) {
        window.location.href = "../menu.html";
    }
}

// =======================
// ၆။ Autoplay Music on Load
// =======================
window.addEventListener("load", () => {

    // Checkbox state ကို storage ကနေ restore လုပ်မယ်
    const musicEnabled = localStorage.getItem("musicEnabled") !== "false";
    const sfxEnabled   = localStorage.getItem("sfxEnabled")   !== "false";

    document.getElementById("musicToggle").checked = musicEnabled;
    document.getElementById("soundToggle").checked = sfxEnabled;

    // menu.js က shouldPlayMusic signal ပေးထားရင် play မယ်
    const shouldPlay = localStorage.getItem("shouldPlayMusic") === "true";

    if (shouldPlay && musicEnabled) {
        bgMusic.play()
            .then(() => {
                console.log("✅ Music Auto Playing");
            })
            .catch(() => {
                // Browser က block လုပ်ရင် — user ပထမဆုံး click မှ play မယ်
                console.warn("⚠️ Autoplay blocked — waiting for user interaction.");
                document.addEventListener("click", () => {
                    if (bgMusic.paused) bgMusic.play().catch(() => {});
                }, { once: true });
            });

        localStorage.removeItem("shouldPlayMusic"); // signal သုံးပြီးပြီဆိုတာ ဖျက်မယ်

    } else if (!shouldPlay && musicEnabled) {
        // signal မပါဘဲ တိုက်ရိုက်ဝင်လာတာဆိုရင် — click မှ play မယ်
        document.addEventListener("click", () => {
            if (bgMusic.paused) bgMusic.play().catch(() => {});
        }, { once: true });
    }
    // musicEnabled = false ဆိုရင် ဘာမှမလုပ်ဘူး၊ music ပိတ်ထားမယ်

});

// အသံမြည်ပြီးမှ Page ကူးစေမယ့် function
function navTo(url) {
    playSound(); // အသံမြည်အောင် အရင်ခေါ်မယ်
    
    // ၀.၂ စက္ကန့် စောင့်ပြီးမှ Menu ကို သွားမယ်
    setTimeout(() => {
        window.location.href = url;
    }, 200);
}

  //  IIFE က script tag အနေနဲ့ body ပိတ်ခါနီးမှာရှိတယ်။
//  load event မတိုင်ခင်ကတည်းက ဆုံးဖြတ်နိုင်မယ်။
// ၁။ ပထမဆုံး စဝင်တာလားဆိုတာ စစ်တဲ့ Function (IIFE)
(function () {
    if (sessionStorage.getItem("seenBlitzOverlay") === "true") {
        return; // ကြည့်ပြီးသားဆိုရင် ပြန်ထွက်သွားမယ်
    }
    const overlay = document.getElementById("welcome-overlay");
    if (overlay) overlay.style.display = "flex";
})();

// ၂။ Overlay ကို နှိပ်လိုက်ရင် ပျောက်သွားစေမယ့် Function
function startEverything() {
    sessionStorage.setItem("seenBlitzOverlay", "true"); // မှတ်သားထားလိုက်ပြီ

    const overlay = document.getElementById("welcome-overlay");
    overlay.style.opacity = "0";

    setTimeout(() => {
        overlay.style.display = "none";
        // ဒီနေရာမှာ ဂိမ်းကို စတင်စေချင်တဲ့ Function ရှိရင် လှမ်းခေါ်လို့ရတယ်
        // ဥပမာ - initGame();
    }, 800);
}

