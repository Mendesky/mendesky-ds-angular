import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionMenuComponent } from './action-menu.component';
import { ButtonComponent } from '../button/button.component';
import { MenuItemComponent } from '../menu-item/menu-item.component';
import { IconBtnComponent } from '../icon-btn/icon-btn.component';

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

    it('空白鍵也執行目前這一項、攔下預設捲動，關閉後焦點在觸發鈕', async () => {
      await openMenu();
      const space = press(' '); // 焦點在「由舊到新」
      expect(space.defaultPrevented).toBeTrue();
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

    // 頁面上常有掛在 document 的快速鍵（例如看板按 Enter 重開卡片選單），選單用掉的鍵不能再傳過去
    for (const [key, name] of [['Enter', 'Enter'], [' ', '空白鍵'], ['Escape', 'Esc']] as const) {
      it(`${name}：選單處理完就停下，document 上的鍵盤監聽收不到`, async () => {
        await openMenu();
        const reached: string[] = [];
        const listener = (e: KeyboardEvent) => reached.push(e.key);
        document.addEventListener('keydown', listener);
        try {
          press(key);
        } finally {
          document.removeEventListener('keydown', listener);
        }
        expect(fixture.componentInstance.closeCount).toBe(1);
        expect(reached).toEqual([]);
      });
    }
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

  for (const closeWith of ['Escape', 'item-click'] as const) {
    it(`Chrome：A 還開著時點 B，兩顆都標著 aria-expanded="true"：關掉 B（${closeWith}）後焦點回到 B 的觸發鈕`, async () => {
      const fixture = TestBed.createComponent(SharedWrapperHostComponent);
      fixture.detectChanges();
      trigA().focus();
      trigA().click();
      fixture.detectChanges();
      await nextFrame();
      await tick();
      // Chrome 按下 B 時就把焦點給它。B 在 A 的外層裡，A 不算點外面，照樣開著
      trigB().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      fixture.detectChanges();
      trigB().focus();
      trigB().click();
      fixture.detectChanges();
      await nextFrame();
      await tick();
      expect(fixture.componentInstance.openA).toBeTrue();
      expect(trigA().getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement?.getAttribute('aria-checked')).toBe('true'); // 在 B 裡
      if (closeWith === 'Escape') press('Escape');
      else (document.querySelectorAll<HTMLElement>('app-action-menu[aria-label="排序"] app-menu-item button')[1]).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.openB).toBeFalse();
      expect(document.activeElement).toBe(trigB());
      fixture.destroy();
    });

    it(`Safari：A 還開著時點 B，焦點清回 body：關掉 B（${closeWith}）後焦點不會跑到還開著的 A 的觸發鈕`, async () => {
      const fixture = TestBed.createComponent(SharedWrapperHostComponent);
      fixture.detectChanges();
      (document.activeElement as HTMLElement | null)?.blur();
      trigA().click();
      fixture.detectChanges();
      await nextFrame();
      await tick();
      trigB().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      fixture.detectChanges();
      (document.activeElement as HTMLElement | null)?.blur(); // Safari 按按鈕不給它焦點
      trigB().click();
      fixture.detectChanges();
      await nextFrame();
      await tick();
      expect(fixture.componentInstance.openA).toBeTrue();
      expect(document.activeElement?.getAttribute('aria-checked')).toBe('true'); // 在 B 裡
      if (closeWith === 'Escape') press('Escape');
      else (document.querySelectorAll<HTMLElement>('app-action-menu[aria-label="排序"] app-menu-item button')[1]).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.openB).toBeFalse();
      // 兩顆都標著、打開前的焦點又不在其中一顆上：不從裡面挑，焦點不還
      expect(document.activeElement).toBe(document.body);
      fixture.destroy();
    });
  }
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

  it('項目全被拿掉：外框已經不是選單、接不住焦點，焦點還給觸發鈕', async () => {
    await open();
    items()[2].focus(); // 項目三
    fixture.componentInstance.items = [];
    fixture.detectChanges();
    await tick();
    expect(document.querySelector('app-action-menu')?.hasAttribute('role')).toBeFalse();
    expect(document.activeElement).toBe(document.querySelector('[data-testid="trigger"]'));
  });
});

/**
 * 搜尋框下的「最近開啟」做成選單：錨點是輸入框，打開時焦點留在輸入框讓人繼續打字。
 * 真實的使用端一拿到焦點就打開下拉，所以焦點回到輸入框的次數要算清楚
 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="search-wrap">
      <input #searchInput data-testid="search-input" (focus)="inputFocusCount = inputFocusCount + 1">
      @if (open) {
        <app-action-menu ariaLabel="最近開啟" [anchorEl]="searchInput" [autoFocusFirst]="false" (closeMenu)="open = false">
          <app-menu-item label="項目甲"></app-menu-item>
          <app-menu-item label="項目乙"></app-menu-item>
        </app-action-menu>
      }
    </div>
  `,
})
class SearchRecentHostComponent {
  open = false;
  inputFocusCount = 0;
}

describe('ActionMenuComponent — 選單模式：錨點是輸入框、autoFocusFirst=false，點外面關閉', () => {
  let fixture: ComponentFixture<SearchRecentHostComponent>;
  let outside: HTMLElement | null = null;

  const input = () => document.querySelector('[data-testid="search-input"]') as HTMLInputElement;

  async function openFromInput(): Promise<void> {
    fixture = TestBed.createComponent(SearchRecentHostComponent);
    fixture.detectChanges();
    input().focus();
    fixture.componentInstance.open = true;
    fixture.detectChanges();
    await nextFrame();
    await tick();
  }

  function pressBlankOutside(): void {
    outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    fixture.detectChanges(); // open=false → 選單移除
    expect(document.querySelector('app-action-menu')).toBeNull();
  }

  afterEach(() => {
    fixture?.destroy();
    outside?.remove();
    outside = null;
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('打開時焦點留在輸入框；焦點一直沒進選單就點空白處，關閉後不會把焦點拉回輸入框', async () => {
    await openFromInput();
    expect(document.querySelector('app-action-menu')?.getAttribute('role')).toBe('menu');
    expect(document.activeElement).toBe(input());
    const focusCount = fixture.componentInstance.inputFocusCount;
    pressBlankOutside();
    // 模擬瀏覽器處理同一次滑鼠按下：點到不能聚焦的空白處，輸入框失焦、焦點移回 body
    input().blur();
    await tick();
    expect(document.activeElement).toBe(document.body);
    expect(fixture.componentInstance.inputFocusCount).toBe(focusCount);
  });

  it('焦點已經帶進選單才點空白處：也不把焦點還給輸入框（游標不跳回去，下拉也不會被輸入框的 focus 重新打開）', async () => {
    await openFromInput();
    (document.querySelector('app-action-menu app-menu-item button') as HTMLElement).focus(); // 呼叫端用 ↓ 把焦點帶進選單
    const focusCount = fixture.componentInstance.inputFocusCount;
    pressBlankOutside();
    await tick(); // 點外面關掉後的延後檢查
    expect(document.activeElement).toBe(document.body);
    expect(fixture.componentInstance.inputFocusCount).toBe(focusCount);
  });

  it('焦點在選單裡按 Esc：照樣把焦點還給輸入框（鍵盤操作要知道焦點回到哪）', async () => {
    await openFromInput();
    (document.querySelector('app-action-menu app-menu-item button') as HTMLElement).focus();
    press('Escape');
    expect(fixture.componentInstance.open).toBeFalse();
    expect(document.activeElement).toBe(input());
  });
});

/** 觸發鈕在頁面最上面，下面墊高讓頁面捲得動：選單開著時把頁面捲到觸發鈕看不到的地方 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="wrap">
      <button type="button" data-testid="trigger" aria-haspopup="menu" [attr.aria-expanded]="open">排序</button>
      @if (open) {
        <app-action-menu ariaLabel="排序" (closeMenu)="open = false">
          <app-menu-item label="由新到舊"></app-menu-item>
          <app-menu-item label="由舊到新"></app-menu-item>
        </app-action-menu>
      }
    </div>
    <div data-testid="spacer" style="height:4000px"></div>
  `,
})
class ScrolledAwayHostComponent {
  open = false;
}

describe('ActionMenuComponent — 選單模式：觸發鈕已經捲出畫面時把焦點還回去', () => {
  let fixture: ComponentFixture<ScrolledAwayHostComponent>;
  let outside: HTMLElement | null = null;

  const trigger = () => document.querySelector('[data-testid="trigger"]') as HTMLElement;
  const scrollTop = () => document.scrollingElement!.scrollTop;

  async function openThenScrollAway(): Promise<void> {
    fixture = TestBed.createComponent(ScrolledAwayHostComponent);
    fixture.detectChanges();
    trigger().focus();
    fixture.componentInstance.open = true;
    fixture.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
    document.scrollingElement!.scrollTop = 2000;
    expect(scrollTop()).toBe(2000);
    expect(trigger().getBoundingClientRect().bottom).toBeLessThan(0);
  }

  afterEach(() => {
    fixture?.destroy();
    outside?.remove();
    outside = null;
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
    document.scrollingElement!.scrollTop = 0;
  });

  it('點外面空白處關閉：焦點回到觸發鈕，但頁面不會被捲回觸發鈕那裡（立即那次和延後那次都一樣）', async () => {
    await openThenScrollAway();
    outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(trigger());
    expect(scrollTop()).toBe(2000);
    trigger().blur(); // 瀏覽器處理同一次按下，焦點移回 body
    await tick();
    expect(document.activeElement).toBe(trigger());
    expect(scrollTop()).toBe(2000);
  });

  it('按 Esc 關閉：焦點回到觸發鈕，頁面照舊捲到看得到觸發鈕（用鍵盤的人要看得到焦點在哪）', async () => {
    await openThenScrollAway();
    press('Escape');
    fixture.detectChanges();
    expect(document.activeElement).toBe(trigger());
    expect(scrollTop()).toBeLessThan(2000);
    expect(trigger().getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
  });

  it('選完一項關閉：焦點回到觸發鈕，頁面照舊捲到看得到觸發鈕', async () => {
    await openThenScrollAway();
    press('Enter'); // 執行焦點所在的「由新到舊」
    fixture.detectChanges(); // 選單移除後才把焦點還給觸發鈕
    expect(document.activeElement).toBe(trigger());
    expect(scrollTop()).toBeLessThan(2000);
    expect(trigger().getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
  });
});

/** 用 *ngFor 產生選單項目（使用端還有不少 *ngFor 寫法） */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent, NgFor],
  template: `
    <div class="wrap">
      <app-action-menu ariaLabel="每頁顯示筆數" [autoFocusFirst]="false">
        <app-menu-item *ngFor="let n of sizes" [label]="'' + n" [selected]="n === 10"></app-menu-item>
      </app-action-menu>
    </div>
  `,
})
class NgForMenuHostComponent {
  sizes = [10, 20, 50];
}

