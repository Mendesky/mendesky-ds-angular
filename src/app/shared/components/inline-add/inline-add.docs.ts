import type { ComponentApi } from '../../../../docs/component-doc';

export const inlineAddDoc: ComponentApi = {
  id: 'inline-add',
  selector: 'app-inline-add',
  summary: '[buttonText] [placeholder] [size:S|M] · (add: string) — ghost 觸發鈕原地變 inline 輸入框，Enter 提交',
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
      code: `<div class="chip-wrap">
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
};
