// BlockAcademy 填空题：多空位 → 多输入框，逐空判分（不要求用符号分隔答案）
const BA_BLANK_RE = /_{2,}|＿{2,}|……|\.\.\.|（\s*）|\(\s*\)/g;

function baEscapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function baCountBlanks(text) {
  if (!text) return 0;
  let s = String(text);
  // 句末省略号表示「以此类推」，不算填空位
  s = s.replace(/(?:……|\.\.\.)+\s*$/g, "");
  const m = s.match(BA_BLANK_RE);
  return m ? m.length : 0;
}

function baStripFillNote(s) {
  return String(s || "").trim().replace(/^（示例）|^（例）|^\(例\)/, "").trim();
}

function baSplitFillAnswers(ans, hintCount) {
  let s = baStripFillNote(ans);
  if (!s) return [];
  let parts = s.split(/[,，、；;]\s*/).map(x => x.trim()).filter(Boolean);
  // 判断题「对，……」「错，……」在单空题中保留首项即可
  if (hintCount === 1 && parts.length > 1 && /^(对|错)$/.test(parts[0])) {
    parts = [parts[0]];
  }
  if (parts.length <= 1 && hintCount > 1 && /-/.test(s) && !/\d+\.\d+/.test(s)) {
    const dashParts = s.split(/\s*-\s*/).map(x => x.trim()).filter(Boolean);
    if (dashParts.length === hintCount) parts = dashParts;
  }
  if (parts.length <= 1 && hintCount > 1 && /和/.test(s)) {
    const heParts = s.split(/和/).map(x => x.trim()).filter(Boolean);
    if (heParts.length === hintCount) parts = heParts;
  }
  if (hintCount > 0 && parts.length > hintCount) parts = parts.slice(0, hintCount);
  return parts;
}

function baGetFillSpec(q) {
  const stem = (q && (q.q || q.text)) || "";
  const rawAns = (q && (q.a != null ? q.a : q.ans)) || "";
  if (Array.isArray(q && q.blanks) && q.blanks.length) {
    return { blankCount: q.blanks.length, answers: q.blanks.slice() };
  }
  let blankCount = baCountBlanks(stem);
  let answers = baSplitFillAnswers(rawAns, blankCount || 99);
  if (blankCount === 0 && answers.length > 1) blankCount = answers.length;
  if (blankCount === 0) blankCount = 1;
  if (answers.length < blankCount) {
    const single = baStripFillNote(rawAns);
    if (answers.length === 1 && blankCount === 1) answers = [single];
    else while (answers.length < blankCount) answers.push("");
  }
  return { blankCount, answers: answers.slice(0, blankCount) };
}

function baIsMultiFill(q) {
  if (!q || (q.options && q.options.length)) return false;
  return baGetFillSpec(q).blankCount > 1;
}

function baStemWithFillInputs(stem, prefix, count) {
  let i = 0;
  const esc = baEscapeHtml(stem).replace(/\n/g, "<br>");
  return esc.replace(BA_BLANK_RE, () => {
    const idx = i++;
    if (idx >= count) return "______";
    return `<input type="text" id="${prefix}-${idx}" class="fill-inline-input game-answer" data-blank-idx="${idx}" placeholder="空${idx + 1}" autocomplete="off">`;
  });
}

function baRenderFillInputs(spec, prefix, stem) {
  const stemBlanks = baCountBlanks(stem);
  if (stemBlanks > 0) {
    return {
      inline: true,
      html: baStemWithFillInputs(stem, prefix, spec.blankCount),
      prefix
    };
  }
  let rows = "";
  for (let i = 0; i < spec.blankCount; i++) {
    rows += `<div class="fill-blank-row"><span class="fill-blank-label">空${i + 1}</span><input type="text" id="${prefix}-${i}" class="game-answer fill-blank-input" data-blank-idx="${i}" placeholder="请输入" autocomplete="off"></div>`;
  }
  return { inline: false, html: `<div class="fill-blank-list">${rows}</div>`, prefix };
}

function baCollectFillInputs(prefix, count) {
  const vals = [];
  for (let i = 0; i < count; i++) {
    const el = document.getElementById(`${prefix}-${i}`);
    vals.push((el && el.value ? el.value : "").trim());
  }
  return vals;
}

