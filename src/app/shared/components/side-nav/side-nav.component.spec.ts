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

    for (const mod of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const) {
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, [mod]: true });
      // 讓瀏覽器不要真的開新分頁：等元件處理完再自己擋
      link('settings').addEventListener('click', e => e.preventDefault(), { once: true });
      const preventedBefore = ev.defaultPrevented;
      link('settings').dispatchEvent(ev);
      expect(preventedBefore).toBeFalse();
    }
    expect(got.map(i => i.id)).toEqual(['reports']);
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
    // 換版面時底色有 150ms 轉場，量到的會是轉場起點；量最終顏色前先關掉轉場
    const noTransition = document.createElement('style');
    noTransition.textContent = '.side-nav, .side-nav * { transition: none !important; }';
    document.head.appendChild(noTransition);
    onTestDone(() => noTransition.remove());
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
});
