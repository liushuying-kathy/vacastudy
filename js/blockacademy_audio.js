// BlockAcademy 全局音频 · CC0 原创 8-bit BGM + 音效 + 本地音乐导入（IndexedDB）

const BA_NOTE_FREQ = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, REST: 0
};

const BA_CHIP_TRACKS = {
  "chip-explore": {
    name: "方块探险曲",
    desc: "CC0 · 8-bit 原创 · 探险地图",
    tempo: 128,
    melody: [
      ["C4", 1], ["E4", 1], ["G4", 1], ["C5", 1], ["G4", 1], ["E4", 1], ["C4", 2],
      ["D4", 1], ["F4", 1], ["A4", 1], ["D5", 1], ["A4", 1], ["F4", 1], ["D4", 2],
      ["E4", 1], ["G4", 1], ["C5", 1], ["G4", 1], ["E4", 1], ["C4", 2], ["REST", 1]
    ]
  },
  "chip-focus": {
    name: "像素自习室",
    desc: "CC0 · 8-bit 原创 · 答题专注",
    tempo: 100,
    melody: [
      ["E4", 2], ["G4", 2], ["A4", 4], ["G4", 2], ["E4", 2], ["C4", 4],
      ["D4", 2], ["F4", 2], ["A4", 4], ["G4", 2], ["E4", 2], ["REST", 2]
    ]
  },
  "chip-calm": {
    name: "星夜营地",
    desc: "CC0 · 8-bit 原创 · 轻松背景",
    tempo: 88,
    melody: [
      ["C4", 3], ["G3", 3], ["E4", 3], ["C4", 3], ["A3", 6],
      ["F3", 3], ["A3", 3], ["C4", 3], ["E4", 3], ["G3", 6], ["REST", 2]
    ]
  }
};

const BA_IDB_NAME = "ba_audio_db";
const BA_IDB_STORE = "custom_bgm";

let baAudioCtx = null;
let baBgmGain = null;
let baSfxGain = null;
let baChipTimer = null;
let baChipStep = 0;
let baHtmlBgm = null;
let baHtmlBgmUrl = null;
let baLastRankIdx = 0;
let baCustomTracksCache = [];
let baAudioReady = false;

function baEnsureAudioSettings() {
  if (!state) return;
  if (!state.audioSettings) {
    state.audioSettings = {
      bgmEnabled: true,
      sfxEnabled: false,
      bgmVolume: 0.45,
      sfxVolume: 0.75,
      trackId: "chip-explore",
      customTrackId: ""
    };
  }
  const a = state.audioSettings;
  if (a.bgmEnabled === undefined) a.bgmEnabled = true;
  if (a.sfxEnabled === undefined) a.sfxEnabled = false;
  if (a.bgmVolume === undefined) a.bgmVolume = 0.45;
  if (a.sfxVolume === undefined) a.sfxVolume = 0.75;
  if (!a.trackId) a.trackId = "chip-explore";
}

function baMigrateAudio() {
  baEnsureAudioSettings();
}

function baGetRankIndex(xp) {
  if (typeof RANKS === "undefined") return 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].xp) return i;
  }
  return 0;
}

function baEnsureAudioContext() {
  if (baAudioCtx) return baAudioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  baAudioCtx = new AC();
  baBgmGain = baAudioCtx.createGain();
  baSfxGain = baAudioCtx.createGain();
  baBgmGain.connect(baAudioCtx.destination);
  baSfxGain.connect(baAudioCtx.destination);
  baApplyVolumeSettings();
  return baAudioCtx;
}

function baApplyVolumeSettings() {
  baEnsureAudioSettings();
  const a = state.audioSettings;
  if (baBgmGain) baBgmGain.gain.value = a.bgmEnabled ? a.bgmVolume : 0;
  if (baSfxGain) baSfxGain.gain.value = a.sfxEnabled ? a.sfxVolume : 0;
  if (baHtmlBgm) baHtmlBgm.volume = Math.min(1, a.bgmVolume);
}

function baAudioResume() {
  const ctx = baEnsureAudioContext();
  if (ctx && ctx.state === "suspended") ctx.resume();
  baApplyVolumeSettings();
  if (state?.audioSettings?.bgmEnabled) baAudioStartBgm();
}

function baAudioInit() {
  baEnsureAudioSettings();
  baLastRankIdx = baGetRankIndex(state?.user?.xp || 0);
  baAudioReady = true;
  baAudioBindUnlock();
  baLoadCustomTrackList().then(() => {
    if (state?.audioSettings?.bgmEnabled) baAudioStartBgm();
  }).catch(() => {});
}

