import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InlineEditComponent } from './inline-edit.component';

/**
 * 按 Enter／Esc 收起後，元件會在 document 上吃掉同一個鍵的連發，直到放開。測試裡沒有真的放開按鍵，
 * 每條測試結束時補一次放開，免得影響到後面別的元件的測試。
 */
const releaseKeys = (): void => {
  for (const key of ['Enter', 'Escape']) {
    document.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  }
};

/**
 * app-inline-edit — 顯示文字 ↔ 輸入框
 * 行為：Enter 或離開輸入框送出（去頭尾空白、跟原值不同才發）；Esc 放棄；Enter／Esc 不往外傳。
 */
@Component({
  standalone: true,
  imports: [InlineEditComponent],
  template: `
    <div class="outer" (keydown)="outerKeys.push($event.key)">
      <app-inline-edit
        ariaLabel="名稱"
        [value]="value()"
        [placeholder]="placeholder()"
        [size]="size()"
        [errorMessage]="error()"
        [saving]="saving()"
        [disabled]="disabled()"
        [editing]="editing()"
        (editingChange)="editing.set($event)"
        (draftChange)="drafts.push($event)"
        (commit)="commits.push($event)"
        (cancel)="cancels = cancels + 1"
        (closed)="closes.push($event)">
      </app-inline-edit>
      <button type="button" class="elsewhere">別處</button>
    </div>
  `,
})
class HostComponent {
  readonly value = signal('第一季');
  readonly placeholder = signal('');
  readonly size = signal<'S' | 'M'>('S');
  readonly error = signal('');
  readonly saving = signal(false);
  readonly disabled = signal(false);
  readonly editing = signal(false);
  commits: string[] = [];
  drafts: string[] = [];
  outerKeys: string[] = [];
  closes: string[] = [];
  cancels = 0;
}

