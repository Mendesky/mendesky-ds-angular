import type { ComponentApi } from '../../../../docs/component-doc';

export const inlineEditDoc: ComponentApi = {
  id: 'inline-edit',
  selector: 'app-inline-edit',
  summary: '[value] [ariaLabel] [placeholder] [size:S|M] [errorMessage] [saving] [disabled] [(editing)] · (commit: string) (cancel) (closed: key|blur) (draftChange: string) — 點文字原地變輸入框，Enter 或離開就送出，Esc 放棄',
  props: [
    {
      name: 'value',
      type: 'string',
      default: "''",
      desc: '目前的值，由使用端持有。收到 (commit) 存好之後，把新值給回來',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: '這段文字是什麼，例如「名稱」。一律要設：顯示時按鈕念成「編輯名稱，目前是…」，編輯時輸入框的名稱就是它。不要寫成「編輯名稱」，「編輯」元件會自己加。要寫 ariaLabel，不要寫 aria-label',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "''",
      desc: 'value 是空的時候顯示的提示文字，也是輸入框的提示文字',
    },
    {
      name: 'size',
      type: "'S' | 'M'",
      default: "'S'",
      desc: '輸入框尺寸。顯示文字的最小高度跟著它（S 32px、M 36px），切換時那一列不會跳',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: "''",
      desc: '有值就擋住送出：按 Enter 或離開輸入框都不發 (commit)，輸入框留著並顯示這段訊息，報讀軟體也會念出這段訊息。Esc 照樣可以放棄。通常由 (draftChange) 算出來',
    },
    {
      name: 'saving',
      type: 'boolean',
      default: 'false',
      desc: '使用端正在存檔。顯示剛送出的文字加轉圈，這段時間進不了編輯，報讀軟體念「<ariaLabel>儲存中」；變回 false 後顯示 value。先換值、失敗才退回的使用端不用設',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '停用：文字照常顯示，點了沒反應',
    },
    {
      name: 'editing',
      type: 'boolean',
      default: 'false',
      desc: '是否在編輯中，可以用 [(editing)] 雙向綁定。入口不在文字上（例如從選單的「重新命名」進入）時設為 true。存檔中或停用時設 true 不會打開，元件會發 (editingChange) false 把它改回來（一建立就是 true 也一樣）',
    },
    {
      name: '(commit)',
      type: 'EventEmitter<string>',
      desc: 'Enter 或離開輸入框時發出去頭尾空白後的字串。跟 value 相同（含只差頭尾空白）不發。空字串會發，要擋就用 errorMessage',
      isOutput: true,
    },
    {
      name: '(cancel)',
      type: 'EventEmitter<void>',
      desc: '按 Esc 放棄時發出',
      isOutput: true,
    },
    {
      name: '(draftChange)',
      type: 'EventEmitter<string>',
      desc: '輸入框內容每次變動時發出目前的字串（沒有去空白）',
      isOutput: true,
    },
    {
      name: '(closed)',
      type: "EventEmitter<'key' | 'blur'>",
      desc: '編輯收起時發出收起的原因：key 是按 Enter 或 Esc，blur 是焦點離開輸入框（點到別處、按 Tab）。內容沒變也會發。排在 (commit)、(cancel) 之後、(editingChange) 之前',
      isOutput: true,
    },
    {
      name: '(editingChange)',
      type: 'EventEmitter<boolean>',
      desc: '進入或離開編輯時發出。離開時排在 (commit)、(cancel)、(closed) 之後，是最後一個',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '先換值、失敗才退回',
      code: `<app-inline-edit ariaLabel="名稱" [value]="name()" (commit)="rename($event)"></app-inline-edit>

async rename(next: string) {
  const previous = this.name();
  this.name.set(next);                 // 畫面先換
  try {
    await this.api.rename(next);
  } catch {
    this.name.set(previous);           // 失敗退回，並告訴使用者
    this.toast.show({ type: 'error', message: '名稱儲存失敗' });
  }
}`,
    },
    {
      label: '等伺服器成功才換值：用 saving',
      code: `<app-inline-edit ariaLabel="名稱" [value]="name()" [saving]="saving()" (commit)="rename($event)"></app-inline-edit>

async rename(next: string) {
  this.saving.set(true);               // 顯示剛送出的文字加轉圈
  try {
    await this.api.rename(next);
    this.name.set(next);
  } catch {
    this.toast.show({ type: 'error', message: '名稱儲存失敗' });
  } finally {
    this.saving.set(false);            // 失敗時 value 沒變，顯示會回到原值
  }
}`,
    },
    {
      label: '擋不合格的內容',
      code: `<app-inline-edit ariaLabel="名稱" [value]="name()"
  [errorMessage]="error()"
  (draftChange)="draft.set($event)"
  (editingChange)="draft.set(name())"
  (commit)="rename($event)">
</app-inline-edit>

// 進入編輯時元件不會發 draftChange，所以進入與離開時都把草稿設回目前的值；
// 不然一打開就帶著上一次的錯誤，或還沒打字就顯示「不能空白」
readonly draft = signal(this.name());
readonly error = computed(() => this.draft().trim() ? '' : '名稱不能空白');`,
    },
    {
      label: '從選單進入：只在編輯時才放上畫面',
      code: `@if (renamingId() === item.id) {
  <app-inline-edit ariaLabel="標題" [value]="item.title" [editing]="true"
    (commit)="rename(item.id, $event)"
    (closed)="onRenameClosed(item.id, $event)">
  </app-inline-edit>
} @else {
  <span>{{ item.title }}</span>
}

onRenameClosed(id: string, reason: 'key' | 'blur') {
  this.renamingId.set(null);
  // 按 Enter／Esc 收起：輸入框被拿掉，焦點沒有地方去，放回入口（等畫面換回一般的樣子再放）。
  // 點到別處收起：焦點已經在使用者點的地方，不要搶
  if (reason === 'key') requestAnimationFrame(() => this.focusMenuButton(id));
}`,
    },
  ],
  usageNotes: [
    '顯示文字沿用外層的字型、字重和顏色。要粗體標題的樣子，就把字級 class 加在 app-inline-edit 或它的外層上。',
    '寬度由外層決定：給 app-inline-edit 一個 max-width，長文字會用刪節號截斷，旁邊的按鈕不會被擠掉。',
    '輸入框的寬度：給了 app-inline-edit 寬度（width）就填滿它；沒給就用輸入框自己的寬度，最窄 160px；外層比 160px 還窄時跟著外層縮。',
    'saving 是給「送出之後」用的。編輯中把 saving 設為 true，輸入框不會自己收起；要鎖住就同時把 editing 設為 false。',
    '值是空的又沒給 placeholder 時，顯示文字仍留 40px 寬可以點。能給 placeholder 就給，使用者才知道這裡有東西可以填。',
    '使用端只在編輯時才放這個元件的寫法（上面最後一個範例），收起後顯示文字不在畫面上，焦點要由使用端自己放回入口。看 (closed) 的原因：key 才放，blur 不放。不要用「焦點是不是在 body」來判斷：使用者點空白處、或在 Safari 點按鈕時，焦點也在 body，照這個判斷會把焦點搶走。',
    '輸入框裡的 Enter、Esc 與用來進入編輯的那一下 Enter、空白鍵都不往外傳。',
    '放在會聽 Esc 關閉的視窗裡不用另外處理：輸入框裡的 Enter、Esc 已經 stopPropagation 並 preventDefault；收起之後同一個鍵按住不放的連發，元件會在 document 上吃掉，直到放開為止。使用端把元件拿掉之後也一樣。',
    '切到別的視窗或分頁不算離開輸入框：不送出，留在編輯中，回來時焦點還在輸入框。',
    '編輯中 value 被使用端換掉（例如別人改了同一筆）時，輸入框改顯示新值，使用者打到一半的字會被換掉。',
  ],
};
