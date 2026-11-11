#!/bin/bash
# 在 GitHub Releases 建一個正式版的版本說明，內容照抄那個 tag 的訊息（git tag -a 時寫的那段話）。
# 本體文件網站的「開始使用」與「版本與升級」頁連到這個 repo 的 Releases（mendesky-ds 的 site/guide/getting-started.md、versioning.md）。
# 用法：scripts/create-release.sh <正式版 tag，例如 v0.10.0>
# 需要環境變數 GH_REPO（例如 Mendesky/mendesky-ds-angular）與 gh 的登入（Actions 裡是 GH_TOKEN）。
# 由 .github/workflows/release.yml 執行：推正式版 tag 時自動跑，也可以手動指定 tag 補建。
#   - 只收正式版 vX.Y.Z；預發布版（-beta）不建。
#   - 這一版已經有版本說明就略過，所以重跑、補建都不會重複。
#   - tag 必須是附註 tag；輕量 tag 沒有訊息，直接失敗。
#   - 只有它是目前最新的正式版時才標成 Latest；補建舊版不會搶走最新版的標記。
# 變數緊接全形標點時一律寫成 ${VAR}：macOS 內建的 bash 3.2 在 UTF-8 語系下會把全形字的位元組當成變數名稱的一部分。
# 不用 EXIT trap：bash 3.2 會讓 trap 裡最後一個指令的結束碼蓋掉原本的錯誤，失敗會被回報成成功。
# pipefail 不能拿掉：查 tag 清單失敗時，沒有它會算出空的「最新版」，把最新版建成非 Latest 還回報成功。
set -euo pipefail
TAG="${1:-}"
: "${GH_REPO:?需要 GH_REPO，例如 Mendesky/mendesky-ds-angular}"

if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "不是正式版 tag：${TAG}" >&2
  exit 1
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "${TAG} 已經有版本說明，略過"
  exit 0
fi

REF="$(gh api "repos/${GH_REPO}/git/ref/tags/${TAG}" --jq '.object.type + " " + .object.sha')"
TYPE="${REF%% *}"
SHA="${REF#* }"
if [ "$TYPE" != tag ]; then
  echo "${TAG} 不是附註 tag，沒有訊息可以當版本說明" >&2
  exit 1
fi

# 簽章過的 tag（git tag -s），API 回的訊息後面會接整段簽章；版本說明只留簽章之前的文字
NOTES="$(gh api "repos/${GH_REPO}/git/tags/${SHA}" --jq .message \
  | sed -E '/^-----BEGIN (PGP|SSH) SIGNATURE-----$/,$d')"

NEWEST="$(gh api "repos/${GH_REPO}/git/matching-refs/tags/v" --paginate --jq '.[].ref | ltrimstr("refs/tags/")' \
  | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1)"
LATEST=false
if [ "$TAG" = "$NEWEST" ]; then
  LATEST=true
fi

gh release create "$TAG" --verify-tag --title "$TAG" --notes "$NOTES" --latest="$LATEST"
echo "已建 ${TAG} 的版本說明（Latest：${LATEST}）"
