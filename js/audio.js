'use strict';

/* ============================================================
   Звук: все эффекты синтезируются WebAudio (без файлов),
   речь — Web Speech API (ru-RU), если доступна.
   ============================================================ */

FX.audio = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  },

  /* Один тон с огибающей громкости и опциональным глиссандо */
  tone(freq, when, dur, opts = {}) {
    const { type = 'sine', vol = 0.2, slide = 0 } = opts;
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(when);
    o.stop(when + dur + 0.05);
  },

  play(name) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const t = this.tone.bind(this);
    switch (name) {
      case 'click':
        t(520, now, 0.07, { type: 'triangle', vol: 0.14 });
        break;
      case 'pop':
        t(FX.rand(560, 900), now, 0.09, { vol: 0.2, slide: 1250 });
        break;
      case 'flip':
        t(300, now, 0.12, { vol: 0.13, slide: 640 });
        break;
      case 'wrong':
        t(230, now, 0.2, { type: 'sawtooth', vol: 0.07, slide: 150 });
        t(165, now + 0.11, 0.2, { vol: 0.12, slide: 120 });
        break;
      case 'correct': /* до-ми-соль */
        [523.25, 659.25, 783.99].forEach((f, i) =>
          t(f, now + i * 0.085, 0.16, { type: 'triangle', vol: 0.19 }));
        break;
      case 'complete': /* фанфары */
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          t(f, now + i * 0.1, 0.2, { type: 'triangle', vol: 0.21 }));
        t(1568, now + 0.44, 0.35, { vol: 0.14 });
        break;
      case 'star':
        t(1318.5, now, 0.28, { vol: 0.17 });
        t(1975.5, now + 0.06, 0.34, { vol: 0.1 });
        break;
    }
  },

  setMuted(m) {
    this.muted = m;
    FX.save('fox_muted', m ? '1' : '0');
    if (m && window.speechSynthesis) speechSynthesis.cancel();
  }
};

FX.audio.muted = FX.load('fox_muted', '0') === '1';

/* ---------- речь ---------- */

FX._ruVoice = null;

FX._findRuVoice = () => {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices() || [];
  const ru = vs.filter(v => (v.lang || '').toLowerCase().startsWith('ru'));
  if (!ru.length) return null;
  return ru.find(v => /milena|katya|google/i.test(v.name)) || ru[0];
};

if ('speechSynthesis' in window) {
  FX._ruVoice = FX._findRuVoice();
  speechSynthesis.addEventListener('voiceschanged', () => {
    FX._ruVoice = FX._findRuVoice();
  });
}

FX.speak = (text, opts = {}) => {
  if (FX.audio.muted || !text) return;
  if (!('speechSynthesis' in window)) return;
  try {
    if (!opts.queue) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(FX.noEmoji(text));
    u.lang = 'ru-RU';
    u.rate = opts.rate || 0.95;
    u.pitch = opts.pitch || 1.12;
    if (FX._ruVoice) u.voice = FX._ruVoice;
    speechSynthesis.speak(u);
  } catch (e) { /* речь не критична */ }
};

FX.stopSpeech = () => {
  if ('speechSynthesis' in window) {
    try { speechSynthesis.cancel(); } catch (e) {}
  }
};
