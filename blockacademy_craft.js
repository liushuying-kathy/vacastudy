// BlockAcademy 合成系统 · 我的世界式分层配方与生命周期
// 存储：state.backpack（可堆叠原料/中间品）· state.artifacts（唯一珍宝）· state.discoveredRecipes（已解锁配方）

const CRAFT_TIER_LABEL = { 1: "基础加工", 2: "进阶合成", 3: "大师作品", 4: "传说珍宝" };
const BACKPACK_STACK_MAX = 99;

const CRAFT_SUBJECT_TABS = [
  { id: "chinese", label: "📃 语文" },
  { id: "math", label: "📒 数学" },
  { id: "english", label: "📖 英语" },
  { id: "history", label: "🏛️ 历史" },
  { id: "geo", label: "🌍 地理" },
  { id: "bio", label: "🌿 生物" },
  { id: "moral", label: "⛪ 道法" },
  { id: "brain", label: "🧠 脑科学" },
  { id: "sport", label: "🏃 体育" },
  { id: "mixed", label: "✨ 综合" }
];

const CRAFT_RECIPE_SUBJECT = {
  t1_lit: "chinese", t2_ch: "chinese",
  t1_math: "math", t2_math: "math",
  t1_pet: "english", t2_en: "english",
  t1_hist: "history", t2_hist: "history",
  t1_geo: "geo", t2_geo: "geo",
  t1_bio: "bio", t2_bio: "bio",
  t1_moral: "moral", t2_moral: "moral",
  t1_brain: "brain", t2_brain: "brain",
  t1_sport: "sport",
  t3_core: "mixed", t3_world: "mixed", t3_mind: "mixed",
  t4_graduate: "mixed", t4_compass: "mixed", t4_stone: "mixed"
};

let baCraftRecipeSubject = "chinese";
let baEncyclopediaTab = "item";
let baEncyclopediaQuery = "";

/** 探险挑战掉落池（与 getDrops 一致，供配方宝典查询） */
const BA_DROP_POOLS = {
  chinese: { label: "语文森林", biome: "forest", items: ["语文素材", "写作技巧", "阅读理解"] },
  math: { label: "数学沙漠", biome: "desert", items: ["小数运算", "方程基础", "应用题"] },
  english: { label: "英语海洋", biome: "ocean", items: ["PET词汇", "语法训练", "情景对话"] },
  history: { label: "历史遗迹", biome: "history", items: ["历史碎片", "朝代卡片", "人物传记"] },
  geo: { label: "地理峡谷", biome: "geo", items: ["地图碎片", "地形模型", "气候图鉴"] },
  bio: { label: "生物丛林", biome: "bio", items: ["细胞标本", "生态图鉴", "遗传密码"] },
  moral: { label: "道法神殿", biome: "moral", items: ["道德锦囊", "法律条文", "公民手册"] },
  brain: { label: "脑科学神殿", biome: "brain", items: ["神经突触", "多巴胺晶体", "前额叶符文", "海马体晶片", "神经可塑性药剂"] },
  sport: { label: "体育山地", biome: "mountain", items: ["运动鞋", "水壶", "能量棒"] }
};

const BA_ENCYCLOPEDIA_TABS = [
  { id: "item", label: "📦 按物品" },
  { id: "recipe", label: "📜 按配方" },
  { id: "drop", label: "🗺️ 掉落地图" }
];

