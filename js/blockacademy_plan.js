// BlockAcademy 计划扩展：PET 专项 + 自选学科计划

const BA_PLAN_SUBJECTS = [
  { type: "chinese", biome: "forest", name: "语文森林", desc: "完成1次语文森林挑战", icon: "📃" },
  { type: "math", biome: "desert", name: "数学沙漠", desc: "完成1次数学沙漠挑战", icon: "📒" },
  { type: "english", biome: "ocean", name: "英语海洋", desc: "完成1次英语海洋挑战", icon: "📖" },
  { type: "pet", biome: "ocean", nodeId: "en-pet", name: "PET词汇专项", desc: "完成1次英语海洋·PET词汇挑战", icon: "🇬🇧" },
  { type: "history", biome: "history", name: "历史遗迹", desc: "完成1次历史遗迹挑战", icon: "🏛️" },
  { type: "geo", biome: "geo", name: "地理峡谷", desc: "完成1次地理峡谷挑战", icon: "🌍" },
  { type: "bio", biome: "bio", name: "生物丛林", desc: "完成1次生物丛林挑战", icon: "🌿" },
  { type: "moral", biome: "moral", name: "道法神殿", desc: "完成1次道法神殿挑战", icon: "⛪" },
  { type: "sport", biome: "mountain", name: "体育山地", desc: "完成1次体育山地打卡", icon: "🏃" },
  { type: "brain", biome: "brain", name: "脑科学神殿", desc: "完成1次脑科学挑战", icon: "🧠" },
  { type: "basic", name: "基础训练营", desc: "完成30道口算/拼音/单位/阅读题", icon: "🏋️" },
  { type: "craft", name: "知识合成", desc: "尝试合成1个物品", icon: "⚒" }
];

const BA_PET_PLAN = { name: "PET词汇专项", desc: "完成1次英语海洋·PET词汇挑战", icon: "🇬🇧", type: "pet", biome: "ocean", nodeId: "en-pet" };

const BA_PLAN_ICONS = {
  chinese: "📃", math: "📒", english: "📖", pet: "🇬🇧", history: "🏛️",
  geo: "🌍", bio: "🌿", moral: "⛪", sport: "🏃", brain: "🧠", basic: "🏋️", craft: "⚒"
};

function baPlanSubjectOptions() {
  return BA_PLAN_SUBJECTS;
}

function baCustomPlanSubjects() {
  if (typeof QUEST_SUBJECTS !== "undefined") {
    return QUEST_SUBJECTS.filter(s => s.id !== "any");
  }
  return BA_PLAN_SUBJECTS.map(s => ({ id: s.type, label: s.name, tip: s.desc, biome: s.biome }));
}

function baCustomPlanSubjectMeta(type) {
  const fromQuest = (typeof QUEST_SUBJECTS !== "undefined" && QUEST_SUBJECTS.find(s => s.id === type)) || null;
  const fromPlan = BA_PLAN_SUBJECTS.find(s => s.type === type);
  return {
    label: fromQuest?.label || fromPlan?.name || type,
    biome: fromQuest?.biome ?? fromPlan?.biome,
    icon: fromPlan?.icon || BA_PLAN_ICONS[type] || "📚"
  };
}

function initCustomPlanForm() {
  const subjEl = document.getElementById("custom-plan-subject");
  if (!subjEl) return;
  if (!subjEl.options.length) {
    subjEl.innerHTML = baCustomPlanSubjects().map(s =>
      `<option value="${s.id}">${s.label}</option>`
    ).join("");
  }
  refreshCustomPlanForm();
}

function refreshCustomPlanForm() {
  const subject = document.getElementById("custom-plan-subject")?.value || "math";
  const nodeEl = document.getElementById("custom-plan-node");
  if (nodeEl) {
    const opts = (typeof QUEST_NODE_OPTIONS !== "undefined" && QUEST_NODE_OPTIONS[subject])
      || (typeof QUEST_NODE_OPTIONS !== "undefined" && QUEST_NODE_OPTIONS.any)
      || [{ id: "", label: "任意节点" }];
    nodeEl.innerHTML = opts.map(o => `<option value="${o.id}">${o.label}</option>`).join("");
    nodeEl.disabled = subject === "craft";
  }
  updateCustomPlanPreview();
  const goalEl = document.getElementById("custom-plan-goal");
  const minEl = document.getElementById("custom-plan-minutes");
  if (goalEl && !goalEl._bound) {
    goalEl._bound = true;
    goalEl.addEventListener("input", updateCustomPlanPreview);
  }
  if (minEl && !minEl._bound) {
    minEl._bound = true;
    minEl.addEventListener("change", updateCustomPlanPreview);
  }
}

function updateCustomPlanPreview() {
  const el = document.getElementById("custom-plan-preview");
  if (!el) return;
  const subject = document.getElementById("custom-plan-subject")?.value || "math";
  const nodeId = document.getElementById("custom-plan-node")?.value || "";
  const goal = (document.getElementById("custom-plan-goal")?.value || "").trim();
  const mins = parseInt(document.getElementById("custom-plan-minutes")?.value, 10) || 30;
  const meta = baCustomPlanSubjectMeta(subject);
  let nodeLabel = "任意节点";
  if (typeof questNodeLabel === "function") nodeLabel = questNodeLabel(subject, nodeId);
  else if (typeof QUEST_NODE_OPTIONS !== "undefined") {
    const o = (QUEST_NODE_OPTIONS[subject] || []).find(x => x.id === nodeId);
    if (o) nodeLabel = o.label;
  }
  el.innerHTML = `
    <strong style="color:var(--mc-gold)">📋 计划预览</strong><br>
    科目：<strong style="color:#fff">${meta.label}</strong> · 节点：<strong style="color:#fff">${nodeLabel}</strong><br>
    目标：${goal ? `<strong style="color:#fff">${goal}</strong>` : "<span style='color:#666'>请填写学习目标</span>"}<br>
    时长：<strong style="color:#fff">${Math.max(30, mins)}</strong> 分钟（该科目学习累计达标后自动完成）
  `;
}

