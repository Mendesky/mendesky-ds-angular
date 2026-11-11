import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CollapsibleAppearance, CollapsibleChevronPosition, CollapsibleComponent, CollapsibleHeadingLevel,
} from './collapsible.component';

/**
 * app-collapsible 契約（2026-11-11，原型定稿 https://claude.ai/artifact/J5BbpZKEeWVoQVqeaHCHf5 方案二）：
 * - 標頭三區：前置區 | 標題按鈕 | 尾端區。只有標題按鈕會開合；前置、尾端在按鈕外面。
 * - 標題按鈕是原生 button（type="button"），aria-expanded 標開合，aria-controls 指向內容區 id；id 每個元件不同。
 * - 收合時內容區的內層加 inert；展開時拿掉。
 * - 箭頭預設是按鈕的第一個元素，chevronPosition="end" 時是最後一個。
 * - 外觀預設 section；card、accent 各有 host class。顏色、焦點框、圓角從真的 computed style 讀。
 * - 停用用 aria-disabled，按鈕還能聚焦；點了不開合、不發事件。
 * - headingLevel 有值時，按鈕外面一層 role="heading" aria-level；沒值不包。
 * - expanded 可以 [(expanded)] 雙向綁定，也可以不綁、元件自己記。
 * - host 不留原生 title 屬性，免得整個區塊滑過都跳瀏覽器提示。
 * 全部從真的 DOM 查，不看元件內部狀態。
 */
@Component({
  standalone: true,
  imports: [CollapsibleComponent],
  template: `
    <div style="width:480px">
      <app-collapsible data-testid="c1" title="第一段" [(expanded)]="open" [appearance]="appearance"
        [chevronPosition]="chevron" [disabled]="disabled" [headingLevel]="level"
        (expandedChange)="changes.push($event)">
        <button collapsibleLeading type="button" data-testid="lead">選取</button>
        <span collapsiblePrefix data-testid="prefix">01</span>
        <span collapsibleMeta data-testid="meta">3 項</span>
        <span collapsibleSummary data-testid="summary">摘要文字</span>
        <button collapsibleTrailing type="button" data-testid="trail">更多</button>
        <button type="button" data-testid="inside">內容裡的按鈕</button>
      </app-collapsible>
      <app-collapsible data-testid="c2" title="第二段">
        <p>第二段的內容</p>
      </app-collapsible>
    </div>
  `,
})
class HostComponent {
  open = false;
  appearance: CollapsibleAppearance = 'section';
  chevron: CollapsibleChevronPosition = 'start';
  disabled = false;
  level: CollapsibleHeadingLevel | null = null;
  changes: boolean[] = [];
}

/** WCAG 相對亮度與對比 */
function luminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

