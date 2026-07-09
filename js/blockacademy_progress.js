// BlockAcademy 进度模块：错题集、自建任务、记录汇总导出
const STATE_VERSION = 4;
const WRONG_BOOK_MAX = 200;

function baEnsureProgressState() {
  if (!state) return;
  if (!state.wrongBook) state.wrongBook = [];
  if (!state.customQuests) state.customQuests = [];
  if (state.stateVersion === undefined) state.stateVersion = STATE_VERSION;
}

function baWrongId(q) {
  const base = (q.q || q.question || "").slice(0, 80);
  return (q.source || "") + "|" + base;
}

function addToWrongBook(q, userAns, meta) {
  if (!state || !q) return;
  baEnsureProgressState();
  const item = {
    id: baWrongId(q),
    q: q.q || q.question || "",
    a: q.a || q.ans || "",
    options: q.options || null,
    optionTexts: q.optionTexts || null,
    open: !!q.open,
    category: q.category || "",
    userAns: userAns || "",
    source: meta?.source || "challenge",
    subject: meta?.subject || "",
    nodeId: meta?.nodeId || "",
    count: 1,
    lastWrong: Date.now(),
    mastered: false
  };
  const idx = state.wrongBook.findIndex(w => w.id === item.id);
  if (idx >= 0) {
    state.wrongBook[idx].count = (state.wrongBook[idx].count || 1) + 1;
    state.wrongBook[idx].userAns = userAns;
    state.wrongBook[idx].lastWrong = Date.now();
    state.wrongBook[idx].mastered = false;
    const moved = state.wrongBook.splice(idx, 1)[0];
    state.wrongBook.unshift(moved);
  } else {
    state.wrongBook.unshift(item);
  }
  if (state.wrongBook.length > WRONG_BOOK_MAX) state.wrongBook.pop();
  save();
}

function markWrongMastered(wid) {
  baEnsureProgressState();
  const w = state.wrongBook.find(x => x.id === wid);
  if (w) { w.mastered = true; save(); }
}

function removeWrongItem(wid) {
  baEnsureProgressState();
  state.wrongBook = state.wrongBook.filter(x => x.id !== wid);
  save();
}

function renderWrongBook() {
  const el = document.getElementById("wrong-list");
  const stat = document.getElementById("wrong-stat");
  if (!el || !state) return;
  baEnsureProgressState();
  const active = state.wrongBook.filter(w => !w.mastered);
  const mastered = state.wrongBook.filter(w => w.mastered);
  if (stat) stat.textContent = `待复习 ${active.length} · 已掌握 ${mastered.length}`;
  const list = active.length ? active : state.wrongBook.slice(0, 20);
  if (!list.length) {
    el.innerHTML = '<div style="color:#888;padding:20px;text-align:center">暂无错题，继续挑战吧！</div>';
    return;
  }
  el.innerHTML = list.slice(0, 40).map(w => {
    const subj = w.subject || w.source || "";
    const preview = (w.q || "").replace(/\n/g, " ").slice(0, 60);
    return `<div class="pixel-panel" style="margin-bottom:8px;font-size:12px">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
        <div style="flex:1">
          <div style="color:var(--mc-gold);font-size:10px;margin-bottom:4px">${subj} · 错${w.count || 1}次</div>
          <div style="line-height:1.5">${preview}${(w.q || "").length > 60 ? "…" : ""}</div>
          <div style="color:#888;margin-top:4px">你的答案：${(w.userAns || "-").slice(0, 30)} · 正确：${(w.a || "").slice(0, 30)}</div>
        </div>
        <button class="pixel-btn" style="font-size:10px;padding:4px 8px" onclick="removeWrongItem('${String(w.id).replace(/'/g, "\\'")}');renderWrongBook()">删除</button>
      </div>
    </div>`;
  }).join("");
}

