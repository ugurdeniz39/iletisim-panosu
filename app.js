/* ── Auth ── */
(function initLogin() {
  const CREDS = { user: "neskaraca13", pass: "12345678" };
  const SESSION_KEY = "aac-auth";

  const screen = document.getElementById("login-screen");
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");

  function unlock() {
    sessionStorage.setItem(SESSION_KEY, "1");
    screen.classList.add("hidden");
    document.getElementById("login-user").value = "";
    document.getElementById("login-pass").value = "";
  }

  if (sessionStorage.getItem(SESSION_KEY)) {
    screen.classList.add("hidden");
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const u = document.getElementById("login-user").value.trim();
    const p = document.getElementById("login-pass").value;
    if (u === CREDS.user && p === CREDS.pass) {
      unlock();
    } else {
      errorEl.textContent = "Kullanıcı adı veya şifre yanlış.";
      document.getElementById("login-pass").value = "";
    }
  });
})();

const SOUND_DATA_KEY = "aac-record-slot-";

const soundButtons = [
  { label: "🤬 Ses Parpulama", kind: "file", file: "sounds/ses-parpulama.mp3" },
  { label: "💼 Cansın canosun. İŞ ARKADAŞIMSIN", kind: "file", file: "sounds/is-arkadasimsin.mp3" },
  { label: "🤯 Kriz geçiriyorum", kind: "file", file: "sounds/kriz-geciriyorum.mp3" },
  { label: "🤮 Ahahahah (İğrenç gülüş)", kind: "file", file: "sounds/igrenc-gulus.mp3" },
  { label: "💥 Biz patlaa patlaa patlaa", kind: "file", file: "sounds/biz-patlaa.mp3" },
  { label: "🤤 O kadar acıktım ki nermin parla...", kind: "file", file: "sounds/nermin-parla.mp3" },
  { label: "🔴 Record / Ses 7", kind: "record", slot: 7 },
  { label: "🔴 Record / Ses 8", kind: "record", slot: 8 },
  { label: "🔴 Record / Ses 9", kind: "record", slot: 9 },
  { label: "🔴 Record / Ses 10", kind: "record", slot: 10 }
];

const grid = document.getElementById("button-grid");
const recordModeToggle = document.getElementById("record-mode-toggle");
const statusText = document.getElementById("status-text");

let activeAudio = null;
let activeButton = null;
let recordMode = false;
let mediaRecorder = null;
let mediaStream = null;
let recordingSlot = null;
let recordingButton = null;
let chunks = [];

const slotToButton = new Map();

function setStatus(message) {
  statusText.textContent = message;
}

function getSlotStorageKey(slot) {
  return `${SOUND_DATA_KEY}${slot}`;
}

function hasSavedRecording(slot) {
  return Boolean(localStorage.getItem(getSlotStorageKey(slot)));
}

function setRecordMode(nextMode) {
  recordMode = nextMode;
  recordModeToggle.classList.toggle("is-active", recordMode);
  recordModeToggle.setAttribute("aria-pressed", String(recordMode));
  recordModeToggle.textContent = `Kayıt Modu: ${recordMode ? "Açık" : "Kapalı"}`;

  slotToButton.forEach((buttonEl, slot) => {
    buttonEl.classList.toggle("is-empty-record", !hasSavedRecording(slot));
  });

  if (recordMode) {
    setStatus("Kayıt modu açık: Ses 7-10 butonları kayıt başlatır/durdurur.");
  } else {
    setStatus("Oynatma modu aktif.");
  }
}

function getSupportedMimeType() {
  const preferredTypes = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"];

  for (const type of preferredTypes) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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

function speakLabel(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text.replace(/^[^\w\s]+\s*/, ""));
  utt.lang = "tr-TR";
  utt.rate = 0.92;
  window.speechSynthesis.speak(utt);
}

