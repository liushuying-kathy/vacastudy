// BlockAcademy 脑科学神殿 · 阶段1进阶模块
// 记忆水晶(N-back) · 变形符文(任务切换) · 追踪之眼(CPT)

const BA_NBACK_SYMBOLS = ["🌟", "🔥", "💧", "🌿", "⚡"];
const BA_NBACK_TRIALS = 15;
const BA_NBACK_STREAK_TO_LEVEL = 8;

const BA_SWITCH_COLORS = [
  { id: "warm", label: "暖色", hex: "#e8b923", shapes: ["●", "★"] },
  { id: "cool", label: "冷色", hex: "#1e90ff", shapes: ["◆", "▲"] }
];
const BA_SWITCH_SHAPES = [
  { id: "round", label: "圆角", chars: ["●", "◆"] },
  { id: "sharp", label: "尖角", chars: ["▲", "★"] }
];

const BA_CPT_DURATION_MS = 90000;
const BA_CPT_ISI_MIN = 700;
const BA_CPT_ISI_MAX = 1400;
const BA_CPT_RARE_RATE = 0.1;

function baEnsureBrainProfile() {
  if (!state) return;
  if (!state.brainProfile) {
    state.brainProfile = {
      nbackN: 1,
      nbackBest: 1,
      switchBest: 0,
      cptBest: 0,
      stormBest: 0,
      stormChainLen: 2,
      dualBest: 0,
      stroopBest: 0,
      gonogoBest: 0,
      mazeBest: 0,
      mazeLevel: 1,
      timeBest: 0,
      timeStreak: 0,
      wcstBest: 0,
      mindfulDays: 0,
      lastMindfulDay: "",
      sessions: {}
    };
  }
  if (!state.brainProfile.sessions) state.brainProfile.sessions = {};
}

function baBrainClearTimers(gs) {
  if (!gs) return;
  if (gs.brainTimer) { clearTimeout(gs.brainTimer); gs.brainTimer = null; }
  if (gs.gonogoTimer) { clearTimeout(gs.gonogoTimer); gs.gonogoTimer = null; }
  if (gs.cptTimer) { clearInterval(gs.cptTimer); gs.cptTimer = null; }
  if (gs.cptStimulusTimer) { clearTimeout(gs.cptStimulusTimer); gs.cptStimulusTimer = null; }
  if (gs.dualTimer) { clearTimeout(gs.dualTimer); gs.dualTimer = null; }
  if (gs.stormTimer) { clearTimeout(gs.stormTimer); gs.stormTimer = null; }
  if (gs.mazeTimer) { clearTimeout(gs.mazeTimer); gs.mazeTimer = null; }
  if (gs.timeHoldTimer) { clearInterval(gs.timeHoldTimer); gs.timeHoldTimer = null; }
  if (gs.mindfulTimer) { clearInterval(gs.mindfulTimer); gs.mindfulTimer = null; }
  if (gs.breathTimer) { clearInterval(gs.breathTimer); gs.breathTimer = null; }
}

function baBrainIsFreeNode(nodeId) {
  return nodeId === "brain-mindful";
}

function baBrainRecordSession(gs) {
  if (!gs || !state) return;
  baEnsureBrainProfile();
  const rate = gs.total > 0 ? gs.correct / gs.total : 0;
  const pct = Math.round(rate * 100);
  state.brainProfile.sessions[gs.nodeId || gs.mode] = {
    rate: pct,
    correct: gs.correct,
    total: gs.total,
    at: Date.now()
  };
  if (gs.nodeId === "brain-stroop" || gs.mode === "stroop") {
    state.brainProfile.stroopBest = Math.max(state.brainProfile.stroopBest || 0, pct);
  }
  if (gs.nodeId === "brain-sustained" || gs.mode === "gonogo") {
    state.brainProfile.gonogoBest = Math.max(state.brainProfile.gonogoBest || 0, pct);
  }
  if (typeof save === "function") save();
}

function baBrainHarmonicMean(a, b) {
  if (a <= 0 || b <= 0) return 0;
  return Math.round(2 * a * b / (a + b));
}

// ========== 心算风暴 · 链式心算 ==========
const BA_STORM_ROUNDS = 8;

function baPickStormSeed() {
  if (typeof MATH_BANK !== "undefined" && MATH_BANK.length) {
    const it = MATH_BANK[Math.floor(Math.random() * MATH_BANK.length)];
    const m = String(it.a || "").match(/\d+/);
    if (m) return Math.min(99, Math.max(2, parseInt(m[0], 10) % 50 || 5));
  }
  return 5 + Math.floor(Math.random() * 20);
}

function baGenStormChain(steps) {
  let val = baPickStormSeed();
  const parts = [String(val)];
  const ops = [];
  for (let i = 0; i < steps; i++) {
    let op = ["+", "-", "×"][Math.floor(Math.random() * 3)];
    let n = 1 + Math.floor(Math.random() * 9);
    if (op === "×") n = 2 + Math.floor(Math.random() * 4);
    if (op === "-" && val - n < 0) op = "+";
    if (op === "+") val += n;
    else if (op === "-") val -= n;
    else val *= n;
    ops.push({ op, n });
    parts.push(`${op}${n}`);
  }
  return { steps, parts, answer: val, display: parts.join(" → ") + " = ?" };
}

function baStartStormGame() {
  baEnsureBrainProfile();
  const chainLen = Math.min(5, Math.max(2, state.brainProfile.stormChainLen || 2));
  const chains = [];
  for (let i = 0; i < BA_STORM_ROUNDS; i++) chains.push(baGenStormChain(chainLen));
  gameState = {
    mode: "storm",
    biome: "brain",
    nodeId: "brain-storm",
    type: "brain",
    chains,
    current: 0,
    correct: 0,
    total: BA_STORM_ROUNDS,
    chainLen
  };
  baRenderStorm();
  showScreen("scr-game");
}

function baRenderStorm() {
  const gs = gameState;
  if (!gs || gs.mode !== "storm") return;
  const c = gs.chains[gs.current];
  document.getElementById("game-mode").textContent = "⚡ 心算风暴 · 链式运算";
  document.getElementById("game-counter").textContent = `${gs.current + 1}/${gs.total}`;
  document.getElementById("game-progress").style.width = `${(gs.current / gs.total) * 100}%`;
  document.getElementById("game-question").innerHTML =
    `<div style="font-size:13px;color:#ccc;margin-bottom:10px">心算中间结果，输入最终答案（${gs.chainLen} 步运算）</div>` +
    `<div style="font-size:22px;font-weight:800;color:var(--mc-gold);line-height:1.8;word-break:break-all">${c.display}</div>`;
  document.getElementById("game-options").innerHTML = "";
  document.getElementById("game-input-area").classList.remove("hidden");
  const inp = document.getElementById("game-answer");
  if (inp) { inp.value = ""; inp.placeholder = "最终答案"; inp.type = "number"; }
  document.getElementById("game-submit").classList.remove("hidden");
  document.getElementById("game-submit").onclick = () => baStormSubmit();
  document.getElementById("game-next").classList.add("hidden");
  document.getElementById("game-feedback").innerHTML = "";
}

