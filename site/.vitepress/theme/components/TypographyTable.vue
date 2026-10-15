<script setup lang="ts">
// 列出字型 class 與範例（文件網站沒有載入 DS 樣式，範例用說明裡的字重與字級畫出）。
import { data } from '../../ds.data.mts';
</script>

<template>
  <div v-for="f in data.typography" :key="f.family">
    <h4>{{ f.family }}</h4>
    <p>{{ f.role }} · <code>{{ f.cssVar }}</code></p>
    <table class="ds-table">
      <thead><tr><th>class</th><th>字重</th><th>字級</th><th>範例</th></tr></thead>
      <tbody>
        <tr v-for="c in f.classes" :key="c.name" data-testid="type-row">
          <td><code>{{ c.name }}</code></td>
          <td>{{ c.weight }}</td>
          <td>{{ c.size }}<span v-if="c.sizeNote">（{{ c.sizeNote }}）</span></td>
          <td :style="{ fontWeight: c.weight, fontSize: c.size, fontFamily: f.family.includes('Mono') ? 'Roboto Mono, monospace' : 'Noto Sans TC, sans-serif' }">設計系統 0123</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