function startWrongRedo() {
  baEnsureProgressState();
  const pool = state.wrongBook.filter(w => !w.mastered);
  if (!pool.length) { showToast("暂无待复习错题"); return; }
  const picked = shuffle(pool).slice(0, Math.min(10, pool.length)).map(w => ({
    q: w.q,
    a: w.a,
    options: w.options,
    optionTexts: w.optionTexts,
    open: w.open,
    category: w.category,
    _wrongId: w.id
  }));
  gameState = {
    type: "wrong",
    biome: "forest",
    nodeId: "wrong-redo",
    questions: picked,
    current: 0,
    total: picked.length,
    correct: 0,
    isPractice: true,
    isWrongRedo: true
  };
  renderQuestion();
  showScreen("scr-game");
  showToast("错题重练模式（不消耗精力）");
}

function onWrongRedoAnswer(correct, q) {
  if (!gameState?.isWrongRedo || !q?._wrongId) return;
  if (correct) {
    const w = state.wrongBook.find(x => x.id === q._wrongId);
    if (w) {
      w.retryOk = (w.retryOk || 0) + 1;
      if (w.retryOk >= 2) markWrongMastered(q._wrongId);
    }
  } else {
    const w = state.wrongBook.find(x => x.id === q._wrongId);
    if (w) w.retryOk = 0;
  }
  save();
}

// ========== 自建任务（学习契约）==========
const QUEST_SUBJECTS = [
  { id: "any", label: "任意科目", tip: "语数英、史地生道法、脑力、体育、基础训练、合成均可计入", biome: null },
  { id: "chinese", label: "语文", tip: "语文森林：古诗默写、词语辨析、阅读理解、写作表达", biome: "forest" },
  { id: "math", label: "数学", tip: "数学沙漠：口算、简便运算、单位换算、应用题", biome: "desert" },
  { id: "english", label: "英语", tip: "英语海洋：词汇、语法、阅读、词性辨析", biome: "ocean" },
  { id: "pet", label: "PET词汇", tip: "英语海洋 · PET词汇专项（3276+题）", biome: "ocean" },
  { id: "history", label: "历史", tip: "历史遗迹：古代史、近现代史、世界史", biome: "history" },
  { id: "geo", label: "地理", tip: "地理峡谷：自然地理、人文地理、地图技能", biome: "geo" },
  { id: "bio", label: "生物", tip: "生物丛林：植物动物、人体、生态系统", biome: "bio" },
  { id: "moral", label: "道法", tip: "道法神殿：道德、法律、心理健康", biome: "moral" },
  { id: "brain", label: "脑力", tip: "脑科学神殿：斯特鲁普、神经过山车", biome: "brain" },
  { id: "sport", label: "体育", tip: "体育山地：运动打卡（需家长确认码）", biome: "mountain" },
  { id: "basic", label: "基础训练", tip: "基础训练营：口算/拼音/单位/阅读", biome: null },
  { id: "craft", label: "知识合成", tip: "合成台成功合成 1 次物品", biome: null }
];

