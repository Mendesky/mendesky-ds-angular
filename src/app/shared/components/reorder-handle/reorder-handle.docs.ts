import type { ComponentApi } from '../../../../docs/component-doc';

export const reorderHandleDoc: ComponentApi = {
  id: 'reorder-handle',
  selector: 'app-reorder-handle',
  summary: 'label · index · count · appearance: default|inverse · disabled · (move): ReorderMoveEvent',
  props: [
    { name: 'label', type: 'string', default: "''", desc: '項目的完整名稱，必填。報讀念「移動『名稱』」，不要截斷' },
    { name: 'index', type: 'number', default: '0', desc: '這個項目目前在第幾個（從 0 起），必填' },
    { name: 'count', type: 'number', default: '0', desc: '清單共幾個項目，必填。小於 2 時握把停用' },
    { name: 'appearance', type: "'default' | 'inverse'", default: "'default'", desc: '預設：白底用的灰色圖示（淺灰底上對比不足，不要用）。反白：深色標頭用的白色圖示，焦點框也改白' },
    { name: 'disabled', type: 'boolean', default: 'false', desc: '停用：不能拖，點了不開選單' },
    { name: '(move)', type: 'EventEmitter<ReorderMoveEvent>', desc: '從選單移動時送出 { direction, previousIndex, currentIndex }。欄位名稱跟 CDK 的 cdkDropListDropped 事件相同', isOutput: true },
  ],
  usage: [
    {
      label: '一份清單：拖曳和選單用同一個處理函式',
      code: `<div class="list ds-sortable" cdkDropList cdkDropListLockAxis="y" (cdkDropListDropped)="onMove($event)">
  @for (item of items(); track item.id; let i = $index) {
    <div class="row" cdkDrag cdkDragPreviewClass="ds-sortable-preview" [cdkDragStartDelay]="{ touch: 250, mouse: 0 }">
      <app-reorder-handle [label]="item.name" [index]="i" [count]="items().length" (move)="onMove($event)"></app-reorder-handle>
      {{ item.name }}
    </div>
  }
</div>
<app-reorder-status #status></app-reorder-status>

// component
@ViewChild('status') status!: ReorderStatusComponent;
onMove(e: { previousIndex: number; currentIndex: number }) {
  const before = this.items();
  const name = before[e.previousIndex].name;
  this.items.set(moveInArray(before, e.previousIndex, e.currentIndex));
  this.status.announce(reorderMessage({ name, from: e.previousIndex, to: e.currentIndex, count: before.length }));
  // 接著存檔；失敗時 this.items.set(before)
}`,
    },
    {
      label: '移動後的動態：選單移動時其他項目滑過去；拖曳放下只讓被移動的項目發光',
      code: `onMove(e: ReorderMoveEvent | CdkDragDrop<unknown>, list: HTMLElement) {
  // 只有選單移動要記位置；拖曳放下時預覽已經滑回落點、其他項目也讓好位了
  const snap = 'direction' in e ? captureReorder(list, ':scope > .row') : null;
  const moved = list.querySelectorAll(':scope > .row')[e.previousIndex] as HTMLElement;
  this.items.set(moveInArray(this.items(), e.previousIndex, e.currentIndex));
  afterNextRender(() => (snap ? snap.play(moved) : settleReorder(moved)), { injector: this.injector });
}`,
    },
    {
      label: '放在收合區塊的前置區',
      code: `<app-collapsible appearance="accent" [title]="note.title">
  <app-reorder-handle collapsibleLeading [label]="note.title" [index]="i" [count]="notes().length" (move)="onMove($event)"></app-reorder-handle>
  ...
</app-collapsible>`,
    },
  ],
  usageNotes: [
    '元件本身就是 CDK 的拖曳握把（帶了 cdkDragHandle），不用另外加 cdkDragHandle。要拖曳時，項目要有 cdkDrag、清單要有 cdkDropList；只要選單、不要拖曳時，不放 cdkDrag 也可以用。',
    '清單容器加 class ds-sortable、cdkDrag 加 cdkDragPreviewClass="ds-sortable-preview"，落點與拖曳預覽的樣式才會一致。不要用 *cdkDragPlaceholder 自己畫落點：CDK 在拖曳開始時就量好落點高度，之後才變的高度會讓其他項目讓錯位置。',
    '不要在可排序清單上加 appFlipReorder：它在項目被搬動時一律從舊位置滑過去，拖曳放下時其他項目已經讓好位，會再滑一次。選單移動用 captureReorder；拖曳放下用 settleReorder，只發光。拖曳放下不要用 captureReorder：放下的當下 CDK 已經把項目放回拖曳前的位置，量到的是舊位置，會從頭再滑一次。',
    'cdkDrag 設 [cdkDragStartDelay]="{ touch: 250, mouse: 0 }"：觸控時按住 250ms 才開始拖；滑鼠不用等。CDK 會把握把的 touch-action 設成 none，不設延遲的話，手指從握把一滑就變成拖曳，放開就改了順序。',
    '捲動容器不是整頁時，在那個容器加 cdkScrollable，拖到邊緣才會自動捲動。',
    '從選單移動後，選單關閉時焦點回到握把按鈕。@for 要用不會變的 track（項目的 id），項目被搬動時才是同一個元件；track $index 的話焦點會落在原位置的另一個項目上。',
    '存檔失敗要退回順序時，項目會再被搬一次，焦點會掉到頁面上。只在焦點原本在握把上、或掉到頁面最外層（document.body）時放回：退回後先讓清單當場重畫（ChangeDetectorRef.detectChanges()），再呼叫該項目握把的 focusButton()。使用者已經移到別處（例如在編輯器裡打字），不要把焦點搶回來。不要等 afterNextRender：緊接著跳出的錯誤 toast 會先更新畫面，提早執行它，那時項目還沒搬回去。',
    '巢狀清單：每一層各自是一個 cdkDropList，cdkDrag 不設 cdkDropListConnectedTo，項目就只在自己那一層移動。',
  ],
};