/** 使用端自己做的排序區元件：裡面是一排選單外的 app-menu-item */
@Component({
  selector: 'test-sort-section',
  standalone: true,
  imports: [MenuItemComponent],
  template: `
    <div role="group" aria-label="排序">
      <app-menu-item label="由新到舊" [selected]="true"></app-menu-item>
      <app-menu-item label="由舊到新" [selected]="false"></app-menu-item>
    </div>
  `,
})
class SortSectionComponent {}

/** 一般浮層裡放了上面那個排序區元件，還有一個輸入框：驗「子元件範本裡的 app-menu-item 不登記」 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, SortSectionComponent],
  template: `
    <div class="panel-wrap">
      <app-action-menu [autoCloseOnAction]="false" [autoFocusFirst]="false" (closeMenu)="closeCount = closeCount + 1">
        <test-sort-section></test-sort-section>
        <input data-testid="amount" type="text">
      </app-action-menu>
    </div>
  `,
})
class PanelWithSortSectionHostComponent {
  closeCount = 0;
}

/** 規格不允許、但要防呆：選單模式的選單裡直接放了輸入框 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="wrap">
      <button type="button" data-testid="trigger" aria-haspopup="menu" [attr.aria-expanded]="open">更多</button>
      @if (open) {
        <app-action-menu ariaLabel="更多" [autoFocusFirst]="false" (closeMenu)="closeCount = closeCount + 1; open = false">
          @if (showItem) {
            <app-menu-item label="項目甲" (itemClick)="picks = picks + 1"></app-menu-item>
          }
          <input data-testid="note" type="text">
          <div data-testid="rich" contenteditable="true">備註</div>
        </app-action-menu>
      }
    </div>
  `,
})
class MixedFieldMenuHostComponent {
  open = true;
  showItem = true;
  closeCount = 0;
  picks = 0;
}

/**
 * 選單外面有一張對話框卡片：卡片是 tabindex="-1"，點它的空白處時瀏覽器會把焦點給卡片。
 * 卡片裡有一組 roving tabindex 的選項，選項也是 tabindex="-1"，但它是控制項
 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="wrap">
      <button type="button" data-testid="trigger" aria-haspopup="menu" [attr.aria-expanded]="open">更多</button>
      @if (open) {
        <app-action-menu ariaLabel="更多" (closeMenu)="open = false">
          <app-menu-item label="項目甲"></app-menu-item>
          <app-menu-item label="項目乙"></app-menu-item>
        </app-action-menu>
      }
    </div>
    <div data-testid="card" role="dialog" aria-label="設定" tabindex="-1">
      <p data-testid="card-text">說明文字</p>
      <div role="listbox" aria-label="顏色">
        <div data-testid="option" role="option" tabindex="-1" aria-selected="false">紅</div>
      </div>
    </div>
  `,
})
class DialogCardOutsideHostComponent {
  open = false;
}

/**
 * 觸發鈕旁邊還有別的「會打開東西」的按鈕。旁邊那顆是對話框按鈕時標著 aria-expanded="true"（對話框開著），
 * 「更多」有沒有綁 aria-expanded 由 bindExpanded 決定
 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="toolbar">
      @if (otherIsDialog) {
        <button type="button" data-testid="other" aria-haspopup="dialog" aria-expanded="true">設定</button>
      } @else {
        <button type="button" data-testid="other" aria-haspopup="menu">篩選</button>
      }
      <button type="button" data-testid="more" aria-haspopup="menu" [attr.aria-expanded]="bindExpanded ? open : null">更多</button>
      @if (open) {
        <app-action-menu ariaLabel="更多" (closeMenu)="open = false">
          <app-menu-item label="項目甲"></app-menu-item>
        </app-action-menu>
      }
    </div>
  `,
})
class UnboundTriggersHostComponent {
  open = false;
  otherIsDialog = true;
  bindExpanded = false;
}

describe('ActionMenuComponent — 哪些 app-menu-item 算進選單', () => {
  afterEach(() => {
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('同一個範本裡用 *ngFor 產生的 app-menu-item 照樣登記，外框是 role="menu"', () => {
    const f = TestBed.createComponent(NgForMenuHostComponent);
    f.detectChanges();
    const menu = document.querySelector('app-action-menu') as HTMLElement;
    expect(menu.getAttribute('role')).toBe('menu');
    const buttons = Array.from(menu.querySelectorAll('app-menu-item button'));
    expect(buttons.length).toBe(3);
    expect(buttons.every((b) => b.getAttribute('role') === 'menuitemradio')).toBeTrue();
    f.destroy();
  });

  describe('包在使用端子元件裡的 app-menu-item 不登記（外框維持一般浮層）', () => {
    let f: ComponentFixture<PanelWithSortSectionHostComponent>;
    const amount = () => document.querySelector('[data-testid="amount"]') as HTMLInputElement;

    beforeEach(() => {
      f = TestBed.createComponent(PanelWithSortSectionHostComponent);
      f.detectChanges();
    });

    afterEach(() => f.destroy());

    it('外框沒有 role="menu"；排序區的 app-menu-item 是選單外的單選按鈕（aria-pressed）', () => {
      const menu = document.querySelector('app-action-menu') as HTMLElement;
      expect(menu.hasAttribute('role')).toBeFalse();
      const buttons = Array.from(menu.querySelectorAll('app-menu-item button'));
      expect(buttons.length).toBe(2);
      expect(buttons.map((b) => b.getAttribute('role'))).toEqual([null, null]);
      expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    });

    it('輸入框照常打字：空白鍵、方向鍵不被攔下，點輸入框焦點留在輸入框，Tab 不關面板', () => {
      amount().focus();
      amount().click();
      expect(document.activeElement).toBe(amount());
      expect(press(' ').defaultPrevented).toBeFalse();
      expect(press('ArrowDown').defaultPrevented).toBeFalse();
      expect(press('Tab').defaultPrevented).toBeFalse();
      expect(f.componentInstance.closeCount).toBe(0);
      expect(document.activeElement).toBe(amount());
    });
  });

  describe('選單模式的選單裡直接放了輸入框（規格不允許，但鍵盤和點擊不能搶走輸入框）', () => {
    let f: ComponentFixture<MixedFieldMenuHostComponent>;
    const note = () => document.querySelector('[data-testid="note"]') as HTMLInputElement;
    const rich = () => document.querySelector('[data-testid="rich"]') as HTMLElement;

    beforeEach(() => {
      f = TestBed.createComponent(MixedFieldMenuHostComponent);
      f.detectChanges();
    });

    afterEach(() => f.destroy());

    it('前提：外框是 role="menu"', () => {
      expect(document.querySelector('app-action-menu')?.getAttribute('role')).toBe('menu');
    });

    it('點輸入框、可編輯區：焦點留在那裡，不會被搶回選單外框', () => {
      note().focus();
      note().click();
      expect(document.activeElement).toBe(note());
      rich().focus();
      rich().click();
      expect(document.activeElement).toBe(rich());
    });

    for (const key of [' ', 'Enter', 'ArrowDown', 'ArrowUp', 'Home', 'End']) {
      it(`焦點在輸入框按「${key === ' ' ? '空白鍵' : key}」：不攔下、焦點不動、不執行選項`, () => {
        note().focus();
        expect(press(key).defaultPrevented).toBeFalse();
        expect(document.activeElement).toBe(note());
        expect(f.componentInstance.picks).toBe(0);
        expect(f.componentInstance.closeCount).toBe(0);
      });
    }

    it('焦點在可編輯區按空白鍵、Home：不攔下', () => {
      rich().focus();
      expect(press(' ').defaultPrevented).toBeFalse();
      expect(press('Home').defaultPrevented).toBeFalse();
      expect(document.activeElement).toBe(rich());
    });

    it('焦點在輸入框按 Tab：不關選單，交給瀏覽器移焦點', () => {
      note().focus();
      expect(press('Tab').defaultPrevented).toBeFalse();
      expect(f.componentInstance.closeCount).toBe(0);
    });

    it('焦點在輸入框按 Esc：照樣關選單、焦點回觸發鈕', () => {
      note().focus();
      press('Escape');
      expect(f.componentInstance.closeCount).toBe(1);
      expect(document.activeElement).toBe(document.querySelector('[data-testid="trigger"]'));
    });

    it('焦點在輸入框、正在用輸入法選字時按 Esc：只是取消選字，不關選單', () => {
      note().focus();
      press('Escape', { isComposing: true });
      expect(f.componentInstance.closeCount).toBe(0);
      expect(document.activeElement).toBe(note());
    });
  });
});

describe('ActionMenuComponent — 選單模式：點外面關閉的其他情況', () => {
  const q = (sel: string) => document.querySelector(sel) as HTMLElement;
  const trigger = () => q('[data-testid="trigger"]');
  let blank: HTMLElement | null = null;

  function pressBlank(fixture: ComponentFixture<unknown>): void {
    blank = document.createElement('div');
    document.body.appendChild(blank);
    blank.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    fixture.detectChanges(); // 選單移除
    expect(document.querySelector('app-action-menu')).toBeNull();
  }

  afterEach(() => {
    blank?.remove();
    blank = null;
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('按下那一刻焦點不在選單裡（打開後焦點一直在 body）：關閉後不把焦點拉到觸發鈕，等點擊處理完也一樣', async () => {
    const f = TestBed.createComponent(MixedFieldMenuHostComponent);
    f.detectChanges();
    (document.activeElement as HTMLElement | null)?.blur();
    expect(document.activeElement).toBe(document.body);
    pressBlank(f);
    expect(document.activeElement).toBe(document.body);
    await tick();
    expect(document.activeElement).toBe(document.body);
    f.destroy();
  });

  it('項目全被拿掉後才點空白處：照樣當成點外面關閉，瀏覽器把焦點移回 body 後還給觸發鈕', async () => {
    const f = TestBed.createComponent(MixedFieldMenuHostComponent);
    f.detectChanges();
    const note = q('[data-testid="note"]');
    note.focus();
    f.componentInstance.showItem = false;
    f.detectChanges();
    await tick();
    expect(document.querySelector('app-action-menu')?.hasAttribute('role')).toBeFalse(); // 已經不是選單
    expect(document.activeElement).toBe(note);
    pressBlank(f);
    expect(document.activeElement).toBe(trigger());
    trigger().blur(); // 瀏覽器處理同一次按下，焦點移回 body
    await tick();
    expect(document.activeElement).toBe(trigger());
    f.destroy();
  });

  describe('點到外面對話框卡片裡', () => {
    let f: ComponentFixture<DialogCardOutsideHostComponent>;

    beforeEach(async () => {
      f = TestBed.createComponent(DialogCardOutsideHostComponent);
      f.detectChanges();
      trigger().focus();
      f.componentInstance.open = true;
      f.detectChanges();
      await nextFrame();
      await tick();
      expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
    });

    afterEach(() => f.destroy());

    function pressOn(el: HTMLElement): void {
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      f.detectChanges();
      expect(document.querySelector('app-action-menu')).toBeNull();
    }

    it('點卡片裡的文字：等於點空白處，焦點回到觸發鈕；瀏覽器接著把焦點停在卡片上，點擊處理完還是回到觸發鈕', async () => {
      pressOn(q('[data-testid="card-text"]'));
      expect(document.activeElement).toBe(trigger());
      q('[data-testid="card"]').focus(); // 瀏覽器處理同一次按下：焦點給了 tabindex="-1" 的卡片
      await tick();
      expect(document.activeElement).toBe(trigger());
    });

    it('點卡片裡的選項（role="option"、tabindex="-1"）：它是控制項，焦點留給它', async () => {
      const option = q('[data-testid="option"]');
      pressOn(option);
      option.focus(); // 瀏覽器處理同一次按下：選項拿到焦點
      await tick();
      expect(document.activeElement).toBe(option);
    });
  });
});

describe('ActionMenuComponent — 選單模式：記不到觸發鈕時只認 aria-expanded="true"（Safari）', () => {
  const q = (sel: string) => document.querySelector(sel) as HTMLElement;

  async function openFromBody(otherIsDialog: boolean, bindExpanded = false): Promise<ComponentFixture<UnboundTriggersHostComponent>> {
    const f = TestBed.createComponent(UnboundTriggersHostComponent);
    f.componentInstance.otherIsDialog = otherIsDialog;
    f.componentInstance.bindExpanded = bindExpanded;
    f.detectChanges();
    (document.activeElement as HTMLElement | null)?.blur(); // Safari：點了觸發鈕，焦點還在 body
    f.componentInstance.open = true;
    f.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
    return f;
  }

  afterEach(() => {
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('旁邊那顆打開的是對話框（aria-haspopup="dialog"），也標著 aria-expanded="true"：不算，焦點回到綁了 aria-expanded 的「更多」', async () => {
    const f = await openFromBody(true, true);
    press('Escape');
    f.detectChanges();
    expect(document.activeElement).toBe(q('[data-testid="more"]'));
    f.destroy();
  });

  it('外層裡只有「更多」一顆會打開選單，但它沒綁 aria-expanded：認不出來，不拿唯一的那顆來猜，焦點不還', async () => {
    const f = await openFromBody(true);
    press('Escape');
    f.detectChanges();
    expect(document.activeElement).not.toBe(q('[data-testid="more"]'));
    expect(document.activeElement).not.toBe(q('[data-testid="other"]'));
    f.destroy();
  });

  it('兩顆都會打開選單、認不出是哪顆：按 Esc 後不猜，焦點不跳到任何一顆', async () => {
    const f = await openFromBody(false);
    press('Escape');
    f.detectChanges();
    expect(document.activeElement).not.toBe(q('[data-testid="other"]'));
    expect(document.activeElement).not.toBe(q('[data-testid="more"]'));
    f.destroy();
  });
});

/** More 選單的觸發鈕是只有圖示的 app-icon-btn */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent, IconBtnComponent],
  template: `
    <div class="more-wrap">
      <app-icon-btn data-testid="more-trigger" ariaLabel="更多操作" ariaHaspopup="menu" [ariaExpanded]="open"
        (btnClick)="open = !open"></app-icon-btn>
      @if (open) {
        <app-action-menu ariaLabel="更多操作" (closeMenu)="open = false">
          <app-menu-item label="編輯此規劃"></app-menu-item>
          <app-menu-item label="刪除此規劃" tone="danger"></app-menu-item>
        </app-action-menu>
      }
    </div>
  `,
})
class IconBtnTriggerHostComponent {
  open = false;
}

