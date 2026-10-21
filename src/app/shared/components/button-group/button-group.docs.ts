import type { ComponentApi } from '../../../../docs/component-doc';

export const buttonGroupDoc: ComponentApi = {
  id: 'button-group',
  selector: 'app-button-group',
  summary: 'type: form|round|view · size: S|M|L · options: ButtonGroupOption[] · value · [disabled] errorMessage errorPosition: top|bottom · (valueChange)',
  props: [
    {
      name: 'type',
      type: 'ButtonGroupType',
      default: "'form'",
      desc: 'form | round | view',
    },
    {
      name: 'size',
      type: "'S' | 'M' | 'L'",
      default: "'L'",
      desc: 'form / view 皆生效。form: L≈46 / M≈36 / S≈26px；view: L=32 / M=28 / S=24px（外框高度）。round 不吃 size。',
    },
    {
      name: 'options',
      type: 'ButtonGroupOption[]',
      default: '[]',
      desc: '{ value: string; label: string }[]',
    },
    {
      name: 'value',
      type: 'string | null',
      default: 'null',
      desc: '目前選中的值，搭配 [(value)] 雙向綁定',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '整組禁用',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: "''",
      desc: '非空時顯示 error 狀態（僅 form 有效）',
    },
    {
      name: 'errorPosition',
      type: "'top' | 'bottom'",
      default: "'bottom'",
      desc: '錯誤 tooltip 顯示方向（浮動，不佔版面）',
    },
    {
      name: '(valueChange)',
      type: 'EventEmitter<string>',
      desc: '選項改變時輸出新值',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-button-group
  type="form"
  [options]="[{value:'a', label:'選項A'}, {value:'b', label:'選項B'}]"
  [(value)]="selectedValue"
  errorMessage="請至少選擇一項"
></app-button-group>`,
    },
  ],
};
