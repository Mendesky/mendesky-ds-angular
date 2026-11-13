import type { ComponentApi } from '../../../../docs/component-doc';

export const spinnerDoc: ComponentApi = {
  id: 'spinner',
  selector: 'app-spinner',
  summary: "size: 12|16|24|36 · label · [decorative]",
  props: [
    {
      name: 'size',
      type: "'12' | '16' | '24' | '36'",
      default: "'16'",
      desc: '寬高（px），對齊圖示尺寸。線寬依序 1.5、2、2.5、3',
    },
    {
      name: 'label',
      type: 'string',
      default: "'載入中'",
      desc: '給報讀軟體念的文字，畫面上看不到',
    },
    {
      name: 'decorative',
      type: 'boolean',
      default: 'false',
      desc: '旁邊已經有文字在講同一件事時設 true：整個轉圈加 aria-hidden，沒有 role="status"，也沒有報讀文字',
    },
  ],
  usage: [
    {
      label: '旁邊有說明文字（轉圈設成裝飾用）',
      code: `<span class="saving">
  <app-spinner size="16" [decorative]="true"></app-spinner>
  儲存中…
</span>`,
    },
    {
      label: '畫面上只有轉圈（報讀軟體念 label）',
      code: `<app-spinner size="24" label="正在讀取清單"></app-spinner>`,
    },
    {
      label: '深色底：改外層文字色，轉圈跟著變',
      code: `<div style="background:#535353;color:#ffffff;">
  <app-spinner size="16" [decorative]="true"></app-spinner>
  更新中…
</div>`,
    },
  ],
  usageNotes: [
    '按鈕在等結果時，用 app-button 或 app-icon-btn 的 `loading`，不要自己把 app-spinner 放進按鈕。',
    '顏色跟著外層的 `color`：弧是文字色，軌道是同色 20%。',
  ],
};
