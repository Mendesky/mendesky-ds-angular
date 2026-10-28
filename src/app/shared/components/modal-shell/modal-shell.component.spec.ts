import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { Component, SimpleChange } from '@angular/core';
import { ModalShellComponent } from './modal-shell.component';
import { ModalTitleDirective } from './modal-title.directive';

/**
 * 回歸：modal-shell 退場（leaving）期間，backdrop / card 不得攔截 pointer。
 *
 * Bug（2026-06-24）：關閉彈窗後，`.modal-backdrop--leaving` 仍留 DOM 450ms（等退場動畫）
 * 且 pointer-events 預設 auto，全螢幕 fixed（z-index 500）攔截關閉後第一個 click →
 * 「關閉版本更新公告後第一次點卡片 menu 被吞」。修法：leaving 狀態加 pointer-events: none。
 *
 * 行為層的完整紅→綠要靠使用端的 e2e；此處是不需 server 的快速 guard。
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

/**
 * 報讀名稱（2026-10-28）：
 * - 名稱來源依序是 ariaLabel、ariaLabelledBy、appModalTitle 標題；卡片上只會有 aria-label 或 aria-labelledby 其中一個。
 * - 直接寫在 <app-modal-shell> 上的 aria-label 留在外層，不會到卡片。
 */
@Component({
  standalone: true,
  imports: [ModalShellComponent, ModalTitleDirective],
  template: `
    <app-modal-shell [isOpen]="open" [ariaLabel]="ariaLabel" [ariaLabelledBy]="ariaLabelledBy">
      @if (titleA) {
        <h2 appModalTitle>標題 A</h2>
      }
      @if (titleB) {
        <h2 appModalTitle>標題 B</h2>
      }
      <span id="external-title">外部標題</span>
      <p>內容</p>
    </app-modal-shell>
  `,
})
class NameHostComponent {
  open = false;
  ariaLabel = '';
  ariaLabelledBy = '';
  titleA = false;
  titleB = false;
}

@Component({
  standalone: true,
  imports: [ModalShellComponent],
  template: `<app-modal-shell [isOpen]="true" aria-label="外層名稱"><p>內容</p></app-modal-shell>`,
})
class HostAttrComponent {}

const dialogCard = (): HTMLElement => document.querySelector('.modal-card[role="dialog"]') as HTMLElement;

describe('ModalShellComponent — 報讀名稱', () => {
  let fixture: ComponentFixture<NameHostComponent>;

  function render(patch: Partial<NameHostComponent>): void {
    fixture = TestBed.createComponent(NameHostComponent);
    Object.assign(fixture.componentInstance, { open: true, ...patch });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NameHostComponent, HostAttrComponent] }).compileComponents();
  });

  afterEach(() => fixture?.destroy());

  it('ariaLabel：卡片有 aria-label，沒有 aria-labelledby', () => {
    render({ ariaLabel: '搜尋' });
    expect(dialogCard().getAttribute('aria-label')).toBe('搜尋');
    expect(dialogCard().hasAttribute('aria-labelledby')).toBeFalse();
  });

  it('ariaLabel 加上標題標記：仍然只輸出 aria-label', () => {
    render({ ariaLabel: '搜尋', titleA: true });
    expect(dialogCard().getAttribute('aria-label')).toBe('搜尋');
    expect(dialogCard().hasAttribute('aria-labelledby')).toBeFalse();
  });

  it('ariaLabelledBy 加上標題標記：卡片指向 ariaLabelledBy', () => {
    render({ ariaLabelledBy: 'external-title', titleA: true });
    expect(dialogCard().getAttribute('aria-labelledby')).toBe('external-title');
    expect(dialogCard().hasAttribute('aria-label')).toBeFalse();
  });

  it('ariaLabel 只有空白：當成沒設，卡片指向標題', () => {
    render({ ariaLabel: '   ', titleA: true });
    expect(dialogCard().hasAttribute('aria-label')).toBeFalse();
    expect(document.getElementById(dialogCard().getAttribute('aria-labelledby')!)?.textContent).toBe('標題 A');
  });

  it('都沒設：卡片沒有 aria-label，也沒有 aria-labelledby', () => {
    render({});
    expect(dialogCard().hasAttribute('aria-label')).toBeFalse();
    expect(dialogCard().hasAttribute('aria-labelledby')).toBeFalse();
  });

  it('直接寫 aria-label 會留在外層 app-modal-shell，不會到卡片（說明檔 usageNotes 的依據）', () => {
    const f = TestBed.createComponent(HostAttrComponent);
    f.detectChanges();
    const host = document.querySelector('app-modal-shell[aria-label]') as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('外層名稱');
    expect(host.querySelector('.modal-card')!.hasAttribute('aria-label')).toBeFalse();
    f.destroy();
  });
});

