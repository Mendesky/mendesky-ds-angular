import type { ComponentApi } from '../../../../docs/component-doc';

export const menuItemDoc: ComponentApi = {
  id: 'menu-item',
  selector: 'app-menu-item',
  summary: 'label（必填）· description · icon · tone: neutral|danger · [disabled] · [selected]: boolean|null（null＝一般動作）· (itemClick) · 文字後面可投影 app-label',
  props: [
    {
      name: 'label',
      type: 'string',
      desc: '這一項要做什麼，或代表哪一個值。必填。',
    },
    {
      name: 'description',
      type: 'string',
      default: "''",
      desc: '顯示在文字下方的說明。有值時文字變成粗體標題（一般項目是深色，tone 是 danger 時維持紅字），說明用淺灰色；內層按鈕用 aria-describedby 指向它，不算進名稱。空字串不顯示。',
    },
    {
      name: 'icon',
      type: 'string',
      default: "''",
      desc: '文字左邊的圖示，填 DS 圖示名稱（例如 Trash-Del、Archive）。顏色跟著文字走，報讀軟體不念。空字串不顯示。',
    },
    {
      name: 'tone',
      type: 'MenuItemTone',
      default: "'neutral'",
      desc: "'neutral' | 'danger'。danger 是紅字的危險動作，滑過、按下跟 ghost 危險按鈕一樣。",
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '停用。內層按鈕用 aria-disabled="true"，不用原生 disabled，所以在選單裡方向鍵還停得到；點了、按 Enter 都不會發 itemClick，選單也不會關。',
    },
    {
      name: 'selected',
      type: 'boolean | null',
      default: 'null',
      desc: '不設（null）是一般動作；設成 true／false 就是一組單選裡的一個值，true 是選中（深藍實心底）。在 app-action-menu 裡輸出 role="menuitemradio" 與 aria-checked；在選單外輸出 aria-pressed。',
    },
    {
      name: '(itemClick)',
      type: 'EventEmitter<void>',
      desc: '點一下，或焦點在上面時按 Enter、空白鍵就會觸發；停用時不觸發。',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '從幾個值裡選一個（排序選單）：觸發鈕標 ariaHaspopup、ariaExpanded，選單用 ariaLabel 取名',
      code: `<div class="sort-wrap">
  <app-button variant="ghost" color="neutral" size="S" text="排序"
    ariaHaspopup="menu" [ariaExpanded]="sortOpen()"
    (btnClick)="sortOpen.set(!sortOpen())"></app-button>

  @if (sortOpen()) {
    <app-action-menu ariaLabel="排序" (closeMenu)="sortOpen.set(false)">
      @for (opt of sortOptions; track opt.value) {
        <app-menu-item [label]="opt.label" [selected]="sort() === opt.value"
          (itemClick)="sort.set(opt.value)"></app-menu-item>
      }
      <app-divider role="separator"></app-divider>
      <app-menu-item label="還原預設" (itemClick)="sort.set('newest')"></app-menu-item>
    </app-action-menu>
  }
</div>`,
    },
    {
      label: '執行動作的選單：圖示、停用、危險動作',
      code: `<app-action-menu ariaLabel="更多操作" (closeMenu)="moreOpen.set(false)">
  <app-menu-item label="編輯項目" icon="Edit" (itemClick)="edit()"></app-menu-item>
  <app-menu-item label="封存項目" icon="Archive" [disabled]="!canArchive()" (itemClick)="archive()"></app-menu-item>
  <app-menu-item label="刪除項目" icon="Trash-Del" tone="danger" (itemClick)="remove()"></app-menu-item>
</app-action-menu>`,
    },
    {
      label: '文字後面放標籤（自訂內容）',
      code: `<app-menu-item [label]="item.name" (itemClick)="open(item.id)">
  <app-label color="Grey70" size="XXS" [text]="item.typeLabel"></app-label>
  @if (item.archived) {
    <app-label color="LightWhite" size="XXS" text="已封存"></app-label>
  }
</app-menu-item>`,
    },
    {
      label: '放在選單外的一組單選（篩選視窗的排序區）：外層標成群組並給名稱',
      code: `<div role="group" aria-label="排序">
  @for (opt of sortOptions; track opt.value) {
    <app-menu-item [label]="opt.label" [selected]="sort() === opt.value"
      (itemClick)="sort.set(opt.value)"></app-menu-item>
  }
</div>`,
    },
  ],
  usageNotes: [
    'app-menu-item 透過注入（MENU_CONTEXT）找外層的 app-action-menu 登記：直接寫在 app-action-menu 的內容裡（包在 @if、@for、*ngFor 裡也可以），那個動作選單就變成選單模式；寫在 app-action-menu 外面就是選單外的單選按鈕。只找同一個範本：寫在你自己元件範本裡的 app-menu-item，就算那個元件被放進 app-action-menu，也一樣是選單外的按鈕，不會把外面的浮層變成選單；用 ViewContainerRef.createComponent 或 NgComponentOutlet 動態建立的也一樣。',
    {
      type: 'warn',
      content: '要聽 (itemClick)，不要在 app-menu-item 上聽 (click)。停用的項目沒有用原生 disabled，裡面按鈕的 click 事件照樣會冒到外框，(click) 在停用時也會觸發。',
    },
    '投影進來的 app-label 用 LightWhite 時，字色來自 CSS 變數 --text/body-light。滑過、按下、選中時元件會把這個變數改成淺色，所以標籤字會跟著變白；其他寫死顏色的自訂內容不會變。',
    '文字後面的自訂內容放在內層按鈕裡、沒有 aria-hidden，報讀軟體會把它接在 label 後面一起念進名稱，例如「項目 C 圖片 已封存」。',
  ],
};
