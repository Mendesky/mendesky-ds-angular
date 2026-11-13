import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionMenuComponent } from '../action-menu/action-menu.component';
import { MenuItemComponent } from './menu-item.component';

/**
 * app-menu-item 的補充說明面板（details，2026-11-12）：
 * - 只在 app-action-menu 裡有作用；設了 opensPanel 的、放在選單外的，設了也沒有面板、不念。
 * - 滑過、或用鍵盤移到（最後一次操作是鍵盤時拿到焦點）有 details 的項目 → 選單右邊出現面板，
 *   標題是 label，條列是 details；換項目時同一塊面板換內容與位置（不重建，所以不重播淡入）。
 * - 滑鼠離開項目、離開選單 → 面板留著；滑過沒有 details 的項目 → 收起來；選單關閉 → 從 DOM 移除。
 * - 位置：選單右邊隔 8px，頂端對齊這一列（列頂減去選單上內距）；右邊放不下改放左邊；下面放不下往上移。
 * - 左右都放不下 320px：放空間大的那邊、縮窄；不到 200px 不顯示。疊放層級跟選單一樣。
 * - 面板 aria-hidden；點面板算點在選單裡（選單不關、底下點不到、焦點不被搶）。
 *   按鈕的 aria-describedby 另外指向藏起來的條列文字（有說明時說明在前）。
 * 面板搬到 body，從 document 查。
 */

const PANEL = '.am-details';

function panel(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(PANEL);
}

function button(fixture: ComponentFixture<unknown>, testId: string): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>(`[data-testid="${testId}"] button`)!;
}

function hover(fixture: ComponentFixture<unknown>, testId: string): void {
  button(fixture, testId).dispatchEvent(new MouseEvent('mouseenter'));
  fixture.detectChanges();
}

