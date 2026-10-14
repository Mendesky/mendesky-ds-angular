// 說明檢查：確認元件說明（*.docs.ts）跟程式碼一致。
//
// 檢查三件事：
//   1. 每個公開元件（*.component.ts，內部子元件除外）旁邊都有說明檔
//   2. 說明檔列的屬性名稱，跟元件宣告的 @Input／@Output／input()／model()／output() 完全一致
//   3. 說明檔能正確載入（語法錯誤直接算失敗，不略過）
// 一個元件都沒掃到也算失敗，避免「沒東西可查所以全過」。
//
// 用法：node scripts/check-docs.mjs [repo 根目錄]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDocFile } from './export-docs.mjs';

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

/** 回傳元件公開的屬性與事件名稱；檔案裡沒有 @Component／@Directive 類別時回傳 null */
export function readComponentApi(file) {
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true);
  let found = null;
  sf.forEachChild((node) => {
    if (!ts.isClassDeclaration(node)) return;
    const decorators = ts.getDecorators?.(node) ?? [];
    const kind = decorators.map(decoratorName).find((n) => n === 'Component' || n === 'Directive');
    if (!kind) return;
    const names = new Set();
    for (const member of node.members) {
      if (!member.name || !ts.isIdentifier(member.name)) continue;
      const own = member.name.text;
      for (const d of ts.getDecorators?.(member) ?? []) {
        const dn = decoratorName(d);
        if (dn === 'Input' || dn === 'Output') names.add(aliasFromDecorator(d) ?? own);
      }
      if (ts.isPropertyDeclaration(member)) {
        const call = signalApiCall(member.initializer);
        if (call) names.add(call.alias ?? own);
      }
    }
    found = { kind, names };
  });
  return found;
}

function docPropNames(doc) {
  return new Set(doc.props.map((p) => p.name.replace(/^\(|\)$/g, '')));
}

/**
 * core.scss 裡宣告的 CSS 變數 → 第一次宣告的值（名稱保留原始寫法，例如 `--text\/body`）。
 * 前面必須是行首、空白、{ 或 ;，排除 `.btn--disabled:hover` 這類 BEM 修飾 class 後接偽類。
 * 同一個變數在 media query 等處被覆寫時，以第一次（通常是 :root）為準。
 */
function scssCustomProperties(scss) {
  const map = new Map();
  for (const m of scss.matchAll(/(?:^|[\s{;])(--[A-Za-z0-9_\\/.-]+)\s*:\s*([^;]*);/gm)) {
    if (!map.has(m[1])) map.set(m[1], m[2].trim());
  }
  return map;
}

const normalizeValue = (v) => v.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * 基礎（token、字型）與互動原則的一致性。repo 沒有 src/docs/foundations/ 時略過（只檢查元件）。
 * 每類落差合併成一則錯誤訊息，列出全部名稱。
 */
export function checkFoundations(root, componentIds) {
  const docs = path.join(root, 'src', 'docs');
  const tokensFile = path.join(docs, 'foundations', 'tokens.ts');
  if (!existsSync(tokensFile)) return [];
  const errors = [];
  const load = (file) => {
    try {
      return loadDocFile(file);
    } catch (e) {
      errors.push(`${path.relative(root, file)}：無法載入（${e.message}）`);
      return null;
    }
  };
  const scss = readFileSync(path.join(root, 'src', 'styles', 'core.scss'), 'utf8');
  const defined = scssCustomProperties(scss);

  const tokens = load(tokensFile);
  if (tokens) {
    const documented = new Set(tokens.flatMap((g) => g.tokens.map((t) => t.name)));
    const stale = [...documented].filter((n) => !defined.has(n)).sort();
    const undocumented = [...defined.keys()].filter((n) => !documented.has(n)).sort();
    const drifted = tokens
      .flatMap((g) => g.tokens)
      .filter((t) => defined.has(t.name) && normalizeValue(t.value) !== normalizeValue(defined.get(t.name)))
      .map((t) => `${t.name}（說明寫 ${t.value}，core.scss 是 ${defined.get(t.name)}）`);
    if (stale.length) errors.push(`token：說明有、core.scss 已不存在（${stale.length} 個）：${stale.join(', ')}`);
    if (undocumented.length) errors.push(`token：core.scss 有、說明沒寫（${undocumented.length} 個）：${undocumented.join(', ')}`);
    if (drifted.length) errors.push(`token：說明的值跟 core.scss 不同（${drifted.length} 個）：${[...new Set(drifted)].join('；')}`);
  }

  const typography = load(path.join(docs, 'foundations', 'typography.ts'));
  if (typography) {
    const classes = typography.flatMap((f) => f.classes.map((c) => c.name));
    const stale = classes.filter((name) => !new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(scss)).sort();
    if (stale.length) errors.push(`字型：說明有、core.scss 已不存在的 class：${stale.join(', ')}`);
  }

  const patterns = load(path.join(docs, 'patterns.ts'));
  if (patterns) {
    const keys = new Set(Object.keys(patterns));
    const dangling = [];
    for (const [key, p] of Object.entries(patterns)) {
      for (const c of p.relatedComponents ?? []) if (!componentIds.has(c.replace(/^#/, ''))) dangling.push(`${key} → 元件 ${c}`);
      for (const r of p.relatedPatterns ?? []) {
        const target = r.split(/[（(\s]/)[0];
        if (!keys.has(target)) dangling.push(`${key} → 原則 ${r}`);
      }
    }
    for (const d of dangling) errors.push(`互動原則：指向不存在的對象：${d}`);
  }
  return errors;
}

export function checkDocs(root, { internal = INTERNAL_COMPONENTS } = {}) {
  const errors = [];
  const files = walk(path.join(root, 'src'));
  const sources = files.filter((f) => /\.(component|directive)\.ts$/.test(f));
  const docFiles = new Set(files.filter((f) => f.endsWith('.docs.ts')));
  const rel = (f) => path.relative(root, f);
  const docIds = new Set();
  let checked = 0;

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
    const api = readComponentApi(source);
    if (!api) {
      errors.push(`${rel(source)}：找不到 @Component／@Directive 類別，無法比對 ${doc.selector}`);
      continue;
    }
    checked++;
    docIds.add(doc.id);
    const documented = docPropNames(doc);
    const missing = [...api.names].filter((n) => !documented.has(n)).sort();
    const extra = [...documented].filter((n) => !api.names.has(n)).sort();
    if (missing.length) errors.push(`${doc.selector}：程式碼有、說明沒寫的屬性：${missing.join(', ')}`);
    if (extra.length) errors.push(`${doc.selector}：說明有、程式碼已不存在的屬性：${extra.join(', ')}`);
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
    } else {
      errors.push(`${rel(docFile)}：找不到對應的 .component.ts 或 .directive.ts`);
    }
  }

  if (sources.length === 0) errors.push(`掃描到 0 個元件，請確認路徑：${path.join(root, 'src')}`);
  errors.push(...checkFoundations(root, docIds));
  return { checked, errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const { checked, errors } = checkDocs(root);
  if (errors.length) {
    console.error(`說明檢查失敗（${errors.length} 項）：`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`說明檢查通過：${checked} 個元件的說明與程式碼一致；token、字型、互動原則也一致`);
}
