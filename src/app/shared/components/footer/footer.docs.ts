import type { ComponentDoc } from '../../../../docs/component-doc';

export const footerDoc: ComponentDoc = {
  id: 'footer',
  name: 'Footer',
  selector: 'app-footer',
  group: '展示元件',
  summary: '（無 Input/Output）· CSS 自訂屬性：--footer-padding --footer-font-size --footer-word-break --footer-overflow-wrap',
  when: '登入頁與 Shell 共用頁尾。禁止自刻 <footer> 複製文字。',
  props: [],
  usage: [
    {
      label: '基本用法',
      code: `<!-- 基本用法 -->
<app-footer />

<!-- RWD 覆寫（在父元件 SCSS 中，不需 ::ng-deep） -->
@include bp.tablet-down {
  app-footer {
    --footer-padding: 12px 10px;
    --footer-font-size: 12px;
    --footer-word-break: keep-all;
    --footer-overflow-wrap: break-word;
  }
}`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: '全域版權頁尾，登入頁與 Shell 共用。父層可用 CSS 自訂屬性覆寫 RWD 樣式，不需 ::ng-deep。',
    },
  ],
  customTables: [
    {
      title: 'CSS 自訂屬性（父層可覆寫）',
      columns: [
        '屬性',
        '預設值',
        '說明',
      ],
      rows: [
        [
          '--footer-padding',
          '10px 10px 20px',
          '整體 padding',
        ],
        [
          '--footer-font-size',
          '1em',
          '字體大小',
        ],
        [
          '--footer-word-break',
          'normal',
          '換行規則',
        ],
        [
          '--footer-overflow-wrap',
          'normal',
          '溢出換行',
        ],
      ],
    },
  ],
};