const CRAFT_RECIPES = [
  // Tier 1 — 单科原料 → 中间品（存 backpack）
  { id: "t1_lit", tier: 1, name: "文学原稿", icon: "📜", need: { "语文素材": 2, "阅读理解": 1 }, output: "文学原稿", reward: { xp: 15, gem: 0 } },
  { id: "t1_math", tier: 1, name: "演算核心", icon: "⚙️", need: { "小数运算": 2, "方程基础": 1 }, output: "演算核心", reward: { xp: 15, gem: 0 } },
  { id: "t1_pet", tier: 1, name: "PET词库", icon: "📇", need: { "PET词汇": 2, "语法训练": 1 }, output: "PET词库", reward: { xp: 15, gem: 0 } },
  { id: "t1_hist", tier: 1, name: "时空卷轴", icon: "📜", need: { "历史碎片": 2, "朝代卡片": 1 }, output: "时空卷轴", reward: { xp: 15, gem: 0 } },
  { id: "t1_geo", tier: 1, name: "地理罗盘", icon: "🧭", need: { "地图碎片": 2, "地形模型": 1 }, output: "地理罗盘", reward: { xp: 15, gem: 0 } },
  { id: "t1_bio", tier: 1, name: "生命种子", icon: "🌱", need: { "细胞标本": 2, "生态图鉴": 1 }, output: "生命种子", reward: { xp: 15, gem: 0 } },
  { id: "t1_moral", tier: 1, name: "公民徽章", icon: "🎖️", need: { "道德锦囊": 2, "法律条文": 1 }, output: "公民徽章", reward: { xp: 15, gem: 0 } },
  { id: "t1_brain", tier: 1, name: "专注模组", icon: "🔮", need: { "神经突触": 2, "多巴胺晶体": 1 }, output: "专注模组", reward: { xp: 15, gem: 0 } },
  { id: "t1_sport", tier: 1, name: "体能补给包", icon: "🎒", need: { "运动鞋": 1, "水壶": 1, "能量棒": 1 }, output: "体能补给包", reward: { xp: 12, gem: 0 } },

  // Tier 2 — 中间品深化（仍存 backpack，可被 Tier3 消耗）
  { id: "t2_ch", tier: 2, name: "语文大师卷", icon: "📖", need: { "文学原稿": 2, "写作技巧": 1 }, output: "语文大师卷", reward: { xp: 35, gem: 1 } },
  { id: "t2_math", tier: 2, name: "数学演算引擎", icon: "🔢", need: { "演算核心": 2, "应用题": 1 }, output: "数学演算引擎", reward: { xp: 35, gem: 1 } },
  { id: "t2_en", tier: 2, name: "PET冲刺包", icon: "🇬🇧", need: { "PET词库": 2, "情景对话": 1 }, output: "PET冲刺包", reward: { xp: 35, gem: 1 } },
  { id: "t2_hist", tier: 2, name: "文明图鉴", icon: "🏛️", need: { "时空卷轴": 2, "人物传记": 1 }, output: "文明图鉴", reward: { xp: 35, gem: 1 } },
  { id: "t2_geo", tier: 2, name: "世界地图", icon: "🗺️", need: { "地理罗盘": 2, "气候图鉴": 1 }, output: "世界地图", reward: { xp: 35, gem: 1 } },
  { id: "t2_bio", tier: 2, name: "生态方舟", icon: "🌍", need: { "生命种子": 2, "遗传密码": 1 }, output: "生态方舟", reward: { xp: 35, gem: 1 } },
  { id: "t2_moral", tier: 2, name: "法治宝典", icon: "⚖️", need: { "公民徽章": 2, "公民手册": 1 }, output: "法治宝典", reward: { xp: 35, gem: 1 } },
  { id: "t2_brain", tier: 2, name: "认知强化核心", icon: "🧠", need: { "专注模组": 2, "前额叶符文": 1 }, output: "认知强化核心", reward: { xp: 40, gem: 2 } },

  // Tier 3 — 跨科大师作品（高 XP，部分产出中间品供 Tier4）
  { id: "t3_core", tier: 3, name: "全科知识核心", icon: "💠", need: { "文学原稿": 1, "演算核心": 1, "PET词库": 1 }, output: "全科知识核心", reward: { xp: 60, gem: 2 } },
  { id: "t3_world", tier: 3, name: "文明地理典籍", icon: "📚", need: { "文明图鉴": 1, "世界地图": 1, "生态方舟": 1 }, output: "文明地理典籍", reward: { xp: 60, gem: 2 } },
  { id: "t3_mind", tier: 3, name: "智慧融合剂", icon: "✨", need: { "认知强化核心": 1, "法治宝典": 1, "体能补给包": 1 }, output: "智慧融合剂", reward: { xp: 55, gem: 2 } },

  // Tier 4 — 传说珍宝（存 state.artifacts，唯一，不可再作原料）
  { id: "t4_graduate", tier: 4, name: "方块学园毕业礼", icon: "🎓", need: { "语文大师卷": 1, "数学演算引擎": 1, "PET冲刺包": 1 }, artifact: "方块学园毕业礼", reward: { xp: 120, gem: 5 } },
  { id: "t4_compass", tier: 4, name: "探险家指南针", icon: "🧭", need: { "世界地图": 1, "文明图鉴": 1, "认知强化核心": 1 }, artifact: "探险家指南针", reward: { xp: 100, gem: 4 }, effect: "castle_hint" },
  { id: "t4_stone", tier: 4, name: "全科通晓石", icon: "💎", need: { "全科知识核心": 1, "文明地理典籍": 1, "智慧融合剂": 1 }, artifact: "全科通晓石", reward: { xp: 150, gem: 8 } }
];

