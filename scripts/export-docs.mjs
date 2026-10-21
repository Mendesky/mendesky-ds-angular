// 匯出元件說明成 JSON。說明分兩份，以 id 對應：
//   - Angular 用法（本 repo 各元件旁邊的 *.docs.ts）：selector、屬性、事件、範例程式碼
//   - 元件規格、基礎（token、字型、動效）、互動原則、圖示：在本體套件 @mendesky/ds
//
// 兩個出口：
//   exportFrameworkDocs(root)  只讀本 repo 的 Angular 用法（不需要裝本體）。本體的文件網站建置時用它。
//   exportDocs(root)           合併本體＋Angular 用法，格式 { components: [{ file, doc }], tokens, typography, motion, patterns, icons }。
//                              mendesky-web（dashboard-app）的 AI 協作索引產生器用它。回傳 Promise。
// 用法：node scripts/export-docs.mjs [repo 根目錄，預設為本 repo]（輸出合併後的 JSON）
import { readFileSync, readdirSync, statSync } from 'node:fs';
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

/** 本體套件裝在哪裡（root 底下 node_modules 依 Node 規則解析）。 */
export function coreRoot(root) {
  const req = createRequire(path.join(root, 'package.json'));
  return path.dirname(req.resolve('@mendesky/ds/package.json'));
}

export async function exportDocs(root) {
  const core = coreRoot(root);
  const { exportCoreDocs } = await import(pathToFileURL(path.join(core, 'scripts', 'export-docs.mjs')).href);
  const coreDocs = exportCoreDocs(core);
  const specs = new Map(coreDocs.specs.map(({ spec }) => [spec.id, spec]));
  const components = listDocFiles(root).map((full) => {
    const file = path.relative(root, full);
    const api = loadDocFile(full);
    const spec = specs.get(api.id);
    if (!spec) throw new Error(`${file}：本體沒有 id 為「${api.id}」的元件規格`);
    return { file, doc: { ...spec, ...api } };
  });
  return {
    components,
    tokens: coreDocs.tokens,
    typography: coreDocs.typography,
    motion: coreDocs.motion,
    patterns: coreDocs.patterns,
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