function baStormSubmit() {
  const gs = gameState;
  if (!gs || gs.mode !== "storm") return;
  const c = gs.chains[gs.current];
  const raw = document.getElementById("game-answer")?.value?.trim() || "";
  const user = parseInt(raw, 10);
  const ok = !isNaN(user) && user === c.answer;
  const fb = document.getElementById("game-feedback");
  if (ok) {
    gs.correct++;
    fb.innerHTML = `<span style="color:var(--mc-green)">✅ 正确！</span>`;
    if (gs.correct >= 3 && gs.correct % 3 === 0 && gs.chainLen < 5) gs.chainLen++;
  } else {
    fb.innerHTML = `<span style="color:var(--mc-red)">❌ 正确答案：${c.answer}</span><div style="font-size:11px;color:#888;margin-top:4px">${c.display.replace("?", c.answer)}</div>`;
  }
  document.getElementById("game-submit").classList.add("hidden");
  setTimeout(() => {
    gs.current++;
    if (gs.current >= gs.total) baBrainFinishChallenge();
    else baRenderStorm();
  }, ok ? 700 : 1200);
}

// ========== 双轨隧道 · 数字流 + 斯特鲁普 ==========
const BA_DUAL_TRIALS = 12;
const BA_DUAL_MS = 2800;

function baGenDualTrials(n) {
  const trials = [];
  const colors = typeof STROOP_COLORS !== "undefined" ? STROOP_COLORS : [
    { name: "红", hex: "#cc0000" }, { name: "绿", hex: "#4e9a06" },
    { name: "蓝", hex: "#1e90ff" }, { name: "黄", hex: "#e8b923" }
  ];
  for (let i = 0; i < n; i++) {
    const digit = Math.floor(Math.random() * 10);
    const c = colors[Math.floor(Math.random() * colors.length)];
    const others = colors.filter(x => x.name !== c.name).map(x => x.name).slice(0, 3);
    while (others.length < 3) others.push("?");
    trials.push({
      digit,
      isSeven: digit === 7,
      stroop: {
        text: c.name,
        color: c.hex,
        answer: c.name,
        options: [c.name, ...others].sort(() => Math.random() - 0.5).slice(0, 4)
      }
    });
  }
  return trials;
}

function baStartDualGame() {
  const trials = baGenDualTrials(BA_DUAL_TRIALS);
  gameState = {
    mode: "dual",
    biome: "brain",
    nodeId: "brain-dual",
    type: "brain",
    trials,
    current: 0,
    correct: 0,
    total: BA_DUAL_TRIALS,
    topCorrect: 0,
    bottomCorrect: 0,
    topDone: false,
    bottomDone: false,
    dualTimer: null,
    selectedStroop: null,
    tappedSeven: false
  };
  baRenderDualTrial();
  showScreen("scr-game");
}

function baRenderDualTrial() {
  const gs = gameState;
  if (!gs || gs.mode !== "dual") return;
  const t = gs.trials[gs.current];
  gs.topDone = false;
  gs.bottomDone = false;
  gs.tappedSeven = false;
  gs.selectedStroop = null;

  document.getElementById("game-mode").textContent = "🚇 双轨隧道 · 双任务";
  document.getElementById("game-counter").textContent = `${gs.current + 1}/${gs.total}`;
  document.getElementById("game-progress").style.width = `${(gs.current / gs.total) * 100}%`;

  document.getElementById("game-question").innerHTML =
    `<div style="border:2px solid #444;border-radius:8px;padding:10px;margin-bottom:10px;background:rgba(0,0,0,.2)">
      <div style="font-size:11px;color:var(--mc-gold);margin-bottom:6px">⬆ 上轨：见数字 <strong>7</strong> 就点按钮</div>
      <div style="font-size:48px;font-weight:900;text-align:center;margin:8px 0">${t.digit}</div>
      <button id="dual-seven-btn" class="pixel-btn" style="width:100%;margin:0">👆 是 7 ！</button>
    </div>
    <div style="border:2px solid #444;border-radius:8px;padding:10px;background:rgba(0,0,0,.2)">
      <div style="font-size:11px;color:var(--mc-gold);margin-bottom:6px">⬇ 下轨：这是什么颜色？</div>
      <div style="font-size:36px;font-weight:900;text-align:center;color:${t.stroop.color};margin:6px 0">${t.stroop.text}</div>
    </div>`;

  document.getElementById("dual-seven-btn").onclick = () => {
    gs.tappedSeven = true;
    baDualCheckTop(t);
  };

  const opts = document.getElementById("game-options");
  opts.className = "options-grid";
  opts.innerHTML = "";
  t.stroop.options.forEach(opt => {
    const btn = document.createElement("div");
    btn.className = "q-opt";
    btn.textContent = opt;
    btn.onclick = () => baDualStroopAnswer(opt, t);
    opts.appendChild(btn);
  });

  document.getElementById("game-input-area").classList.add("hidden");
  document.getElementById("game-submit").classList.add("hidden");
  document.getElementById("game-next").classList.add("hidden");
  document.getElementById("game-feedback").innerHTML = "";

  gs.dualTimer = setTimeout(() => baDualTrialTimeout(t), BA_DUAL_MS);
}

function baDualCheckTop(t) {
  const gs = gameState;
  if (gs.topDone) return;
  gs.topDone = true;
  const ok = (t.isSeven && gs.tappedSeven) || (!t.isSeven && !gs.tappedSeven);
  if (ok) gs.topCorrect++;
  baDualMaybeFinish(t);
}

function baDualStroopAnswer(opt, t) {
  const gs = gameState;
  if (gs.bottomDone) return;
  gs.bottomDone = true;
  gs.selectedStroop = opt;
  if (opt === t.stroop.answer) gs.bottomCorrect++;
  document.querySelectorAll("#game-options .q-opt").forEach(b => { b.style.pointerEvents = "none"; });
  baDualMaybeFinish(t);
}

function baDualTrialTimeout(t) {
  const gs = gameState;
  if (!gs || gs.mode !== "dual") return;
  if (!gs.topDone) {
    gs.topDone = true;
    if (!t.isSeven && !gs.tappedSeven) gs.topCorrect++;
  }
  if (!gs.bottomDone) gs.bottomDone = true;
  baDualMaybeFinish(t, true);
}

function baDualMaybeFinish(t, timedOut) {
  const gs = gameState;
  if (!gs.topDone || !gs.bottomDone) return;
  if (gs.dualTimer) { clearTimeout(gs.dualTimer); gs.dualTimer = null; }
  const topOk = (t.isSeven && gs.tappedSeven) || (!t.isSeven && !gs.tappedSeven);
  const botOk = gs.selectedStroop === t.stroop.answer;
  if (topOk && botOk) gs.correct++;

  const fb = document.getElementById("game-feedback");
  fb.innerHTML = `<span style="color:${topOk && botOk ? "var(--mc-green)" : "var(--mc-red)"}">${topOk && botOk ? "✅ 双轨正确" : "△ 上轨" + (topOk ? "✓" : "✗") + " 下轨" + (botOk ? "✓" : "✗")}</span>`;

  setTimeout(() => {
    gs.current++;
    if (gs.current >= gs.total) baBrainFinishChallenge();
    else baRenderDualTrial();
  }, timedOut ? 400 : 700);
}

// ========== 数字迷宫 · 更新 + 抑制 ==========
const BA_MAZE_ROUNDS = 6;

