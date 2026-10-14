<script setup lang="ts">
// 列出 token。groups：要顯示的分組名稱（逗號分隔）；不給就全部。
import { computed } from 'vue';
import { data } from '../../ds.data.mts';

const props = defineProps<{ groups?: string }>();
type Token = { name: string; value: string; desc?: string };
type Group = { group: string; desc: string; tokens: Token[] };
const shown = computed<Group[]>(() => {
  const wanted = props.groups?.split(',').map((s) => s.trim()).filter(Boolean);
  return (data.tokens as Group[]).filter((g) => !wanted || wanted.includes(g.group));
});
const isColor = (t: Token) => /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(t.value);
// core.scss 的寫法含跳脫斜線（--text\/body），寫進 CSS 值時照原樣即可
</script>

<template>
  <div v-for="g in shown" :key="g.group" data-testid="token-group">
    <h4>{{ g.group }}（{{ g.desc }}）</h4>
    <table class="ds-table">
      <thead><tr><th>token</th><th>值</th><th>說明</th></tr></thead>
      <tbody>
        <tr v-for="(t, i) in g.tokens" :key="t.name + i">
          <td><code>{{ t.name }}</code></td>
          <td><span v-if="isColor(t)" class="ds-swatch" :style="{ background: t.value.startsWith('var(') ? undefined : t.value }"></span><code>{{ t.value }}</code></td>
          <td>{{ t.desc }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