function baEnsureCraftState() {
  if (!state) return;
  if (!state.artifacts) state.artifacts = {};
  if (!state.discoveredRecipes) state.discoveredRecipes = [];
  if (!state.backpack) state.backpack = {};
}

function pruneBackpack() {
  if (!state?.backpack) return;
  Object.keys(state.backpack).forEach(k => {
    if ((state.backpack[k] || 0) <= 0) delete state.backpack[k];
    else if (state.backpack[k] > BACKPACK_STACK_MAX) state.backpack[k] = BACKPACK_STACK_MAX;
  });
}

function addBackpackItem(name, count) {
  baEnsureCraftState();
  if (!name || count <= 0) return;
  state.backpack[name] = Math.min(BACKPACK_STACK_MAX, (state.backpack[name] || 0) + count);
  pruneBackpack();
}

function craftSlotsMatchRecipe(slots, recipe) {
  const need = { ...recipe.need };
  const have = {};
  slots.filter(Boolean).forEach(s => { have[s] = (have[s] || 0) + 1; });
  let totalNeed = 0;
  for (const [item, cnt] of Object.entries(need)) {
    if ((have[item] || 0) < cnt) return false;
    have[item] -= cnt;
    totalNeed += cnt;
  }
  const filled = slots.filter(Boolean).length;
  return filled === totalNeed && Object.values(have).every(v => v === 0);
}

function findMatchingRecipe(slots) {
  return CRAFT_RECIPES.find(r => craftSlotsMatchRecipe(slots, r));
}

function discoverRecipe(id) {
  baEnsureCraftState();
  if (!state.discoveredRecipes.includes(id)) {
    state.discoveredRecipes.push(id);
  }
}

function baRecipeSubject(recipe) {
  return CRAFT_RECIPE_SUBJECT[recipe.id] || "mixed";
}

function baSetCraftRecipeSubject(subject) {
  baCraftRecipeSubject = subject;
  document.querySelectorAll(".craft-recipe-tab").forEach(b => b.classList.toggle("on", b.dataset.tab === subject));
  baRenderCraftRecipePanel();
}