function baGenMazeTrial(level) {
  const count = 5 + Math.floor(Math.random() * 3);
  const items = [];
  for (let i = 0; i < count; i++) {
    const val = 1 + Math.floor(Math.random() * 9);
    const isRed = level >= 2 && Math.random() < 0.35;
    const stored = level >= 3 && isRed ? Math.max(0, val - 1) : val;
    items.push({ val, isRed, stored, ignore: isRed && level === 2 });
  }
  const valid = items.map((it, idx) => {
    if (it.ignore) return null;
    return { v: level >= 3 && it.isRed ? it.stored : it.val, idx };
  }).filter(Boolean);
  const sorted = valid.slice().sort((a, b) => b.v - a.v).slice(0, 3);
  const topIdx = sorted.map(x => x.idx).sort((a, b) => a - b);
  const answer = topIdx.map(i => {
    const it = items[i];
    return level >= 3 && it.isRed ? it.stored : it.val;
  });
  return { items, answer, level };
}

function baStartMazeGame() {
  baEnsureBrainProfile();
  const level = Math.min(3, Math.max(1, state.brainProfile.mazeLevel || 1));
  const trials = [];
  for (let i = 0; i < BA_MAZE_ROUNDS; i++) trials.push(baGenMazeTrial(level));
  gameState = {
    mode: "maze",
    biome: "brain",
    nodeId: "brain-maze",
    type: "brain",
    trials,
    current: 0,
    correct: 0,
    total: BA_MAZE_ROUNDS,
    level,
    phase: "show",
    showIdx: 0
  };
  baRenderMazeShow();
  showScreen("scr-game");
}

function baMazeLevelHint(level) {
  if (level === 1) return "记住所有数字，复述最大的 3 个（按出现顺序）";
  if (level === 2) return "红色数字是干扰，忽略它们";
  return "红色数字减 1 后计入有效数字";
}

function baRenderMazeShow() {
  const gs = gameState;
  if (!gs || gs.mode !== "maze") return;
  const t = gs.trials[gs.current];
  document.getElementById("game-mode").textContent = "🔢 数字迷宫 · 工作记忆";
  document.getElementById("game-counter").textContent = `${gs.current + 1}/${gs.total}`;
  document.getElementById("game-progress").style.width = `${(gs.current / gs.total) * 100}%`;
  const it = t.items[gs.showIdx];
  const color = it.isRed ? "#e34948" : "#fff";
  document.getElementById("game-question").innerHTML =
    `<div style="font-size:12px;color:#aaa;margin-bottom:8px">${baMazeLevelHint(gs.level)} · L${gs.level}</div>` +
    `<div style="font-size:64px;font-weight:900;color:${color}">${it.val}</div>` +
    `<div style="font-size:11px;color:#666">${gs.showIdx + 1}/${t.items.length}</div>`;
  document.getElementById("game-options").innerHTML = "";
  document.getElementById("game-input-area").classList.add("hidden");
  document.getElementById("game-submit").classList.add("hidden");
  document.getElementById("game-feedback").innerHTML = "";
  gs.mazeTimer = setTimeout(() => {
    gs.showIdx++;
    if (gs.showIdx >= t.items.length) baRenderMazeAnswer();
    else baRenderMazeShow();
  }, 900);
}

function baRenderMazeAnswer() {
  const gs = gameState;
  if (!gs || gs.mode !== "maze") return;
  document.getElementById("game-question").innerHTML =
    `<div style="font-size:14px;color:#ccc;margin-bottom:10px">输入最大的 3 个有效数字，按出现顺序（用逗号分隔）</div>` +
    `<div style="font-size:12px;color:#888">例：3,9,4</div>`;
  document.getElementById("game-options").innerHTML = "";
  document.getElementById("game-input-area").classList.remove("hidden");
  const inp = document.getElementById("game-answer");
  if (inp) { inp.value = ""; inp.type = "text"; inp.placeholder = "如 3,9,4"; }
  document.getElementById("game-submit").classList.remove("hidden");
  document.getElementById("game-submit").onclick = () => baMazeSubmit();
}

