import type { ComponentDoc } from '../../../../docs/component-doc';

export const numberInputDoc: ComponentDoc = {
  id: 'number-input',
  name: 'Number Input',
  selector: 'app-number-input',
  group: '表單元件',
  summary: 'size: S|M|L · placeholder decimalPlaces min max step initialValue suffix errorMessage errorPosition: top|bottom · [disabled] [allowEmpty] · (valueChange: number|null) · (valueCommit: number|null)',
  when: '金額、數量等數字欄位。有加減鍵與格式化。',
  props: [
    {
      name: 'size',
      type: 'NumberInputSize',
      default: "'L'",
      desc: "'S' | 'M' | 'L'",
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'0'",
      desc: '佔位文字',
    },
    {
      name: 'decimalPlaces',
      type: 'number',
      default: '0',
      desc: '小數位數（0 = 整數）',
    },
    {
      name: 'min',
      type: 'number | null',
      default: 'null',
      desc: '最小值；null = 無限制；離焦後自動 Clamp',
    },
    {
      name: 'max',
      type: 'number | null',
      default: 'null',
      desc: '最大值；null = 無限制；離焦後自動 Clamp',
    },
    {
      name: 'step',
      type: 'number',
      default: '1',
      desc: '↑↓ 步距；Shift+↑↓ 為 step×10',
    },
    {
      name: 'initialValue',
      type: 'number | null',
      default: 'null',
      desc: '初始值（ngOnChanges 監聽，外部可響應式更新）',
    },
    {
      name: 'suffix',
      type: 'string',
      default: "''",
      desc: '數字後方的單位標籤，例如 "%" 或 "元"；空字串時隱藏',
    },
    {
      name: 'allowEmpty',
      type: 'boolean',
      default: 'true',
      desc: 'false = 必填欄位不可清空：隱藏清除鈕，且鍵盤刪空後 blur 自動還原為上次值（畫面永遠等於後端）。用於後端無法持久化空值的欄位（如必填的金額）',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '禁用狀態',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: "''",
      desc: '錯誤訊息；有值時切換 error 狀態',
    },
    {
      name: 'errorPosition',
      type: "'top' | 'bottom'",
      default: "'bottom'",
      desc: '錯誤 tooltip 顯示方向（浮動，不佔版面）',
    },
    {
      name: '(valueChange)',
      type: 'EventEmitter<number | null>',
      desc: '值即時變更（每次 step / 打字 / 清空皆 emit）；用於即時計算總和顯示',
      isOutput: true,
    },
    {
      name: '(valueCommit)',
      type: 'EventEmitter<number | null>',
      desc: '使用者完成輸入後才 emit（debounce 600ms）；打 API 請接這個，不要接 (inputBlur)。觸發時機：⑴ 連點/連按 ↑↓ → 600ms 後 ⑵ 失焦（blur flush）⑶ 元件銷毀（destroy flush）⑷ clearValue → 立即 emit null。',
      isOutput: true,
    },
    {
      name: '(inputBlur)',
      type: 'EventEmitter<void>',
      desc: '純失焦事件（focus 離開元件）。不再用於 commit；commit 請接 (valueCommit)',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法（接 valueCommit 打 API）',
      code: `<app-number-input
  size="L"
  placeholder="0"
  [min]="0"
  [max]="9999"
  [step]="1"
  (valueChange)="onQtyChange($event)"
  (valueCommit)="onQtyCommit($event)"
></app-number-input>`,
    },
    {
      label: '只需即時顯示（不打 API）',
      code: `<app-number-input
  size="M"
  [initialValue]="discountValue()"
  (valueChange)="discountValue.set($event)"
></app-number-input>`,
    },
  ],
  notes: [],
  customTables: [],
};
