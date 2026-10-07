const RARE_STICKERS = {
  heart: { emoji: "💖", unlockAt: 5, label: "قلب سحري" },
  sparkle: { emoji: "✨", unlockAt: 5, label: "بريق" },
  ice: { emoji: "❄️", unlockAt: 15, label: "ثلج" },
  dragon: { emoji: "🐉", unlockAt: 15, label: "تنين" },
  gem: { emoji: "💎", unlockAt: 30, label: "جوهرة" },
  rocket: { emoji: "🚀", unlockAt: 30, label: "صاروخ" },
};

const LEVELS = [
  { min: 0, title: "🌱 مبتدئة", nextAt: 5 },
  { min: 5, title: "🌸 فنانة صغيرة", nextAt: 15 },
  { min: 15, title: "👑 أميرة الرسم", nextAt: 30 },
  { min: 30, title: "💎 نجمة الفن", nextAt: null },
];

function getChildName() {
  return localStorage.getItem("childName") || "لولو";
}

function setChildName(name) {
  const cleanName = String(name || "").trim() || "لولو";
  localStorage.setItem("childName", cleanName);
}

function getStars() {
  return Number(localStorage.getItem("stars") || 0);
}

function setStars(count) {
  const safe = Math.max(0, Number(count) || 0);
  localStorage.setItem("stars", String(safe));
}

function addStar() {
  const stars = getStars() + 1;
  setStars(stars);
  return stars;
}

function syncStarsToDrawingCount() {
  setStars(getDrawings().length);
}

function getDrawings() {
  try {
    return JSON.parse(localStorage.getItem("drawings") || "[]");
  } catch (error) {
    console.warn("Invalid drawings data in localStorage, resetting.", error);
    localStorage.removeItem("drawings");
    return [];
  }
}

function addDrawing(image) {
  const drawings = getDrawings();
  drawings.push({
    image: image,
    date: new Date().toLocaleDateString("ar"),
  });
  try {
    localStorage.setItem("drawings", JSON.stringify(drawings));
  } catch (error) {
    console.error("Storage quota exceeded", error);
    return { ok: false, error: "quota", stars: getStars(), newlyUnlocked: [] };
  }
  const stars = addStar();
  const newlyUnlocked = unlockStickersForStars(stars);
  return { ok: true, stars, newlyUnlocked };
}

function clearDrawings() {
  localStorage.removeItem("drawings");
  setStars(0);
}

function removeDrawing(index) {
  const drawings = getDrawings();
  if (index < 0 || index >= drawings.length) {
    return;
  }
  drawings.splice(index, 1);
  localStorage.setItem("drawings", JSON.stringify(drawings));
  syncStarsToDrawingCount();
}

function getUnlockedStickers() {
  try {
    return JSON.parse(localStorage.getItem("unlockedStickers") || "[]");
  } catch (error) {
    console.warn("Invalid unlockedStickers data, resetting.", error);
    localStorage.removeItem("unlockedStickers");
    return [];
  }
}

function setUnlockedStickers(list) {
  localStorage.setItem("unlockedStickers", JSON.stringify(list));
}

function unlockStickersForStars(stars) {
  const unlocked = getUnlockedStickers();
  const newly = [];
  Object.keys(RARE_STICKERS).forEach((id) => {
    if (stars >= RARE_STICKERS[id].unlockAt && !unlocked.includes(id)) {
      unlocked.push(id);
      newly.push(id);
    }
  });
  if (newly.length) {
    setUnlockedStickers(unlocked);
  }
  return newly;
}

function getLevelInfo(stars) {
  let current = LEVELS[0];
  for (let i = 0; i < LEVELS.length; i++) {
    if (stars >= LEVELS[i].min) {
      current = LEVELS[i];
    }
  }
  const nextAt = current.nextAt;
  const prevMin = current.min;
  let progress = 100;
  if (nextAt != null) {
    progress = Math.min(100, Math.round(((stars - prevMin) / (nextAt - prevMin)) * 100));
  }
  return {
    title: current.title,
    stars,
    nextAt,
    progress,
    remaining: nextAt == null ? 0 : Math.max(0, nextAt - stars),
  };
}

function hasParentPin() {
  return Boolean(localStorage.getItem("parentPinHash"));
}

function hashPinSync(pin) {
  const raw = "koko-pin:" + String(pin);
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return "v1:" + (hash >>> 0).toString(16);
}

async function hashPin(pin) {
  const raw = "koko-pin:" + String(pin);
  if (window.crypto && crypto.subtle) {
    try {
      const data = new TextEncoder().encode(raw);
      const digest = await crypto.subtle.digest("SHA-256", data);
      return (
        "sha256:" +
        Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
    } catch (error) {
      console.warn("SubtleCrypto unavailable, using fallback hash.", error);
    }
  }
  return hashPinSync(pin);
}

async function setParentPin(pin) {
  const clean = String(pin || "").replace(/\D/g, "");
  if (clean.length !== 4) {
    return false;
  }
  const hash = await hashPin(clean);
  localStorage.setItem("parentPinHash", hash);
  return true;
}

async function verifyParentPin(pin) {
  const stored = localStorage.getItem("parentPinHash");
  if (!stored) {
    return false;
  }
  const clean = String(pin || "").replace(/\D/g, "");
  const hash = await hashPin(clean);
  if (hash === stored) {
    return true;
  }
  // Support migration between hash styles
  return hashPinSync(clean) === stored;
}

function clearParentPin() {
  localStorage.removeItem("parentPinHash");
}

function clearAllData() {
  localStorage.removeItem("drawings");
  localStorage.removeItem("stars");
  localStorage.removeItem("childName");
  localStorage.removeItem("unlockedStickers");
  localStorage.removeItem("soundEnabled");
  clearParentPin();
}
