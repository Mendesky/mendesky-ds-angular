import { ApplicationRef, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogComponent } from './dialog.component';
import { DatePickerComponent } from '../date-picker/date-picker.component';

// ── 對話框關掉後，焦點回到打開前的地方（2026-11-09）──────────────────────────────
// app-dialog 一畫出來就記下「關掉後焦點還給誰」。日期面板開著時，焦點在面板的格子上；
// 面板要在對話框記之前關好、把焦點還給日期按鈕，對話框記到的才是日期按鈕，
// 否則記到即將被移除的格子，關掉後焦點落到 body，用鍵盤的人得從頭找。

@Component({
  standalone: true,
  imports: [DialogComponent, DatePickerComponent],
  template: `
    <button type="button" class="opener">打開提示</button>
    <app-date-picker mode="month"></app-date-picker>
    <app-dialog [isOpen]="dialogOpen" header="提示" content="內容" (cancel)="dialogOpen = false"></app-dialog>
  `,
})
class DialogFocusHostComponent {
  dialogOpen = false;
}

describe('DialogComponent — 關掉後焦點回到打開前的地方', () => {
  let fixture: ComponentFixture<DialogFocusHostComponent>;
  let host: DialogFocusHostComponent;
  let appRef: ApplicationRef;

  const root = () => fixture.nativeElement as HTMLElement;
  const opener = () => root().querySelector('.opener') as HTMLElement;
  const trigger = () => root().querySelector('.dp-trigger') as HTMLElement;
  const panel = () => document.querySelector('app-date-panel');
  const dialogEl = () => document.querySelector('app-dialog') as HTMLElement;
  const active = () => document.activeElement as HTMLElement | null;

  async function settle(): Promise<void> {
    fixture.detectChanges();
    appRef.tick();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    appRef.tick();
    await fixture.whenStable();
  }

  /** 關掉對話框，等退場動畫（250ms）結束、對話框從畫面移除 */
  async function closeDialog(): Promise<void> {
    host.dialogOpen = false;
    await settle();
    await new Promise((r) => setTimeout(r, 300));
    await settle();
    expect(dialogEl().querySelector('.dialog-card')).withContext('對話框已移除').toBeNull();
  }

  async function openPanel(): Promise<void> {
    trigger().focus();
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await settle();
    expect(panel()).withContext('面板有打開').not.toBeNull();
    expect(panel()!.contains(active())).withContext('前提：焦點在面板裡').toBeTrue();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DialogFocusHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(DialogFocusHostComponent);
    host = fixture.componentInstance;
    appRef = TestBed.inject(ApplicationRef);
    document.body.appendChild(fixture.nativeElement);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    (fixture.nativeElement as HTMLElement).remove();
  });

  it('日期面板開著時打開對話框，再關掉 → 焦點回到日期按鈕', async () => {
    await openPanel();

    host.dialogOpen = true;
    await settle();
    expect(dialogEl().contains(active())).withContext('對話框接手焦點').toBeTrue();

    await closeDialog();
    expect(active()).withContext('焦點回到日期按鈕，不是 body').toBe(trigger());
  });

  it('日期面板開著時打開對話框 → 面板關閉，日期按鈕不再標成展開', async () => {
    await openPanel();

    host.dialogOpen = true;
    await settle();

    expect(panel()).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    await closeDialog();
  });

  it('從按鈕打開對話框，再關掉 → 焦點回到那個按鈕', async () => {
    opener().focus();

    host.dialogOpen = true;
    await settle();
    expect(dialogEl().contains(active())).withContext('對話框接手焦點').toBeTrue();

    await closeDialog();
    expect(active()).toBe(opener());
  });

  it('打開後只做一次變更偵測、等穩定 → 焦點已經在對話框裡', async () => {
    // 使用端測試常見的寫法（例：mendesky-web 批註面板的刪除確認），不另外多跑變更偵測。
    opener().focus();

    host.dialogOpen = true;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogEl().contains(active())).toBeTrue();
    await closeDialog();
  });
});
