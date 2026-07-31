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

/**
 * 型別決定自動消失時長（2026-07-27 使用者拍板：**成功 3 秒 / 失敗 5 秒**）：
 * `error` → 5000、有 `action`（undo 視窗）→ 5000、其餘（success / loading）→ 3000。
 * 呼叫端顯式帶 `duration` 一律優先。
 *
 * `show()` 與 `update()` **共用**此函式：`update()` 會改 type（loading→error 轉場），
 * 若只有 `show()` 套規則，轉場後的 error toast 會只停 3 秒。
 *
 * 先前 error 的 5000ms 是靠每個呼叫點手打 `duration: 5000`，漏帶就退回 3000；升為預設後那些
 * 手打值成為冗餘並已清除（實測 22 處：18 為 error＝純冗餘、4 為 success＝原本刻意設 5 秒，
 * 依「成功 3 秒」政策一併 normalise）。唯一保留顯式值的是 `global-api-error-host`——它不走本容器
 * （自有 z-index 9999 層），顯式帶值是正確的自我文件化。
 */
function resolveDuration(item: Pick<ToastInput, 'duration' | 'type' | 'action'>): number {
  if (item.duration !== undefined) return item.duration;
  return (item.action || item.type === 'error') ? 5000 : 3000;
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
      const timer = setTimeout(() => this._markHiding(id), resolveDuration(input));
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
      const timer = setTimeout(() => this._markHiding(id), resolveDuration(merged));
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
