// BlockAcademy 英语题库 · 词性辨析（广州教科版四下 · 第一性原理校对）
// 规则：每组四词中，词性/类别唯一不同的那一项为正确答案

function baMkClassify(opts, answer, tag) {
  const letters = ["A", "B", "C", "D"];
  const optionTexts = {};
  letters.forEach((L, i) => { if (opts[i] != null) optionTexts[L] = opts[i]; });
  const optPart = opts.map((w, i) => letters[i] + ". " + w).join("  ");
  return {
    q: "选出不同类的一项：\n" + optPart,
    a: answer,
    options: letters.slice(0, opts.length),
    optionTexts,
    classifyTag: tag || ""
  };
}

const ENGLISH_CLASSIFY_ITEMS = [
  // Day 1
  baMkClassify(["sun", "wind", "grow", "rain"], "C", "grow为动词，其余为天气名词"),
  baMkClassify(["tall", "beautiful", "delicious", "bamboo"], "D", "bamboo为名词，其余为形容词"),
  baMkClassify(["bee", "fox", "honey", "mouse"], "C", "honey为食物，其余为动物"),
  baMkClassify(["milk", "meat", "egg", "sport"], "D", "sport为运动总称，其余为食物"),
  baMkClassify(["basketball", "ping-pong", "train", "football"], "C", "train为交通工具，其余为球类运动"),
  baMkClassify(["windy", "rainy", "snowy", "beach"], "D", "beach为名词，其余为天气形容词"),
  baMkClassify(["shirt", "jacket", "clothes", "sweater"], "C", "clothes为总称，其余为具体衣物"),
  baMkClassify(["video", "join", "sleep", "cook"], "A", "video为名词，其余为动词"),
  baMkClassify(["park", "cinema", "market", "choice"], "D", "choice为抽象名词，其余为场所"),
  baMkClassify(["their", "there", "here", "where"], "A", "their为物主代词，其余为地点副词"),
  // Day 8
  baMkClassify(["grow", "plant", "fruit", "water"], "C", "fruit为水果名词，其余多与种植动作相关"),
  baMkClassify(["tall", "short", "strong", "bamboo"], "D", "bamboo为名词，其余为形容词"),
  baMkClassify(["basketball", "football", "sport", "ping-pong"], "C", "sport为总称，其余为具体运动"),
  baMkClassify(["spring", "summer", "season", "winter"], "C", "season为总称，其余为具体季节"),
  baMkClassify(["shirt", "clothes", "sweater", "jacket"], "B", "clothes为总称，其余为具体衣物"),
  baMkClassify(["park", "cinema", "market", "problem"], "D", "problem为抽象名词，其余为场所"),
  baMkClassify(["milk", "meat", "egg", "delicious"], "D", "delicious为形容词，其余为食物名词"),
  baMkClassify(["once", "twice", "time", "three times"], "C", "time为时间名词，其余表频率"),
  // Day 14
  baMkClassify(["sun", "moon", "star", "sunny"], "D", "sunny为形容词，其余为天体名词"),
  baMkClassify(["spring", "summer", "season", "winter"], "C", "season为总称，其余为具体季节"),
  baMkClassify(["shirt", "trousers", "clothes", "sweater"], "C", "clothes为总称，其余为具体衣物"),
  baMkClassify(["park", "cinema", "market", "delicious"], "D", "delicious为形容词，其余为场所"),
  baMkClassify(["windy", "rainy", "snowy", "umbrella"], "D", "umbrella为名词，其余为天气形容词"),
  baMkClassify(["grow", "plant", "flower", "water"], "D", "water不是植物名称，其余与植物相关"),
  baMkClassify(["once", "twice", "three", "four times"], "C", "three为基数词，其余表频率"),
  baMkClassify(["behind", "ahead", "before", "because"], "D", "because为连词，其余为方位词"),
  // Day 18
  baMkClassify(["apple", "banana", "vegetable", "orange"], "C", "vegetable为蔬菜总称，其余为水果"),
  baMkClassify(["Monday", "Tuesday", "Friday", "weekend"], "D", "weekend为周末，其余为星期几"),
  baMkClassify(["red", "blue", "colour", "green"], "C", "colour为颜色总称，其余为具体颜色"),
  baMkClassify(["teacher", "doctor", "parent", "hospital"], "D", "hospital为场所，其余为人物身份"),
  baMkClassify(["run", "walk", "fast", "jump"], "C", "fast为形容词/副词，其余为动词"),
  baMkClassify(["happy", "sad", "tired", "feeling"], "D", "feeling为名词，其余为形容词"),
  baMkClassify(["cup", "glass", "bottle", "drink"], "D", "drink为饮料/动词，其余为容器"),
  baMkClassify(["one", "two", "first", "three"], "C", "first为序数词，其余为基数词"),
  baMkClassify(["quickly", "slowly", "quietly", "beautiful"], "D", "beautiful为形容词，其余为副词")
];

const BA_STRICT_ENGLISH_NODES = new Set(["en-classify", "en-vocab", "en-grammar", "en-reading", "en-pet"]);

function baApplyEnglishClassifyBank() {
  if (typeof ENGLISH_DATA === "undefined" || typeof ENGLISH_CLASSIFY_ITEMS === "undefined") return;
  let cat = ENGLISH_DATA.find(c => c.id === "en-classify");
  if (!cat) {
    cat = { id: "en-classify", name: "词性辨析与句型", type: "句型", items: [] };
    ENGLISH_DATA.push(cat);
  }
  cat.items = ENGLISH_CLASSIFY_ITEMS.slice();
  cat.name = "词性辨析与句型";
  cat.type = "句型";
}

function baValidateEnglishMcItem(item) {
  if (!item?.options?.length || !/^[A-D]$/i.test(String(item.a || "").trim())) return null;
  const ans = String(item.a).toUpperCase();
  if (!item.options.map(x => String(x).toUpperCase()).includes(ans)) {
    return "答案字母不在选项中";
  }
  const texts = item.optionTexts || {};
  if (texts[ans] == null && texts[ans.toLowerCase()] == null) {
    const t = typeof getOptionText === "function" ? getOptionText(item, ans) : "";
    if (!t || t === ans || t.length < 1) return "缺少选项文本";
  }
  if (typeof isCorrectAnswer === "function" && !isCorrectAnswer(ans, item.a, item.options)) {
    return "标准答案无法通过判分";
  }
  return null;
}

function baAuditEnglishBanks() {
  if (typeof ENGLISH_DATA === "undefined") return [];
  const issues = [];
  ENGLISH_DATA.forEach(cat => {
    (cat.items || []).forEach((item, idx) => {
      const err = baValidateEnglishMcItem(item);
      if (err) issues.push({ catId: cat.id, index: idx + 1, issue: err, q: (item.q || "").slice(0, 60) });
    });
  });
  return issues;
}
