import type { ComponentApi } from '../../../../docs/component-doc';

export const collapsibleDoc: ComponentApi = {
  id: 'collapsible',
  selector: 'app-collapsible',
  summary: 'title（必填）· appearance: section|card|accent · chevronPosition: start|end · [disabled] · headingLevel: 1-6 · [(expanded)] · 投影 collapsibleLeading / collapsiblePrefix / collapsibleMeta / collapsibleSummary / collapsibleTrailing＋內容',
  props: [
    {
      name: 'title',
      type: 'string',
      default: "''",
      desc: '標題文字，放在標題按鈕裡，報讀軟體會念。必填。元件會拿掉 host 上的原生 title 屬性，滑過整個區塊不會跳出瀏覽器提示。',
    },
    {
      name: 'appearance',
      type: "'section' | 'card' | 'accent'",
      default: "'section'",
      desc: "外觀。section 是頁面上的大段落（灰底整條、標題粗體）；card 是卡片或清單項目的標頭（沒有底色、滑過淺灰）；accent 是可以拖曳排序的段落（綠底白字）。",
    },
    {
      name: 'chevronPosition',
      type: "'start' | 'end'",
      default: "'start'",
      desc: '箭頭位置。start 在標題左邊；end 在標題按鈕的最右邊（摘要後面）。同一頁用同一邊。',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '停用。點了、按 Enter 或空白鍵都不開合，維持原來的開合；標題按鈕輸出 aria-disabled="true"，還停得到。',
    },
    {
      name: 'headingLevel',
      type: '1 | 2 | 3 | 4 | 5 | 6 | null',
      default: 'null',
      desc: '標題層級。有值時標題按鈕外面包一層 role="heading"，aria-level 就是這個值；null 不包。',
    },
    {
      name: 'expanded',
      type: 'boolean',
      default: 'false',
      desc: '是否展開。用 [(expanded)] 雙向綁定時由頁面控制；只給初值或不綁時，元件自己記使用者的開合。',
    },
    {
      name: '(expandedChange)',
      type: 'EventEmitter<boolean>',
      desc: '開合改變時觸發，帶出新的狀態：使用者點標題按鈕、按 Enter 或空白鍵，以及 app-collapsible-group 設了 single 而把這一段收起來。頁面自己改 expanded 不觸發。',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法：頁面上的大段落，元件自己記開合',
      code: `<app-collapsible title="第一段" [expanded]="true">
  <!-- 第一段的內容 -->
</app-collapsible>
<app-collapsible title="第二段">
  <!-- 第二段的內容 -->
</app-collapsible>`,
    },
    {
      label: '前置與尾端：勾選框放前置、選單放尾端，點它們不會開合；數量與摘要放在標題按鈕裡',
      code: `<app-collapsible appearance="card" title="項目 A" [(expanded)]="itemOpen">
  <app-checkbox collapsibleLeading size="s" [checked]="picked" ariaLabel="選取項目 A"
    (checkedChange)="picked = $event"></app-checkbox>
  <app-label collapsibleMeta text="3 項"></app-label>
  <span collapsibleSummary>收合時的一行摘要</span>
  <app-icon-btn collapsibleTrailing size="16" propClass="SectionBtn" ariaLabel="更多操作">
    <app-icon name="More" size="16"></app-icon>
  </app-icon-btn>
  <!-- 項目 A 的內容 -->
</app-collapsible>`,
    },
    {
      label: '頁面控制：驗證有錯時把那一段打開',
      code: `<app-collapsible title="第一段" [(expanded)]="firstOpen">…</app-collapsible>

// 驗證有錯時
firstOpen = true;`,
    },
  ],
  usageNotes: [
    '投影的位置用屬性指定：collapsibleLeading（前置區）、collapsiblePrefix（標題前面）、collapsibleMeta（標題後面）、collapsibleSummary（靠右的摘要）、collapsibleTrailing（尾端區）。沒有屬性的內容放進展開後的內容區。',
    'collapsiblePrefix、collapsibleMeta、collapsibleSummary 在原生 button 裡面，只能放文字、app-label、app-icon 這類不能點的東西。要點的放 collapsibleLeading 或 collapsibleTrailing。',
    {
      type: 'warn',
      content: '頁面要控制開合時用 [(expanded)]，不要只用 [expanded]。只綁單向時，使用者收起來之後頁面的值還是 true；頁面再設 true，Angular 認為值沒變，不會重新打開。',
    },
    '綠色外觀的尾端放 app-icon-btn 時，元件把圖示改成白色、平時透明底，滑過是白色淡底，propClass 用 SectionBtn 就好。',
    '內容區用全域的 .ds-collapse，要載入本體的 core.scss 才有開合轉場與收合時的裁切。',
  ],
};
