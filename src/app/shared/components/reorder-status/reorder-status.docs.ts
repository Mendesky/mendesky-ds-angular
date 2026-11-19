import type { ComponentApi } from '../../../../docs/component-doc';

export const reorderStatusDoc: ComponentApi = {
  id: 'reorder-status',
  selector: 'app-reorder-status',
  summary: 'announce(text) · clear()',
  props: [],
  usage: [
    {
      label: '放在清單旁邊，移動後念結果',
      code: `<div class="wrap">
  <div class="list ds-sortable" cdkDropList (cdkDropListDropped)="onMove($event)">…</div>
  <app-reorder-status #status></app-reorder-status>
</div>

// component
@ViewChild('status') status!: ReorderStatusComponent;
this.status.announce(reorderMessage({ name, from, to, count }));`,
    },
  ],
  usageNotes: [
    '用 @ViewChild 取得元件，呼叫 announce(句子) 念、clear() 清空。不要包在 @if 裡：它要比句子先出現在頁面上。',
    '「離開」以它的父元素為準：焦點移到父元素外面，或滑鼠移出父元素，就清空。所以父元素要包住整份清單（巢狀清單包住最外層）。',
    '在 app-modal-shell 裡的清單，把它放在 modal 的內容裡，不要放到 body。',
    '測試：announce 之後馬上讀元素的文字；元件不開計時器，fakeAsync 不用另外 flush。',
  ],
};