function baMazeSubmit() {
  const gs = gameState;
  if (!gs || gs.mode !== "maze") return;
  const t = gs.trials[gs.current];
  const raw = document.getElementById("game-answer")?.value?.trim() || "";
  const parts = raw.split(/[,，、\s]+/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  const ok = parts.length === 3 && parts.every((n, i) => n === t.answer[i]);
  const fb = document.getElementById("game-feedback");
  if (ok) {
    gs.correct++;
    fb.innerHTML = `<span style="color:var(--mc-green)">✅ 正确！</span>`;
    if (gs.correct >= 4 && gs.level < 3) gs.level++;
  } else {
    fb.innerHTML = `<span style="color:var(--mc-red)">❌ 正确答案：${t.answer.join("，")}</span>`;
  }
  document.getElementById("game-submit").classList.add("hidden");
  setTimeout(() => {
    gs.current++;
    gs.showIdx = 0;
    if (gs.current >= gs.total) {
      baEnsureBrainProfile();
      state.brainProfile.mazeLevel = gs.level;
      baBrainFinishChallenge();
    } else baRenderMazeShow();
  }, ok ? 800 : 1200);
}

// ========== 时间锚点 · 时间感知 ==========
const BA_TIME_ROUNDS = 5;
const BA_TIME_TARGET = 10;

function baStartTimeGame() {
  gameState = {
    mode: "time",
    biome: "brain",
    nodeId: "brain-time",
    type: "brain",
    current: 0,
    correct: 0,
    total: BA_TIME_ROUNDS,
    holding: false,
    holdStart: 0,
    errors: [],
    goodStreak: 0,
    maxGoodStreak: 0
  };
  baRenderTimeRound();
  showScreen("scr-game");
}

function baRenderTimeRound() {
  const gs = gameState;
  if (!gs || gs.mode !== "time") return;
  document.getElementById("game-mode").textContent = "⏱️ 时间锚点 · 10秒感知";
  document.getElementById("game-counter").textContent = `${gs.current + 1}/${gs.total}`;
  document.getElementById("game-progress").style.width = `${(gs.current / gs.total) * 100}%`;
  document.getElementById("game-question").innerHTML =
    `<div style="font-size:14px;color:#ccc;margin-bottom:12px">心中默数 <strong>${BA_TIME_TARGET}</strong> 秒后松开按钮</div>` +
    `<div id="time-crystal" style="width:100px;height:100px;margin:12px auto;border-radius:50%;background:radial-gradient(circle,#6a5acd,#4e9a06);box-shadow:0 0 20px rgba(106,90,205,.6)"></div>` +
    `<div id="time-elapsed" style="font-size:12px;color:#888">按住水晶开始…</div>`;
  document.getElementById("game-options").innerHTML =
    `<button id="time-hold-btn" class="pixel-btn primary brain-tap-btn">💎 按住蓄力水晶</button>`;
  const btn = document.getElementById("time-hold-btn");
  const startHold = e => { e.preventDefault(); baTimeHoldStart(); };
  const endHold = e => { e.preventDefault(); baTimeHoldEnd(); };
  btn.onmousedown = startHold;
  btn.onmouseup = endHold;
  btn.onmouseleave = endHold;
  btn.ontouchstart = startHold;
  btn.ontouchend = endHold;
  document.getElementById("game-input-area").classList.add("hidden");
  document.getElementById("game-submit").classList.add("hidden");
  document.getElementById("game-feedback").innerHTML = "";
}

function baTimeHoldStart() {
  const gs = gameState;
  if (!gs || gs.mode !== "time" || gs.holding) return;
  gs.holding = true;
  gs.holdStart = Date.now();
  const crystal = document.getElementById("time-crystal");
  if (crystal) crystal.style.transform = "scale(1.15)";
  gs.timeHoldTimer = setInterval(() => {
    const el = document.getElementById("time-elapsed");
    if (el && gs.holding) el.textContent = ((Date.now() - gs.holdStart) / 1000).toFixed(1) + "s";
  }, 100);
}

function baTimeHoldEnd() {
  const gs = gameState;
  if (!gs || gs.mode !== "time" || !gs.holding) return;
  gs.holding = false;
  if (gs.timeHoldTimer) { clearInterval(gs.timeHoldTimer); gs.timeHoldTimer = null; }
  const elapsed = (Date.now() - gs.holdStart) / 1000;
  const err = Math.abs(elapsed - BA_TIME_TARGET);
  gs.errors.push(err);
  const ok = err <= 0.8;
  if (ok) gs.correct++;
  if (err < 0.5) gs.goodStreak = (gs.goodStreak || 0) + 1;
  else gs.goodStreak = 0;
  gs.maxGoodStreak = Math.max(gs.maxGoodStreak || 0, gs.goodStreak);
  const fb = document.getElementById("game-feedback");
  fb.innerHTML = ok
    ? `<span style="color:var(--mc-green)">✅ ${elapsed.toFixed(1)}s（误差 ${err.toFixed(1)}s）</span>`
    : `<span style="color:var(--mc-red)">△ ${elapsed.toFixed(1)}s（误差 ${err.toFixed(1)}s，目标 ${BA_TIME_TARGET}s）</span>`;
  const crystal = document.getElementById("time-crystal");
  if (crystal) crystal.style.transform = "scale(1)";
  setTimeout(() => {
    gs.current++;
    if (gs.current >= gs.total) baBrainFinishChallenge();
    else baRenderTimeRound();
  }, 1000);
}

// ========== 规则圣殿 · 简化 WCST ==========
const BA_WCST_COLORS = [
  { name: "红", hex: "#cc0000" }, { name: "蓝", hex: "#1e90ff" },
  { name: "绿", hex: "#4e9a06" }, { name: "黄", hex: "#e8b923" }
];
const BA_WCST_SHAPES = ["●", "■", "★", "♥"];

function baGenWcstDeck() {
  const deck = [];
  BA_WCST_COLORS.forEach(c => {
    BA_WCST_SHAPES.forEach(s => deck.push({ color: c, shape: s }));
  });
  return deck.sort(() => Math.random() - 0.5);
}

function baStartWcstGame() {
  const refs = [
    { color: BA_WCST_COLORS[0], shape: BA_WCST_SHAPES[0] },
    { color: BA_WCST_COLORS[1], shape: BA_WCST_SHAPES[1] },
    { color: BA_WCST_COLORS[2], shape: BA_WCST_SHAPES[2] },
    { color: BA_WCST_COLORS[3], shape: BA_WCST_SHAPES[3] }
  ];
  gameState = {
    mode: "wcst",
    biome: "brain",
    nodeId: "brain-wcst",
    type: "brain",
    refs,
    deck: baGenWcstDeck(),
    rule: Math.random() < 0.5 ? "color" : "shape",
    current: 0,
    correct: 0,
    total: 12,
    streak: 0,
    switches: 0
  };
  baRenderWcst();
  showScreen("scr-game");
}

function baWcstMatch(card, ref, rule) {
  return rule === "color" ? card.color.name === ref.color.name : card.shape === ref.shape;
}

function baRenderWcst() {
  const gs = gameState;
  if (!gs || gs.mode !== "wcst") return;
  const card = gs.deck[gs.current % gs.deck.length];
  gs.currentCard = card;
  const ruleLabel = gs.rule === "color" ? "按颜色匹配" : "按形状匹配";
  document.getElementById("game-mode").textContent = "🏛️ 规则圣殿 · WCST";
  document.getElementById("game-counter").textContent = `${gs.current + 1}/${gs.total}`;
  document.getElementById("game-progress").style.width = `${(gs.current / gs.total) * 100}%`;
  let h = `<div style="font-size:13px;color:var(--mc-gold);margin-bottom:8px">隐藏规则：${ruleLabel}${gs.switches ? " · 已切换" + gs.switches + "次" : ""}</div>`;
  h += `<div style="font-size:14px;margin-bottom:8px">打出这张牌，选匹配的底牌：</div>`;
  h += `<div style="font-size:48px;font-weight:900;color:${card.color.hex};margin:10px 0">${card.shape}</div>`;
  document.getElementById("game-question").innerHTML = h;
  const opts = document.getElementById("game-options");
  opts.className = "options-grid";
  opts.innerHTML = "";
  gs.refs.forEach((ref, i) => {
    const btn = document.createElement("div");
    btn.className = "q-opt";
    btn.innerHTML = `<span style="color:${ref.color.hex};font-size:28px">${ref.shape}</span>`;
    btn.onclick = () => baWcstPick(i);
    opts.appendChild(btn);
  });
  document.getElementById("game-input-area").classList.add("hidden");
  document.getElementById("game-submit").classList.add("hidden");
  document.getElementById("game-feedback").innerHTML = "";
}

function baWcstPick(refIdx) {
  const gs = gameState;
  if (!gs || gs.mode !== "wcst") return;
  const ref = gs.refs[refIdx];
  const ok = baWcstMatch(gs.currentCard, ref, gs.rule);
  const fb = document.getElementById("game-feedback");
  document.querySelectorAll("#game-options .q-opt").forEach(b => { b.style.pointerEvents = "none"; });
  if (ok) {
    gs.correct++;
    gs.streak++;
    fb.innerHTML = `<span style="color:var(--mc-green)">✅ 正确！</span>`;
    if (gs.streak >= 5 && gs.switches < 2) {
      gs.rule = gs.rule === "color" ? "shape" : "color";
      gs.streak = 0;
      gs.switches++;
      fb.innerHTML += `<div style="font-size:11px;color:var(--mc-gold);margin-top:4px">🔔 规则已变更！</div>`;
    }
  } else {
    gs.streak = 0;
    fb.innerHTML = `<span style="color:var(--mc-red)">❌ 不符合当前规则</span>`;
  }
  setTimeout(() => {
    gs.current++;
    if (gs.current >= gs.total) baBrainFinishChallenge();
    else baRenderWcst();
  }, ok ? 700 : 1000);
}

// ========== 神经漫游 · 正念呼吸 ==========
const BA_MINDFUL_SEC = 90;

function baTodayKey() {
  return new Date().toLocaleDateString("zh-CN");
}

function baStartMindfulGame() {
  gameState = {
    mode: "mindful",
    biome: "brain",
    nodeId: "brain-mindful",
    type: "brain",
    correct: 1,
    total: 1,
    startAt: Date.now(),
    endAt: Date.now() + BA_MINDFUL_SEC * 1000,
    phase: "inhale",
    phaseStart: Date.now(),
    breathTimer: null,
    mindfulTimer: null,
    noHunger: true
  };
  baRenderMindful();
  showScreen("scr-game");
  gameState.mindfulTimer = setInterval(() => {
    if (Date.now() >= gameState.endAt) baFinishMindfulSession();
  }, 500);
  gameState.breathTimer = setInterval(baMindfulBreathTick, 200);
}

function baMindfulBreathTick() {
  const gs = gameState;
  if (!gs || gs.mode !== "mindful") return;
  const cycle = 12000;
  const t = (Date.now() - gs.startAt) % cycle;
  let phase = "inhale", label = "吸气…", scale = 1;
  if (t < 4000) { phase = "inhale"; label = "吸气 4s…"; scale = 1 + t / 4000 * 0.35; }
  else if (t < 6000) { phase = "hold"; label = "保持 2s…"; scale = 1.35; }
  else { phase = "exhale"; label = "呼气 6s…"; scale = 1.35 - (t - 6000) / 6000 * 0.35; }
  gs.phase = phase;
  const circle = document.getElementById("mindful-circle");
  const lbl = document.getElementById("mindful-label");
  const remain = document.getElementById("mindful-remain");
  if (circle) circle.style.transform = `scale(${scale})`;
  if (lbl) lbl.textContent = label;
  if (remain) remain.textContent = Math.max(0, Math.ceil((gs.endAt - Date.now()) / 1000)) + "s";
}

function baRenderMindful() {
  document.getElementById("game-mode").textContent = "🌌 神经漫游 · 正念呼吸";
  document.getElementById("game-counter").textContent = "放松";
  document.getElementById("game-progress").style.width = "0%";
  document.getElementById("game-question").innerHTML =
    `<div style="font-size:13px;color:#ccc;margin-bottom:12px">跟随圆环呼吸，不消耗精力 · 每日首次 +5 XP</div>` +
    `<div id="mindful-circle" style="width:120px;height:120px;margin:16px auto;border-radius:50%;background:radial-gradient(circle,rgba(106,90,205,.8),rgba(78,154,6,.4));transition:transform .2s"></div>` +
    `<div id="mindful-label" style="font-size:14px;color:var(--mc-gold)">吸气…</div>` +
    `<div id="mindful-remain" style="font-size:12px;color:#888;margin-top:8px">${BA_MINDFUL_SEC}s</div>`;
  document.getElementById("game-options").innerHTML =
    `<button class="pixel-btn" onclick="baFinishMindfulSession()">结束练习</button>`;
  document.getElementById("game-input-area").classList.add("hidden");
  document.getElementById("game-submit").classList.add("hidden");
  document.getElementById("game-feedback").innerHTML = "";
}

function baFinishMindfulSession() {
  const gs = gameState;
  if (!gs || gs.mode !== "mindful") return;
  baBrainClearTimers(gs);
  baEnsureBrainProfile();
  const tk = baTodayKey();
  let xp = 0;
  if (state.brainProfile.lastMindfulDay !== tk) {
    xp = 5;
    state.brainProfile.lastMindfulDay = tk;
    state.brainProfile.mindfulDays = (state.brainProfile.mindfulDays || 0) + 1;
    state.user.xp = (state.user.xp || 0) + xp;
  }
  const stars = 4;
  state.brainProfile.sessions["brain-mindful"] = { rate: stars * 20, correct: stars, total: 5, at: Date.now() };
  if (typeof recordActivity === "function") {
    recordActivity("brain", { label: "神经漫游·正念呼吸", correct: 1, total: 1, xp, gem: 0, nodeId: "brain-mindful", learnMin: 2 });
  }
  if (typeof save === "function") save();
  if (typeof updateHud === "function") updateHud();
  showModal("🌌 神经漫游完成",
    `<div style="text-align:center"><div style="font-size:32px;margin-bottom:8px">🧘</div>
    <div style="font-size:14px">专注度自评：${stars}/5 星</div>
    ${xp ? `<div style="color:var(--mc-gold);margin-top:8px">+${xp} XP（今日首次）</div>` : `<div style="font-size:12px;color:#888;margin-top:8px">今日已获得首次奖励</div>`}
    </div>`);
  showScreen("scr-biome");
  if (typeof enterBiome === "function") enterBiome("brain");
}

// ========== 认知能力仪表盘（6维雷达） ==========
function baComputeBrainRadar() {
  baEnsureBrainProfile();
  const p = state.brainProfile;
  const sess = p.sessions || {};
  const pct = id => (sess[id] && sess[id].rate) || 0;

  const inhibitory = Math.round(((p.stroopBest || pct("brain-stroop")) + (p.gonogoBest || pct("brain-sustained"))) / 2) || pct("brain-stroop") || pct("brain-sustained");
  const workingMem = Math.round(((p.nbackBest || 1) / 3) * 100 * 0.35 + (p.stormBest || pct("brain-storm")) * 0.35 + (p.mazeBest || pct("brain-maze")) * 0.3);
  const flexibility = Math.max(
    p.wcstBest ? Math.min(100, Math.round(p.wcstBest / 12 * 100)) : 0,
    p.switchBest ? Math.min(100, Math.round(p.switchBest / 15 * 100)) : 0,
    pct("brain-switch"),
    pct("brain-wcst")
  );
  const sustained = Math.max(p.cptBest || 0, pct("brain-cpt"));
  const speed = Math.max(p.gonogoBest || 0, p.stroopBest || 0, p.timeBest ? (100 - Math.min(100, p.timeBest)) : 0, pct("brain-sustained"), pct("brain-stroop"), pct("brain-time"));
  const planning = Math.max(p.dualBest || 0, p.stormBest || 0, p.mazeBest || 0, pct("brain-dual"), pct("brain-storm"), pct("brain-maze"));

  return {
    inhibitoryControl: Math.min(100, inhibitory),
    workingMemory: Math.min(100, workingMem),
    cognitiveFlexibility: Math.min(100, flexibility),
    sustainedAttention: Math.min(100, sustained),
    processingSpeed: Math.min(100, speed),
    planning: Math.min(100, planning)
  };
}

function baRenderBrainRadar() {
  const el = document.getElementById("brain-radar-panel");
  if (!el || !state) return;
  const dims = [
    { key: "inhibitoryControl", label: "抑制控制", short: "抑制" },
    { key: "workingMemory", label: "工作记忆", short: "记忆" },
    { key: "cognitiveFlexibility", label: "认知灵活", short: "灵活" },
    { key: "sustainedAttention", label: "持续注意", short: "注意" },
    { key: "processingSpeed", label: "加工速度", short: "速度" },
    { key: "planning", label: "计划执行", short: "计划" }
  ];
  const scores = baComputeBrainRadar();
  const cx = 140, cy = 130, R = 90;
  const n = dims.length;
  const points = dims.map((d, i) => {
    const ang = (Math.PI * 2 * i / n) - Math.PI / 2;
    const r = (scores[d.key] / 100) * R;
    return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), label: d.short, val: scores[d.key] };
  });
  const grid = [0.25, 0.5, 0.75, 1].map(f => {
    const pts = dims.map((_, i) => {
      const ang = (Math.PI * 2 * i / n) - Math.PI / 2;
      return `${cx + R * f * Math.cos(ang)},${cy + R * f * Math.sin(ang)}`;
    }).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="#333" stroke-width="1"/>`;
  }).join("");
  const axes = dims.map((_, i) => {
    const ang = (Math.PI * 2 * i / n) - Math.PI / 2;
    return `<line x1="${cx}" y1="${cy}" x2="${cx + R * Math.cos(ang)}" y2="${cy + R * Math.sin(ang)}" stroke="#444" stroke-width="1"/>`;
  }).join("");
  const poly = points.map(p => `${p.x},${p.y}`).join(" ");
  const labels = points.map((p, i) => {
    const ang = (Math.PI * 2 * i / n) - Math.PI / 2;
    const lx = cx + (R + 22) * Math.cos(ang);
    const ly = cy + (R + 22) * Math.sin(ang);
    return `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#aaa" font-size="10">${p.label}</text>`;
  }).join("");
  const legend = dims.map(d =>
    `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span>${d.label}</span><strong style="color:var(--mc-gold)">${scores[d.key]}</strong></div>`
  ).join("");

  el.innerHTML = `
    <h4 style="color:var(--mc-gold);font-size:13px;margin-bottom:8px">🧠 认知能力仪表盘</h4>
    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
      <svg viewBox="0 0 280 260" width="280" height="260" style="flex-shrink:0">${grid}${axes}
        <polygon points="${poly}" fill="rgba(78,154,6,.35)" stroke="var(--mc-green)" stroke-width="2"/>
        ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--mc-gold)"/>`).join("")}
        ${labels}
      </svg>
      <div style="flex:1;min-width:120px">${legend}
        <div style="font-size:10px;color:#666;margin-top:8px">完成脑科学训练后自动更新 · 基于最近表现</div>
      </div>
    </div>`;
}

function baBrainBindExitGuard() {
  const modes = ["nback", "switch", "cpt", "stroop", "gonogo", "storm", "dual", "maze", "time", "wcst", "mindful"];
  if (gameState && (modes.includes(gameState.mode) || gameState.type === "brain")) {
    baBrainClearTimers(gameState);
  }
}

// ========== 记忆水晶 · N-back ==========
function baGenerateNBackSequence(n, total) {
  const seq = [];
  for (let i = 0; i < total + n; i++) {
    if (i >= n && Math.random() < 0.35) {
      seq.push(seq[i - n]);
    } else {
      let s = BA_NBACK_SYMBOLS[Math.floor(Math.random() * BA_NBACK_SYMBOLS.length)];
      while (i >= n && s === seq[i - n]) {
        s = BA_NBACK_SYMBOLS[Math.floor(Math.random() * BA_NBACK_SYMBOLS.length)];
      }
      seq.push(s);
    }
  }
  return seq;
}

function baStartNBackGame() {
  baEnsureBrainProfile();
  const n = Math.min(3, Math.max(1, state.brainProfile.nbackN || 1));
  const seq = baGenerateNBackSequence(n, BA_NBACK_TRIALS);
  gameState = {
    mode: "nback",
    biome: "brain",
    nodeId: "brain-nback",
    type: "brain",
    n,
    sequence: seq,
    step: 0,
    correct: 0,
    total: BA_NBACK_TRIALS,
    streak: 0,
    maxStreak: 0,
    brainTimer: null,
    answered: false
  };
  baRenderNBack();
  showScreen("scr-game");
}

function baNBackPreviewHtml(gs) {
  const recent = gs.sequence.slice(Math.max(0, gs.step - 3), gs.step);
  if (!recent.length) return "";
  return `<div style="display:flex;justify-content:center;gap:10px;margin-bottom:10px;opacity:.45;font-size:28px">${recent.map(s => `<span>${s}</span>`).join("")}</div>`;
}

function baRenderNBack() {
  const gs = gameState;
  if (!gs || gs.mode !== "nback") return;
  const sym = gs.sequence[gs.step];
  const inWarmup = gs.step < gs.n;
  const answerIdx = gs.step - gs.n;
  const isMatch = !inWarmup && sym === gs.sequence[gs.step - gs.n];

  document.getElementById("game-mode").textContent = `💎 记忆水晶 · ${gs.n}-back`;
  const prog = inWarmup ? 0 : Math.round(((answerIdx + 1) / gs.total) * 100);
  document.getElementById("game-counter").textContent = inWarmup
    ? `记忆 ${gs.step + 1}/${gs.n}`
    : `${answerIdx + 1}/${gs.total}`;
  document.getElementById("game-progress").style.width = `${prog}%`;

  const hint = inWarmup
    ? `先记住前 ${gs.n} 个符文… (${gs.step + 1}/${gs.n})`
    : `与 <strong>${gs.n}</strong> 个之前的符文相同吗？`;

  document.getElementById("game-question").innerHTML =
    baNBackPreviewHtml(gs) +
    `<div style="font-size:72px;margin:12px 0;height:90px;display:flex;align-items:center;justify-content:center">${sym}</div>` +
    `<div style="font-size:13px;color:#ccc;margin-bottom:8px">${hint}</div>` +
    (gs.n >= 2 ? `<div style="font-size:10px;color:#666">辅助：上方半透明条为最近符文</div>` : "");

  const opts = document.getElementById("game-options");
  opts.className = "options-grid";
  document.getElementById("game-input-area").classList.add("hidden");
  document.getElementById("game-submit").classList.add("hidden");
  document.getElementById("game-next").classList.add("hidden");

  if (inWarmup) {
    opts.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#888;font-size:12px">记忆阶段…</div>`;
    document.getElementById("game-feedback").innerHTML = "";
    gs.brainTimer = setTimeout(() => {
      gs.step++;
      if (gs.step >= gs.n + gs.total) baBrainFinishChallenge();
      else baRenderNBack();
    }, 1200);
  } else {
    opts.innerHTML = "";
    ["相同", "不同"].forEach(label => {
      const btn = document.createElement("div");
      btn.className = "q-opt";
      btn.textContent = label;
      btn.onclick = () => baNBackAnswer(label === "相同", isMatch);
      opts.appendChild(btn);
    });
    document.getElementById("game-feedback").innerHTML = "";
  }
}

