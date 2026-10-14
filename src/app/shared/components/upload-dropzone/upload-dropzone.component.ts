import { Component, Input, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';

@Component({
  selector: 'app-upload-dropzone',
  standalone: true,
  imports: [CommonModule, ErrorTooltipDirective],
  templateUrl: './upload-dropzone.component.html',
  styleUrls: ['./upload-dropzone.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadDropzoneComponent {
  /** 可接受的副檔名列表，如 ['.pdf', '.jpg', '.png']；空陣列表示不限 */
  @Input() acceptedTypes: string[] = [];

  /** 單一檔案大小上限（MB），預設 20 */
  @Input() maxSize = 20;

  /** 停用狀態（如尚未完成前置條件） */
  @Input() disabled = false;

  /** 停用時顯示的提示文字 */
  @Input() disabledHint = '';

  /** 欄位驗證錯誤訊息；有值時顯示 tooltip（空字串 = 不顯示）*/
  @Input() errorMessage = '';

  /** 錯誤提示位置：預設 bottom（欄位錯誤統一放下方）；版面放不下時才改 top */
  @Input() errorPosition: 'top' | 'bottom' = 'bottom';

  /** 選到有效檔案後 emit（通過驗證的全部檔案，支援多檔） */
  @Output() fileSelected = new EventEmitter<File[]>();

  /** 有任一檔案驗證失敗時 emit 錯誤訊息 */
  @Output() fileError = new EventEmitter<string>();

  isDragOver = signal(false);
  private dragEnterCount = 0;

  /** 供 `<input accept>` 使用的字串 */
  get acceptString(): string {
    return this.acceptedTypes.join(',');
  }

  /** 顯示用的類型文字（如 "PDF, JPG, PNG"） */
  get typeDisplayText(): string {
    if (!this.acceptedTypes.length) return '';
    return this.acceptedTypes.map(t => t.replace('.', '').toUpperCase()).join(', ');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.dragEnterCount++;
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.dragEnterCount--;
    if (this.dragEnterCount <= 0) {
      this.dragEnterCount = 0;
      this.isDragOver.set(false);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    this.dragEnterCount = 0;
    const files = event.dataTransfer?.files;
    if (files?.length) this.processFiles(files);
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files?.length) this.processFiles(files);
    input.value = '';
  }

  onZoneClick(fileInput: HTMLInputElement): void {
    if (!this.disabled) fileInput.click();
  }

  onKeydown(event: KeyboardEvent, fileInput: HTMLInputElement): void {
    if (event.key === 'Enter') {
      if (!this.disabled) fileInput.click();
    }
    if (event.key === ' ') {
      event.preventDefault();
      if (!this.disabled) fileInput.click();
    }
  }

  private processFiles(fileList: FileList): void {
    if (this.disabled) return;

    const valid: File[] = [];
    const errors: string[] = [];
    const maxBytes = this.maxSize * 1024 * 1024;
    const accepted = this.acceptedTypes.map(t => t.toLowerCase());

    Array.from(fileList).forEach(file => {
      // 檔案類型驗證
      if (accepted.length) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!accepted.includes(ext)) {
          errors.push(`「${file.name}」類型不符（需為 ${this.typeDisplayText}）`);
          return;
        }
      }
      // 檔案大小驗證
      if (file.size > maxBytes) {
        errors.push(`「${file.name}」超過 ${this.maxSize}MB 限制`);
        return;
      }
      valid.push(file);
    });

    // 一律 emit fileError（空字串代表無驗證錯誤），
    // 讓 parent 的 uploadError 狀態在每次選檔時都被清掉，避免前一批的錯誤殘留
    this.fileError.emit(errors.join('\n'));
    if (valid.length) {
      this.fileSelected.emit(valid);
    }
  }
}
