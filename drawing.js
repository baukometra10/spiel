const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const upload = document.getElementById("upload");

let audioContext;
let audioReady = false;
let soundEnabled = localStorage.getItem("soundEnabled") !== "0";

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

function playTone(frequency, duration = 0.12, type = "sine") {
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
  gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.01);
  oscillator.start(audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.stop(audioContext.currentTime + duration + 0.02);
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
  showStudioStatus(soundEnabled ? "الصوت مفعل" : "الصوت معطل");
}

function playSound(name) {
  if (!soundEnabled) return;
  switch (name) {
    case "select":
      playTone(700, 0.08, "triangle");
      break;
    case "save":
      playTone(880, 0.14, "sine");
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
    default:
      playTone(620, 0.08, "sine");
      break;
  }
}

const tool = {
  color: "#ff69b4",
  size: 8,
  rainbow: false,
  eraser: false,
  magic: false,
};

let drawing = false;
let lastX = 0;
let lastY = 0;
let currentBackground = "white";
let currentTemplate = null;

function resizeCanvas() {
  const width = Math.min(window.innerWidth - 40, 760);
  canvas.width = width;
  canvas.height = 500;
  drawBackground();
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
  let step = Math.PI / spikes;
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

function redrawCanvas() {
  const snapshot = snapshotCanvas();
  drawBackground();
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  };
  image.src = snapshot;
}

function getPointer(event) {
  const rect = canvas.getBoundingClientRect();
  if (event.touches && event.touches[0]) {
    return [event.touches[0].clientX - rect.left, event.touches[0].clientY - rect.top];
  }
  return [event.clientX - rect.left, event.clientY - rect.top];
}

function startDrawing(event) {
  drawing = true;
  [lastX, lastY] = getPointer(event);
}

function stopDrawing() {
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
    ctx.strokeStyle = tool.rainbow ? `hsl(${Math.floor(Math.random() * 360)}, 100%, 65%)` : tool.color;
  }

  if (tool.magic) {
    drawMagic(x, y);
  } else {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  [lastX, lastY] = [x, y];
}

function drawMagic(x, y) {
  const stars = Math.max(3, Math.round(tool.size / 2));
  for (let i = 0; i < stars; i++) {
    const offsetX = (Math.random() - 0.5) * tool.size * 3;
    const offsetY = (Math.random() - 0.5) * tool.size * 3;
    const size = Math.max(1, tool.size / 3 + Math.random() * 3);
    ctx.fillStyle = tool.rainbow ? `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)` : tool.color;
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function pencil() {
  tool.color = "#ff69b4";
  tool.size = 8;
  tool.rainbow = false;
  tool.eraser = false;
  tool.magic = false;
  playSound("select");
}

function rainbow() {
  tool.rainbow = true;
  tool.eraser = false;
  tool.magic = false;
  tool.size = 12;
  playSound("select");
}

function eraser() {
  tool.eraser = true;
  tool.rainbow = false;
  tool.magic = false;
  tool.size = 20;
  playSound("select");
}

function magicBrush() {
  tool.magic = true;
  tool.eraser = false;
  tool.rainbow = true;
  tool.size = 14;
  playSound("magic");
}

function setColor(color) {
  tool.color = color;
  tool.rainbow = false;
  tool.eraser = false;
  tool.magic = false;
  playSound("select");
}

function setSize(size) {
  tool.size = size;
  tool.eraser = false;
  tool.magic = false;
  playSound("select");
}

function addSticker(type) {
  const width = canvas.width * 0.32;
  const height = canvas.height * 0.32;
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;
  drawSticker(type, x, y, width, height);
  playSound("sticker");
}

function drawSticker(type, x, y, width, height) {
  ctx.save();
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  if (type === 'butterfly') {
    const wingColor = '#ff9ef5';
    const bodyColor = '#8b2860';
    ctx.fillStyle = wingColor;
    ctx.strokeStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(x + width * 0.3, y + height * 0.5, width * 0.22, height * 0.28, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + width * 0.7, y + height * 0.5, width * 0.22, height * 0.28, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 8;
    ctx.moveTo(x + width * 0.5, y + height * 0.2);
    ctx.lineTo(x + width * 0.5, y + height * 0.8);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (type === 'castle') {
    ctx.fillStyle = '#8cb4ff';
    ctx.strokeStyle = '#4d7dec';
    ctx.fillRect(x + width * 0.15, y + height * 0.35, width * 0.7, height * 0.45);
    ctx.fillRect(x + width * 0.08, y + height * 0.15, width * 0.18, height * 0.25);
    ctx.fillRect(x + width * 0.72, y + height * 0.15, width * 0.18, height * 0.25);
    ctx.fillRect(x + width * 0.35, y + height * 0.15, width * 0.3, height * 0.22);
    ctx.strokeRect(x + width * 0.15, y + height * 0.35, width * 0.7, height * 0.45);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + width * 0.36, y + height * 0.48, width * 0.12, height * 0.18);
    ctx.fillRect(x + width * 0.66, y + height * 0.48, width * 0.12, height * 0.18);
    ctx.fillStyle = '#ff9ef5';
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

  if (type === 'cat') {
    ctx.fillStyle = '#ffcc66';
    ctx.strokeStyle = '#b36b00';
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
    ctx.fillStyle = '#000';
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

  if (type === 'unicorn') {
    ctx.fillStyle = '#dd99ff';
    ctx.strokeStyle = '#8b2860';
    ctx.beginPath();
    ctx.arc(x + width * 0.45, y + height * 0.55, width * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.34, y + height * 0.35);
    ctx.lineTo(x + width * 0.22, y + height * 0.16);
    ctx.lineTo(x + width * 0.42, y + height * 0.25);
    ctx.fillStyle = '#ffdd66';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + width * 0.42, y + height * 0.55, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width * 0.54, y + height * 0.55, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (type === 'rainbow') {
    const radius = Math.min(width, height) * 0.45;
    const centerX = x + width * 0.5;
    const centerY = y + height * 0.65;
    const colors = ['#ff5e84', '#ffcd3c', '#34c759', '#4d8cff'];
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

  if (type === 'princess') {
    ctx.fillStyle = '#ff99cc';
    ctx.strokeStyle = '#bf165f';
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
    ctx.fillStyle = '#fff';
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

  ctx.restore();
}

function setBackground(type) {
  currentBackground = type;
  const snapshot = snapshotCanvas();
  drawBackground();
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  };
  image.src = snapshot;
}

function clearCanvas() {
  currentTemplate = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
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

function celebrateSave() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;

  const colors = ['#ff69b4', '#ffd166', '#4d8cff', '#34c759', '#ff9ef5', '#ff7a7a'];
  for (let i = 0; i < 20; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.background = colors[i % colors.length];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${Math.random() * 20 - 10}%`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.width = `${8 + Math.random() * 8}px`;
    piece.style.height = `${8 + Math.random() * 8}px`;
    piece.style.animationDuration = `${900 + Math.random() * 500}ms`;
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 1500);
  }
}

function saveDrawing() {
  const image = canvas.toDataURL("image/png");
  addDrawing(image);
  celebrateSave();
  showStudioStatus("تم حفظ اللوحة 🌟");
  playSound("save");
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
      showStudioStatus("تم تحميل صورتك للتلوين 🎉");
      playSound("upload");
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

window.addEventListener("resize", () => {
  const snapshot = canvas.toDataURL();
  resizeCanvas();
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  };
  image.src = snapshot;
});

document.addEventListener("DOMContentLoaded", () => {
  updateSoundButtonLabel();
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

upload.addEventListener("change", loadUploadImage);

resizeCanvas();
drawBackground();
