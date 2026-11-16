import type { ComponentApi } from '../../../../docs/component-doc';

export const inlineEditDoc: ComponentApi = {
  id: 'inline-edit',
  selector: 'app-inline-edit',
  summary: '[value] [ariaLabel] [placeholder] [size:S|M] [errorMessage] [saving] [disabled] [(editing)] · (commit: string) (cancel) (draftChange: string) — 點文字原地變輸入框，Enter 或離開就送出，Esc 放棄',
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
      desc: '有值就擋住送出：按 Enter 或離開輸入框都不發 (commit)，輸入框留著並顯示這段訊息。Esc 照樣可以放棄。通常由 (draftChange) 算出來',
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
      desc: '是否在編輯中，可以用 [(editing)] 雙向綁定。入口不在文字上（例如從選單的「重新命名」進入）時設為 true。存檔中或停用時設 true 不會打開，元件會發 (editingChange) false 把它改回來',
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
      name: '(editingChange)',
      type: 'EventEmitter<boolean>',
      desc: '進入或離開編輯時發出',
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
  (cancel)="draft.set(name())"
  (commit)="rename($event)">
</app-inline-edit>

readonly draft = signal('');
readonly error = computed(() => this.draft().trim() ? '' : '名稱不能空白');`,
    },
    {
      label: '從選單進入：只在編輯時才放上畫面',
      code: `@if (renamingId() === item.id) {
  <app-inline-edit ariaLabel="標題" [value]="item.title" [editing]="true"
    (editingChange)="$event || renamingId.set(null)"
    (commit)="rename(item.id, $event)">
  </app-inline-edit>
} @else {
  <span>{{ item.title }}</span>
}`,
    },
  ],
  usageNotes: [
    '顯示文字沿用外層的字型、字重和顏色。要粗體標題的樣子，就把字級 class 加在 app-inline-edit 或它的外層上。',
    '寬度由外層決定：給 app-inline-edit 一個 max-width，長文字會用刪節號截斷，旁邊的按鈕不會被擠掉。',
    '使用端只在編輯時才放這個元件的寫法（上面最後一個範例），收起後顯示文字不在畫面上，焦點要由使用端自己放回入口。',
    '放在會聽 Esc 關閉的視窗裡不用另外處理：輸入框裡的 Enter、Esc 已經 stopPropagation 並 preventDefault。',
  ],
};
