<script setup lang="ts">
import { data } from '../../ds.data.mts';
const m = data.motion;
</script>

<template>
  <h4>時長分級</h4>
  <table class="ds-table">
    <thead><tr><th>分級</th><th>時長</th><th>用在哪裡</th><th>例子</th></tr></thead>
    <tbody>
      <tr v-for="t in m.tiers" :key="t.name" data-testid="motion-row"><td>{{ t.name }}</td><td><code>{{ t.duration }}</code></td><td>{{ t.desc }}</td><td>{{ t.examples.join('、') }}</td></tr>
    </tbody>
  </table>
  <h4>緩動曲線</h4>
  <table class="ds-table">
    <thead><tr><th>用途</th><th>token</th><th>值</th><th>說明</th></tr></thead>
    <tbody>
      <tr v-for="e in [m.easing.enter, m.easing.exit]" :key="e.token"><td>{{ e.name }}</td><td><code>{{ e.token }}</code></td><td><code>{{ e.value }}</code></td><td>{{ e.desc }}</td></tr>
    </tbody>
  </table>
</template>
