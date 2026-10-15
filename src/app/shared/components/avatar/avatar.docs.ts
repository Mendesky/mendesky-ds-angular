import type { ComponentDoc } from '../../../../docs/component-doc';

export const avatarDoc: ComponentDoc = {
  id: 'avatar',
  name: 'Avatar',
  selector: 'app-avatar',
  group: '展示元件',
  summary: 'propClass: Text|Thumb|Icon · [size]: 28|36|44|56|64|96|128|240 · src text iconName [clickable] ariaLabel',
  when: '用戶頭像、個人資料。可點擊（例如右上角打開個人面板）時設 [clickable]="true" 並給 ariaLabel，點擊綁在外層 (click)。',
  props: [
    {
      name: 'propClass',
      type: "'Text' | 'Thumb' | 'Icon'",
      desc: '文字縮寫（取第1字）/ 圖片縮圖 / icon 符號',
    },
    {
      name: 'size',
      type: 'number',
      desc: '28 | 36 | 44 | 56 | 64 | 96 | 128 | 240（px）',
    },
    {
      name: 'text',
      type: 'string',
      desc: 'Text 模式：顯示文字（自動取前1字）',
    },
    {
      name: 'src',
      type: 'string',
      desc: 'Thumb 模式：圖片 URL',
    },
    {
      name: 'iconName',
      type: 'string',
      desc: 'Icon 模式：icon 名稱',
    },
    {
      name: 'clickable',
      type: 'boolean',
      default: 'false',
      desc: '可點擊：根元素改為 <button>（鍵盤可聚焦、Enter／空白鍵觸發、鍵盤聚焦時顯示主色外框），含 hover／press 效果。點擊綁在外層 (click) 即可（v0.1.8 起）',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: '可點擊時給報讀軟體的名稱；未提供時用 text（v0.1.8 起）',
    },
    {
      name: 'bgColor',
      type: 'string',
      default: "''",
      desc: '自訂背景色（Text／Icon 模式）；有值時覆蓋預設底色',
    },
  ],
  usage: [
    {
      label: '各模式用法',
      code: `<app-avatar propClass="Text"  [size]="96" text="陳安安"></app-avatar>
<app-avatar propClass="Thumb" [size]="44" src="..." [clickable]="true" ariaLabel="個人面板" (click)="open()"></app-avatar>
<app-avatar propClass="Icon"  [size]="36" iconName="User"></app-avatar>`,
    },
  ],
  notes: [
    '可點擊頭像不要再外包 div 或自己加 role="button"／tabindex：設 [clickable]="true" 就是原生按鈕。',
  ],
  customTables: [],
};
