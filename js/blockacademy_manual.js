// BlockAcademy 内置使用说明书（底部导航「说明」）
let baManualTab = "start";

const BA_MANUAL_SECTIONS = [
  {
    id: "start",
    label: "🚀 入门",
    goto: "scr-map",
    gotoLabel: "进入探险地图",
    html: `<h4 class="manual-h">快速开始</h4>
<ul class="manual-ul">
  <li><strong>注册/登录</strong>：输入名字+密码创建角色，进度保存在本机浏览器。</li>
  <li><strong>游客体验</strong>：可快速试玩，刷新页面后数据会丢失。</li>
  <li><strong>精力值</strong>：上限 20 点（HUD 显示 <code>18/20</code> 进度条），每次群系挑战 -1；每 2 分钟自动 +1。</li>
  <li><strong>HUD 按钮</strong>：💎商店、📚收藏、导出/导入存档、退出、重置。</li>
</ul>
<p class="manual-tip">💡 换机或更新程序前，请先点 HUD「导出」保存 JSON 备份。</p>`
  },
  {
    id: "map",
    label: "🗺 探险",
    goto: "scr-map",
    gotoLabel: "打开地图",
    html: `<h4 class="manual-h">群系挑战怎么用</h4>
<ul class="manual-ul">
  <li>地图 → 点群系格子 → 选节点 → 开始挑战。</li>
  <li><strong>语文森林 / 数学沙漠 / 英语海洋</strong>：主科 + PET 词汇节点。</li>
  <li><strong>史地生道法</strong>：拓展科目；<strong>体育山地</strong>需家长确认码打卡。</li>
  <li><strong>脑科学神殿</strong>：斯特鲁普、神经过山车、记忆水晶、变形符文、追踪之眼、心算风暴、双轨隧道。</li>
  <li><strong>知识村庄</strong>：进入合成台；<strong>月末城堡</strong>为 Boss 综合挑战。</li>
</ul>
<p class="manual-tip">答完结算 XP 与宝石；全对 30XP+3💎，≥80% 为 20XP+2💎。</p>`
  },
  {
    id: "backpack",
    label: "🎒 背包",
    goto: "scr-backpack",
    gotoLabel: "打开背包",
    html: `<h4 class="manual-h">背包与素材</h4>
<ul class="manual-ul">
  <li>完成群系挑战会掉落<strong>合成素材</strong>（如语文素材、神经突触等）。</li>
  <li>背包只显示<strong>探险素材</strong>，用于合成台放入 3 格。</li>
  <li>合成产出的作品、传说珍宝请到「📚 我的收藏」查看。</li>
</ul>`
  },
  {
    id: "settings",
    label: "⚙️ 设置",
    goto: "scr-settings",
    gotoLabel: "打开设置",
    html: `<h4 class="manual-h">音乐与音效</h4>
<ul class="manual-ul">
  <li>HUD 右上角「⚙️ 设置」→ 背景音乐开关、音量、曲目选择。</li>
  <li>内置 3 首 <strong>CC0 原创 8-bit</strong> 曲（非任天堂原曲），可导入本地 MP3/OGG/WAV（仅存本机）。</li>
  <li>音效默认<strong>关闭</strong>，需在设置中手动开启；答对、答错、升级、挑战完成、宝石、合成等短提示音，可单独调音量或随时关闭。</li>
</ul>`
  },
  {
    id: "craft",
    label: "⚒ 合成",
    goto: "scr-craft",
    gotoLabel: "打开合成台",
    html: `<h4 class="manual-h">合成与收藏</h4>
<ul class="manual-ul">
  <li>底部「合成」或地图「知识村庄」→ 背包选素材放入 3 格 → 点合成。</li>
  <li><strong>配方书</strong>：按科目切换，查看 Tier1–4 合成链与所需素材。</li>
  <li><strong>配方宝典</strong>：配方书右上角入口，按物品/配方/掉落地图查询获取途径与合成链。</li>
  <li><strong>我的收藏</strong>（HUD 或背包底部）：陈列合成作品、传说珍宝、商店权益。</li>
  <li>Tier4 珍宝为永久收藏，不可重复合成。</li>
</ul>`
  },
  {
    id: "plan",
    label: "📋 计划",
    goto: "scr-plan",
    gotoLabel: "打开计划",
    html: `<h4 class="manual-h">今日计划与生活记录</h4>
<ul class="manual-ul">
  <li>每天自动生成计划：语数英必做 + 随机脑力/运动/生活等项。</li>
  <li>点击计划项会<strong>跳转到对应模块</strong>，完成挑战/记录后才 ✅。</li>
  <li><strong>生活记录</strong>：时政、劳动、阅读、社会实践（计划页入口）。</li>
  <li><strong>错题本</strong>：答错自动收录；「错题重练」不耗精力。</li>
  <li><strong>我的任务</strong>：自建学习契约，达成后领取 XP/宝石。</li>
  <li><strong>自选学科计划</strong>：设目标与时长（最低 30 分钟），达标自动完成。</li>
  <li><strong>专注奖励</strong>：当日学习满 60 分钟可玩小游戏领休闲币。</li>
</ul>`
  },
  {
    id: "basic",
    label: "🏋 训练",
    goto: "scr-basic",
    gotoLabel: "打开训练营",
    html: `<h4 class="manual-h">基础训练营 & 背书</h4>
<ul class="manual-ul">
  <li><strong>口算 / 拼音 / 单位 / 阅读</strong>：每日约 30 题，错题进错题本。</li>
  <li><strong>📜 背书训练营</strong>：上下句、易错字、全文、日积月累四栏目。</li>
  <li>填空题多空位会<strong>分别提供输入框</strong>，无需用逗号分隔答案。</li>
  <li>完成计入基础训练类每日计划，获得 XP。</li>
</ul>`
  },
  {
    id: "archive",
    label: "🏆 成就",
    goto: "scr-archive",
    gotoLabel: "打开成就",
    html: `<h4 class="manual-h">成就与统计</h4>
<ul class="manual-ul">
  <li>查看段位、各科挑战次数、连续打卡天数。</li>
  <li><strong>学习流水</strong>：最近挑战与活动记录。</li>
  <li><strong>记录汇总</strong>：生活日志、错题、任务等一站式说明。</li>
  <li>可导出 HTML 周报 / 综合记录；完整进度用 HUD「导出」JSON。</li>
  <li><strong>家长确认码</strong>：默认 1234，可在成就页修改（4–8 位）。</li>
</ul>`
  },
  {
    id: "import",
    label: "🏭 题库",
    goto: "scr-import",
    gotoLabel: "打开题库工坊",
    html: `<h4 class="manual-h">题库工坊</h4>
<ul class="manual-ul">
  <li>粘贴或上传 .txt / .docx 题目，智能解析选择题与填空题。</li>
  <li>可选科目并<strong>绑定挑战节点</strong>，导入后进入该节点题池。</li>
  <li>自定义题库随完整存档 JSON 一并导出/导入。</li>
</ul>`
  },
  {
    id: "skill",
    label: "🌳 技能",
    goto: "scr-kgmap",
    gotoLabel: "打开技能树",
    html: `<h4 class="manual-h">知识图谱与卡片</h4>
<ul class="manual-ul">
  <li><strong>技能</strong>：按科目/章节浏览知识点掌握度。</li>
  <li><strong>卡片</strong>：筛选查看各知识点熟练度。</li>
  <li>挑战正确率 ≥50% 更新熟练度；知识练习模式实时更新。</li>
</ul>
<p class="manual-tip">底部导航「卡片」可切换到卡片视图。</p>`
  },
  {
    id: "shop",
    label: "💎 商店",
    goto: "scr-shop",
    gotoLabel: "打开宝石商店",
    html: `<h4 class="manual-h">宝石商店</h4>
<ul class="manual-ul">
  <li><strong>精力补给</strong>：3💎 +2 点 / 5💎 回满。</li>
  <li><strong>Boss 提前解锁</strong>：8💎 本月内进入月末城堡。</li>
  <li><strong>金色皮肤</strong>：10💎 切换金色主题。</li>
  <li>已兑换的永久权益可在「我的收藏 → 商店权益」查看。</li>
</ul>`
  },
  {
    id: "backup",
    label: "💾 备份",
    goto: null,
    html: `<h4 class="manual-h">存档备份与更新</h4>
<ul class="manual-ul">
  <li><strong>导出</strong>：HUD → 导出 → 保存 JSON（换机、更新前必做）。</li>
  <li><strong>导入</strong>：HUD → 导入 → 选择 JSON，自动迁移到新版本。</li>
  <li>进度存在浏览器 localStorage，替换程序文件<strong>不会</strong>自动清空。</li>
  <li>会丢失进度的情况：清除网站数据、点「重置」、游客刷新页面。</li>
</ul>
<p class="manual-tip">详细文档：<code>BlockAcademy/docs/使用说明书.md</code></p>`
  }
];

function baSetManualTab(id) {
  baManualTab = id;
  document.querySelectorAll(".manual-tab").forEach(b => b.classList.toggle("on", b.dataset.tab === id));
  baRenderManualPanel();
}

function baRenderManualPanel() {
  const panel = document.getElementById("manual-panel");
  if (!panel) return;
  const sec = BA_MANUAL_SECTIONS.find(s => s.id === baManualTab) || BA_MANUAL_SECTIONS[0];
  let html = sec.html || "";
  if (sec.goto) {
    html += `<button type="button" class="pixel-btn primary manual-goto" onclick="showScreen('${sec.goto}')">${sec.gotoLabel || "前往此功能"} →</button>`;
  }
  panel.innerHTML = html;
}

function renderManual() {
  const tabsEl = document.getElementById("manual-tabs");
  if (!tabsEl) return;
  tabsEl.innerHTML = BA_MANUAL_SECTIONS.map(s =>
    `<button type="button" class="manual-tab${baManualTab === s.id ? " on" : ""}" data-tab="${s.id}" onclick="baSetManualTab('${s.id}')">${s.label}</button>`
  ).join("");
  baRenderManualPanel();
}
