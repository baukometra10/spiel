(function () {
  const ROSE_TOYS = [
    "🌹", "🌺", "🌸", "🌷", "💮", "🏵️",
    "🧸", "🎠", "🎀", "🎈", "🪁", "🪀",
    "🍭", "🍬", "🧁", "🍦", "🍩", "🍪",
    "🦄", "🐰", "🐱", "🦋", "🐝", "🐥",
    "💖", "✨", "⭐", "🌈", "👑", "🪄",
  ];

  function createLayer() {
    let layer = document.getElementById("magicRain");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "magicRain";
      layer.className = "magic-rain";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    return layer;
  }

  function spawnPetal(layer, burst) {
    const el = document.createElement("span");
    el.className = "magic-petal" + (burst ? " magic-petal--burst" : "");
    el.textContent = ROSE_TOYS[Math.floor(Math.random() * ROSE_TOYS.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = 18 + Math.random() * 28 + "px";
    el.style.animationDuration = (burst ? 2.2 : 4.5) + Math.random() * (burst ? 2 : 5) + "s";
    el.style.animationDelay = burst ? Math.random() * 0.4 + "s" : Math.random() * 2 + "s";
    el.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
    el.style.setProperty("--spin", (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720) + "deg");
    layer.appendChild(el);
    const life = burst ? 4500 : 10000;
    setTimeout(() => el.remove(), life);
  }

  function rainBurst(count) {
    const layer = createLayer();
    for (let i = 0; i < count; i++) {
      setTimeout(() => spawnPetal(layer, true), i * 28);
    }
  }

  function startGentleRain() {
    const layer = createLayer();
    for (let i = 0; i < 24; i++) {
      spawnPetal(layer, false);
    }
    setInterval(() => spawnPetal(layer, false), 420);
  }

  function showSplash() {
    if (sessionStorage.getItem("kokoSplashShown") === "1") {
      startGentleRain();
      rainBurst(40);
      return;
    }

    const splash = document.createElement("div");
    splash.id = "welcomeSplash";
    splash.className = "welcome-splash";
    splash.innerHTML = `
      <div class="welcome-splash-inner">
        <div class="splash-roses" aria-hidden="true">🌹🌺🌸🌷🌹</div>
        <div class="splash-toys" aria-hidden="true">🧸🎠🍭🦄🎈</div>
        <p class="splash-title">أهلاً بكِ في عالم كوكو!</p>
        <p class="splash-sub">ورود وألعاب وحب كثير… هيا نرسم!</p>
        <button type="button" class="splash-enter" id="splashEnter">ادخلي بستان الورود 🌹</button>
      </div>
    `;
    document.body.appendChild(splash);
    document.body.classList.add("splash-open");

    rainBurst(80);
    const splashRain = setInterval(() => rainBurst(18), 500);

    function enter() {
      clearInterval(splashRain);
      splash.classList.add("welcome-splash--out");
      document.body.classList.remove("splash-open");
      sessionStorage.setItem("kokoSplashShown", "1");
      setTimeout(() => splash.remove(), 600);
      startGentleRain();
      rainBurst(55);
    }

    document.getElementById("splashEnter").addEventListener("click", enter);
    setTimeout(enter, 4500);
  }

  function decorateWelcome() {
    const welcome = document.querySelector(".welcome");
    if (!welcome) return;

    const cornerL = document.createElement("div");
    cornerL.className = "welcome-garland welcome-garland--left";
    cornerL.setAttribute("aria-hidden", "true");
    cornerL.textContent = "🌹🌷🌸🌺🎀🧸🍭";

    const cornerR = document.createElement("div");
    cornerR.className = "welcome-garland welcome-garland--right";
    cornerR.setAttribute("aria-hidden", "true");
    cornerR.textContent = "🦄🎈🎠🍬🧁✨👑";

    welcome.prepend(cornerR);
    welcome.prepend(cornerL);

    const character = welcome.querySelector(".character");
    if (character) {
      character.innerHTML = `
        <span class="char-halo" aria-hidden="true">🌹🌸🌺</span>
        <span class="char-main">🎀👧🎨</span>
        <span class="char-toys" aria-hidden="true">🧸🍭🦄</span>
      `;
    }

    const tagline = welcome.querySelector("h1 + p");
    if (tagline) {
      tagline.innerHTML = "بستان من الورود والألعاب اللذيذة للإبداع 🌹🧸✨";
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    decorateWelcome();
    showSplash();
  });
})();
