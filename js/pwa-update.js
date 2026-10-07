/**
 * Keep installed PWA / browser tabs on the latest app version.
 */
(function () {
  const RELOAD_FLAG = "kokoSwReloading";

  function showUpdateToast(message) {
    let el = document.getElementById("pwaUpdateToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "pwaUpdateToast";
      el.className = "pwa-update-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("is-visible");
  }

  function hideUpdateToast() {
    const el = document.getElementById("pwaUpdateToast");
    if (el) el.classList.remove("is-visible");
  }

  function reloadOnce() {
    if (sessionStorage.getItem(RELOAD_FLAG) === "1") {
      sessionStorage.removeItem(RELOAD_FLAG);
      return;
    }
    sessionStorage.setItem(RELOAD_FLAG, "1");
    showUpdateToast("✨ تحديث جديد لمرسم كوكو…");
    setTimeout(() => {
      location.reload();
    }, 700);
  }

  function watchRegistration(registration) {
    if (!registration) return;

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          // New version ready — activate immediately
          worker.postMessage({ type: "SKIP_WAITING" });
          showUpdateToast("🎁 جاري تحديث التطبيق…");
        }
      });
    });

    // If a waiting worker already exists
    if (registration.waiting && navigator.serviceWorker.controller) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  }

  async function checkForUpdate() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") {
      return;
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        watchRegistration(registration);
      }
    } catch (error) {
      console.warn("PWA update check failed", error);
    }
  }

  function initPwaAutoUpdate() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") {
      return;
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      reloadOnce();
    });

    navigator.serviceWorker.ready.then(watchRegistration);

    // Periodic + focus/online checks so installed phones pick up releases
    setInterval(checkForUpdate, 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkForUpdate();
      }
    });
    window.addEventListener("focus", checkForUpdate);
    window.addEventListener("online", checkForUpdate);

    // First check shortly after load
    setTimeout(checkForUpdate, 2500);
    setTimeout(hideUpdateToast, 5000);
  }

  window.initPwaAutoUpdate = initPwaAutoUpdate;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPwaAutoUpdate);
  } else {
    initPwaAutoUpdate();
  }
})();
