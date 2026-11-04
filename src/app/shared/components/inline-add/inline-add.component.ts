import { Component, Input, Output, EventEmitter, signal, ElementRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { InputComponent } from '../input/input.component';

/**
 * 在 chip 群組 / 清單尾端「新增自訂項」的 inline 輸入控制。
 *
 * 取代 native `window.prompt`：ghost 觸發鈕點下後原地變成 inline 輸入框，
 * 打字 + Enter 提交 → emit(trim 後字串)；Esc / blur 一律取消（最不意外）。
 * 焦點：點開後直接進輸入框；Enter / Esc 收起後回到觸發鈕；blur 取消時焦點已被移走，不拉回。
 * 按住 Enter 只算一下；用輸入法選字時的 Enter / Esc 交給輸入法，不送出也不收起。
 *
 * 展示櫃原則：本元件只負責「輸入 affordance」，不持有清單 / 勾選狀態。
 * 去重、加入清單、勾選由父層在 (add) handler 處理。
 */
@Component({
  selector: 'app-inline-add',
  standalone: true,
  imports: [CommonModule, ButtonComponent, InputComponent],
  templateUrl: './inline-add.component.html',
  styleUrls: ['./inline-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineAddComponent {
  /** 觸發鈕文字 */
  @Input() buttonText = '＋ 新增其他項目';
  /** 輸入框 placeholder */
  @Input() placeholder = '輸入後按 Enter';
  /** 尺寸（對齊 chip / button） */
  @Input() size: 'S' | 'M' = 'S';
  /** disable 觸發鈕（權限 gating 用）；additive、預設 false、向後相容。 */
  @Input() disabled = false;
  /**
   * 報讀軟體念的名稱，交給內層輸入框；放在有標題的欄位裡時設成欄位標題，不設時只念提示文字。
   * 內層輸入框不會連到外層 app-field 的標題，所以要從這裡給。
   */
  @Input() ariaLabel = '';
  /** 提交事件：emit trim 後的非空字串 */
  @Output() add = new EventEmitter<string>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly cdr = inject(ChangeDetectorRef);

  /** 是否處於 inline 編輯態（true = 顯示輸入框，false = 顯示觸發鈕） */
  readonly editing = signal(false);
  private draft = '';

  onTriggerClick(): void {
    if (this.disabled) return;
    this.draft = '';
    this.editing.set(true);
    // 先同步畫出輸入框再聚焦。不能用 queueMicrotask 等：zone 要等 microtask 跑完才更新畫面，
    // callback 跑的時候 input 還沒出現，焦點會掉到 body，報讀軟體也念不到輸入框的名稱。
    this.cdr.detectChanges();
    this.host.nativeElement.querySelector('input')?.focus();
  }

  onValueChange(value: string): void {
    this.draft = value;
  }

  onInputKeydown(event: KeyboardEvent): void {
    // 阻止方向鍵等冒泡到 chip 群組 roving focus（輸入態游標應留在輸入框內）
    event.stopPropagation();
    // 用輸入法選字時的 Enter（確定）、Esc（取消選字）是給輸入法的。Safari 確定選字的 Enter 沒有 isComposing，只看得出 keyCode 229
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      // 按住 Enter 會連發，只認第一下
      if (event.repeat) return;
      this.commit();
      this.focusTrigger();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
      this.focusTrigger();
    }
  }

  /** Enter 送出後焦點回到觸發鈕，按住 Enter 的連發會落在這顆鈕上；擋掉才不會又打開輸入框，一開一關地閃 */
  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && event.repeat) event.preventDefault();
  }

  /** blur 一律取消（只有 Enter 提交）；焦點已經被使用者移走，不拉回觸發鈕 */
  onBlur(): void {
    this.cancel();
  }

  private commit(): void {
    const name = this.draft.trim();
    if (name) this.add.emit(name);
    this.editing.set(false);
    this.draft = '';
  }

  private cancel(): void {
    this.editing.set(false);
    this.draft = '';
  }

  /** Enter / Esc 收起輸入框後，焦點還給觸發鈕；不然輸入框被拆掉，焦點掉到 body，用鍵盤的人得從頭找 */
  private focusTrigger(): void {
    this.cdr.detectChanges();
    this.host.nativeElement.querySelector('button')?.focus();
  }
}
