/**
 * Original celebratory melodies for Koko Painter (Web Audio).
 * Not commercial recordings — synthesized jingles for kids' rewards.
 */
(function () {
  let songCtx = null;
  let playingUntil = 0;

  // Cheerful "girl party" / soft Arabic-kids flavored intervals (Hz)
  const SONGS = {
    roses: {
      name: "أغنية الورود",
      tempo: 0.22,
      notes: [
        [523.25, 0.2],
        [587.33, 0.2],
        [659.25, 0.2],
        [698.46, 0.35],
        [659.25, 0.2],
        [587.33, 0.2],
        [523.25, 0.35],
        [0, 0.08],
        [659.25, 0.2],
        [698.46, 0.2],
        [783.99, 0.2],
        [880.0, 0.45],
        [783.99, 0.25],
        [698.46, 0.2],
        [659.25, 0.5],
      ],
    },
    stars: {
      name: "رقصة النجوم",
      tempo: 0.18,
      notes: [
        [392.0, 0.15],
        [493.88, 0.15],
        [587.33, 0.15],
        [659.25, 0.3],
        [587.33, 0.15],
        [659.25, 0.15],
        [783.99, 0.4],
        [0, 0.06],
        [880.0, 0.18],
        [783.99, 0.18],
        [659.25, 0.18],
        [783.99, 0.18],
        [987.77, 0.5],
      ],
    },
    princess: {
      name: "أنشودة الأميرة",
      tempo: 0.24,
      notes: [
        [440.0, 0.25],
        [523.25, 0.25],
        [659.25, 0.25],
        [523.25, 0.2],
        [587.33, 0.35],
        [0, 0.08],
        [659.25, 0.2],
        [698.46, 0.2],
        [783.99, 0.2],
        [698.46, 0.2],
        [659.25, 0.2],
        [587.33, 0.2],
        [523.25, 0.55],
      ],
    },
    gift: {
      name: "هدية سعيدة",
      tempo: 0.16,
      notes: [
        [659.25, 0.14],
        [783.99, 0.14],
        [880.0, 0.14],
        [1046.5, 0.28],
        [880.0, 0.14],
        [783.99, 0.14],
        [659.25, 0.14],
        [783.99, 0.35],
      ],
    },
  };

  function soundOn() {
    return localStorage.getItem("soundEnabled") !== "0";
  }

  function ensureCtx() {
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    if (!songCtx) {
      songCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (songCtx.state === "suspended") {
      songCtx.resume();
    }
    return songCtx;
  }

  function beep(ctx, freq, start, dur, type, volume) {
    if (!freq) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "triangle";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t0 = start;
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function playMelody(songKey) {
    if (!soundOn()) return null;
    const song = SONGS[songKey] || SONGS.roses;
    const ctx = ensureCtx();
    if (!ctx) return null;

    const now = ctx.currentTime;
    if (now < playingUntil) {
      // overlap softly — still allow reward songs
    }

    let t = now + 0.02;
    song.notes.forEach(([freq, beats]) => {
      const dur = Math.max(0.05, beats * song.tempo * 2.2);
      if (freq) {
        beep(ctx, freq, t, dur * 0.92, "triangle", 0.14);
        beep(ctx, freq * 2, t, dur * 0.7, "sine", 0.05);
      }
      t += dur;
    });
    playingUntil = t;
    return song.name;
  }

  window.playRewardSong = function playRewardSong(kind) {
    const map = {
      unlock: "roses",
      level: "princess",
      daily: "gift",
      stars: "stars",
      save: "stars",
    };
    return playMelody(map[kind] || "roses");
  };

  window.KOKO_SONGS = SONGS;
})();
