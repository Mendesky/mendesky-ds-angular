# 浮層怎麼選

浮層是蓋在頁面上方、暫時擋住底下操作的視窗。這篇幫你決定該用哪一種浮層，再說明關閉方式、底部按鈕、完成按鈕怎麼安排。

要做彈窗、多步驟設定、或多頁編輯視窗之前，先讀這篇。

## 先判斷

浮層分三種原型：Dialog、Wizard、Modal。依序回答兩個問題。

1. **目的是打斷使用者、要他明確表態嗎？** 例如破壞性動作的二次確認、強制閱讀的聲明、逾時或斷線通知。是 → **Dialog**。
2. **中間步驟會不會寫入後端？** 「寫入」指呼叫會改變後端資料的 API。
   - 不會，最後按完成才一次寫入 → **Wizard**。
   - 會，邊編輯邊逐步存檔（連續自動儲存）→ **Modal**。

| 原型 | 典型情境 | 用什麼元件 | 元件命名 |
| --- | --- | --- | --- |
| Dialog | 單一步驟、明確的是或否：破壞性確認、強制閱讀、系統事件通知 | <ComponentLink id="dialog" /> | 直接用 DS 元件 |
| Wizard | 聚焦設定一件事；開始主流程前的資料收集 | <ComponentLink id="modal-shell" />，常搭配 <ComponentLink id="stepper" />（非必備） | `*WizardComponent` |
| Modal | 連續自動儲存的編輯；多頁時有導航 | <ComponentLink id="modal-shell" />，多頁時搭配 <ComponentLink id="stepper" /> 的 nav 模式 | `*ModalComponent` |

判斷時注意：

- 最可靠的判準是「什麼時候寫入後端」。導航能不能自由跳頁，不是判準。
- 視窗大小、有沒有「確定／取消」兩顆按鈕，也不是判準。Wizard 的最後一步同樣有確認按鈕。
- Dialog 不是表單容器。要收多個欄位，改用 Wizard 或 Modal。
- `app-dialog` 是固定格式的小型確認框。要自訂標題、內容、底部按鈕時，用 `app-modal-shell` 自己組。

## 情境與範例

### 關閉方式：看會不會遺失資料

Modal 能不能點背景、按 ESC、按 X 關閉，取決於「關掉會不會遺失資料」。完整的分流在下方規則「Modal 關閉行為」。

元件這樣接：

- **背景**：`app-modal-shell` 的 `canDismiss`。有未儲存的變動時傳 `[canDismiss]="!isDirty()"`，點背景就完全沒反應。
- **ESC**：不受 `canDismiss` 影響。shell 只發出 `(escapePress)`，由你決定直接關，還是先跳二次確認。
- **X**：用 `app-modal-close-btn` 放進 header。點擊發出 `(closeClick)`，同樣由你決定。儲存中傳 `[disabled]="saving()"`。

下面的範例背景不可關閉。點背景試試看，視窗不會關。

<StoryEmbed id="modal-shell--cannot-dismiss" :height="480" title="背景不可關閉的 Modal" />

```html
<app-modal-shell
  [isOpen]="isOpen"
  [canDismiss]="!isDirty()"
  ariaLabelledBy="edit-modal-title"
  (backdropClick)="close()"
  (escapePress)="requestClose()"
>
  <!-- header：標題 + 關閉鈕 -->
  <app-modal-close-btn [disabled]="saving()" (closeClick)="requestClose()"></app-modal-close-btn>
  <!-- body、footer -->
</app-modal-shell>
```

大型、多步驟的 Wizard 有未儲存的內容時，按 X 或 ESC 要先跳二次確認，讓使用者選保留或捨棄。小型、單一用途的 Modal 則直接關，因為背景已經鎖住，不怕誤觸。下面是 Wizard 放棄設定時的確認框。

<StoryEmbed id="dialog--normal-open" :height="320" title="放棄設定的確認框" />

確認框的次要按鈕預設寫「取消並關閉」。用 `cancelText` 可以依情境改，例如取消新建的確認改成「繼續新建」。

### 底部按鈕：讓使用者知道為什麼不能送出

Footer 左邊放退出流程的按鈕（取消、上一步），右邊放推進流程的主按鈕（確認、送出、下一步）。

條件不足時，主按鈕維持停用的外觀，但仍然可以點。點了之後用 tooltip 說明原因，並捲到第一個錯誤欄位。不要在 footer 放常駐的警示文字。

用 `app-button` 的三個屬性就能做到：

```html
<app-button
  variant="filled"
  color="primary"
  size="M"
  text="送出"
  [disabled]="!canSubmit()"
  [clickableWhenDisabled]="true"
  [disabledMessage]="submitBlockers()"
  (disabledClick)="scrollToFirstError()"
  (btnClick)="submit()"
></app-button>
```

- `clickableWhenDisabled`：改用 `aria-disabled`，點擊可以穿透停用狀態。
- `disabledMessage`：點擊後顯示在按鈕上方的 tooltip。一條原因傳字串，多條傳字串陣列，會以條列呈現。
- `(disabledClick)`：停用狀態下被點擊時觸發。在這裡捲到第一個錯誤欄位。

Footer 裡的按鈕用同一個 `size`。退出用 `elevated`，推進用 `filled`，對照 <ComponentLink id="button" /> 說明裡的「語意選用指引」。

### 多頁 Modal：完成按鈕放哪裡

多頁 Modal 的左側導航用 `app-stepper` 的 nav 模式。完成按鈕（例如送出、發布）放哪裡，要看「實體」怎麼排進頁面。實體指一份資料裡重複出現的單位，例如一份申請裡的每一位成員。

- **沒有實體，或實體已排進同一條頁序**：完成按鈕放在最後一頁的底部。
- **每個實體重複整套頁面，用切換器切換**：完成按鈕常駐在左側欄底部。按下去沒通過時，未完成的頁面標紅框、實體標「缺 N 項」，並自動帶到第一個錯誤。

stepper 的 `validationTriggeredIds` 列出的項目會顯示紅色警告狀態。下面的範例裡，「基本資料」底下有兩個項目已觸發驗證，另有已完成與鎖定的頁面。

<StoryEmbed id="stepper--nav-with-statuses" :height="440" title="導覽的完成、鎖定與警告狀態" />

## 規則

<PatternBlock id="interaction.overlay-archetypes" />

<PatternBlock id="modal.dismissal" />

<PatternBlock id="modal.footer-buttons" />

<PatternBlock id="modal.nonlinear-completion" />

## 相關

- [確認與破壞性動作](./confirmation)：什麼時候該用 Dialog、確認文案怎麼寫。
- [表單與錯誤提示](./forms)：欄位錯誤訊息、Wizard 裡的 Enter 鍵。
- [載入與回饋](./feedback)：Wizard 送出中怎麼鎖住、成功與失敗的 toast。
- 元件：<ComponentLink id="dialog" />、<ComponentLink id="modal-shell" />、<ComponentLink id="modal-close-btn" />、<ComponentLink id="stepper" />、<ComponentLink id="button" />
- 側邊或底部滑出的面板用 <ComponentLink id="drawer-shell" />。點 overlay 或按 ESC 會發出 `(close)`，由父層把 `isOpen` 設回 `false`。