function baNBackAnswer(userMatch, actualMatch) {
  const gs = gameState;
  if (!gs || gs.mode !== "nback" || gs.answered) return;
  gs.answered = true;
  const ok = userMatch === actualMatch;
  const fb = document.getElementById("game-feedback");
  document.querySelectorAll("#game-options .q-opt").forEach(b => { b.style.pointerEvents = "none"; });
  if (ok) {
    gs.correct++;
    gs.streak++;
    if (gs.streak > gs.maxStreak) gs.maxStreak = gs.streak;
    fb.innerHTML = `<span style="color:var(--mc-green)">✅ 正确！</span>`;
    if (gs.streak >= BA_NBACK_STREAK_TO_LEVEL && gs.n < 3) {
      gs.n++;
      gs.streak = 0;
      fb.innerHTML += `<div style="font-size:11px;color:var(--mc-gold);margin-top:4px">🎉 升级 ${gs.n}-back！</div>`;
      baEnsureBrainProfile();
      state.brainProfile.nbackN = gs.n;
      state.brainProfile.nbackBest = Math.max(state.brainProfile.nbackBest || 1, gs.n);
    }
  } else {
    gs.streak = 0;
    fb.innerHTML = `<span style="color:var(--mc-red)">❌ 应为「${actualMatch ? "相同" : "不同"}」</span>`;
  }
  setTimeout(() => {
    gs.answered = false;
    gs.step++;
    if (gs.step >= gs.n + gs.total) baBrainFinishChallenge();
    else baRenderNBack();
  }, ok ? 650 : 1000);
}

