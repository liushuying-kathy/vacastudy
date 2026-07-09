// BlockAcademy 背书训练营：古诗词 / 日积月累 / 易错字 / 全文默写
const BA_RECITE_DAILY = 10;

const CHINESE_POETRY_BANK = [
  { title: "四时田园杂兴（其二十五）", author: "范成大", dynasty: "宋", lines: ["梅子金黄杏子肥", "麦花雪白菜花稀", "日长篱落无人过", "惟有蜻蜓蛱蝶飞"], keyChars: ["肥", "稀", "篱", "蜻蜓", "蛱蝶"], unit: 1 },
  { title: "宿新市徐公店", author: "杨万里", dynasty: "宋", lines: ["篱落疏疏一径深", "树头新绿未成阴", "儿童急走追黄蝶", "飞入菜花无处寻"], keyChars: ["疏", "径", "阴", "追", "寻"], unit: 1 },
  { title: "清平乐·村居", author: "辛弃疾", dynasty: "宋", lines: ["茅檐低小", "溪上青青草", "醉里吴音相媚好", "白发谁家翁媪", "大儿锄豆溪东", "中儿正织鸡笼", "最喜小儿亡赖", "溪头卧剥莲蓬"], keyChars: ["檐", "媚", "媪", "锄", "赖", "剥", "莲蓬"], unit: 1 },
  { title: "芙蓉楼送辛渐", author: "王昌龄", dynasty: "唐", lines: ["寒雨连江夜入吴", "平明送客楚山孤", "洛阳亲友如相问", "一片冰心在玉壶"], keyChars: ["吴", "孤", "洛", "壶"], unit: 5 },
  { title: "塞下曲", author: "卢纶", dynasty: "唐", lines: ["月黑雁飞高", "单于夜遁逃", "欲将轻骑逐", "大雪满弓刀"], keyChars: ["雁", "遁", "逐", "骑"], unit: 5 },
  { title: "墨梅", author: "王冕", dynasty: "元", lines: ["吾家洗砚池头树", "朵朵花开淡墨痕", "不要人夸好颜色", "只留清气满乾坤"], keyChars: ["砚", "痕", "乾", "坤"], unit: 5 }
];

const CHINESE_ACCUM_BANK = [
  { content: "风雨送春归，飞雪迎春到。已是悬崖百丈冰，犹有花枝俏。", source: "卜算子·咏梅", author: "毛泽东", unit: 1 },
  { content: "黄师塔前江水东，春光懒困倚微风。桃花一簇开无主，可爱深红爱浅红？", source: "江畔独步寻花", author: "杜甫", unit: 2 },
  { content: "诗是人类向未来寄发的信息，诗给人类以朝向理想的勇气。", source: "关于诗歌的名言", author: "艾青", unit: 3 },
  { content: "诗和音乐一样，生命全在节奏。", source: "关于诗歌的名言", author: "朱光潜", unit: 3 },
  { content: "不论平地与山尖，无限风光尽被占。采得百花成蜜后，为谁辛苦为谁甜？", source: "蜂", author: "罗隐", unit: 4 },
  { content: "少年不知勤学苦，老来方知读书迟。", source: "日积月累", author: "", unit: 5 },
  { content: "一日读书一日功，一日不读十日空。", source: "日积月累", author: "", unit: 5 },
  { content: "学习不怕根底浅，只要迈步总不迟。", source: "日积月累", author: "", unit: 5 },
  { content: "书山有路勤为径，学海无涯苦作舟。", source: "日积月累", author: "韩愈", unit: 5 },
  { content: "天行健，君子以自强不息。", source: "周易", author: "", unit: 6 },
  { content: "胜人者有力，自胜者强。", source: "老子", author: "", unit: 6 },
  { content: "生于忧患而死于安乐。", source: "孟子", author: "", unit: 6 }
];

const BA_RECITE_TABS = [
  { id: "poem-next", label: "📜 上下句", desc: "根据上一句默写下一句（四下必背古诗）", count: BA_RECITE_DAILY },
  { id: "poem-fill", label: "✏️ 易错字", desc: "补全诗句中的易错字", count: BA_RECITE_DAILY },
  { id: "poem-full", label: "📖 全文", desc: "默写整首古诗（四句）", count: 5 },
  { id: "accum", label: "🌟 日积月累", desc: "名言警句、古诗词名句补全", count: BA_RECITE_DAILY }
];

let baReciteTab = "poem-next";
let baReciteMode = "";
let baReciteQuestions = [];
let baReciteIndex = 0;
let baReciteScore = 0;
let baReciteTimer = null;
let baReciteTime = 0;
let baReciteAnswered = false;