describe('ActionMenuComponent — 選單模式：觸發鈕是 app-icon-btn（Safari 用滑鼠點按鈕不會給它焦點）', () => {
  afterEach(() => {
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('打開時焦點在 body：按 Esc 後焦點落在 app-icon-btn 裡設了 ariaHaspopup 的 button，aria-expanded 變回 false', async () => {
    const f = TestBed.createComponent(IconBtnTriggerHostComponent);
    f.detectChanges();
    (document.activeElement as HTMLElement | null)?.blur();
    f.componentInstance.open = true;
    f.detectChanges();
    await nextFrame();
    await tick();
    const inner = f.nativeElement.querySelector('[data-testid="more-trigger"] button') as HTMLElement;
    expect(inner.getAttribute('aria-haspopup')).toBe('menu');
    expect(inner.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
    press('Escape');
    f.detectChanges();
    expect(document.activeElement).toBe(inner);
    expect(inner.getAttribute('aria-expanded')).toBe('false');
    f.destroy();
  });
});

/**
 * 一般浮層（沒放 app-menu-item）的鍵盤與焦點。外層照 dashboard 單一客戶選單的寫法：
 * 打開它的按鈕標 aria-haspopup="menu"、aria-expanded 跟著開關變，浮層用 fixedMode
 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, ButtonComponent],
  template: `
    <div class="backdrop">
      <button type="button" data-testid="before">打開前的焦點</button>
      <button type="button" data-testid="client-btn" aria-haspopup="menu" [attr.aria-expanded]="open">客戶甲</button>
      @if (open) {
        <app-action-menu [fixedMode]="true" [fixedTop]="40" [fixedLeft]="40" (closeMenu)="open = false; closeCount = closeCount + 1">
          <app-button variant="ghost" size="S" text="客戶甲"></app-button>
          <app-button variant="ghost" size="S" text="客戶乙"></app-button>
          <app-button variant="ghost" size="S" text="客戶丙"></app-button>
        </app-action-menu>
      }
    </div>
  `,
})
class GeneralOverlayHostComponent {
  open = false;
  closeCount = 0;
}

describe('ActionMenuComponent — 一般浮層（沒放 app-menu-item）的鍵盤與焦點', () => {
  let f: ComponentFixture<GeneralOverlayHostComponent>;
  const q = (sel: string) => document.querySelector(sel) as HTMLElement;
  const options = () => Array.from(document.querySelectorAll<HTMLElement>('app-action-menu app-button button'));

  /** focusBefore：打開前焦點在哪；null＝Safari 用滑鼠點按鈕，焦點在 body */
  async function openOverlay(focusBefore: string | null): Promise<void> {
    f = TestBed.createComponent(GeneralOverlayHostComponent);
    f.detectChanges();
    if (focusBefore) q(focusBefore).focus();
    else (document.activeElement as HTMLElement | null)?.blur();
    f.componentInstance.open = true;
    f.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement).toBe(options()[0]);
  }

  function release(key: string): KeyboardEvent {
    const up = new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true });
    ((document.activeElement as HTMLElement | null) ?? document.body).dispatchEvent(up);
    return up;
  }

  // 別的測試按了 Enter／空白鍵沒放開時，吃連發的監聽會留到這裡；先放開，每一條都從沒有監聽的狀態開始
  beforeEach(() => {
    release('Enter');
    release(' ');
  });

  afterEach(() => {
    release('Enter');
    release(' ');
    f?.destroy();
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('上下方向鍵在選項（app-button）之間移動，頭尾循環', async () => {
    await openOverlay('[data-testid="before"]');
    expect(press('ArrowDown').defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(options()[1]);
    press('ArrowUp');
    press('ArrowUp');
    expect(document.activeElement).toBe(options()[2]);
  });

  it('Home、End 沒有作用：不攔、焦點不動', async () => {
    await openOverlay('[data-testid="before"]');
    expect(press('End').defaultPrevented).toBeFalse();
    expect(document.activeElement).toBe(options()[0]);
    expect(press('Home').defaultPrevented).toBeFalse();
    expect(document.activeElement).toBe(options()[0]);
  });

  it('Tab 不關閉浮層、不攔', async () => {
    await openOverlay('[data-testid="before"]');
    expect(press('Tab').defaultPrevented).toBeFalse();
    f.detectChanges();
    expect(f.componentInstance.open).toBeTrue();
    expect(f.componentInstance.closeCount).toBe(0);
  });

  it('Esc 關閉，焦點還給打開前有焦點的元素', async () => {
    await openOverlay('[data-testid="before"]');
    press('Escape');
    f.detectChanges();
    expect(f.componentInstance.open).toBeFalse();
    expect(document.activeElement).toBe(q('[data-testid="before"]'));
  });

  it('點選項關閉：焦點不會被拉到外層裡標著 aria-haspopup="menu"、aria-expanded="true" 的按鈕', async () => {
    await openOverlay(null);
    expect(q('[data-testid="client-btn"]').getAttribute('aria-expanded')).toBe('true');
    options()[1].click();
    f.detectChanges();
    expect(f.componentInstance.open).toBeFalse();
    expect(document.activeElement).not.toBe(q('[data-testid="client-btn"]'));
    await tick();
    expect(document.activeElement).not.toBe(q('[data-testid="client-btn"]'));
  });

  for (const [key, name] of [['Enter', 'Enter'], [' ', '空白鍵']] as const) {
    it(`${name}：連發的按鍵（按住快捷鍵打開浮層後落進浮層）不執行選項`, async () => {
      await openOverlay(null); // dashboard 看板用快捷鍵打開卡片選單前會先移開焦點
      expect(press(key, { repeat: true }).defaultPrevented).toBeTrue();
      f.detectChanges();
      expect(f.componentInstance.closeCount).toBe(0);
      expect(f.componentInstance.open).toBeTrue();
    });

    it(`${name}：執行一項、浮層關掉後，到放開之前的連發都被吃掉，document 收不到`, async () => {
      await openOverlay(null);
      press(key);
      f.detectChanges();
      expect(f.componentInstance.closeCount).toBe(1);
      expect(f.componentInstance.open).toBeFalse();
      const seen: string[] = [];
      const onKey = (e: KeyboardEvent) => seen.push(`${e.type}:${e.repeat ? 'repeat' : 'first'}`);
      document.addEventListener('keydown', onKey);
      try {
        expect(press(key, { repeat: true }).defaultPrevented).toBeTrue();
        expect(seen).toEqual([]);
        expect(release(key).defaultPrevented).toBeTrue();
        expect(press(key).defaultPrevented).toBeFalse();
        expect(seen).toEqual(['keydown:first']);
      } finally {
        document.removeEventListener('keydown', onKey);
      }
    });
  }
});

/** 同一個外層裡兩個選單和一個一般浮層，用同一個狀態切換：打開一個，另一個就關掉 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent, ButtonComponent],
  template: `
    <div class="toolbar">
      <button type="button" data-testid="sw-a" aria-haspopup="menu" [attr.aria-expanded]="which === 'A'" (click)="toggle('A')"><span class="lbl">篩選</span></button>
      <button type="button" data-testid="sw-b" aria-haspopup="menu" [attr.aria-expanded]="which === 'B'" (click)="toggle('B')"><span class="lbl">排序</span></button>
      <button type="button" data-testid="sw-panel" (click)="toggle('panel')">欄位</button>
      @if (which === 'A') {
        <app-action-menu ariaLabel="篩選" (closeMenu)="which = null">
          <app-menu-item label="項目 A1"></app-menu-item>
          <app-menu-item label="項目 A2"></app-menu-item>
        </app-action-menu>
      }
      @if (which === 'B') {
        <app-action-menu ariaLabel="排序" (closeMenu)="which = null">
          <app-menu-item label="由新到舊" [selected]="true"></app-menu-item>
          <app-menu-item label="由舊到新" [selected]="false"></app-menu-item>
        </app-action-menu>
      }
      @if (which === 'panel') {
        <app-action-menu [autoCloseOnAction]="false" (closeMenu)="which = null">
          <app-button variant="elevated" size="S" text="清除"></app-button>
        </app-action-menu>
      }
    </div>
  `,
})
class SwitchingWrapperHostComponent {
  which: 'A' | 'B' | 'panel' | null = null;

  toggle(menu: 'A' | 'B' | 'panel'): void {
    this.which = this.which === menu ? null : menu;
  }
}

describe('ActionMenuComponent — 選單模式：同一個外層裡從一個選單直接點到另一顆按鈕（Safari）', () => {
  let f: ComponentFixture<SwitchingWrapperHostComponent>;
  const q = (sel: string) => document.querySelector(sel) as HTMLElement;
  const trigA = () => q('[data-testid="sw-a"]');
  const trigB = () => q('[data-testid="sw-b"]');
  const blurActive = () => (document.activeElement as HTMLElement | null)?.blur();

  /**
   * Safari 的滑鼠點擊：點按鈕不給它焦點，焦點落到最近一層點得到焦點的祖先，沒有就清回 body。
   * 先打開 A，再按同一個外層裡的另一顆按鈕：它在 A 的外層裡，定位服務不算點外面，A 是被使用端的狀態切換關掉的。
   * 按的是按鈕裡的文字（滑鼠實際點到的是它），不是按鈕本身。
   * focusableToolbar 為 true 時外層點得到焦點（例如 tabindex="-1" 的對話框卡片），焦點落在外層。
   * 回傳 A 剛關掉、下一個浮層還沒把焦點移進去的那一刻，焦點在哪
   */
  async function openAThenPress(nextSelector: string, focusableToolbar = false): Promise<Element | null> {
    f = TestBed.createComponent(SwitchingWrapperHostComponent);
    f.detectChanges();
    const toolbar = q('.toolbar');
    if (focusableToolbar) toolbar.tabIndex = -1;
    const parkFocus = () => (focusableToolbar ? toolbar.focus() : blurActive());
    parkFocus();
    trigA().click();
    f.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem'); // 在 A 裡
    const next = q(nextSelector);
    const target = (next.querySelector('.lbl') as HTMLElement | null) ?? next;
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    f.detectChanges();
    expect(f.componentInstance.which).toBe('A'); // 不算點外面
    parkFocus();
    target.click();
    f.detectChanges();
    const atSwitch = document.activeElement;
    await nextFrame();
    await tick();
    return atSwitch;
  }

  afterEach(() => {
    f?.destroy();
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('A 被切掉的那一刻，焦點不會被拉回 A 的觸發鈕', async () => {
    const atSwitch = await openAThenPress('[data-testid="sw-b"]');
    expect(atSwitch).not.toBe(trigA());
    expect(f.componentInstance.which).toBe('B');
    expect(document.activeElement?.getAttribute('aria-checked')).toBe('true'); // 在 B 裡
  });

  it('Safari 點按鈕時焦點落到點得到焦點的外層：關掉 B 後焦點回到 B 的觸發鈕，不是外層', async () => {
    f = TestBed.createComponent(SwitchingWrapperHostComponent);
    f.detectChanges();
    const toolbar = q('.toolbar');
    toolbar.tabIndex = -1;
    toolbar.focus(); // WebKit 點按鈕時往上找第一個點得到焦點的祖先，焦點落在外層
    trigB().click();
    f.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('aria-checked')).toBe('true');
    press('Escape');
    f.detectChanges();
    expect(document.activeElement).toBe(trigB());
  });

  for (const closeWith of ['Escape', 'item-click', 'Tab'] as const) {
    it(`關掉 B（${closeWith}）後，焦點回到 B 的觸發鈕，不是 A 的`, async () => {
      await openAThenPress('[data-testid="sw-b"]');
      if (closeWith === 'Escape') press('Escape');
      else if (closeWith === 'Tab') expect(press('Tab').defaultPrevented).toBeFalse();
      else (document.querySelectorAll<HTMLElement>('app-action-menu app-menu-item button')[1]).click();
      f.detectChanges();
      expect(f.componentInstance.which).toBeNull();
      expect(document.activeElement).toBe(trigB());
    });
  }

  it('接著打開的是一般浮層：按 Esc 不會把焦點丟到 A 的觸發鈕', async () => {
    await openAThenPress('[data-testid="sw-panel"]');
    expect(f.componentInstance.which).toBe('panel');
    press('Escape');
    f.detectChanges();
    expect(f.componentInstance.which).toBeNull();
    expect(document.activeElement).not.toBe(trigA());
  });

  it('再按一次 A 自己的觸發鈕關掉 A：焦點回到 A 的觸發鈕（跟 Chrome 按下就給它焦點的結果一樣）', async () => {
    const atClose = await openAThenPress('[data-testid="sw-a"]');
    expect(f.componentInstance.which).toBeNull();
    expect(atClose).toBe(trigA());
  });

  it('外層點得到焦點時，再按一次 A 自己的觸發鈕關掉 A：焦點回到 A 的觸發鈕，不停在外層', async () => {
    const atClose = await openAThenPress('[data-testid="sw-a"]', true);
    expect(f.componentInstance.which).toBeNull();
    expect(atClose).toBe(trigA());
  });

  it('外層點得到焦點時，點 B 切過去：A 被切掉的那一刻，焦點不會被拉回 A 的觸發鈕', async () => {
    const atSwitch = await openAThenPress('[data-testid="sw-b"]', true);
    expect(atSwitch).not.toBe(trigA());
    expect(f.componentInstance.which).toBe('B');
  });
});

