import type { ComponentApi } from '../../../../docs/component-doc';

export const checkChipDoc: ComponentApi = {
  id: 'check-chip',
  selector: 'app-check-chip',
  summary: 'text size: s|m|xs · theme: default|transparent|transparent-grey · CVA 控制 selected/isDisabled · 長文字自動折行（不撐破容器）',
  props: [
    {
      name: 'text',
      type: 'string',
      default: "''",
      desc: '顯示文字；長內容自動折行（見 notes）',
    },
    {
      name: 'size',
      type: 'CheckChipSize',
      default: "'s'",
      desc: "'m' | 's' | 'xs'",
    },
    {
      name: 'theme',
      type: 'CheckChipTheme',
      default: "'default'",
      desc: "'default' | 'transparent' | 'transparent-grey'",
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: 'template 直接 disable（權限 gating 用；CVA setDisabledState 之外的 additive 入口）',
    },
  ],
  usage: [
    {
      label: '多選群組（ReactiveForm）',
      code: `<app-check-chip
  text="台北"
  theme="default"
  size="s"
  formControlName="taipei"
></app-check-chip>`,
    },
    {
      label: 'NgModel 雙向綁定',
      code: `<app-check-chip
  text="已完成"
  theme="transparent-grey"
  [(ngModel)]="filterDone"
></app-check-chip>`,
    },
  ],
  usageNotes: [
    {
      type: 'info',
      content: 'app-check-chip 實作 ControlValueAccessor（writeValue／registerOnChange／registerOnTouched／setDisabledState），可用 ngModel 或 formControlName 綁定。',
    },
  ],
};
