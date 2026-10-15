#!/bin/bash
# 把一個版本的完整文件網站（指南＋元件頁）發布到 gh-pages 分支的 <版本資料夾>/，其他版本原樣保留。
# 同時更新網站根目錄的轉址頁；正式版另外加進 versions.json（依版號新到舊）。
# 用法：scripts/publish-pages.sh <建好的網站目錄> <版本資料夾：main 或 v1.2.3> [要加入 versions.json 的版本]
# 在 GitHub Actions 裡執行（用工作流程的 token 推送）。
set -euo pipefail
BUILD_DIR="$(cd "$1" && pwd)"
TARGET="$2"
ADD_VERSION="${3:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
# 推送目標：Actions 裡用工作流程的 token
if [ -n "${GH_TOKEN:-}" ] && [ -n "${GITHUB_REPOSITORY:-}" ]; then
  REMOTE="https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
else
  REMOTE="$(git -C "$ROOT" remote get-url origin)"
fi

if git ls-remote --exit-code --heads "$REMOTE" gh-pages >/dev/null 2>&1; then
  git clone --quiet --depth 1 --branch gh-pages "$REMOTE" "$WORK"
else
  git init --quiet "$WORK"
  git -C "$WORK" checkout --quiet --orphan gh-pages
  git -C "$WORK" remote add origin "$REMOTE"
fi
git -C "$WORK" config user.name "github-actions[bot]"
git -C "$WORK" config user.email "41898282+github-actions[bot]@users.noreply.github.com"

rm -rf "${WORK:?}/$TARGET"
mkdir -p "$WORK/$TARGET"
cp -R "$BUILD_DIR/." "$WORK/$TARGET/"
cp "$ROOT/site/root/index.html" "$WORK/index.html"
touch "$WORK/.nojekyll"
[ -f "$WORK/versions.json" ] || echo "[]" > "$WORK/versions.json"

if [ -n "$ADD_VERSION" ]; then
  node -e '
    const fs = require("fs"); const file = process.argv[1]; const v = process.argv[2];
    const list = JSON.parse(fs.readFileSync(file, "utf8"));
    // 依版號新到舊排（重新發布舊版時不會跑到最前面）
    const num = (s) => s.slice(1).split(".").map(Number);
    const desc = (a, b) => { const x = num(a.version), y = num(b.version); return y[0] - x[0] || y[1] - x[1] || y[2] - x[2]; };
    const next = [{ version: v }, ...list.filter((x) => x.version !== v)].sort(desc);
    fs.writeFileSync(file, JSON.stringify(next, null, 2) + "\n");
  ' "$WORK/versions.json" "$ADD_VERSION"
fi

cd "$WORK"
git add -A
if git diff --cached --quiet; then
  echo "gh-pages 沒有變化"
  exit 0
fi
git commit --quiet -m "Publish ${TARGET} from ${GITHUB_SHA:-local}"
git push --quiet origin gh-pages
echo "已發布 /${TARGET}/"
