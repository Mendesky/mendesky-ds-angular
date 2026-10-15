import type { ComponentDoc } from '../../../../docs/component-doc';

export const optionCardDoc: ComponentDoc = {
  id: 'option-card',
  name: 'Option Card',
  selector: 'app-option-card',
  group: '表單元件',
  summary: '[value] [label] [description] [illustration]: SVG string · [selected] [disabled] — 四態（rest 全彩插圖 / hover 浮起+插圖↔說明 crossfade 150ms / selected 填色+check / disabled 灰階）',
  when: '單張可選插圖卡。一般不單獨使用，由 app-option-card-group 組成互斥群組（radiogroup）。hover 揭露純 CSS、無 JS；prefers-reduced-motion 下停用動效。',
  props: [
    {
      name: 'value',
      type: 'string',
      default: 'required',
      desc: '此卡代表的值（選取時由 group emit）',
    },
    {
      name: 'label',
      type: 'string',
      default: 'required',
      desc: '卡片主標題',
    },
    {
      name: 'description',
      type: 'string',
      default: "''",
      desc: 'hover 時淡入取代插圖的說明文字；空字串則不渲染說明區、hover 不做 crossfade',
    },
    {
      name: 'illustration',
      type: 'string (SVG)',
      default: "''",
      desc: '120×120 inline SVG 字串，元件內 sanitize 後以 innerHTML 注入',
    },
    {
      name: 'selected',
      type: 'boolean',
      default: 'false',
      desc: '選中態（填色 + check 角標）',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '停用態（灰階 + not-allowed，不可選取）',
    },
    {
      name: '(cardSelect)',
      type: 'EventEmitter<void>',
      desc: '點選（滑鼠點擊、Enter、Space）且非 disabled 時觸發',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '由 group 組成（不單獨使用）',
      code: `<app-option-card-group
  [options]="cards"
  [value]="selected"
  (valueChange)="onSelect($event)">
</app-option-card-group>`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: 'hover 揭露為純 CSS（插圖 opacity→0、說明 opacity→1，150ms crossfade）；無 JS、無 description 時不切換。',
    },
    {
      type: 'info',
      content: 'rest 態插圖目前為全彩；selected 填色採 --button/action-lighter（淡藍）。',
    },
  ],
  customTables: [],
};
