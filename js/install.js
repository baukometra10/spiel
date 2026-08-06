let deferredInstallPrompt;
const installButton = document.getElementById("installButton");
const installStatus = document.getElementById("installStatus");

function showInstallStatus(message) {
  if (!installStatus) return;
  installStatus.textContent = message;
  installStatus.style.display = "block";
}

function hideInstallStatus() {
  if (!installStatus) return;
  installStatus.style.display = "none";
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installButton) {
    installButton.style.display = "inline-block";
  }
});

if (installButton) {
  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      showInstallStatus("لا يمكن الآن تثبيت التطبيق. الرجاء المحاولة لاحقًا.");
      return;
    }

    try {
      hideInstallStatus();
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installButton.style.display = "none";
      if (choiceResult.outcome === "accepted") {
        showInstallStatus("تم تثبيت التطبيق! يمكنك فتحه من الشاشة الرئيسية.");
      } else {
        showInstallStatus("يمكنك تثبيت التطبيق لاحقًا من خلال القائمة.");
      }
    } catch (error) {
      console.error("Install prompt failed:", error);
      showInstallStatus("حدث خطأ أثناء محاولة التثبيت. الرجاء المحاولة لاحقًا.");
    }
  });
}

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  if (installButton) {
    installButton.style.display = "none";
  }
  showInstallStatus("تم تثبيت التطبيق بنجاح! 🎉");
});