const QUEST_NODE_OPTIONS = {
  any: [{ id: "", label: "不限节点（该科目下任意挑战）" }],
  chinese: [
    { id: "", label: "语文森林 · 任意节点" },
    { id: "ch-poem", label: "古诗默写" },
    { id: "ch-word", label: "词语辨析" },
    { id: "ch-read", label: "阅读理解" },
    { id: "ch-write", label: "写作表达" }
  ],
  math: [
    { id: "", label: "数学沙漠 · 任意节点" },
    { id: "ma-oral", label: "口算速算" },
    { id: "ma-simp", label: "简便运算" },
    { id: "ma-fill", label: "填空题" },
    { id: "ma-unit", label: "单位换算" },
    { id: "ma-choice", label: "选择题" },
    { id: "ma-apply", label: "解决问题" }
  ],
  english: [
    { id: "", label: "英语海洋 · 任意节点" },
    { id: "en-vocab", label: "词汇互译" },
    { id: "en-grammar", label: "语法填空" },
    { id: "en-reading", label: "阅读理解" },
    { id: "en-classify", label: "词性辨析" }
  ],
  pet: [{ id: "en-pet", label: "PET词汇（固定）" }],
  history: [
    { id: "", label: "历史遗迹 · 任意节点" },
    { id: "hi-ancient", label: "中国古代史" },
    { id: "hi-modern", label: "中国近现代史" },
    { id: "hi-world", label: "世界史常识" }
  ],
  geo: [
    { id: "", label: "地理峡谷 · 任意节点" },
    { id: "geo-nature", label: "自然地理" },
    { id: "geo-china", label: "中国地理" },
    { id: "geo-climate", label: "气候与环境" }
  ],
  bio: [
    { id: "", label: "生物丛林 · 任意节点" },
    { id: "bio-plant", label: "植物世界" },
    { id: "bio-animal", label: "动物与人体" },
    { id: "bio-eco", label: "生态与遗传" }
  ],
  moral: [
    { id: "", label: "道法神殿 · 任意节点" },
    { id: "mo-ethics", label: "道德修养" },
    { id: "mo-law", label: "法律常识" },
    { id: "mo-civics", label: "国情与公民" }
  ],
  brain: [
    { id: "", label: "脑科学 · 任意节点" },
    { id: "brain-stroop", label: "斯特鲁普训练" },
    { id: "brain-sustained", label: "神经过山车" },
    { id: "brain-nback", label: "记忆水晶" },
    { id: "brain-switch", label: "变形符文" },
    { id: "brain-cpt", label: "追踪之眼" },
    { id: "brain-storm", label: "心算风暴" },
    { id: "brain-dual", label: "双轨隧道" },
    { id: "brain-maze", label: "数字迷宫" },
    { id: "brain-time", label: "时间锚点" },
    { id: "brain-wcst", label: "规则圣殿" },
    { id: "brain-mindful", label: "神经漫游" }
  ],
  sport: [{ id: "", label: "体育山地 · 任意打卡" }],
  basic: [
    { id: "", label: "基础训练营 · 任意模块" },
    { id: "basic-math", label: "口算模块" },
    { id: "basic-py", label: "拼音模块" },
    { id: "basic-un", label: "单位模块" },
    { id: "basic-read", label: "阅读模块" },
    { id: "basic-recite", label: "背书训练营" }
  ],
  craft: [{ id: "", label: "合成台 · 任意配方" }]
};

const QUEST_GOAL_LABELS = { count: "完成次数", accuracy: "正确率达标" };

function questSubjectLabel(id) {
  return (QUEST_SUBJECTS.find(s => s.id === id) || {}).label || id;
}

function questNodeLabel(subject, nodeId) {
  const opts = QUEST_NODE_OPTIONS[subject] || QUEST_NODE_OPTIONS.any;
  const o = opts.find(x => x.id === (nodeId || ""));
  return o ? o.label : (nodeId || "任意节点");
}

function calcSuggestedQuestReward(target, days) {
  const t = Math.max(1, target || 5);
  const d = Math.max(1, days || 7);
  return {
    xp: Math.min(300, 15 + t * 4 + Math.floor(d / 7) * 15),
    gem: Math.min(15, 1 + Math.floor(t / 4) + Math.floor(d / 14))
  };
}

function initQuestForm() {
  const subjEl = document.getElementById("quest-subject");
  if (!subjEl) return;
  if (!subjEl.options.length) {
    subjEl.innerHTML = QUEST_SUBJECTS.map(s =>
      `<option value="${s.id}">${s.label}</option>`
    ).join("");
  }
  refreshQuestForm();
}

function refreshQuestForm() {
  const subject = document.getElementById("quest-subject")?.value || "any";
  const goalType = document.getElementById("quest-goal-type")?.value || "count";
  const nodeEl = document.getElementById("quest-node");
  const tipEl = document.getElementById("quest-subject-tip");
  const rateRow = document.getElementById("quest-rate-row");

  if (tipEl) {
    const s = QUEST_SUBJECTS.find(x => x.id === subject);
    tipEl.textContent = s ? "💡 " + s.tip : "";
  }
  if (nodeEl) {
    const opts = QUEST_NODE_OPTIONS[subject] || QUEST_NODE_OPTIONS.any;
    nodeEl.innerHTML = opts.map(o => `<option value="${o.id}">${o.label}</option>`).join("");
    nodeEl.disabled = subject === "craft" || subject === "sport";
  }
  if (rateRow) rateRow.style.display = goalType === "accuracy" ? "block" : "none";

  const sug = calcSuggestedQuestReward(
    parseInt(document.getElementById("quest-target")?.value, 10) || 10,
    parseInt(document.getElementById("quest-days")?.value, 10) || 7
  );
  const xpEl = document.getElementById("quest-xp");
  const gemEl = document.getElementById("quest-gem");
  if (xpEl && document.activeElement !== xpEl) xpEl.value = sug.xp;
  if (gemEl && document.activeElement !== gemEl) gemEl.value = sug.gem;

  updateQuestPreview();
}

