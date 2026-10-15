<script setup lang="ts">
// 嵌入一支元件範例（可操作）。storyId 例如 button--default。
import { storyUrl } from '../links';

withDefaults(defineProps<{ id: string; height?: number; title?: string }>(), { height: 220, title: '元件範例' });
</script>

<template>
  <iframe class="ds-story" :src="storyUrl(id)" :height="height" :title="title" loading="lazy"></iframe>
</template>
