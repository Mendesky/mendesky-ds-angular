import { withBase } from 'vitepress';

/** 元件說明頁（Storybook）的網址；id 是元件說明的 id */
export function componentDocsUrl(id: string): string {
  return withBase(`/components/?path=/docs/${encodeURIComponent(id)}--${encodeURIComponent('說明')}`);
}

/** 單一範例的網址（可嵌入 iframe） */
export function storyUrl(storyId: string): string {
  return withBase(`/components/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story`);
}
