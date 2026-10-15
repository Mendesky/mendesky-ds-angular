<script setup lang="ts">
// 依分組列出元件與用途（用途取自元件說明的 when）。
import { computed } from 'vue';
import { data } from '../../ds.data.mts';
import { componentDocsUrl } from '../links';

const props = defineProps<{ group?: string }>();
const rows = computed(() =>
  data.components
    .filter((c: { group: string }) => !props.group || c.group === props.group)
    .map((c: { id: string; selector: string; when?: string }) => ({ ...c, whenText: (c.when ?? '').replace(/\*\*/g, '') })),
);
</script>

<template>
  <table class="ds-table">
    <thead><tr><th>元件</th><th>什麼時候用</th></tr></thead>
    <tbody>
      <tr v-for="c in rows" :key="c.id" data-testid="component-row">
        <td><a :href="componentDocsUrl(c.id)" target="_self"><code>{{ c.selector }}</code></a></td>
        <td>{{ c.whenText }}</td>
      </tr>
    </tbody>
  </table>
</template>
