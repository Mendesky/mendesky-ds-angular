import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent, DocPreviewComponent, DocPreviewItem } from '../../../../index';

// 說明：
// - 元件是全螢幕浮層（ngAfterViewInit 會把自己搬到 document.body），所以說明頁改用 iframe 呈現每個範例
//   （docs.story.inline = false），否則浮層會蓋住整個說明頁。
// - 不連網路：圖片一律用 data URL 的小 SVG（中性佔位圖），不放真實檔案。
// - PDF 需要真實檔案才能渲染，這裡只示範「預覽失敗」狀態：餵一段不是 PDF 的資料，元件會走錯誤卡片。
// - docs / startIndex 只在元件初始化時讀取，範例用 @for 的 track key 在這兩個值改變時重建元件，
//   Controls 調整後才看得到效果；實際使用時直接綁定即可（見「程式碼範例」）。

/** A4 比例的中性佔位頁（SVG data URL） */
const placeholderPage = (label: string): string =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">` +
      `<rect width="595" height="842" fill="#ffffff"/>` +
      `<rect x="56" y="72" width="300" height="20" rx="4" fill="#d0d0d0"/>` +
      `<rect x="56" y="120" width="483" height="12" rx="4" fill="#e7e7e7"/>` +
      `<rect x="56" y="144" width="483" height="12" rx="4" fill="#e7e7e7"/>` +
      `<rect x="56" y="168" width="360" height="12" rx="4" fill="#e7e7e7"/>` +
      `<text x="297.5" y="460" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#939393">${label}</text>` +
      `</svg>`,
  );

const imageDocs: DocPreviewItem[] = [
  { name: '範例圖片-1.svg', url: placeholderPage('範例圖片 1'), mimeType: 'image/svg+xml' },
  { name: '範例圖片-2.svg', url: placeholderPage('範例圖片 2'), mimeType: 'image/svg+xml' },
  { name: '範例圖片-3.svg', url: placeholderPage('範例圖片 3'), mimeType: 'image/svg+xml' },
];

/** 刻意不是 PDF 的內容：用來觸發「預覽失敗，請改用下載」錯誤卡片，不需要真實檔案 */
const brokenPdf: DocPreviewItem = {
  name: '範例文件.pdf',
  url: 'data:application/pdf;charset=utf-8,' + encodeURIComponent('這不是 PDF 內容'),
  mimeType: 'application/pdf',
};

const meta: Meta<DocPreviewComponent> = {
  title: '浮層元件/Doc Preview 文件預覽',
  id: 'doc-preview',
  component: DocPreviewComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 520 },
      source: {
        code: `@if (previewOpen()) {
  <app-doc-preview
    [docs]="attachments()"
    [startIndex]="clickedIndex()"
    (closed)="previewOpen.set(false)"
  />
}`,
      },
    },
  },
  argTypes: {
    docs: {
      control: 'object',
      description: "必填。DocPreviewItem[]：{ name, url, mimeType? }；mimeType === 'application/pdf' 或檔名結尾 .pdf 走 PDF 渲染，其餘當圖片",
      table: { defaultValue: { summary: '[]' } },
    },
    startIndex: {
      control: { type: 'number', min: 0 },
      description: '初始顯示第幾份（0 起算）',
      table: { defaultValue: { summary: '0' } },
    },
    closed: { action: 'closed', description: '按 ESC 或點背景時 emit；父層負責把元件移除' },
  },
  args: {
    docs: imageDocs,
    startIndex: 0,
  },
  render: (args) => ({
    props: {
      ...args,
      open: true,
      remountKey: JSON.stringify([args.docs, args.startIndex]),
    },
    template: `
      @if (open) {
        @for (k of [remountKey]; track k) {
          <app-doc-preview
            [docs]="docs"
            [startIndex]="startIndex"
            (closed)="open = false; closed()">
          </app-doc-preview>
        }
      } @else {
        <div style="padding:24px;">
          <app-button variant="outlined" size="S" text="重新開啟預覽" (btnClick)="open = true"></app-button>
        </div>
      }
    `,
    moduleMetadata: { imports: [DocPreviewComponent, ButtonComponent] },
  }),
};

export default meta;
type Story = StoryObj<DocPreviewComponent>;

// ── 主範例：多份圖片，可前後切換；Controls 可調 docs / startIndex ──
export const Default: Story = {
  name: '預設（多份圖片）',
};

// ── 單份：不顯示前後切換鈕 ───────────────────────────────────────
export const Single: Story = {
  name: '單份（只有下載鈕）',
  args: { docs: [imageDocs[0]], startIndex: 0 },
};

// ── 從使用者點的那一份開啟 ───────────────────────────────────────
export const StartFromSecond: Story = {
  name: '從第 2 份開啟（startIndex = 1）',
  args: { docs: imageDocs, startIndex: 1 },
};

// ── 錯誤狀態：PDF 解析失敗 ───────────────────────────────────────
export const PdfError: Story = {
  name: '錯誤狀態：PDF 預覽失敗（不含真實 PDF）',
  args: { docs: [brokenPdf], startIndex: 0 },
};