function updateQuestPreview() {
  const el = document.getElementById("quest-preview");
  if (!el) return;
  const subject = document.getElementById("quest-subject")?.value || "any";
  const nodeId = document.getElementById("quest-node")?.value || "";
  const goalType = document.getElementById("quest-goal-type")?.value || "count";
  const target = parseInt(document.getElementById("quest-target")?.value, 10) || 10;
  const days = parseInt(document.getElementById("quest-days")?.value, 10) || 7;
  const minRate = parseInt(document.getElementById("quest-min-rate")?.value, 10) || 80;
  const xp = parseInt(document.getElementById("quest-xp")?.value, 10) || 50;
  const gem = parseInt(document.getElementById("quest-gem")?.value, 10) || 3;
  const due = new Date(Date.now() + days * 86400000).toLocaleDateString("zh-CN");

  let verify = `每完成 1 次<strong style="color:#fff">${questSubjectLabel(subject)}</strong>`;
  if (nodeId) verify += ` · <strong style="color:#fff">${questNodeLabel(subject, nodeId)}</strong>`;
  verify += " 的挑战";
  if (goalType === "accuracy") verify += `，且正确率 ≥ ${minRate}%`;
  verify += " → 进度 +1";

  el.innerHTML = `
    <strong style="color:var(--mc-gold)">📋 契约预览</strong><br>
    ${verify}<br>
    目标：<strong style="color:#fff">${target}</strong> 次 · 截止：<strong style="color:#fff">${due}</strong><br>
    基础奖励：<strong style="color:var(--mc-gold)">${xp} XP + ${gem} 💎</strong><br>
    家长核准领取：额外 <strong style="color:var(--mc-green)">+${Math.floor(xp * 0.5)} XP + 1 💎</strong>
  `;
}

function createCustomQuest() {
  baEnsureProgressState();
  const name = (document.getElementById("quest-name")?.value || "").trim();
  const subject = document.getElementById("quest-subject")?.value || "any";
  const nodeId = document.getElementById("quest-node")?.value || "";
  const goalType = document.getElementById("quest-goal-type")?.value || "count";
  const minRate = parseInt(document.getElementById("quest-min-rate")?.value, 10) || 80;
  const target = parseInt(document.getElementById("quest-target")?.value, 10) || 5;
  const days = parseInt(document.getElementById("quest-days")?.value, 10) || 7;
  const rewardXp = parseInt(document.getElementById("quest-xp")?.value, 10) || 50;
  const rewardGem = parseInt(document.getElementById("quest-gem")?.value, 10) || 3;

  if (!name) { showToast("请填写任务名称"); return; }
  if (target < 1 || target > 100) { showToast("目标次数需在 1–100 之间"); return; }
  if (days < 1 || days > 90) { showToast("期限需在 1–90 天之间"); return; }

  const subjMeta = QUEST_SUBJECTS.find(s => s.id === subject) || {};
  const now = Date.now();
  state.customQuests.unshift({
    id: "q_" + now,
    name,
    subject,
    nodeId: nodeId || "",
    goalType,
    minRate: goalType === "accuracy" ? minRate : 0,
    targetCount: target,
    days,
    rewardXp,
    rewardGem,
    parentBonusXp: Math.floor(rewardXp * 0.5),
    parentBonusGem: 1,
    biome: subjMeta.biome || null,
    createdAt: now,
    dueDate: now + days * 86400000,
    progress: 0,
    status: "active",
    logs: []
  });
  save();
  renderCustomQuests();
  document.getElementById("quest-name").value = "";
  showToast("📜 学习契约已创建！完成挑战后自动计进度");
}

