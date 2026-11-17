import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SideNavComponent, SideNavGroup, SideNavItem, SideNavMode } from './side-nav.component';

/**
 * app-side-nav：系統主要導覽，三種寬度（展開／窄欄／藏起來）。
 * 項目是連結；目前頁 aria-current；藏起來整條 inert；窄欄名稱靠報讀名稱與提示。
 */
const GROUPS: SideNavGroup[] = [
  {
    id: 'main',
    heading: '常用',
    items: [
      { id: 'home', label: '首頁', icon: 'Dashboard', href: '/home' },
      { id: 'reports', label: '報表', icon: 'Briefcase', href: '/reports' },
    ],
  },
  {
    id: 'admin',
    heading: '管理',
    items: [{ id: 'settings', label: '設定', icon: 'Assign', href: '/settings' }],
  },
];

const cleanups: Array<() => void> = [];
const onTestDone = (fn: () => void) => cleanups.push(fn);

/**
 * 在 document 上記下「元件處理完之後」點擊有沒有被擋（document 的冒泡監聽比連結上的晚跑），
 * 記完再自己擋掉，瀏覽器才不會真的換頁或開新分頁。
 */
const recordPreventedAfterComponent = (): boolean[] => {
  const seen: boolean[] = [];
  const listener = (e: Event) => { seen.push(e.defaultPrevented); e.preventDefault(); };
  document.addEventListener('click', listener);
  onTestDone(() => document.removeEventListener('click', listener));
  return seen;
};

/** 關掉轉場：換版面或滑過時顏色有 150ms 轉場，量到的會是起點 */
const disableTransitions = () => {
  const style = document.createElement('style');
  style.textContent = '.side-nav, .side-nav * { transition: none !important; }';
  document.head.appendChild(style);
  onTestDone(() => style.remove());
};

/** 元件樣式表裡所有 side-nav 的規則（含 @media 裡的），照原本的順序 */
const sideNavRules = (): Array<{ rule: CSSStyleRule; media: string | null }> => {
  const out: Array<{ rule: CSSStyleRule; media: string | null }> = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRule[];
    try { rules = Array.from(sheet.cssRules); } catch { continue; }
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('side-nav')) out.push({ rule, media: null });
      if (rule instanceof CSSMediaRule) {
        for (const inner of Array.from(rule.cssRules)) {
          if (inner instanceof CSSStyleRule && inner.selectorText.includes('side-nav')) out.push({ rule: inner, media: rule.media.mediaText });
        }
      }
    }
  }
  return out;
};

/**
 * Karma 不能真的把滑鼠移上去、也不能換成觸控裝置。把元件的規則照原順序複製一份接在後面：
 * `:hover` 換成 `.sn-hover` class；`media` 給的那組 @media 規則拆掉外殼直接生效。
 * 這樣量到的是規則疊起來之後真正的顏色與高度，疊放順序錯了也抓得到。
 */
const applySimulated = (opts: { hover?: boolean; media?: string }) => {
  const css = sideNavRules()
    .filter(r => r.media === null || (opts.media !== undefined && r.media === opts.media))
    .map(r => opts.hover ? r.rule.cssText.replace(/:hover/g, '.sn-hover') : r.rule.cssText);
  const style = document.createElement('style');
  style.textContent = css.join('\n');
  document.head.appendChild(style);
  onTestDone(() => style.remove());
};