function playSound(src, buttonEl, fallbackLabel, errorMessage) {
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
    if (fallbackLabel) {
      speakLabel(fallbackLabel);
      setStatus(`Ses dosyası yok, konuşma sentezi kullanılıyor.`);
    } else {
      setStatus(errorMessage || "Ses dosyası bulunamadı.");
    }
    console.warn("Ses dosyası bulunamadı:", src);
  });

  audio.play().catch((err) => {
    stopCurrentAudio();
    if (fallbackLabel) {
      speakLabel(fallbackLabel);
      setStatus("Ses dosyası yok, konuşma sentezi kullanılıyor.");
    } else {
      setStatus("Ses çalınamadı. Sessiz mod veya izinleri kontrol et.");
    }
    console.warn("Ses çalınamadı:", err);
  });
}

async function stopRecording() {
  if (!mediaRecorder || recordingSlot === null) return;

  return new Promise((resolve) => {
    mediaRecorder.addEventListener(
      "stop",
      async () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });
        chunks = [];

        try {
          const dataUrl = await blobToDataUrl(blob);
          localStorage.setItem(getSlotStorageKey(recordingSlot), dataUrl);
          setStatus(`Ses ${recordingSlot} kaydedildi.`);
        } catch (error) {
          setStatus("Kayıt saklanamadı. Depolama alanını kontrol et.");
          console.warn("Kayıt saklama hatası:", error);
        }

        if (recordingButton) {
          recordingButton.classList.remove("is-recording", "is-empty-record");
        }

        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
        }

        mediaRecorder = null;
        mediaStream = null;
        recordingSlot = null;
        recordingButton = null;
        resolve();
      },
      { once: true }
    );

    mediaRecorder.stop();
  });
}

async function startRecording(slot, buttonEl) {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    setStatus("Bu cihazda mikrofon kaydı desteklenmiyor.");
    return;
  }

  if (mediaRecorder) {
    await stopRecording();
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedMimeType();
    mediaRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
    recordingSlot = slot;
    recordingButton = buttonEl;
    chunks = [];

    buttonEl.classList.add("is-recording");
    setStatus(`Ses ${slot} kaydediliyor... Tekrar basarak durdur.`);

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    });

    mediaRecorder.start();
  } catch (error) {
    setStatus("Mikrofon izni verilmedi. Tarayıcıdan izin ver.");
    console.warn("Kayıt başlatılamadı:", error);
  }
}

async function handleRecordButton(slot, buttonEl) {
  if (recordMode) {
    if (mediaRecorder && recordingSlot === slot) {
      await stopRecording();
      return;
    }

    await startRecording(slot, buttonEl);
    return;
  }

  const saved = localStorage.getItem(getSlotStorageKey(slot));
  if (!saved) {
    setStatus(`Ses ${slot} için kayıt yok. Önce Kayıt Modu'nu aç.`);
    return;
  }

  playSound(saved, buttonEl, `Ses ${slot} kaydı açılamadı.`);
}

function checkBackgroundImage() {
  const img = new Image();
  img.src = "bg-hilal.jpg";

  img.onerror = () => {
    setStatus("bg-hilal.jpg bulunamadı. Dosyayı proje köküne ekle.");
  };
}

function renderButtons(items) {
  grid.innerHTML = "";
  slotToButton.clear();

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sound-btn";
    button.textContent = item.label;

    if (item.kind === "record") {
      slotToButton.set(item.slot, button);
      button.classList.toggle("is-empty-record", !hasSavedRecording(item.slot));
      button.addEventListener("click", () => {
        handleRecordButton(item.slot, button);
      });
    } else {
      button.addEventListener("click", () => {
        playSound(item.file, button, item.label, `${item.label} ses dosyası bulunamadı.`);
      });
    }

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
setRecordMode(false);
checkBackgroundImage();

recordModeToggle.addEventListener("click", () => {
  setRecordMode(!recordMode);
});

registerServiceWorker();
