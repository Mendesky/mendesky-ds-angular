<script setup lang="ts">
// 連到元件說明頁（Storybook）。用 target="_self" 讓 VitePress 不把它當站內頁面攔截。
import { computed } from 'vue';
import { data } from '../../ds.data.mts';
import { componentDocsUrl } from '../links';

const props = defineProps<{ id: string }>();
const doc = computed(() => data.components.find((c: { id: string }) => c.id === props.id));
</script>

<template>
  <a v-if="doc" :href="componentDocsUrl(id)" target="_self"><code>{{ doc.selector }}</code></a>
  <code v-else class="ds-missing">#{{ id }}（找不到元件說明）</code>
</template>
