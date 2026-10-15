#!/bin/bash
# 建一個版本的完整文件網站：指南（VitePress）＋元件頁（Storybook，放在 components/ 底下）。
# 輸出：site/.vitepress/dist
# 用法：scripts/build-site.sh <版本資料夾：main 或 v0.1.12>
#   DOCS_REPO_BASE  網站在網域下的根路徑，預設 /mendesky-ds-angular/（GitHub Pages）；本機預覽可設 /
set -euo pipefail
cd "$(dirname "$0")/.."
FOLDER="${1:-main}"
export DOCS_BASE="${DOCS_REPO_BASE:-/mendesky-ds-angular/}${FOLDER}/"
export DOCS_VERSION="$FOLDER"
npx vitepress build site
CI=true npx ng run ds:build-storybook --output-dir site/.vitepress/dist/components < /dev/null
echo "已建置 ${DOCS_BASE} → site/.vitepress/dist"
