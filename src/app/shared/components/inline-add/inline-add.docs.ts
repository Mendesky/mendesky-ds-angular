import type { ComponentApi } from '../../../../docs/component-doc';

export const inlineAddDoc: ComponentApi = {
  id: 'inline-add',
  selector: 'app-inline-add',
  summary: '[buttonText] [placeholder] [ariaLabel] [size:S|M] · (add: string) — ghost 觸發鈕原地變 inline 輸入框，Enter 提交',
  props: [
    {
      name: 'buttonText',
      type: 'string',
      default: "'＋ 新增其他項目'",
      desc: '觸發鈕文字',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'輸入後按 Enter'",
      desc: 'inline 輸入框 placeholder',
    },
    {
      name: 'size',
      type: "'S' | 'M'",
      default: "'S'",
      desc: '尺寸，對齊相鄰 chip / button',
    },
    {
      name: '(add)',
      type: 'EventEmitter<string>',
      desc: 'Enter 提交時 emit trim 後的非空字串；去重 / 加入清單 / 勾選由父層處理',
      isOutput: true,
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '停用觸發鈕（權限控管用）',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: '輸入框的報讀名稱；放在有標題的 app-field 裡時設成欄位標題，不設時報讀軟體只念提示文字。要寫 ariaLabel，不要寫 aria-label：aria-label 會留在外框上，輸入框還是沒有名稱。',
    },
  ],
  usage: [
    {
      label: 'chip 群組新增自訂項',
      code: `<app-field label="從哪裡得知這項活動">
  <div class="chip-wrap">
    @for (opt of options(); track opt) {
      <app-check-chip [text]="opt" [(ngModel)]="checked[opt]"></app-check-chip>
    }
    <!-- 內層輸入框不會念外層欄位標題，用 ariaLabel 設成欄位標題 -->
    <app-inline-add ariaLabel="從哪裡得知這項活動" (add)="addCustom($event)"></app-inline-add>
  </div>
</app-field>

// 父層：去重 + 加入清單 + 勾選（展示櫃原則，資料留在父層）
addCustom(name: string) {
  if (this.options().includes(name)) return;
  this.options.update(l => [...l, name]);
  this.onToggle(name, true); // 自動勾選 + fire API（optimistic）
}`,
    },
  ],
};
