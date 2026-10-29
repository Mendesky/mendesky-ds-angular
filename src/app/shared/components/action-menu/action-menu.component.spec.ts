import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionMenuComponent } from './action-menu.component';
import { ButtonComponent } from '../button/button.component';
import { MenuItemComponent } from '../menu-item/menu-item.component';

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

/** 選項還是 app-button 的動作選單（其餘 39 個選單的寫法）：不是選單模式 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, ButtonComponent],
  template: `
    <div class="anchor-container">
      <app-action-menu ariaLabel="更多" (closeMenu)="closeCount = closeCount + 1">
        <app-button variant="ghost" color="danger" size="S" text="刪除此規劃"></app-button>
        <div data-testid="plain-divider" style="height:1px;margin:4px 0"></div>
      </app-action-menu>
    </div>
  `,
})
class ButtonOnlyHostComponent {
  closeCount = 0;
}

/**
 * 選單模式：動作選單裡放了 app-menu-item。
 * 觸發鈕前後各放一顆按鈕，用來確認 Tab 不攔、焦點被別人拿走時不搶回來。
 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="sort-wrap" data-testid="wrap">
      <button type="button" data-testid="before">前一個元素</button>
      <button type="button" data-testid="trigger" aria-haspopup="menu" [attr.aria-expanded]="open">排序</button>
      @if (open) {
        <app-action-menu ariaLabel="排序" [autoCloseOnAction]="autoClose" (closeMenu)="onClose()">
          @for (o of options; track o) {
            <app-menu-item [label]="o" [selected]="radio ? o === current : null" [disabled]="o === disabledOption" (itemClick)="pick(o)"></app-menu-item>
          }
          <div data-testid="sep" role="separator" style="height:1px;margin:4px 0;background:#e7e7e7"></div>
          <app-menu-item label="還原預設" (itemClick)="pick('reset')"></app-menu-item>
        </app-action-menu>
      }
      <button type="button" data-testid="after">下一個元素</button>
    </div>
  `,
})
class MenuModeHostComponent {
  open = false;
  autoClose = true;
  radio = true;
  options = ['由新到舊', '由舊到新', '名稱 A→Z'];
  current = '由舊到新';
  disabledOption: string | null = null;
  stealFocus = false;
  picks: string[] = [];
  closeCount = 0;

  pick(o: string): void {
    this.picks.push(o);
    // 模擬「選項打開了對話框、焦點被對話框拿走」
    if (this.stealFocus) (document.querySelector('[data-testid="after"]') as HTMLElement).focus();
  }

  onClose(): void {
    this.closeCount++;
    this.open = false;
  }
}

/** 每頁筆數的寫法：觸發鈕是 app-button，靠 ariaHaspopup 讓 Safari 找得回它 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent, ButtonComponent],
  template: `
    <div class="page-size-wrap">
      <app-button data-testid="page-size-trigger" variant="outlined" color="neutral" size="XS" [text]="'' + size"
        ariaHaspopup="menu" [ariaExpanded]="open" [ariaLabel]="'每頁顯示筆數 ' + size"></app-button>
      @if (open) {
        <app-action-menu ariaLabel="每頁顯示筆數" (closeMenu)="open = false">
          @for (n of sizes; track n) {
            <app-menu-item [label]="'' + n" [selected]="n === size" (itemClick)="size = n"></app-menu-item>
          }
        </app-action-menu>
      }
    </div>
  `,
})
class PageSizeHostComponent {
  open = false;
  size = 10;
  sizes = [10, 20, 50, 100];
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const tick = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const target = (document.activeElement as HTMLElement) ?? document.body;
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
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

describe('ActionMenuComponent — 沒放 app-menu-item 時維持一般浮層（其餘 39 個選單、篩選面板）', () => {
  afterEach(() => {
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('只放 app-button：外框沒有 role、aria-label、tabindex（ariaLabel 有設也不輸出）', () => {
    const fixture = TestBed.createComponent(ButtonOnlyHostComponent);
    fixture.detectChanges();
    const menu = document.querySelector('app-action-menu') as HTMLElement;
    expect(menu.hasAttribute('role')).toBeFalse();
    expect(menu.hasAttribute('aria-label')).toBeFalse();
    expect(menu.hasAttribute('tabindex')).toBeFalse();
    fixture.destroy();
  });

  it('點選單內任何地方（含分隔線）照舊發 closeMenu', () => {
    const fixture = TestBed.createComponent(ButtonOnlyHostComponent);
    fixture.detectChanges();
    (document.querySelector('[data-testid="plain-divider"]') as HTMLElement).click();
    expect(fixture.componentInstance.closeCount).toBe(1);
    (document.querySelector('app-action-menu') as HTMLElement).click();
    expect(fixture.componentInstance.closeCount).toBe(2);
    fixture.destroy();
  });
});

describe('ActionMenuComponent — 選單模式（放了 app-menu-item）', () => {
  let fixture: ComponentFixture<MenuModeHostComponent>;

  const q = (sel: string) => document.querySelector(sel) as HTMLElement;
  const menu = () => q('app-action-menu');
  /** 選單項目＝app-menu-item 內層的按鈕，依畫面順序：由新到舊、由舊到新、名稱 A→Z、還原預設 */
  const items = () => Array.from(menu().querySelectorAll<HTMLElement>('app-menu-item button'));
  const trigger = () => q('[data-testid="trigger"]');

  async function openMenu(patch: Partial<MenuModeHostComponent> = {}, focusTrigger = true): Promise<void> {
    fixture = TestBed.createComponent(MenuModeHostComponent);
    Object.assign(fixture.componentInstance, patch);
    fixture.detectChanges();
    if (focusTrigger) trigger().focus();
    else (document.activeElement as HTMLElement | null)?.blur();
    fixture.componentInstance.open = true;
    fixture.detectChanges();
    await nextFrame();
    await tick();
  }

  afterEach(() => {
    fixture?.destroy();
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('外框 role="menu"、aria-label 來自 ariaLabel、tabindex="-1"', async () => {
    await openMenu();
    expect(menu().getAttribute('role')).toBe('menu');
    expect(menu().getAttribute('aria-label')).toBe('排序');
    expect(menu().getAttribute('tabindex')).toBe('-1');
  });

  describe('打開時的焦點', () => {
    it('停在 aria-checked="true" 的那項', async () => {
      await openMenu();
      expect(items()[1].getAttribute('aria-checked')).toBe('true');
      expect(document.activeElement).toBe(items()[1]);
    });

    it('沒有選中項時停在第一項', async () => {
      await openMenu({ radio: false });
      expect(document.activeElement).toBe(items()[0]);
    });
  });

  describe('方向鍵、Home、End', () => {
    it('最後一項按 ↓ 回第一項；第一項按 ↑ 到最後一項', async () => {
      await openMenu();
      const list = items();
      list[list.length - 1].focus();
      press('ArrowDown');
      expect(document.activeElement).toBe(list[0]);
      press('ArrowUp');
      expect(document.activeElement).toBe(list[list.length - 1]);
    });

    it('Home 到第一項、End 到最後一項，而且攔下預設捲動', async () => {
      await openMenu();
      const list = items();
      const end = press('End');
      expect(document.activeElement).toBe(list[list.length - 1]);
      expect(end.defaultPrevented).toBeTrue();
      const home = press('Home');
      expect(document.activeElement).toBe(list[0]);
      expect(home.defaultPrevented).toBeTrue();
    });

    it('停用的項目方向鍵仍停得到；點它、按 Enter 都不發點擊事件也不關選單', async () => {
      await openMenu({ disabledOption: '名稱 A→Z' });
      const disabled = items()[2];
      expect(disabled.getAttribute('aria-disabled')).toBe('true');
      press('ArrowDown'); // 由舊到新 → 名稱 A→Z
      expect(document.activeElement).toBe(disabled);
      disabled.click();
      press('Enter');
      expect(fixture.componentInstance.picks).toEqual([]);
      expect(fixture.componentInstance.closeCount).toBe(0);
    });
  });

  describe('關閉與焦點去向', () => {
    it('Tab：closeMenu 發一次、觸發鈕取得焦點、事件沒有被 preventDefault（瀏覽器接著移到下一個元素）', async () => {
      await openMenu();
      const tab = press('Tab');
      expect(fixture.componentInstance.closeCount).toBe(1);
      expect(document.activeElement).toBe(trigger());
      expect(tab.defaultPrevented).toBeFalse();
    });

    it('Shift+Tab 也一樣關閉並把焦點交回觸發鈕', async () => {
      await openMenu();
      const tab = press('Tab', { shiftKey: true });
      expect(fixture.componentInstance.closeCount).toBe(1);
      expect(document.activeElement).toBe(trigger());
      expect(tab.defaultPrevented).toBeFalse();
    });

    it('Esc：closeMenu 發一次、焦點回觸發鈕', async () => {
      await openMenu();
      press('Escape');
      expect(fixture.componentInstance.closeCount).toBe(1);
      expect(document.activeElement).toBe(trigger());
    });

    it('點可用的選項：點擊事件一次、closeMenu 一次，選單移除後焦點在觸發鈕', async () => {
      await openMenu();
      items()[0].click();
      expect(fixture.componentInstance.picks).toEqual(['由新到舊']);
      expect(fixture.componentInstance.closeCount).toBe(1);
      fixture.detectChanges(); // open=false → 選單移除
      expect(document.querySelector('app-action-menu')).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('Enter 執行目前這一項，關閉後焦點在觸發鈕', async () => {
      await openMenu();
      press('Enter'); // 焦點在「由舊到新」
      expect(fixture.componentInstance.picks).toEqual(['由舊到新']);
      expect(fixture.componentInstance.closeCount).toBe(1);
      fixture.detectChanges();
      expect(document.activeElement).toBe(trigger());
    });

    it('選項把焦點交給別的元素（例如打開了對話框）時，關閉後不搶回來', async () => {
      await openMenu({ stealFocus: true });
      items()[3].click();
      expect(fixture.componentInstance.picks).toEqual(['reset']);
      fixture.detectChanges();
      expect(document.activeElement).toBe(q('[data-testid="after"]'));
    });

    it('autoCloseOnAction=false：點選項不發 closeMenu，選單留著', async () => {
      await openMenu({ autoClose: false });
      items()[0].click();
      expect(fixture.componentInstance.picks).toEqual(['由新到舊']);
      expect(fixture.componentInstance.closeCount).toBe(0);
      fixture.detectChanges();
      expect(document.querySelector('app-action-menu')).not.toBeNull();
    });
  });

  describe('點到分隔線或空白處', () => {
    it('點分隔線：不發 closeMenu，焦點留在選單外框（tabindex="-1"），接著按 ↓ 到第一項', async () => {
      await openMenu();
      q('[data-testid="sep"]').click();
      expect(fixture.componentInstance.closeCount).toBe(0);
      expect(document.activeElement).toBe(menu());
      expect(menu().getAttribute('tabindex')).toBe('-1');
      press('ArrowDown');
      expect(document.activeElement).toBe(items()[0]);
    });

    it('點選單空白處（外框本身）：不發 closeMenu，焦點留在選單外框', async () => {
      await openMenu();
      menu().click();
      expect(fixture.componentInstance.closeCount).toBe(0);
      expect(document.activeElement).toBe(menu());
    });
  });

  describe('記不到觸發鈕時（Safari 用滑鼠點按鈕不會給它焦點）', () => {
    it('打開時焦點在 body：按 Esc 後焦點落在外框裡標了 aria-haspopup 的按鈕', async () => {
      await openMenu({}, false);
      press('Escape');
      expect(fixture.componentInstance.closeCount).toBe(1);
      expect(document.activeElement).toBe(trigger());
    });

    it('打開時焦點在 body：點選項關閉後焦點也回到 aria-haspopup 的按鈕', async () => {
      await openMenu({}, false);
      items()[0].click();
      fixture.detectChanges();
      expect(document.activeElement).toBe(trigger());
    });

    it('觸發鈕是 app-button 時，找的是它裡面設了 ariaHaspopup 的 button', async () => {
      const f = TestBed.createComponent(PageSizeHostComponent);
      f.detectChanges();
      (document.activeElement as HTMLElement | null)?.blur();
      f.componentInstance.open = true;
      f.detectChanges();
      await nextFrame();
      await tick();
      const inner = f.nativeElement.querySelector('[data-testid="page-size-trigger"] button') as HTMLElement;
      expect(inner.getAttribute('aria-haspopup')).toBe('menu');
      expect(inner.getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement?.getAttribute('aria-checked')).toBe('true'); // 停在目前的 10
      press('Escape');
      f.detectChanges();
      expect(document.activeElement).toBe(inner);
      expect(inner.getAttribute('aria-expanded')).toBe('false');
      f.destroy();
    });
  });
});

/** 直接在外框寫 aria-label（沒用 ariaLabel）：選單模式不能把它拿掉 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="wrap">
      <app-action-menu aria-label="切換項目">
        <app-menu-item label="項目 A"></app-menu-item>
      </app-action-menu>
    </div>
  `,
})
class StaticAriaLabelHostComponent {}

describe('ActionMenuComponent — 選單模式：點選單外面關閉', () => {
  let fixture: ComponentFixture<MenuModeHostComponent>;
  let outside: HTMLElement | null = null;

  const trigger = () => document.querySelector('[data-testid="trigger"]') as HTMLElement;

  async function openAndClickOutside(outsideEl: HTMLElement): Promise<void> {
    fixture = TestBed.createComponent(MenuModeHostComponent);
    fixture.detectChanges();
    trigger().focus();
    fixture.componentInstance.open = true;
    fixture.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('aria-checked')).toBe('true');
    outside = outsideEl;
    document.body.appendChild(outsideEl);
    outsideEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(fixture.componentInstance.closeCount).toBe(1);
    fixture.detectChanges(); // open=false → 選單移除
    expect(document.querySelector('app-action-menu')).toBeNull();
  }

  afterEach(() => {
    fixture?.destroy();
    outside?.remove();
    outside = null;
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('點到空白處：瀏覽器接著把焦點移回 body，等這次點擊處理完焦點還是回到觸發鈕', async () => {
    await openAndClickOutside(document.createElement('div'));
    expect(document.activeElement).toBe(trigger());
    // 模擬瀏覽器處理同一次滑鼠按下：點到不能聚焦的空白處，焦點移回 body
    trigger().blur();
    expect(document.activeElement).toBe(document.body);
    await tick();
    expect(document.activeElement).toBe(trigger());
  });

  it('點到外面另一個可聚焦的元素：焦點留給那個元素，不搶回來', async () => {
    const other = document.createElement('button');
    other.type = 'button';
    other.textContent = '外面的按鈕';
    await openAndClickOutside(other);
    other.focus(); // 模擬瀏覽器處理同一次滑鼠按下：按鈕取得焦點
    await tick();
    expect(document.activeElement).toBe(other);
  });

  it('外框直接寫的 aria-label（沒設 ariaLabel）在選單模式保留', () => {
    const f = TestBed.createComponent(StaticAriaLabelHostComponent);
    f.detectChanges();
    const menu = document.querySelector('app-action-menu') as HTMLElement;
    expect(menu.getAttribute('role')).toBe('menu');
    expect(menu.getAttribute('aria-label')).toBe('切換項目');
    f.destroy();
  });
});

/**
 * 同一頁有兩個選單和一個一般浮層，各自在自己的外層裡：排序的觸發鈕是原生 button，
 * 每頁筆數的觸發鈕是 app-button，篩選面板沒放 app-menu-item。
 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent, ButtonComponent],
  template: `
    <div class="sort-wrap">
      <button type="button" data-testid="sort-trigger" aria-haspopup="menu" [attr.aria-expanded]="sortOpen" (click)="sortOpen = !sortOpen">排序</button>
      @if (sortOpen) {
        <app-action-menu ariaLabel="排序" (closeMenu)="sortOpen = false">
          <app-menu-item label="由新到舊" [selected]="true"></app-menu-item>
          <app-menu-item label="由舊到新" [selected]="false"></app-menu-item>
        </app-action-menu>
      }
    </div>
    <div class="page-size-wrap">
      <app-button data-testid="size-trigger" variant="outlined" color="neutral" size="XS" [text]="'' + size"
        ariaHaspopup="menu" [ariaExpanded]="sizeOpen" [ariaLabel]="'每頁顯示筆數 ' + size"
        (btnClick)="sizeOpen = !sizeOpen"></app-button>
      @if (sizeOpen) {
        <app-action-menu ariaLabel="每頁顯示筆數" (closeMenu)="sizeOpen = false">
          @for (n of sizes; track n) {
            <app-menu-item [label]="'' + n" [selected]="n === size" (itemClick)="size = n"></app-menu-item>
          }
        </app-action-menu>
      }
    </div>
    <div class="panel-wrap">
      <button type="button" data-testid="panel-trigger" (click)="panelOpen = !panelOpen">篩選</button>
      @if (panelOpen) {
        <app-action-menu [autoCloseOnAction]="false" (closeMenu)="panelOpen = false">
          <app-button variant="elevated" size="S" text="清除篩選"></app-button>
        </app-action-menu>
      }
    </div>
  `,
})
class TwoMenusPageHostComponent {
  sortOpen = false;
  sizeOpen = false;
  panelOpen = false;
  size = 10;
  sizes = [10, 20, 50];
}

/** 同一個外層裡有兩顆觸發鈕，各自接著自己的選單 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="toolbar">
      <button type="button" data-testid="trig-a" aria-haspopup="menu" [attr.aria-expanded]="openA" (click)="openA = !openA">篩選</button>
      @if (openA) {
        <app-action-menu ariaLabel="篩選" (closeMenu)="openA = false">
          <app-menu-item label="項目 A"></app-menu-item>
        </app-action-menu>
      }
      <button type="button" data-testid="trig-b" aria-haspopup="menu" [attr.aria-expanded]="openB" (click)="openB = !openB">排序</button>
      @if (openB) {
        <app-action-menu ariaLabel="排序" (closeMenu)="openB = false">
          <app-menu-item label="由新到舊" [selected]="current === 'newest'" (itemClick)="current = 'newest'"></app-menu-item>
          <app-menu-item label="由舊到新" [selected]="current === 'oldest'" (itemClick)="current = 'oldest'"></app-menu-item>
        </app-action-menu>
      }
    </div>
  `,
})
class SharedWrapperHostComponent {
  openA = false;
  openB = false;
  current = 'newest';
}

/** 選單開著時選項清單會變（例如視窗寬度變了，重新算出放不下的項目） */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="wrap">
      <button type="button" data-testid="trigger" aria-haspopup="menu" [attr.aria-expanded]="open">更多</button>
      @if (open) {
        <app-action-menu ariaLabel="更多操作" (closeMenu)="open = false">
          @for (i of items; track i) {
            <app-menu-item [label]="i"></app-menu-item>
          }
        </app-action-menu>
      }
    </div>
  `,
})
class ChangingItemsHostComponent {
  open = false;
  items = ['項目一', '項目二', '項目三'];
}

describe('ActionMenuComponent — 選單模式：Safari 上從一個選單直接點到另一個觸發鈕', () => {
  const q = (sel: string) => document.querySelector(sel) as HTMLElement;
  const sortTrigger = () => q('[data-testid="sort-trigger"]');
  const sizeTrigger = () => q('[data-testid="size-trigger"] button');
  const blurActive = () => (document.activeElement as HTMLElement | null)?.blur();

  afterEach(() => {
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  /**
   * Safari 的滑鼠點擊：點按鈕不會給它焦點；按下別的按鈕時，瀏覽器把焦點清回 body。
   * 先用滑鼠打開排序選單，再直接按每頁筆數（或篩選面板）的觸發鈕。
   */
  async function openSortThenPress(fixture: ComponentFixture<TwoMenusPageHostComponent>, next: HTMLElement): Promise<void> {
    fixture.detectChanges();
    blurActive();
    sortTrigger().click();
    fixture.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('aria-checked')).toBe('true'); // 在排序選單裡
    next.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    fixture.detectChanges(); // 排序選單被點外面關掉
    expect(fixture.componentInstance.sortOpen).toBeFalse();
    blurActive(); // Safari 處理同一次按下：按鈕不拿焦點，焦點清回 body
    await tick(); // 排序選單「點外面關掉」後的延後檢查
    next.click();
    fixture.detectChanges();
    await nextFrame();
    await tick();
  }

  for (const closeWith of ['Escape', 'item-click', 'Tab'] as const) {
    it(`關掉每頁筆數選單（${closeWith}）後，焦點回到每頁筆數的觸發鈕，不是排序的觸發鈕`, async () => {
      const fixture = TestBed.createComponent(TwoMenusPageHostComponent);
      fixture.detectChanges();
      await openSortThenPress(fixture, sizeTrigger());
      expect(fixture.componentInstance.sizeOpen).toBeTrue();
      expect(document.activeElement?.getAttribute('aria-checked')).toBe('true'); // 停在目前的 10
      if (closeWith === 'Escape') press('Escape');
      else if (closeWith === 'Tab') expect(press('Tab').defaultPrevented).toBeFalse();
      else (document.querySelectorAll<HTMLElement>('app-action-menu app-menu-item button')[1]).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.sizeOpen).toBeFalse();
      expect(document.activeElement).toBe(sizeTrigger());
      fixture.destroy();
    });
  }

  it('按下的是另一顆按鈕時，排序選單關掉後不會把焦點拉回排序的觸發鈕', async () => {
    const fixture = TestBed.createComponent(TwoMenusPageHostComponent);
    fixture.detectChanges();
    blurActive();
    sortTrigger().click();
    fixture.detectChanges();
    await nextFrame();
    await tick();
    sizeTrigger().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    blurActive();
    await tick();
    expect(document.activeElement).toBe(document.body);
    fixture.destroy();
  });

  it('接著打開的是一般浮層（沒放 app-menu-item）：按 Esc 不會把焦點丟到排序的觸發鈕', async () => {
    const fixture = TestBed.createComponent(TwoMenusPageHostComponent);
    fixture.detectChanges();
    await openSortThenPress(fixture, q('[data-testid="panel-trigger"]'));
    expect(fixture.componentInstance.panelOpen).toBeTrue();
    press('Escape');
    fixture.detectChanges();
    expect(fixture.componentInstance.panelOpen).toBeFalse();
    expect(document.activeElement).not.toBe(sortTrigger());
    fixture.destroy();
  });

  it('打開前焦點停在選單外層外面的元素（例如上一個選單的觸發鈕）：關閉後焦點回到這個選單外層裡的觸發鈕', async () => {
    const fixture = TestBed.createComponent(TwoMenusPageHostComponent);
    fixture.detectChanges();
    sortTrigger().focus();
    fixture.componentInstance.sizeOpen = true;
    fixture.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('aria-checked')).toBe('true');
    press('Escape');
    fixture.detectChanges();
    expect(document.activeElement).toBe(sizeTrigger());
    fixture.destroy();
  });
});

describe('ActionMenuComponent — 選單模式：同一個外層裡有好幾顆觸發鈕（Safari）', () => {
  const trigA = () => document.querySelector('[data-testid="trig-a"]') as HTMLElement;
  const trigB = () => document.querySelector('[data-testid="trig-b"]') as HTMLElement;
  let blank: HTMLElement | null = null;

  async function openB(): Promise<ComponentFixture<SharedWrapperHostComponent>> {
    const fixture = TestBed.createComponent(SharedWrapperHostComponent);
    fixture.detectChanges();
    (document.activeElement as HTMLElement | null)?.blur(); // Safari：點了觸發鈕，焦點還在 body
    fixture.componentInstance.openB = true;
    fixture.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('aria-checked')).toBe('true');
    return fixture;
  }

  afterEach(() => {
    blank?.remove();
    blank = null;
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('點選項關閉：焦點回到打開這個選單的那顆（aria-expanded 在關閉前已經變回 false）', async () => {
    const fixture = await openB();
    (document.querySelectorAll<HTMLElement>('app-action-menu app-menu-item button')[1]).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.openB).toBeFalse();
    expect(document.activeElement).toBe(trigB());
    expect(document.activeElement).not.toBe(trigA());
    fixture.destroy();
  });

  it('點外面空白處關閉：焦點回到打開這個選單的那顆', async () => {
    const fixture = await openB();
    blank = document.createElement('div');
    document.body.appendChild(blank);
    blank.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.openB).toBeFalse();
    expect(document.activeElement).toBe(trigB());
    (document.activeElement as HTMLElement | null)?.blur(); // 點到空白處，瀏覽器把焦點移回 body
    await tick();
    expect(document.activeElement).toBe(trigB());
    fixture.destroy();
  });

  it('按 Esc 關閉：焦點回到打開這個選單的那顆', async () => {
    const fixture = await openB();
    press('Escape');
    fixture.detectChanges();
    expect(document.activeElement).toBe(trigB());
    fixture.destroy();
  });
});

describe('ActionMenuComponent — 選單模式：開著時焦點所在的項目被拿掉', () => {
  let fixture: ComponentFixture<ChangingItemsHostComponent>;
  const items = () => Array.from(document.querySelectorAll<HTMLElement>('app-action-menu app-menu-item button'));

  async function open(): Promise<void> {
    fixture = TestBed.createComponent(ChangingItemsHostComponent);
    fixture.detectChanges();
    (document.querySelector('[data-testid="trigger"]') as HTMLElement).focus();
    fixture.componentInstance.open = true;
    fixture.detectChanges();
    await nextFrame();
    await tick();
  }

  afterEach(() => {
    fixture?.destroy();
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('焦點移到原本同一個位置的下一項，方向鍵照樣能用', async () => {
    await open();
    items()[1].focus(); // 項目二
    fixture.componentInstance.items = ['項目一', '項目三'];
    fixture.detectChanges();
    await tick();
    expect(document.activeElement).toBe(items()[1]);
    expect(document.activeElement?.textContent?.trim()).toBe('項目三');
    const down = press('ArrowDown');
    expect(down.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(items()[0]);
  });

  it('拿掉的是最後一項：焦點移到新的最後一項', async () => {
    await open();
    items()[2].focus(); // 項目三
    fixture.componentInstance.items = ['項目一', '項目二'];
    fixture.detectChanges();
    await tick();
    expect(document.activeElement?.textContent?.trim()).toBe('項目二');
  });

  it('拿掉的不是焦點所在的項目：焦點不動', async () => {
    await open();
    items()[0].focus(); // 項目一
    fixture.componentInstance.items = ['項目一', '項目二'];
    fixture.detectChanges();
    await tick();
    expect(document.activeElement).toBe(items()[0]);
  });
});
