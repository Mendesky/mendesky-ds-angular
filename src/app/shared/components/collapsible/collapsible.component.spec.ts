import { Component } from '@angular/core';
import { IconBtnComponent } from '../icon-btn/icon-btn.component';
import { IconComponent } from '../icon/icon.component';
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
 * - 審查修正（2026-11-12，原型「審查修正」分頁）：摘要固定一行加刪節號、空間不夠時最先縮；
 *   金額放數值（collapsibleValue），不縮不換行，標題先截；綠色停用時焦點框回到藍白雙層；
 *   卡片、綠色的標頭跟著卡片圓角；卡片裡的 SectionBtn 滑過比標頭深一階。
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
        <span collapsibleValue data-testid="value">NT$ 1,234,567</span>
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

/** 尾端放 app-icon-btn：綠色外觀要把圖示配成看得見的顏色；卡片外觀滑過要跟標頭分得開 */
@Component({
  standalone: true,
  imports: [CollapsibleComponent, IconBtnComponent, IconComponent],
  template: `
    <app-collapsible [appearance]="appearance" title="段落一" [disabled]="disabled">
      <app-icon-btn collapsibleTrailing size="16" propClass="SectionBtn" ariaLabel="更多操作">
        <app-icon name="More" size="16"></app-icon>
      </app-icon-btn>
    </app-collapsible>
  `,
})
class AccentActionsHostComponent {
  appearance: CollapsibleAppearance = 'accent';
  disabled = false;
}

/** 空間不夠時：摘要、數值、標題誰先讓 */
@Component({
  standalone: true,
  imports: [CollapsibleComponent],
  template: `
    <div [style.width.px]="width">
      <app-collapsible data-testid="fit" appearance="card" [title]="title" [chevronPosition]="chevron">
        @if (labels) {
          <span collapsibleMeta>主</span>
        }
        @if (labels) {
          <span collapsibleMeta>未成交</span>
        }
        @if (preview) {
          <span collapsibleSummary data-testid="fit-summary">{{ preview }}</span>
        }
        @if (amount) {
          <span collapsibleValue data-testid="fit-value">{{ amount }}</span>
        }
      </app-collapsible>
    </div>
  `,
})
class FitHostComponent {
  width = 240;
  title = '範例國際投資控股股份有限公司';
  labels = true;
  preview = '';
  amount = 'NT$ 1,284,000';
  chevron: CollapsibleChevronPosition = 'start';
}

/**
 * 讀樣式表裡的規則：Karma 沒辦法真的滑過、也切不了系統的「減少動態」與強制色彩，
 * 所以找出「拿掉 :hover 後選得到這個元素」或「在這個 @media 裡選得到這個元素」的規則。
 * 同一個元素中了好幾條時，取選擇器最具體的那條（id、class、屬性、偽類各算一分）。
 */
function specificity(selector: string): number {
  const ids = (selector.match(/#[\w-]+/g) ?? []).length;
  const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) ?? []).length;
  return ids * 100 + classes;
}
function matchingRules(target: Element, opts: { hover?: boolean; media?: string }): CSSStyleRule[] {
  const hits: { rule: CSSStyleRule; score: number }[] = [];
  const visit = (rules: CSSRuleList, inMedia: boolean) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule) {
        if (opts.media && rule.media.mediaText.includes(opts.media)) visit(rule.cssRules, true);
        continue;
      }
      if (!(rule instanceof CSSStyleRule) || inMedia !== !!opts.media) continue;
      for (const sel of rule.selectorText.split(',')) {
        if (!!opts.hover !== sel.includes(':hover')) continue;
        const plain = sel.replace(/:hover/g, '').trim();
        try {
          if (target.matches(plain)) hits.push({ rule, score: specificity(plain) });
        } catch { /* 瀏覽器不認得的選擇器 */ }
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try { visit(sheet.cssRules, false); } catch { /* 跨來源的樣式表讀不到 */ }
  }
  return hits.sort((a, b) => a.score - b.score).map(h => h.rule);
}
/** 這個元素在條件下會拿到的某個屬性（最具體、宣告了這個屬性的那條） */
function declared(target: Element, prop: string, opts: { hover?: boolean; media?: string }): string {
  const rules = matchingRules(target, opts).filter(r => r.style.getPropertyValue(prop) !== '');
  return rules.length ? rules[rules.length - 1].style.getPropertyValue(prop).trim() : '';
}
/** 把宣告的底色（可能是 var(--x, #fff) 或 none）換成瀏覽器算出的顏色 */
function resolveBackground(target: Element, value: string): string {
  const probe = document.createElement('span');
  probe.style.background = value || 'none';
  target.parentElement!.appendChild(probe);
  const color = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return color;
}