// ========== 变形符文 · 任务切换 ==========
function baGenerateSwitchTrials(count) {
  const trials = [];
  let rule = Math.random() < 0.5 ? "color" : "shape";
  let sinceSwitch = 0;
  const nextSwitch = () => 3 + Math.floor(Math.random() * 3);
  let switchIn = nextSwitch();

  for (let i = 0; i < count; i++) {
    sinceSwitch++;
    if (sinceSwitch > switchIn) {
      rule = rule === "color" ? "shape" : "color";
      sinceSwitch = 1;
      switchIn = nextSwitch();
    }
    const colorPack = BA_SWITCH_COLORS[Math.floor(Math.random() * BA_SWITCH_COLORS.length)];
    const shapePack = BA_SWITCH_SHAPES[Math.floor(Math.random() * BA_SWITCH_SHAPES.length)];
    const shapeChar = shapePack.chars[Math.floor(Math.random() * shapePack.chars.length)];
    const leftCorrect = rule === "color" ? colorPack.id === "warm" : shapePack.id === "round";
    trials.push({
      rule,
      switched: sinceSwitch === 1,
      colorHex: colorPack.hex,
      shapeChar,
      leftCorrect,
      ruleLabel: rule === "color" ? "按颜色分组" : "按形状分组"
    });
  }
  return trials;
}

