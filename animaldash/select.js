// =======================
// Variable များ ကြေညာခြင်း
// =======================
const bgMusic = document.getElementById("bgMusic");
const clickSound = document.getElementById("clickSound");
bgMusic.volume = 0.4;

function buyHero(heroId, price) {
    let currentMoney = parseInt(localStorage.getItem("animalBlitzMoney")) || 100;
    let isUnlocked = localStorage.getItem(heroId + "Unlocked") === "true";

    if (isUnlocked) {
        playSound(); // ဝယ်ပြီးသားဆိုရင် ရွေးရုံပဲမလို့ အသံပဲမြည်မယ်
        return;
    }

    if (currentMoney >= price) {
        // ပိုက်ဆံနှုတ်ပြီး ဝယ်မယ်
        currentMoney -= price;
        localStorage.setItem("animalBlitzMoney", currentMoney);
        localStorage.setItem(heroId + "Unlocked", "true");
        
        // UI ကို Update လုပ်မယ်
        initCoins();
        checkUnlockedHeroes();
        showCustomAlert("SUCCESS", heroId.toUpperCase() + " Unlocked!", "✅", "#4caf50");
    } else {
        showCustomAlert("FAILED", "Not enough coins!", "❌", "#f44336");
    }
}

// ဂိမ်းဖွင့်တိုင်း ဝယ်ထားတာတွေကို စစ်မယ့် function
function checkUnlockedHeroes() {
    const heroes = [
        { id: 'frog', price: 300 },
        { id: 'fox', price: 500 }
    ];

    heroes.forEach(hero => {
        let isUnlocked = localStorage.getItem(hero.id + "Unlocked") === "true";
        if (isUnlocked) {
            let card = document.getElementById(hero.id + "Card");
            let lockText = document.getElementById(hero.id + "Lock");
            
            card.classList.remove("locked"); // မှိန်နေတာကို ဖျောက်မယ်
            lockText.style.display = "none"; // သော့ပုံစံကို ဖျောက်မယ်
        }
    });
}

// initCoins ထဲမှာ checkUnlockedHeroes ကိုပါ ထည့်ခေါ်ပေးပါ
function initCoins() {
    let currentCoins = localStorage.getItem("animalBlitzMoney") || 100;
    document.getElementById("coinText").innerText = currentCoins;
    initSettings();
    checkUnlockedHeroes(); // ဒါလေး ထည့်ပေးပါ
}

// =======================
// Music & Sound Logic
// =======================

function initSettings() {
    const musicEnabled = localStorage.getItem("dashMusicEnabled") !== "false";
    const sfxEnabled = localStorage.getItem("dashSfxEnabled") !== "false";

    document.getElementById("music").checked = musicEnabled;
    document.getElementById("sound").checked = sfxEnabled;

    // Menu ကလာရင် သီချင်းတန်းဖွင့်ဖို့ (autoPlayDash signal သုံးနိုင်သည်)
    const shouldPlay = localStorage.getItem("autoPlayDash") === "true";
    if (shouldPlay && musicEnabled) {
        bgMusic.play().catch(() => {
            document.addEventListener("click", () => {
                if (bgMusic.paused && document.getElementById("music").checked) bgMusic.play();
            }, { once: true });
        });
        localStorage.removeItem("autoPlayDash");
    }
}

function handleMusic() {
    const isMusicOn = document.getElementById("music").checked;
    localStorage.setItem("dashMusicEnabled", isMusicOn);
    if (isMusicOn) bgMusic.play().catch(() => {});
    else bgMusic.pause();
}

function handleSFX() {
    const isSFXOn = document.getElementById("sound").checked;
    localStorage.setItem("dashSfxEnabled", isSFXOn);
}

function playSound() {
    // localStorage ကနေ sfx setting ကို အရင်စစ်မယ်
    const isSFXOn = localStorage.getItem("dashSfxEnabled") !== "false";
    const clickSound = document.getElementById("clickSound");

    if (isSFXOn && clickSound) {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
    }
}

// ခလုတ်နှိပ်ပြီး ခဏစောင့်မှ Page ကူးမယ့် function
function navTo(url) {
    playSound();
    setTimeout(() => {
        window.location.href = url;
    }, 200);
}

// =======================
// Reset & Alerts
// =======================

function resetGame() {
    playSound();
    document.getElementById("customConfirm").style.display = "flex";
}

function closeConfirm() {
    playSound();
    document.getElementById("customConfirm").style.display = "none";
}

function closeAlert() {
    playSound();
    document.getElementById("customAlert").style.display = "none";
}

function executeReset() {
    let currentMoney = localStorage.getItem("animalBlitzMoney");

    if (currentMoney == 100 || currentMoney == null) {
        closeConfirm();
        showCustomAlert("INFO", "Progress has already been reset!", "ℹ️", "#00c6ff");
    } else {
        localStorage.setItem("animalBlitzMoney", 100);

        

        initCoins();
        closeConfirm();
        showCustomAlert("SUCCESS", "Your game progress has been successfully reset.", "✅", "#4caf50");
    }
}

function showCustomAlert(title, message, icon, color) {
    playSound(); // Alert ပြရင်လည်း အသံမြည်မယ်
    const alertBox = document.getElementById("customAlert");
    alertBox.querySelector("h3").innerText = title;
    alertBox.querySelector("#alertMessage").innerText = message;
    const iconElement = alertBox.querySelector(".confirm-icon");
    iconElement.innerHTML = icon; 
    iconElement.style.color = color;
    alertBox.style.display = "flex";
}

// select.js ရဲ့ အောက်ဆုံးမှာ ဒါလေး ထပ်ထည့်ပါ
document.querySelectorAll('input[name="hero"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        // ရွေးလိုက်တဲ့ အကောင်ရဲ့ ID (dog, frog, fox) ကို သိမ်းလိုက်တာပါ
        localStorage.setItem("selectedAnimal", e.target.id);
        playSound(); // ရွေးလိုက်ရင် အသံမြည်အောင်ပါ တစ်ခါတည်းထည့်ပေးလိုက်တယ်
    });
});

function selectHero(heroId) {
    // ၁။ အရင်ဆုံး ရှိသမျှ card တွေထဲက "active-hero" (အစိမ်းရောင်ဘောင်) ကို အကုန်လိုက်ဖျောက်မယ်
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('active-hero');
    });

    // ၂။ အခု နှိပ်လိုက်တဲ့ အကောင်ရဲ့ card ကိုပဲ အစိမ်းရောင်ဘောင် ထည့်မယ်
    const selectedCard = document.getElementById(heroId + "Card") || document.querySelector(`label[for="${heroId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active-hero');
    }

    // ၃။ ပုံမှန်အတိုင်း localStorage ထဲမှာ သိမ်းမယ်
    localStorage.setItem("selectedAnimal", heroId);
    playSound();
}