function baAddCustomPlanItem() {
  if (!state) return;
  const subject = document.getElementById("custom-plan-subject")?.value;
  const nodeId = document.getElementById("custom-plan-node")?.value || "";
  const goalText = (document.getElementById("custom-plan-goal")?.value || "").trim();
  let targetMinutes = parseInt(document.getElementById("custom-plan-minutes")?.value, 10) || 30;
  if (targetMinutes < 30) targetMinutes = 30;
  if (!subject) { showToast("请选择学科"); return; }
  if (!goalText) { showToast("请填写学习目标"); return; }

  const meta = baCustomPlanSubjectMeta(subject);
  let nodeLabel = "";
  if (typeof questNodeLabel === "function") nodeLabel = questNodeLabel(subject, nodeId);
  const shortNode = nodeLabel.replace(/ · 任意节点| · 任意模块| · 任意打卡| · 任意配方/g, "").split(" · ").pop() || "";
  const name = shortNode && !shortNode.includes("任意") ? `${meta.label} · ${shortNode}` : meta.label;

  if (!state.dailyPlan) state.dailyPlan = [];
  const dup = state.dailyPlan.some(p =>
    p.custom && !p.done && p.type === subject && (p.nodeId || "") === nodeId && p.goalText === goalText
  );
  if (dup) { showToast("今日已有相同自选计划"); return; }

  state.dailyPlan.push({
    name,
    desc: `学习 ${targetMinutes} 分钟 · ${goalText}`,
    goalText,
    targetMinutes,
    progressMinutes: 0,
    goalType: "minutes",
    icon: meta.icon,
    type: subject,
    biome: meta.biome,
    nodeId: nodeId || undefined,
    custom: true,
    done: false
  });
  save();
  const goalEl = document.getElementById("custom-plan-goal");
  if (goalEl) goalEl.value = "";
  renderPlan();
  showToast("已加入今日计划：" + name);
}

function baCheckCustomDailyPlans(type, detail, mins) {
  if (!state?.dailyPlan?.length || !mins) return false;
  let updated = false;
  const nodeId = detail?.nodeId || detail?.node || "";
  state.dailyPlan.forEach(p => {
    if (p.done || !p.custom || p.goalType !== "minutes") return;
    if (p.type !== type) return;
    if (p.nodeId && nodeId && p.nodeId !== nodeId) return;
    p.progressMinutes = (p.progressMinutes || 0) + mins;
    if (p.progressMinutes >= (p.targetMinutes || 30)) {
      p.done = true;
      if (typeof showToast === "function") showToast("✅ 自选计划完成：" + p.name);
    }
    updated = true;
  });
  if (updated) {
    save();
    const planScr = document.getElementById("scr-plan");
    if (planScr?.classList.contains("on") && typeof renderPlan === "function") renderPlan();
  }
  return updated;
}

function baRemoveCustomPlan(idx) {
  if (!state?.dailyPlan?.[idx]?.custom) return;
  state.dailyPlan.splice(idx, 1);
  save();
  renderPlan();
}

function baEnterPlanTarget(p) {
  if (p.type === "enAccum") {
    showScreen("scr-map");
    setTimeout(() => {
      enterBiome("ocean");
      setTimeout(() => {
        const nodeId = p.nodeId || "en-pet";
        const node = { id: nodeId, name: (typeof NODE_LABELS !== "undefined" && NODE_LABELS[nodeId]) || "PET词汇", type: "english" };
        startGameSession("ocean", node);
      }, 450);
    }, 300);
    return;
  }
  if (p.type === "basic") { showScreen("scr-basic"); renderBasicMenu(); return; }
  if (p.type === "recite" || p.nodeId === "basic-recite") { showScreen("scr-recite"); renderReciteMenu(); return; }
  if (p.type === "craft") { showScreen("scr-craft"); return; }
  if (typeof baExtendDoPlan === "function" && baExtendDoPlan(p)) return;
  const biomeMap = { chinese: "forest", math: "desert", english: "ocean", pet: "ocean", history: "history", geo: "geo", bio: "bio", moral: "moral", sport: "mountain", brain: "brain" };
  const biome = p.biome || biomeMap[p.type];
  if (!biome) { showScreen("scr-map"); return; }
  showScreen("scr-map");
  setTimeout(() => {
    enterBiome(biome);
    if (p.nodeId) {
      setTimeout(() => {
        const qType = p.type === "pet" ? "english" : (p.type === "sport" ? "sport" : p.type);
        const node = { id: p.nodeId, name: (typeof NODE_LABELS !== "undefined" && NODE_LABELS[p.nodeId]) || p.name, type: qType };
        startGameSession(biome, node);
      }, 450);
    }
  }, 300);
}

function baExtendGenerateDailyPlan(required, opts) {
  return opts;
}

function baPlanActivityType(gs) {
  if (gs?.nodeId === "en-pet") return "pet";
  return null;
}

function baEnsurePlanState() {
  if (!state) return;
  if (!state.customPlanPrefs) state.customPlanPrefs = [];
}

function baMigratePlan() {
  baEnsurePlanState();
  if (!state?.dailyPlan) return;
  state.dailyPlan.forEach(p => {
    if (p.custom && !p.goalType) {
      p.goalType = "minutes";
      p.targetMinutes = p.targetMinutes || 30;
      p.progressMinutes = p.progressMinutes || 0;
    }
  });
}
