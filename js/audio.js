// Audio engine — Style C prototype: realistic poker table + playful victory cues.
const Audio = (() => {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  const activeSources = new Set();

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const random = (min, max) => min + Math.random() * (max - min);

  function getCtx() {
    if (!ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio API is not supported.");
      ctx = new AudioContextClass();

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;

      master = ctx.createGain();
      master.gain.value = 0.78;
      master.connect(compressor);
      compressor.connect(ctx.destination);
    }

    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function trackSource(source, extraNodes = []) {
    activeSources.add(source);
    source.addEventListener("ended", () => {
      activeSources.delete(source);
      [source, ...extraNodes].forEach(node => {
        try { node.disconnect(); } catch (_) {}
      });
    }, { once: true });
  }

  function getNoiseBuffer(c) {
    if (noiseBuffer && noiseBuffer.sampleRate === c.sampleRate) return noiseBuffer;
    const length = c.sampleRate;
    noiseBuffer = c.createBuffer(1, length, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    return noiseBuffer;
  }

  function tone({
    freq = 440,
    endFreq = null,
    type = "sine",
    gain = 0.08,
    start = 0,
    duration = 0.12,
    attack = 0.004,
    detune = 0,
  } = {}) {
    try {
      const c = getCtx();
      const now = c.currentTime + Math.max(0, start);
      const osc = c.createOscillator();
      const amp = c.createGain();

      osc.type = type;
      osc.detune.value = detune;
      osc.frequency.setValueAtTime(Math.max(20, freq), now);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);

      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + Math.min(attack, duration * 0.45));
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(amp);
      amp.connect(master);
      osc.start(now);
      osc.stop(now + duration + 0.02);
      trackSource(osc, [amp]);
    } catch (error) {
      console.warn("Audio tone error:", error);
    }
  }

  function noise({
    gain = 0.05,
    start = 0,
    duration = 0.08,
    attack = 0.002,
    highpass = 500,
    lowpass = 7000,
    playbackRate = 1,
  } = {}) {
    try {
      const c = getCtx();
      const now = c.currentTime + Math.max(0, start);
      const source = c.createBufferSource();
      const hp = c.createBiquadFilter();
      const lp = c.createBiquadFilter();
      const amp = c.createGain();

      source.buffer = getNoiseBuffer(c);
      source.playbackRate.value = clamp(playbackRate, 0.35, 3);
      hp.type = "highpass";
      hp.frequency.value = highpass;
      lp.type = "lowpass";
      lp.frequency.value = lowpass;

      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + Math.min(attack, duration * 0.35));
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      source.connect(hp);
      hp.connect(lp);
      lp.connect(amp);
      amp.connect(master);
      source.start(now, random(0, 0.7), duration + 0.03);
      source.stop(now + duration + 0.04);
      trackSource(source, [hp, lp, amp]);
    } catch (error) {
      console.warn("Audio noise error:", error);
    }
  }

  function cardSlide(start = 0, strength = 1) {
    noise({
      start,
      duration: 0.085,
      gain: 0.052 * strength,
      highpass: 850,
      lowpass: 6200,
      playbackRate: random(1.05, 1.35),
    });
    tone({
      start: start + 0.012,
      freq: random(1050, 1320),
      endFreq: random(720, 880),
      type: "triangle",
      gain: 0.012 * strength,
      duration: 0.055,
    });
  }

  function ceramicChip(start = 0, strength = 1, pitch = 1) {
    tone({
      start,
      freq: random(1350, 1650) * pitch,
      endFreq: random(850, 1050) * pitch,
      type: "triangle",
      gain: 0.034 * strength,
      attack: 0.001,
      duration: 0.048,
      detune: random(-16, 16),
    });
    noise({
      start,
      duration: 0.025,
      gain: 0.012 * strength,
      highpass: 1700,
      lowpass: 9000,
      playbackRate: random(1.5, 2.2),
    });
  }

  function woodKnock(start = 0, strength = 1) {
    tone({ start, freq: 165, endFreq: 92, type: "sine", gain: 0.08 * strength, duration: 0.075, attack: 0.001 });
    tone({ start: start + 0.004, freq: 360, endFreq: 190, type: "triangle", gain: 0.025 * strength, duration: 0.045, attack: 0.001 });
  }

  function chipCascade({ count = 5, interval = 0.026, start = 0, strength = 1, rising = false } = {}) {
    for (let i = 0; i < count; i += 1) {
      const progress = count <= 1 ? 0 : i / (count - 1);
      ceramicChip(start + i * interval + random(0, 0.008), strength * random(0.72, 1), rising ? 0.85 + progress * 0.32 : random(0.88, 1.12));
    }
  }

  function chimeSequence(notes, { start = 0, interval = 0.075, strength = 1, duration = 0.42 } = {}) {
    notes.forEach((freq, index) => {
      tone({ start: start + index * interval, freq, type: "sine", gain: 0.055 * strength, duration, attack: 0.004 });
      tone({ start: start + index * interval, freq: freq * 2, type: "triangle", gain: 0.018 * strength, duration: duration * 0.72, attack: 0.003 });
    });
  }

  const api = {
    deal() {
      cardSlide(0, 1);
    },

    streetDeal() {
      [0, 0.09, 0.18].forEach((delay, index) => cardSlide(delay, 0.95 - index * 0.05));
    },

    chip() {
      ceramicChip(0, 0.92);
      ceramicChip(0.032, 0.68, 0.92);
    },

    check() {
      woodKnock(0, 0.78);
      woodKnock(0.105, 0.62);
    },

    fold() {
      noise({ duration: 0.18, gain: 0.058, highpass: 420, lowpass: 3300, playbackRate: 0.72 });
      tone({ start: 0.025, freq: 310, endFreq: 155, type: "triangle", gain: 0.022, duration: 0.18 });
    },

    raise() {
      woodKnock(0, 0.46);
      chipCascade({ count: 6, interval: 0.032, start: 0.045, strength: 0.92, rising: true });
    },

    allIn() {
      tone({ freq: 96, endFreq: 43, type: "sine", gain: 0.16, duration: 0.32, attack: 0.002 });
      noise({ start: 0.012, duration: 0.11, gain: 0.055, highpass: 80, lowpass: 850, playbackRate: 0.7 });
      chipCascade({ count: 13, interval: 0.025, start: 0.055, strength: 1.06, rising: false });
      woodKnock(0.29, 0.58);
    },

    turn() {
      chimeSequence([659.25, 880], { interval: 0.09, strength: 0.72, duration: 0.28 });
    },

    win() {
      chipCascade({ count: 7, interval: 0.024, start: 0, strength: 0.72, rising: true });
      chimeSequence([523.25, 659.25, 783.99, 1046.5], { start: 0.12, interval: 0.085, strength: 1, duration: 0.5 });
    },

    unlock() {
      chimeSequence([783.99, 987.77, 1174.66, 1567.98], { interval: 0.07, strength: 0.92, duration: 0.46 });
      tone({ start: 0.24, freq: 2093, type: "sine", gain: 0.025, duration: 0.5, attack: 0.004 });
    },

    button() {
      tone({ freq: 690, endFreq: 520, type: "triangle", gain: 0.025, duration: 0.045, attack: 0.001 });
    },

    preview(name) {
      if (typeof api[name] === "function" && name !== "preview" && name !== "cleanup") api[name]();
    },

    cleanup() {
      activeSources.forEach(source => {
        try { source.stop(); } catch (_) {}
        try { source.disconnect(); } catch (_) {}
      });
      activeSources.clear();
    },
  };

  return api;
})();

