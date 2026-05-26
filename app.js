const soundButtons = [
  { label: "🤬 Ses Parpulama", file: "sounds/ses-parpulama.mp3" },
  { label: "💼 Cansın canosun. İŞ ARKADAŞIMSIN", file: "sounds/is-arkadasimsin.mp3" },
  { label: "🤯 Kriz geçiriyorum", file: "sounds/kriz-geciriyorum.mp3" },
  { label: "🤮 Ahahahah (İğrenç gülüş)", file: "sounds/igrenc-gulus.mp3" },
  { label: "💥 Biz patlaa patlaa patlaa", file: "sounds/biz-patlaa.mp3" },
  { label: "🤤 O kadar acıktım ki nermin parla...", file: "sounds/nermin-parla.mp3" },
  { label: "🔴 Record / Ses 7", file: "sounds/record-7.mp3" },
  { label: "🔴 Record / Ses 8", file: "sounds/record-8.mp3" },
  { label: "🔴 Record / Ses 9", file: "sounds/record-9.mp3" },
  { label: "🔴 Record / Ses 10", file: "sounds/record-10.mp3" }
];

const grid = document.getElementById("button-grid");
let activeAudio = null;
let activeButton = null;

function stopCurrentAudio() {
  if (!activeAudio) return;

  activeAudio.pause();
  activeAudio.currentTime = 0;
  activeAudio = null;

  if (activeButton) {
    activeButton.classList.remove("is-playing");
    activeButton = null;
  }
}

function playSound(src, buttonEl) {
  stopCurrentAudio();

  const audio = new Audio(src);
  activeAudio = audio;
  activeButton = buttonEl;
  buttonEl.classList.add("is-playing");

  audio.addEventListener("ended", () => {
    if (activeAudio === audio) {
      stopCurrentAudio();
    }
  });

  audio.addEventListener("error", () => {
    if (activeAudio === audio) {
      stopCurrentAudio();
    }
    console.warn("Ses dosyası bulunamadı:", src);
  });

  audio.play().catch((err) => {
    stopCurrentAudio();
    console.warn("Ses çalınamadı:", err);
  });
}

function renderButtons(items) {
  grid.innerHTML = "";

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sound-btn";
    button.textContent = item.label;
    button.addEventListener("click", () => playSound(item.file, button));
    grid.appendChild(button);
  });

  // 10+ butonda kartları kaydırılabilir yaparak genişlemeye izin ver.
  grid.classList.toggle("is-scrollable", items.length > 10);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service Worker kaydı başarısız:", err);
    });
  });
}

renderButtons(soundButtons);
registerServiceWorker();
