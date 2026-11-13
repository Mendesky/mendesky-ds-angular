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
 * - 面板 aria-hidden、點不到；按鈕的 aria-describedby 另外指向藏起來的條列文字（有說明時說明在前）。
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
        <app-action-menu ariaLabel="新增" [autoFocusFirst]="false"
          [fixedMode]="fixed" [fixedTop]="fixedTop" [fixedLeft]="fixedLeft">
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

  it('面板 aria-hidden="true"、點不到（pointer-events: none），寬 320px', async () => {
    await create();
    hover(fixture, 'a');
    const p = panel()!;
    expect(p.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(p).pointerEvents).toBe('none');
    expect(p.getBoundingClientRect().width).toBe(320);
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
    /** 模擬使用者剛用滑鼠按下（例如點觸發鈕打開選單） */
    function pressPointer(): void {
      document.dispatchEvent(new PointerEvent('pointerdown'));
    }

    it('用鍵盤打開（焦點被放到第一項）：面板出現', async () => {
      await create();
      pressKey();
      button(fixture, 'a').focus();
      fixture.detectChanges();
      expect(panel()).not.toBeNull();
      expect(panel()!.querySelector('.am-details__title')!.textContent!.trim()).toBe('項目 A');
    });

    it('用滑鼠點開（焦點被放到第一項）：面板不出現', async () => {
      await create();
      pressPointer();
      button(fixture, 'a').focus();
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('用滑鼠點開，就算瀏覽器畫了焦點框（Safari）：面板也不出現', async () => {
      await create();
      const original = Element.prototype.matches;
      spyOn(Element.prototype, 'matches').and.callFake(function (this: Element, selector: string) {
        return selector === ':focus-visible' ? true : original.call(this, selector);
      });
      pressPointer();
      button(fixture, 'a').focus();
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('用滑鼠點開後按方向鍵往下：出現下一項的說明', async () => {
      await create();
      pressPointer();
      button(fixture, 'a').focus();
      fixture.detectChanges();
      button(fixture, 'a').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      expect(document.activeElement).toBe(button(fixture, 'b'));
      expect(panel()!.querySelector('.am-details__title')!.textContent!.trim()).toBe('項目 B');
    });

    it('用鍵盤移到沒有 details 的項目：面板收起來', async () => {
      await create();
      pressKey();
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
