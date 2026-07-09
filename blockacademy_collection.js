// BlockAcademy 我的收藏：合成作品 · 传说珍宝 · 商店权益
let baCollectionTab = "all";

const BA_COLLECTION_TABS = [
  { id: "all", label: "📚 全部" },
  { id: "craft", label: "⚒ 合成作品" },
  { id: "artifact", label: "🏆 传说珍宝" },
  { id: "shop", label: "💎 商店权益" },
  { id: "log", label: "📜 获得记录" }
];

const BA_SHOP_COLLECT_MAP = {
  hunger2: { kind: "consumable", keepInCatalog: false },
  hungerfull: { kind: "consumable", keepInCatalog: false },
  castle: { kind: "privilege", keepInCatalog: true, check: () => !!state?.castleUnlocked },
  skin: { kind: "privilege", keepInCatalog: true, check: () => state?.skinTheme === "gold" }
};

function baEnsureCollectionState() {
  if (!state) return;
  if (!state.collectionLog) state.collectionLog = [];
}

function baGetCraftOutputInfo() {
  const map = {};
  if (typeof CRAFT_RECIPES === "undefined") return map;
  CRAFT_RECIPES.forEach(r => {
    if (r.output) map[r.output] = { tier: r.tier, recipeId: r.id, name: r.name };
    if (r.artifact) map[r.artifact] = { tier: 4, recipeId: r.id, name: r.name, artifact: true };
  });
  return map;
}

function baLogCollection(entry) {
  baEnsureCollectionState();
  if (!entry || !entry.name) return;
  state.collectionLog.unshift({
    type: entry.type || "craft",
    id: entry.id || entry.name,
    name: entry.name,
    icon: entry.icon || "📦",
    tier: entry.tier || 0,
    desc: entry.desc || "",
    consumable: !!entry.consumable,
    date: entry.date || new Date().toLocaleDateString("zh-CN"),
    ts: Date.now()
  });
  if (state.collectionLog.length > 120) state.collectionLog.length = 120;
  if (typeof save === "function") save();
}

function baBuildCollectionCatalog() {
  baEnsureCollectionState();
  baEnsureCraftState();
  const out = baGetCraftOutputInfo();
  const items = [];

  Object.entries(state.backpack || {}).forEach(([name, count]) => {
    if (!count || !out[name] || out[name].artifact) return;
    items.push({
      cat: "craft",
      id: "craft-" + name,
      name,
      icon: typeof getItemIcon === "function" ? getItemIcon(name) : "📦",
      count,
      tier: out[name].tier,
      desc: (typeof CRAFT_TIER_LABEL !== "undefined" ? CRAFT_TIER_LABEL[out[name].tier] : "合成") + " · 可继续用于合成",
      date: ""
    });
  });

  Object.entries(state.artifacts || {}).forEach(([name, info]) => {
    items.push({
      cat: "artifact",
      id: "art-" + name,
      name,
      icon: info.icon || "🏆",
      count: 1,
      tier: 4,
      desc: "传说珍宝 · 永久收藏",
      date: info.date || ""
    });
  });

  if (typeof GEM_SHOP !== "undefined") {
    GEM_SHOP.forEach(shopItem => {
      const meta = BA_SHOP_COLLECT_MAP[shopItem.id] || { kind: "item", keepInCatalog: true };
      const active = meta.check ? meta.check() : false;
      const bought = (state.collectionLog || []).some(x => x.id === shopItem.id && x.type === "shop");
      if (meta.keepInCatalog && (active || bought)) {
        items.push({
          cat: "shop",
          id: "shop-" + shopItem.id,
          name: shopItem.name,
          icon: shopItem.icon,
          count: 1,
          tier: 0,
          desc: shopItem.desc + (active ? " · 已生效" : " · 已兑换"),
          date: "",
          active
        });
      }
    });
  }

  items.sort((a, b) => (b.tier || 0) - (a.tier || 0) || a.name.localeCompare(b.name, "zh-CN"));
  return items;
}

function baSetCollectionTab(tab) {
  baCollectionTab = tab;
  document.querySelectorAll(".collection-tab").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  baRenderCollectionPanel();
}

