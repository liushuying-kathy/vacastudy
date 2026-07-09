// BlockAcademy extras: 生活记录 + 学习驱动游戏掉落
const LEARN_MINUTES_PER_DROP = 60;
const GAME_SESSION_SEC = 300;
const GAME_DAILY_MAX = 5;
const GAME_DAILY_MAX_MINUTES = 25;

const BA_WEEK_PROJECTS = [
  { w: 1, n: "社区观察", ic: "🏘️", d: "观察社区变化，记录3个发现", pts: 8 },
  { w: 2, n: "环保行动", ic: "♻️", d: "参与一次垃圾分类或环保活动", pts: 8 },
  { w: 3, n: "采访长辈", ic: "🎤", d: "采访一位长辈，了解一段历史", pts: 10 },
  { w: 4, n: "小小志愿者", ic: "🤝", d: "参与志愿或公益服务", pts: 10 },
  { w: 5, n: "职业体验", ic: "👔", d: "了解一种职业并写体验", pts: 10 },
  { w: 6, n: "研学小报告", ic: "📋", d: "完成一次外出研学并总结", pts: 12 }
];

const BA_LIFE_XP = { affairs: 5, labor: 5, readCheck: 8, practice: 10 };
const BA_LIFE_GEM = { affairs: 0, labor: 1, readCheck: 1, practice: 1 };

const BA_OPTIONAL_PLAN = [
  { name: "时政记录", desc: "记录今日新闻与思考", icon: "📰", type: "affairs" },
  { name: "劳动记录", desc: "记录家务劳动（可请家长已阅）", icon: "🧹", type: "labor" },
  { name: "阅读打卡", desc: "完成阅读知识沉淀卡片", icon: "📖", type: "readCheck" },
  { name: "社会实践", desc: "提交本周社会实践作品", icon: "🌍", type: "practice" },
  { name: "脑力训练", desc: "完成1次脑科学神殿挑战", icon: "🧠", type: "brain" },
  { name: "运动打卡", desc: "完成1次体育活动", icon: "🏃", type: "sport" },
  { name: "基础训练", desc: "完成30道口算/拼音/单位题", icon: "🏋️", type: "basic" }
];

function baTodayKey() { return new Date().toLocaleDateString("zh-CN"); }

function baEnsureLifeState() {
  if (!state) return;
  if (!state.dailyLogs) state.dailyLogs = {};
  if (!state.readCards) state.readCards = [];
  if (!state.projects) state.projects = {};
  if (state.leisureCoins === undefined) state.leisureCoins = 0;
  baEnsureLearnTrack();
}

function baEnsureLearnTrack() {
  const tk = baTodayKey();
  if (!state.learnTrack || state.learnTrack.date !== tk) {
    state.learnTrack = {
      date: tk,
      minutes: 0,
      dropsUsed: 0,
      gameMinutes: 0,
      pendingDrop: false,
      bankedDrops: 0
    };
  }
}

function baEstimateLearnMinutes(type, detail) {
  if (detail && detail.learnMin) return detail.learnMin;
  const total = detail && detail.total;
  if (type === "basic") return 15;
  if (type === "craft") return 5;
  if (["affairs", "labor", "readCheck", "practice"].includes(type)) return 8;
  if (total) return Math.max(3, Math.ceil(total * 0.6));
  return 5;
}

function baRecalcGameDrops() {
  baEnsureLearnTrack();
  const lt = state.learnTrack;
  const earned = Math.floor(lt.minutes / LEARN_MINUTES_PER_DROP);
  lt.bankedDrops = Math.max(0, Math.min(GAME_DAILY_MAX, earned) - lt.dropsUsed);
  lt.pendingDrop = lt.bankedDrops > 0;
}

function baTrackLearning(type, detail) {
  if (!state) return;
  baEnsureLearnTrack();
  const mins = baEstimateLearnMinutes(type, detail);
  state.learnTrack.minutes += mins;
  const prev = state.learnTrack.bankedDrops;
  baRecalcGameDrops();
  if (state.learnTrack.bankedDrops > prev) baShowDropBanner();
  if (typeof baCheckCustomDailyPlans === "function") baCheckCustomDailyPlans(type, detail, mins);
  baRenderGameRewardPanel();
  save();
}

