import type { ComponentDoc } from '../../../../docs/component-doc';

export const inlineAddDoc: ComponentDoc = {
  id: 'inline-add',
  name: 'Inline Add',
  selector: 'app-inline-add',
  group: '互動元件',
  summary: '[buttonText] [placeholder] [size:S|M] · (add: string) — ghost 觸發鈕原地變 inline 輸入框，Enter 提交',
  when: '在 chip 群組 / 清單尾端讓使用者新增「自訂項」。取代 native window.prompt；單行文字輸入不要在 modal 內再疊 dialog。',
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
  ],
  usage: [
    {
      label: 'chip 群組新增自訂項',
      code: `<div class="cem-chip-wrap">
  @for (opt of options(); track opt) {
    <app-check-chip [text]="opt" [(ngModel)]="checked[opt]"></app-check-chip>
  }
  <app-inline-add (add)="addCustom($event)"></app-inline-add>
</div>

// 父層：去重 + 加入清單 + 勾選（展示櫃原則，資料留在父層）
addCustom(name: string) {
  if (this.options().includes(name)) return;
  this.options.update(l => [...l, name]);
  this.onToggle(name, true); // 自動勾選 + fire API（optimistic）
}`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: '展示櫃原則：本元件只管「輸入 affordance」，不持有清單 / 勾選。去重、加入清單、勾選由父層 (add) handler 處理。',
    },
    {
      type: 'info',
      content: '互動：僅 Enter 提交；Esc / blur 一律取消（最不意外）。輸入態 keydown 已 stopPropagation，不會被 chip 群組方向鍵 roving focus 攔截。',
    },
  ],
  customTables: [],
};