function questMatchesActivity(q, type, detail) {
  if (q.status !== "active") return false;
  const actType = type === "pet" ? "pet" : type;
  if (q.subject !== "any" && q.subject !== actType) return false;

  if (q.nodeId) {
    const nid = detail?.nodeId || "";
    if (q.subject === "basic") {
      const modeMap = { "basic-math": "math", "basic-py": "py", "basic-un": "un", "basic-read": "read", "basic-recite": "recite" };
      const expect = modeMap[q.nodeId];
      if (expect && detail?.basicMode !== expect && expect !== "recite") return false;
      if (expect === "recite" && detail?.nodeId !== "ch-poem" && detail?.label && !String(detail.label).includes("背书")) return false;
    } else if (nid !== q.nodeId) return false;
  }

  if (q.goalType === "accuracy" && detail?.total > 0) {
    const rate = (detail.correct || 0) / detail.total * 100;
    if (rate < (q.minRate || 80)) return false;
  }
  return true;
}

function checkCustomQuests(type, detail) {
  if (!state?.customQuests?.length) return;
  baEnsureProgressState();
  const now = Date.now();
  let changed = false;

  state.customQuests.forEach(q => {
    if (q.status === "active" && now > q.dueDate && (q.progress || 0) < q.targetCount) {
      q.status = "failed";
      changed = true;
      return;
    }
    if (!questMatchesActivity(q, type, detail || {})) return;

    q.progress = (q.progress || 0) + 1;
    if (!q.logs) q.logs = [];
    q.logs.unshift({
      at: now,
      label: detail?.label || getActivityTypeLabel(type),
      correct: detail?.correct,
      total: detail?.total
    });
    if (q.logs.length > 5) q.logs.pop();
    changed = true;
    if (q.progress >= q.targetCount) {
      q.status = "completed";
      q.completedAt = now;
    }
  });

  if (changed) {
    save();
    const el = document.getElementById("quest-list");
    if (el && document.getElementById("scr-plan")?.classList.contains("on")) renderCustomQuests();
  }
}

function claimQuestReward(qid, requireParent, pinOverride) {
  baEnsureProgressState();
  const q = state.customQuests.find(x => x.id === qid);
  if (!q || q.status !== "completed") {
    showToast("任务尚未完成或已领取");
    return;
  }

  let xp = q.rewardXp || 0;
  let gem = q.rewardGem || 0;
  let parentOk = false;

  if (requireParent) {
    let pin = pinOverride;
    if (pin === undefined) {
      pin = prompt("请输入家长确认码，领取核准加成（+" + (q.parentBonusXp || Math.floor(xp * 0.5)) + " XP +" + (q.parentBonusGem || 1) + " 💎）");
    }
    if (pin === null || pin === undefined) return;
    const expect = state.parentPin || (typeof DEFAULT_PARENT_PIN !== "undefined" ? DEFAULT_PARENT_PIN : "1234");
    if (String(pin).trim() !== expect) { showToast("🔒 家长确认码不正确"); return; }
    xp += q.parentBonusXp || Math.floor((q.rewardXp || 0) * 0.5);
    gem += q.parentBonusGem || 1;
    parentOk = true;
  }

  state.user.xp = (state.user.xp || 0) + xp;
  state.user.gem = (state.user.gem || 0) + gem;
  q.status = "claimed";
  q.claimedAt = Date.now();
  q.parentVerified = parentOk;
  save();
  updateHud();
  renderCustomQuests();
  showToast(parentOk
    ? `🎉 家长核准领取！+${xp} XP +${gem} 💎`
    : `任务完成！+${xp} XP +${gem} 💎`);
}

function deleteCustomQuest(qid) {
  baEnsureProgressState();
  state.customQuests = state.customQuests.filter(x => x.id !== qid);
  save();
  renderCustomQuests();
}

function goToCustomQuest(qid) {
  const q = state.customQuests.find(x => x.id === qid);
  if (!q || q.status !== "active") return;
  const p = {
    type: q.subject === "pet" ? "pet" : q.subject,
    biome: q.biome,
    nodeId: q.nodeId || (q.subject === "pet" ? "en-pet" : ""),
    name: q.name
  };
  if (q.subject === "craft") { showScreen("scr-craft"); return; }
  if (q.subject === "basic") { showScreen("scr-basic"); renderBasicMenu(); return; }
  if (q.nodeId === "basic-recite") { showScreen("scr-recite"); renderReciteMenu(); return; }
  if (typeof baEnterPlanTarget === "function") baEnterPlanTarget(p);
  else showScreen("scr-map");
}