let baAudioUnlockBound = false;
function baAudioBindUnlock() {
  if (baAudioUnlockBound) return;
  baAudioUnlockBound = true;
  const unlock = () => {
    baAudioResume();
  };
  document.addEventListener("click", unlock, { once: true, capture: true });
  document.addEventListener("touchstart", unlock, { once: true, capture: true });
}

function baAudioStopAll() {
  baAudioStopBgm();
  if (baAudioCtx && baAudioCtx.state !== "closed") {
    try { baAudioCtx.suspend(); } catch (e) {}
  }
}

function baBeatSec(track, beats) {
  return (60 / track.tempo) * beats;
}

function baPlayChipNote(note, durationSec, wave) {
  const ctx = baEnsureAudioContext();
  if (!ctx || !baBgmGain || note === "REST" || !BA_NOTE_FREQ[note]) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = wave || "square";
  osc.frequency.value = BA_NOTE_FREQ[note];
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.05, durationSec));
  osc.connect(g);
  g.connect(baBgmGain);
  osc.start(t);
  osc.stop(t + durationSec + 0.02);
}

function baChipBgmTick() {
  const trackId = state?.audioSettings?.trackId;
  if (!trackId || !trackId.startsWith("chip-") || !state?.audioSettings?.bgmEnabled) return;
  const track = BA_CHIP_TRACKS[trackId];
  if (!track) return;
  const row = track.melody[baChipStep % track.melody.length];
  baChipStep++;
  const [note, beats] = row;
  const dur = baBeatSec(track, beats);
  baPlayChipNote(note, dur * 0.92, baChipStep % 2 ? "square" : "triangle");
  baChipTimer = setTimeout(baChipBgmTick, dur * 1000);
}

function baStopChipBgm() {
  if (baChipTimer) { clearTimeout(baChipTimer); baChipTimer = null; }
  baChipStep = 0;
}

function baStopHtmlBgm() {
  if (baHtmlBgm) {
    baHtmlBgm.pause();
    baHtmlBgm.src = "";
    baHtmlBgm = null;
  }
  if (baHtmlBgmUrl) {
    URL.revokeObjectURL(baHtmlBgmUrl);
    baHtmlBgmUrl = null;
  }
}

function baAudioStopBgm() {
  baStopChipBgm();
  baStopHtmlBgm();
}

async function baAudioStartBgm() {
  baEnsureAudioSettings();
  if (!state.audioSettings.bgmEnabled) { baAudioStopBgm(); return; }
  baEnsureAudioContext();
  baApplyVolumeSettings();
  const trackId = state.audioSettings.trackId || "chip-explore";

  if (trackId.startsWith("custom:")) {
    baStopChipBgm();
    const id = trackId.slice(7);
    const blob = await baLoadCustomTrackBlob(id);
    if (!blob) return;
    baStopHtmlBgm();
    baHtmlBgmUrl = URL.createObjectURL(blob);
    baHtmlBgm = new Audio(baHtmlBgmUrl);
    baHtmlBgm.loop = true;
    baHtmlBgm.volume = state.audioSettings.bgmVolume;
    try { await baHtmlBgm.play(); } catch (e) {}
    return;
  }

  baStopHtmlBgm();
  if (BA_CHIP_TRACKS[trackId]) {
    baStopChipBgm();
    baChipStep = 0;
    baChipBgmTick();
  }
}

function baPlayTone(freq, duration, type, vol) {
  const ctx = baEnsureAudioContext();
  if (!ctx || !baSfxGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || "square";
  osc.frequency.value = freq;
  const t = ctx.currentTime;
  const v = (vol || 0.15) * (state.audioSettings.sfxVolume || 0.75);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(v, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g);
  g.connect(baSfxGain);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function baAudioPlaySfx(kind, forcePreview) {
  if (!forcePreview && !state?.audioSettings?.sfxEnabled) return;
  baEnsureAudioContext();
  if (baAudioCtx?.state === "suspended") baAudioCtx.resume();
  if (forcePreview && baSfxGain && state?.audioSettings) {
    baSfxGain.gain.value = state.audioSettings.sfxVolume || 0.75;
  }
  const seq = {
    correct: () => { baPlayTone(523, 0.08, "square", 0.12); setTimeout(() => baPlayTone(784, 0.12, "square", 0.14), 70); },
    wrong: () => { baPlayTone(196, 0.18, "sawtooth", 0.1); setTimeout(() => baPlayTone(147, 0.22, "sawtooth", 0.08), 90); },
    levelup: () => {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => baPlayTone(f, 0.14, "square", 0.13), i * 85));
    },
    complete: () => {
      [392, 523, 659, 784].forEach((f, i) => setTimeout(() => baPlayTone(f, 0.1, "triangle", 0.12), i * 65));
    },
    gem: () => { baPlayTone(988, 0.06, "sine", 0.1); setTimeout(() => baPlayTone(1319, 0.1, "sine", 0.12), 50); },
    craft: () => { baPlayTone(330, 0.07, "square", 0.11); setTimeout(() => baPlayTone(440, 0.12, "square", 0.13), 60); },
    click: () => baPlayTone(660, 0.04, "square", 0.06)
  };
  (seq[kind] || seq.click)();
  if (forcePreview) setTimeout(() => baApplyVolumeSettings(), 700);
}

