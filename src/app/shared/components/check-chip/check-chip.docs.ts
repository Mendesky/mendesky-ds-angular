import type { ComponentDoc } from '../../../../docs/component-doc';

export const checkChipDoc: ComponentDoc = {
  id: 'check-chip',
  name: 'Check Chip',
  selector: 'app-check-chip',
  group: '互動元件',
  summary: 'text size: s|m|xs · theme: default|transparent|transparent-grey · CVA 控制 selected/isDisabled · 長文字自動折行（不撐破容器）',
  when: '篩選條件多選、標籤多選、表單內單一 boolean 偏好（如同意條款、Email 通知開關）。禁止用 checkbox 自刻。text 可為使用者自由輸入（inline-add 自訂項目）時無需額外設定——chip 預設就會折行。',
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
  notes: [
    {
      type: 'info',
      content: 'CVA：writeValue / registerOnChange / registerOnTouched / setDisabledState',
    },
    {
      type: 'info',
      content: '長文字折行是預設行為（white-space: normal + overflow-wrap: anywhere + max-width: 100%），短標籤在放得下時渲染不變。2026-08-04 起：原本的 white-space: nowrap 會讓 min-content ＝ 整串文字寬 → chip 作為 flex item 完全不可收縮 → 自由輸入的長選項（搭配 inline-add 的多選欄位）必定撐破卡片。',
    },
    {
      type: 'info',
      content: '折行的兩個必要配套（缺了只是半修好）：host 是 <button>，UA 預設 text-align: center 會讓多行文字逐行居中、難讀，故需 text-align: left；.chip 是 flex 容器，文字折行撐高時 16px checkbox icon 會被 flex-shrink 壓成橢圓，故 icon 需 flex: none。',
    },
  ],
  customTables: [
    {
      title: 'Theme 使用情境',
      columns: [
        'Theme',
        '未選中',
        '選中',
        '適用場景',
      ],
      rows: [
        [
          'default',
          '灰底（#e7e7e7）',
          '綠底白字（#74ae3e）',
          '表單多選主要用途',
        ],
        [
          'transparent',
          '透明',
          '綠字，無底色',
          '輕量標籤、緊湊篩選',
        ],
        [
          'transparent-grey',
          '透明',
          '深灰底白字（#7d7d7d）',
          '次要篩選、灰色系場景',
        ],
      ],
    },
  ],
};