function baRenderCollectionPanel() {
  const grid = document.getElementById("collection-grid");
  const logEl = document.getElementById("collection-log");
  if (!grid) return;

  if (baCollectionTab === "log") {
    grid.style.display = "none";
    if (logEl) {
      logEl.style.display = "block";
      const logs = (state && state.collectionLog) || [];
      if (!logs.length) {
        logEl.innerHTML = '<div style="font-size:12px;color:#888;padding:12px 0">暂无获得记录，完成合成或商店兑换后会出现在这里</div>';
      } else {
        logEl.innerHTML = logs.slice(0, 40).map(x => `
          <div class="collect-log-item">
            <span style="font-size:20px">${x.icon || "📦"}</span>
            <div style="flex:1">
              <div style="font-weight:700;font-size:12px">${x.name}${x.consumable ? " <span style='color:#888;font-weight:400'>(消耗品)</span>" : ""}</div>
              <div style="font-size:10px;color:#888">${x.desc || x.type || ""} · ${x.date || ""}</div>
            </div>
          </div>`).join("");
      }
    }
    return;
  }

  if (logEl) logEl.style.display = "none";
  grid.style.display = "grid";

  let items = baBuildCollectionCatalog();
  if (baCollectionTab !== "all") items = items.filter(x => x.cat === baCollectionTab);

  if (!items.length) {
    const hints = {
      craft: "暂无合成作品。去合成台放入素材，可产出中间品与大师作品",
      artifact: "暂无传说珍宝。完成 Tier4 配方可获得永久收藏",
      shop: "暂无商店权益。用宝石兑换皮肤、城堡解锁等权益",
      all: "还没有收藏。探险掉落素材 → 合成作品；宝石可兑换权益"
    };
    grid.innerHTML = `<div style="grid-column:1/-1;font-size:12px;color:#888;padding:16px 8px;line-height:1.6">${hints[baCollectionTab] || hints.all}</div>`;
    return;
  }

  grid.innerHTML = items.map(it => `
    <div class="collect-card${it.tier >= 4 ? " tier-legend" : it.tier >= 3 ? " tier-master" : ""}" title="${it.desc}">
      <div class="collect-icon">${it.icon}</div>
      <div class="collect-name">${it.name}</div>
      ${it.count > 1 ? `<div class="collect-count">×${it.count}</div>` : ""}
      <div class="collect-meta">${it.tier ? "T" + it.tier + " · " : ""}${it.desc.split(" · ")[0]}</div>
      ${it.date ? `<div class="collect-date">${it.date}</div>` : ""}
    </div>`).join("");
}

function renderCollection() {
  const tabsEl = document.getElementById("collection-tabs");
  const summaryEl = document.getElementById("collection-summary");
  if (!tabsEl || !state) {
    if (summaryEl) summaryEl.innerHTML = '<p style="font-size:11px;color:#888">请先登录后查看收藏</p>';
    return;
  }

  baEnsureCollectionState();
  const catalog = baBuildCollectionCatalog();
  const craftN = catalog.filter(x => x.cat === "craft").length;
  const artN = catalog.filter(x => x.cat === "artifact").length;
  const shopN = catalog.filter(x => x.cat === "shop").length;

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        <div><div style="font-size:18px;font-weight:900;color:var(--mc-gold)">${craftN}</div><div style="font-size:10px;color:#888">合成作品</div></div>
        <div><div style="font-size:18px;font-weight:900;color:var(--mc-gold)">${artN}</div><div style="font-size:10px;color:#888">传说珍宝</div></div>
        <div><div style="font-size:18px;font-weight:900;color:var(--mc-gold)">${shopN}</div><div style="font-size:10px;color:#888">商店权益</div></div>
      </div>
      <p style="font-size:10px;color:#888;margin-top:8px;line-height:1.5">背包存放探险素材；此处陈列<strong>合成产出</strong>与<strong>宝石兑换</strong>的永久收藏与权益</p>`;
  }

  tabsEl.innerHTML = BA_COLLECTION_TABS.map(t =>
    `<button type="button" class="collection-tab${baCollectionTab === t.id ? " on" : ""}" data-tab="${t.id}" onclick="baSetCollectionTab('${t.id}')">${t.label}</button>`
  ).join("");

  baRenderCollectionPanel();
}

function baMigrateCollection() {
  if (!state) return;
  baEnsureCollectionState();
  if (state.collectionLog.length) return;

  Object.entries(state.artifacts || {}).forEach(([name, info]) => {
    state.collectionLog.push({
      type: "artifact", id: name, name, icon: info.icon || "🏆", tier: 4,
      desc: "传说珍宝", date: info.date || "", ts: Date.now() - 86400000
    });
  });

  const outputs = baGetCraftOutputInfo();
  Object.entries(state.backpack || {}).forEach(([name, count]) => {
    if (count > 0 && outputs[name] && !outputs[name].artifact) {
      state.collectionLog.push({
        type: "craft", id: outputs[name].recipeId, name, icon: typeof getItemIcon === "function" ? getItemIcon(name) : "📦",
        tier: outputs[name].tier, desc: "合成作品", date: "", ts: Date.now() - 43200000
      });
    }
  });

  if (state.castleUnlocked) {
    state.collectionLog.push({ type: "shop", id: "castle", name: "Boss提前解锁", icon: "🏰", desc: "月末城堡权益", date: "", ts: Date.now() });
  }
  if (state.skinTheme === "gold") {
    state.collectionLog.push({ type: "shop", id: "skin", name: "金色皮肤", icon: "✨", desc: "金色主题", date: "", ts: Date.now() });
  }

  state.collectionLog.sort((a, b) => (b.ts || 0) - (a.ts || 0));
}