describe('InlineEditComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let windowKeys: string[];
  let onWindowKey: (e: KeyboardEvent) => void;
  let hasFocus: jasmine.Spy;

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const display = (): HTMLButtonElement | null => el().querySelector('.inline-edit__display');
  const input = (): HTMLInputElement | null => el().querySelector('app-inline-edit input');

  /** 等 queueMicrotask 排的聚焦跑完 */
  const settle = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
  };

  const type = (text: string): void => {
    const field = input()!;
    field.value = text;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };

  const press = (target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  const startEditing = (): void => {
    display()!.click();
    fixture.detectChanges();
  };

  /**
   * 把焦點移到別處＝離開輸入框。瀏覽器視窗本身沒有焦點時（CI 的 Headless Chrome），focus() 會換掉
   * activeElement 但不發 blur 事件，所以輸入框還在就補發一次；已經發過的話輸入框已被拆掉，不會重複。
   */
  const leaveInput = (): HTMLButtonElement => {
    const field = input()!;
    const elsewhere = el().querySelector('.elsewhere') as HTMLButtonElement;
    elsewhere.focus();
    if (field.isConnected) field.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    return elsewhere;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    windowKeys = [];
    onWindowKey = (e: KeyboardEvent) => windowKeys.push(e.key);
    window.addEventListener('keydown', onWindowKey);
    // 元件用 document.hasFocus() 分辨「離開輸入框」與「整個視窗失去焦點」。測試視窗有沒有焦點不一定，固定成有
    hasFocus = spyOn(document, 'hasFocus').and.returnValue(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    window.removeEventListener('keydown', onWindowKey);
    releaseKeys();
  });

  // ── 顯示 ──────────────────────────────────────────────────────

  it('顯示態是可聚焦的 button，名稱含 ariaLabel 與目前的值', () => {
    const button = display()!;
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.tabIndex).toBe(0);
    expect(button.textContent!.trim()).toBe('第一季');
    expect(button.getAttribute('aria-label')).toBe('編輯名稱，目前是第一季');
    expect(input()).toBeNull();
  });

  it('值為空 → 顯示 placeholder；名稱念「目前是空的」', () => {
    host.value.set('');
    host.placeholder.set('未命名');
    fixture.detectChanges();
    expect(display()!.textContent!.trim()).toBe('未命名');
    expect(el().querySelector('.inline-edit__text--placeholder')).not.toBeNull();
    expect(display()!.getAttribute('aria-label')).toBe('編輯名稱，目前是空的');
  });

  it('文字固定一行、放不下用刪節號', () => {
    const text = el().querySelector('.inline-edit__text') as HTMLElement;
    const style = getComputedStyle(text);
    expect(style.whiteSpace).toBe('nowrap');
    expect(style.textOverflow).toBe('ellipsis');
    expect(style.overflow).toBe('hidden');
  });

  it('顯示文字的最小高度對齊同尺寸輸入框（S 32px、M 36px）', () => {
    expect(getComputedStyle(display()!).minHeight).toBe('32px');
    host.size.set('M');
    fixture.detectChanges();
    expect(getComputedStyle(display()!).minHeight).toBe('36px');
  });

  // ── 進入編輯 ──────────────────────────────────────────────────

  it('點文字 → 出現輸入框，帶入目前的值、已聚焦、已全選，名稱是 ariaLabel', () => {
    startEditing();
    const field = input()!;
    expect(field.value).toBe('第一季');
    expect(document.activeElement).toBe(field);
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe('第一季'.length);
    expect(field.getAttribute('aria-label')).toBe('名稱');
    expect(display()).toBeNull();
    expect(host.editing()).toBeTrue();
  });

  it('外部把 editing 設為 true → 進入編輯並聚焦全選', async () => {
    host.editing.set(true);
    await settle();
    const field = input()!;
    expect(document.activeElement).toBe(field);
    expect(field.selectionEnd).toBe('第一季'.length);
  });

  it('外部把 editing 設回 false → 收起，不送出', async () => {
    host.editing.set(true);
    await settle();
    type('第二季');
    host.editing.set(false);
    await settle();
    expect(input()).toBeNull();
    expect(host.commits).toEqual([]);
  });

  it('disabled → 按鈕停用，點了進不了編輯', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(display()!.disabled).toBeTrue();
    display()!.click();
    fixture.detectChanges();
    expect(input()).toBeNull();
  });

  it('disabled 時外部把 editing 設為 true → 不開，並把 editing 改回 false', async () => {
    host.disabled.set(true);
    fixture.detectChanges();
    host.editing.set(true);
    await settle();
    expect(input()).toBeNull();
    expect(host.editing()).toBeFalse();
  });

  // ── Enter ─────────────────────────────────────────────────────

  it('改字後按 Enter → 送出去頭尾空白的字串一次，收起，焦點回到顯示文字', () => {
    startEditing();
    type('  第二季  ');
    press(input()!, 'Enter');
    expect(host.commits).toEqual(['第二季']);
    expect(input()).toBeNull();
    expect(document.activeElement).toBe(display());
    expect(host.editing()).toBeFalse();
  });

  it('Enter 不往外傳（外層與 window 都收不到），且已 preventDefault', () => {
    startEditing();
    type('第二季');
    const event = press(input()!, 'Enter');
    expect(event.defaultPrevented).toBeTrue();
    expect(host.outerKeys).toEqual([]);
    expect(windowKeys).toEqual([]);
  });

  it('按住 Enter → 只送出一次；落在顯示文字上的連發不會再打開輸入框', () => {
    startEditing();
    type('第二季');
    press(input()!, 'Enter');
    const repeat = press(display()!, 'Enter', { repeat: true });
    expect(repeat.defaultPrevented).toBeTrue();
    expect(host.commits).toEqual(['第二季']);
    expect(input()).toBeNull();
  });

  it('輸入框裡的 Enter 連發（repeat）不送出', () => {
    startEditing();
    type('第二季');
    press(input()!, 'Enter', { repeat: true });
    expect(host.commits).toEqual([]);
    expect(input()).not.toBeNull();
  });

  it('內容沒變（含只差頭尾空白）→ 收起，不送出', () => {
    startEditing();
    type('  第一季 ');
    press(input()!, 'Enter');
    expect(host.commits).toEqual([]);
    expect(input()).toBeNull();
  });

  // ── Esc ───────────────────────────────────────────────────────

  it('按 Esc → 不送出，收起，焦點回到顯示文字，發 cancel', () => {
    startEditing();
    type('第二季');
    press(input()!, 'Escape');
    expect(host.commits).toEqual([]);
    expect(host.cancels).toBe(1);
    expect(input()).toBeNull();
    expect(document.activeElement).toBe(display());
    expect(display()!.textContent!.trim()).toBe('第一季');
  });

  it('Esc 不往外傳（外層與 window 都收不到），且已 preventDefault', () => {
    startEditing();
    const event = press(input()!, 'Escape');
    expect(event.defaultPrevented).toBeTrue();
    expect(host.outerKeys).toEqual([]);
    expect(windowKeys).toEqual([]);
  });

  it('收起後落在顯示文字上的 Esc 連發不往外傳；單獨按一下的 Esc 照常往外傳', () => {
    startEditing();
    press(input()!, 'Escape');
    press(display()!, 'Escape', { repeat: true });
    expect(windowKeys).toEqual([]);
    press(display()!, 'Escape');
    expect(windowKeys).toEqual(['Escape']);
  });

  // ── 輸入法 ────────────────────────────────────────────────────

  it('輸入法選字中的 Enter（isComposing）→ 不送出、不收起、不往外傳', () => {
    startEditing();
    type('第二');
    press(input()!, 'Enter', { isComposing: true });
    expect(host.commits).toEqual([]);
    expect(input()).not.toBeNull();
    expect(windowKeys).toEqual([]);
  });

  it('輸入法選字中的 Enter（keyCode 229，Safari）→ 不送出、不收起', () => {
    startEditing();
    type('第二');
    press(input()!, 'Enter', { keyCode: 229 });
    expect(host.commits).toEqual([]);
    expect(input()).not.toBeNull();
  });

  it('輸入法選字中的 Esc → 不收起、不發 cancel、不往外傳', () => {
    startEditing();
    type('第二');
    press(input()!, 'Escape', { isComposing: true });
    expect(input()).not.toBeNull();
    expect(host.cancels).toBe(0);
    expect(windowKeys).toEqual([]);
  });

  // ── 失焦 ──────────────────────────────────────────────────────

  it('離開輸入框（焦點移到別處）→ 送出一次，收起，焦點不被拉回', () => {
    startEditing();
    type('第二季');
    const elsewhere = leaveInput();
    expect(host.commits).toEqual(['第二季']);
    expect(host.closes).toEqual(['blur']);
    expect(input()).toBeNull();
    expect(document.activeElement).toBe(elsewhere);
  });

  it('整個視窗失去焦點（切到別的視窗或分頁）→ 不送出，留在編輯中，打到一半的字還在', () => {
    startEditing();
    type('打到一半');
    hasFocus.and.returnValue(false);
    input()!.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(host.commits).toEqual([]);
    expect(host.closes).toEqual([]);
    expect(input()!.value).toBe('打到一半');
    expect(host.editing()).toBeTrue();
    // 回來之後照常：這時離開輸入框才送出
    hasFocus.and.returnValue(true);
    leaveInput();
    expect(host.commits).toEqual(['打到一半']);
  });

  it('收起的原因：Enter 與 Esc 是 key，離開輸入框是 blur；內容沒變也會發', () => {
    startEditing();
    press(input()!, 'Enter'); // 沒改
    startEditing();
    type('第二季');
    press(input()!, 'Escape');
    startEditing();
    leaveInput(); // 沒改
    expect(host.closes).toEqual(['key', 'key', 'blur']);
    expect(host.commits).toEqual([]);
  });

  it('Enter 送出後輸入框被拆掉，不會因為失焦再送一次', () => {
    startEditing();
    type('第二季');
    const field = input()!;
    press(field, 'Enter');
    field.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(host.commits).toEqual(['第二季']);
  });

  // ── 錯誤訊息 ──────────────────────────────────────────────────

  it('draftChange 每次輸入都發，使用端據此給 errorMessage', () => {
    startEditing();
    type('');
    expect(host.drafts).toEqual(['']);
  });

  it('有 errorMessage 時按 Enter → 不送出，留在編輯中，輸入框是錯誤狀態', () => {
    startEditing();
    type('');
    host.error.set('名稱不能空白');
    fixture.detectChanges();
    press(input()!, 'Enter');
    expect(host.commits).toEqual([]);
    expect(input()).not.toBeNull();
    expect(el().querySelector('.input-wrap--error')).not.toBeNull();
  });

  it('有 errorMessage 時離開輸入框 → 不送出，留在編輯中', () => {
    startEditing();
    type('');
    host.error.set('名稱不能空白');
    fixture.detectChanges();
    leaveInput();
    expect(host.commits).toEqual([]);
    expect(host.closes).toEqual([]);
    expect(input()).not.toBeNull();
  });

  it('送出被錯誤訊息擋下 → 報讀區念出錯誤訊息；改字就清掉；平常是空的', () => {
    const status = el().querySelector('app-inline-edit [role="status"]') as HTMLElement;
    startEditing();
    type('');
    host.error.set('名稱不能空白');
    fixture.detectChanges();
    expect(status.textContent!.trim()).withContext('還沒按 Enter：不念').toBe('');
    press(input()!, 'Enter');
    expect(status.textContent!.trim()).toBe('名稱不能空白');
    host.error.set('');
    type('第二季');
    expect(status.textContent!.trim()).toBe('');
  });

  it('有 errorMessage 時按 Esc → 照樣可以放棄', () => {
    startEditing();
    type('');
    host.error.set('名稱不能空白');
    fixture.detectChanges();
    press(input()!, 'Escape');
    expect(input()).toBeNull();
    expect(host.cancels).toBe(1);
  });

  // ── 儲存中 ────────────────────────────────────────────────────

  it('saving → 顯示剛送出的文字與轉圈，aria-busy，進不了編輯', () => {
    startEditing();
    type('第二季');
    press(input()!, 'Enter');
    host.saving.set(true); // 使用端在 commit 後開始存檔；value 還是舊的
    fixture.detectChanges();

    const button = display()!;
    expect(button.textContent!.trim()).toBe('第二季');
    expect(el().querySelector('app-spinner')).not.toBeNull();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('編輯名稱，目前是第二季');

    button.click();
    fixture.detectChanges();
    expect(input()).toBeNull();
  });

  it('報讀區一直存在：平常是空的，saving 才填「名稱儲存中」，結束後清空；編輯中也在', () => {
    const status = (): HTMLElement => el().querySelector('app-inline-edit [role="status"]') as HTMLElement;
    const region = status();
    expect(region).not.toBeNull();
    expect(region.textContent!.trim()).toBe('');

    startEditing();
    expect(status()).toBe(region); // 進入編輯不會重建它
    type('第二季');
    press(input()!, 'Enter');
    host.saving.set(true);
    fixture.detectChanges();
    expect(status()).toBe(region);
    expect(region.textContent!.trim()).toBe('名稱儲存中');

    host.saving.set(false);
    fixture.detectChanges();
    expect(region.textContent!.trim()).toBe('');
  });

  it('saving 結束且存檔失敗（value 沒變）→ 顯示原值，轉圈消失', () => {
    startEditing();
    type('第二季');
    press(input()!, 'Enter');
    host.saving.set(true);
    fixture.detectChanges();
    host.saving.set(false);
    fixture.detectChanges();
    expect(display()!.textContent!.trim()).toBe('第一季');
    expect(el().querySelector('app-spinner')).toBeNull();
    expect(display()!.hasAttribute('aria-busy')).toBeFalse();
  });

  it('saving 結束且存檔成功（value 換新）→ 顯示新值', () => {
    startEditing();
    type('第二季');
    press(input()!, 'Enter');
    host.saving.set(true);
    fixture.detectChanges();
    host.value.set('第二季');
    host.saving.set(false);
    fixture.detectChanges();
    expect(display()!.textContent!.trim()).toBe('第二季');
  });

  it('沒有 saving 的使用端（先換值）→ commit 後直接顯示新的 value', () => {
    startEditing();
    type('第二季');
    press(input()!, 'Enter');
    host.value.set(host.commits[0]);
    fixture.detectChanges();
    expect(display()!.textContent!.trim()).toBe('第二季');
    expect(el().querySelector('app-spinner')).toBeNull();
  });

  it('saving 不是從這裡送出的（之前沒有 commit）→ 顯示 value 加轉圈', () => {
    host.saving.set(true);
    fixture.detectChanges();
    expect(display()!.textContent!.trim()).toBe('第一季');
    expect(el().querySelector('app-spinner')).not.toBeNull();
  });

  it('存檔結束後忘掉剛送出的文字：之後別的原因再進入 saving，顯示的是 value', () => {
    startEditing();
    type('第二季');
    press(input()!, 'Enter');
    host.saving.set(true);
    fixture.detectChanges();
    host.saving.set(false); // 失敗，value 還是「第一季」
    fixture.detectChanges();
    host.saving.set(true);
    fixture.detectChanges();
    expect(display()!.textContent!.trim()).toBe('第一季');
  });

  it('送出空字串後存檔中 → 顯示提示文字，不顯示舊值', () => {
    host.placeholder.set('未命名');
    fixture.detectChanges();
    startEditing();
    type('');
    press(input()!, 'Enter');
    expect(host.commits).toEqual(['']);
    host.saving.set(true);
    fixture.detectChanges();
    expect(display()!.textContent!.trim()).toBe('未命名');
  });

  it('沒有值也沒有提示文字 → 按鈕還留有 40px 寬可以點', () => {
    host.value.set('');
    fixture.detectChanges();
    expect(display()!.getBoundingClientRect().width).toBeGreaterThanOrEqual(40);
  });

  it('saving 時外部把 editing 設為 true → 不開，並把 editing 改回 false', async () => {
    host.saving.set(true);
    fixture.detectChanges();
    host.editing.set(true);
    await settle();
    expect(input()).toBeNull();
    expect(host.editing()).toBeFalse();
  });

  it('saving 時在顯示文字上按 Enter／空白鍵 → 進不了編輯，按鍵照常往外傳', () => {
    host.saving.set(true);
    fixture.detectChanges();
    press(display()!, 'Enter');
    press(display()!, ' ');
    expect(input()).toBeNull();
    expect(windowKeys).toEqual(['Enter', ' ']);
  });

  it('用來進入編輯的 Enter／空白鍵不往外傳，也不擋預設動作（原生按鈕靠它觸發 click）', () => {
    const enter = press(display()!, 'Enter');
    const space = press(display()!, ' ');
    expect(windowKeys).toEqual([]);
    expect(host.outerKeys).toEqual([]);
    expect(enter.defaultPrevented).toBeFalse();
    expect(space.defaultPrevented).toBeFalse();
  });

  it('編輯中 value 被使用端換掉 → 輸入框顯示新值，不改就按 Enter 不送出', () => {
    startEditing();
    type('打到一半');
    host.value.set('別人改的名稱');
    fixture.detectChanges();
    expect(input()!.value).toBe('別人改的名稱');
    press(input()!, 'Enter');
    expect(host.commits).toEqual([]);
  });

  it('送出後使用端沒有進入 saving → 忘掉剛送出的文字；之後別的原因進入 saving 顯示的是 value', async () => {
    startEditing();
    type('第二季');
    press(input()!, 'Enter'); // 使用端不設 saving，也還沒換 value
    await new Promise(r => setTimeout(r, 0));
    host.saving.set(true);
    fixture.detectChanges();
    expect(display()!.textContent!.trim()).toBe('第一季');
    expect(display()!.getAttribute('aria-label')).toBe('編輯名稱，目前是第一季');
  });

  it('不在存檔中而 value 換了 → 忘掉剛送出的文字', () => {
    startEditing();
    type('第二季');
    press(input()!, 'Enter');
    host.value.set('另一筆資料的名稱'); // 同一個元件改顯示另一筆
    fixture.detectChanges();
    host.saving.set(true);
    fixture.detectChanges();
    expect(display()!.textContent!.trim()).toBe('另一筆資料的名稱');
  });

  it('再次進入編輯 → 帶入最新的 value，不是上次打到一半的字', () => {
    startEditing();
    type('打到一半');
    press(input()!, 'Escape');
    startEditing();
    expect(input()!.value).toBe('第一季');
  });
});

