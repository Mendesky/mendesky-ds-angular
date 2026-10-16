# 確認與破壞性動作

刪除、封存、撤回這類動作，要不要先問使用者？要怎麼問？這篇幫你選。另外也處理一種常被混淆的情況：動作本身不危險，但執行前要使用者先聲明某個前提成立。

設計會移除資料、或讓流程倒退的按鈕之前，先讀這篇。

## 先判斷

先問一個問題：做錯了，要花多少功夫恢復？這叫「重建成本」。系統保留每一次變更的紀錄，所以「不可復原」真正的意思是恢復很費工，而不是資料消失。

再看有沒有「下游副作用」，也就是這個動作會不會連帶影響其他資料或流程。

| 情況 | 例子 | 做法 | 元件 |
| --- | --- | --- | --- |
| 重建成本低、沒有下游副作用 | 刪除清單項、移除欄位、取消標記 | 直接執行，成功後跳出含「復原」的 toast | <ComponentLink id="process-toast" />（透過 `ToastService`） |
| 逆流程、重建成本高，常帶下游副作用 | 封存項目、撤回已送出的申請 | 先開警示 Dialog 打斷，寫清楚後果 | <ComponentLink id="dialog" />，`propClass="Warning"` |
| 動作風險低，但要使用者聲明某個前提成立 | 發布前確認內容已經過審核；送出前再看一次設定 | 在主按鈕旁放勾選聲明，不開 Dialog | <ComponentLink id="inline-confirm" /> |

第三列不是破壞性動作。它的目的不是擋住誤操作，而是讓使用者多看一眼、正式簽名。不要把它歸到第二列。

## 情境與範例

### 可還原的刪除：先做，再給「復原」

<StoryEmbed id="toast-container--with-undo" :height="300" title="含復原的 toast" />

- 動作立刻執行，API 同步寫入。成功才顯示 toast。
- 「復原」的 `onClick` 通常是呼叫還原 API，把已寫入的動作反轉。它不是取消一個還沒送出的請求。
- toast 自己消失，代表使用者沒有反悔，不會觸發 `onClick`。
- 停留時間由類型決定，不用自己傳。帶「復原」的 toast 停留 5 秒。
- 只有帶 action 的 toast 可以點。

```ts
private readonly toast = inject(ToastService);

this.toast.show({
  type: 'success',
  message: '已刪除「附件 A」',
  action: { label: '復原', onClick: () => this.restoreAttachment() },
});
```

### 逆流程、高重建成本：用警示 Dialog 打斷

<StoryEmbed id="dialog--warning-open" :height="320" title="警示 Dialog" />

```html
<app-dialog
  [isOpen]="showDialog"
  header="刪除聯絡窗口資料"
  content="此動作無法復原，請確認是否刪除該位聯絡窗口資料"
  propClass="Warning"
  confirmText="確認刪除"
  [loading]="deleting()"
  (cancel)="showDialog = false"
  (confirm)="onDelete()"
></app-dialog>
```

- `propClass="Warning"`：確認按鈕變紅。它只代表嚴重程度，不等於「刪除」。
- `confirmIcon`：預設是垃圾桶，只留給真的刪除或移除資料的動作。其他確認（取消封存、復原、送出、匯入）傳 `confirmIcon=""`，紅色仍保留。
- `confirmText`：寫出具體動作，例如「封存此項目」，不要只寫「確認」。
- `content`：寫出會發生什麼、要恢復得做哪些事，不要只問「確定嗎？」。
- `cancelText`：預設「取消並關閉」，可以依情境改。
- `[loading]`：API 送出中，確認按鈕顯示轉圈並停用；取消按鈕不受影響。

觸發按鈕放在選單裡時，危險項目用 `variant="ghost"`、`color="danger"`，見 <ComponentLink id="action-menu" /> 說明的「內容元件規範」。

### 前提聲明：勾選後才能繼續

下面的範例要先勾選，「下一步」才能按。

<StoryEmbed id="inline-confirm--required-premise" :height="240" title="勾選前提後才能繼續" />

```html
<app-inline-confirm
  requirement="required"
  label="發布前請確認內容已經過審核"
  description="未確認前無法發布。"
  checkLabel="我已確認內容已經過審核"
  [(confirmed)]="reviewed">
</app-inline-confirm>
<app-button text="下一步" [disabled]="!reviewed()"></app-button>
```

- 文案用宣告句，例如「我已確認內容已經過審核」，不用問句。
- 元件不控制主按鈕。父層自己綁 `[disabled]="!reviewed()"`。
- `requirement="required"`：主按鈕依賴這個勾選。`requirement="optional"`：複核式提醒，元件自動加上「（選填）」，主按鈕通常保持可按。
- 離開頁面再回來，父層要把勾選狀態設回 `false`。元件不會自己重置。

## 規則

<PatternBlock id="action.confirm-destructive" />

<PatternBlock id="action.precondition-acknowledge" />

## 相關

- [浮層怎麼選](./overlays)：Dialog 和 Wizard、Modal 的分界。
- [載入與回饋](./feedback)：成功與失敗的 toast、送出中的按鈕狀態。
- [表格的情境工具列](./table-toolbar)：表格列或欄的刪除靠復原，不彈確認 Dialog。
- 元件：<ComponentLink id="dialog" />、<ComponentLink id="process-toast" />、<ComponentLink id="toast-container" />、<ComponentLink id="inline-confirm" />、<ComponentLink id="process-modal" />
