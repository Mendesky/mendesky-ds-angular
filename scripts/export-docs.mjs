// 匯出元件說明成 JSON。說明分兩份，以 id 對應：
//   - Angular 用法（本 repo 各元件旁邊的 *.docs.ts）：selector、屬性、事件、範例程式碼、Angular 專屬注意事項
//   - 元件規格、基礎（token、字型、動效）、互動原則、圖示：在本體套件 @mendesky/ds
// 互動原則的 Angular 做法在本 repo 的 src/docs/pattern-notes.ts，以原則的 key 對應。
//
// 出口：
//   exportFrameworkDocs(root)          只讀本 repo 的 Angular 用法（不需要裝本體）。本體的文件網站建置時用它。
//   exportFrameworkPatternNotes(root)  只讀本 repo 的互動原則 Angular 做法（沒有檔案時回傳 {}）。本體的文件網站建置時用它。
//   exportDocs(root)                   合併本體＋Angular 用法，格式
//                                      { components: [{ file, doc }], tokens, typography, motion, patterns, patternNotes, icons }。
//                                      本體文字裡的 #元件id 換成 Angular selector（#button → app-button）。
//                                      mendesky-web（dashboard-app）的 AI 協作索引產生器用它。回傳 Promise。
// 用法：node scripts/export-docs.mjs [repo 根目錄，預設為本 repo]（輸出合併後的 JSON）
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

export function listDocFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.docs.ts')) out.push(full);
    }
  };
  walk(path.join(root, 'src'));
  return out.sort();
}

export function loadDocFile(file) {
  const source = readFileSync(file, 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
    fileName: file,
  });
  if (diagnostics?.length) {
    const msg = diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('; ');
    throw new Error(`${file}：語法錯誤：${msg}`);
  }
  const module = { exports: {} };
  const sandboxRequire = (id) => {
    throw new Error(`${file}：說明檔只能 import type，不能在執行期 import「${id}」`);
  };
  vm.runInNewContext(outputText, { module, exports: module.exports, require: sandboxRequire }, { filename: file });
  const values = Object.values(module.exports);
  if (values.length !== 1) throw new Error(`${file}：必須剛好 export 一個說明物件，實際 ${values.length} 個`);
  // 透過 JSON 往返，去掉 vm context 的原型差異，讓呼叫端能直接 deep-equal
  return JSON.parse(JSON.stringify(values[0]));
}

/** 本 repo 的 Angular 用法說明（每個元件一筆，只有用法欄位）。本體的文件網站建置時呼叫。 */
export function exportFrameworkDocs(root) {
  return listDocFiles(root).map((file) => loadDocFile(file));
}

/** 互動原則的 Angular 做法檔案位置。 */
export function patternNotesFile(root) {
  return path.join(root, 'src', 'docs', 'pattern-notes.ts');
}

/** 本 repo 的互動原則 Angular 做法（{ 原則 key: [注意事項] }）；沒有檔案時回傳 {}。本體的文件網站建置時呼叫。 */
export function exportFrameworkPatternNotes(root) {
  const file = patternNotesFile(root);
  return existsSync(file) ? loadDocFile(file) : {};
}

/** 本體套件裝在哪裡（root 底下 node_modules 依 Node 規則解析）。 */
export function coreRoot(root) {
  const req = createRequire(path.join(root, 'package.json'));
  return path.dirname(req.resolve('@mendesky/ds/package.json'));
}

/** 不是說明文字的欄位：識別字、網址、外部參考，以及以 #元件id 當代號的相關元件／相關原則。同本體 check-docs 的 NEUTRAL_SKIP_KEYS。 */
const REF_SKIP_KEYS = new Set(['id', 'name', 'url', 'references', 'relatedComponents', 'relatedPatterns']);

/** 元件 id → Angular selector（例：button → app-button、tooltip-directive → [appTooltip]）；Angular 沒有的元件回傳 undefined。 */
export function angularNames(apis) {
  const byId = new Map(apis.map((api) => [api.id, api.selector]));
  return (id) => byId.get(id);
}

/** 把本體說明裡每段文字的 #元件id 換成 nameOf(id)；REF_SKIP_KEYS 的欄位不換。renderRefs 來自本體的 component-refs.mjs。 */
export function renderCoreRefs(value, nameOf, renderRefs) {
  if (typeof value === 'string') return renderRefs(value, nameOf);
  if (Array.isArray(value)) return value.map((v) => renderCoreRefs(v, nameOf, renderRefs));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, REF_SKIP_KEYS.has(k) ? v : renderCoreRefs(v, nameOf, renderRefs)]),
    );
  }
  return value;
}

/**
 * 本體的 #元件id 解析（本體 v0.3.0-beta.2 起隨套件發布）。
 * 讀不到就失敗：本體文字可能已經有 #元件id，沒換就交出去，使用端（AI 協作索引）會讀到 #button 而不是 app-button。
 */
export async function loadCoreRefs(core) {
  const file = path.join(core, 'scripts', 'component-refs.mjs');
  if (!existsSync(file)) {
    throw new Error(`本體缺少 ${file}：@mendesky/ds 版本太舊或沒裝好，請依 package.json 重裝 @mendesky/ds`);
  }
  return import(pathToFileURL(file).href);
}

/** 本體規格＋Angular 用法合併成一份說明：只有本體的文字換 #元件id；Angular 寫的欄位（範例程式碼可能有 #name 範本變數）原樣保留。 */
export function mergeDoc(spec, api, render) {
  return { ...render(spec), ...api };
}

export async function exportDocs(root) {
  const core = coreRoot(root);
  const { exportCoreDocs } = await import(pathToFileURL(path.join(core, 'scripts', 'export-docs.mjs')).href);
  const coreDocs = exportCoreDocs(core);
  const apis = listDocFiles(root).map((full) => ({ file: path.relative(root, full), api: loadDocFile(full) }));
  const refs = await loadCoreRefs(core);
  const nameOf = angularNames(apis.map(({ api }) => api));
  const render = (value) => renderCoreRefs(value, nameOf, refs.renderRefs);
  const specs = new Map(coreDocs.specs.map(({ spec }) => [spec.id, spec]));
  const components = apis.map(({ file, api }) => {
    const spec = specs.get(api.id);
    if (!spec) throw new Error(`${file}：本體沒有 id 為「${api.id}」的元件規格`);
    return { file, doc: mergeDoc(spec, api, render) };
  });
  return {
    components,
    tokens: render(coreDocs.tokens),
    typography: render(coreDocs.typography),
    motion: render(coreDocs.motion),
    patterns: render(coreDocs.patterns),
    patternNotes: exportFrameworkPatternNotes(root),
    icons: coreDocs.icons,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const result = await exportDocs(root);
  if (result.components.length === 0) {
    console.error(`在 ${root}/src 找不到任何 *.docs.ts`);
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
