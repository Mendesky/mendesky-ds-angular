import type { ComponentDoc } from '../../../../docs/component-doc';

export const inlineConfirmDoc: ComponentDoc = {
  id: 'inline-confirm',
  name: 'Inline Confirm',
  selector: 'app-inline-confirm',
  group: '互動元件',
  summary: 'label / description / checkLabel · requirement: required|optional · [(confirmed)] model signal · <ng-content select="[inlineConfirmDetails]"> 投影 bullets',
  when: '前提依賴型確認（contextualInline）：父層需要使用者在主操作前先勾選「已確認 XXX」。對應 ds-patterns action.precondition-acknowledge.scenarios[0]。',
  props: [
    {
      name: 'label',
      type: 'string',
      default: '(required)',
      desc: '前提聲明主訴，宣告句式不用問句',
    },
    {
      name: 'description',
      type: 'string',
      default: 'undefined',
      desc: '補充說明（選填）',
    },
    {
      name: 'checkLabel',
      type: 'string',
      default: '(required)',
      desc: '勾選項文案，宣告句式「我已確認 XXX」',
    },
    {
      name: 'requirement',
      type: "'required' | 'optional'",
      default: "'required'",
      desc: 'required = 父層主按鈕依賴簽名；optional = 複核式，元件額外渲染「（選填）」',
    },
    {
      name: 'confirmed',
      type: 'ModelSignal<boolean>',
      default: 'false',
      desc: '雙向綁定 [(confirmed)]；父層職責：進頁面時 signal.set(false) 重置',
    },
    {
      name: 'size',
      type: "'md' | 'lg'",
      default: "'md'",
      desc: 'lg = 16px 字體 + 較大 padding，用於主要流程確認步驟',
    },
    {
      name: 'fullWidth',
      type: 'boolean',
      default: 'false',
      desc: '勾選按鈕撐滿父層寬度',
    },
    {
      name: 'hideRequiredIcon',
      type: 'boolean',
      default: 'false',
      desc: '隱藏 required 模式的 Alert icon（已有其他警示元素時使用）',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '整個元件 disabled（前置條件未滿足時）',
    },
    {
      name: 'error',
      type: 'boolean',
      default: 'false',
      desc: '驗證失敗時切換為警示色框（var(--button/error)）；各 inline-confirm 獨立綁定，不共用外框',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: "''",
      desc: '欄位驗證錯誤訊息；有值時顯示 tooltip（位置見 errorPosition，預設下方；空字串 = 不顯示）。與 error prop 通常一起使用。',
    },
    {
      name: 'errorPosition',
      type: "'top' | 'bottom'",
      default: "'bottom'",
      desc: '錯誤提示位置。欄位錯誤統一預設在下方；只有版面放不下（下方緊接其他內容會被遮住）時才改 top（2026-10-14 定案）',
    },
  ],
  usage: [
    {
      label: 'Required — 阻塞主按鈕',
      code: `<app-inline-confirm
  requirement="required"
  label="請確認事務所已承接客戶帳務帳"
  description="未確認前無法開立管理帳。"
  checkLabel="我已確認承接客戶帳務帳"
  [(confirmed)]="accounted">
</app-inline-confirm>
<app-button text="下一步" [disabled]="!accounted()"></app-button>`,
    },
    {
      label: 'Optional — 複核式（bullets 用 ng-content）',
      code: `<app-inline-confirm
  requirement="optional"
  label="成交前設定複核"
  checkLabel="我已複核以上設定"
  [(confirmed)]="reviewed">
  <ul inlineConfirmDetails>
    <li>報價金額：<strong>NT$ 120,000</strong></li>
    <li>連絡窗口：王小姐</li>
    <li>合約條款：<a href="...">標準版</a></li>
  </ul>
</app-inline-confirm>
<app-button text="確認成交"></app-button>`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: '元件不控制外部主按鈕 disabled，消費者自行 [disabled]="!confirmed()"',
    },
    {
      type: 'info',
      content: 'bullets 用 <ng-content select="[inlineConfirmDetails]"> 投影，支援超連結 / <strong> / <app-label> 等 rich markup',
    },
    {
      type: 'warn',
      content: '父層職責：離開頁面再回來必須 signal.set(false) 清空 stale state；元件不自動重置',
    },
  ],
  customTables: [
    {
      title: 'requirement 使用情境',
      columns: [
        'requirement',
        '視覺',
        '主按鈕',
        '適用場景',
      ],
      rows: [
        [
          'required',
          '淡灰底 + Alert icon + label 加重',
          '[disabled]="!confirmed()"',
          '阻塞型前提：開管理帳、簽核主檔、成案確認',
        ],
        [
          'optional',
          '透明底 + 細邊框 + 「（選填）」suffix',
          '常 enabled',
          '複核式提醒：成交前逐項 review、風險提示',
        ],
      ],
    },
  ],
};
