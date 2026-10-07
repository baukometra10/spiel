const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const upload = document.getElementById("upload");

let audioContext;
let audioReady = false;
let soundEnabled = localStorage.getItem("soundEnabled") !== "0";

const HISTORY_MAX = 20;
let historyStack = [];
let historyIndex = -1;

const tool = {
  color: "#ff69b4",
  size: 8,
  rainbow: false,
  eraser: false,
  magic: false,
  glitter: false,
  fill: false,
};

let drawing = false;
let strokeActive = false;
let lastX = 0;
let lastY = 0;
let currentBackground = "white";
let currentTemplate = null;

const PRAISE = [
  (name) => `واو يا ${name}! لوحة رائعة 🌟`,
  (name) => `أحسنتِ يا ${name}! أنتِ فنانة 🎨`,
  (name) => `يا سلام يا ${name}! كوكو فخور بكِ 💖`,
  (name) => `إبداع مذهل يا ${name}! ✨`,
  (name) => `تحفة فنية يا ${name}! 👑`,
];

function initAudio() {
  if (audioReady) return;
  if (window.AudioContext || window.webkitAudioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    audioReady = true;
  }
}

document.addEventListener("click", initAudio, { once: true });
document.addEventListener("touchstart", initAudio, { once: true });

function playTone(frequency, duration = 0.12, type = "sine", volume = 0.18) {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  initAudio();
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + 0.01);
  oscillator.start(audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.stop(audioContext.currentTime + duration + 0.02);
}

function playFanfare() {
  if (!soundEnabled) return;
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.18, "triangle", 0.2), i * 90);
  });
}

