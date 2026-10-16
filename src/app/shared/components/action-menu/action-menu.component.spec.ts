import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActionMenuComponent } from './action-menu.component';

/**
 * 重點：fixture 根元素本身就掛在 document.body，直接斷言根元素 parent 是恆真。
 * 必須用 wrapper host 把 <app-action-menu> 包進容器 div，才能驗證「有沒有從容器搬到 body」。
 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent],
  template: `
    <div class="container-with-backdrop-filter">
      <app-action-menu [fixedMode]="true" [fixedTop]="100" [fixedRight]="50">
        <button type="button">item</button>
      </app-action-menu>
    </div>
  `,
})
class FixedModeHostComponent {}

@Component({
  standalone: true,
  imports: [ActionMenuComponent],
  template: `
    <div class="anchor-container">
      <app-action-menu>
        <button type="button">item</button>
      </app-action-menu>
    </div>
  `,
})
class AnchoredHostComponent {}

/** 非同步內容：初始為 skeleton（無可聚焦），showButton=true 後才出現可聚焦按鈕（模擬下載 submenu 的 loading→內容）。 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent],
  template: `
    <div class="anchor-container">
      <app-action-menu>
        @if (showButton) {
          <button type="button" data-testid="async-btn">item</button>
        } @else {
          <div class="skeleton">loading…</div>
        }
      </app-action-menu>
    </div>
  `,
})
class AsyncContentHostComponent {
  showButton = false;
}

/** 搜尋框下拉情境：錨點是輸入框、打開選單時使用者還在打字。autoFocusFirst 控制要不要把焦點搶進選單。 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent],
  template: `
    <div class="anchor-container">
      <input #typingInput data-testid="typing-input">
      @if (open) {
        <app-action-menu [anchorEl]="typingInput" [autoFocusFirst]="autoFocusFirst">
          <button type="button" data-testid="menu-item">item</button>
        </app-action-menu>
      }
    </div>
  `,
})
class InputAnchoredHostComponent {
  open = false;
  autoFocusFirst = true;
}

/** 同上但完全不綁 autoFocusFirst——驗 DS 的預設值本身 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent],
  template: `
    <div class="anchor-container">
      <input #typingInput data-testid="typing-input">
      @if (open) {
        <app-action-menu [anchorEl]="typingInput">
          <button type="button" data-testid="menu-item">item</button>
        </app-action-menu>
      }
    </div>
  `,
})
class InputAnchoredDefaultHostComponent {
  open = false;
}

describe('ActionMenuComponent — portal 到 document.body', () => {
  afterEach(() => {
    // ngOnDestroy 會把搬到 body 的 host 移除；保險再清一次殘留
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('fixedMode：host 必須搬離容器、portal 到 document.body（position:fixed 在 transform/backdrop-filter 容器內會被 containing block 困住）', () => {
    const fixture = TestBed.createComponent(FixedModeHostComponent);

    fixture.detectChanges(); // 觸發 ngAfterViewInit → _attachFixed

    const menuEl = document.querySelector('app-action-menu');
    expect(menuEl).not.toBeNull();
    expect(menuEl!.parentElement).toBe(document.body);

    fixture.destroy();
    expect(document.querySelector('app-action-menu')).toBeNull(); // ngOnDestroy 自 body 移除
  });

  it('element-anchored（非 fixedMode）：host 同樣 portal 到 document.body（既有行為鎖定）', () => {
    const fixture = TestBed.createComponent(AnchoredHostComponent);

    fixture.detectChanges();

    const menuEl = document.querySelector('app-action-menu');
    expect(menuEl).not.toBeNull();
    expect(menuEl!.parentElement).toBe(document.body);

    fixture.destroy();
    expect(document.querySelector('app-action-menu')).toBeNull();
  });

  it('#1 非同步內容：skeleton→按鈕，內容出現後焦點自動進入第一個可聚焦項', async () => {
    const fixture = TestBed.createComponent(AsyncContentHostComponent);
    fixture.detectChanges(); // ngAfterViewInit → rAF focus-when-ready（此時只有 skeleton、無可聚焦）
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    // 內容尚未出現 → 焦點不在 menu 內
    expect(document.querySelector('app-action-menu button')).toBeNull();

    // 模擬 API 回來、內容替換為可聚焦按鈕
    fixture.componentInstance.showButton = true;
    fixture.detectChanges();
    await new Promise<void>(r => setTimeout(r, 30)); // 等 MutationObserver 觸發 + focus

    const btn = document.querySelector('app-action-menu button');
    expect(btn).not.toBeNull();
    expect(document.activeElement).toBe(btn);

    fixture.destroy();
  });

  it('#2 Enter 啟動 menuitem 後 stopPropagation，不冒泡到 document（避免觸發外層快速鍵重開選單）', () => {
    const fixture = TestBed.createComponent(AnchoredHostComponent);
    fixture.detectChanges();
    const btn = document.querySelector('app-action-menu button') as HTMLButtonElement;
    btn.focus();

    let reachedDocument = false;
    const docListener = (): void => { reachedDocument = true; };
    document.addEventListener('keydown', docListener);
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    document.removeEventListener('keydown', docListener);

    expect(reachedDocument).toBeFalse();
    fixture.destroy();
  });

  describe('#3 autoFocusFirst：打開時要不要把焦點移進選單', () => {
    /** autoFocusFirst = null → 用完全不綁 input 的 host，驗 DS 預設值 */
    async function openFromFocusedInput(autoFocusFirst: boolean | null) {
      const fixture = autoFocusFirst === null
        ? TestBed.createComponent(InputAnchoredDefaultHostComponent)
        : TestBed.createComponent(InputAnchoredHostComponent);
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('[data-testid="typing-input"]') as HTMLInputElement;
      input.focus();
      if (autoFocusFirst !== null) (fixture.componentInstance as InputAnchoredHostComponent).autoFocusFirst = autoFocusFirst;
      fixture.componentInstance.open = true;
      fixture.detectChanges();
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      await new Promise<void>(r => setTimeout(r, 0));
      return { fixture, input, item: document.querySelector('[data-testid="menu-item"]') };
    }

    it('預設（不設定）：焦點移到第一個選項（既有行為不變）', async () => {
      const { fixture, item } = await openFromFocusedInput(null);
      expect(item).not.toBeNull();
      expect(document.activeElement).toBe(item);
      fixture.destroy();
    });

    it('autoFocusFirst=false：焦點留在原本的輸入框，使用者可以繼續打字', async () => {
      const { fixture, input, item } = await openFromFocusedInput(false);
      expect(item).not.toBeNull();
      expect(document.activeElement).toBe(input);
      fixture.destroy();
    });
  });
});
