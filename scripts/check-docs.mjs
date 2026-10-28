// 說明檢查（Angular）：確認元件的 Angular 用法說明（*.docs.ts）跟程式碼一致，並跟本體的元件規格對得上。
//
// 檢查：
//   1. 每個公開元件（*.component.ts，內部子元件除外）旁邊都有說明檔
//   2. 說明檔列的屬性名稱，跟元件宣告的 @Input／@Output／input()／model()／output() 完全一致
//   3. 說明檔能正確載入（語法錯誤直接算失敗，不略過）
//   4. 說明檔只放 Angular 用法；何時用、注意事項、部位、狀態、無障礙、可以／不要這樣做等規格欄位屬於本體 @mendesky/ds
//   5. 每份說明都有對應的本體規格，每份本體規格也都有 Angular 說明
//   6. 說明檔與範例網站屬性表（argTypes 的 table.defaultValue）寫的預設值，跟程式的初值一致
//      （兩邊都是字串、數字、true／false／null 這類字面值時才比對）
//   7. 範例（*.stories.ts 與說明檔的用法程式碼）綁在 <app-xxx> 上的 [屬性]，元件或掛在上面的指令要真的有
//      正式建置的範例網站不會對不存在的屬性報錯，冒煙測試抓不到，所以在這裡靜態檢查
//   8. 說明檔的 usageNotes（Angular 專屬注意事項）每筆是文字或 { type, content }
//   9. src/docs/pattern-notes.ts（互動原則的 Angular 做法）的 key 都是本體有的互動原則，內容格式正確
// 一個元件都沒掃到也算失敗，避免「沒東西可查所以全過」。
// token、字型、互動原則的一致性由本體 repo 檢查。
//
// 另外匯出 checkSnippets(root, snippets)：本體的指南檢查（check:guides）用它驗證指南裡 Angular 分頁的程式碼。
//
// 用法：node scripts/check-docs.mjs [repo 根目錄]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDocFile, coreRoot, patternNotesFile } from './export-docs.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');

// 只在母元件內部使用、不給外部直接用的子元件：不需要獨立說明檔
export const INTERNAL_COMPONENTS = [
  'autocomplete-panel',
  'date-panel',
  'select-panel',
  'year-month-panel',
  'template-var-panel',
  'tooltip-portal',
  'rte-table-grip',
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function decoratorName(decorator) {
  const expr = decorator.expression;
  if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) return expr.expression.text;
  return null;
}

/** 從 @Input('x') 或 @Input({ alias: 'x' }) 取別名 */
function aliasFromDecorator(decorator) {
  const arg = decorator.expression.arguments?.[0];
  if (!arg) return null;
  if (ts.isStringLiteral(arg)) return arg.text;
  if (ts.isObjectLiteralExpression(arg)) return aliasFromOptions(arg);
  return null;
}

function aliasFromOptions(obj) {
  for (const p of obj.properties) {
    if (ts.isPropertyAssignment(p) && p.name.getText() === 'alias' && ts.isStringLiteral(p.initializer)) {
      return p.initializer.text;
    }
  }
  return null;
}

/** input()／input.required()／model()／model.required()／output() 的初始化式 */
function signalApiCall(initializer) {
  if (!initializer || !ts.isCallExpression(initializer)) return null;
  const callee = initializer.expression;
  let fn = null;
  if (ts.isIdentifier(callee)) fn = callee.text;
  else if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.name.text === 'required') {
    fn = callee.expression.text;
  }
  if (!['input', 'model', 'output'].includes(fn)) return null;
  // 別名在最後一個參數的物件裡：input(初值, { alias })、input.required({ alias })、output({ alias })
  const last = initializer.arguments[initializer.arguments.length - 1];
  const alias = last && ts.isObjectLiteralExpression(last) ? aliasFromOptions(last) : null;
  return { fn, alias };
}

/** 字面值的原始碼寫法（字串一律換成單引號）；不是字面值回傳 null */
function literalText(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return `'${node.text}'`;
  if (ts.isNumericLiteral(node)) return node.text;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) {
    return `-${node.operand.text}`;
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return 'true';
  if (node.kind === ts.SyntaxKind.FalseKeyword) return 'false';
  if (node.kind === ts.SyntaxKind.NullKeyword) return 'null';
  return null;
}