describe('SideNavComponent', () => {
  let fixture: ComponentFixture<SideNavComponent>;
  const host = () => fixture.nativeElement as HTMLElement;
  const links = () => Array.from(host().querySelectorAll('a')) as HTMLAnchorElement[];
  const link = (id: string) => links().find(a => a.getAttribute('href') === '/' + id)!;
  const tooltips = () => document.body.querySelectorAll('app-tooltip-portal');

  const render = (inputs: { groups?: SideNavGroup[]; mode?: SideNavMode; currentId?: string | null }) => {
    for (const [key, val] of Object.entries({ groups: GROUPS, ...inputs })) fixture.componentRef.setInput(key, val);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SideNavComponent] }).compileComponents();
    fixture = TestBed.createComponent(SideNavComponent);
    document.body.appendChild(host());
  });

  afterEach(() => {
    host().remove();
    tooltips().forEach(t => t.remove());
    cleanups.splice(0).forEach(fn => fn());
  });

  it('1. 藏起來：整條 inert、寬 0，連結都不能聚焦', () => {
    render({ mode: 'hidden' });
    expect(host().hasAttribute('inert')).toBeTrue();
    expect(host().getBoundingClientRect().width).toBe(0);
    for (const a of links()) {
      a.focus();
      expect(document.activeElement).not.toBe(a);
    }
  });

  it('2. 窄欄：每個連結的報讀名稱是項目名稱、看不到名稱文字；群組之間一條分隔線、沒有群組標題', () => {
    render({ mode: 'rail' });
    expect(host().hasAttribute('inert')).toBeFalse();
    expect(host().getBoundingClientRect().width).toBe(56);
    expect(links().map(a => a.getAttribute('aria-label'))).toEqual(['首頁', '報表', '設定']);
    expect(host().querySelectorAll('.side-nav__label').length).toBe(0);
    expect(host().querySelectorAll('.side-nav__heading').length).toBe(0);
    expect(host().querySelectorAll('.side-nav__sep').length).toBe(1);
    const groups = host().querySelectorAll('[role="group"]');
    expect(Array.from(groups).map(g => g.getAttribute('aria-label'))).toEqual(['常用', '管理']);
  });

  it('3. 展開：群組標題出現並當群組名稱；沒給標題的群組不包 group、不出現標題', () => {
    render({
      mode: 'expanded',
      groups: [...GROUPS, { id: 'misc', items: [{ id: 'help', label: '說明', icon: 'Dashboard', href: '/help' }] }],
    });
    expect(host().getBoundingClientRect().width).toBe(200);
    const headings = Array.from(host().querySelectorAll('.side-nav__heading'));
    expect(headings.map(h => h.textContent?.trim())).toEqual(['常用', '管理']);
    const groups = Array.from(host().querySelectorAll('[role="group"]'));
    expect(groups.length).toBe(2);
    groups.forEach((g, i) => expect(g.getAttribute('aria-labelledby')).toBe(headings[i].id));
    expect(host().querySelectorAll('.side-nav__sep').length).toBe(0);
    expect(link('help').getAttribute('aria-label')).toBeNull();
    expect(link('help').textContent?.trim()).toBe('說明');
    expect(host().querySelector('nav')?.getAttribute('aria-label')).toBe('主要導覽');
  });

  it('4. 目前頁：只有那一項 aria-current="page"；換頁後舊的拿掉', () => {
    render({ mode: 'expanded', currentId: 'reports' });
    expect(links().filter(a => a.getAttribute('aria-current') === 'page').map(a => a.getAttribute('href'))).toEqual(['/reports']);
    render({ currentId: 'settings' });
    expect(links().filter(a => a.getAttribute('aria-current') === 'page').map(a => a.getAttribute('href'))).toEqual(['/settings']);
  });

  it('5. 左鍵單擊送出換頁並擋預設；Ctrl、⌘、Shift、Alt 不送也不擋', () => {
    render({ mode: 'expanded' });
    const got: SideNavItem[] = [];
    fixture.componentInstance.navigate.subscribe(i => got.push(i));

    const plain = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    link('reports').dispatchEvent(plain);
    expect(plain.defaultPrevented).toBeTrue();
    expect(got.map(i => i.id)).toEqual(['reports']);

    const seen = recordPreventedAfterComponent();
    for (const mod of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const) {
      link('settings').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, [mod]: true }));
    }
    expect(seen).toEqual([false, false, false, false]);
    expect(got.map(i => i.id)).toEqual(['reports']);
  });

  it('5b. 使用端沒接 navigate：左鍵單擊不擋預設，照連結換頁', () => {
    render({ mode: 'expanded' });
    const seen = recordPreventedAfterComponent();
    link('reports').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    expect(seen).toEqual([false]);
  });

  it('5c. 藏起來沿用上一個看得到的版面；一開始就藏起來用窄欄的版面', () => {
    const layoutOf = () => ({
      expanded: host().classList.contains('side-nav--expanded'),
      rail: host().classList.contains('side-nav--rail'),
      labels: host().querySelectorAll('.side-nav__label').length,
    });

    render({ mode: 'hidden' });
    expect(layoutOf()).toEqual({ expanded: false, rail: true, labels: 0 });

    render({ mode: 'expanded' });
    render({ mode: 'hidden' });
    expect(layoutOf()).toEqual({ expanded: true, rail: false, labels: 3 });

    render({ mode: 'rail' });
    render({ mode: 'hidden' });
    expect(layoutOf()).toEqual({ expanded: false, rail: true, labels: 0 });
  });

  it('6. 窄欄提示開著時切到藏起來，提示從畫面移除', fakeAsync(() => {
    render({ mode: 'rail' });
    link('home').dispatchEvent(new FocusEvent('focus'));
    tick(300);
    fixture.detectChanges();
    expect(tooltips().length).toBe(1);
    expect(tooltips()[0].textContent).toContain('首頁');

    render({ mode: 'hidden' });
    tick(500);
    expect(tooltips().length).toBe(0);
  }));

  it('6b. 窄欄切到展開，提示也移除；展開時聚焦不再開提示', fakeAsync(() => {
    render({ mode: 'rail' });
    link('home').dispatchEvent(new FocusEvent('focus'));
    tick(300);
    expect(tooltips().length).toBe(1);
    render({ mode: 'expanded' });
    tick(500);
    expect(tooltips().length).toBe(0);
    link('reports').dispatchEvent(new FocusEvent('focus'));
    tick(500);
    expect(tooltips().length).toBe(0);
  }));

  it('7. 顏色：選中底色綠 85、白字白圖示；展開選中的鍵盤焦點框是白色、窄欄是藍色', () => {
    disableTransitions();
    render({ mode: 'expanded', currentId: 'home' });
    const cur = link('home');
    const cs = getComputedStyle(cur);
    expect(cs.backgroundColor).toBe('rgb(83, 130, 39)');
    expect(cs.color).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(cur.querySelector('app-icon')!).color).toBe('rgb(255, 255, 255)');
    cur.focus();
    expect(cur.matches(':focus-visible')).toBeTrue();
    expect(getComputedStyle(cur).outlineColor).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(cur).outlineStyle).toBe('solid');

    const other = link('reports');
    expect(getComputedStyle(other).color).toBe('rgb(104, 104, 104)');
    expect(getComputedStyle(other.querySelector('app-icon')!).color).toBe('rgb(147, 147, 147)');

    render({ mode: 'rail' });
    const pill = link('home');
    expect(getComputedStyle(pill).backgroundColor).toBe('rgb(83, 130, 39)');
    expect(getComputedStyle(link('reports')).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(link('reports')).color).toBe('rgb(104, 104, 104)');
    link('reports').focus();
    expect(getComputedStyle(link('reports')).outlineColor).toBe('rgb(58, 156, 205)');
  });

  it('8. 先藏起來再改回窄欄：inert 拿掉、連結可以聚焦', () => {
    render({ mode: 'hidden' });
    render({ mode: 'rail' });
    expect(host().hasAttribute('inert')).toBeFalse();
    link('home').focus();
    expect(document.activeElement).toBe(link('home'));
  });

  it('9. 名稱太長：只顯示一行、用刪節號截斷，項目不撐寬側欄', () => {
    const long = '這是一個非常非常長的功能入口名稱超過十一個字';
    render({
      mode: 'expanded',
      groups: [{ id: 'g', items: [{ id: 'long', label: long, icon: 'Dashboard', href: '/long' }] }],
    });
    const a = link('long');
    const label = a.querySelector('.side-nav__label') as HTMLElement;
    expect(label.textContent).toBe(long);
    expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
    expect(getComputedStyle(a).whiteSpace).toBe('nowrap');
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(a.getBoundingClientRect().width).toBeLessThanOrEqual(host().getBoundingClientRect().width);
    expect(host().getBoundingClientRect().width).toBe(200);
  });

  // Karma 不能真的把滑鼠移上去，也不能切換使用者的「減少動態」「強制色彩」設定，
  // 所以直接讀元件樣式表裡的規則（做法同 progress-bar.component.spec.ts「減少動態」）。
  // Angular 會在 selector 加上 _ngcontent／_nghost 屬性，所以比對「選擇器含這些片段」。
  describe('樣式表規則', () => {
    const rulesIn = (media: string | null): CSSStyleRule[] => {
      const out: CSSStyleRule[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRule[];
        try { rules = Array.from(sheet.cssRules); } catch { continue; }
        for (const rule of rules) {
          if (media === null && rule instanceof CSSStyleRule) out.push(rule);
          if (media !== null && rule instanceof CSSMediaRule && rule.media.mediaText.includes(media)) {
            for (const inner of Array.from(rule.cssRules)) if (inner instanceof CSSStyleRule) out.push(inner);
          }
        }
      }
      return out;
    };
    const find = (media: string | null, has: string[], hasNot: string[] = []): CSSStyleDeclaration => {
      const hit = rulesIn(media).find(r =>
        has.every(p => r.selectorText.includes(p)) && hasNot.every(p => !r.selectorText.includes(p)));
      if (!hit) throw new Error(`找不到規則：含 ${has.join(' ')}${hasNot.length ? `，不含 ${hasNot.join(' ')}` : ''}（${media ?? '一般'}）`);
      return hit.style;
    };

    beforeEach(() => render({ mode: 'expanded', currentId: 'home' }));

    it('滑過（展開）：一般項目疊 5% 深色、名稱與圖示加深一階；選中的項目換綠 90、仍是白字白圖示', () => {
      disableTransitions();
      applySimulated({ hover: true });
      const plain = link('reports');
      const cur = link('home');
      plain.classList.add('sn-hover');
      cur.classList.add('sn-hover');

      expect(getComputedStyle(plain).backgroundColor).toBe('rgba(28, 28, 46, 0.05)');
      expect(getComputedStyle(plain).color).toBe('rgb(83, 83, 83)');
      expect(getComputedStyle(plain.querySelector('app-icon')!).color).toBe('rgb(104, 104, 104)');
      // 一般項目的滑過規則也會套到選中的項目上，選中的滑過規則要蓋得過它
      expect(getComputedStyle(cur).backgroundColor).toBe('rgb(66, 106, 28)');
      expect(getComputedStyle(cur).color).toBe('rgb(255, 255, 255)');
      expect(getComputedStyle(cur.querySelector('app-icon')!).color).toBe('rgb(255, 255, 255)');
    });

    it('滑過（窄欄）：未選中的項目換藍底白圖示；選中的項目不變', () => {
      disableTransitions();
      render({ mode: 'rail', currentId: 'home' });
      applySimulated({ hover: true });
      const plain = link('reports');
      const cur = link('home');
      plain.classList.add('sn-hover');
      cur.classList.add('sn-hover');

      expect(getComputedStyle(plain).backgroundColor).toBe('rgb(58, 156, 205)');
      expect(getComputedStyle(plain).color).toBe('rgb(255, 255, 255)');
      expect(getComputedStyle(cur).backgroundColor).toBe('rgb(83, 130, 39)');
      expect(getComputedStyle(cur).color).toBe('rgb(255, 255, 255)');
    });

    it('觸控：滑鼠操作時展開的項目 36px 高；觸控裝置 44px；窄欄兩種都是 44px', () => {
      disableTransitions();
      // Karma 的瀏覽器是滑鼠操作，觸控的 @media 規則不生效
      expect(matchMedia('(pointer: coarse)').matches).toBeFalse();
      expect(link('reports').getBoundingClientRect().height).toBe(36);
      expect(sideNavRules().some(r => r.media === '(pointer: coarse)')).toBeTrue();

      applySimulated({ media: '(pointer: coarse)' });
      expect(link('reports').getBoundingClientRect().height).toBe(44);
      expect(link('home').getBoundingClientRect().height).toBe(44);

      render({ mode: 'rail' });
      expect(link('reports').getBoundingClientRect().height).toBe(44);
    });

    it('換寬度：寬度用 450ms、ease-enter 轉場', () => {
      const cs = getComputedStyle(host());
      expect(cs.transitionProperty).toBe('width');
      expect(cs.transitionDuration).toBe('0.45s');
      const hostRule = find(null, ['_nghost'], ['side-nav--', 'side-nav__']);
      expect(hostRule.getPropertyValue('transition')).toContain('--ease-enter');
    });

    it('減少動態：側欄寬度與項目顏色都不轉場', () => {
      const style = find('prefers-reduced-motion: reduce', ['_nghost', 'side-nav__item']);
      expect(style.transitionProperty).toBe('none');
    });

    it('強制色彩：選中的項目用系統的 Highlight 外框標示', () => {
      const style = find('forced-colors: active', ['side-nav__item--current']);
      expect(style.outlineColor.toLowerCase()).toBe('highlight');
      // 平常這條外框是透明的，不影響一般畫面
      const base = find(null, ['side-nav__item--current'], ['side-nav--', ':hover', ':focus']);
      expect(base.outlineStyle).toBe('solid');
      expect(base.outlineColor).toBe('transparent');
    });
  });
});
