/**
 * 互動原則的 Angular 做法。
 *
 * 本體 `@mendesky/ds` 的 `src/docs/patterns.ts` 只寫跨框架的規則；需要用到 Angular 寫法的實作步驟寫在這裡，
 * 以原則的 key 對應。文件網站在互動原則下方顯示「Angular 做法」，AI 協作索引也會帶出。
 * `npm run check:docs` 會確認每個 key 都是本體有的互動原則。
 */
import type { PatternNotes } from './component-doc';

export const angularPatternNotes: PatternNotes = {
  'modal.dismissal': [
    '編輯型 modal 鎖 backdrop 的寫法：<app-modal-shell [canDismiss]="!isDirty()">。canDismiss 擋的是 backdrop；ESC 不受此 gate。',
    'nested modal 防 tooltip 穿透的修法：modal 堆疊服務在 Angular 是 ModalStackService；tooltip portal 監聽 ModalStackService.stackSize，開啟時 snapshot 當下深度，stack 增層時主動 close portal。',
  ],
  'action.precondition-acknowledge': [
    'required 時鎖主按鈕的寫法：<app-button [disabled]="!confirmed()">，confirmed() 是父層記錄「已勾選確認」的狀態。',
  ],
  'wizard.keyboard': [
    'onFormEnter 判斷焦點是否為 button-group 的子按鈕：用 closest("app-button-group")。',
  ],
  'loading.api-hydration-skeleton': [
    '載入中旗標用 signal：loadingSignal = signal(true)；loadFromApi 第一行 loadingSignal.set(true)。',
    'apply* 尾端先把完整狀態 emit 給父層，再 loadingSignal.set(false)。',
    'loadFromApi 的 .catch 第一件事是 loadingSignal.set(false)，否則 API 失敗 skeleton 永卡。',
    '模板寫法：@if (loadingSignal()) { <skeleton> } @else { <real form> }，不可並存。只用這一個 @if 讀 loadingSignal()，不要另外用多個 computed 或多個 @if 分散判斷。',
    '父層傳入資料的變動在 ngOnChanges 處理：initialState restore 分支（含 localSnapshotOnly：從 snapshot set 各欄位 signal）結尾 loadingSignal.set(false)。',
    'ngOnChanges 的 reset 分支用 loadFromApiFiring 判斷：本輪會觸發 loadFromApi，就把 set(false) 交給 loadFromApi；否則主動 loadingSignal.set(false)。',
    '清單型 section：GET 回來對清單 signal 呼叫 set(...) 整份覆寫，會把使用者剛上傳或新增的項目沖掉，同樣要用 skeleton 遮住 race window。',
    { type: 'warn', content: '不要用反向旗標 hydrated = signal(false) 搭 @if (!hydrated())：雙重否定、易讀性差，ngOnChanges 分支容易忘記翻轉。' },
    { type: 'warn', content: 'apply* 的 loadingSignal.set(false) 不可寫在 emit 之前：@if 會一瞬間切到 @else，但 signals 還沒寫完，使用者看到空表單。' },
    { type: 'warn', content: 'ngOnChanges 的 reset 分支不可無條件 loadingSignal.set(false)：會覆蓋後置的 loadFromApi set(true)，skeleton 根本不會亮。' },
    'raceRetryRead（剛建立後讀 read model 的 503）：service 的 GET 走 RxJS pipe，retry(RACE_RETRY) 在前、catchError 在後（404 不 retry，其他 status 跑完 retry 才落到 catchError）。',
    'raceRetryRead：「抑制錯誤 UI」與「抑制 404 UI」兩個旗標用 HttpContext 帶在同一個請求上。',
    'raceRetryRead 不適用 PATCH / POST：寫入端的並行撞擊用 concatMap 依序送出（serialize），不用 retry。',
  ],
  'modal.footer-buttons': [
    '主動作按鈕條件不足時（disabledWithFeedback）的寫法：<app-button [clickableWhenDisabled]="true" [disabledMessage]="..." (disabledClick)="...">。',
    '同側相鄰按鈕之間的分隔線：<app-divider display="Column" propClass="Grey20">。',
  ],
  'modal.nonlinear-completion': [
    'sidebar 底部完成 CTA 的寫法同 modal.footer-buttons：<app-button [clickableWhenDisabled]="true" [disabledMessage]="..." (disabledClick)="...">。',
  ],
  'interaction.overlay-archetypes': [
    'Angular 的元件類別名稱再加 Component 後綴：本原則寫的 *Dialog、*Wizard、*Modal，在 Angular 是 *DialogComponent、*WizardComponent、*ModalComponent。',
  ],
  'mutation.feedback': [
    'pessimisticWizard：wizardSubmitting 用 signal，綁 [isSubmitting]="wizardSubmitting()" 驅動按鈕 loading；按鈕本身是 <app-button [loading]="...">（自動阻擋重複 click）。',
    'savingLockedSurface：用 ng-content 投影進 wizard 的「取消」按鈕也要 guard，handler 第一行寫 if (this.wizardSubmitting()) return;',
    'toast 服務在 Angular 是 ToastService：逐欄存檔 toast 用 ToastService.show() 一欄一顆、依序堆疊；ToastService.update() 的用途是同一件事的「進行中→完成」原地轉場。',
    'toast 的 duration 由 toast.service.ts 裡的模組函式 resolveDuration() 決定（不是 ToastService 的方法），show() 與 update() 共用。',
    '逐欄存檔 toast 的封裝（例如使用端的 SaveToastService）由使用端實作，不在 DS 套件內。',
  ],
  'interaction.contextual-selection-toolbar': [
    '對應的 Angular 元件：app-rich-text-editor 的 [tableStructureEditing]；把手是內部子元件 app-rte-table-grip。',
    '桌面 mousemove 與觸控／鍵盤 selectionUpdate 兩條路徑都呼叫同一個 showGripsForCell。',
    '把手以 createComponent 命令式建立並 portal 到 document.body；它在 zone 外掛載，必須呼叫 changeDetectorRef.detectChanges() 才會 render。',
    '把手元件的樣式寫 :host { display: block }（不可 display: contents，否則 portal 定位失效）。',
    { type: 'warn', content: 'portal、detectChanges、:host display:block 三者是 zone 外命令式掛載浮層的固定坑：把手 display:contents 或掛載後沒 detectChanges，就會掛了卻不顯示或定位失效。' },
  ],
};
