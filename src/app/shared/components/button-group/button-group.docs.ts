import type { ComponentApi } from '../../../../docs/component-doc';

export const buttonGroupDoc: ComponentApi = {
  id: 'button-group',
  selector: 'app-button-group',
  summary: 'type: form|round|view · size: S|M|L · color: progress|primary|neutral（form、view）· options: ButtonGroupOption[]（可放 icon；view 的文字選項可帶 menu）· value · [disabled] errorMessage errorPosition: top|bottom · [menuOpen] (menuToggle) · (valueChange)',
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
      desc: 'form / view 皆生效。form: L≈46 / M≈36 / S≈26px；view: 按鈕 L=32 / M=28 / S=24px，外框（白底槽）再加上下各 2px，L=36 / M=32 / S=28px。只放圖示的按鈕是正方形。round 不吃 size。',
    },
    {
      name: 'color',
      type: "'progress' | 'primary' | 'neutral'",
      default: '不設（form＝progress，view＝neutral）',
      desc: '選中的底色，看這組選項拿來做什麼。progress＝綠，跟填寫進度有關的作答；form 不設就是這個。primary＝深藍 #1a6489，選了以後畫面上顯示的東西會變（例：篩掉一部分資料、換一種排法）。neutral＝深灰 #686868，只是偏好的設定（例：單位、字級）。view 不拿來作答：不設或設 progress 都是深灰。round 不吃 color。深藍、深灰選中時鍵盤焦點框是白色；強制色彩下 form、view 的選中都改用系統反白色。',
    },
    {
      name: 'options',
      type: 'ButtonGroupOption[]',
      default: '[]',
      desc: '{ value: string; label: string; disabled?: boolean; icon?: string; menu?: { hint?: string } }[]。有 icon（同 app-icon 的 name）時按鈕只放圖示，label 改當報讀名稱與滑過提示，所以 label 仍然必填。建議只在 view 用 icon。只放圖示的選項不要停用：停用的按鈕滑鼠碰不到、鍵盤停不上去，提示出不來，看畫面的人不知道它叫什麼；要停用的選項改放文字（開發模式下會在主控台提醒）。menu：這個選項帶一個選單（例：「走勢」再選畫金額或件數），只有 view 的文字選項能帶（有 icon 或不是 view 時不畫箭頭，開發模式提醒）；字後面畫 12px 箭頭，選中後再按一次是開關選單（menuToggle），沒選中時按下去照舊是選它；選中、帶選單那顆滑過比選中深一階、按下再深一階（深灰、深藍都是；強制色彩下滑過加底線、按下反白），看得出按得下去；hint 是選單目前的值，報讀念「走勢，目前：金額」、滑過提示「走勢：金額」。',
    },
    {
      name: 'menuOpen',
      type: 'boolean',
      default: 'false',
      desc: '帶選單的選項（選中那顆）的選單開著沒，由使用端管：選單開著時箭頭轉向、aria-expanded="true"，整組的滑過提示收起（提示和選單都往下出，不收會疊在一起）。',
    },
    {
      name: '(menuToggle)',
      type: 'EventEmitter<boolean>',
      desc: '按了選中、帶選單的那顆（滑鼠、Enter 或空白鍵；按住不放的連發不算）：true＝要打開、false＝要關上，依 menuOpen 決定。選單由使用端放：app-action-menu 一定要用 [anchorEl]="group.menuAnchor()" 對齊選中那顆（元件的公開方法；沒有這顆時是 null），按這顆時才不會被當成點選單外面而先關掉、接著又被打開。這一下 click 不往外冒，Enter 也不往外冒（放在 wizard 裡不會同時觸發 onFormEnter）；其他選項照常。選單開著時 value 被改掉（包括改成另一個帶選單的選項），或這顆沒了資格（整組或這一項停用），元件送 false。按下空白鍵或 Enter 後到放開前的連發、放開那一下都會被吃掉，焦點移進選單後不會點到第一項。',
      isOutput: true,
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
      desc: '整組禁用。選項只放圖示時不要整組停用，理由同 options。',
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
    {
      label: 'form：篩選資料，選中深藍',
      code: `<app-button-group
  type="form" size="M" color="primary"
  [options]="[
    { value: '7d', label: '近 7 天' },
    { value: '30d', label: '近 30 天' },
    { value: 'all', label: '全部' },
  ]"
  [value]="range"
  (valueChange)="range = $event"
></app-button-group>`,
    },
    {
      label: 'view：帶選單的選項（選中後再按開選單）',
      code: `<app-button-group #group
  type="view" size="S"
  [options]="[
    { value: 'cards', label: '合計' },
    { value: 'dist', label: '分布', menu: { hint: metric === 'amount' ? '金額' : '件數' } },
    { value: 'trend', label: '走勢', menu: { hint: metric === 'amount' ? '金額' : '件數' } },
  ]"
  [value]="view" (valueChange)="view = $event"
  [menuOpen]="menuOpen" (menuToggle)="menuOpen = $event"
></app-button-group>
@if (menuOpen) {
  <app-action-menu [anchorEl]="group.menuAnchor()" ariaLabel="畫金額或件數" (closeMenu)="menuOpen = false">
    <app-menu-item label="金額" [selected]="metric === 'amount'" (itemClick)="metric = 'amount'"></app-menu-item>
    <app-menu-item label="件數" [selected]="metric === 'count'" (itemClick)="metric = 'count'"></app-menu-item>
  </app-action-menu>
}`,
    },
    {
      label: 'view：只放圖示、選中深藍',
      code: `<app-button-group
  type="view" size="M" color="primary"
  [options]="[
    { value: 'list', label: '清單', icon: 'Table' },
    { value: 'kanban', label: '看板', icon: 'Kanban' },
  ]"
  [value]="mode"
  (valueChange)="mode = $event"
></app-button-group>`,
    },
  ],
};