function renderCustomQuests() {
  const el = document.getElementById("quest-list");
  if (!el || !state) return;
  baEnsureProgressState();
  const now = Date.now();

  state.customQuests.forEach(q => {
    if (!q.goalType) q.goalType = "count";
    if (q.status === "active" && now > q.dueDate && (q.progress || 0) < q.targetCount) q.status = "failed";
  });

  const active = state.customQuests.filter(q => ["active", "completed"].includes(q.status));
  if (!active.length) {
    el.innerHTML = '<div style="color:#888;font-size:12px;padding:12px;text-align:center">还没有学习契约。在下方按步骤创建，系统会在你完成挑战后<strong>自动验证</strong>进度。</div>';
    return;
  }

  el.innerHTML = active.slice(0, 10).map(q => {
    const pct = Math.min(100, Math.round((q.progress || 0) / q.targetCount * 100));
    const due = new Date(q.dueDate).toLocaleDateString("zh-CN");
    const daysLeft = Math.max(0, Math.ceil((q.dueDate - now) / 86400000));
    const scope = questSubjectLabel(q.subject) + (q.nodeId ? " · " + questNodeLabel(q.subject, q.nodeId) : "");
    const goalDesc = q.goalType === "accuracy"
      ? `正确率≥${q.minRate || 80}%才计入`
      : "每次合格挑战 +1";
    const lastLog = (q.logs && q.logs[0])
      ? `<div style="font-size:10px;color:#666;margin-top:4px">最近：${new Date(q.logs[0].at).toLocaleString("zh-CN")} ${q.logs[0].label}${q.logs[0].total ? " " + q.logs[0].correct + "/" + q.logs[0].total : ""}</div>`
      : `<div style="font-size:10px;color:#666;margin-top:4px">尚未有进度，点击下方「去做任务」</div>`;

    let actions = "";
    if (q.status === "completed") {
      actions = `<div class="quest-card-actions">
        <button class="pixel-btn primary" style="font-size:11px" onclick="claimQuestReward('${q.id}', false)">🎁 领取 ${q.rewardXp}XP+${q.rewardGem}💎</button>
        <button class="pixel-btn" style="font-size:11px" onclick="claimQuestReward('${q.id}', true)">👨‍👩‍👧 家长核准 +${q.parentBonusXp || Math.floor(q.rewardXp * 0.5)}XP+${q.parentBonusGem || 1}💎</button>
      </div>`;
    } else if (q.status === "failed") {
      actions = `<span style="color:var(--mc-red);font-size:11px">已过期未达标</span>`;
    } else {
      actions = `<div class="quest-card-actions">
        <button class="pixel-btn primary" style="font-size:11px" onclick="goToCustomQuest('${q.id}')">▶ 去做任务</button>
        <span style="color:#888;font-size:11px;align-self:center">剩余 ${daysLeft} 天 · 完成挑战自动 +1</span>
      </div>`;
    }

    return `<div class="pixel-panel" style="margin-bottom:8px;font-size:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <strong style="color:var(--mc-gold)">📜 ${q.name}</strong>
        <button class="pixel-btn" style="font-size:10px;padding:2px 6px" onclick="deleteCustomQuest('${q.id}')">删除</button>
      </div>
      <div style="color:#888;font-size:11px;line-height:1.5">
        ${scope}<br>
        ${QUEST_GOAL_LABELS[q.goalType] || "完成次数"}：${goalDesc} · 目标 ${q.targetCount} 次 · 截止 ${due}
      </div>
      <div class="rank-bar" style="margin:6px 0"><div style="width:${pct}%;height:100%;background:var(--mc-green);border-radius:4px"></div></div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px">
        <span>进度 <strong>${q.progress || 0}/${q.targetCount}</strong>（${pct}%）</span>
        ${q.status === "completed" ? '<span style="color:var(--mc-green)">✅ 已达标，可领取</span>' : ""}
      </div>
      ${lastLog}
      ${actions}
    </div>`;
  }).join("");
}

