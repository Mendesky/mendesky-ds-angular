import type { ComponentDoc } from '../../../../docs/component-doc';

export const optionCardGroupDoc: ComponentDoc = {
  id: 'option-card-group',
  name: 'Option Card Group',
  selector: 'app-option-card-group',
  group: '表單元件',
  summary: 'options: OptionCardItem[] · value · ariaLabel · [disabledValues]: string[] · (valueChange) — role=radiogroup、方向鍵 roving focus、@for track value',
  when: '一組互斥的插圖選擇卡（帳務類型 / 客戶設立現況等）。取代散落各處手刻的 .at-grid + onAtGridKeydown 鍵盤 handler。',
  props: [
    {
      name: 'options',
      type: 'OptionCardItem[]',
      default: '[]',
      desc: '卡片資料 { value; label; description?; illustration?; disabled? }',
    },
    {
      name: 'value',
      type: 'string | null',
      default: 'null',
      desc: '目前選中的 value（完全受控，元件不持有內部選取狀態）',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: 'radiogroup 的 aria-label',
    },
    {
      name: 'disabledValues',
      type: 'string[]',
      default: '[]',
      desc: '額外停用的 value（疊加在 option.disabled 之上，供集團配額 / 境外規則等情境）',
    },
    {
      name: '(valueChange)',
      type: 'EventEmitter<string>',
      desc: '選取啟用卡片時 emit 其 value；停用卡片不 emit',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '帳務類型（含手機 fallback）',
      code: `<!-- Desktop / Tablet：卡片 -->
<app-option-card-group
  class="at-card-group"
  ariaLabel="帳務類型"
  [options]="accountTypeOptions"
  [value]="selectedAccountType"
  [disabledValues]="disabledAccountTypeValues"
  (valueChange)="onAccountTypeSelect($event)">
</app-option-card-group>

<!-- Mobile：app-select fallback（卡片在 tablet-down 隱藏，consumer 必配） -->
<div class="at-mobile-select">
  <app-select [options]="enabledOptions" [ngModel]="selectedAccountType"
    (ngModelChange)="onAccountTypeSelect($event)"></app-select>
</div>`,
    },
  ],
  notes: [
    {
      type: 'warning',
      content: '群組在 tablet-down 會 display:none（由 consumer 的 .at-card-group + scss 斷點規則控制）→ 每個 consumer 都必須額外配一個 app-select 作手機 fallback，否則手機完全無法選取。（設立現況曾因漏此導致手機無法選。）',
    },
    {
      type: 'info',
      content: '完全受控元件：只吃 [value]、只 emit (valueChange)，不持有內部選取狀態。父層取消變更時直接保持 value 不變即可讓卡片還原（app-select fallback 因點選即內部 set value，取消需 remount 還原）。',
    },
    {
      type: 'info',
      content: '方向鍵 ←/↑/→/↓ 在啟用卡片間 roving focus（wrap）；@for track option.value 避免重複 key NG0955。',
    },
  ],
  customTables: [],
};
