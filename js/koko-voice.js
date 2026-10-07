(function () {
  const VOICE_LINES = {
    save: (name) => [
      `واو يا ${name}! لوحة رائعة`,
      `أحسنتِ يا ${name}! أنتِ فنانة كبيرة`,
      `يا سلام يا ${name}! كوكو فخور بكِ`,
      `إبداع مذهل يا ${name}`,
      `تحفة فنية يا ${name}`,
    ],
    fill: (name) => [
      `ألوان جميلة يا ${name}`,
      `تلوين رائع`,
      `واو! أحب هذا اللون`,
    ],
    daily: (name) => [
      `هدية اليوم لكِ يا ${name}`,
      `مفاجأة سحرية يا ${name}`,
    ],
    welcome: (name) => [`أهلاً يا ${name}! هيا نرسم`],
  };

  function stripEmoji(text) {
    return String(text || "")
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
      .replace(/[\u2600-\u27BF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function pickArabicVoice() {
    if (!window.speechSynthesis) return null;
    const voices = speechSynthesis.getVoices() || [];
    return (
      voices.find((v) => /^ar(-|$)/i.test(v.lang)) ||
      voices.find((v) => /arab/i.test(v.name)) ||
      null
    );
  }

  function isVoiceAllowed() {
    return localStorage.getItem("soundEnabled") !== "0" && "speechSynthesis" in window;
  }

  window.kokoSpeak = function kokoSpeak(text) {
    if (!isVoiceAllowed()) return;
    const clean = stripEmoji(text);
    if (!clean) return;
    try {
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = "ar-SA";
      utter.rate = 0.95;
      utter.pitch = 1.15;
      const voice = pickArabicVoice();
      if (voice) utter.voice = voice;
      speechSynthesis.speak(utter);
    } catch (error) {
      console.warn("Speech failed", error);
    }
  };

  window.kokoPraise = function kokoPraise(kind, name) {
    const list = VOICE_LINES[kind] || VOICE_LINES.save;
    const n = name || (typeof getChildName === "function" ? getChildName() : "لولو");
    const line = list[Math.floor(Math.random() * list.length)](n);
    window.kokoSpeak(line);
    return line;
  };

  if ("speechSynthesis" in window) {
    speechSynthesis.getVoices();
    speechSynthesis.addEventListener("voiceschanged", () => {
      pickArabicVoice();
    });
  }
})();