/** 收合區塊裡再放收合區塊（例：區段裡的一張張卡片）：外層的外觀、開合、停用都不能套到內層 */
@Component({
  standalone: true,
  imports: [CollapsibleComponent],
  template: `
    <div style="width:480px">
      <app-collapsible data-testid="outer" title="外層" [appearance]="outerAppearance"
        [disabled]="outerDisabled" [expanded]="true">
        <app-collapsible data-testid="inner" appearance="card" title="內層" [expanded]="false">
          <p>內層的內容</p>
        </app-collapsible>
      </app-collapsible>
    </div>
  `,
})
class NestedHostComponent {
  outerAppearance: CollapsibleAppearance = 'section';
  outerDisabled = false;
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
      expect(btn.contains(q('[data-testid="value"]'))).withContext('數值在按鈕裡').toBeTrue();
      expect(q('[data-testid="value"]').parentElement!.classList).toContain('collapsible__value');
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
      expect(order(q('[data-testid="summary"]'), q('[data-testid="value"]'))).withContext('摘要 → 數值').toBeTrue();
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
      for (const cls of ['leading', 'trailing', 'prefix', 'meta', 'summary', 'value']) {
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

    // 卡片沒有裁切超出的部分時，直角的底色（綠色、滑過的淺灰）會從卡片圓角凸出去
    it('card、accent：標頭跟著卡片圓角，收起來四角 7px，展開時上面 7px、下面直角；section 直角', () => {
      const radii = () => {
        const s = getComputedStyle(header());
        return [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius];
      };
      for (const appearance of ['card', 'accent'] as const) {
        set({ appearance, open: false });
        expect(radii()).withContext(`${appearance} 收起來`).toEqual(['7px', '7px', '7px', '7px']);
        set({ open: true });
        expect(radii()).withContext(`${appearance} 展開`).toEqual(['7px', '7px', '0px', '0px']);
      }
      set({ appearance: 'section', open: false });
      expect(radii()).withContext('section').toEqual(['0px', '0px', '0px', '0px']);
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

    // 白框放在灰底上只有 1.24:1，看不出停在哪
    it('accent 停用時焦點框改回藍白雙層，不留白框在灰底上', () => {
      set({ appearance: 'accent' });
      trigger().focus();
      expect(trigger().matches(':focus-visible')).toBeTrue();
      const s = getComputedStyle(trigger());
      expect(s.outlineColor).toBe('rgb(58, 156, 205)');
      expect(s.boxShadow).toContain('rgb(255, 255, 255)');
      expect(s.boxShadow).toContain('inset');
      expect(contrast(s.outlineColor, 'rgb(255, 255, 255)')).toBeGreaterThanOrEqual(3);
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

  describe('綠色外觀尾端的 app-icon-btn', () => {
    let f: ComponentFixture<AccentActionsHostComponent>;
    const btn = () => f.nativeElement.querySelector('.icon-btn') as HTMLElement;
    const hdr = () => f.nativeElement.querySelector('.collapsible__header') as HTMLElement;

    beforeEach(() => {
      f = TestBed.createComponent(AccentActionsHostComponent);
      document.body.appendChild(f.nativeElement);
      f.detectChanges();
    });

    afterEach(() => f.nativeElement.remove());

    it('一般：白色圖示、透明底，對綠底至少 3:1', () => {
      const s = getComputedStyle(btn());
      expect(s.color).toBe('rgb(255, 255, 255)');
      expect(s.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(contrast(s.color, getComputedStyle(hdr()).backgroundColor)).toBeGreaterThanOrEqual(3);
    });

    it('停用：底色變灰，圖示改成內文灰，對灰底至少 3:1（不留白色圖示在灰底上）', () => {
      f.componentInstance.disabled = true;
      f.detectChanges();
      const s = getComputedStyle(btn());
      expect(s.color).not.toBe('rgb(255, 255, 255)');
      expect(contrast(s.color, getComputedStyle(hdr()).backgroundColor)).toBeGreaterThanOrEqual(3);
    });

    it('停用：圖示按鈕的焦點框回到藍色，不留白框在灰底上', () => {
      f.componentInstance.disabled = true;
      f.detectChanges();
      btn().focus();
      expect(btn().matches(':focus-visible')).toBeTrue();
      expect(getComputedStyle(btn()).outlineColor).toBe('rgb(58, 156, 205)');
    });

    // 卡片標頭滑過是淺灰；SectionBtn 預設滑過也是同一個淺灰，滑到按鈕上就看不出按鈕的範圍
    it('卡片：滑到 SectionBtn 上時，按鈕底色比標頭滑過深一階', () => {
      f.componentInstance.appearance = 'card';
      f.detectChanges();
      const headerHover = resolveBackground(hdr(), declared(hdr(), 'background', { hover: true }));
      const btnHover = resolveBackground(btn(), declared(btn(), 'background', { hover: true }));
      expect(headerHover).withContext('標頭有滑過的底色').not.toBe('rgba(0, 0, 0, 0)');
      expect(btnHover).not.toBe(headerHover);
      expect(luminance(btnHover)).toBeLessThan(luminance(headerHover));
    });
  });

  describe('滑過', () => {
    const hoverBg = () => resolveBackground(header(), declared(header(), 'background', { hover: true }));
    // 換外觀時底色有 150ms 轉場；關掉轉場才讀得到最後的顏色
    const restBg = () => {
      header().style.transition = 'none';
      return getComputedStyle(header()).backgroundColor;
    };

    it('section 滑過變深；card 從無底色變淺灰；accent 變深綠', () => {
      set({ appearance: 'section' });
      expect(luminance(hoverBg())).withContext('section').toBeLessThan(luminance(restBg()));
      set({ appearance: 'card' });
      expect(restBg()).toBe('rgba(0, 0, 0, 0)');
      expect(hoverBg()).withContext('card').not.toBe('rgba(0, 0, 0, 0)');
      set({ appearance: 'accent' });
      expect(luminance(hoverBg())).withContext('accent').toBeLessThan(luminance(restBg()));
    });

    it('停用時滑過不變色（三種外觀都是）', () => {
      for (const appearance of ['section', 'card', 'accent'] as const) {
        set({ appearance, disabled: true });
        expect(hoverBg()).withContext(appearance).toBe(restBg());
      }
    });
  });

  describe('減少動態與強制色彩', () => {
    it('減少動態：箭頭與標頭底色不轉場', () => {
      const chevron = trigger().querySelector('.collapsible__chevron')!;
      for (const [name, part] of [['標頭', header()], ['箭頭', chevron]] as const) {
        expect(declared(part, 'transition-property', { media: 'prefers-reduced-motion: reduce' }))
          .withContext(name).toBe('none');
      }
    });

    it('強制色彩：停用的標題與箭頭用系統的停用字色 GrayText', () => {
      set({ disabled: true });
      for (const cls of ['.collapsible__title', '.collapsible__chevron']) {
        const part = trigger().querySelector(cls)!;
        expect(declared(part, 'color', { media: 'forced-colors: active' }).toLowerCase()).withContext(cls).toBe('graytext');
      }
    });
  });

  describe('空間不夠時：摘要、數值、標題誰先讓', () => {
    let f: ComponentFixture<FitHostComponent>;
    const root = () => f.nativeElement as HTMLElement;
    const part = (cls: string) => root().querySelector<HTMLElement>(`[data-testid="fit"] > .collapsible__header ${cls}`)!;
    const setFit = (patch: Partial<FitHostComponent>) => {
      Object.assign(f.componentInstance, patch);
      f.detectChanges();
    };
    const truncated = (e: HTMLElement) => e.scrollWidth > e.clientWidth + 1;
    const oneLine = (e: HTMLElement) =>
      e.getBoundingClientRect().height < parseFloat(getComputedStyle(e).fontSize) * 2;

    beforeEach(() => {
      f = TestBed.createComponent(FitHostComponent);
      document.body.appendChild(f.nativeElement);
      f.detectChanges();
    });

    afterEach(() => f.nativeElement.remove());

    it('數值放金額：窄到放不下時金額完整、一行，標題用刪節號截', () => {
      const value = root().querySelector<HTMLElement>('[data-testid="fit-value"]')!;
      expect(part('.collapsible__trigger').contains(value)).withContext('金額在標題按鈕裡').toBeTrue();
      expect(truncated(part('.collapsible__value'))).withContext('金額沒被截').toBeFalse();
      expect(oneLine(value)).withContext('金額一行').toBeTrue();
      expect(truncated(part('.collapsible__title'))).withContext('標題被截').toBeTrue();
      expect(getComputedStyle(part('.collapsible__title')).textOverflow).toBe('ellipsis');
    });

    it('摘要放一行預覽：一行、放不下用刪節號，短標題完整', () => {
      setFit({ width: 360, title: '記帳服務', labels: false, amount: '', preview: '每月記帳、營業稅申報、年度結算申報、暫繳與扣繳申報' });
      const summary = part('.collapsible__summary');
      expect(getComputedStyle(summary).whiteSpace).toBe('nowrap');
      expect(getComputedStyle(summary).textOverflow).toBe('ellipsis');
      expect(truncated(summary)).withContext('預覽被截').toBeTrue();
      expect(oneLine(summary)).withContext('預覽一行').toBeTrue();
      expect(truncated(part('.collapsible__title'))).withContext('標題沒被截').toBeFalse();
    });

    it('預覽和金額都放：預覽先縮，金額與短標題都完整', () => {
      setFit({ width: 360, title: '記帳服務', labels: false, amount: 'NT$ 36,000', preview: '每月記帳、營業稅申報、年度結算申報' });
      expect(truncated(part('.collapsible__summary'))).withContext('預覽被截').toBeTrue();
      expect(truncated(part('.collapsible__value'))).withContext('金額沒被截').toBeFalse();
      expect(truncated(part('.collapsible__title'))).withContext('標題沒被截').toBeFalse();
    });

    it('寬度夠、只放數值：數值靠右；什麼都沒放、箭頭在右時，箭頭靠右', () => {
      setFit({ width: 480, title: '記帳服務', labels: false, preview: '' });
      const trig = part('.collapsible__trigger');
      const contentRight = () => trig.getBoundingClientRect().right - parseFloat(getComputedStyle(trig).paddingRight);
      expect(part('.collapsible__value').getBoundingClientRect().right).toBeCloseTo(contentRight(), 0);
      setFit({ amount: '', chevron: 'end' });
      expect(part('.collapsible__chevron').getBoundingClientRect().right).toBeCloseTo(contentRight(), 0);
    });
  });

  // 樣式只能管到自己的標頭。寫成「外層 host 底下的所有標頭」的話，裡面那個收合區塊的標頭也會中
  describe('巢狀：收合區塊裡再放收合區塊', () => {
    let f: ComponentFixture<NestedHostComponent>;
    const own = (id: string, cls: string) =>
      (f.nativeElement as HTMLElement).querySelector(`[data-testid="${id}"]`)!
        .querySelector<HTMLElement>(`:scope > .collapsible__header ${cls}`)!;
    const innerHeader = () =>
      (f.nativeElement as HTMLElement).querySelector('[data-testid="inner"] > .collapsible__header') as HTMLElement;
    const setOuter = (patch: Partial<NestedHostComponent>) => {
      Object.assign(f.componentInstance, patch);
      f.detectChanges();
    };

    beforeEach(() => {
      f = TestBed.createComponent(NestedHostComponent);
      document.body.appendChild(f.nativeElement);
      f.detectChanges();
    });

    afterEach(() => f.nativeElement.remove());

    it('外層是區段：內層卡片的標頭沒有灰底、沒有底線，標題中等粗、按鈕留卡片的內距', () => {
      const s = getComputedStyle(innerHeader());
      expect(s.backgroundColor).withContext('不吃外層的灰底').toBe('rgba(0, 0, 0, 0)');
      expect(s.borderBottomWidth).withContext('不吃外層的底線').toBe('0px');
      expect(getComputedStyle(own('inner', '.collapsible__title')).fontWeight).toBe('500');
      expect(getComputedStyle(own('inner', '.collapsible__trigger')).paddingTop).toBe('8px');
    });

    it('外層展開、內層收起：內層箭頭朝下，不跟著外層轉', () => {
      own('outer', '.collapsible__chevron').style.transition = 'none';
      own('inner', '.collapsible__chevron').style.transition = 'none';
      expect(getComputedStyle(own('outer', '.collapsible__chevron')).transform).not.toBe('none');
      expect(getComputedStyle(own('inner', '.collapsible__chevron')).transform).toBe('none');
    });

    // 顏色跟「外層還是一般區段時的內層」比：色票有沒有載入，預設值會不同，不寫死色碼
    it('外層是綠色：內層標題、箭頭不變白字', () => {
      const title = getComputedStyle(own('inner', '.collapsible__title')).color;
      const chevron = getComputedStyle(own('inner', '.collapsible__chevron')).color;
      setOuter({ outerAppearance: 'accent' });
      expect(getComputedStyle(own('outer', '.collapsible__title')).color).withContext('外層確實變白字').toBe('rgb(255, 255, 255)');
      expect(getComputedStyle(own('inner', '.collapsible__title')).color).toBe(title);
      expect(getComputedStyle(own('inner', '.collapsible__chevron')).color).toBe(chevron);
    });

    it('外層停用：內層標題不變停用灰，游標仍是可以點的手指', () => {
      const title = getComputedStyle(own('inner', '.collapsible__title')).color;
      setOuter({ outerDisabled: true });
      expect(getComputedStyle(own('outer', '.collapsible__title')).color).withContext('外層確實變停用灰').not.toBe(title);
      expect(getComputedStyle(own('inner', '.collapsible__title')).color).toBe(title);
      expect(getComputedStyle(own('inner', '.collapsible__trigger')).cursor).toBe('pointer');
    });
  });
});