function baShowDropBanner() {
  if (typeof showToast === "function") {
    showToast("🎁 专注学习满 " + LEARN_MINUTES_PER_DROP + " 分钟！可领取随机小游戏（5分钟）");
  }
}

function baRenderGameRewardPanel() {
  const el = document.getElementById("game-reward-panel");
  if (!el || !state) return;
  baEnsureLearnTrack();
  baRecalcGameDrops();
  const lt = state.learnTrack;
  const remain = Math.max(0, LEARN_MINUTES_PER_DROP - (lt.minutes % LEARN_MINUTES_PER_DROP));
  const canPlay = lt.bankedDrops > 0 && lt.dropsUsed < GAME_DAILY_MAX && lt.gameMinutes < GAME_DAILY_MAX_MINUTES;
  el.innerHTML = `
    <div style="font-size:13px;font-weight:700;color:var(--mc-gold);margin-bottom:6px">🎮 专注奖励（自我驱动）</div>
    <div style="font-size:11px;color:#aaa;line-height:1.6;margin-bottom:8px">
      今日学习 <strong style="color:#fff">${lt.minutes}</strong> 分钟 ·
      距下次掉落 <strong style="color:#fff">${remain}</strong> 分钟<br>
      可领取 <strong style="color:var(--mc-green)">${lt.bankedDrops}</strong> 次 ·
      已玩 ${lt.dropsUsed}/${GAME_DAILY_MAX} 次（${lt.gameMinutes}/${GAME_DAILY_MAX_MINUTES} 分钟）<br>
      休闲币 🪙 ${state.leisureCoins || 0}（不影响段位积分）
    </div>
    ${canPlay
      ? `<button class="pixel-btn primary" style="width:100%" onclick="baClaimGameDrop()">🎁 领取随机小游戏（5分钟）</button>`
      : `<button class="pixel-btn" style="width:100%;opacity:.5" disabled>${lt.dropsUsed >= GAME_DAILY_MAX ? "今日游戏次数已满" : lt.gameMinutes >= GAME_DAILY_MAX_MINUTES ? "今日游戏时长已满" : "继续学习 " + remain + " 分钟可掉落"}</button>`}
  `;
}

function baClaimGameDrop() {
  baEnsureLearnTrack();
  baRecalcGameDrops();
  const lt = state.learnTrack;
  if (lt.bankedDrops <= 0 || lt.dropsUsed >= GAME_DAILY_MAX || lt.gameMinutes >= GAME_DAILY_MAX_MINUTES) {
    if (typeof showToast === "function") showToast("今日奖励次数或时长已用完，明天再来～");
    return;
  }
  if (typeof baPickRandomGame !== "function" || !BA_GAMES || !BA_GAMES.length) {
    if (typeof showToast === "function") showToast("游戏模块加载中，请刷新页面");
    return;
  }
  lt.dropsUsed++;
  baRecalcGameDrops();
  save();
  baRenderGameRewardPanel();
  const g = baPickRandomGame();
  if (g) baPrepareGame(g);
}

function onBaGameSessionEnd(score, coins) {
  baEnsureLearnTrack();
  state.learnTrack.gameMinutes += Math.ceil(GAME_SESSION_SEC / 60);
  state.leisureCoins = (state.leisureCoins || 0) + (coins || 0);
  save();
  updateHud();
  baRenderGameRewardPanel();
  document.getElementById("ba-g-btn").textContent = "关闭";
  document.getElementById("ba-g-btn").onclick = baCloseGameModal;
  document.getElementById("ba-g-score").textContent = "得分 " + score + " · +" + (coins || 0) + " 🪙";
  document.getElementById("ba-g-foot").textContent = "学习奖励已计入休闲币（不计入段位）";
  if (typeof showToast === "function") showToast("🎮 游戏结束！+" + (coins || 0) + " 休闲币");
}

function baGetDailyLog() {
  baEnsureLifeState();
  const tk = baTodayKey();
  if (!state.dailyLogs[tk]) {
    state.dailyLogs[tk] = { affairs: "", affairsThought: "", labor: "", laborReviewed: false, readCheck: false, practice: false };
  }
  return state.dailyLogs[tk];
}

