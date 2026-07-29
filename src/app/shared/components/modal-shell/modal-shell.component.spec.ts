import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { ModalShellComponent } from './modal-shell.component';

/**
 * 回歸：modal-shell 退場（leaving）期間，backdrop / card 不得攔截 pointer。
 *
 * Bug（2026-06-24）：關閉彈窗後，`.modal-backdrop--leaving` 仍留 DOM 450ms（等退場動畫）
 * 且 pointer-events 預設 auto，全螢幕 fixed（z-index 500）攔截關閉後第一個 click →
 * 「關閉版本更新公告後第一次點卡片 menu 被吞」。修法：leaving 狀態加 pointer-events: none。
 *
 * 行為層的完整紅→綠在 e2e `post-modal-close-menu-click.spec.ts`；此處是不需 server 的快速 guard。
 */
describe('ModalShellComponent — leaving overlay pointer-events 回歸', () => {
  let fixture: ComponentFixture<ModalShellComponent>;
  let component: ModalShellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalShellComponent] }).compileComponents();
    fixture = TestBed.createComponent(ModalShellComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  function open(): void {
    component.isOpen = true;
    component.ngOnChanges({ isOpen: new SimpleChange(false, true, true) });
    fixture.detectChanges();
  }
  function startClose(): void {
    component.isOpen = false;
    component.ngOnChanges({ isOpen: new SimpleChange(true, false, false) });
    fixture.detectChanges();
  }

  it('退場中的 backdrop 不攔截 pointer（pointer-events: none）', () => {
    open();
    startClose();
    const backdrop = document.querySelector('.modal-backdrop--leaving') as HTMLElement | null;
    expect(backdrop).withContext('退場中 backdrop 應仍在 DOM').toBeTruthy();
    expect(getComputedStyle(backdrop!).pointerEvents).toBe('none');
  });

  it('退場中的 card 不攔截 pointer（pointer-events: none）', () => {
    open();
    startClose();
    const card = document.querySelector('.modal-card--leaving') as HTMLElement | null;
    expect(card).withContext('退場中 card 應仍在 DOM').toBeTruthy();
    expect(getComputedStyle(card!).pointerEvents).toBe('none');
  });

  it('開啟中（非退場）的 backdrop 仍可攔截 pointer（不誤傷正常行為）', () => {
    open();
    const backdrop = document.querySelector('.modal-backdrop') as HTMLElement | null;
    expect(backdrop).toBeTruthy();
    expect(getComputedStyle(backdrop!).pointerEvents).not.toBe('none');
  });
});

/**
 * canDismiss gate（2026-06-26）：對齊 ds-patterns modal.dismissal 的 editingDirty/editingClean。
 * - backdrop 受 canDismiss 控制：dirty（canDismiss=false）時點 backdrop 完全 inert，不關。
 * - ESC 不受 gate：dirty 時仍 emit escapePress，由 parent 決定直接關或彈二次確認。
 */
describe('ModalShellComponent — canDismiss backdrop gate', () => {
  let fixture: ComponentFixture<ModalShellComponent>;
  let component: ModalShellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalShellComponent] }).compileComponents();
    fixture = TestBed.createComponent(ModalShellComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  function open(): void {
    component.isOpen = true;
    component.ngOnChanges({ isOpen: new SimpleChange(false, true, true) });
    fixture.detectChanges();
  }

  it('canDismiss=true（預設）：點 backdrop → backdropClick emit 一次', () => {
    let emitted = 0;
    component.backdropClick.subscribe(() => emitted++);
    open();
    (document.querySelector('.modal-backdrop') as HTMLElement).click();
    expect(emitted).toBe(1);
  });

  it('canDismiss=false：點 backdrop → 不 emit（dirty 鎖，backdrop inert）', () => {
    let emitted = 0;
    component.backdropClick.subscribe(() => emitted++);
    component.canDismiss = false;
    open();
    (document.querySelector('.modal-backdrop') as HTMLElement).click();
    expect(emitted).toBe(0);
  });

  it('canDismiss=false：按 ESC → escapePress 仍 emit（ESC 不受 gate）', () => {
    let emitted = 0;
    component.escapePress.subscribe(() => emitted++);
    component.canDismiss = false;
    open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(emitted).toBe(1);
  });
});
