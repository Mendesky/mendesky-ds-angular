import type { ComponentApi } from '../../../../docs/component-doc';

export const footerDoc: ComponentApi = {
  id: 'footer',
  selector: 'app-footer',
  summary: '（無 Input/Output）· CSS 自訂屬性：--footer-padding --footer-font-size --footer-word-break --footer-overflow-wrap',
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
  usageNotes: [
    {
      type: 'info',
      content: '父層在自己的 SCSS 對 app-footer 設定 --footer-* CSS 自訂屬性即可覆寫 RWD 樣式，不需 ::ng-deep。',
    },
  ],
};