function baRenderCraftRecipePanel() {
  const panel = document.getElementById("recipe-subject-panel");
  if (!panel || !state) return;
  baEnsureCraftState();

  const subject = baCraftRecipeSubject || "chinese";
  const list = CRAFT_RECIPES.filter(r => baRecipeSubject(r) === subject);
  if (!list.length) {
    panel.innerHTML = '<div style="font-size:11px;color:#888;padding:8px 0">该科目暂无配方</div>';
    return;
  }

  const tiers = [...new Set(list.map(r => r.tier))].sort((a, b) => a - b);
  let html = "";
  tiers.forEach(t => {
    const tierList = list.filter(r => r.tier === t);
    if (!tierList.length) return;
    html += `<div style="font-size:11px;font-weight:700;color:var(--mc-gold);margin:8px 0 4px">${CRAFT_TIER_LABEL[t] || "其他"}</div>`;
    tierList.forEach(r => {
      const known = state.discoveredRecipes.includes(r.id);
      const needStr = Object.entries(r.need).map(([k, v]) => k + "×" + v).join(" + ");
      const outStr = r.artifact ? `→ 🏆 ${r.artifact}` : r.output ? `→ ${r.icon} ${r.output}` : "";
      html += `<div class="recipe-item" style="opacity:${known ? 1 : 0.55}">
        ${known ? r.icon : "❓"} <strong>${r.name}</strong> · ${needStr} ${outStr}
        <span style="color:var(--mc-gold)">+${r.reward.xp}XP${r.reward.gem ? " +" + r.reward.gem + "💎" : ""}</span>
        ${known ? "" : ' <span style="font-size:9px;color:#666">(未解锁)</span>'}
      </div>`;
    });
  });
  panel.innerHTML = html;
}