/**
 * 由鍵盤快捷鍵或右鍵打開、用 fixedMode 定位的選單（dashboard 的卡片選單）：打開前焦點先被移開，記不到觸發鈕。
 * 選單放在元件範本最外層，同一層剛好有一顆不相干、沒開著的選單按鈕
 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="page">
      <button type="button" data-testid="toolbar-more" aria-haspopup="menu" aria-expanded="false">工具列的更多</button>
      @if (open) {
        <app-action-menu ariaLabel="卡片操作" [fixedMode]="true" [fixedTop]="200" [fixedLeft]="200" (closeMenu)="open = false">
          <app-menu-item label="開啟"></app-menu-item>
          <app-menu-item label="複製連結"></app-menu-item>
        </app-action-menu>
      }
    </div>
  `,
})
class KeyboardOpenedFixedHostComponent {
  open = false;
}

describe('ActionMenuComponent — 選單模式：沒有觸發鈕的選單（鍵盤快捷鍵、右鍵打開）', () => {
  afterEach(() => {
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  for (const closeWith of ['Escape', 'item-click', 'Tab'] as const) {
    it(`關掉（${closeWith}）後，焦點不會跳到外層裡唯一一顆不相干的選單按鈕`, async () => {
      const f = TestBed.createComponent(KeyboardOpenedFixedHostComponent);
      f.detectChanges();
      (document.activeElement as HTMLElement | null)?.blur(); // 快捷鍵打開前先 blur
      f.componentInstance.open = true;
      f.detectChanges();
      await nextFrame();
      await tick();
      expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
      if (closeWith === 'Escape') press('Escape');
      else if (closeWith === 'Tab') press('Tab');
      else (document.querySelectorAll<HTMLElement>('app-action-menu app-menu-item button')[0]).click();
      f.detectChanges();
      expect(f.componentInstance.open).toBeFalse();
      expect(document.activeElement).not.toBe(document.querySelector('[data-testid="toolbar-more"]'));
      f.destroy();
    });
  }
});

/** 選項自己的 itemClick 會改到自己：變停用、被 @for 重建（每次都是新物件）、換圖示 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="wrap">
      <button type="button" data-testid="trigger" aria-haspopup="menu" [attr.aria-expanded]="open">更多</button>
      @if (open) {
        <app-action-menu ariaLabel="更多操作" [autoCloseOnAction]="autoClose" (closeMenu)="open = false; closeCount = closeCount + 1">
          <app-menu-item data-testid="pin" label="釘選" [disabled]="pinned" (itemClick)="pinned = true"></app-menu-item>
          @for (o of options; track o) {
            <app-menu-item [label]="o.label" (itemClick)="rebuild()"></app-menu-item>
          }
          <app-menu-item data-testid="dir" label="排序方向" [icon]="asc ? 'UpArrow' : 'DownArrow'" (itemClick)="asc = !asc"></app-menu-item>
        </app-action-menu>
      }
    </div>
  `,
})
class SelfChangingItemsHostComponent {
  open = false;
  autoClose = true;
  closeCount = 0;
  pinned = false;
  asc = true;
  options = [{ label: '選項甲' }, { label: '選項乙' }];

  rebuild(): void {
    this.options = this.options.map((o) => ({ ...o }));
  }
}

describe('ActionMenuComponent — 選單模式：用滑鼠點的選項，自己的 itemClick 改到了自己', () => {
  let f: ComponentFixture<SelfChangingItemsHostComponent>;
  const menu = () => document.querySelector('app-action-menu') as HTMLElement | null;

  /** 跟正式環境一樣自動更新畫面：選項按鈕的點擊監聽跑完、外框的點擊監聽還沒跑之前，畫面就先更新了 */
  async function openMenu(autoClose = true): Promise<void> {
    f = TestBed.createComponent(SelfChangingItemsHostComponent);
    f.componentInstance.autoClose = autoClose;
    f.autoDetectChanges(true);
    (document.querySelector('[data-testid="trigger"]') as HTMLElement).focus();
    f.componentInstance.open = true;
    f.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
  }

  afterEach(() => {
    f?.destroy();
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  /** 滑鼠點一下：先按下（選單在這時記下按的是哪裡），再點擊 */
  function mouseClick(el: Element): void {
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }
  const trigger = () => document.querySelector('[data-testid="trigger"]') as HTMLElement;

  it('點了之後這一項變成停用：選單照樣關閉，焦點回到觸發鈕', async () => {
    await openMenu();
    mouseClick(document.querySelector('[data-testid="pin"] button') as HTMLElement);
    await tick();
    expect(f.componentInstance.pinned).toBeTrue();
    expect(f.componentInstance.closeCount).toBe(1);
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('點了之後選項清單被重建（這一項換成新的元素）：選單照樣關閉，焦點回到觸發鈕', async () => {
    await openMenu();
    const target = document.querySelectorAll<HTMLElement>('app-action-menu app-menu-item button')[1];
    mouseClick(target);
    await tick();
    expect(target.isConnected).toBeFalse();
    expect(f.componentInstance.closeCount).toBe(1);
    expect(menu()).toBeNull();
    // 按到的那一項關閉時已經不在畫面上，也還是選單裡面，不能當成按了選單外面的控制項
    expect(document.activeElement).toBe(trigger());
  });

  it('點到圖示、點了之後這一項換了圖示（按到的線條被換掉）：選單照樣關閉，焦點回到觸發鈕', async () => {
    await openMenu();
    const path = document.querySelector('[data-testid="dir"] app-icon svg path') as Element;
    mouseClick(path);
    await tick();
    expect(path.isConnected).toBeFalse();
    expect(f.componentInstance.asc).toBeFalse();
    expect(f.componentInstance.closeCount).toBe(1);
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('autoCloseOnAction=false（手機排序）：點圖示換了圖示，選單不關，焦點也不會被拉到選單外框', async () => {
    await openMenu(false);
    const path = document.querySelector('[data-testid="dir"] app-icon svg path') as Element;
    mouseClick(path);
    await tick();
    expect(f.componentInstance.asc).toBeFalse();
    expect(f.componentInstance.closeCount).toBe(0);
    expect(menu()).not.toBeNull();
    expect(document.activeElement).not.toBe(menu());
  });
});

describe('ActionMenuComponent — 選單模式：按住 Enter 或空白鍵不放', () => {
  let fixture: ComponentFixture<MenuModeHostComponent>;
  const trigger = () => document.querySelector('[data-testid="trigger"]') as HTMLElement;

  async function openMenu(): Promise<void> {
    fixture = TestBed.createComponent(MenuModeHostComponent);
    fixture.detectChanges();
    trigger().focus();
    fixture.componentInstance.open = true;
    fixture.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('aria-checked')).toBe('true'); // 停在「由舊到新」
  }

  function release(key: string): KeyboardEvent {
    const up = new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true });
    ((document.activeElement as HTMLElement | null) ?? document.body).dispatchEvent(up);
    return up;
  }

  // 別的測試按了 Enter／空白鍵沒放開時，吃連發的監聽會留到這裡；先放開，每一條都從沒有監聽的狀態開始
  beforeEach(() => {
    release('Enter');
    release(' ');
  });

  afterEach(() => {
    release('Enter');
    release(' ');
    fixture?.destroy();
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  for (const [key, name] of [['Enter', 'Enter'], [' ', '空白鍵']] as const) {
    it(`${name}：連發的按鍵（按住觸發鈕打開選單後落進選單）不執行選項`, async () => {
      await openMenu();
      expect(press(key, { repeat: true }).defaultPrevented).toBeTrue();
      fixture.detectChanges();
      expect(fixture.componentInstance.picks).toEqual([]);
      expect(fixture.componentInstance.open).toBeTrue();
    });

    it(`${name}：執行一項、選單關掉後，到放開之前的連發都被吃掉，觸發鈕和 document 都收不到`, async () => {
      await openMenu();
      press(key);
      fixture.detectChanges();
      expect(fixture.componentInstance.picks).toEqual(['由舊到新']);
      expect(fixture.componentInstance.open).toBeFalse();
      expect(document.activeElement).toBe(trigger());
      const seen: string[] = [];
      const onKey = (e: KeyboardEvent) => seen.push(`${e.type}:${e.repeat ? 'repeat' : 'first'}`);
      trigger().addEventListener('keydown', onKey);
      document.addEventListener('keydown', onKey);
      try {
        expect(press(key, { repeat: true }).defaultPrevented).toBeTrue();
        expect(seen).toEqual([]);
        // 空白鍵在按鈕上是放開時才按下去：放開這一下也不能按到觸發鈕
        expect(release(key).defaultPrevented).toBeTrue();
        // 放開後重新按：照常
        expect(press(key).defaultPrevented).toBeFalse();
        expect(seen).toEqual(['keydown:first', 'keydown:first']);
      } finally {
        trigger().removeEventListener('keydown', onKey);
        document.removeEventListener('keydown', onKey);
      }
    });
  }

  it('焦點離開視窗、收不到放開：之後的連發不再被吃掉', async () => {
    await openMenu();
    press('Enter');
    fixture.detectChanges();
    window.dispatchEvent(new Event('blur'));
    expect(press('Enter', { repeat: true }).defaultPrevented).toBeFalse();
  });

  it('收不到放開、又真的按了一次同一個鍵：這一下照常傳下去，之後的連發也不再被吃掉', async () => {
    await openMenu();
    press('Enter');
    fixture.detectChanges();
    expect(document.activeElement).toBe(trigger());
    expect(press('Enter').defaultPrevented).toBeFalse();
    expect(press('Enter', { repeat: true }).defaultPrevented).toBeFalse();
  });
});

describe('ActionMenuComponent — 選單模式：先按過外層裡別的控制項，之後用鍵盤選一項', () => {
  let fixture: ComponentFixture<MenuModeHostComponent>;
  const q = (sel: string) => document.querySelector(sel) as HTMLElement;

  afterEach(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    fixture?.destroy();
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('按下時不拿走焦點的控制項按過之後，用 Enter 選一項：焦點回到觸發鈕', async () => {
    fixture = TestBed.createComponent(MenuModeHostComponent);
    fixture.detectChanges();
    q('[data-testid="trigger"]').focus();
    fixture.componentInstance.open = true;
    fixture.detectChanges();
    await nextFrame();
    await tick();
    const item = document.activeElement;
    expect(item?.getAttribute('aria-checked')).toBe('true');
    // 例如編輯器工具列寫了 mousedown 取消預設的按鈕：按下去不拿走焦點；它在選單的外層裡，不算點外面，選單照樣開著
    q('[data-testid="before"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open).toBeTrue();
    expect(document.activeElement).toBe(item);
    press('Enter');
    fixture.detectChanges();
    expect(fixture.componentInstance.picks).toEqual(['由舊到新']);
    expect(fixture.componentInstance.open).toBeFalse();
    expect(document.activeElement).toBe(q('[data-testid="trigger"]'));
  });
});

/** 同一個外層裡兩顆 app-button 觸發鈕共用一個狀態，B 沒綁 aria-expanded（例如改寫到一半） */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent, ButtonComponent],
  template: `
    <div class="toolbar">
      <app-button data-testid="hb-a" variant="outlined" color="neutral" size="XS" text="篩選"
        ariaHaspopup="menu" [ariaExpanded]="which === 'A'" (btnClick)="toggle('A')"></app-button>
      <app-button data-testid="hb-b" variant="outlined" color="neutral" size="XS" text="排序"
        ariaHaspopup="menu" (btnClick)="toggle('B')"></app-button>
      @if (which === 'A') {
        <app-action-menu ariaLabel="篩選" (closeMenu)="which = null">
          <app-menu-item label="項目 A1"></app-menu-item>
        </app-action-menu>
      }
      @if (which === 'B') {
        <app-action-menu ariaLabel="排序" (closeMenu)="which = null">
          <app-menu-item label="由新到舊"></app-menu-item>
          <app-menu-item label="由舊到新"></app-menu-item>
        </app-action-menu>
      }
    </div>
  `,
})
class HalfBoundSwitchHostComponent {
  which: 'A' | 'B' | null = null;

  toggle(menu: 'A' | 'B'): void {
    this.which = this.which === menu ? null : menu;
  }
}

describe('ActionMenuComponent — 選單模式：從開著的選單直接切到沒綁 aria-expanded 的觸發鈕（Chrome）', () => {
  let f: ComponentFixture<HalfBoundSwitchHostComponent>;
  const inner = (id: string) => document.querySelector(`[data-testid="${id}"] button`) as HTMLElement;

  afterEach(() => {
    f?.destroy();
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  it('A 開著時點 B：關掉 B 後焦點回到 B（打開前有焦點的元素），不是剛關掉的 A', async () => {
    f = TestBed.createComponent(HalfBoundSwitchHostComponent);
    f.detectChanges();
    inner('hb-a').focus();
    inner('hb-a').click();
    f.detectChanges();
    await nextFrame();
    await tick();
    expect(f.componentInstance.which).toBe('A');
    // Chrome 按下 B 時就把焦點給它
    inner('hb-b').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    f.detectChanges();
    inner('hb-b').focus();
    inner('hb-b').click();
    f.detectChanges();
    await nextFrame();
    await tick();
    expect(f.componentInstance.which).toBe('B');
    expect(inner('hb-a').getAttribute('aria-expanded')).toBe('false');
    press('Escape');
    f.detectChanges();
    expect(f.componentInstance.which).toBeNull();
    expect(document.activeElement).toBe(inner('hb-b'));
  });
});

/** 每列一顆觸發鈕、共用一份選單；資料重新載入時清單依物件重建，觸發鈕換成新的元素 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="rows">
      @for (r of rows; track r) {
        <button type="button" [attr.data-testid]="'row-' + r.id" aria-haspopup="menu"
          [attr.aria-expanded]="openId === r.id" (click)="openId = openId === r.id ? null : r.id">{{ r.name }}</button>
      }
      @if (openId !== null) {
        <app-action-menu ariaLabel="列操作" [fixedMode]="fixed" [fixedTop]="fixed ? 100 : null" [fixedLeft]="fixed ? 100 : null"
          (closeMenu)="openId = null">
          <app-menu-item label="開啟"></app-menu-item>
          <app-menu-item label="刪除"></app-menu-item>
        </app-action-menu>
      }
    </div>
  `,
})
class RebuiltRowTriggerHostComponent {
  rows = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }];
  openId: number | null = null;
  fixed = false;
  reload(): void {
    this.rows = this.rows.map(r => ({ ...r }));
  }
}

/** 版面變窄時觸發鈕從 app-button 換成原生按鈕，選單是同一份 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent, ButtonComponent],
  template: `
    <div class="wrap">
      @if (compact) {
        <button type="button" data-testid="narrow" aria-haspopup="menu" [attr.aria-expanded]="open" (click)="open = !open">更多</button>
      } @else {
        <app-button data-testid="wide" variant="outlined" color="neutral" size="XS" text="更多"
          ariaHaspopup="menu" [ariaExpanded]="open" (btnClick)="open = !open"></app-button>
      }
      @if (open) {
        <app-action-menu ariaLabel="更多" (closeMenu)="open = false">
          <app-menu-item label="一"></app-menu-item>
          <app-menu-item label="二"></app-menu-item>
        </app-action-menu>
      }
    </div>
  `,
})
class SwappedTriggerHostComponent {
  open = false;
  compact = false;
}

describe('ActionMenuComponent — 選單模式：選單開著時觸發鈕被重建', () => {
  afterEach(() => {
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  for (const fixed of [false, true]) {
    for (const browser of ['Chrome', 'Safari'] as const) {
      for (const closeWith of ['Escape', 'Tab', 'item-click'] as const) {
        it(`清單重新載入（fixedMode ${fixed}、${browser}、${closeWith} 關掉）：焦點回到重建後的那顆觸發鈕`, async () => {
          const f = TestBed.createComponent(RebuiltRowTriggerHostComponent);
          f.componentInstance.fixed = fixed;
          f.detectChanges();
          const row2 = () => document.querySelector('[data-testid="row-2"]') as HTMLElement;
          // Chrome 點按鈕會給它焦點；Safari 不給，焦點留在 body
          if (browser === 'Chrome') row2().focus();
          else (document.activeElement as HTMLElement | null)?.blur();
          row2().click();
          f.detectChanges();
          await nextFrame();
          await tick();
          expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
          const before = row2();
          f.componentInstance.reload();
          f.detectChanges();
          expect(row2()).not.toBe(before);
          if (closeWith === 'Escape') press('Escape');
          else if (closeWith === 'Tab') press('Tab');
          else document.querySelectorAll<HTMLElement>('app-action-menu app-menu-item button')[0].click();
          f.detectChanges();
          expect(f.componentInstance.openId).toBeNull();
          expect(document.activeElement).toBe(row2());
          f.destroy();
        });
      }
    }
  }

  for (const browser of ['Chrome', 'Safari'] as const) {
    it(`版面變窄、觸發鈕從 app-button 換成原生按鈕（${browser}）：Esc 關掉後焦點回到換上來的那顆`, async () => {
      const f = TestBed.createComponent(SwappedTriggerHostComponent);
      f.detectChanges();
      const wide = () => document.querySelector('[data-testid="wide"] button') as HTMLElement;
      if (browser === 'Chrome') wide().focus();
      else (document.activeElement as HTMLElement | null)?.blur();
      wide().click();
      f.detectChanges();
      await nextFrame();
      await tick();
      expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
      f.componentInstance.compact = true;
      f.detectChanges();
      const narrow = document.querySelector('[data-testid="narrow"]') as HTMLElement;
      expect(narrow.getAttribute('aria-expanded')).toBe('true');
      press('Escape');
      f.detectChanges();
      expect(f.componentInstance.open).toBeFalse();
      expect(document.activeElement).toBe(narrow);
      f.destroy();
    });
  }
});

/**
 * 上一層的清單面板一直開著（打開它的按鈕標著 aria-expanded="true"），面板裡每列的「更多」打開第二層選單。
 * 「更多」是 role="button"、tabindex="0" 的 span，沒有 aria-haspopup：點它、按它都會取得焦點
 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="backdrop">
      <button type="button" data-testid="picker" aria-haspopup="menu" [attr.aria-expanded]="panelOpen" (click)="panelOpen = !panelOpen">清單</button>
      @if (panelOpen) {
        <div class="panel">
          @for (r of rows; track r) {
            <div class="row">
              {{ r.name }}
              <span role="button" tabindex="0" [attr.data-testid]="'more-' + r.id" (click)="menuFor = r.id">更多</span>
            </div>
          }
        </div>
      }
      @if (menuFor !== null) {
        <app-action-menu ariaLabel="列操作" [fixedMode]="true" [fixedTop]="100" [fixedLeft]="100" (closeMenu)="menuFor = null">
          <app-menu-item label="項目一"></app-menu-item>
          <app-menu-item label="項目二"></app-menu-item>
        </app-action-menu>
      }
    </div>
  `,
})
class OpenPanelRowMenuHostComponent {
  panelOpen = true;
  rows = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
  menuFor: number | null = null;
  reload(): void {
    this.rows = this.rows.map(r => ({ ...r }));
  }
}

describe('ActionMenuComponent — 選單模式：上一層的選單按鈕一直標著 aria-expanded="true"', () => {
  let f: ComponentFixture<OpenPanelRowMenuHostComponent>;
  const picker = () => document.querySelector('[data-testid="picker"]') as HTMLElement;
  const more2 = () => document.querySelector('[data-testid="more-2"]') as HTMLElement;

  async function openFromMore2(): Promise<void> {
    f = TestBed.createComponent(OpenPanelRowMenuHostComponent);
    f.detectChanges();
    expect(picker().getAttribute('aria-expanded')).toBe('true');
    more2().focus(); // Chrome、Safari 點 tabindex="0" 的元素都會給它焦點，用鍵盤按也是
    more2().click();
    f.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
  }

  afterEach(() => {
    f?.destroy();
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });

  for (const closeWith of ['Escape', 'Tab', 'item-click'] as const) {
    it(`從面板裡的「更多」打開、${closeWith} 關掉：焦點回到「更多」，不會跳到上一層標著的按鈕`, async () => {
      await openFromMore2();
      if (closeWith === 'Escape') press('Escape');
      else if (closeWith === 'Tab') press('Tab');
      else document.querySelectorAll<HTMLElement>('app-action-menu app-menu-item button')[0].click();
      f.detectChanges();
      expect(f.componentInstance.menuFor).toBeNull();
      expect(document.activeElement).toBe(more2());
    });
  }

  it('選單開著時面板重新載入、「更多」換成新的元素：認不出是哪顆，焦點不還，也不會跳到上一層標著的按鈕', async () => {
    await openFromMore2();
    f.componentInstance.reload();
    f.detectChanges();
    press('Escape');
    f.detectChanges();
    expect(f.componentInstance.menuFor).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it('Safari：A 開著時點沒綁 aria-expanded 的 B（焦點清回 body）：關掉 B 後焦點不會跑到 A 的觸發鈕', async () => {
    const h = TestBed.createComponent(HalfBoundSwitchHostComponent);
    h.detectChanges();
    const inner = (id: string) => document.querySelector(`[data-testid="${id}"] button`) as HTMLElement;
    (document.activeElement as HTMLElement | null)?.blur();
    inner('hb-a').click();
    h.detectChanges();
    await nextFrame();
    await tick();
    inner('hb-b').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    h.detectChanges();
    (document.activeElement as HTMLElement | null)?.blur(); // Safari 按按鈕不給它焦點
    inner('hb-b').click();
    h.detectChanges();
    await nextFrame();
    await tick();
    expect(h.componentInstance.which).toBe('B');
    press('Escape');
    h.detectChanges();
    expect(h.componentInstance.which).toBeNull();
    expect(document.activeElement).toBe(document.body);
    h.destroy();
  });
});

/** 觸發鈕放在可聚焦的格子裡（role="gridcell"、tabindex="-1"，格子本身也算控制項） */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div role="grid">
      <div role="row">
        <div role="gridcell" tabindex="-1" data-testid="cell">
          <button type="button" data-testid="cell-trigger" aria-haspopup="menu" [attr.aria-expanded]="open" (click)="open = !open">更多</button>
          @if (open) {
            <app-action-menu ariaLabel="列操作" (closeMenu)="open = false">
              <app-menu-item label="項目一"></app-menu-item>
            </app-action-menu>
          }
        </div>
      </div>
    </div>
  `,
})
class TriggerInFocusableCellHostComponent {
  open = false;
}

describe('ActionMenuComponent — 選單模式：觸發鈕放在可聚焦的格子裡（Safari）', () => {
  it('Safari 點按鈕時焦點停在外面的格子：Esc 關掉後焦點回到格子裡的觸發鈕，不是格子', async () => {
    const f = TestBed.createComponent(TriggerInFocusableCellHostComponent);
    f.detectChanges();
    const cell = document.querySelector('[data-testid="cell"]') as HTMLElement;
    const trigger = document.querySelector('[data-testid="cell-trigger"]') as HTMLElement;
    cell.focus(); // Safari 點按鈕不給它焦點，焦點落到最近一層點得到焦點的祖先
    trigger.click();
    f.detectChanges();
    await nextFrame();
    await tick();
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
    press('Escape');
    f.detectChanges();
    expect(f.componentInstance.open).toBeFalse();
    expect(document.activeElement).toBe(trigger);
    f.destroy();
    document.querySelectorAll('app-action-menu').forEach(el => el.remove());
  });
});
