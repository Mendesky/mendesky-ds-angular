import type { ComponentDoc } from '../docs/component-doc';

export const dsCollapseDoc: ComponentDoc = {
  id: 'ds-collapse',
  name: 'DS Collapse 收合動畫',
  group: '工具',
  selector: '.ds-collapse',
  when: '內容區塊需要收合／展開動畫時用（例如可展開的卡片段落）。統一用這組 class，不要自己寫 height 動畫。',
  description: `CSS Grid \`0fr → 1fr\` 收合/展開工具 class。Component tier 300ms，進出場共用 ease-out curve。
所有需要「內容區塊收合/展開」動畫的元件，統一用這組做法。`,
  props: [
    {
      name: 'container',
      type: 'class',
      default: '.ds-collapse',
      description: '動畫外殼，負責 grid-template-rows transition',
    },
    {
      name: 'inner',
      type: 'class',
      default: '.ds-collapse__inner',
      description: '內層，設置 overflow: hidden 讓 grid 收合時確實裁切內容',
    },
    {
      name: 'expanded',
      type: 'modifier',
      default: '.ds-collapse--expanded',
      description: '套用此 class 展開；移除則收合',
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<div class="ds-collapse" [class.ds-collapse--expanded]="isExpanded">
  <div class="ds-collapse__inner">
    <!-- 可收合的內容 -->
  </div>
</div>`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: '元件也可用自己的 class 名稱（如 .contact-content），只需沿用相同 CSS Grid 動畫方式',
    },
    {
      type: 'info',
      content: 'Component tier: 300ms var(--ease-enter)（cubic-bezier(0.215, 0.61, 0.355, 1)）',
    },
    {
      type: 'info',
      content: 'DS 內目前套用：stepper 導覽的子項收合（stepper-nav-subitems）。使用端的可收合卡片也用同一組 class。',
    },
  ],
};