function baStartSwitchGame() {
  const trials = baGenerateSwitchTrials(15);
  gameState = {
    mode: "switch",
    biome: "brain",
    nodeId: "brain-switch",
    type: "brain",
    trials,
    current: 0,
    correct: 0,
    total: trials.length,
    switchCostMs: [],
    lastRt: 0,
    trialStart: 0
  };
  baRenderSwitchTrial();
  showScreen("scr-game");
}

function baRenderSwitchTrial() {
  const gs = gameState;
  if (!gs || gs.mode !== "switch") return;
  const t = gs.trials[gs.current];
  gs.trialStart = Date.now();

  document.getElementById("game-mode").textContent = "🔀 变形符文 · 任务切换";
  document.getElementById("game-counter").textContent = `${gs.current + 1}/${gs.total}`;
  document.getElementById("game-progress").style.width = `${(gs.current / gs.total) * 100}%`;

  const ruleBanner = t.switched
    ? `<div style="background:rgba(232,185,35,.2);border:1px solid var(--mc-gold);padding:6px 10px;border-radius:6px;font-size:12px;color:var(--mc-gold);margin-bottom:8px">🔔 规则切换：${t.ruleLabel}</div>`
    : `<div style="font-size:13px;color:var(--mc-gold);margin-bottom:8px">当前规则：${t.ruleLabel}</div>`;

  document.getElementById("game-question").innerHTML =
    ruleBanner +
    `<div style="font-size:80px;margin:16px 0;color:${t.colorHex};height:90px;display:flex;align-items:center;justify-content:center">${t.shapeChar}</div>` +
    `<div style="font-size:12px;color:#aaa">暖色/圆角 → 左边　｜　冷色/尖角 → 右边</div>`;

  document.getElementById("game-options").innerHTML =
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%">
      <button class="pixel-btn primary brain-tap-btn" id="switch-left" style="margin:0">⬅️ 左边祭坛</button>
      <button class="pixel-btn brain-tap-btn" id="switch-right" style="margin:0">右边祭坛 ➡️</button>
    </div>`;
  document.getElementById("switch-left").onclick = () => baSwitchAnswer(true);
  document.getElementById("switch-right").onclick = () => baSwitchAnswer(false);
  document.getElementById("game-input-area").classList.add("hidden");
  document.getElementById("game-submit").classList.add("hidden");
  document.getElementById("game-next").classList.add("hidden");
  document.getElementById("game-feedback").innerHTML = "";
}

function baSwitchAnswer(pickedLeft) {
  const gs = gameState;
  if (!gs || gs.mode !== "switch") return;
  const t = gs.trials[gs.current];
  const rt = Date.now() - gs.trialStart;
  const ok = pickedLeft === t.leftCorrect;
  if (t.switched) gs.switchCostMs.push(rt);

  const fb = document.getElementById("game-feedback");
  if (ok) {
    gs.correct++;
    fb.innerHTML = `<span style="color:var(--mc-green)">✅ 正确！</span>`;
  } else {
    fb.innerHTML = `<span style="color:var(--mc-red)">❌ 应选${t.leftCorrect ? "左边" : "右边"}</span>`;
  }
  setTimeout(() => {
    gs.current++;
    if (gs.current >= gs.total) baBrainFinishChallenge();
    else baRenderSwitchTrial();
  }, ok ? 600 : 900);
}

// ========== 追踪之眼 · CPT ==========
function baStartCptGame() {
  gameState = {
    mode: "cpt",
    biome: "brain",
    nodeId: "brain-cpt",
    type: "brain",
    correct: 0,
    total: 0,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    endAt: Date.now() + BA_CPT_DURATION_MS,
    waitingRare: false,
    cptTimer: null,
    cptStimulusTimer: null,
    activeRare: false
  };
  baRenderCptShell();
  showScreen("scr-game");
  baScheduleCptStimulus();
  gsCptTick();
}

function gsCptTick() {
  const gs = gameState;
  if (!gs || gs.mode !== "cpt") return;
  gs.cptTimer = setInterval(() => {
    if (Date.now() >= gs.endAt) {
      baBrainClearTimers(gs);
      baBrainFinishChallenge();
      return;
    }
    const remain = Math.ceil((gs.endAt - Date.now()) / 1000);
    const el = document.getElementById("cpt-timer");
    if (el) el.textContent = remain + "s";
  }, 500);
}

function baRenderCptShell() {
  document.getElementById("game-mode").textContent = "👁️ 追踪之眼 · 持续注意";
  document.getElementById("game-counter").textContent = "CPT";
  document.getElementById("game-progress").style.width = "0%";
  document.getElementById("game-question").innerHTML =
    `<div style="font-size:13px;color:#ccc;margin-bottom:8px">只有看到 <span style="color:var(--mc-gold)">✨ 金色稀有符文</span> 时点击，其他一律忽略</div>` +
    `<div id="cpt-stage" style="min-height:120px;display:flex;align-items:center;justify-content:center;font-size:64px"></div>` +
    `<div style="font-size:12px;color:#888">剩余 <span id="cpt-timer">90</span>s · 命中 <span id="cpt-hits">0</span> · 误点 <span id="cpt-fa">0</span></div>`;
  document.getElementById("game-options").innerHTML =
    `<button id="cpt-tap" class="pixel-btn primary brain-tap-btn" style="margin-top:8px">👆 发现稀有符文！</button>`;
  document.getElementById("cpt-tap").onclick = () => baCptTap();
  document.getElementById("game-input-area").classList.add("hidden");
  document.getElementById("game-submit").classList.add("hidden");
  document.getElementById("game-next").classList.add("hidden");
  document.getElementById("game-feedback").innerHTML = "";
}

function baScheduleCptStimulus() {
  const gs = gameState;
  if (!gs || gs.mode !== "cpt" || Date.now() >= gs.endAt) return;
  const isRare = Math.random() < BA_CPT_RARE_RATE;
  gs.activeRare = isRare;
  gs.waitingRare = isRare;
  gs.total++;

  const stage = document.getElementById("cpt-stage");
  if (stage) {
    if (isRare) {
      stage.innerHTML = `<span style="filter:drop-shadow(0 0 8px gold);color:var(--mc-gold)">✨${BA_NBACK_SYMBOLS[Math.floor(Math.random() * BA_NBACK_SYMBOLS.length)]}</span>`;
    } else {
      stage.innerHTML = `<span style="opacity:.7">${BA_NBACK_SYMBOLS[Math.floor(Math.random() * BA_NBACK_SYMBOLS.length)]}</span>`;
    }
  }

  const isi = BA_CPT_ISI_MIN + Math.floor(Math.random() * (BA_CPT_ISI_MAX - BA_CPT_ISI_MIN));
  gs.cptStimulusTimer = setTimeout(() => {
    if (gs.waitingRare && gs.activeRare) {
      gs.misses++;
      gs.waitingRare = false;
      baCptUpdateHud(false, "漏报");
    }
    if (stage) stage.innerHTML = `<span style="opacity:.25">·</span>`;
    baScheduleCptStimulus();
  }, isi);
}

function baCptTap() {
  const gs = gameState;
  if (!gs || gs.mode !== "cpt") return;
  if (gs.activeRare && gs.waitingRare) {
    gs.hits++;
    gs.correct++;
    gs.waitingRare = false;
    baCptUpdateHud(true, "命中！");
  } else {
    gs.falseAlarms++;
    gs.total++;
    baCptUpdateHud(false, "误点！");
  }
}

function baCptUpdateHud(ok, msg) {
  const gs = gameState;
  const h = document.getElementById("cpt-hits");
  const f = document.getElementById("cpt-fa");
  if (h) h.textContent = gs.hits;
  if (f) f.textContent = gs.falseAlarms;
  const fb = document.getElementById("game-feedback");
  if (fb && msg) {
    fb.innerHTML = ok
      ? `<span style="color:var(--mc-green)">✅ ${msg}</span>`
      : `<span style="color:var(--mc-red)">⚠ ${msg}</span>`;
    setTimeout(() => { if (fb) fb.innerHTML = ""; }, 500);
  }
}

function baTimeOfferDelayReward(onDone) {
  showModal("⏱️ 时间锚点奖励",
    `<div style="font-size:14px;margin-bottom:12px">连续 3 次精准感知！选择奖励方式：</div>
    <button class="pixel-btn primary" style="width:100%;margin-bottom:8px" id="time-reward-now">立刻领取 1 💎</button>
    <button class="pixel-btn" style="width:100%" id="time-reward-later">等待 10 秒领取 2 💎</button>`);
  setTimeout(() => {
    const nowBtn = document.getElementById("time-reward-now");
    const laterBtn = document.getElementById("time-reward-later");
    if (nowBtn) nowBtn.onclick = () => {
      state.user.gems = (state.user.gems || 0) + 1;
      if (typeof save === "function") save();
      if (typeof updateHud === "function") updateHud();
      closeModal();
      if (onDone) onDone();
    };
    if (laterBtn) laterBtn.onclick = () => {
      closeModal();
      showToast("⏳ 延迟奖励倒计时 10 秒…");
      setTimeout(() => {
        state.user.gems = (state.user.gems || 0) + 2;
        if (typeof save === "function") save();
        if (typeof updateHud === "function") updateHud();
        showToast("🎁 延迟奖励 +2 💎 已到账！");
        if (onDone) onDone();
      }, 10000);
    };
  }, 50);
}

function baBrainFinishChallenge() {
  const gs = gameState;
  if (!gs) return;
  baBrainClearTimers(gs);

  if (gs.mode === "cpt") {
    gs.correct = gs.hits;
    gs.total = Math.max(1, gs.hits + gs.misses + gs.falseAlarms);
    baEnsureBrainProfile();
    const rate = gs.hits / Math.max(1, gs.hits + gs.misses);
    state.brainProfile.cptBest = Math.max(state.brainProfile.cptBest || 0, Math.round(rate * 100));
  }
  if (gs.mode === "switch") {
    baEnsureBrainProfile();
    state.brainProfile.switchBest = Math.max(state.brainProfile.switchBest || 0, gs.correct);
  }
  if (gs.mode === "nback") {
    baEnsureBrainProfile();
    state.brainProfile.nbackBest = Math.max(state.brainProfile.nbackBest || 1, gs.n || 1);
  }
  if (gs.mode === "storm") {
    baEnsureBrainProfile();
    const pct = Math.round((gs.correct / gs.total) * 100);
    state.brainProfile.stormBest = Math.max(state.brainProfile.stormBest || 0, pct);
    state.brainProfile.stormChainLen = gs.chainLen || 2;
  }
  if (gs.mode === "dual") {
    baEnsureBrainProfile();
    const topPct = Math.round((gs.topCorrect / gs.total) * 100);
    const botPct = Math.round((gs.bottomCorrect / gs.total) * 100);
    state.brainProfile.dualBest = Math.max(state.brainProfile.dualBest || 0, baBrainHarmonicMean(topPct, botPct));
  }
  if (gs.mode === "maze") {
    baEnsureBrainProfile();
    const pct = Math.round((gs.correct / gs.total) * 100);
    state.brainProfile.mazeBest = Math.max(state.brainProfile.mazeBest || 0, pct);
    state.brainProfile.mazeLevel = gs.level || 1;
  }
  if (gs.mode === "time") {
    baEnsureBrainProfile();
    const avgErr = gs.errors.length ? gs.errors.reduce((a, b) => a + b, 0) / gs.errors.length : 1;
    state.brainProfile.timeBest = Math.max(state.brainProfile.timeBest || 0, Math.round(Math.max(0, 100 - avgErr * 20)));
    state.brainProfile.timeStreak = gs.maxGoodStreak || 0;
  }
  if (gs.mode === "wcst") {
    baEnsureBrainProfile();
    state.brainProfile.wcstBest = Math.max(state.brainProfile.wcstBest || 0, gs.correct);
  }

  baBrainRecordSession(gs);

  if (gs.mode === "time" && (gs.maxGoodStreak || 0) >= 3) {
    baTimeOfferDelayReward(() => { if (typeof completeBrainChallenge === "function") completeBrainChallenge(); });
    return;
  }

  if (typeof completeBrainChallenge === "function") completeBrainChallenge();
}

function baBrainExtendStart(nodeId) {
  if (nodeId === "brain-nback") { baStartNBackGame(); return true; }
  if (nodeId === "brain-switch") { baStartSwitchGame(); return true; }
  if (nodeId === "brain-cpt") { baStartCptGame(); return true; }
  if (nodeId === "brain-storm") { baStartStormGame(); return true; }
  if (nodeId === "brain-dual") { baStartDualGame(); return true; }
  if (nodeId === "brain-maze") { baStartMazeGame(); return true; }
  if (nodeId === "brain-time") { baStartTimeGame(); return true; }
  if (nodeId === "brain-wcst") { baStartWcstGame(); return true; }
  if (nodeId === "brain-mindful") { baStartMindfulGame(); return true; }
  return false;
}
