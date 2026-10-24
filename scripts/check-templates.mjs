// 元件 template 型別檢查。
// tsc 看不懂 Angular template；template 寫錯，要等 dashboard-app、platform-console 換版編譯才會壞。
// 這支用 Angular 編譯器、跟兩個消費端相同的嚴格選項，編譯 src 底下的元件與指令（不輸出檔案），有錯就列出位置並失敗。
// 自我防呆（檢查器自己壞掉時不能報「通過」）：嚴格選項被關掉、有元件或指令沒被納入、src 找不到任何元件，都直接失敗。
// 用法：node scripts/check-templates.mjs [repo 根目錄]
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PROJECT = 'tsconfig.templates.json';
// 跟 dashboard-app、platform-console 的 tsconfig.json angularCompilerOptions 一致
export const REQUIRED_FLAGS = ['strictTemplates', 'strictInjectionParameters', 'strictInputAccessModifiers'];

export function listDeclarations(srcDir) {
  return readdirSync(srcDir, { recursive: true })
    .filter((file) => /\.(component|directive)\.ts$/.test(file))
    .map((file) => path.join(srcDir, file));
}

async function loadCompiler(repo) {
  const require = createRequire(path.join(repo, 'package.json'));
  return import(pathToFileURL(require.resolve('@angular/compiler-cli')).href);
}

const fail = (problem) => ({ ok: false, checked: 0, problems: [problem] });

export async function checkTemplates(repo, { project = PROJECT } = {}) {
  const ngc = await loadCompiler(repo);
  const config = ngc.readConfiguration(path.join(repo, project));
  if (config.errors.length) return fail(ngc.formatDiagnostics(config.errors));

  const loosened = REQUIRED_FLAGS.filter((flag) => config.options[flag] !== true);
  if (loosened.length) return fail(`檢查設定被放寬：${loosened.join('、')} 必須是 true，跟 dashboard-app、platform-console 一致`);

  const declarations = listDeclarations(path.join(repo, 'src'));
  if (!declarations.length) return fail('src 底下找不到任何元件或指令，等於沒有檢查');
  const roots = new Set(config.rootNames.map((file) => path.resolve(file)));
  const missing = declarations.filter((file) => !roots.has(path.resolve(file)));
  if (missing.length) {
    return fail(`這些元件或指令沒被納入檢查（看 ${project} 的 include／exclude）：\n${missing.map((file) => `  ${path.relative(repo, file)}`).join('\n')}`);
  }

  const { diagnostics } = ngc.performCompilation({ rootNames: config.rootNames, options: { ...config.options, noEmit: true } });
  const errors = diagnostics.filter((d) => d.category === 1); // ts.DiagnosticCategory.Error
  return { ok: errors.length === 0, checked: declarations.length, problems: errors.length ? [ngc.formatDiagnostics(errors)] : [] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repo = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const result = await checkTemplates(repo);
  if (result.ok) console.log(`元件 template 檢查通過：${result.checked} 個元件與指令`);
  else {
    console.error(result.problems.join('\n'));
    process.exitCode = 1;
  }
}
