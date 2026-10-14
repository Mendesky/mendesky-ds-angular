// 建置時讀 DS 的說明正本（元件說明、token、字型、動效、互動原則、圖示名稱），給指南頁的元件使用。
// 指南不另抄規則：表格與原則內容都從這裡顯示，正本改了指南跟著變。
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { exportDocs } from '../../scripts/export-docs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function iconNames(): string[] {
  const text = readFileSync(path.join(root, 'src/app/shared/components/icon/icon.registry.ts'), 'utf8');
  const body = text.slice(text.indexOf('ICON_REGISTRY'));
  return [...new Set([...body.matchAll(/^\s*(?:'([^']+)'|([A-Za-z][\w-]*))\s*:\s*`/gm)].map((m) => m[1] ?? m[2]))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export default {
  watch: ['../../src/**/*.docs.ts', '../../src/docs/**/*.ts', '../../src/app/shared/components/icon/icon.registry.ts'],
  load() {
    const ds = exportDocs(root);
    return {
      components: ds.components.map((c: { file: string; doc: unknown }) => c.doc),
      tokens: ds.tokens,
      typography: ds.typography,
      motion: ds.motion,
      patterns: ds.patterns,
      icons: iconNames(),
    };
  },
};