function baRewardLife(type) {
  const xp = BA_LIFE_XP[type] || 5;
  const gem = BA_LIFE_GEM[type] || 0;
  state.user.xp = (state.user.xp || 0) + xp;
  if (gem) state.user.gem = (state.user.gem || 0) + gem;
  markDailyPlanDone(type);
  baTrackLearning(type, { learnMin: 8, label: type });
  updateHud();
  save();
  if (typeof showToast === "function") showToast("+" + xp + " XP" + (gem ? " +" + gem + " 💎" : ""));
}

function baSaveAffairs() {
  const dd = baGetDailyLog();
  dd.affairs = (document.getElementById("life-affairs-text") || {}).value || "";
  if (!dd.affairs.trim()) { showToast("请先填写时事记录"); return; }
  if (!dd.affairsDone) { dd.affairsDone = true; baRewardLife("affairs"); }
  else save();
  baRenderLifeModule();
}

function baSaveAffairsThought() {
  const dd = baGetDailyLog();
  dd.affairsThought = (document.getElementById("life-affairs-thought") || {}).value || "";
  if (!dd.affairsThought.trim()) { showToast("请先填写感想"); return; }
  if (!dd.affairsThoughtDone) { dd.affairsThoughtDone = true; baRewardLife("affairs"); }
  else save();
  baRenderLifeModule();
}

function baSaveLabor() {
  const dd = baGetDailyLog();
  dd.labor = (document.getElementById("life-labor-text") || {}).value || "";
  if (!dd.labor.trim()) { showToast("请先填写劳动内容"); return; }
  if (!dd.laborDone) { dd.laborDone = true; baRewardLife("labor"); }
  else save();
  baRenderLifeModule();
}

function baToggleLaborReview() {
  const dd = baGetDailyLog();
  if (!dd.labor || !dd.labor.trim()) { showToast("请先保存劳动记录"); return; }
  const pin = prompt("请输入家长确认码");
  if (pin !== (state.parentPin || "1234")) { showToast("确认码不正确"); return; }
  dd.laborReviewed = !dd.laborReviewed;
  if (dd.laborReviewed) {
    state.user.gem = (state.user.gem || 0) + 1;
    showToast("家长已阅 +1 💎");
  }
  save();
  updateHud();
  baRenderLifeModule();
}

function baOpenReadLogModal() {
  const h = `<div class="ba-life-modal on" id="read-log-modal" onclick="if(event.target===this)baCloseReadLogModal()">
    <div class="pixel-panel ba-life-panel">
      <div class="mc-title" style="font-size:16px">📖 阅读知识沉淀</div>
      <p style="font-size:11px;color:#888;margin:8px 0">回答下面问题，生成你的阅读知识卡片</p>
      <label style="font-size:12px">最有趣的情节？</label>
      <textarea id="read-q1" rows="2" style="width:100%;margin:4px 0 8px"></textarea>
      <label style="font-size:12px">学到的新词/新知识？</label>
      <textarea id="read-q2" rows="2" style="width:100%;margin:4px 0 8px"></textarea>
      <label style="font-size:12px">给主人公的建议？</label>
      <textarea id="read-q3" rows="2" style="width:100%;margin:4px 0 8px"></textarea>
      <button class="pixel-btn primary" style="width:100%;margin-bottom:6px" onclick="baSaveReadLog()">💾 保存阅读卡片</button>
      <button class="pixel-btn" style="width:100%" onclick="baCloseReadLogModal()">取消</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", h);
}

function baCloseReadLogModal() {
  const m = document.getElementById("read-log-modal");
  if (m) m.remove();
}

function baSaveReadLog() {
  const a = (document.getElementById("read-q1") || {}).value || "";
  const b = (document.getElementById("read-q2") || {}).value || "";
  const c = (document.getElementById("read-q3") || {}).value || "";
  if (!a.trim() && !b.trim() && !c.trim()) { showToast("请至少填写一项"); return; }
  baEnsureLifeState();
  state.readCards.unshift({ id: Date.now(), date: baTodayKey(), plot: a.trim(), word: b.trim(), advice: c.trim() });
  const dd = baGetDailyLog();
  if (!dd.readCheck) { dd.readCheck = true; baRewardLife("readCheck"); }
  baCloseReadLogModal();
  baRenderLifeModule();
}

function baOpenProjectSubmit(w) {
  const pj = BA_WEEK_PROJECTS.find(p => p.w === w) || BA_WEEK_PROJECTS[0];
  const h = `<div class="ba-life-modal on" id="project-modal" onclick="if(event.target===this)baCloseProjectModal()">
    <div class="pixel-panel ba-life-panel">
      <div class="mc-title" style="font-size:16px">${pj.ic} ${pj.n}</div>
      <p style="font-size:11px;color:#888">${pj.d}</p>
      <textarea id="project-text" rows="3" placeholder="我做了什么…" style="width:100%;margin:8px 0"></textarea>
      <input type="file" accept="image/*" id="project-photo" style="margin-bottom:8px;width:100%" onchange="baPreviewProjectImg(event)">
      <img id="project-preview" style="display:none;max-width:100%;max-height:100px;border-radius:4px;margin-bottom:8px">
      <button class="pixel-btn primary" style="width:100%;margin-bottom:6px" onclick="baSubmitProject(${pj.w})">📷 提交作品 +${pj.pts} XP</button>
      <button class="pixel-btn" style="width:100%" onclick="baCloseProjectModal()">取消</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", h);
}

