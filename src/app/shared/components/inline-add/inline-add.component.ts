import { Component, Input, Output, EventEmitter, signal, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { InputComponent } from '../input/input.component';

/**
 * 在 chip 群組 / 清單尾端「新增自訂項」的 inline 輸入控制。
 *
 * 取代 native `window.prompt`：ghost 觸發鈕點下後原地變成 inline 輸入框，
 * 打字 + Enter 提交 → emit(trim 後字串)；Esc / blur 一律取消（最不意外）。
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
  /** 提交事件：emit trim 後的非空字串 */
  @Output() add = new EventEmitter<string>();

  private readonly host = inject(ElementRef<HTMLElement>);

  /** 是否處於 inline 編輯態（true = 顯示輸入框，false = 顯示觸發鈕） */
  readonly editing = signal(false);
  private draft = '';

  onTriggerClick(): void {
    if (this.disabled) return;
    this.draft = '';
    this.editing.set(true);
    // 等 @if 渲染出 input 後再聚焦
    queueMicrotask(() => this.host.nativeElement.querySelector('input')?.focus());
  }

  onValueChange(value: string): void {
    this.draft = value;
  }

  onInputKeydown(event: KeyboardEvent): void {
    // 阻止方向鍵等冒泡到 chip 群組 roving focus（輸入態游標應留在輸入框內）
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
    }
  }

  /** blur 一律取消（只有 Enter 提交） */
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
}