function baAudioCheckLevelUp() {
  if (!baAudioReady || !state) return;
  const idx = baGetRankIndex(state.user.xp || 0);
  if (idx > baLastRankIdx) {
    baLastRankIdx = idx;
    baAudioPlaySfx("levelup");
  }
}

function baOpenAudioDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BA_IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BA_IDB_STORE)) db.createObjectStore(BA_IDB_STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function baLoadCustomTrackList() {
  try {
    const db = await baOpenAudioDb();
    const list = await new Promise((resolve, reject) => {
      const tx = db.transaction(BA_IDB_STORE, "readonly");
      const req = tx.objectStore(BA_IDB_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    baCustomTracksCache = list.map(x => ({ id: x.id, name: x.name, size: x.size || 0 }));
    return baCustomTracksCache;
  } catch (e) {
    baCustomTracksCache = [];
    return [];
  }
}

async function baLoadCustomTrackBlob(id) {
  const db = await baOpenAudioDb();
  const row = await new Promise((resolve, reject) => {
    const tx = db.transaction(BA_IDB_STORE, "readonly");
    const req = tx.objectStore(BA_IDB_STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!row?.data) return null;
  return new Blob([row.data], { type: row.mime || "audio/mpeg" });
}

async function baImportCustomBgm(file) {
  if (!file) return;
  const okTypes = /^audio\//;
  if (!okTypes.test(file.type) && !/\.(mp3|ogg|wav|m4a|aac|flac)$/i.test(file.name)) {
    if (typeof showToast === "function") showToast("请选择音频文件（MP3/OGG/WAV 等）");
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    if (typeof showToast === "function") showToast("单文件不超过 8MB");
    return;
  }
  const buf = await file.arrayBuffer();
  const id = "c" + Date.now().toString(36);
  const row = { id, name: file.name.replace(/\.[^.]+$/, ""), mime: file.type || "audio/mpeg", size: file.size, data: buf, at: Date.now() };
  const db = await baOpenAudioDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(BA_IDB_STORE, "readwrite");
    tx.objectStore(BA_IDB_STORE).put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  baEnsureAudioSettings();
  state.audioSettings.trackId = "custom:" + id;
  state.audioSettings.customTrackId = id;
  if (typeof save === "function") save();
  await baLoadCustomTrackList();
  baAudioResume();
  if (typeof showToast === "function") showToast("🎵 已导入：" + row.name);
  baRenderSettingsScreen();
}

async function baDeleteCustomBgm(id) {
  const db = await baOpenAudioDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(BA_IDB_STORE, "readwrite");
    tx.objectStore(BA_IDB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  baEnsureAudioSettings();
  if (state.audioSettings.trackId === "custom:" + id) state.audioSettings.trackId = "chip-explore";
  if (state.audioSettings.customTrackId === id) state.audioSettings.customTrackId = "";
  if (typeof save === "function") save();
  await baLoadCustomTrackList();
  baAudioStartBgm();
  baRenderSettingsScreen();
  if (typeof showToast === "function") showToast("已删除本地音乐");
}

function baSetBgmVolume(v) {
  baEnsureAudioSettings();
  state.audioSettings.bgmVolume = Math.max(0, Math.min(1, v / 100));
  baApplyVolumeSettings();
  if (typeof save === "function") save();
}

function baSetSfxVolume(v) {
  baEnsureAudioSettings();
  state.audioSettings.sfxVolume = Math.max(0, Math.min(1, v / 100));
  baApplyVolumeSettings();
  if (typeof save === "function") save();
}

function baSetAudioTrack(trackId) {
  baEnsureAudioSettings();
  state.audioSettings.trackId = trackId;
  if (typeof save === "function") save();
  baAudioResume();
  baRenderSettingsScreen();
}

function baToggleBgm(on) {
  baEnsureAudioSettings();
  state.audioSettings.bgmEnabled = !!on;
  if (typeof save === "function") save();
  if (on) baAudioResume();
  else baAudioStopBgm();
  baRenderSettingsScreen();
}

function baToggleSfx(on) {
  baEnsureAudioSettings();
  state.audioSettings.sfxEnabled = !!on;
  if (typeof save === "function") save();
  baApplyVolumeSettings();
  baRenderSettingsScreen();
}

function baRenderSettingsScreen() {
  const el = document.getElementById("settings-panel");
  if (!el || !state) return;
  baEnsureAudioSettings();
  const a = state.audioSettings;
  const chipOpts = Object.entries(BA_CHIP_TRACKS).map(([id, t]) =>
    `<option value="${id}"${a.trackId === id ? " selected" : ""}>${t.name} — ${t.desc}</option>`
  ).join("");
  const customOpts = baCustomTracksCache.map(t =>
    `<option value="custom:${t.id}"${a.trackId === "custom:" + t.id ? " selected" : ""}>📁 ${t.name}</option>`
  ).join("");
  const customList = baCustomTracksCache.length
    ? baCustomTracksCache.map(t =>
        `<div class="recipe-item" style="justify-content:space-between">
          <span>📁 ${t.name}</span>
          <button class="pixel-btn danger" style="font-size:10px;padding:4px 8px" onclick="baDeleteCustomBgm('${t.id}')">删除</button>
        </div>`
      ).join("")
    : `<div style="font-size:11px;color:#888;padding:6px 0">暂无导入音乐，可选择 MP3/OGG/WAV（仅存本机）</div>`;

  el.innerHTML = `
    <div style="font-size:11px;color:#888;margin-bottom:12px;line-height:1.6">
      内置曲目为 <strong>CC0 原创 8-bit</strong> 风格，非任天堂原曲。导入的音乐仅保存在本浏览器，不会上传。
    </div>
    <div class="pixel-panel" style="margin-bottom:10px;padding:12px">
      <h4 style="color:var(--mc-gold);font-size:13px;margin-bottom:10px">🎵 背景音乐</h4>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:10px;cursor:pointer">
        <input type="checkbox" id="set-bgm-on" ${a.bgmEnabled ? "checked" : ""} onchange="baToggleBgm(this.checked)">
        开启背景音乐
      </label>
      <label style="font-size:12px;color:#aaa;display:block;margin-bottom:4px">BGM 音量：${Math.round(a.bgmVolume * 100)}%</label>
      <input type="range" min="0" max="100" value="${Math.round(a.bgmVolume * 100)}" style="width:100%;margin-bottom:10px"
        oninput="baSetBgmVolume(+this.value); this.previousElementSibling.textContent='BGM 音量：'+this.value+'%'">
      <label style="font-size:12px;color:#aaa;display:block;margin-bottom:4px">选择曲目</label>
      <select class="subject-select" style="width:100%;margin:0 0 10px" onchange="baSetAudioTrack(this.value)">
        ${chipOpts}${customOpts}
      </select>
      <label class="pixel-btn" style="display:block;text-align:center;cursor:pointer;margin:0">
        📥 导入本地音乐
        <input type="file" accept="audio/*,.mp3,.ogg,.wav,.m4a" style="display:none" onchange="baImportCustomBgm(this.files[0]); this.value=''">
      </label>
      <div style="margin-top:10px">${customList}</div>
      <button class="pixel-btn primary" style="width:100%;margin-top:10px" onclick="baAudioResume(); baAudioPlaySfx('click')">▶ 试听当前 BGM</button>
    </div>
    <div class="pixel-panel" style="padding:12px">
      <h4 style="color:var(--mc-gold);font-size:13px;margin-bottom:10px">🔔 游戏音效</h4>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:10px;cursor:pointer">
        <input type="checkbox" id="set-sfx-on" ${a.sfxEnabled ? "checked" : ""} onchange="baToggleSfx(this.checked)">
        开启音效（答对 / 答错 / 升级 / 完成 / 宝石 / 合成）
      </label>
      <label style="font-size:12px;color:#aaa;display:block;margin-bottom:4px">音效音量：${Math.round(a.sfxVolume * 100)}%</label>
      <input type="range" min="0" max="100" value="${Math.round(a.sfxVolume * 100)}" style="width:100%;margin-bottom:10px"
        oninput="baSetSfxVolume(+this.value); this.previousElementSibling.textContent='音效音量：'+this.value+'%'">
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        <button class="pixel-btn" style="font-size:10px" onclick="baAudioPlaySfx('correct', true)">✅ 答对</button>
        <button class="pixel-btn" style="font-size:10px" onclick="baAudioPlaySfx('wrong', true)">❌ 答错</button>
        <button class="pixel-btn" style="font-size:10px" onclick="baAudioPlaySfx('levelup', true)">⬆ 升级</button>
        <button class="pixel-btn" style="font-size:10px" onclick="baAudioPlaySfx('complete', true)">🎉 完成</button>
        <button class="pixel-btn" style="font-size:10px" onclick="baAudioPlaySfx('gem', true)">💎 宝石</button>
        <button class="pixel-btn" style="font-size:10px" onclick="baAudioPlaySfx('craft', true)">⚒ 合成</button>
      </div>
    </div>`;
}
