import { TestBed } from '@angular/core/testing';
import { UploadDropzoneComponent } from './upload-dropzone.component';

// 錯誤狀態一致化（2026-07-08 使用者定案）：errorMessage 有值 → appErrorTooltip（既有）+ 紅色框線
// （--error class，border 用 --border/error，與 app-input 錯誤框線同 token）。
// 所有複用處（wizard / HDM / client-edit / p1 / closed-deal）自動獲得同一視覺。
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
    expect(createZone('請至少上傳一份報價單原檔').classList.contains('upload-dropzone--error')).toBeTrue();
  });

  it('errorMessage 空字串 → 無 --error class', () => {
    expect(createZone('').classList.contains('upload-dropzone--error')).toBeFalse();
  });
});
