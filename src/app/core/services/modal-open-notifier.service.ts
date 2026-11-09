import { Injectable, untracked } from '@angular/core';

/**
 * ModalOpenNotifier — DS 內部用（不從套件匯出）：有新的 modal 登記時同步通知。
 *
 * ModalStackService.register 登記成功時呼叫 notify，在 register 回傳前通知每個 listener，帶著登記後的層數。
 *
 * 為什麼要同步、不讓 listener 用 effect 讀 stackSize：effect 比 modal 第一次畫出來還晚執行。
 * app-dialog 一畫出來就記下「關掉後焦點還給誰」，要在那之前關掉的東西（例如帶著焦點的日期面板）
 * 必須在登記當下就處理，否則 dialog 記到的是即將被移除的元素，關掉後焦點落到 body。
 *
 * 為什麼不直接做成 ModalStackService 的方法：使用端的測試常用只有 register、unregister 等幾個方法的
 * 假物件代替 ModalStackService（mendesky-web 有 25 個測試檔）。浮層服務一建立就要訂閱通知，
 * 方法放在 ModalStackService 上，那些測試一建立浮層服務就會全部壞掉。
 */
@Injectable({ providedIn: 'root' })
export class ModalOpenNotifier {
  private readonly listeners = new Set<(size: number) => void>();

  /** 訂閱「有新的 modal 登記」；回傳取消函式 */
  listen(listener: (size: number) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 由 ModalStackService.register 呼叫。包在 untracked 裡：register 可能在 effect 或 template 的
   * 反應式環境裡被呼叫，listener 讀到的 signal 不該變成呼叫端的依賴。
   * （listener 能不能寫 signal 跟這裡無關：register 自己先寫 stackSize，不允許寫的環境在那裡就會出錯。）
   */
  notify(size: number): void {
    untracked(() => {
      for (const listener of Array.from(this.listeners)) listener(size);
    });
  }
}