function baReciteRand(n, max) {
  return Math.floor(Math.random() * (max || n));
}

function baGenReciteQuestions(mode) {
  const qs = [];
  const guardMax = 200;
  let guard = 0;
  const want = mode === "poem-full" ? 5 : BA_RECITE_DAILY;

  while (qs.length < want && guard < guardMax) {
    guard++;
    let q = null;
    if (mode === "poem-next") {
      const poem = CHINESE_POETRY_BANK[baReciteRand(CHINESE_POETRY_BANK.length)];
      const lineIdx = baReciteRand(Math.max(1, poem.lines.length - 1));
      q = {
        type: "fill",
        q: `《${poem.title}》${poem.author}\n${poem.lines[lineIdx]}，\n______。`,
        a: poem.lines[lineIdx + 1],
        meta: `${poem.author}《${poem.title}》`
      };
    } else if (mode === "poem-fill") {
      const poem = CHINESE_POETRY_BANK[baReciteRand(CHINESE_POETRY_BANK.length)];
      const chars = poem.keyChars && poem.keyChars.length ? poem.keyChars : [poem.lines[0].slice(-1)];
      const keyChar = chars[baReciteRand(chars.length)];
      const line = poem.lines.find(l => l.includes(keyChar)) || poem.lines[0];
      q = {
        type: "fill",
        q: `补全易错字（《${poem.title}》）：\n${line.replace(keyChar, "（   ）")}`,
        a: keyChar,
        meta: poem.author + "《" + poem.title + "》"
      };
    } else if (mode === "poem-full") {
      const poem = CHINESE_POETRY_BANK[baReciteRand(CHINESE_POETRY_BANK.length)];
      const lines = poem.lines.slice(0, 4);
      q = {
        type: "fill",
        q: `默写古诗《${poem.title}》（${poem.author}）\n` + lines.map((l, i) => `第${i + 1}句：______`).join("\n"),
        blanks: lines,
        a: lines.join("，"),
        meta: poem.author + "《" + poem.title + "》"
      };
    } else if (mode === "accum") {
      const item = CHINESE_ACCUM_BANK[baReciteRand(CHINESE_ACCUM_BANK.length)];
      const content = item.content;
      const maskLen = Math.min(8, Math.max(4, Math.floor(content.length * 0.35)));
      const masked = content.slice(0, content.length - maskLen) + "______";
      q = {
        type: "fill",
        q: `把下面内容补充完整：\n"${masked}"`,
        a: content.slice(content.length - maskLen),
        meta: (item.author ? item.author + " " : "") + "《" + item.source + "》"
      };
    }
    if (!q) continue;
    const key = q.q.slice(0, 40) + "|" + q.a;
    if (qs.some(x => (x.q.slice(0, 40) + "|" + x.a) === key)) continue;
    qs.push(q);
  }
  return qs;
}

function baSetReciteTab(tab) {
  baReciteTab = tab;
  document.querySelectorAll(".recite-tab").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  baRenderReciteTabPanel();
}

function baRenderReciteTabPanel() {
  const panel = document.getElementById("recite-tab-panel");
  if (!panel) return;
  const tab = BA_RECITE_TABS.find(t => t.id === baReciteTab) || BA_RECITE_TABS[0];
  panel.innerHTML = `
    <div style="font-size:12px;color:#aaa;line-height:1.6;margin-bottom:10px">${tab.desc}</div>
    <button class="pixel-btn primary" onclick="baStartRecite('${tab.id}')">开始 ${tab.count} 题</button>
  `;
}

function renderReciteMenu() {
  const tabsEl = document.getElementById("recite-tabs");
  const menuEl = document.getElementById("recite-menu");
  const areaEl = document.getElementById("recite-area");
  if (!tabsEl || !menuEl) return;

  tabsEl.innerHTML = BA_RECITE_TABS.map(t =>
    `<button class="recite-tab${baReciteTab === t.id ? " on" : ""}" data-tab="${t.id}" onclick="baSetReciteTab('${t.id}')">${t.label}</button>`
  ).join("");

  menuEl.style.display = "block";
  menuEl.innerHTML = '<div id="recite-tab-panel"></div>';
  if (areaEl) areaEl.innerHTML = "";
  baRenderReciteTabPanel();

  const today = typeof baTodayKey === "function" ? baTodayKey() : new Date().toLocaleDateString("zh-CN");
  if (state && state.reciteDone) {
    const done = Object.entries(state.reciteDone).filter(([k]) => k.startsWith(today + "|"));
    if (done.length) {
      const summary = document.createElement("div");
      summary.style.cssText = "font-size:11px;color:var(--mc-green);margin-top:8px";
      summary.textContent = "今日已完成：" + done.map(([k, v]) => k.split("|")[1] + " " + v.score + "/" + v.total).join(" · ");
      menuEl.appendChild(summary);
    }
  }
}

