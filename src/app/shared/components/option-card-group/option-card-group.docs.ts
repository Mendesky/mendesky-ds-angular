import type { ComponentApi } from '../../../../docs/component-doc';

export const optionCardGroupDoc: ComponentApi = {
  id: 'option-card-group',
  selector: 'app-option-card-group',
  summary: 'options: OptionCardItem[] · value · ariaLabel · [disabledValues]: string[] · (valueChange) — role=radiogroup、方向鍵 roving focus、@for track value',
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
      desc: '額外停用的 value（疊加在 option.disabled 之上，供名額已滿 / 條件不符等情境）',
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
      label: '版面樣式（含手機 fallback）',
      code: `<!-- Desktop / Tablet：卡片 -->
<app-option-card-group
  class="layout-card-group"
  ariaLabel="版面樣式"
  [options]="layoutOptions"
  [value]="selectedLayout"
  [disabledValues]="disabledLayoutValues"
  (valueChange)="onLayoutSelect($event)">
</app-option-card-group>

<!-- Mobile：app-select fallback（卡片在 tablet-down 隱藏，consumer 必配） -->
<div class="layout-mobile-select">
  <app-select [options]="enabledOptions" [ngModel]="selectedLayout"
    (ngModelChange)="onLayoutSelect($event)"></app-select>
</div>`,
    },
  ],
};