function renderRecipeBook() {
  const el = document.getElementById("recipe-book");
  if (!el) return;
  if (!state) {
    el.innerHTML = '<p style="font-size:11px;color:#888;padding:8px 0">请先登录后查看配方书</p>';
    return;
  }
  baEnsureCraftState();

  const summary = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px">
    <p style="font-size:10px;color:#888;margin:0;line-height:1.5;flex:1;min-width:200px">
      原料来自探险掉落 → 中间品存<strong>背包</strong> → 珍宝存<strong>珍宝阁</strong>（唯一永久）<br>
      已解锁 ${state.discoveredRecipes.length}/${CRAFT_RECIPES.length} 条配方 · 切换下方科目查看对应模块
    </p>
    <button type="button" class="pixel-btn primary" style="flex-shrink:0;font-size:11px;padding:8px 10px" onclick="baOpenRecipeEncyclopedia()">📚 配方宝典</button>
  </div>`;
  const tabs = CRAFT_SUBJECT_TABS.map(t =>
    `<button type="button" class="craft-recipe-tab${baCraftRecipeSubject === t.id ? " on" : ""}" data-tab="${t.id}" onclick="baSetCraftRecipeSubject('${t.id}')">${t.label}</button>`
  ).join("");
  el.innerHTML = `${summary}<div class="craft-recipe-tabs">${tabs}</div><div id="recipe-subject-panel"></div>`;
  baRenderCraftRecipePanel();
}

function renderArtifactsPanel() {
  const el = document.getElementById("artifact-list");
  if (!el || !state) return;
  baEnsureCraftState();
  const arts = Object.entries(state.artifacts || {});
  if (!arts.length) {
    el.innerHTML = '<div style="font-size:11px;color:#888">暂无珍宝，完成 Tier4 配方可获得永久收藏</div>';
    return;
  }
  el.innerHTML = arts.map(([name, info]) =>
    `<div class="recipe-item">${info.icon || "🏆"} <strong>${name}</strong> <span style="font-size:10px;color:#888">${info.date || ""}</span></div>`
  ).join("");
}

function applyArtifactEffect(recipe) {
  if (!recipe.effect) return;
  if (recipe.effect === "castle_hint") state.castleUnlocked = true;
}

function baDoCraft() {
  baEnsureCraftState();
  const filled = craftSlots.filter(Boolean);
  if (filled.length < 3) { showToast("请放入3个方块"); return; }
  const r = findMatchingRecipe(craftSlots);
  if (!r) { showToast("没有匹配的配方"); return; }
  if (r.artifact && state.artifacts[r.artifact]) { showToast("该珍宝已拥有，不可重复合成"); return; }

  craftSlots.forEach(s => { if (s) state.backpack[s] = (state.backpack[s] || 0) - 1; });
  pruneBackpack();

  if (r.output) addBackpackItem(r.output, 1);
  if (r.artifact) {
    state.artifacts[r.artifact] = { icon: r.icon, date: new Date().toLocaleDateString("zh-CN"), recipeId: r.id };
    applyArtifactEffect(r);
  }

  state.user.xp = (state.user.xp || 0) + (r.reward.xp || 0);
  state.user.gem = (state.user.gem || 0) + (r.reward.gem || 0);
  discoverRecipe(r.id);
  if (typeof baLogCollection === "function") {
    if (r.artifact) {
      baLogCollection({ type: "artifact", id: r.id, name: r.artifact, icon: r.icon, tier: 4, desc: "传说珍宝" });
    } else if (r.output) {
      baLogCollection({ type: "craft", id: r.id, name: r.output, icon: r.icon, tier: r.tier, desc: r.name });
    }
  }
  recordActivity("craft", { label: "合成：" + r.name, xp: r.reward.xp, gem: r.reward.gem, type: "craft" });

  save();
  updateHud();
  showToast(`合成成功！${r.name} +${r.reward.xp}XP`);
  if (typeof baAudioPlaySfx === "function") baAudioPlaySfx("craft");
  craftSlots = [null, null, null];
  renderCraft();
  baCheckCraftPreview();
  renderRecipeBook();
  renderArtifactsPanel();
  if (typeof renderCollection === "function" && document.getElementById("scr-collection")?.classList.contains("on")) renderCollection();
}

function baCheckCraftPreview() {
  const result = document.getElementById("craft-result");
  const info = document.getElementById("craft-info");
  if (!result || !info) return;
  const filled = craftSlots.filter(Boolean);
  if (filled.length < 3) {
    result.textContent = "?";
    result.style.background = "";
    info.textContent = "放入3个方块尝试合成";
    return;
  }
  const r = findMatchingRecipe(craftSlots);
  if (r) {
    result.textContent = r.icon;
    result.style.background = "rgba(78,154,6,.2)";
    const out = r.artifact ? `🏆 ${r.artifact}` : r.output || r.name;
    info.innerHTML = `可合成 <strong>${r.name}</strong> → ${out} <span style="color:var(--mc-gold)">+${r.reward.xp}XP</span>`;
  } else {
    result.textContent = "❌";
    result.style.background = "rgba(204,0,0,.2)";
    info.textContent = "没有匹配的配方";
  }
}

function baMigrateCraft() {
  if (!state) return;
  baEnsureCraftState();
  if (state.discoveredRecipes.length === 0) {
    state.discoveredRecipes = CRAFT_RECIPES.filter(r => r.tier <= 1).map(r => r.id);
  }
}

// ========== 配方宝典 · 获取途径与合成链查询 ==========

function baItemIcon(name) {
  return typeof getItemIcon === "function" ? getItemIcon(name) : "📦";
}

function baBuildItemCatalog() {
  const catalog = new Map();
  const ensure = name => {
    if (!catalog.has(name)) catalog.set(name, { name, drops: [], produces: [], uses: [] });
    return catalog.get(name);
  };

  Object.entries(BA_DROP_POOLS).forEach(([type, info]) => {
    info.items.forEach(item => {
      ensure(item).drops.push({ type, label: info.label, biome: info.biome });
    });
  });

  CRAFT_RECIPES.forEach(r => {
    const out = r.output || r.artifact;
    if (out) ensure(out).produces.push(r);
    Object.keys(r.need).forEach(need => ensure(need).uses.push(r));
  });

  return catalog;
}

function baFormatItemSources(entry) {
  const lines = [];
  if (entry.drops.length) {
    const byBiome = {};
    entry.drops.forEach(d => {
      if (!byBiome[d.label]) byBiome[d.label] = d;
    });
    Object.values(byBiome).forEach(d => {
      lines.push(`完成「${d.label}」挑战随机掉落（每次约 50% 概率获得 1 件）`);
    });
  }
  if (entry.produces.length) {
    entry.produces.forEach(r => {
      const needStr = Object.entries(r.need).map(([k, v]) => `${k}×${v}`).join(" + ");
      lines.push(`合成「${r.name}」：${needStr}`);
    });
  }
  if (!lines.length) lines.push("暂无获取途径（请完成更多探险）");
  return lines;
}

function baFormatItemUsages(entry) {
  if (!entry.uses.length) return ["暂无合成用途（或为终级产物）"];
  return entry.uses.map(r => {
    const out = r.artifact ? `🏆 ${r.artifact}` : `${r.icon} ${r.output}`;
    const needStr = Object.entries(r.need).map(([k, v]) => `${k}×${v}`).join(" + ");
    return `→ ${r.name}（${CRAFT_TIER_LABEL[r.tier]}）：${needStr} → ${out}`;
  });
}

function baRecipeMaterialHints(recipe) {
  return Object.keys(recipe.need).map(item => {
    const cat = baBuildItemCatalog().get(item);
    if (!cat) return `${item}：未知来源`;
    const src = baFormatItemSources(cat)[0] || "未知来源";
    return `${baItemIcon(item)} ${item} ← ${src}`;
  });
}

function baSetEncyclopediaTab(tab) {
  baEncyclopediaTab = tab;
  document.querySelectorAll("#modal-body .craft-recipe-tab[data-ency-tab]").forEach(b => {
    b.classList.toggle("on", b.dataset.encyTab === tab);
  });
  baRenderRecipeEncyclopediaBody();
}

function baFilterEncyclopedia(q) {
  baEncyclopediaQuery = (q || "").trim().toLowerCase();
  baRenderRecipeEncyclopediaBody();
}

function baRenderRecipeEncyclopediaBody() {
  const body = document.getElementById("recipe-ency-body");
  if (!body) return;
  const q = baEncyclopediaQuery;
  const tab = baEncyclopediaTab || "item";

  if (tab === "drop") {
    let html = "";
    Object.entries(BA_DROP_POOLS).forEach(([type, info]) => {
      if (q && !info.label.includes(q) && !info.items.some(i => i.includes(q))) return;
      html += `<div style="margin-bottom:12px;padding:10px;background:#0f1b2e;border-radius:6px">
        <div style="font-weight:700;color:var(--mc-gold);margin-bottom:6px">${info.label}</div>
        <div style="font-size:11px;color:#888;margin-bottom:6px">地图 → ${info.label} → 完成任意节点挑战</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${info.items.map(it =>
          `<span style="font-size:11px;padding:4px 8px;background:rgba(0,0,0,.25);border-radius:4px">${baItemIcon(it)} ${it}</span>`
        ).join("")}</div>
      </div>`;
    });
    body.innerHTML = html || '<div style="font-size:12px;color:#888;padding:8px 0">未找到匹配的掉落区域</div>';
    return;
  }

  if (tab === "recipe") {
    let html = "";
    CRAFT_RECIPES.forEach(r => {
      const subj = CRAFT_SUBJECT_TABS.find(t => t.id === baRecipeSubject(r))?.label || "综合";
      const hay = (r.name + subj + Object.keys(r.need).join("") + (r.output || r.artifact || "")).toLowerCase();
      if (q && !hay.includes(q)) return;
      const known = state?.discoveredRecipes?.includes(r.id);
      const needStr = Object.entries(r.need).map(([k, v]) => `${k}×${v}`).join(" + ");
      const out = r.artifact ? `🏆 ${r.artifact}（珍宝阁）` : `${r.icon} ${r.output}（背包）`;
      const hints = baRecipeMaterialHints(r).map(h =>
        `<div style="font-size:10px;color:#aaa;padding-left:8px;margin-top:2px">· ${h}</div>`
      ).join("");
      html += `<div class="recipe-item" style="flex-direction:column;align-items:flex-start;opacity:${known ? 1 : 0.85}">
        <div style="width:100%">${known ? r.icon : "❓"} <strong>${r.name}</strong> <span style="font-size:10px;color:#666">${subj} · ${CRAFT_TIER_LABEL[r.tier]}</span></div>
        <div style="font-size:11px;color:#ccc;margin-top:4px">需要：${needStr}</div>
        <div style="font-size:11px;color:var(--mc-green);margin-top:2px">产出：${out} · +${r.reward.xp}XP${r.reward.gem ? " +" + r.reward.gem + "💎" : ""}</div>
        ${hints}
      </div>`;
    });
    body.innerHTML = html || '<div style="font-size:12px;color:#888;padding:8px 0">未找到匹配的配方</div>';
    return;
  }

  const catalog = baBuildItemCatalog();
  const sorted = [...catalog.values()].sort((a, b) => {
    const tierA = a.produces[0]?.tier || (a.drops.length ? 0 : 9);
    const tierB = b.produces[0]?.tier || (b.drops.length ? 0 : 9);
    return tierA - tierB || a.name.localeCompare(b.name, "zh-CN");
  });

  let html = "";
  sorted.forEach(entry => {
    const hay = (entry.name + entry.drops.map(d => d.label).join("") + entry.uses.map(u => u.name).join("")).toLowerCase();
    if (q && !hay.includes(q)) return;
    const owned = state?.backpack?.[entry.name] || 0;
    const isArtifact = state?.artifacts?.[entry.name];
    const srcLines = baFormatItemSources(entry).map(s => `<div style="font-size:10px;color:#aaa">· ${s}</div>`).join("");
    const useLines = baFormatItemUsages(entry).map(s => `<div style="font-size:10px;color:#aaa">· ${s}</div>`).join("");
    html += `<div class="recipe-item" style="flex-direction:column;align-items:flex-start">
      <div style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px">
        <strong>${baItemIcon(entry.name)} ${entry.name}</strong>
        <span style="font-size:10px;color:var(--mc-gold)">${isArtifact ? "已收藏珍宝" : owned ? "背包×" + owned : entry.drops.length ? "可掉落" : "合成物"}</span>
      </div>
      <div style="font-size:10px;color:var(--mc-water);margin-top:6px;font-weight:700">获取途径</div>${srcLines}
      <div style="font-size:10px;color:var(--mc-gold);margin-top:6px;font-weight:700">合成用途</div>${useLines}
    </div>`;
  });
  body.innerHTML = html || '<div style="font-size:12px;color:#888;padding:8px 0">未找到匹配的物品</div>';
}

function baOpenRecipeEncyclopedia() {
  if (!state) { showToast("请先登录"); return; }
  baEnsureCraftState();
  baEncyclopediaTab = baEncyclopediaTab || "item";
  baEncyclopediaQuery = "";

  const tabs = BA_ENCYCLOPEDIA_TABS.map(t =>
    `<button type="button" class="craft-recipe-tab${baEncyclopediaTab === t.id ? " on" : ""}" data-ency-tab="${t.id}" onclick="baSetEncyclopediaTab('${t.id}')">${t.label}</button>`
  ).join("");

  const body = `<div style="font-size:11px;color:#888;margin-bottom:10px;line-height:1.5">
    查询素材<strong>从哪里掉落</strong>、中间品<strong>如何合成</strong>，以及各配方的完整材料链。
  </div>
  <input id="recipe-ency-search" class="game-answer" placeholder="搜索物品、配方或群系…" style="width:100%;margin-bottom:10px;font-size:12px"
    oninput="baFilterEncyclopedia(this.value)" value="">
  <div class="craft-recipe-tabs" style="margin-bottom:10px">${tabs}</div>
  <div id="recipe-ency-body" style="max-height:50vh;overflow-y:auto"></div>
  <button class="pixel-btn" style="width:100%;margin-top:12px" onclick="closeModal()">关闭</button>`;

  if (typeof showModal === "function") showModal("📚 配方宝典", body);
  baRenderRecipeEncyclopediaBody();
}