// ========== 记录汇总与导出 ==========
function getRecordSummary() {
  baEnsureProgressState();
  if (typeof baEnsureLifeState === "function") baEnsureLifeState();
  const logs = state.dailyLogs || {};
  const days = Object.keys(logs).length;
  let affairsDays = 0, laborDays = 0, readDays = 0, practiceDays = 0;
  Object.values(logs).forEach(d => {
    if (d.affairsDone || (d.affairs && d.affairs.trim())) affairsDays++;
    if (d.laborDone || (d.labor && d.labor.trim())) laborDays++;
    if (d.readCheck) readDays++;
    if (d.practice) practiceDays++;
  });
  return {
    dailyLogDays: days,
    affairsDays,
    laborDays,
    readDays,
    practiceDays,
    readCards: (state.readCards || []).length,
    projects: Object.keys(state.projects || {}).length,
    historyCount: (state.history || []).length,
    wrongCount: (state.wrongBook || []).filter(w => !w.mastered).length,
    wrongTotal: (state.wrongBook || []).length,
    questActive: (state.customQuests || []).filter(q => q.status === "active").length,
    questTotal: (state.customQuests || []).length,
    customPlanCount: (state.dailyPlan || []).filter(p => p.custom).length,
    learnMinutes: (state.learnTrack && state.learnTrack.minutes) || 0,
    leisureCoins: state.leisureCoins || 0,
    userBankCount: Object.keys(state.userBanks || {}).length
  };
}

function renderRecordSummary() {
  const el = document.getElementById("record-summary");
  if (!el || !state) return;
  const s = getRecordSummary();
  el.innerHTML = `
    <div style="font-size:12px;line-height:1.8;color:#aaa">
      <strong style="color:var(--mc-gold)">📋 每日输入记录汇总</strong><br>
      · <strong>时政/劳动/阅读/实践</strong>：计划页 →「生活记录」录入（${s.dailyLogDays} 天有日志）<br>
      · 时政 ${s.affairsDays} 天 · 劳动 ${s.laborDays} 天 · 阅读打卡 ${s.readDays} 天 · 社会实践 ${s.practiceDays} 天<br>
      · 阅读知识卡片 ${s.readCards} 张 · 社会实践作品 ${s.projects} 份<br>
      · <strong>学习流水</strong>：本页下方「学习流水」（${s.historyCount} 条）<br>
      · <strong>错题集</strong>：计划页 →「错题本」（待复习 ${s.wrongCount} 道，共 ${s.wrongTotal} 道）<br>
      · <strong>自建任务</strong>：计划页 →「我的任务」（进行中 ${s.questActive} / 共 ${s.questTotal} 个）<br>
      · <strong>自选学科计划</strong>：计划页（今日 ${s.customPlanCount} 项自选）<br>
      · <strong>专注学习</strong>：今日 ${s.learnMinutes} 分钟 · 休闲币 🪙 ${s.leisureCoins}<br>
      · <strong>自定义题库</strong>：${s.userBankCount} 套（完整存档 JSON 含题目与用户进度）<br>
      · <strong>完整存档</strong>：顶部 HUD「导出」JSON（含全部进度，换机/更新前请备份）
    </div>`;
}