// Temporary listening panel for the Style C prototype.
(() => {
  const panelId = "audioPreviewPanelC";

  function closePanel() {
    const panel = document.querySelector(`#${panelId}`);
    const trigger = document.querySelector("#audioPreviewButtonC");
    if (!panel || !trigger) return;
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function installPreview() {
    const muteButton = document.querySelector("#muteButton");
    if (!muteButton || document.querySelector("#audioPreviewButtonC")) return;

    const style = document.createElement("style");
    style.id = "audioPreviewStylesC";
    style.textContent = `
      #audioPreviewButtonC[aria-expanded="true"] { border-color: rgba(240,194,94,.58); color: var(--gold); background: rgba(240,194,94,.12); }
      .audio-preview-panel-c { position: fixed; z-index: 180; top: 72px; right: 16px; width: min(390px, calc(100vw - 24px)); padding: 14px; border: 1px solid rgba(240,194,94,.38); border-radius: 14px; background: rgba(5,13,17,.97); color: var(--ink); box-shadow: 0 24px 60px rgba(0,0,0,.5); backdrop-filter: blur(18px); }
      .audio-preview-panel-c[hidden] { display: none; }
      :root[data-theme="light"] .audio-preview-panel-c { background: rgba(255,250,239,.98); border-color: rgba(95,69,35,.22); }
      .audio-preview-head-c { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
      .audio-preview-head-c p, .audio-preview-head-c h2, .audio-preview-head-c span { margin: 0; }
      .audio-preview-head-c p { color: var(--gold); font-size: .64rem; font-weight: 950; letter-spacing: .08em; text-transform: uppercase; }
      .audio-preview-head-c h2 { margin-top: 2px; font-size: 1rem; }
      .audio-preview-head-c span { display: block; margin-top: 4px; color: var(--muted); font-size: .7rem; line-height: 1.4; }
      .audio-preview-close-c { width: 30px; min-width: 30px; min-height: 30px; padding: 0; border-radius: 999px; background: rgba(255,255,255,.08); color: var(--ink); box-shadow: none; }
      .audio-preview-grid-c { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
      .audio-preview-grid-c button { min-height: 42px; border-radius: 9px; font-size: .76rem; }
      .audio-preview-note-c { margin: 10px 0 0; color: var(--muted); font-size: .64rem; line-height: 1.45; text-align: center; }
      @media (max-width: 620px) { .audio-preview-panel-c { top: 56px; right: 10px; } }
    `;
    document.head.appendChild(style);

    const trigger = document.createElement("button");
    trigger.id = "audioPreviewButtonC";
    trigger.className = "ghost-button tool-button";
    trigger.type = "button";
    trigger.textContent = "🎧 試聽";
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", panelId);
    muteButton.insertAdjacentElement("afterend", trigger);

    const panel = document.createElement("section");
    panel.id = panelId;
    panel.className = "audio-preview-panel-c";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "音效風格 C 試聽");
    panel.innerHTML = `
      <header class="audio-preview-head-c">
        <div>
          <p>Sound Style C</p>
          <h2>寫實牌桌＋童趣勝利</h2>
          <span>牌局操作維持紙牌、陶瓷籌碼與木桌質感；勝利與解鎖使用溫暖童話鐘聲。</span>
        </div>
        <button class="audio-preview-close-c" type="button" aria-label="關閉音效試聽">×</button>
      </header>
      <div class="audio-preview-grid-c">
        <button type="button" data-audio-preview="deal">🃏 發牌</button>
        <button type="button" data-audio-preview="chip">🪙 跟注籌碼</button>
        <button type="button" data-audio-preview="check">✊ 過牌敲桌</button>
        <button type="button" data-audio-preview="raise">📈 加注</button>
        <button type="button" data-audio-preview="allIn">🔥 All-in</button>
        <button type="button" data-audio-preview="fold">↩ 棄牌</button>
        <button type="button" data-audio-preview="win">🏆 勝利</button>
        <button type="button" data-audio-preview="unlock">✨ 解鎖</button>
      </div>
      <p class="audio-preview-note-c">目前是輕量合成試玩版，不需下載大型音效檔；確定方向後再換成正式錄製素材。</p>`;
    document.body.appendChild(panel);

    trigger.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      trigger.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) Audio.button();
    });
    panel.querySelector(".audio-preview-close-c")?.addEventListener("click", closePanel);
    panel.addEventListener("click", event => {
      const button = event.target.closest("[data-audio-preview]");
      if (button) Audio.preview(button.dataset.audioPreview);
    });
    document.addEventListener("click", event => {
      if (!panel.hidden && !panel.contains(event.target) && !trigger.contains(event.target)) closePanel();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) closePanel();
    });
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", installPreview, { once: true })
    : installPreview();
})();