function baPreviewProjectImg(ev) {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const img = document.getElementById("project-preview");
    if (img) { img.src = r.result; img.style.display = "block"; img.dataset.b64 = r.result; }
  };
  r.readAsDataURL(f);
}

function baCloseProjectModal() {
  const m = document.getElementById("project-modal");
  if (m) m.remove();
}

function baSubmitProject(w) {
  const pj = BA_WEEK_PROJECTS.find(p => p.w === w);
  if (!pj) return;
  baEnsureLifeState();
  if (state.projects[w]) { showToast("本周项目已提交"); baCloseProjectModal(); return; }
  const tx = ((document.getElementById("project-text") || {}).value || "").trim();
  const img = document.getElementById("project-preview");
  const b64 = (img && img.dataset && img.dataset.b64) || "";
  if (!tx && !b64) { showToast("请填写说明或上传照片"); return; }
  state.projects[w] = { date: baTodayKey(), text: tx, image: b64 };
  const dd = baGetDailyLog();
  if (!dd.practice) {
    dd.practice = true;
    state.user.xp = (state.user.xp || 0) + pj.pts;
    state.user.gem = (state.user.gem || 0) + 1;
    markDailyPlanDone("practice");
    baTrackLearning("practice", { learnMin: 10 });
    updateHud();
  }
  save();
  baCloseProjectModal();
  baRenderLifeModule();
  showToast("项目已提交！+" + pj.pts + " XP +1 💎");
}

function baSummerWeek() {
  if (!state.summerStart) return 1;
  const diff = Math.floor((Date.now() - state.summerStart) / (7 * 24 * 3600000));
  return Math.min(BA_WEEK_PROJECTS.length, Math.max(1, diff + 1));
}

function baSetLifeTab(tab) {
  window._baLifeTab = tab;
  document.querySelectorAll(".life-tab").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  baRenderLifeModule();
}