/**
 * 開發模式警告（2026-10-28）：進場動畫結束（450ms）那一刻檢查一次。
 * - 名稱是空的 → console.warn 一次（前綴 [app-modal-shell]）。
 * - 沒設 ariaLabel／ariaLabelledBy、卻標了兩個以上的標題 → 警告。
 * - 450ms 前就關掉或銷毀 → 不檢查。之後標題切換也不再檢查。
 */
describe('ModalShellComponent — 沒有名稱的警告（開發模式）', () => {
  let fixture: ComponentFixture<NameHostComponent>;
  let warn: jasmine.Spy;

  const shellWarns = () => warn.calls.allArgs().filter((args) => String(args[0]).startsWith('[app-modal-shell]'));

  function openWith(patch: Partial<NameHostComponent>): void {
    fixture = TestBed.createComponent(NameHostComponent);
    Object.assign(fixture.componentInstance, { open: true, ...patch });
    fixture.detectChanges();
  }

  function finish(): void {
    fixture.destroy();
    flush();
  }

  beforeEach(async () => {
    warn = spyOn(console, 'warn');
    await TestBed.configureTestingModule({ imports: [NameHostComponent] }).compileComponents();
  });

  it('沒有任何名稱：進場動畫結束前不警告，結束時警告一次', fakeAsync(() => {
    openWith({});
    tick(449);
    expect(shellWarns().length).toBe(0);
    tick(1);
    expect(shellWarns().length).toBe(1);
    tick(2000);
    expect(shellWarns().length).toBe(1);
    finish();
  }));

  it('有標題標記：不警告', fakeAsync(() => {
    openWith({ titleA: true });
    tick(450);
    expect(shellWarns().length).toBe(0);
    finish();
  }));

  it('有 ariaLabel：不警告', fakeAsync(() => {
    openWith({ ariaLabel: '搜尋' });
    tick(450);
    expect(shellWarns().length).toBe(0);
    finish();
  }));

  it('ariaLabelledBy 指到有文字的元素：不警告', fakeAsync(() => {
    openWith({ ariaLabelledBy: 'external-title' });
    tick(450);
    expect(shellWarns().length).toBe(0);
    finish();
  }));

  it('ariaLabelledBy 指到不存在的 id：警告', fakeAsync(() => {
    openWith({ ariaLabelledBy: 'no-such-id' });
    tick(450);
    expect(shellWarns().length).toBe(1);
    finish();
  }));

  it('0.2 秒時就關掉：不警告', fakeAsync(() => {
    openWith({});
    tick(200);
    fixture.componentInstance.open = false;
    fixture.detectChanges();
    tick(1000);
    expect(shellWarns().length).toBe(0);
    finish();
  }));

  it('0.2 秒時就銷毀：不警告', fakeAsync(() => {
    openWith({});
    tick(200);
    fixture.destroy();
    tick(1000);
    expect(shellWarns().length).toBe(0);
    flush();
  }));

  it('標了兩個標題：警告', fakeAsync(() => {
    openWith({ titleA: true, titleB: true });
    tick(450);
    expect(shellWarns().length).toBe(1);
    finish();
  }));

  it('ariaLabel 傳進 undefined（沒開嚴格檢查的 template）：照常警告，不會丟錯', fakeAsync(() => {
    openWith({ ariaLabel: undefined as unknown as string });
    tick(450);
    expect(shellWarns().length).toBe(1);
    finish();
  }));

  it('ariaLabel 只有空白、也沒有標題：警告', fakeAsync(() => {
    openWith({ ariaLabel: '   ' });
    tick(450);
    expect(shellWarns().length).toBe(1);
    finish();
  }));

  it('兩個 @if 標題互相切換：不警告', fakeAsync(() => {
    openWith({ titleA: true });
    tick(450);
    fixture.componentInstance.titleA = false;
    fixture.componentInstance.titleB = true;
    fixture.detectChanges();
    tick(2000);
    expect(shellWarns().length).toBe(0);
    finish();
  }));
});