function baStartRecite(mode) {
  baReciteMode = mode;
  baReciteIndex = 0;
  baReciteScore = 0;
  baReciteAnswered = false;
  baReciteQuestions = baGenReciteQuestions(mode);
  if (!baReciteQuestions.length) {
    if (typeof showToast === "function") showToast("暂无题目，请刷新");
    return;
  }
  clearInterval(baReciteTimer);
  const menuEl = document.getElementById("recite-menu");
  if (menuEl) menuEl.style.display = "none";
  baReciteRender();
}

function baReciteRefresh() {
  baReciteIndex = 0;
  baReciteScore = 0;
  baReciteAnswered = false;
  clearInterval(baReciteTimer);
  baReciteQuestions = baGenReciteQuestions(baReciteMode);
  baReciteRender();
}

function baReciteRender() {
  const area = document.getElementById("recite-area");
  if (!area) return;
  if (baReciteIndex >= baReciteQuestions.length) {
    baReciteFinish();
    return;
  }
  const q = baReciteQuestions[baReciteIndex];
  baReciteAnswered = false;
  baReciteTime = 0;
  clearInterval(baReciteTimer);
  baReciteTimer = setInterval(() => {
    baReciteTime++;
    const e = document.getElementById("ba-recite-timer");
    if (e) e.textContent = baReciteTime + "s";
  }, 1000);

  const total = baReciteQuestions.length;
  let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;color:#888">
    <span>${baReciteIndex + 1}/${total}</span>
    <span>⏱ <span id="ba-recite-timer">0s</span></span>
  </div>
  <div class="rank-bar" style="margin-bottom:12px"><div style="width:${((baReciteIndex + 1) / total) * 100}%;height:100%;background:var(--mc-gold);border-radius:4px"></div></div>`;

  if (q.meta) h += `<div style="font-size:10px;color:#888;margin-bottom:8px">${q.meta}</div>`;
  h += `<div style="font-size:15px;font-weight:700;margin-bottom:12px;line-height:1.8">`;
  const spec = typeof baGetFillSpec === "function" ? baGetFillSpec(q) : { blankCount: 1, answers: [q.a] };
  if (spec.blankCount > 1 && typeof baRenderFillInputs === "function") {
    const fillUi = baRenderFillInputs(spec, "recite", q.q);
    h += fillUi.inline ? fillUi.html : `${baEscapeHtml(q.q).replace(/\n/g, "<br>")}</div>${fillUi.html}`;
    if (fillUi.inline) h += `</div>`;
    h += `<div style="font-size:11px;color:#888;margin-bottom:8px">请逐空填写，无需用逗号分隔</div>`;
  } else {
    h += `${q.q}</div>`;
    h += `<input id="ba-recite-input" class="game-answer" placeholder="手写答案…" style="width:100%;margin-bottom:8px" onkeydown="if(event.key==='Enter')baReciteSubmit()">`;
  }
  h += `<div style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="pixel-btn primary" onclick="baReciteSubmit()">确认</button>
    <button class="pixel-btn" onclick="baReciteRefresh()">换一批</button>
    <button class="pixel-btn" onclick="baReciteExit()">返回栏目</button>
  </div>
  <div id="ba-recite-feedback" style="margin-top:8px;font-size:13px"></div>`;
  area.innerHTML = h;
  const focusEl = document.getElementById("recite-0") || document.getElementById("ba-recite-input");
  if (focusEl) focusEl.focus();
}

function baReciteNorm(s) {
  return String(s || "").trim()
    .replace(/\s+/g, "")
    .replace(/，/g, ",")
    .replace(/。/g, "")
    .replace(/；/g, ";")
    .replace(/！/g, "")
    .replace(/？/g, "");
}

function baReciteSubmit() {
  if (baReciteAnswered) return;
  const q = baReciteQuestions[baReciteIndex];
  baReciteAnswered = true;
  clearInterval(baReciteTimer);

  const spec = typeof baGetFillSpec === "function" ? baGetFillSpec(q) : { blankCount: 1, answers: [q.a] };
  let val = document.getElementById("ba-recite-input")?.value || "";
  if (spec.blankCount > 1 && typeof baCollectFillInputs === "function") {
    val = baCollectFillInputs("recite", spec.blankCount);
    if (val.some(v => !v)) {
      baReciteAnswered = false;
      if (typeof showToast === "function") showToast("请填写所有空格");
      return;
    }
  } else {
    val = String(val).trim();
    if (!val) {
      baReciteAnswered = false;
      if (typeof showToast === "function") showToast("请输入答案");
      return;
    }
  }

  let ok = false;
  if (spec.blankCount > 1 && typeof baCmpFillAnswers === "function") {
    ok = baCmpFillAnswers(Array.isArray(val) ? val : [val], spec.answers, q);
  } else if (q.open) {
    ok = baReciteNorm(val).includes(baReciteNorm(q.a).slice(0, 8)) || baReciteNorm(q.a).includes(baReciteNorm(val).slice(0, 8));
  } else {
    ok = baReciteNorm(val) === baReciteNorm(q.a) || baReciteNorm(val).includes(baReciteNorm(q.a));
  }

  const displayAns = spec.blankCount > 1 ? spec.answers.join(" · ") : q.a;
  const userDisplay = Array.isArray(val) ? val.join(" · ") : val;

  if (ok) baReciteScore++;
  else if (typeof addToWrongBook === "function") {
    addToWrongBook({ q: q.q, a: displayAns, open: true, category: "背书" }, userDisplay, { source: "recite", subject: "chinese", nodeId: "ch-poem" });
  }

  const fb = document.getElementById("ba-recite-feedback");
  if (fb) {
    fb.innerHTML = ok
      ? `<span style="color:var(--mc-green)">✅ 正确！</span>`
      : `<span style="color:var(--mc-red)">❌ 正确答案：${displayAns}</span>${q.meta ? `<div style="color:#888;font-size:11px;margin-top:4px">${q.meta}</div>` : ""}`;
  }
  setTimeout(() => {
    baReciteIndex++;
    baReciteRender();
  }, ok ? 600 : 1200);
}

function baReciteFinish() {
  clearInterval(baReciteTimer);
  const area = document.getElementById("recite-area");
  const menuEl = document.getElementById("recite-menu");
  const total = baReciteQuestions.length;
  const labels = { "poem-next": "上下句", "poem-fill": "易错字", "poem-full": "全文", accum: "日积月累" };
  const label = labels[baReciteMode] || "背书";
  const today = typeof baTodayKey === "function" ? baTodayKey() : new Date().toLocaleDateString("zh-CN");

  if (state) {
    if (!state.reciteDone) state.reciteDone = {};
    state.reciteDone[today + "|" + baReciteMode] = { score: baReciteScore, total, time: baReciteTime };
    const xp = baReciteScore === total ? 25 : baReciteScore >= Math.floor(total * 0.8) ? 18 : 12;
    state.user.xp = (state.user.xp || 0) + xp;
    if (baReciteScore === total) state.user.gem = (state.user.gem || 0) + 1;
    if (typeof recordActivity === "function") {
      recordActivity("chinese", {
        label: "背书·" + label,
        correct: baReciteScore,
        total,
        xp,
        gem: baReciteScore === total ? 1 : 0,
        nodeId: "ch-poem",
        learnMin: 10
      });
    }
    if (typeof markDailyPlanDone === "function" && baReciteScore >= Math.floor(total * 0.6)) {
      markDailyPlanDone("chinese");
    }
    if (typeof baTrackLearning === "function") {
      baTrackLearning("chinese", { correct: baReciteScore, total, nodeId: "ch-poem", learnMin: 10 });
    }
    if (typeof checkCustomQuests === "function") {
      checkCustomQuests("chinese", { nodeId: "ch-poem", correct: baReciteScore, total, label: "背书·" + label });
    }
    if (typeof save === "function") save();
    if (typeof updateHud === "function") updateHud();
    if (area) {
      area.innerHTML = `<div style="text-align:center;padding:16px">
        <div style="font-size:48px;margin-bottom:8px">${baReciteScore >= Math.floor(total * 0.8) ? "🎉" : "💪"}</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:6px">${label} 完成！</div>
        <div style="margin-bottom:8px">${baReciteScore}/${total}</div>
        <div style="color:var(--mc-gold);font-weight:700;margin-bottom:12px">+${xp} XP${baReciteScore === total ? " +1 💎" : ""}</div>
        <button class="pixel-btn primary" onclick="baReciteExit()">返回栏目</button>
      </div>`;
    }
    if (typeof showToast === "function") showToast("背书完成 +" + xp + " XP");
  }
  if (menuEl) menuEl.style.display = "block";
  renderReciteMenu();
}

function baReciteExit() {
  clearInterval(baReciteTimer);
  baReciteMode = "";
  baReciteQuestions = [];
  const area = document.getElementById("recite-area");
  if (area) area.innerHTML = "";
  renderReciteMenu();
}

function baMigrateRecite() {
  if (!state) return;
  if (!state.reciteDone) state.reciteDone = {};
}
