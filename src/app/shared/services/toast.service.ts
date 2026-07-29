import { Injectable, OnDestroy, signal } from '@angular/core';
import { ToastAction, ToastSize, ToastType } from '../components/process-toast/process-toast.component';

export interface ToastInput {
  type: ToastType;
  message: string;
  size?: ToastSize;
  duration?: number;
  action?: ToastAction;
  /** Called once when the toast is fully removed (after exit animation). */
  onDismiss?: () => void;
  /** true = 不自動隱藏（供 loading toast 撐到 update() 轉場）；由 update() 帶新 duration 後才開始計時。 */
  persist?: boolean;
}

export interface ToastItem extends ToastInput {
  id: string;
  hiding: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
  readonly toasts = signal<ToastItem[]>([]);

  private counter = 0;
  private hideTimers = new Map<string, ReturnType<typeof setTimeout>>();

  show(input: ToastInput): string {
    const id = `toast-${++this.counter}`;
    this.toasts.update(list => [...list, { ...input, id, hiding: false }]);

    // persist：不設自動隱藏計時器（loading toast 撐到 update() 轉場才開始計時）
    if (!input.persist) {
      const duration = input.duration ?? (input.action ? 5000 : 3000);
      const timer = setTimeout(() => this._markHiding(id), duration);
      this.hideTimers.set(id, timer);
    }

    return id;
  }

  /** 原地更新既有 toast（type/message/duration…）並依新設定重設自動隱藏計時器；用於「同一顆 toast 轉場」。
   *  預設清除 persist（轉場後應自動消失）；如需維持 persist，patch 帶 `persist: true`。 */
  update(id: string, patch: Partial<ToastInput>): void {
    if (!this.toasts().some(t => t.id === id)) return; // 不存在 → no-op
    const nextPersist = patch.persist ?? false;
    this.toasts.update(list =>
      list.map(t => t.id === id ? { ...t, ...patch, persist: nextPersist } : t),
    );
    // 重設自動隱藏計時器（先清舊的）
    clearTimeout(this.hideTimers.get(id));
    this.hideTimers.delete(id);
    const merged = this.toasts().find(t => t.id === id);
    if (merged && !merged.persist) {
      const duration = merged.duration ?? (merged.action ? 5000 : 3000);
      const timer = setTimeout(() => this._markHiding(id), duration);
      this.hideTimers.set(id, timer);
    }
  }

  /** Programmatic dismiss: marks the toast as hiding so its exit animation plays.
   *  Removal happens via removeById(), which the container calls on (dismissed). */
  dismiss(id: string): void {
    this._markHiding(id);
  }

  /** Called by the container when process-toast emits (dismissed) after exit animation. */
  removeById(id: string): void {
    const item = this.toasts().find(t => t.id === id);
    this.toasts.update(list => list.filter(t => t.id !== id));
    clearTimeout(this.hideTimers.get(id));
    this.hideTimers.delete(id);
    item?.onDismiss?.();
  }

  private _markHiding(id: string): void {
    clearTimeout(this.hideTimers.get(id));
    this.hideTimers.delete(id);
    this.toasts.update(list =>
      list.map(t => t.id === id ? { ...t, hiding: true } : t)
    );
  }

  ngOnDestroy(): void {
    this.hideTimers.forEach(t => clearTimeout(t));
    this.hideTimers.clear();
  }
}