function leave(fixture: ComponentFixture<unknown>, testId: string): void {
  button(fixture, testId).dispatchEvent(new MouseEvent('mouseleave'));
  fixture.detectChanges();
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="anchor" style="position: fixed; top: 40px; left: 40px; width: 10px; height: 10px">
      @if (open) {
        <app-action-menu ariaLabel="新增" [autoFocusFirst]="autoFocus"
          [fixedMode]="fixed" [fixedTop]="fixedTop" [fixedLeft]="fixedLeft" [fixedWidth]="fixedWidth"
          (closeMenu)="open = false">
          <app-menu-item data-testid="a" label="項目 A" [details]="detailsA"></app-menu-item>
          @if (showB) {
            <app-menu-item data-testid="b" label="項目 B" [details]="['另一條說明']"></app-menu-item>
          }
          <app-menu-item data-testid="c" label="項目 C"></app-menu-item>
          <app-menu-item data-testid="d" label="項目 D" opensPanel="dialog" [details]="['不會出現']"></app-menu-item>
          <app-menu-item data-testid="e" label="項目 E" description="一行說明" [details]="['第一條', '第二條']"></app-menu-item>
          <app-menu-item data-testid="empty" label="項目 F" [details]="[]"></app-menu-item>
        </app-action-menu>
      }
    </div>
    <div role="group" aria-label="外面">
      <app-menu-item data-testid="outside" label="選單外" [details]="['不會出現']"></app-menu-item>
    </div>
  `,
})
class DetailsHostComponent {
  open = true;
  showB = true;
  fixed = false;
  fixedTop: number | null = null;
  fixedLeft: number | null = null;
  fixedWidth: number | null = null;
  autoFocus = false;
  detailsA: string[] = ['第一條說明', '第二條說明'];
}

describe('MenuItemComponent 補充說明面板（details）', () => {
  let fixture: ComponentFixture<DetailsHostComponent>;

  async function create(setup?: (host: DetailsHostComponent) => void): Promise<void> {
    fixture = TestBed.createComponent(DetailsHostComponent);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
    await nextFrame();
    fixture.detectChanges();
    // 等選單打開的縮放動畫跑完，量到的列位置才是最終位置
    await Promise.all(document.getAnimations().map((a) => a.finished));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DetailsHostComponent] }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    document.querySelectorAll(PANEL).forEach((el) => el.remove());
  });

  it('還沒滑過、也沒用鍵盤移過去時沒有面板', async () => {
    await create();
    expect(panel()).toBeNull();
  });

  it('滑過有 details 的項目：面板在 body 底下，標題是 label，條列是每一條 details', async () => {
    await create();
    hover(fixture, 'a');
    const p = panel();
    expect(p).not.toBeNull();
    expect(p!.parentElement).toBe(document.body);
    expect(p!.querySelector('.am-details__title')!.textContent!.trim()).toBe('項目 A');
    const items = Array.from(p!.querySelectorAll('li')).map((li) => li.textContent!.trim());
    expect(items).toEqual(['第一條說明', '第二條說明']);
  });

  it('面板 aria-hidden="true"，寬 320px', async () => {
    await create();
    hover(fixture, 'a');
    const p = panel()!;
    expect(p.getAttribute('aria-hidden')).toBe('true');
    expect(p.getBoundingClientRect().width).toBe(320);
  });

  describe('點面板算點在選單裡', () => {
    /** 面板正中間那一點；真的點下去時，瀏覽器把點擊交給這一點最上面的元素 */
    function panelCenter(): { x: number; y: number } {
      const r = panel()!.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    it('面板底下有按鈕：點下去落在面板上，不會點到底下的按鈕', async () => {
      await create();
      hover(fixture, 'a');
      await nextFrame();
      fixture.detectChanges();
      const { x, y } = panelCenter();
      const under = document.createElement('button');
      under.style.cssText = `position: fixed; left: ${x - 20}px; top: ${y - 10}px; width: 40px; height: 20px; z-index: 1`;
      document.body.appendChild(under);
      try {
        expect(panel()!.contains(document.elementFromPoint(x, y))).withContext('點擊要落在面板上').toBeTrue();
      } finally {
        under.remove();
      }
    });

    it('在面板上按下：選單不關（定位服務不當成點外面）', async () => {
      await create((host) => { host.fixed = true; host.fixedTop = 40; host.fixedLeft = 40; });
      hover(fixture, 'a');
      await nextFrame();
      fixture.detectChanges();
      const { x, y } = panelCenter();
      const target = document.elementFromPoint(x, y)!;
      target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y }));
      fixture.detectChanges();
      expect(fixture.componentInstance.open).toBeTrue();
      expect(document.querySelector('app-action-menu')).not.toBeNull();
      expect(panel()).not.toBeNull();
    });

    it('對照：在面板外面按下，選單會關（確認上一條真的走到點外面的判斷）', async () => {
      await create((host) => { host.fixed = true; host.fixedTop = 40; host.fixedLeft = 40; });
      hover(fixture, 'a');
      await nextFrame();
      fixture.detectChanges();
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(fixture.componentInstance.open).toBeFalse();
    });

    it('元素錨點模式也一樣：在面板上按下，選單不關', async () => {
      await create();
      hover(fixture, 'a');
      await nextFrame();
      fixture.detectChanges();
      const { x, y } = panelCenter();
      document.elementFromPoint(x, y)!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y }));
      fixture.detectChanges();
      expect(fixture.componentInstance.open).toBeTrue();
    });

    it('在面板上按下滑鼠不搶焦點：焦點留在選單的那一項，方向鍵還能用', async () => {
      await create();
      hover(fixture, 'a');
      button(fixture, 'a').focus();
      const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      panel()!.querySelector('li')!.dispatchEvent(down);
      expect(down.defaultPrevented).toBeTrue();
    });
  });

  it('疊放層級跟選單一樣：選單在 z-index 2000 的浮層上時，面板也在浮層上面', async () => {
    const cover = document.createElement('div');
    cover.style.cssText = 'position: fixed; inset: 0; z-index: 2000';
    document.body.appendChild(cover);
    try {
      await create();
      hover(fixture, 'a');
      await nextFrame();
      fixture.detectChanges();
      const menu = document.querySelector<HTMLElement>('app-action-menu')!;
      // 前提：定位服務把選單放到浮層上面
      expect(parseInt(getComputedStyle(menu).zIndex, 10)).toBeGreaterThan(2000);
      expect(getComputedStyle(panel()!).zIndex).toBe(getComputedStyle(menu).zIndex);
      const r = panel()!.getBoundingClientRect();
      expect(panel()!.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2))).toBeTrue();
    } finally {
      cover.remove();
    }
  });

  it('位置：選單右邊隔 8px，頂端對齊滑過的那一列（列頂減去選單上內距）', async () => {
    await create();
    hover(fixture, 'b');
    await nextFrame();
    fixture.detectChanges();
    const menu = document.querySelector('app-action-menu')!;
    const menuRect = menu.getBoundingClientRect();
    const padTop = parseFloat(getComputedStyle(menu).paddingTop);
    const row = document.querySelector('[data-testid="b"]')!.getBoundingClientRect();
    const p = panel()!.getBoundingClientRect();
    expect(p.left).toBeCloseTo(menuRect.right + 8, 0);
    expect(p.top).toBeCloseTo(row.top - padTop, 0);
  });

  it('選單還在打開的縮放動畫中就滑過：動畫結束後面板重新貼齊那一列', async () => {
    fixture = TestBed.createComponent(DetailsHostComponent);
    fixture.detectChanges();
    const menu = document.querySelector<HTMLElement>('app-action-menu')!;
    const opening = menu.getAnimations();
    // 前提：選單真的在跑打開動畫，不然這個案例沒有在測動畫中
    expect(opening.length).toBeGreaterThan(0);
    hover(fixture, 'b');
    await Promise.all(opening.map((a) => a.finished));
    await nextFrame();
    await nextFrame();
    fixture.detectChanges();
    const padTop = parseFloat(getComputedStyle(menu).paddingTop);
    const row = document.querySelector('[data-testid="b"]')!.getBoundingClientRect();
    expect(Math.abs(panel()!.getBoundingClientRect().top - (row.top - padTop))).toBeLessThan(0.1);
  });

  it('換到另一項：同一塊面板換內容、移到那一列（不重建，淡入不重播）', async () => {
    await create();
    hover(fixture, 'a');
    const first = panel();
    const topA = first!.getBoundingClientRect().top;
    hover(fixture, 'b');
    await nextFrame();
    fixture.detectChanges();
    expect(panel()).toBe(first);
    expect(first!.querySelector('.am-details__title')!.textContent!.trim()).toBe('項目 B');
    expect(first!.getBoundingClientRect().top).toBeGreaterThan(topA);
  });

  it('滑鼠離開項目、移出選單：面板留著，還是最後那一項', async () => {
    await create();
    hover(fixture, 'a');
    leave(fixture, 'a');
    document.querySelector('app-action-menu')!.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
    expect(panel()!.querySelector('.am-details__title')!.textContent!.trim()).toBe('項目 A');
  });

  it('滑過沒有 details 的項目（含空陣列）：面板收起來', async () => {
    await create();
    hover(fixture, 'a');
    hover(fixture, 'c');
    expect(panel()).toBeNull();
    hover(fixture, 'a');
    hover(fixture, 'empty');
    expect(panel()).toBeNull();
  });

  it('選單關閉：面板從 DOM 移除', async () => {
    await create();
    hover(fixture, 'a');
    fixture.componentInstance.open = false;
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('滑過的項目從選單裡被拿掉（選單還開著）：面板跟著收起來', async () => {
    await create();
    hover(fixture, 'b');
    expect(panel()).not.toBeNull();
    fixture.componentInstance.showB = false;
    fixture.detectChanges();
    expect(document.querySelector('app-action-menu')).not.toBeNull();
    expect(panel()).toBeNull();
  });

  it('別的項目被拿掉：面板不受影響', async () => {
    await create();
    hover(fixture, 'a');
    fixture.componentInstance.showB = false;
    fixture.detectChanges();
    expect(panel()!.querySelector('.am-details__title')!.textContent!.trim()).toBe('項目 A');
  });

  it('滑過的項目 details 改了：面板內容跟著換', async () => {
    await create();
    hover(fixture, 'a');
    fixture.componentInstance.detailsA = ['換過的說明'];
    fixture.detectChanges();
    const items = Array.from(panel()!.querySelectorAll('li')).map((li) => li.textContent!.trim());
    expect(items).toEqual(['換過的說明']);
  });

  it('滑過的項目 details 改成空陣列：面板收起來', async () => {
    await create();
    hover(fixture, 'a');
    fixture.componentInstance.detailsA = [];
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  describe('鍵盤：最後一次操作是鍵盤，焦點移過來才出現', () => {
    /** 模擬使用者剛按過鍵盤（例如在觸發鈕上按 Enter 打開選單） */
    function pressKey(): void {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    }
    /** 模擬使用者剛用滑鼠按下（例如點觸發鈕打開選單）。要在選單打開前按：選單開著時按 document 算點外面，選單會關 */
    function pressPointer(): void {
      document.dispatchEvent(new PointerEvent('pointerdown'));
    }

    it('用鍵盤打開（焦點被放到第一項）：面板出現', async () => {
      pressPointer();
      pressKey();
      await create();
      button(fixture, 'a').focus();
      fixture.detectChanges();
      expect(panel()).not.toBeNull();
      expect(panel()!.querySelector('.am-details__title')!.textContent!.trim()).toBe('項目 A');
    });

    it('用滑鼠點開（焦點被放到第一項）：面板不出現', async () => {
      // 先按一下鍵盤當起點：不管前一條測試留下什麼，要記到這次的滑鼠按下才會不出現
      pressKey();
      pressPointer();
      await create();
      button(fixture, 'a').focus();
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('用滑鼠點開，就算瀏覽器畫了焦點框（Safari）：面板也不出現', async () => {
      pressKey();
      pressPointer();
      await create();
      const original = Element.prototype.matches;
      spyOn(Element.prototype, 'matches').and.callFake(function (this: Element, selector: string) {
        return selector === ':focus-visible' ? true : original.call(this, selector);
      });
      button(fixture, 'a').focus();
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('用滑鼠點開後按方向鍵往下：出現下一項的說明', async () => {
      pressKey();
      pressPointer();
      await create();
      button(fixture, 'a').focus();
      fixture.detectChanges();
      button(fixture, 'a').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      expect(document.activeElement).toBe(button(fixture, 'b'));
      expect(panel()!.querySelector('.am-details__title')!.textContent!.trim()).toBe('項目 B');
    });

    it('真實路徑：先按鍵盤、再打開選單（autoFocusFirst 把焦點放到第一項）→ 第一項的說明出現', async () => {
      // 打開選單的那一下按鍵發生時，選項還不存在；要在選項建立之前就記得最後一次是鍵盤（11-12 修過）
      pressPointer();
      pressKey();
      await create((host) => { host.autoFocus = true; });
      await nextFrame();
      await nextFrame();
      fixture.detectChanges();
      expect(document.activeElement).toBe(button(fixture, 'a'));
      expect(panel()).not.toBeNull();
      expect(panel()!.querySelector('.am-details__title')!.textContent!.trim()).toBe('項目 A');
    });

    it('真實路徑：先按滑鼠、再打開選單（autoFocusFirst）→ 不出現', async () => {
      pressKey();
      pressPointer();
      await create((host) => { host.autoFocus = true; });
      await nextFrame();
      await nextFrame();
      fixture.detectChanges();
      expect(document.activeElement).toBe(button(fixture, 'a'));
      expect(panel()).toBeNull();
    });

    it('用鍵盤移到沒有 details 的項目：面板收起來', async () => {
      pressPointer();
      pressKey();
      await create();
      button(fixture, 'b').focus();
      fixture.detectChanges();
      button(fixture, 'c').focus();
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });
  });

  describe('不生效的情況', () => {
    it('設了 opensPanel：滑過沒有面板，aria-describedby 也不指向條列', async () => {
      await create();
      hover(fixture, 'd');
      expect(panel()).toBeNull();
      expect(button(fixture, 'd').hasAttribute('aria-describedby')).toBeFalse();
    });

    it('放在選單外：滑過沒有面板，aria-describedby 也不指向條列', async () => {
      await create();
      hover(fixture, 'outside');
      expect(panel()).toBeNull();
      expect(button(fixture, 'outside').hasAttribute('aria-describedby')).toBeFalse();
    });
  });

  describe('報讀', () => {
    it('aria-describedby 指向藏起來的條列文字，內容含每一條；條列不算進名稱', async () => {
      await create();
      const btn = button(fixture, 'a');
      const ids = btn.getAttribute('aria-describedby')!.split(' ');
      expect(ids.length).toBe(1);
      const sr = document.getElementById(ids[0])!;
      expect(sr.textContent).toContain('第一條說明');
      expect(sr.textContent).toContain('第二條說明');
      expect(sr.getAttribute('aria-hidden')).toBe('true');
      expect(sr.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    });

    it('同時有 description：aria-describedby 先指說明、再指條列', async () => {
      await create();
      const ids = button(fixture, 'e').getAttribute('aria-describedby')!.split(' ');
      expect(ids.length).toBe(2);
      expect(document.getElementById(ids[0])!.textContent!.trim()).toBe('一行說明');
      expect(document.getElementById(ids[1])!.textContent).toContain('第二條');
    });

    it('每一條之間有斷句，報讀時不會黏在一起', async () => {
      await create();
      const id = button(fixture, 'a').getAttribute('aria-describedby')!;
      expect(document.getElementById(id)!.textContent).toBe('第一條說明。第二條說明。');
    });
  });

  it('淡入只在系統沒有要求減少動態時才有（150ms）', async () => {
    await create();
    hover(fixture, 'a');
    const attr = Array.from(panel()!.attributes).find((a) => a.name.startsWith('_ngcontent'))!.name;
    const selector = `.am-details[${attr}]`;
    const animated: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule && rule.selectorText === selector && rule.style.animation) animated.push('（不分條件）');
        if (!(rule instanceof CSSMediaRule)) continue;
        for (const inner of Array.from(rule.cssRules)) {
          if (inner instanceof CSSStyleRule && inner.selectorText === selector && inner.style.animation) {
            // 簡寫裡用了 var()，個別的 animation-duration 讀不到，從簡寫看
            animated.push(rule.media.mediaText);
            expect(inner.style.animation).toContain('150ms');
          }
        }
      }
    }
    expect(animated).toEqual(['(prefers-reduced-motion: no-preference)']);
  });

  describe('放不下時的位置', () => {
    it('右邊放不下：改放在選單左邊，隔 8px', async () => {
      await create((host) => {
        host.fixed = true;
        host.fixedTop = 40;
        host.fixedLeft = window.innerWidth - 230;
      });
      hover(fixture, 'a');
      await nextFrame();
      fixture.detectChanges();
      const menuRect = document.querySelector('app-action-menu')!.getBoundingClientRect();
      const p = panel()!.getBoundingClientRect();
      expect(p.right).toBeCloseTo(menuRect.left - 8, 0);
    });

    it('下面放不下：往上移，底部離視窗底邊至少 8px', async () => {
      await create((host) => {
        host.fixed = true;
        host.fixedTop = window.innerHeight - 260;
        host.fixedLeft = 40;
        host.detailsA = Array.from({ length: 12 }, (_, i) => `說明第 ${i + 1} 條`);
      });
      hover(fixture, 'a');
      const row = document.querySelector('[data-testid="a"]')!.getBoundingClientRect();
      await nextFrame();
      fixture.detectChanges();
      const p = panel()!.getBoundingClientRect();
      // 前提：照列對齊的話底部會超出視窗，這個案例才有在測夾住
      expect(row.top + p.height).toBeGreaterThan(window.innerHeight - 8);
      expect(p.bottom).toBeCloseTo(window.innerHeight - 8, 0);
      expect(p.top).toBeGreaterThanOrEqual(8);
    });

    /**
     * 用選單寬度控制左右剩多少空間：選單左緣在 8（視窗邊）＋8（間距）＋left，右邊剩 right。
     * 視窗太窄做不出來時讓測試失敗，不要默默跳過
     */
    function roomsSetup(left: number, right: number) {
      const vw = window.innerWidth;
      const menuLeft = 8 + 8 + left;
      const width = vw - menuLeft - 8 - 8 - right;
      expect(width).withContext('Karma 視窗太窄，做不出這個空間組合').toBeGreaterThan(120);
      return (host: DetailsHostComponent) => {
        host.fixed = true;
        host.fixedTop = 40;
        host.fixedLeft = menuLeft;
        host.fixedWidth = width;
      };
    }

    it('左右都放不下 320px、右邊比較大：放右邊，縮窄到右邊放得下（不超出視窗、不蓋選單）', async () => {
      await create(roomsSetup(100, 250));
      hover(fixture, 'a');
      await nextFrame();
      fixture.detectChanges();
      const menuRect = document.querySelector('app-action-menu')!.getBoundingClientRect();
      const p = panel()!.getBoundingClientRect();
      expect(p.left).toBeCloseTo(menuRect.right + 8, 0);
      expect(p.width).toBeLessThanOrEqual(250);
      expect(p.width).toBeGreaterThan(240);
      expect(p.right).toBeLessThanOrEqual(window.innerWidth - 8 + 0.5);
    });

    it('左右都放不下 320px、左邊比較大：放左邊，縮窄到左邊放得下', async () => {
      await create(roomsSetup(260, 90));
      hover(fixture, 'a');
      await nextFrame();
      fixture.detectChanges();
      const menuRect = document.querySelector('app-action-menu')!.getBoundingClientRect();
      const p = panel()!.getBoundingClientRect();
      expect(p.right).toBeCloseTo(menuRect.left - 8, 0);
      expect(p.left).toBeGreaterThanOrEqual(8 - 0.5);
      expect(p.width).toBeLessThanOrEqual(260);
      expect(p.width).toBeGreaterThan(250);
    });

    it('兩邊都不到 200px：不顯示面板，報讀照樣念得到條列', async () => {
      await create(roomsSetup(150, 180));
      hover(fixture, 'a');
      await nextFrame();
      fixture.detectChanges();
      expect(panel()).toBeNull();
      const id = button(fixture, 'a').getAttribute('aria-describedby')!;
      expect(document.getElementById(id)!.textContent).toContain('第一條說明');
    });

    it('元素錨點模式：頁面捲動讓選單移動後，面板跟著重新對齊那一列', async () => {
      await create();
      hover(fixture, 'b');
      await nextFrame();
      fixture.detectChanges();
      const menu = document.querySelector<HTMLElement>('app-action-menu')!;
      const before = menu.getBoundingClientRect().top;
      // 錨點移動＋捲動事件：定位服務在 document 上聽捲動、之後才移選單；面板在 window 上聽，會先量
      document.querySelector<HTMLElement>('.anchor')!.style.top = '140px';
      document.dispatchEvent(new Event('scroll'));
      for (let i = 0; i < 4; i++) await nextFrame();
      fixture.detectChanges();
      // 前提：選單真的跟著錨點移動了
      expect(menu.getBoundingClientRect().top).toBeGreaterThan(before + 50);
      const padTop = parseFloat(getComputedStyle(menu).paddingTop);
      const row = document.querySelector('[data-testid="b"]')!.getBoundingClientRect();
      expect(panel()!.getBoundingClientRect().top).toBeCloseTo(row.top - padTop, 0);
    });

    it('頁面捲動或選單移動後：面板跟著重新對齊那一列', async () => {
      await create((host) => {
        host.fixed = true;
        host.fixedTop = 40;
        host.fixedLeft = 40;
      });
      hover(fixture, 'b');
      await nextFrame();
      fixture.detectChanges();
      const menu = document.querySelector<HTMLElement>('app-action-menu')!;
      menu.style.top = '140px';
      window.dispatchEvent(new Event('scroll'));
      await nextFrame();
      await nextFrame();
      fixture.detectChanges();
      const padTop = parseFloat(getComputedStyle(menu).paddingTop);
      const row = document.querySelector('[data-testid="b"]')!.getBoundingClientRect();
      expect(panel()!.getBoundingClientRect().top).toBeCloseTo(row.top - padTop, 0);
    });
  });
});
