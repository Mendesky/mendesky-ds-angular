import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UploadDropzoneComponent } from './upload-dropzone.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';

// 錯誤狀態一致化（2026-07-08 使用者定案）：errorMessage 有值 → appErrorTooltip（既有）+ 紅色框線
// （--error class，border 用 --border/error，與 app-input 錯誤框線同 token）。
// 所有使用處（wizard、多頁 modal、編輯表單等）自動獲得同一視覺。
describe('UploadDropzoneComponent — 錯誤狀態（紅框 + tooltip）', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UploadDropzoneComponent] }).compileComponents();
  });

  function createZone(errorMessage: string): HTMLElement {
    const fixture = TestBed.createComponent(UploadDropzoneComponent);
    fixture.componentInstance.errorMessage = errorMessage;
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.upload-dropzone');
  }

  it('errorMessage 有值 → dropzone 帶 --error class（紅色框線）', () => {
    expect(createZone('請至少上傳一份原始檔案').classList.contains('upload-dropzone--error')).toBeTrue();
  });

  it('errorMessage 空字串 → 無 --error class', () => {
    expect(createZone('').classList.contains('upload-dropzone--error')).toBeFalse();
  });
});

// 錯誤提示位置（2026-10-14 使用者定案）：欄位錯誤預設顯示在下方；版面放不下時可用 errorPosition 改上方。
describe('UploadDropzoneComponent — 錯誤提示位置', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UploadDropzoneComponent] }).compileComponents();
  });

  function tooltipPosition(set?: (c: UploadDropzoneComponent) => void): 'top' | 'bottom' {
    const fixture = TestBed.createComponent(UploadDropzoneComponent);
    fixture.componentInstance.errorMessage = '請至少上傳一份原始檔案';
    set?.(fixture.componentInstance);
    fixture.detectChanges();
    const host = fixture.debugElement.query(By.directive(ErrorTooltipDirective));
    return host.injector.get(ErrorTooltipDirective).errorPosition;
  }

  it('沒有指定時，錯誤提示在下方', () => {
    expect(tooltipPosition()).toBe('bottom');
  });

  it('errorPosition="top" 時，錯誤提示在上方', () => {
    expect(tooltipPosition((c) => (c.errorPosition = 'top'))).toBe('top');
  });
});