function baFillInputsFromAnswer(prefix, answerStr, spec) {
  const s = spec || baGetFillSpec({ a: answerStr });
  const parts = s.answers.length ? s.answers : baSplitFillAnswers(answerStr, s.blankCount);
  for (let i = 0; i < s.blankCount; i++) {
    const el = document.getElementById(`${prefix}-${i}`);
    if (el) el.value = parts[i] || "";
  }
  const single = document.getElementById(prefix === "game" ? "game-answer" : `${prefix}-single`);
  if (single) single.value = answerStr;
}

function baNormFillPart(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[\s,，、；;]/g, "")
    .replace(/[()（）]/g, "")
    .replace(/[。．.!！？?…]+$/g, "");
}

function baCmpSingleFillPart(user, expected) {
  const u = baNormFillPart(user);
  const c = baNormFillPart(expected);
  if (!c) return !!u;
  if (u === c) return true;
  // 判断题：允许「错，角的大小不变」与标准「错」等价
  if ((c === "对" || c === "错") && u.startsWith(c)) return true;
  if (String(expected).includes("/")) {
    return String(expected).split("/").some(a => baNormFillPart(a) === u);
  }
  if (c.length >= 2 && (c.includes(u) || u.includes(c))) return true;
  return false;
}

function baCmpFillAnswers(userVals, expectedVals, q) {
  if (!expectedVals || !expectedVals.length) return false;
  if (userVals.length !== expectedVals.length) return false;
  for (let i = 0; i < expectedVals.length; i++) {
    const exp = expectedVals[i];
    const usr = userVals[i];
    if (!exp && !usr) continue;
    if (exp && !usr) return false;
    if (!baCmpSingleFillPart(usr, exp)) return false;
  }
  return true;
}

function baCmpFillAnswerText(userText, correct, q) {
  const spec = baGetFillSpec(Object.assign({}, q || {}, { a: correct }));
  if (spec.blankCount <= 1) {
    return baCmpSingleFillPart(userText, spec.answers[0] || correct);
  }
  const userParts = baSplitFillAnswers(userText, spec.blankCount);
  if (userParts.length === spec.blankCount) {
    return baCmpFillAnswers(userParts, spec.answers, q);
  }
  return false;
}

/** 从题干中解析内联 A/B/C/D 选项（如「……：A. xx B. yy」或换行选项） */
function baParseInlineChoiceStem(text) {
  if (!text || typeof text !== "string") return null;
  const markers = [];
  const re = /(?:^|[\s：:，,；;？?！!）)])([A-Da-d])[\.、\)）]\s*/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    markers.push({
      letter: m[1].toUpperCase(),
      markStart: m.index,
      contentStart: m.index + m[0].length
    });
  }
  if (markers.length < 2) return null;

  const optionTexts = {};
  for (let i = 0; i < markers.length; i++) {
    const end = i + 1 < markers.length ? markers[i + 1].markStart : text.length;
    optionTexts[markers[i].letter] = text.slice(markers[i].contentStart, end).trim();
  }

  let stem = text.slice(0, markers[0].markStart).trim();
  stem = stem.replace(/[：:\s]+$/, "").trim();

  const options = Object.keys(optionTexts).sort();
  if (options.length < 2) return null;
  return { stem, optionTexts, options };
}

/** 剥离题干末尾内联选项，仅保留纯题干 */
function baStripInlineOptions(text) {
  if (!text) return text;
  const parsed = baParseInlineChoiceStem(text);
  return parsed ? parsed.stem : text;
}

/** 归一化选择题：拆分内联选项、补全 optionTexts、清理题干 */
function baNormalizeChoiceItem(item) {
  if (!item || !item.q) return item;
  const letterOpts = item.options?.length >= 2 && item.options.every(o => /^[A-Da-d]$/.test(String(o)));
  if (!letterOpts) return item;

  const parsed = baParseInlineChoiceStem(item.q);
  const hasTexts = item.optionTexts && Object.keys(item.optionTexts).length >= 2;

  if (parsed) {
    item.q = parsed.stem;
    item.options = parsed.options;
    item.optionTexts = hasTexts ? { ...parsed.optionTexts, ...item.optionTexts } : parsed.optionTexts;
  } else if (hasTexts) {
    item.q = baStripInlineOptions(item.q);
  }
  return item;
}