function updateSoundButtonLabel() {
  const button = document.querySelector(".sound-toggle");
  if (button) {
    button.textContent = soundEnabled ? "🔊 صوت" : "🔇 كتم";
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  updateSoundButtonLabel();
  localStorage.setItem("soundEnabled", soundEnabled ? "1" : "0");
  if (!soundEnabled && window.speechSynthesis) {
    speechSynthesis.cancel();
  }
  showStudioStatus(soundEnabled ? "الصوت مفعل" : "الصوت معطل");
}

function playSound(name) {
  if (!soundEnabled) return;
  switch (name) {
    case "select":
      playTone(700, 0.08, "triangle");
      break;
    case "save":
      playFanfare();
      break;
    case "clear":
      playTone(420, 0.12, "square");
      break;
    case "upload":
      playTone(740, 0.1, "triangle");
      break;
    case "sticker":
      playTone(560, 0.1, "triangle");
      break;
    case "error":
      playTone(240, 0.18, "sawtooth");
      break;
    case "magic":
      playTone(960, 0.08, "sine");
      break;
    case "fill":
      playTone(640, 0.1, "sine");
      playTone(820, 0.12, "triangle");
      break;
    case "undo":
      playTone(480, 0.08, "triangle");
      break;
    case "redo":
      playTone(720, 0.08, "triangle");
      break;
    case "unlock":
      playTone(880, 0.1, "sine");
      setTimeout(() => playTone(1175, 0.16, "triangle", 0.22), 100);
      break;
    default:
      playTone(620, 0.08, "sine");
      break;
  }
}

function resetToolFlags(except) {
  tool.rainbow = except === "rainbow";
  tool.eraser = except === "eraser";
  tool.magic = except === "magic";
  tool.glitter = except === "glitter";
  tool.fill = except === "fill";
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  if (undoBtn) undoBtn.disabled = historyIndex <= 0;
  if (redoBtn) redoBtn.disabled = historyIndex >= historyStack.length - 1;
}

function pushHistory() {
  try {
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(snapshot);
    if (historyStack.length > HISTORY_MAX) {
      historyStack.shift();
    }
    historyIndex = historyStack.length - 1;
    updateUndoRedoButtons();
  } catch (error) {
    console.warn("Could not save history snapshot", error);
  }
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  ctx.putImageData(historyStack[historyIndex], 0, 0);
  updateUndoRedoButtons();
  playSound("undo");
  showStudioStatus("تم التراجع ↩️");
}

function redo() {
  if (historyIndex >= historyStack.length - 1) return;
  historyIndex += 1;
  ctx.putImageData(historyStack[historyIndex], 0, 0);
  updateUndoRedoButtons();
  playSound("redo");
  showStudioStatus("تم الإعادة ↪️");
}

function resizeCanvas() {
  const width = Math.min(window.innerWidth - 40, 760);
  canvas.width = width;
  canvas.height = 500;
  drawBackground();
  historyStack = [];
  historyIndex = -1;
  pushHistory();
}

function drawBackground() {
  if (currentBackground === "gradient") {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#f7d9ff");
    gradient.addColorStop(1, "#d8f4ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (currentBackground === "sparkle") {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#fff7ff");
    gradient.addColorStop(1, "#ffe5f1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 40; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      drawStar(x, y, 5, 8, 4, "rgba(255,255,255,0.9)");
    }
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawTemplate();
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
  const rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot + i * step * 2) * outerRadius;
    y = cy + Math.sin(rot + i * step * 2) * outerRadius;
    ctx.lineTo(x, y);
    x = cx + Math.cos(rot + (i * 2 + 1) * step) * innerRadius;
    y = cy + Math.sin(rot + (i * 2 + 1) * step) * innerRadius;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function snapshotCanvas() {
  return canvas.toDataURL("image/png");
}

function getPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  if (event.touches && event.touches[0]) {
    return [
      (event.touches[0].clientX - rect.left) * scaleX,
      (event.touches[0].clientY - rect.top) * scaleY,
    ];
  }
  return [(event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY];
}

function hexToRgba(hex) {
  let value = hex.replace("#", "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 255,
  };
}

function colorsMatch(data, index, r, g, b, a, tolerance) {
  return (
    Math.abs(data[index] - r) +
      Math.abs(data[index + 1] - g) +
      Math.abs(data[index + 2] - b) +
      Math.abs(data[index + 3] - a) <=
    tolerance
  );
}

function floodFill(startX, startY, fillHex) {
  const x0 = Math.floor(startX);
  const y0 = Math.floor(startY);
  if (x0 < 0 || y0 < 0 || x0 >= canvas.width || y0 >= canvas.height) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  const startIndex = (y0 * width + x0) * 4;
  const sr = data[startIndex];
  const sg = data[startIndex + 1];
  const sb = data[startIndex + 2];
  const sa = data[startIndex + 3];
  const fill = hexToRgba(fillHex);
  const tolerance = 40;

  if (colorsMatch(data, startIndex, fill.r, fill.g, fill.b, fill.a, 8)) {
    return;
  }

  const stack = [[x0, y0]];
  const visited = new Uint8Array(width * height);
  let filled = 0;
  const maxPixels = width * height;

  while (stack.length && filled < maxPixels) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const pos = y * width + x;
    if (visited[pos]) continue;
    const i = pos * 4;
    if (!colorsMatch(data, i, sr, sg, sb, sa, tolerance)) continue;

    visited[pos] = 1;
    data[i] = fill.r;
    data[i + 1] = fill.g;
    data[i + 2] = fill.b;
    data[i + 3] = fill.a;
    filled += 1;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

function startDrawing(event) {
  const [x, y] = getPointer(event);

  if (tool.fill) {
    const fillColor = tool.rainbow
      ? `hsl(${Math.floor(Math.random() * 360)}, 100%, 65%)`
      : tool.color;
    // Convert HSL fill to hex approx via canvas
    let hex = tool.color;
    if (tool.rainbow) {
      const tmp = document.createElement("canvas").getContext("2d");
      tmp.fillStyle = fillColor;
      hex = tmp.fillStyle;
      if (hex.startsWith("rgb")) {
        const parts = hex.match(/\d+/g).map(Number);
        hex =
          "#" +
          parts
            .slice(0, 3)
            .map((n) => n.toString(16).padStart(2, "0"))
            .join("");
      }
    }
    floodFill(x, y, hex);
    pushHistory();
    playSound("fill");
    showStudioStatus("تم التلوين 🪣✨");
    if (typeof kokoPraise === "function") {
      kokoPraise("fill", getChildName());
    }
    return;
  }

  drawing = true;
  strokeActive = true;
  lastX = x;
  lastY = y;
}

function stopDrawing() {
  if (strokeActive) {
    pushHistory();
    strokeActive = false;
  }
  drawing = false;
}

function draw(event) {
  if (!drawing) return;

  const [x, y] = getPointer(event);
  ctx.lineWidth = tool.size;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (tool.eraser) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = tool.rainbow
      ? `hsl(${Math.floor(Math.random() * 360)}, 100%, 65%)`
      : tool.color;
  }

  if (tool.magic) {
    drawMagic(x, y);
  } else if (tool.glitter) {
    drawGlitter(x, y);
  } else {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  lastX = x;
  lastY = y;
}

function drawMagic(x, y) {
  const stars = Math.max(3, Math.round(tool.size / 2));
  for (let i = 0; i < stars; i++) {
    const offsetX = (Math.random() - 0.5) * tool.size * 3;
    const offsetY = (Math.random() - 0.5) * tool.size * 3;
    const size = Math.max(1, tool.size / 3 + Math.random() * 3);
    ctx.fillStyle = tool.rainbow
      ? `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`
      : tool.color;
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGlitter(x, y) {
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = tool.color;
  ctx.globalAlpha = 0.85;
  ctx.stroke();
  ctx.globalAlpha = 1;

  const sparks = Math.max(4, Math.round(tool.size));
  for (let i = 0; i < sparks; i++) {
    const ox = (Math.random() - 0.5) * tool.size * 4;
    const oy = (Math.random() - 0.5) * tool.size * 4;
    const size = 1 + Math.random() * 3;
    ctx.fillStyle = `hsl(${Math.floor(Math.random() * 360)}, 100%, ${70 + Math.random() * 20}%)`;
    drawStar(x + ox, y + oy, 4, size + 2, size, ctx.fillStyle);
  }
}

function pencil() {
  resetToolFlags();
  tool.color = "#ff69b4";
  tool.size = 8;
  playSound("select");
  showStudioStatus("قلم جاهز ✏️");
}

function rainbow() {
  resetToolFlags("rainbow");
  tool.rainbow = true;
  tool.size = 12;
  playSound("select");
  showStudioStatus("ألوان قوس قزح 🌈");
}

function eraser() {
  resetToolFlags("eraser");
  tool.eraser = true;
  tool.size = 20;
  playSound("select");
  showStudioStatus("ممحاة جاهزة 🧼");
}

function magicBrush() {
  resetToolFlags("magic");
  tool.magic = true;
  tool.rainbow = true;
  tool.size = 14;
  playSound("magic");
  showStudioStatus("فرشاة السحر ✨");
}

function glitterBrush() {
  resetToolFlags("glitter");
  tool.glitter = true;
  tool.size = 10;
  playSound("magic");
  showStudioStatus("فرشاة البريق 💫");
}

function fillBucket() {
  resetToolFlags("fill");
  tool.fill = true;
  playSound("select");
  showStudioStatus("أداة التعبئة 🪣 انقري داخل الرسم");
}

function setColor(color) {
  tool.color = color;
  tool.rainbow = false;
  tool.eraser = false;
  tool.magic = false;
  tool.glitter = false;
  playSound("select");
}

function setPalette(palette) {
  const pastel = ["#ffb3d9", "#c9b6ff", "#a8e6cf", "#ffe0a3", "#b5e8ff", "#ffd6e7"];
  const neon = ["#ff2d95", "#00e5ff", "#39ff14", "#fff000", "#ff6b00", "#bf00ff"];
  const colors = palette === "neon" ? neon : pastel;
  const container = document.getElementById("colorButtons");
  if (!container) {
    setColor(colors[0]);
    return;
  }
  container.innerHTML = colors
    .map(
      (c) =>
        `<button type="button" class="color-button" style="background:${c};" onclick="setColor('${c}')" aria-label="لون"></button>`
    )
    .join("");
  setColor(colors[0]);
  showStudioStatus(palette === "neon" ? "لوحة نيون ⚡" : "لوحة باستيل 🌸");
}

function setSize(size) {
  tool.size = size;
  tool.eraser = false;
  tool.magic = false;
  tool.glitter = false;
  tool.fill = false;
  playSound("select");
}

function addSticker(type) {
  const unlocked = getUnlockedStickers();
  const bonus = getBonusStickers();
  if (RARE_STICKERS[type] && !unlocked.includes(type)) {
    showStudioStatus("هذا الملصق مقفل 🔒 اجمعي نجوماً أكثر!");
    playSound("error");
    return;
  }
  if (BONUS_STICKERS[type] && !bonus.includes(type)) {
    showStudioStatus("افتحي هدية اليوم أولاً 🎁");
    playSound("error");
    return;
  }
  const width = canvas.width * 0.32;
  const height = canvas.height * 0.32;
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;
  drawSticker(type, x, y, width, height);
  pushHistory();
  playSound("sticker");
}

function drawSticker(type, x, y, width, height) {
  ctx.save();
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.globalCompositeOperation = "source-over";

  if (type === "butterfly") {
    const wingColor = "#ff9ef5";
    const bodyColor = "#8b2860";
    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.ellipse(x + width * 0.3, y + height * 0.5, width * 0.22, height * 0.28, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + width * 0.7, y + height * 0.5, width * 0.22, height * 0.28, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.5, y + height * 0.2);
    ctx.lineTo(x + width * 0.5, y + height * 0.8);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (type === "castle") {
    ctx.fillStyle = "#8cb4ff";
    ctx.strokeStyle = "#4d7dec";
    ctx.fillRect(x + width * 0.15, y + height * 0.35, width * 0.7, height * 0.45);
    ctx.fillRect(x + width * 0.08, y + height * 0.15, width * 0.18, height * 0.25);
    ctx.fillRect(x + width * 0.72, y + height * 0.15, width * 0.18, height * 0.25);
    ctx.fillRect(x + width * 0.35, y + height * 0.15, width * 0.3, height * 0.22);
    ctx.strokeRect(x + width * 0.15, y + height * 0.35, width * 0.7, height * 0.45);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + width * 0.36, y + height * 0.48, width * 0.12, height * 0.18);
    ctx.fillRect(x + width * 0.66, y + height * 0.48, width * 0.12, height * 0.18);
    ctx.fillStyle = "#ff9ef5";
    ctx.beginPath();
    ctx.moveTo(x + width * 0.35, y + height * 0.15);
    ctx.lineTo(x + width * 0.425, y + height * 0.05);
    ctx.lineTo(x + width * 0.5, y + height * 0.15);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.72, y + height * 0.15);
    ctx.lineTo(x + width * 0.795, y + height * 0.05);
    ctx.lineTo(x + width * 0.87, y + height * 0.15);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (type === "cat") {
    ctx.fillStyle = "#ffcc66";
    ctx.strokeStyle = "#b36b00";
    ctx.beginPath();
    ctx.arc(x + width * 0.5, y + height * 0.55, width * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.25, y + height * 0.35);
    ctx.lineTo(x + width * 0.35, y + height * 0.15);
    ctx.lineTo(x + width * 0.45, y + height * 0.35);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.55, y + height * 0.35);
    ctx.lineTo(x + width * 0.65, y + height * 0.15);
    ctx.lineTo(x + width * 0.75, y + height * 0.35);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x + width * 0.4, y + height * 0.55, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width * 0.6, y + height * 0.55, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.45, y + height * 0.68);
    ctx.quadraticCurveTo(x + width * 0.5, y + height * 0.75, x + width * 0.55, y + height * 0.68);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (type === "unicorn") {
    ctx.fillStyle = "#dd99ff";
    ctx.beginPath();
    ctx.arc(x + width * 0.45, y + height * 0.55, width * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.34, y + height * 0.35);
    ctx.lineTo(x + width * 0.22, y + height * 0.16);
    ctx.lineTo(x + width * 0.42, y + height * 0.25);
    ctx.fillStyle = "#ffdd66";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + width * 0.42, y + height * 0.55, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width * 0.54, y + height * 0.55, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (type === "rainbow") {
    const radius = Math.min(width, height) * 0.45;
    const centerX = x + width * 0.5;
    const centerY = y + height * 0.65;
    const colors = ["#ff5e84", "#ffcd3c", "#34c759", "#4d8cff"];
    colors.forEach((color, index) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 12;
      ctx.arc(centerX, centerY, radius - index * 14, Math.PI, Math.PI * 2, false);
      ctx.stroke();
    });
    ctx.restore();
    return;
  }

  if (type === "princess") {
    ctx.fillStyle = "#ff99cc";
    ctx.strokeStyle = "#bf165f";
    ctx.beginPath();
    ctx.moveTo(x + width * 0.1, y + height * 0.7);
    ctx.lineTo(x + width * 0.2, y + height * 0.35);
    ctx.lineTo(x + width * 0.35, y + height * 0.6);
    ctx.lineTo(x + width * 0.5, y + height * 0.3);
    ctx.lineTo(x + width * 0.65, y + height * 0.6);
    ctx.lineTo(x + width * 0.8, y + height * 0.35);
    ctx.lineTo(x + width * 0.9, y + height * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + width * 0.28, y + height * 0.45, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width * 0.5, y + height * 0.35, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width * 0.72, y + height * 0.45, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Rare / bonus stickers as emoji-style drawings
  const stickerMeta = RARE_STICKERS[type] || BONUS_STICKERS[type];
  if (stickerMeta) {
    ctx.font = `${Math.floor(width * 0.7)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(stickerMeta.emoji, x + width / 2, y + height / 2);
    ctx.restore();
    return;
  }

  ctx.restore();
}

function setBackground(type) {
  currentBackground = type;
  const snapshot = snapshotCanvas();
  drawBackground();
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    pushHistory();
  };
  image.src = snapshot;
}

function clearCanvas() {
  currentTemplate = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  pushHistory();
  playSound("clear");
}

function drawTemplate() {
  if (!currentTemplate) {
    return;
  }

  const ratio = Math.min(canvas.width / currentTemplate.width, canvas.height / currentTemplate.height);
  const width = currentTemplate.width * ratio;
  const height = currentTemplate.height * ratio;
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;
  ctx.drawImage(currentTemplate, x, y, width, height);
}

function loadTemplate(src) {
  const image = new Image();
  image.onload = () => {
    currentTemplate = image;
    drawBackground();
    pushHistory();
    showStudioStatus("تم تحميل الرسم للتلوين 🎉");
    playSound("select");
  };
  image.onerror = () => {
    showStudioStatus("فشل تحميل الرسم. حاول مرة أخرى.");
    playSound("error");
  };
  image.src = src;
}

function showStudioStatus(message) {
  const status = document.getElementById("studioStatus");
  if (!status) return;
  status.textContent = message;
  status.style.display = "block";
  setTimeout(() => {
    status.style.display = "none";
  }, 3000);
}

function celebrateSave(name) {
  const child = name || getChildName();
  const container = document.getElementById("confettiContainer");
  if (container) {
    const colors = ["#ff69b4", "#ffd166", "#4d8cff", "#34c759", "#ff9ef5", "#ff7a7a", "#fff"];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.background = colors[i % colors.length];
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top = `${Math.random() * 15 - 5}%`;
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      piece.style.width = `${8 + Math.random() * 12}px`;
      piece.style.height = `${8 + Math.random() * 12}px`;
      piece.style.animationDuration = `${900 + Math.random() * 900}ms`;
      container.appendChild(piece);
      setTimeout(() => piece.remove(), 2000);
    }
  }

  const overlay = document.getElementById("celebrationOverlay");
  const messageEl = document.getElementById("celebrationMessage");
  const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)](child);
  if (overlay && messageEl) {
    messageEl.textContent = praise;
    overlay.hidden = false;
    overlay.classList.add("is-visible");
    setTimeout(() => {
      overlay.classList.remove("is-visible");
      overlay.hidden = true;
    }, 2800);
  }
  if (typeof kokoSpeak === "function") {
    kokoSpeak(praise);
  }
}

function showUnlockOverlay(ids) {
  if (!ids || !ids.length) return;
  const overlay = document.getElementById("unlockOverlay");
  const list = document.getElementById("unlockList");
  if (!overlay || !list) return;
  list.innerHTML = ids
    .map((id) => {
      const meta = RARE_STICKERS[id];
      return `<div class="unlock-item"><span class="unlock-emoji">${meta.emoji}</span><span>${meta.label}</span></div>`;
    })
    .join("");
  overlay.removeAttribute("hidden");
  overlay.classList.add("is-visible");
  playSound("unlock");
  if (typeof playRewardSong === "function") {
    playRewardSong("unlock");
  }
  setTimeout(() => {
    overlay.classList.remove("is-visible");
    overlay.setAttribute("hidden", "");
  }, 3200);
  renderRareStickers();
}

function renderRareStickers() {
  const row = document.getElementById("rareStickers");
  if (!row) return;
  const unlocked = getUnlockedStickers();
  const bonus = getBonusStickers();
  const rareHtml = Object.keys(RARE_STICKERS)
    .map((id) => {
      const meta = RARE_STICKERS[id];
      const isOpen = unlocked.includes(id);
      if (isOpen) {
        return `<button type="button" class="sticker-button unlocked" onclick="addSticker('${id}')" aria-label="${meta.label}">${meta.emoji}</button>`;
      }
      return `<button type="button" class="sticker-button locked" disabled aria-label="مقفل">${meta.emoji}<span class="lock-badge">🔒</span></button>`;
    })
    .join("");
  const bonusHtml = Object.keys(BONUS_STICKERS)
    .map((id) => {
      const meta = BONUS_STICKERS[id];
      if (bonus.includes(id)) {
        return `<button type="button" class="sticker-button unlocked" onclick="addSticker('${id}')" aria-label="${meta.label}">${meta.emoji}</button>`;
      }
      return "";
    })
    .join("");
  row.innerHTML = rareHtml + bonusHtml;
}

let dailyGiftHideTimer = null;

function burstConfetti(count = 50) {
  const container = document.getElementById("confettiContainer");
  if (!container) return;
  const colors = ["#ff69b4", "#ffd166", "#4d8cff", "#34c759", "#ff9ef5", "#ff7a7a", "#fff"];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.background = colors[i % colors.length];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${Math.random() * 15 - 5}%`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.width = `${8 + Math.random() * 12}px`;
    piece.style.height = `${8 + Math.random() * 12}px`;
    piece.style.animationDuration = `${800 + Math.random() * 900}ms`;
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 2000);
  }
}

function applyDailyGiftEvent(gift) {
  if (!gift) return;

  if (gift.kind === "sticker" && gift.id) {
    const width = canvas.width * 0.28;
    const height = canvas.height * 0.28;
    const x = canvas.width * 0.1 + Math.random() * canvas.width * 0.5;
    const y = canvas.height * 0.1 + Math.random() * canvas.height * 0.45;
    drawSticker(gift.id, x, y, width, height);
    pushHistory();
    showStudioStatus(`وضعتُ ${gift.label} على لوحتك! 🎁`);
  } else if (gift.kind === "stars") {
    showStudioStatus(`ربحتِ ${gift.amount || 1} نجوم إضافية! ⭐`);
  }

  renderRareStickers();
}

function hideDailyGiftOverlay() {
  const overlay = document.getElementById("dailyGiftOverlay");
  if (!overlay) return;
  overlay.classList.remove("is-visible");
  overlay.setAttribute("hidden", "");
  if (dailyGiftHideTimer) {
    clearTimeout(dailyGiftHideTimer);
    dailyGiftHideTimer = null;
  }
}

function showDailyGiftOverlay(gift) {
  if (!gift) return;
  const overlay = document.getElementById("dailyGiftOverlay");
  const body = document.getElementById("dailyGiftBody");
  if (!overlay || !body) return;

  const title =
    gift.kind === "stars"
      ? `+${gift.amount || 1} نجوم!`
      : "ملصق جديد على اللوحة!";

  body.innerHTML = `
    <div class="unlock-emoji daily-gift-emoji">${gift.emoji}</div>
    <p class="daily-gift-title">${title}</p>
    <p>${gift.label}</p>
  `;

  overlay.removeAttribute("hidden");
  // force reflow so CSS transition plays
  void overlay.offsetWidth;
  overlay.classList.add("is-visible");

  burstConfetti(55);
  playSound("unlock");
  playFanfare();
  if (typeof playRewardSong === "function") {
    playRewardSong("daily");
  }
  applyDailyGiftEvent(gift);

  if (typeof kokoPraise === "function") {
    kokoPraise("daily", getChildName());
  }

  if (dailyGiftHideTimer) clearTimeout(dailyGiftHideTimer);
  dailyGiftHideTimer = setTimeout(() => {
    hideDailyGiftOverlay();
  }, 3200);

  overlay.onclick = () => hideDailyGiftOverlay();
}

function tryClaimDailyGift() {
  if (typeof claimDailyGift !== "function" || !isDailyGiftAvailable()) {
    return;
  }
  const gift = claimDailyGift();
  if (gift) {
    showDailyGiftOverlay(gift);
  }
}

async function shareCurrentDrawing() {
  try {
    let image;
    try {
      image = canvas.toDataURL("image/jpeg", 0.9);
    } catch (error) {
      image = canvas.toDataURL("image/png");
    }
    const result = await shareArtwork(image, getChildName());
    if (result === "shared") {
      showStudioStatus("تم الإرسال لماما أو بابا 💖");
      if (typeof kokoSpeak === "function") {
        kokoSpeak(`أحسنتِ يا ${getChildName()}! شاركتِ لوحتك`);
      }
    } else if (result === "downloaded") {
      showStudioStatus("تم تنزيل اللوحة بإطار جميل 🖼️");
    }
  } catch (error) {
    if (error && error.name === "AbortError") return;
    showStudioStatus("تعذر المشاركة الآن.");
    playSound("error");
  }
}

function saveDrawing() {
  let image;
  try {
    image = canvas.toDataURL("image/jpeg", 0.85);
  } catch (error) {
    image = canvas.toDataURL("image/png");
  }

  const starsBefore = getStars();
  const levelBefore = getLevelInfo(starsBefore).title;
  const result = addDrawing(image);
  if (!result.ok) {
    showStudioStatus("مساحة التخزين ممتلئة. احذفي بعض اللوحات من المعرض.");
    playSound("error");
    return;
  }

  celebrateSave(getChildName());
  showStudioStatus("تم حفظ اللوحة 🌟");
  playSound("save");

  const levelAfter = getLevelInfo(result.stars).title;
  const leveledUp = levelBefore !== levelAfter;
  if (leveledUp && typeof playRewardSong === "function") {
    setTimeout(() => playRewardSong("level"), 400);
    showStudioStatus(`مستوى جديد: ${levelAfter} 👑`);
  } else if (result.newlyUnlocked && result.newlyUnlocked.length) {
    // song plays inside showUnlockOverlay
  } else if (typeof playRewardSong === "function") {
    playRewardSong("save");
  }

  if (result.newlyUnlocked && result.newlyUnlocked.length) {
    setTimeout(() => showUnlockOverlay(result.newlyUnlocked), 900);
  }
}

function loadUploadImage() {
  if (!upload) {
    showStudioStatus("لا يوجد حقل رفع الآن.");
    playSound("error");
    return;
  }
  const file = upload.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showStudioStatus("الملف غير مدعوم. اختر صورة.");
    playSound("error");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      currentTemplate = image;
      const ratio = Math.min(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * ratio;
      const height = image.height * ratio;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackground();
      ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      pushHistory();
      showStudioStatus("تم تحميل صورتك للتلوين 🎉");
      playSound("upload");
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

window.addEventListener("resize", () => {
  const snapshot = canvas.toDataURL();
  const width = Math.min(window.innerWidth - 40, 760);
  canvas.width = width;
  canvas.height = 500;
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    historyStack = [];
    historyIndex = -1;
    pushHistory();
  };
  image.src = snapshot;
});

document.addEventListener("DOMContentLoaded", () => {
  unlockStickersForStars(getStars());
  updateSoundButtonLabel();
  renderRareStickers();
  updateUndoRedoButtons();
  setTimeout(() => {
    tryClaimDailyGift();
  }, 700);
  if (typeof kokoPraise === "function") {
    setTimeout(() => kokoPraise("welcome", getChildName()), 1200);
  }
});

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);
canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  startDrawing(event);
});
canvas.addEventListener("touchmove", (event) => {
  event.preventDefault();
  draw(event);
});
canvas.addEventListener("touchend", stopDrawing);

if (upload) {
  upload.addEventListener("change", loadUploadImage);
}

resizeCanvas();