// ── 元件一出現就是編輯狀態（使用端只在編輯時才放它）──────────────

@Component({
  standalone: true,
  imports: [InlineEditComponent],
  template: `
    @if (show()) {
      <app-inline-edit ariaLabel="標題" value="合約" [editing]="true"
        (editingChange)="$event ? null : show.set(false)"
        (commit)="commits.push($event)">
      </app-inline-edit>
    }
  `,
})
class EditOnlyHostComponent {
  readonly show = signal(true);
  commits: string[] = [];
}

// ── 寬度：使用端給了寬度，輸入框填滿它 ──────────────────────────

@Component({
  standalone: true,
  imports: [InlineEditComponent],
  template: `<app-inline-edit style="width: 320px" ariaLabel="標題" value="合約" [editing]="true"></app-inline-edit>`,
})
class FixedWidthHostComponent {}

describe('InlineEditComponent（使用端指定寬度）', () => {
  it('輸入框寬度等於使用端給的 320px', () => {
    TestBed.configureTestingModule({ imports: [FixedWidthHostComponent] });
    const fixture = TestBed.createComponent(FixedWidthHostComponent);
    fixture.detectChanges();
    const box = (fixture.nativeElement as HTMLElement).querySelector('.input-box') as HTMLElement;
    expect(Math.round(box.getBoundingClientRect().width)).toBe(320);
  });
});

