<script setup lang="ts">
// 導覽列的版本選單：讀網站根目錄的 versions.json（發布流程維護），切換到同一頁的其他版本。
import { onMounted, ref } from 'vue';
import { useData } from 'vitepress';

const { theme } = useData();
const current = theme.value.docsVersion as string;
const options = ref<string[]>([]);
// 文件網站出現前的舊版只有一頁 README（legacy），切過去時開該版首頁
const legacy = ref<Set<string>>(new Set());
// base 形如 /mendesky-ds-angular/v0.1.12/；上一層是網站根目錄
const base = import.meta.env.BASE_URL;
const siteRoot = base.replace(/[^/]+\/$/, '');

onMounted(async () => {
  if (current === 'dev') return; // 本機開發沒有版本
  let list: { version: string; legacy?: boolean }[] = [];
  try {
    const res = await fetch(`${siteRoot}versions.json`, { cache: 'no-store' });
    if (res.ok) list = await res.json();
  } catch {
    /* 讀不到就只顯示目前版本 */
  }
  legacy.value = new Set(list.filter((v) => v.legacy).map((v) => v.version));
  const versions = ['main', ...list.map((v) => v.version)];
  if (!versions.includes(current)) versions.push(current);
  options.value = versions;
});

function go(event: Event): void {
  const next = (event.target as HTMLSelectElement).value;
  const rel =
    !legacy.value.has(next) && location.pathname.startsWith(base) ? location.pathname.slice(base.length) : '';
  location.href = `${siteRoot}${next}/${rel}${location.hash}`;
}
</script>

<template>
  <div v-if="options.length" class="ds-version">
    <select aria-label="文件版本" data-testid="version-switcher" :value="current" @change="go">
      <option v-for="v in options" :key="v" :value="v">{{ v === 'main' ? 'main（開發中）' : legacy.has(v) ? `${v}（僅 README）` : v }}</option>
    </select>
  </div>
</template>
