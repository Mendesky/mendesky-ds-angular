// 建版本說明（create-release.sh）的測試。用假的 gh 指令代替 GitHub，記下腳本呼叫了什麼。
//   正常：最新的正式版標成 Latest、舊版不標、內容照抄 tag 訊息、已經有就略過
//   拒絕：預發布版、輕量 tag、找不到 tag、沒給 GH_REPO，一律失敗、不建
//   自己壞掉：GitHub 拒絕建立時必須回報失敗，不得印出「已建」
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'create-release.sh');

// 假的 gh：不解讀 --jq，直接回傳 jq 之後的結果；行為由 FAKE_* 環境變數決定
const FAKE_GH = `#!/bin/bash
echo "$*" >> "$FAKE_LOG"
case "$1 $2" in
  "release view") [ -n "$FAKE_RELEASE_EXISTS" ] && exit 0 || exit 1 ;;
  "release create")
    shift 2
    while [ $# -gt 0 ]; do
      if [ "$1" = --notes ]; then printf '%s' "$2" > "$FAKE_NOTES_OUT"; fi
      shift
    done
    [ -n "$FAKE_CREATE_FAIL" ] && { echo "HTTP 422: Validation Failed" >&2; exit 1; }
    exit 0 ;;
esac
if [ "$1" = api ]; then
  case "$2" in
    */git/ref/tags/*) [ -n "$FAKE_TAG_MISSING" ] && { echo "HTTP 404: Not Found" >&2; exit 1; }
      echo "\${FAKE_TAG_TYPE:-tag} abc123" ;;
    */git/tags/abc123) printf '%s\\n' "$FAKE_MESSAGE" ;;
    */git/matching-refs/tags/v) printf '%s\\n' $FAKE_TAGS ;;
    *) echo "unexpected api call: $2" >&2; exit 9 ;;
  esac
  exit 0
fi
echo "unexpected gh call: $*" >&2
exit 9
`;

function run(tag, fake = {}, { repo = 'o/r' } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'create-release-test-'));
  const gh = path.join(dir, 'gh');
  writeFileSync(gh, FAKE_GH);
  chmodSync(gh, 0o755);
  const log = path.join(dir, 'calls.log');
  const notes = path.join(dir, 'notes.out');
  const env = {
    ...process.env,
    PATH: `${dir}:${process.env.PATH}`,
    FAKE_LOG: log,
    FAKE_NOTES_OUT: notes,
    FAKE_TAGS: 'v0.9.1 v0.10.0 v0.10.0-beta.1 v0.11.0-beta.1',
    FAKE_MESSAGE: `${tag}: something changed (#34)`,
    ...fake,
  };
  if (repo) env.GH_REPO = repo;
  else delete env.GH_REPO;
  const r = spawnSync('bash', [script, tag], { env, encoding: 'utf8' });
  const calls = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : [];
  const create = calls.find((c) => c.startsWith('release create'));
  return { code: r.status, out: r.stdout + r.stderr, calls, create, notes: existsSync(notes) ? readFileSync(notes, 'utf8') : null };
}

// ── 正常 ──

test('最新的正式版 → 建版本說明並標成 Latest，內容照抄 tag 訊息', () => {
  const r = run('v0.10.0');
  assert.equal(r.code, 0, r.out);
  assert.match(r.create, /^release create v0\.10\.0 --verify-tag --title v0\.10\.0 --notes .+ --latest=true$/);
  assert.equal(r.notes, 'v0.10.0: something changed (#34)');
  assert.match(r.out, /已建 v0\.10\.0 的版本說明（Latest：true）/);
  assert.doesNotMatch(r.out, /unbound variable/);
});

test('舊版（版號比較用數字，v0.9.1 比 v0.10.0 舊）→ 建版本說明，不標 Latest', () => {
  const r = run('v0.9.1');
  assert.equal(r.code, 0, r.out);
  assert.match(r.create, /--latest=false$/);
  assert.match(r.out, /已建 v0\.9\.1 的版本說明（Latest：false）/);
});

test('預發布版不算最新：有 v0.11.0-beta.1 時，v0.10.0 仍標 Latest', () => {
  const r = run('v0.10.0', { FAKE_TAGS: 'v0.10.0 v0.11.0-beta.1' });
  assert.match(r.create, /--latest=true$/);
});

test('多行的 tag 訊息整段照抄', () => {
  const r = run('v0.10.0', { FAKE_MESSAGE: 'v0.10.0: first line\n\nsecond paragraph' });
  assert.equal(r.notes, 'v0.10.0: first line\n\nsecond paragraph');
});

test('已經有版本說明 → 略過、不建、結束碼 0', () => {
  const r = run('v0.10.0', { FAKE_RELEASE_EXISTS: '1' });
  assert.equal(r.code, 0, r.out);
  assert.equal(r.create, undefined);
  assert.match(r.out, /v0\.10\.0 已經有版本說明，略過/);
});

// ── 拒絕 ──

test('預發布版 tag → 失敗，連 gh 都不呼叫', () => {
  const r = run('v0.10.0-beta.1');
  assert.notEqual(r.code, 0);
  assert.deepEqual(r.calls, []);
  assert.match(r.out, /不是正式版 tag：v0\.10\.0-beta\.1/);
});

test('沒給 tag → 失敗', () => {
  const r = run('');
  assert.notEqual(r.code, 0);
  assert.equal(r.create, undefined);
});

test('輕量 tag（沒有訊息）→ 失敗、不建', () => {
  const r = run('v0.10.0', { FAKE_TAG_TYPE: 'commit' });
  assert.notEqual(r.code, 0);
  assert.equal(r.create, undefined);
  assert.match(r.out, /v0\.10\.0 不是附註 tag/);
});

test('遠端找不到這個 tag → 失敗、不建', () => {
  const r = run('v0.10.0', { FAKE_TAG_MISSING: '1' });
  assert.notEqual(r.code, 0);
  assert.equal(r.create, undefined);
});

test('沒給 GH_REPO → 失敗、不建', () => {
  const r = run('v0.10.0', {}, { repo: null });
  assert.notEqual(r.code, 0);
  assert.equal(r.create, undefined);
  assert.match(r.out, /需要 GH_REPO/);
});

// ── 自己壞掉 ──

test('GitHub 拒絕建立 → 結束碼不是 0，也不印「已建」', () => {
  const r = run('v0.10.0', { FAKE_CREATE_FAIL: '1' });
  assert.notEqual(r.code, 0);
  assert.doesNotMatch(r.out, /已建/);
});