@Component({
  standalone: true,
  imports: [InlineEditComponent],
  template: `<div style="display:flex;width:100px"><app-inline-edit ariaLabel="標題" value="合約" [editing]="true"></app-inline-edit></div>`,
})
class NarrowHostComponent {}

describe('InlineEditComponent（外層比 160px 窄）', () => {
  it('輸入框跟著外層縮，不凸出去', () => {
    TestBed.configureTestingModule({ imports: [NarrowHostComponent] });
    const fixture = TestBed.createComponent(NarrowHostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const outer = (root.querySelector('div') as HTMLElement).getBoundingClientRect();
    const box = (root.querySelector('.input-box') as HTMLElement).getBoundingClientRect();
    expect(Math.round(box.right)).toBeLessThanOrEqual(Math.round(outer.right));
    expect(Math.round(box.width)).toBeLessThanOrEqual(100);
  });
});

// ── 按住不放的連發：元件被使用端拿掉之後也要吃掉 ──────────────────

describe('InlineEditComponent（收起後按住不放的連發）', () => {
  let windowKeys: string[];
  let onKey: (e: KeyboardEvent) => void;

  const setup = async (): Promise<{ root: HTMLElement; field: HTMLInputElement; fixture: ComponentFixture<EditOnlyHostComponent> }> => {
    TestBed.configureTestingModule({ imports: [EditOnlyHostComponent] });
    const fixture = TestBed.createComponent(EditOnlyHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return { root, field: root.querySelector('input') as HTMLInputElement, fixture };
  };
  const send = (target: EventTarget, type: string, key: string, repeat = false): KeyboardEvent => {
    const event = new KeyboardEvent(type, { key, repeat, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
  };

  beforeEach(() => {
    windowKeys = [];
    onKey = (e: KeyboardEvent) => windowKeys.push(e.key + (e.repeat ? ':repeat' : ''));
    window.addEventListener('keydown', onKey);
  });
  afterEach(() => {
    window.removeEventListener('keydown', onKey);
    releaseKeys();
  });

  it('沒收到放開（發生在別的視窗）也不會一直擋：重新按一次同一個鍵就收掉', async () => {
    const { field, fixture } = await setup();
    send(field, 'keydown', 'Escape');
    fixture.detectChanges();
    expect(send(document.body, 'keydown', 'Escape', true).defaultPrevented).toBeTrue();
    const fresh = send(document.body, 'keydown', 'Escape'); // 重新按一次
    expect(fresh.defaultPrevented).toBeFalse();
    send(document.body, 'keydown', 'Escape', true);
    expect(windowKeys).toEqual(['Escape', 'Escape:repeat']);
  });

  it('Esc 收起、元件被拿掉後，落在 body 的 Esc 連發不往外傳；放開之後的 Esc 照常', async () => {
    const { root, field, fixture } = await setup();
    send(field, 'keydown', 'Escape');
    fixture.detectChanges();
    expect(root.querySelector('app-inline-edit')).withContext('使用端已把元件拿掉').toBeNull();

    const held = send(document.body, 'keydown', 'Escape', true);
    expect(held.defaultPrevented).toBeTrue();
    expect(windowKeys).toEqual([]);

    send(document.body, 'keyup', 'Escape');
    send(document.body, 'keydown', 'Escape', true); // 另一次按住（理論上先有非連發的一下，這裡只驗監聽已經拿掉）
    expect(windowKeys).toEqual(['Escape:repeat']);
  });

  it('Enter 收起後，Enter 連發被吃掉；別的鍵不受影響', async () => {
    const { field, fixture } = await setup();
    field.value = '合約書';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    send(field, 'keydown', 'Enter');
    fixture.detectChanges();

    expect(send(document.body, 'keydown', 'Enter', true).defaultPrevented).toBeTrue();
    send(document.body, 'keydown', 'a', true);
    expect(windowKeys).toEqual(['a:repeat']);
  });
});

// ── 事件順序：先 commit／cancel，最後才 editingChange ──────────────

@Component({
  standalone: true,
  imports: [InlineEditComponent],
  template: `
    <app-inline-edit ariaLabel="名稱" value="第一季"
      (commit)="log.push('commit:' + $event)"
      (cancel)="log.push('cancel')"
      (editingChange)="log.push('editing:' + $event)">
    </app-inline-edit>
  `,
})
class OrderHostComponent {
  log: string[] = [];
}

describe('InlineEditComponent（事件順序）', () => {
  let fixture: ComponentFixture<OrderHostComponent>;
  const root = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const open = (): HTMLInputElement => {
    (root().querySelector('.inline-edit__display') as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.componentInstance.log = [];
    return root().querySelector('input') as HTMLInputElement;
  };
  const key = (field: HTMLInputElement, k: string): void => {
    field.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  afterEach(releaseKeys);

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OrderHostComponent] });
    fixture = TestBed.createComponent(OrderHostComponent);
    fixture.detectChanges();
  });

  it('送出：commit 在 editingChange 之前', () => {
    const field = open();
    field.value = '第二季';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    key(field, 'Enter');
    expect(fixture.componentInstance.log).toEqual(['commit:第二季', 'editing:false']);
  });

  it('放棄：cancel 在 editingChange 之前', () => {
    key(open(), 'Escape');
    expect(fixture.componentInstance.log).toEqual(['cancel', 'editing:false']);
  });

  it('內容沒變：只發 editingChange', () => {
    key(open(), 'Enter');
    expect(fixture.componentInstance.log).toEqual(['editing:false']);
  });
});

@Component({
  standalone: true,
  imports: [InlineEditComponent],
  template: `<app-inline-edit ariaLabel="標題" value="合約" [disabled]="true" [(editing)]="editing"></app-inline-edit>`,
})
class DisabledEditOnInitHostComponent {
  editing = true;
}

describe('InlineEditComponent（一建立就是 editing 但停用）', () => {
  it('不開，並把 editing 改回 false', async () => {
    TestBed.configureTestingModule({ imports: [DisabledEditOnInitHostComponent] });
    const fixture = TestBed.createComponent(DisabledEditOnInitHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('input')).toBeNull();
    expect(fixture.componentInstance.editing).toBeFalse();
  });
});

describe('InlineEditComponent（一出現就是編輯狀態）', () => {
  afterEach(releaseKeys);

  it('直接畫輸入框，帶入值、聚焦並全選；送出後使用端把它拿掉', async () => {
    TestBed.configureTestingModule({ imports: [EditOnlyHostComponent] });
    const fixture = TestBed.createComponent(EditOnlyHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const field = root.querySelector('input') as HTMLInputElement;
    expect(field.value).toBe('合約');
    expect(document.activeElement).toBe(field);
    expect(field.selectionEnd).toBe(2);
    expect(root.querySelector('.inline-edit__display')).toBeNull();

    field.value = '合約書';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.commits).toEqual(['合約書']);
    expect(root.querySelector('app-inline-edit')).toBeNull();
  });
});