function baRenderLifeModule() {
  const root = document.getElementById("life-content");
  if (!root || !state) return;
  baEnsureLifeState();
  const dd = baGetDailyLog();
  const tab = window._baLifeTab || "affairs";
  if (tab === "affairs") {
    root.innerHTML = `
      <div class="pixel-panel" style="margin-bottom:8px">
        <div style="font-weight:700;margin-bottom:6px">📡 时事记录</div>
        <textarea id="life-affairs-text" rows="3" style="width:100%" placeholder="记录今天了解的新闻…">${dd.affairs || ""}</textarea>
        <button class="pixel-btn primary" style="margin-top:6px" onclick="baSaveAffairs()">💾 保存 (+5 XP)</button>
      </div>
      <div class="pixel-panel">
        <div style="font-weight:700;margin-bottom:6px">💭 我的感想</div>
        <textarea id="life-affairs-thought" rows="3" style="width:100%" placeholder="记录你的思考…">${dd.affairsThought || ""}</textarea>
        <button class="pixel-btn primary" style="margin-top:6px" onclick="baSaveAffairsThought()">💾 保存</button>
      </div>`;
  } else if (tab === "labor") {
    root.innerHTML = `
      <div class="pixel-panel" style="margin-bottom:8px">
        <div style="font-weight:700;margin-bottom:6px">🏠 今日劳动</div>
        <textarea id="life-labor-text" rows="3" style="width:100%" placeholder="记录今天的家务…">${dd.labor || ""}</textarea>
        <div style="display:flex;gap:6px;margin-top:6px">
          <button class="pixel-btn primary" onclick="baSaveLabor()">💾 保存 (+5 XP)</button>
          <button class="pixel-btn" onclick="baToggleLaborReview()">${dd.laborReviewed ? "✅ 家长已阅" : "👍 家长已阅"}</button>
        </div>
      </div>
      <div class="pixel-panel"><div style="font-size:12px;color:#888">历史记录保存在每日日志中</div></div>`;
  } else if (tab === "read") {
    const cards = (state.readCards || []).slice(0, 10).map(c =>
      `<div style="padding:8px;border:1px solid var(--mc-border);border-radius:4px;margin-bottom:6px;font-size:11px">
        <div style="color:#888">${c.date}</div>
        <div>📌 ${c.plot || "-"}</div>
        <div>📚 ${c.word || "-"}</div>
        <div>💡 ${c.advice || "-"}</div>
      </div>`
    ).join("") || '<div style="font-size:12px;color:#888">还没有阅读卡片，点击下方开始打卡</div>';
    root.innerHTML = `
      <div class="pixel-panel" style="margin-bottom:8px;text-align:center">
        <button class="pixel-btn primary" onclick="baOpenReadLogModal()">📖 新建阅读打卡 (+8 XP)</button>
        ${dd.readCheck ? '<div style="color:var(--mc-green);font-size:12px;margin-top:6px">✅ 今日阅读打卡已完成</div>' : ""}
      </div>
      <div class="pixel-panel"><div style="font-weight:700;margin-bottom:6px">📚 阅读手册</div>${cards}</div>`;
  } else if (tab === "practice") {
    const cw = baSummerWeek();
    const pj = BA_WEEK_PROJECTS.find(p => p.w === cw) || BA_WEEK_PROJECTS[0];
    const sub = state.projects[pj.w];
    root.innerHTML = `
      <div class="pixel-panel" style="text-align:center">
        <div style="font-size:32px">${pj.ic}</div>
        <div style="font-weight:700">第${pj.w}周 · ${pj.n}</div>
        <div style="font-size:11px;color:#888;margin:6px 0">${pj.d}</div>
        ${sub
          ? `<div style="color:var(--mc-green);font-size:12px">✅ 已提交</div><div style="font-size:11px;margin-top:4px">${(sub.text || "").slice(0, 80)}</div>`
          : `<button class="pixel-btn primary" onclick="baOpenProjectSubmit(${pj.w})">📷 提交作品 +${pj.pts} XP</button>`}
        ${dd.practice ? '<div style="color:var(--mc-green);font-size:12px;margin-top:6px">✅ 今日社会实践计划已完成</div>' : ""}
      </div>`;
  }
}

function baGenerateDailyPlan() {
  const required = [
    { name: "语文积累", desc: "完成1次语文森林挑战", icon: "📃", type: "chinese", biome: "forest" },
    { name: "数学训练", desc: "完成1次数学沙漠挑战", icon: "📒", type: "math", biome: "desert" },
    { name: "英语海洋", desc: "完成1次英语海洋挑战", icon: "📖", type: "english", biome: "ocean" },
    { name: "英语积累", desc: "完成1次PET词汇或词汇互译挑战", icon: "🔤", type: "enAccum", biome: "ocean", nodeId: "en-pet" }
  ];
  let opts = shuffle(BA_OPTIONAL_PLAN).slice(0, 2 + Math.floor(Math.random() * 2));
  if (typeof baExtendGenerateDailyPlan === "function") {
    opts = baExtendGenerateDailyPlan(required, opts);
  }
  return required.concat(opts).map(p => ({ ...p, done: false }));
}

function baExtendDoPlan(p) {
  if (p.type === "affairs") { window._baLifeTab = "affairs"; showScreen("scr-life"); return true; }
  if (p.type === "labor") { window._baLifeTab = "labor"; showScreen("scr-life"); return true; }
  if (p.type === "readCheck") { window._baLifeTab = "read"; showScreen("scr-life"); return true; }
  if (p.type === "practice") { window._baLifeTab = "practice"; showScreen("scr-life"); return true; }
  return false;
}

function baMigrateExtras() {
  if (!state) return;
  baEnsureLifeState();
}