describe('CollapsibleComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  const q = <T extends HTMLElement = HTMLElement>(sel: string) => el.querySelector<T>(sel)!;
  const comp = (id = 'c1') => q(`[data-testid="${id}"]`);
  const trigger = (id = 'c1') => comp(id).querySelector<HTMLButtonElement>('.collapsible__trigger')!;
  const header = (id = 'c1') => comp(id).querySelector<HTMLElement>('.collapsible__header')!;
  const panel = (id = 'c1') => comp(id).querySelector<HTMLElement>('.collapsible__panel')!;
  const inner = (id = 'c1') => panel(id).querySelector<HTMLElement>('.ds-collapse__inner')!;
  const set = (patch: Partial<HostComponent>) => {
    Object.assign(host, patch);
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    document.body.appendChild(el);
    fixture.detectChanges();
  });

  afterEach(() => el.remove());

  describe('標題按鈕與 ARIA', () => {
    it('標題按鈕是原生 type="button" 的 button，念得出標題', () => {
      const btn = trigger();
      expect(btn.tagName).toBe('BUTTON');
      expect(btn.getAttribute('type')).toBe('button');
      expect(btn.textContent).toContain('第一段');
    });

    it('aria-expanded 一開始是 false，aria-controls 指向內容區的 id', () => {
      const btn = trigger();
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      const id = btn.getAttribute('aria-controls')!;
      expect(id).toBeTruthy();
      expect(panel().id).toBe(id);
      expect(document.getElementById(id)).toBe(panel());
    });

    it('兩個元件的按鈕 id、內容區 id 都不重複', () => {
      const ids = [trigger('c1').id, trigger('c2').id, panel('c1').id, panel('c2').id];
      expect(ids.every(Boolean)).toBeTrue();
      expect(new Set(ids).size).toBe(4);
    });

    it('host 不留原生 title 屬性', () => {
      expect(comp().hasAttribute('title')).toBeFalse();
      expect(comp('c2').hasAttribute('title')).toBeFalse();
    });

    it('按 Enter、空白鍵時元件不攔下預設動作（交給原生 button 觸發點擊）', () => {
      for (const key of ['Enter', ' ']) {
        const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        trigger().dispatchEvent(ev);
        expect(ev.defaultPrevented).withContext(key).toBeFalse();
      }
    });
  });

  describe('開合', () => {
    it('點標題按鈕：展開、aria-expanded 變 true、發 expandedChange(true)；雙向綁定的值跟著變', () => {
      trigger().click();
      fixture.detectChanges();
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
      expect(host.changes).toEqual([true]);
      expect(host.open).toBeTrue();
      expect(comp().classList).toContain('collapsible--expanded');
      expect(panel().classList).toContain('ds-collapse--expanded');
    });

    it('再點一次收合，發 expandedChange(false)', () => {
      trigger().click();
      fixture.detectChanges();
      trigger().click();
      fixture.detectChanges();
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(host.changes).toEqual([true, false]);
      expect(host.open).toBeFalse();
    });

    it('沒綁 expanded 的元件自己記開合', () => {
      trigger('c2').click();
      fixture.detectChanges();
      expect(trigger('c2').getAttribute('aria-expanded')).toBe('true');
      trigger('c2').click();
      fixture.detectChanges();
      expect(trigger('c2').getAttribute('aria-expanded')).toBe('false');
    });

    it('頁面改 expanded：展開、收合都跟著變，不發 expandedChange', () => {
      set({ open: true });
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
      set({ open: false });
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(host.changes).toEqual([]);
    });
  });

  describe('收合時的內容', () => {
    it('收合時內層有 inert，內容裡的按鈕聚焦不到；展開後 inert 拿掉、聚焦得到', () => {
      const inside = q<HTMLButtonElement>('[data-testid="inside"]');
      expect(inner().hasAttribute('inert')).toBeTrue();
      inside.focus();
      expect(document.activeElement).not.toBe(inside);

      set({ open: true });
      expect(inner().hasAttribute('inert')).toBeFalse();
      inside.focus();
      expect(document.activeElement).toBe(inside);
    });

    it('收合時內容還在 DOM 裡', () => {
      expect(panel().contains(q('[data-testid="inside"]'))).toBeTrue();
    });
  });

  describe('三區', () => {
    it('前置、尾端在按鈕外面；前綴、標題後資訊、摘要在按鈕裡面', () => {
      const btn = trigger();
      expect(btn.contains(q('[data-testid="lead"]'))).toBeFalse();
      expect(btn.contains(q('[data-testid="trail"]'))).toBeFalse();
      expect(header().contains(q('[data-testid="lead"]'))).toBeTrue();
      expect(header().contains(q('[data-testid="trail"]'))).toBeTrue();
      expect(btn.contains(q('[data-testid="prefix"]'))).toBeTrue();
      expect(btn.contains(q('[data-testid="meta"]'))).toBeTrue();
      expect(btn.contains(q('[data-testid="summary"]'))).toBeTrue();
    });

    it('順序：前置 → 按鈕 → 尾端；按鈕裡 前綴 → 標題 → 標題後資訊 → 摘要', () => {
      const order = (a: Element, b: Element) =>
        !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      expect(order(q('[data-testid="lead"]'), trigger())).toBeTrue();
      expect(order(trigger(), q('[data-testid="trail"]'))).toBeTrue();
      const title = trigger().querySelector('.collapsible__title')!;
      expect(order(q('[data-testid="prefix"]'), title)).toBeTrue();
      expect(order(title, q('[data-testid="meta"]'))).toBeTrue();
      expect(order(q('[data-testid="meta"]'), q('[data-testid="summary"]'))).toBeTrue();
    });

    it('點前置、尾端不開合、不發事件', () => {
      q<HTMLButtonElement>('[data-testid="lead"]').click();
      q<HTMLButtonElement>('[data-testid="trail"]').click();
      fixture.detectChanges();
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(host.changes).toEqual([]);
    });

    it('沒放東西的區塊不佔位（display: none）', () => {
      const c2 = comp('c2');
      for (const cls of ['leading', 'trailing', 'prefix', 'meta', 'summary']) {
        const part = c2.querySelector<HTMLElement>(`.collapsible__${cls}`)!;
        expect(getComputedStyle(part).display).withContext(cls).toBe('none');
      }
    });
  });

  describe('箭頭', () => {
    it('預設是按鈕的第一個元素，圖示是 DownArrow、對報讀軟體隱藏', () => {
      const first = trigger().firstElementChild as HTMLElement;
      expect(first.classList).toContain('collapsible__chevron');
      expect(first.getAttribute('aria-hidden')).toBe('true');
      expect(trigger().querySelectorAll('.collapsible__chevron').length).toBe(1);
    });

    it('chevronPosition="end" 時是按鈕的最後一個元素', () => {
      set({ chevron: 'end' });
      const last = trigger().lastElementChild as HTMLElement;
      expect(last.classList).toContain('collapsible__chevron');
      expect(trigger().querySelectorAll('.collapsible__chevron').length).toBe(1);
    });

    it('展開時箭頭轉 180 度（朝上），收合時不轉', () => {
      const chevron = () => trigger().querySelector<HTMLElement>('.collapsible__chevron')!;
      chevron().style.transition = 'none';
      expect(getComputedStyle(chevron()).transform).toBe('none');
      set({ open: true });
      chevron().style.transition = 'none';
      // rotate(180deg) 的矩陣是 matrix(-1, 0, 0, -1, 0, 0)（浮點數可能帶極小的誤差）
      const m = getComputedStyle(chevron()).transform.match(/-?[\d.e-]+/g)!.map(Number);
      expect(m[0]).toBeCloseTo(-1, 5);
      expect(m[3]).toBeCloseTo(-1, 5);
    });
  });

  describe('外觀', () => {
    it('預設是 section：整條灰底 #e7e7e7、標題粗體、最低 40px；按鈕直角', () => {
      expect(comp().classList).toContain('collapsible--section');
      const s = getComputedStyle(header());
      expect(s.backgroundColor).toBe('rgb(231, 231, 231)');
      expect(header().getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
      expect(getComputedStyle(trigger().querySelector('.collapsible__title')!).fontWeight).toBe('700');
      expect(getComputedStyle(trigger()).borderTopLeftRadius).toBe('0px');
    });

    it('card：沒有底色、標題中等粗、按鈕圓角 7px', () => {
      set({ appearance: 'card' });
      expect(comp().classList).toContain('collapsible--card');
      expect(getComputedStyle(header()).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(trigger().querySelector('.collapsible__title')!).fontWeight).toBe('500');
      expect(getComputedStyle(trigger()).borderTopLeftRadius).toBe('7px');
    });

    it('accent：底色 #538227，標題與箭頭白字，對比至少 4.5:1；按鈕圓角 7px', () => {
      set({ appearance: 'accent' });
      expect(comp().classList).toContain('collapsible--accent');
      const bg = getComputedStyle(header()).backgroundColor;
      expect(bg).toBe('rgb(83, 130, 39)');
      const title = getComputedStyle(trigger().querySelector('.collapsible__title')!).color;
      const chevron = getComputedStyle(trigger().querySelector('.collapsible__chevron')!).color;
      expect(title).toBe('rgb(255, 255, 255)');
      expect(chevron).toBe('rgb(255, 255, 255)');
      expect(contrast(title, bg)).toBeGreaterThanOrEqual(4.5);
      expect(getComputedStyle(trigger()).borderTopLeftRadius).toBe('7px');
    });
  });

  describe('焦點框', () => {
    const focusVisible = () => {
      trigger().focus();
      expect(trigger().matches(':focus-visible')).withContext('程式聚焦要符合 :focus-visible 才能讀到樣式').toBeTrue();
      return getComputedStyle(trigger());
    };

    it('section、card：2px 藍框往內縮 2px，內側一圈 4px 白（雙層框）', () => {
      for (const appearance of ['section', 'card'] as const) {
        set({ appearance });
        const s = focusVisible();
        expect(s.outlineStyle).withContext(appearance).toBe('solid');
        expect(s.outlineWidth).withContext(appearance).toBe('2px');
        expect(s.outlineOffset).withContext(appearance).toBe('-2px');
        expect(s.outlineColor).withContext(appearance).toBe('rgb(58, 156, 205)');
        expect(s.boxShadow).withContext(appearance).toContain('rgb(255, 255, 255)');
        expect(s.boxShadow).withContext(appearance).toContain('inset');
        expect(contrast(s.outlineColor, 'rgb(255, 255, 255)')).toBeGreaterThanOrEqual(3);
        trigger().blur();
      }
    });

    it('accent：單層白框，沒有內側白圈', () => {
      set({ appearance: 'accent' });
      const s = focusVisible();
      expect(s.outlineColor).toBe('rgb(255, 255, 255)');
      expect(s.boxShadow).toBe('none');
      expect(contrast(s.outlineColor, getComputedStyle(header()).backgroundColor)).toBeGreaterThanOrEqual(3);
    });
  });

  describe('停用', () => {
    beforeEach(() => set({ disabled: true }));

    it('aria-disabled="true"，不用原生 disabled，按鈕還聚焦得到', () => {
      expect(trigger().getAttribute('aria-disabled')).toBe('true');
      expect(trigger().disabled).toBeFalse();
      trigger().focus();
      expect(document.activeElement).toBe(trigger());
    });

    it('點了不開合、不發事件', () => {
      trigger().click();
      fixture.detectChanges();
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(host.changes).toEqual([]);
    });

    it('已經展開的停用區塊維持展開', () => {
      set({ open: true });
      trigger().click();
      fixture.detectChanges();
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
    });

    it('標題與箭頭變成停用的灰 #939393', () => {
      expect(getComputedStyle(trigger().querySelector('.collapsible__title')!).color).toBe('rgb(147, 147, 147)');
      expect(getComputedStyle(trigger().querySelector('.collapsible__chevron')!).color).toBe('rgb(147, 147, 147)');
    });

    it('accent 停用時底色換成區段的灰 #e7e7e7，跟停用的按鈕一樣', () => {
      set({ appearance: 'accent' });
      expect(getComputedStyle(header()).backgroundColor).toBe('rgb(231, 231, 231)');
      expect(getComputedStyle(trigger().querySelector('.collapsible__title')!).color).toBe('rgb(147, 147, 147)');
    });
  });

  describe('標題層級', () => {
    it('沒給 headingLevel：按鈕外面沒有 role="heading"', () => {
      expect(comp().querySelector('[role="heading"]')).toBeNull();
    });

    it('headingLevel=3：按鈕外面一層 role="heading" aria-level="3"', () => {
      set({ level: 3 });
      const heading = comp().querySelector('[role="heading"]')!;
      expect(heading).not.toBeNull();
      expect(heading.getAttribute('aria-level')).toBe('3');
      expect(heading.contains(trigger())).toBeTrue();
      expect(heading.contains(q('[data-testid="lead"]'))).toBeFalse();
      expect(heading.contains(q('[data-testid="trail"]'))).toBeFalse();
    });
  });
});