function exportLifeRecords(mode) {
  baEnsureProgressState();
  if (typeof baEnsureLifeState === "function") baEnsureLifeState();
  const s = getRecordSummary();
  const logs = state.dailyLogs || {};
  const logRows = Object.entries(logs).sort((a, b) => b[0].localeCompare(a[0])).map(([date, d]) =>
    `<tr><td>${date}</td><td>${(d.affairs || "").slice(0, 80)}</td><td>${(d.labor || "").slice(0, 60)}</td><td>${d.readCheck ? "✓" : ""}</td><td>${d.practice ? "✓" : ""}</td></tr>`
  ).join("");
  const cards = (state.readCards || []).slice(0, 30).map(c =>
    `<li>${c.date}：${(c.plot || "").slice(0, 40)} / ${(c.word || "").slice(0, 30)}</li>`
  ).join("");
  const wrongRows = (state.wrongBook || []).slice(0, 25).map(w =>
    `<tr><td>${(w.q || "").slice(0, 60)}</td><td>${w.wrongCount || 1}</td><td>${w.mastered ? "已掌握" : "待复习"}</td></tr>`
  ).join("");
  const questRows = (state.customQuests || []).map(q =>
    `<tr><td>${q.name || ""}</td><td>${q.progress || 0}/${q.target || 0}</td><td>${q.status || ""}</td></tr>`
  ).join("");
  const planRows = (state.dailyPlan || []).filter(p => p.custom).map(p =>
    `<tr><td>${p.name || ""}</td><td>${(p.goalText || p.desc || "").slice(0, 50)}</td><td>${p.done ? "✅" : (p.progressMinutes || 0) + "/" + (p.targetMinutes || 30) + "分"}</td></tr>`
  ).join("");
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>生活与学习记录 - ${state.user.name}</title>
<style>body{font-family:Microsoft YaHei,sans-serif;padding:24px;color:#222}h1{color:#c49a1a}table{border-collapse:collapse;width:100%;margin:12px 0}td,th{border:1px solid #ccc;padding:6px;font-size:12px}th{background:#f5f5f5}</style></head><body>
<h1>📋 ${state.user.name} 的综合学习记录</h1>
<p>生成：${new Date().toLocaleString("zh-CN")} · 连续打卡 ${state.dayStreak || 0} 天 · 待复习错题 ${s.wrongCount} 道 · 今日学习 ${s.learnMinutes} 分钟 · 休闲币 ${s.leisureCoins}</p>
<h3>生活记录（按日）</h3>
<table><tr><th>日期</th><th>时政</th><th>劳动</th><th>阅读</th><th>实践</th></tr>${logRows || "<tr><td colspan=5>暂无</td></tr>"}</table>
<h3>阅读知识卡片</h3><ul>${cards || "<li>暂无</li>"}</ul>
<h3>自选学科计划（今日）</h3>
<table><tr><th>计划</th><th>目标</th><th>进度</th></tr>${planRows || "<tr><td colspan=3>暂无</td></tr>"}</table>
<h3>自建任务（学习契约）</h3>
<table><tr><th>任务</th><th>进度</th><th>状态</th></tr>${questRows || "<tr><td colspan=3>暂无</td></tr>"}</table>
<h3>错题本（摘录）</h3>
<table><tr><th>题目</th><th>错次</th><th>状态</th></tr>${wrongRows || "<tr><td colspan=3>暂无</td></tr>"}</table>
<h3>最近学习流水</h3><ul>${(state.history || []).slice(0, 30).map(h => `<li>${h.date} ${h.label || h.type || ""} ${h.total ? (h.correct + "/" + h.total) : ""}</li>`).join("") || "<li>暂无</li>"}</ul>
<p style="font-size:11px;color:#666;margin-top:24px">完整进度（含背包、合成、图谱、自定义题库等）请使用 HUD「导出」或上方「完整存档 JSON」。</p>
</body></html>`;
  if (mode === "print") {
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    return;
  }
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `综合记录_${state.user.name}_${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("📄 综合记录已导出");
}

function baMigrateProgress() {
  if (!state) return;
  baEnsureProgressState();
  const ver = state.stateVersion || 0;
  if (ver < 2) {
    if (!state.dailyLogs) state.dailyLogs = {};
    if (!state.readCards) state.readCards = [];
    if (!state.projects) state.projects = {};
  }
  if (ver < 3) {
    if (!state.wrongBook) state.wrongBook = [];
    if (!state.customQuests) state.customQuests = [];
  }
  if (ver < 4) {
    (state.customQuests || []).forEach(q => {
      if (!q.goalType) q.goalType = "count";
      if (q.nodeId === undefined) q.nodeId = "";
      if (!q.logs) q.logs = [];
      if (!q.parentBonusXp) q.parentBonusXp = Math.floor((q.rewardXp || 50) * 0.5);
      if (!q.parentBonusGem) q.parentBonusGem = 1;
    });
  }
  state.stateVersion = STATE_VERSION;
}
