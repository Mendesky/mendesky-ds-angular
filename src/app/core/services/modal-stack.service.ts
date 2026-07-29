import { Injectable, signal } from '@angular/core';

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

  /** modal 開啟時呼叫，將 id push 到 stack */
  register(id: string): void {
    if (!this.stack.includes(id)) {
      this.stack.push(id);
      this._stackSize.set(this.stack.length);
    }
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