/** 說明檔 default 欄位的字面值寫法；是文字描述（例如「依外層而定」）就回傳 null，不比對 */
function docDefaultLiteral(value) {
  const text = String(value).trim();
  const quoted = text.match(/^(['"`])(.*)\1$/s);
  if (quoted) return `'${quoted[2]}'`;
  return /^(true|false|null|-?\d+(\.\d+)?)$/.test(text) ? text : null;
}

/** @Component／@Directive 的 selector 字串 */
function selectorOf(decorator) {
  const arg = decorator.expression.arguments?.[0];
  if (!arg || !ts.isObjectLiteralExpression(arg)) return null;
  for (const p of arg.properties) {
    if (ts.isPropertyAssignment(p) && p.name.getText() === 'selector' && ts.isStringLiteral(p.initializer)) return p.initializer.text;
  }
  return null;
}

/**
 * 回傳元件公開的屬性與事件名稱、selector，以及屬性的初值（字面值才記）；
 * 檔案裡沒有 @Component／@Directive 類別時回傳 null
 */
export function readComponentApi(file) {
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true);
  let found = null;
  sf.forEachChild((node) => {
    if (!ts.isClassDeclaration(node)) return;
    const decorators = ts.getDecorators?.(node) ?? [];
    const kindDecorator = decorators.find((d) => ['Component', 'Directive'].includes(decoratorName(d)));
    if (!kindDecorator) return;
    const kind = decoratorName(kindDecorator);
    const names = new Set();
    const defaults = new Map();
    for (const member of node.members) {
      if (!member.name || !ts.isIdentifier(member.name)) continue;
      const own = member.name.text;
      for (const d of ts.getDecorators?.(member) ?? []) {
        const dn = decoratorName(d);
        if (dn === 'Input' || dn === 'Output') names.add(aliasFromDecorator(d) ?? own);
        if (dn === 'Input' && ts.isPropertyDeclaration(member) && member.initializer) {
          defaults.set(aliasFromDecorator(d) ?? own, literalText(member.initializer));
        }
      }
      if (ts.isPropertyDeclaration(member)) {
        const call = signalApiCall(member.initializer);
        if (call) names.add(call.alias ?? own);
        // input(初值)／model(初值)；input.required 沒有初值
        if (call && call.fn !== 'output' && ts.isIdentifier(member.initializer.expression) && member.initializer.arguments.length) {
          defaults.set(call.alias ?? own, literalText(member.initializer.arguments[0]));
        }
      }
    }
    found = { kind, names, defaults, selector: selectorOf(kindDecorator) };
  });
  return found;
}

function docPropNames(doc) {
  return new Set(doc.props.map((p) => p.name.replace(/^\(|\)$/g, '')));
}

/**
 * 說明寫的預設值跟程式不同的屬性：[{ name, doc, code }]。
 * stats 累計「說明寫了字面值」與「實際比對到」的筆數，用來發現檢查本身失效（一筆都沒比對到）。
 */
function wrongDefaults(doc, api, stats) {
  const out = [];
  for (const p of doc.props) {
    if (p.default == null) continue;
    const documented = docDefaultLiteral(p.default);
    if (documented === null) continue;
    stats.documented++;
    const actual = api.defaults.get(p.name) ?? null;
    if (actual === null) continue;
    stats.compared++;
    if (documented !== actual) out.push({ name: p.name, doc: documented, code: actual });
  }
  return out;
}

const stripQuotes = (text) => text.replace(/^(['"`])(.*)\1$/s, '$2');

function objectProp(obj, key) {
  const p = obj.properties.find((x) => ts.isPropertyAssignment(x) && (ts.isIdentifier(x.name) || ts.isStringLiteral(x.name)) && x.name.text === key);
  return p && ts.isObjectLiteralExpression(p.initializer) ? p.initializer : p?.initializer;
}

/** 範例網站屬性表（argTypes.<屬性>.table.defaultValue.summary）標的預設值跟程式不同的屬性；引號寫法不同不算 */
function wrongStoryDefaults(storyFile, api) {
  const out = [];
  const sf = ts.createSourceFile(storyFile, readFileSync(storyFile, 'utf8'), ts.ScriptTarget.ES2022, true);
  const visit = (node) => {
    if (ts.isPropertyAssignment(node) && node.name.getText() === 'argTypes' && ts.isObjectLiteralExpression(node.initializer)) {
      for (const p of node.initializer.properties) {
        if (!ts.isPropertyAssignment(p) || !ts.isObjectLiteralExpression(p.initializer)) continue;
        const name = p.name.getText().replace(/^['"]|['"]$/g, '');
        const table = objectProp(p.initializer, 'table');
        const dv = table && ts.isObjectLiteralExpression(table) ? objectProp(table, 'defaultValue') : null;
        const summary = dv && ts.isObjectLiteralExpression(dv) ? objectProp(dv, 'summary') : null;
        const actual = api.defaults.get(name);
        if (!summary || !ts.isStringLiteral(summary) || actual == null) continue;
        if (stripQuotes(summary.text) !== stripQuotes(actual)) out.push({ name, story: summary.text, code: actual });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/** Angular 內建指令的屬性：綁在任何元素上都合法 */
const BUILTIN_BINDINGS = new Set(['ngModel', 'ngClass', 'ngStyle', 'ngTemplateOutlet', 'formControl', 'formControlName', 'formGroup']);

/**
 * 找出範例裡綁在 <app-xxx> 上、元件與指令都沒有的 [屬性]／[(屬性)]。
 * 只看方括號綁定：[class.x]、[style.x]、[attr.x] 與事件 (x) 不檢查。
 */
function unknownBindings(text, elements, directiveInputs, stats) {
  const out = [];
  for (const tag of text.matchAll(/<(app-[a-z0-9-]+)\b([^>]*)>/g)) {
    stats.seen++;
    const names = elements.get(tag[1]);
    if (!names) continue; // 不是這個 repo 的元件（或寫錯元件名），交給 TypeScript／建置去抓
    stats.recognized++;
    for (const binding of tag[2].matchAll(/\[\(?([A-Za-z_$][\w$]*)\)?\]\s*=/g)) {
      const name = binding[1];
      if (names.has(name) || directiveInputs.has(name) || BUILTIN_BINDINGS.has(name)) continue;
      out.push(`<${tag[1]}> 綁了元件沒有的屬性 [${name}]`);
    }
  }
  return [...new Set(out)];
}

/**
 * 元件與指令能在 template 用的名稱：
 *   elements        元素 selector（app-xxx）→ 屬性與事件名稱
 *   directiveInputs 屬性型指令（例如 [appTooltip]）的屬性與事件名稱，掛在任何元素上都算有
 *   directiveAttrs  屬性型指令的 selector 屬性名（例如 appTooltip）
 */
function templateApi(apis) {
  const elements = new Map();
  const directiveInputs = new Set();
  const directiveAttrs = new Set();
  for (const api of apis) {
    if (!api?.selector) continue;
    for (const sel of api.selector.split(',').map((x) => x.trim())) {
      if (/^app-[a-z0-9-]+$/.test(sel)) {
        elements.set(sel, api.names);
        continue;
      }
      for (const n of api.names) directiveInputs.add(n);
      for (const m of sel.matchAll(/\[([\w-]+)\]/g)) directiveAttrs.add(m[1]);
    }
  }
  return { elements, directiveInputs, directiveAttrs };
}

/** 任何元素都能用的 HTML 屬性（直接寫值） */
const GLOBAL_ATTRS = new Set(['class', 'style', 'id', 'role', 'title', 'tabindex', 'hidden', 'lang', 'dir', 'name', 'slot', 'i18n', 'ngSkipHydration', 'ngNonBindable']);
/** 任何元素都能用 [x] 綁的 DOM 屬性 */
const DOM_PROPS = new Set(['id', 'title', 'hidden', 'tabIndex', 'class', 'style', 'role']);
/** 任何元素都能用 (x) 聽的 DOM 事件 */
const DOM_EVENTS = new Set([
  'click', 'dblclick', 'contextmenu', 'focus', 'blur', 'focusin', 'focusout', 'keydown', 'keyup', 'keypress',
  'input', 'change', 'submit', 'reset', 'paste', 'copy', 'cut', 'scroll', 'wheel',
  'mousedown', 'mouseup', 'mouseenter', 'mouseleave', 'mouseover', 'mouseout', 'mousemove',
  'pointerdown', 'pointerup', 'pointerenter', 'pointerleave', 'pointermove', 'touchstart', 'touchend', 'touchmove',
  'dragstart', 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'drop', 'compositionstart', 'compositionend',
]);
/** Angular 表單指令的事件 */
const BUILTIN_EVENTS = new Set(['ngModelChange']);

const ATTR = /\s+([^\s=/>"']+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+))?/g;
const TAG = /<([a-zA-Z][\w-]*)((?:\s+[^\s=/>"']+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+))?)*)\s*\/?>/g;

/** 一段 template 程式碼裡寫錯的元件、屬性、事件、指令（依出現順序）。 */
function snippetProblems(code, { elements, directiveInputs, directiveAttrs }, ownSelectors) {
  const out = [];
  for (const [, tag, attrs] of code.matchAll(TAG)) {
    if (ownSelectors.has(tag)) continue; // 範例自己宣告的元件（使用端的畫面），屬性由範例自己決定
    const isApp = tag.startsWith('app-');
    const names = elements.get(tag);
    if (isApp && !names) {
      out.push(`<${tag}> 不是 Angular 版的元件`);
      continue;
    }
    for (const [, raw] of attrs.matchAll(ATTR)) {
      if (/^[#*@]|^let-|^(\.\.\.|…)$/.test(raw)) continue; // 範本參考、結構指令、動畫、let 變數、範例裡「其餘屬性省略」的 ...
      let kind = 'static';
      let name = raw;
      let m;
      if ((m = raw.match(/^\[\((.+)\)\]$/))) [kind, name] = ['prop', m[1]];
      else if ((m = raw.match(/^\[(.+)\]$/))) [kind, name] = ['prop', m[1]];
      else if ((m = raw.match(/^\((.+)\)$/))) [kind, name] = ['event', m[1]];
      if (kind === 'prop' && name.includes('.')) continue; // [attr.x]、[class.x]、[style.x]
      if (kind === 'event') name = name.split('.')[0]; // (keydown.enter)
      if (/^app[A-Z]/.test(name)) {
        if (!directiveAttrs.has(name) && !directiveInputs.has(name) && !names?.has(name)) out.push(`沒有 ${name} 這個指令或屬性`);
        continue;
      }
      if (!isApp) continue; // 一般 HTML 元素只檢查 app 開頭的指令
      const own = names.has(name) || directiveInputs.has(name);
      if (kind === 'event') {
        if (!own && !DOM_EVENTS.has(name) && !BUILTIN_EVENTS.has(name)) out.push(`<${tag}> 沒有事件 ${name}`);
      } else if (kind === 'prop') {
        if (!own && !BUILTIN_BINDINGS.has(name) && !DOM_PROPS.has(name)) out.push(`<${tag}> 沒有屬性 ${name}`);
      } else if (!own && !BUILTIN_BINDINGS.has(name) && !GLOBAL_ATTRS.has(name) && !/^(aria|data|i18n)-/.test(name)) {
        out.push(`<${tag}> 沒有屬性 ${name}`);
      }
    }
  }
  return out;
}

/**
 * 驗證別處（本體的指南文章）寫的 Angular 範例：元件要存在，屬性與事件名稱要是元件或指令有的。
 * snippets：[{ where: 出處說明, code: 程式碼 }]。範例裡用 selector: 'app-xxx' 自己宣告的元件（教學裡的使用端畫面）不檢查。
 * 回傳錯誤訊息陣列；讀不到任何元件時回傳一則「檢查沒有執行」。
 */
export function checkSnippets(root, snippets) {
  const sources = walk(path.join(root, 'src')).filter((f) => /\.(component|directive)\.ts$/.test(f));
  const api = templateApi(sources.map((s) => readComponentApi(s)));
  if (api.elements.size === 0) return [`讀不到任何 Angular 元件（${path.join(root, 'src')}），指南範例檢查沒有執行`];
  const ownSelectors = new Set(snippets.flatMap(({ code }) => [...code.matchAll(/selector:\s*['"`](app-[a-z0-9-]+)['"`]/g)].map((m) => m[1])));
  const errors = [];
  for (const { where, code } of snippets) for (const problem of snippetProblems(code, api, ownSelectors)) errors.push(`${where}：${problem}`);
  return [...new Set(errors)];
}

const NOTE_TYPES = ['info', 'warn', 'warning'];
const isNote = (n) => typeof n === 'string' || (n && typeof n === 'object' && NOTE_TYPES.includes(n.type) && typeof n.content === 'string');

/** 注意事項清單格式不對的筆數位置（從 1 起算）；不是陣列回傳 null */
function badNoteIndexes(list) {
  if (!Array.isArray(list)) return null;
  return list.map((n, i) => (isNote(n) ? null : i + 1)).filter((i) => i !== null);
}

/** 本體互動原則的 key（從 patterns.ts 的 DS_PATTERNS 物件讀屬性名，不執行檔案）。 */
export function readPatternKeys(file) {
  const keys = new Set();
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true);
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText() === 'DS_PATTERNS' && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const p of node.initializer.properties) {
        if (p.name && (ts.isStringLiteral(p.name) || ts.isIdentifier(p.name))) keys.add(p.name.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return keys;
}

function corePatternKeys(root) {
  return readPatternKeys(path.join(coreRoot(root), 'src', 'docs', 'patterns.ts'));
}

/** 檢查 src/docs/pattern-notes.ts；沒有這個檔案不算錯（該框架沒有互動原則的專屬做法）。 */
function checkPatternNotes(root, patternKeys, errors) {
  const file = patternNotesFile(root);
  if (!existsSync(file)) return;
  const rel = path.relative(root, file);
  let notes;
  try {
    notes = loadDocFile(file);
  } catch (e) {
    errors.push(`${rel}：無法載入（${e.message}）`);
    return;
  }
  const keys = patternKeys ?? corePatternKeys(root);
  if (keys.size === 0) {
    errors.push(`${rel}：讀不到本體互動原則的 key，pattern-notes 檢查沒有執行`);
  } else {
    const unknown = Object.keys(notes).filter((k) => !keys.has(k));
    if (unknown.length) errors.push(`${rel}：本體沒有這些互動原則：${unknown.join(', ')}`);
  }
  for (const [key, list] of Object.entries(notes)) {
    const bad = badNoteIndexes(list);
    if (bad === null || bad.length) errors.push(`${rel}：${key} 的內容格式不對（要是陣列，每筆是文字或 { type: 'info'｜'warn'｜'warning', content: 文字 }）`);
  }
}

/** 只屬於本體元件規格的欄位（含第 2 版的部位、狀態、無障礙、可以／不要這樣做）：出現在 Angular 說明檔就是放錯地方 */
export const SPEC_ONLY_KEYS = ['name', 'group', 'when', 'description', 'notes', 'customTables', 'anatomy', 'states', 'a11y', 'dos', 'donts'];

/** 本體元件規格的 id（讀 @mendesky/ds 的 src/docs/components 檔名，不執行檔案）。 */
export function coreSpecIds(root) {
  const dir = path.join(coreRoot(root), 'src', 'docs', 'components');
  return new Set(readdirSync(dir).filter((n) => n.endsWith('.ts') && n !== 'index.ts').map((n) => n.replace(/\.ts$/, '')));
}

export function checkDocs(root, { internal = INTERNAL_COMPONENTS, specIds, patternKeys } = {}) {
  const errors = [];
  const files = walk(path.join(root, 'src'));
  const sources = files.filter((f) => /\.(component|directive)\.ts$/.test(f));
  const docFiles = new Set(files.filter((f) => f.endsWith('.docs.ts')));
  const rel = (f) => path.relative(root, f);
  const specOnly = (doc, file) => {
    const keys = SPEC_ONLY_KEYS.filter((k) => k in doc);
    if (keys.length) errors.push(`${rel(file)}：說明檔只放 Angular 用法，這些欄位屬於本體元件規格：${keys.join(', ')}`);
    if (!('usageNotes' in doc)) return;
    const bad = badNoteIndexes(doc.usageNotes);
    if (bad === null) errors.push(`${rel(file)}：usageNotes 要是陣列`);
    else if (bad.length) errors.push(`${rel(file)}：usageNotes 第 ${bad.join('、')} 筆格式不對（要是文字，或 { type: 'info'｜'warn'｜'warning', content: 文字 }）`);
  };
  const docIds = new Set();
  const usages = []; // [{ where, code }]，範例綁定檢查用
  const defaultStats = { documented: 0, compared: 0 };
  const bindingStats = { seen: 0, recognized: 0 };
  let checked = 0;

  // 元素 selector（app-xxx）→ 屬性名稱；屬性型指令（例如 [appErrorTooltip]）的屬性在任何元素上都算有
  const apis = new Map(sources.map((s) => [s, readComponentApi(s)]));
  const { elements, directiveInputs } = templateApi(apis.values());

  for (const source of sources) {
    const base = path.basename(source).replace(/\.(component|directive)\.ts$/, '');
    const docFile = path.join(path.dirname(source), `${base}.docs.ts`);
    const isComponent = source.endsWith('.component.ts');

    if (!docFiles.has(docFile)) {
      if (isComponent && !internal.includes(base)) errors.push(`${rel(source)}：公開元件缺少說明檔 ${base}.docs.ts`);
      continue;
    }
    docFiles.delete(docFile);

    let doc;
    try {
      doc = loadDocFile(docFile);
    } catch (e) {
      errors.push(`${rel(docFile)}：無法載入（${e.message}）`);
      continue;
    }
    const api = apis.get(source);
    if (!api) {
      errors.push(`${rel(source)}：找不到 @Component／@Directive 類別，無法比對 ${doc.selector}`);
      continue;
    }
    checked++;
    docIds.add(doc.id);
    specOnly(doc, docFile);
    const documented = docPropNames(doc);
    const missing = [...api.names].filter((n) => !documented.has(n)).sort();
    const extra = [...documented].filter((n) => !api.names.has(n)).sort();
    if (missing.length) errors.push(`${doc.selector}：程式碼有、說明沒寫的屬性：${missing.join(', ')}`);
    if (extra.length) errors.push(`${doc.selector}：說明有、程式碼已不存在的屬性：${extra.join(', ')}`);
    const wrong = wrongDefaults(doc, api, defaultStats);
    if (wrong.length) {
      errors.push(`${doc.selector}：說明寫的預設值跟程式不同：${wrong.map((w) => `${w.name}：說明 ${w.doc}、程式 ${w.code}`).join('；')}`);
    }
    for (const u of doc.usage ?? []) usages.push({ where: `${rel(docFile)}（用法「${u.label}」）`, code: u.code ?? '' });
  }

  // 沒有對應元件的說明檔：只允許 CSS class 類（selector 以 . 開頭，沒有程式碼可比對）
  for (const docFile of docFiles) {
    let doc;
    try {
      doc = loadDocFile(docFile);
    } catch (e) {
      errors.push(`${rel(docFile)}：無法載入（${e.message}）`);
      continue;
    }
    if (doc.selector.startsWith('.')) {
      checked++; // CSS class 沒有程式碼可比對屬性，載入成功即算通過
      docIds.add(doc.id);
      specOnly(doc, docFile);
    } else {
      errors.push(`${rel(docFile)}：找不到對應的 .component.ts 或 .directive.ts`);
    }
  }

  if (sources.length === 0) errors.push(`掃描到 0 個元件，請確認路徑：${path.join(root, 'src')}`);

  for (const story of files.filter((f) => f.endsWith('.stories.ts'))) {
    usages.push({ where: rel(story), code: readFileSync(story, 'utf8') });
    const base = story.replace(/\.stories\.ts$/, '');
    const api = apis.get(`${base}.component.ts`) ?? apis.get(`${base}.directive.ts`);
    if (!api) continue;
    const wrong = wrongStoryDefaults(story, api);
    if (wrong.length) {
      errors.push(`${rel(story)}：屬性表標的預設值跟程式不同：${wrong.map((w) => `${w.name}：屬性表 ${w.story}、程式 ${w.code}`).join('；')}`);
    }
  }
  for (const { where, code } of usages) {
    for (const problem of unknownBindings(code, elements, directiveInputs, bindingStats)) errors.push(`${where}：${problem}`);
  }
  // 檢查本身失效時不能默默通過
  if (defaultStats.documented > 0 && defaultStats.compared === 0) {
    errors.push(`預設值一筆都沒比對到：說明寫了 ${defaultStats.documented} 個預設值，但程式的初值一個都沒讀出來，預設值檢查沒有執行`);
  }
  if (bindingStats.seen > 0 && bindingStats.recognized === 0) {
    errors.push(`範例裡有 ${bindingStats.seen} 個 <app-xxx>，但一個都認不出來（元件 selector 沒讀到），綁定檢查沒有執行`);
  }

  checkPatternNotes(root, patternKeys, errors);

  const specs = specIds ?? coreSpecIds(root);
  const noSpec = [...docIds].filter((id) => !specs.has(id)).sort();
  const noDoc = [...specs].filter((id) => !docIds.has(id)).sort();
  if (noSpec.length) errors.push(`本體沒有對應元件規格的說明：${noSpec.join(', ')}`);
  if (noDoc.length) errors.push(`本體有元件規格、但 Angular 沒有說明：${noDoc.join(', ')}`);
  return { checked, errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const { checked, errors } = checkDocs(root);
  if (errors.length) {
    console.error(`說明檢查失敗（${errors.length} 項）：`);
    for (const e of errors) console.error(`  - ${e}`);
    // 用 exitCode 而不是 process.exit：輸出接到管線時，process.exit 會截斷還沒寫完的訊息
    process.exitCode = 1;
  } else {
    console.log(`說明檢查通過：${checked} 個元件的 Angular 說明與程式碼一致，也都對得上本體的元件規格`);
  }
}
