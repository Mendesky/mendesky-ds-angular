// 補舊版文件：文件網站出現之前的正式版（tag 裡沒有 site/）沒有指南與元件頁可建，
// 改成每版發布一頁「該版 tag 當時的 README」，並加進 versions.json（標 legacy: true）。
// 版本選單與根目錄轉址會認 legacy：切過去時開該版首頁，根目錄不轉到 legacy 版。
//
// 用法：在 gh-pages 分支的工作目錄上執行，執行完自行 commit、push。
//   git clone --depth 1 --branch gh-pages <repo> <工作目錄>
//   node scripts/build-legacy-docs.mjs <工作目錄>
// 只需要跑一次；之後的正式版由 docs-release 工作流程建完整文件。
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_URL = 'https://github.com/Mendesky/mendesky-ds-angular';
const STABLE = /^v(\d+)\.(\d+)\.(\d+)$/;

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });

function semverDesc(a, b) {
  const pa = a.match(STABLE).slice(1).map(Number);
  const pb = b.match(STABLE).slice(1).map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pb[i] - pa[i];
  return 0;
}

function hasSite(tag) {
  return git('ls-tree', '--name-only', tag).split('\n').includes('site');
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function renderPage(tag, date, readme) {
  const md = new MarkdownIt({ html: false, linkify: true });
  return `<!doctype html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mendesky Design System ${tag}</title>
  <style>
    :root { --bg: #fff; --fg: #1f2328; --muted: #59636e; --line: #d1d9e0; --code: #f6f8fa; --note: #fff8c5; --link: #19779f; }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #0d1117; --fg: #e6edf3; --muted: #9198a1; --line: #3d444d; --code: #151b23; --note: #3a3000; --link: #4fb3dc; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.7 -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", "PingFang TC", sans-serif; }
    header { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--line); }
    header strong { font-size: 15px; }
    header select { height: 30px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--fg); padding: 0 6px; font-size: 13px; }
    main { max-width: 860px; margin: 0 auto; padding: 24px 16px 64px; }
    .note { background: var(--note); border: 1px solid var(--line); border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; }
    a { color: var(--link); }
    pre { background: var(--code); padding: 12px 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9em; }
    :not(pre) > code { background: var(--code); padding: 0.1em 0.35em; border-radius: 4px; }
    table { border-collapse: collapse; display: block; overflow-x: auto; }
    th, td { border: 1px solid var(--line); padding: 6px 12px; }
    h1, h2, h3 { line-height: 1.3; }
    h1, h2 { border-bottom: 1px solid var(--line); padding-bottom: 0.3em; }
  </style>
</head>
<body>
  <header>
    <strong>Mendesky Design System</strong>
    <select id="version" aria-label="文件版本"><option value="${tag}" selected>${tag}（僅 README）</option></select>
  </header>
  <main>
    <p class="note">${tag}（${date}）發布時還沒有文件網站，這裡保留的是該版 tag 當時的 README。
      原始碼：<a href="${REPO_URL}/tree/${tag}">${tag}</a>。</p>
    ${md.render(readme)}
  </main>
  <script>
    // 版本選單：讀網站根目錄的 versions.json；切換時開該版首頁
    (function () {
      var current = ${JSON.stringify(tag)};
      var select = document.getElementById('version');
      fetch('../versions.json', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; })
        .then(function (list) {
          var all = [{ version: 'main' }].concat(list);
          if (!all.some(function (v) { return v.version === current; })) all.push({ version: current, legacy: true });
          select.innerHTML = '';
          all.forEach(function (v) {
            var opt = document.createElement('option');
            opt.value = v.version;
            opt.textContent = v.version === 'main' ? 'main（開發中）' : v.version + (v.legacy ? '（僅 README）' : '');
            if (v.version === current) opt.selected = true;
            select.appendChild(opt);
          });
        });
      select.addEventListener('change', function () { location.href = '../' + select.value + '/'; });
    })();
  </script>
</body>
</html>
`;
}

const outDir = process.argv[2];
if (!outDir || !existsSync(path.join(outDir, '.git'))) {
  console.error('用法：node scripts/build-legacy-docs.mjs <gh-pages 工作目錄>');
  process.exit(1);
}

const legacy = git('tag', '-l', 'v*')
  .split('\n')
  .filter((t) => STABLE.test(t) && !hasSite(t))
  .sort(semverDesc);

for (const tag of legacy) {
  const readme = git('show', `${tag}:README.md`);
  const date = git('log', '-1', '--format=%cs', tag).trim();
  mkdirSync(path.join(outDir, tag), { recursive: true });
  writeFileSync(path.join(outDir, tag, 'index.html'), renderPage(escapeHtml(tag), date, readme));
  console.log(`已產生 /${tag}/`);
}

// 合併進 versions.json：保留已發布的完整版本，legacy 版本覆寫，整份依版號新到舊
const file = path.join(outDir, 'versions.json');
const existing = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
const merged = [
  ...existing.filter((v) => !legacy.includes(v.version)),
  ...legacy.map((version) => ({ version, legacy: true })),
].sort((a, b) => semverDesc(a.version, b.version));
writeFileSync(file, JSON.stringify(merged, null, 2) + '\n');
console.log(`versions.json：${merged.map((v) => v.version).join(', ')}`);
