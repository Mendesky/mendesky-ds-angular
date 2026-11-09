import { Injectable, signal, untracked } from '@angular/core';

/**
 * ModalStackService — 追蹤目前開啟的 modal 層疊順序。
 *
 * 為什麼需要這個 service：
 * modal-shell 被 teleport 到 document.body 後，多個 shell 在 DOM 上是兄弟節點。
 * 各自掛 document:keydown listener 時，stopPropagation() 無法阻止兄弟 listener 被觸發。
 * 用 stack 追蹤，只有最上層（topmost）的 modal 才回應 Escape，其餘忽略。
 */
@Injectable({ providedIn: 'root' })
export class ModalStackService {
  private readonly stack: string[] = [];
  private readonly _stackSize = signal(0);
  readonly stackSize = this._stackSize.asReadonly();
  private readonly openListeners = new Set<(size: number) => void>();

  /** modal 開啟時呼叫，將 id push 到 stack */
  register(id: string): void {
    if (!this.stack.includes(id)) {
      this.stack.push(id);
      this._stackSize.set(this.stack.length);
      const size = this.stack.length;
      // 包在 untracked 裡：register 可能在 effect 或 template 的反應式環境裡被呼叫，
      // 通知裡讀到的 signal 不該變成呼叫端的依賴，通知裡寫 signal 也不該丟 NG0600。
      untracked(() => {
        for (const listener of Array.from(this.openListeners)) listener(size);
      });
    }
  }

  /**
   * 有新的 modal 登記時通知（同一個 id 重複登記、unregister 都不通知）。
   * 在 register 回傳前同步呼叫，帶著登記後的層數；回傳取消函式。
   *
   * 為什麼不讓使用端用 effect 讀 stackSize：effect 比 modal 第一次畫出來還晚執行。
   * app-dialog 一畫出來就記下「關掉後焦點還給誰」，要在那之前關掉的東西（例如帶著焦點的日期面板）
   * 必須在登記當下就處理，否則 dialog 記到的是即將被移除的元素，關掉後焦點落到 body。
   */
  onOpen(listener: (size: number) => void): () => void {
    this.openListeners.add(listener);
    return () => {
      this.openListeners.delete(listener);
    };
  }

  /** modal 關閉時呼叫，從 stack 移除 id */
  unregister(id: string): void {
    const idx = this.stack.lastIndexOf(id);
    if (idx !== -1) {
      this.stack.splice(idx, 1);
      this._stackSize.set(this.stack.length);
    }
  }

  /** 判斷此 id 是否為當前最上層 modal */
  isTopmost(id: string): boolean {
    return this.stack.length > 0 && this.stack[this.stack.length - 1] === id;
  }

  /** 判斷目前是否有任何 modal 在開啟中（供全域快速鍵判斷是否暫停） */
  hasAny(): boolean {
    return this.stack.length > 0;
  }
}
