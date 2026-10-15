// 匯出 DS 的全部說明（正本）成 JSON：元件說明（src/**/*.docs.ts）、基礎（token、字型、動效）、互動原則。
//
// 用途：mendesky-web（dashboard-app）的索引產生器呼叫它；也用來對帳說明內容。
// 用法：node scripts/export-docs.mjs [repo 根目錄，預設為本 repo]
// 輸出：stdout 一個 JSON 物件 { components: [{ file, doc }], tokens, typography, motion, patterns }。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

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

export function exportDocs(root) {
  const components = listDocFiles(root).map((full) => ({ file: path.relative(root, full), doc: loadDocFile(full) }));
  const docs = path.join(root, 'src', 'docs');
  return {
    components,
    tokens: loadDocFile(path.join(docs, 'foundations', 'tokens.ts')),
    typography: loadDocFile(path.join(docs, 'foundations', 'typography.ts')),
    motion: loadDocFile(path.join(docs, 'foundations', 'motion.ts')),
    patterns: loadDocFile(path.join(docs, 'patterns.ts')),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const result = exportDocs(root);
  if (result.components.length === 0) {
    console.error(`在 ${root}/src 找不到任何 *.docs.ts`);
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
