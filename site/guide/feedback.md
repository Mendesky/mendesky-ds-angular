# 載入與回饋

這篇處理兩件事。第一，資料還在載入時，畫面要顯示什麼。第二，使用者按下建立、修改、刪除之後，要給什麼回饋。

做會讀寫後端的區塊、或接上送出按鈕之前，先讀這篇。

## 先判斷

### 載入中

「水合」指打開畫面時，向後端取回既有資料、填進欄位的過程。skeleton 是用形狀塊暗示內容位置的佔位畫面。

為什麼要在意：如果使用者在資料回來之前就操作欄位，空值會被寫回後端，蓋掉真正的資料。

| 區塊的狀況 | 做法 |
| --- | --- |
| 打開時向 API 取預填值，而且欄位 blur 或選取時會寫回後端 | 載入期間用 skeleton 蓋住整個區塊，不能操作。資料回來才換成真的表單 |
| 只讀 API、不寫回後端 | 不必用 skeleton |
| 從父層的快照還原，不打 API | 直接顯示，不用 skeleton |
| API 失敗、離線、逾時 | 收起 skeleton，顯示空白表單。不跳 toast 或 Dialog |
| 整頁資料載入前 | 用 <ComponentLink id="page-skeleton" /> 佔位，避免版面跳動 |

### 送出之後

「mutation」指會改變後端資料的操作：建立、修改、刪除。回饋策略分兩種：

- **pessimistic**：等後端回應成功，才更新畫面。
- **optimistic**：先更新畫面，後端失敗再還原。

| 操作 | 策略 | 畫面怎麼反應 |
| --- | --- | --- |
| Wizard、Dialog、多欄位表單按確認 | pessimistic | 按鈕轉為 loading。成功才關閉，並顯示成功 toast。失敗保留表單內容，顯示錯誤 toast |
| 單一開關、下拉選單、就地編輯 | optimistic | 畫面立刻變。失敗還原成舊值，顯示錯誤 toast。成功通常不跳 toast |
| 沒有存檔按鈕、逐欄自動存檔的介面 | optimistic | 例外：每存一欄就跳一顆成功 toast，依序堆疊 |
| 開關選到某個值後，要開 Wizard 補資料 | pessimistic | 選的當下不打 API。Wizard 確認才送出；取消就把開關還原 |
| 耗時操作，處理中要擋住整個畫面 | — | 用 <ComponentLink id="process-modal" /> 的 `type="running"`，處理中不能關閉 |

## 情境與範例

### 載入中：skeleton

<StoryEmbed id="page-skeleton--default" :height="360" title="整頁 skeleton" />

`app-page-skeleton` 是整頁載入用的佔位元件，沒有任何屬性。區塊層級的 skeleton 怎麼跟載入狀態同步，看下方規則「API 水合 Skeleton」。重點是 API 失敗時也要收起 skeleton，否則畫面會永遠卡在載入中。

### 送出中：按鈕 loading

```html
<app-button
  variant="filled"
  color="primary"
  size="M"
  text="確認建立"
  [loading]="submitting()"
  (btnClick)="confirm()"
></app-button>
```

- `loading` 為 `true` 時，轉圈取代 icon，底色不變，點擊無效，所以不會重複送出。
- 要在 loading 時換文字，用 `loadingText`。
- `app-dialog` 的確認按鈕也有 `[loading]`。
- 送出中，Wizard 的 X、ESC、背景都不能關。X 鈕傳 `[disabled]`；ESC、背景與自訂的「取消」按鈕，處理函式在送出中直接 return。

### 操作結果：toast

按下面的按鈕，看成功、錯誤、含復原三種 toast。

<StoryEmbed id="toast-container--interactive" :height="320" title="呼叫 ToastService 顯示 toast" />

```ts
private readonly toast = inject(ToastService);

this.toast.show({ type: 'success', message: '已儲存' });
```

- 整個 app 只在 app root 掛一次 `<app-toast-container />`。要顯示 toast 就呼叫 `ToastService.show()`。不要自建 toast 堆疊，否則兩套堆疊會互相遮蓋。
- 停留時間由類型決定，不用自己傳：成功與載入中 3 秒；錯誤與帶 action 的 5 秒。
- 只有帶 action 的 toast 可以點。其他 toast 不接收點擊，避免擋住底下的按鈕。
- 訊息最多顯示兩行，超過的部分會直接被截掉，不會報錯。
- 同一件事的「進行中 → 完成」用一顆 toast 原地轉換。不同的事各自一顆，依序堆疊。

```ts
// 同一件事的兩個階段：先顯示進行中，完成後原地更新
const id = this.toast.show({ type: 'loading', message: '文件產生中', persist: true });
// …完成後
this.toast.update(id, { type: 'success', message: '已開始下載' });
```

### 耗時操作：擋住整個畫面

<StoryEmbed id="process-modal--running-open" :height="300" title="處理中的 Process Modal" />

```html
<app-process-modal
  type="running"
  message="執行中請稍候"
  [isOpen]="isProcessing()"
  (dismissed)="onDone()"
></app-process-modal>
```

- `type="running"`：白底小卡加轉圈，蓋住整個畫面，處理中不能關閉。
- `type="congratulation"`：綠底慶祝卡，點背景會觸發 `(dismissed)`。

## 規則

<PatternBlock id="loading.api-hydration-skeleton" />

<PatternBlock id="mutation.feedback" />

## 相關

- [確認與破壞性動作](./confirmation)：含「復原」的 toast。
- [浮層怎麼選](./overlays)：儲存中怎麼鎖住 Modal 的關閉。
- [表單與錯誤提示](./forms)：在清單尾端新增自訂項後立刻送後端。
- 元件：<ComponentLink id="page-skeleton" />、<ComponentLink id="button" />、<ComponentLink id="process-toast" />、<ComponentLink id="toast-container" />、<ComponentLink id="process-modal" />
