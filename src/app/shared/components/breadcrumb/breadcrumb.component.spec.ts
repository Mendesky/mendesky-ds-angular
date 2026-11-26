import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BreadcrumbComponent, BreadcrumbItem } from './breadcrumb.component';

/**
 * app-breadcrumb：頁首的「區 › 頁」路徑。每一節圖示＋名稱；前面的節是連結、最後一節是目前頁；
 * 最後一節帶兩頁以上同區頁面時變成切換鈕，打開切換選單（連結，目前頁綠底）。
 */
const IAM: BreadcrumbItem[] = [
  { id: 'iam', label: '權限管理', icon: 'Shield', href: '/iam/users' },
  { id: 'iam-roles', label: '角色', icon: 'IdCard', href: '/iam/roles' },
];
const SIBLINGS: BreadcrumbItem[] = [
  { id: 'iam-users', label: '人員', icon: 'Person', href: '/iam/users' },
  { id: 'iam-roles', label: '角色', icon: 'IdCard', href: '/iam/roles' },
];
const VERSION: BreadcrumbItem[] = [
  { id: 'products', label: '版本更新管理', icon: 'Megaphone', href: '/products' },
  { id: 'p1', label: '會計系統', icon: 'AppWindow', href: '/products/p1' },
  { id: 'v1', label: 'v2.4.0', icon: 'VersionTag' },
];

describe('BreadcrumbComponent', () => {
  let fixture: ComponentFixture<BreadcrumbComponent>;
  const host = () => fixture.nativeElement as HTMLElement;
  const segs = () => Array.from(host().querySelectorAll<HTMLElement>('li'));
  const switchBtn = () => host().querySelector<HTMLButtonElement>('button.breadcrumb__switch');
  const panels = () => Array.from(document.body.querySelectorAll<HTMLElement>(':scope > app-nav-link-panel'));
  const openPanels = () => panels().filter(p => !p.classList.contains('nav-link-panel--leaving'));
  const panelLinks = () => Array.from(openPanels()[0].querySelectorAll<HTMLAnchorElement>('a'));
  const cleanups: Array<() => void> = [];

  const render = (inputs: { items?: BreadcrumbItem[]; siblings?: BreadcrumbItem[] }) => {
    for (const [k, v] of Object.entries({ items: IAM, ...inputs })) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
  };
  const key = (el: HTMLElement, k: string, shiftKey = false) => {
    const e = new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    fixture.detectChanges();
    return e;
  };
  const openMenu = async () => {
    switchBtn()!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BreadcrumbComponent] }).compileComponents();
    fixture = TestBed.createComponent(BreadcrumbComponent);
    document.body.appendChild(host());
  });

  afterEach(() => {
    fixture.destroy();
    host().remove();
    panels().forEach(p => p.remove());
    cleanups.splice(0).forEach(fn => fn());
  });

  it('B1. 導覽地標＋有序清單；每一節 16px 圖示＋名稱；前面的節是連結、最後一節 aria-current="page" 不是連結；分隔箭頭報讀不念', () => {
    render({ items: VERSION });
    const nav = host().querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('目前位置');
    expect(nav.querySelector('ol')).not.toBeNull();
    expect(segs().length).toBe(3);
    expect(segs().map(li => li.textContent!.trim())).toEqual(['版本更新管理', '會計系統', 'v2.4.0']);
    for (const li of segs()) {
      const icon = li.querySelector<HTMLElement>('app-icon:not(.breadcrumb__sep)')!;
      expect(icon).withContext(li.textContent!).not.toBeNull();
      expect(icon.getBoundingClientRect().width).toBe(16);
    }
    expect(segs()[0].querySelector('a')!.getAttribute('href')).toBe('/products');
    expect(segs()[1].querySelector('a')!.getAttribute('href')).toBe('/products/p1');
    expect(segs()[2].querySelector('a')).toBeNull();
    expect(segs()[2].querySelector('[aria-current="page"]')!.textContent!.trim()).toBe('v2.4.0');
    const seps = host().querySelectorAll('.breadcrumb__sep');
    expect(seps.length).toBe(2);
    seps.forEach(s => expect(s.getAttribute('aria-hidden')).toBe('true'));
    expect(switchBtn()).toBeNull();
  });

  it('B2. 顏色：前面的節 --text/body、最後一節 --text/headings 中等粗、分隔箭頭 --border/primary-darker', () => {
    render({ items: VERSION });
    expect(getComputedStyle(segs()[0].querySelector('a')!).color).toBe('rgb(104, 104, 104)');
    const cur = segs()[2].querySelector<HTMLElement>('[aria-current="page"]')!;
    expect(getComputedStyle(cur).color).toBe('rgb(83, 83, 83)');
    expect(getComputedStyle(cur).fontWeight).toBe('500');
    expect(getComputedStyle(host().querySelector('.breadcrumb__sep')!).color).toBe('rgb(190, 190, 190)');
  });

  it('B3. 點前面的節送出那一節、擋預設；按住 ⌘ 不送不擋', () => {
    render({ items: VERSION });
    const sent: string[] = [];
    fixture.componentInstance.navigate.subscribe(c => sent.push(c.id!));
    const a = segs()[1].querySelector('a')!;
    const guard = (e: Event) => e.preventDefault();
    a.addEventListener('click', guard);
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }));
    a.removeEventListener('click', guard);
    expect(sent).toEqual([]);
    const plain = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    a.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBeTrue();
    expect(sent).toEqual(['p1']);
  });

  it('B4. 同區頁面只有一頁：最後一節照一般顯示，沒有切換鈕', () => {
    render({ siblings: [SIBLINGS[1]] });
    expect(switchBtn()).toBeNull();
    expect(segs()[1].querySelector('[aria-current="page"]')).not.toBeNull();
  });

  it('B5. 同區頁面兩頁以上：最後一節是切換鈕（aria-current、aria-expanded、向下箭頭、16px 圖示）', () => {
    render({ siblings: SIBLINGS });
    const b = switchBtn()!;
    expect(b).not.toBeNull();
    expect(b.textContent!.trim()).toBe('角色');
    expect(b.getAttribute('aria-current')).toBe('page');
    expect(b.getAttribute('aria-expanded')).toBe('false');
    const icons = Array.from(b.querySelectorAll<HTMLElement>('app-icon'));
    expect(icons.length).toBe(2);
    icons.forEach(i => expect(i.getBoundingClientRect().width).toBe(16));
    expect(b.getBoundingClientRect().height).toBe(32);
  });

  it('B6. 按切換鈕：選單出現在下方，列出同區頁面（連結、圖示），目前頁綠底 aria-current；焦點移到目前頁', async () => {
    render({ siblings: SIBLINGS });
    await openMenu();
    expect(openPanels().length).toBe(1);
    const p = openPanels()[0];
    expect(switchBtn()!.getAttribute('aria-expanded')).toBe('true');
    expect(switchBtn()!.getAttribute('aria-controls')).toBe(p.id);
    expect(p.getAttribute('role')).toBe('group');
    expect(p.getAttribute('aria-label')).toBe('角色');
    const links = panelLinks();
    expect(links.map(a => a.textContent!.trim())).toEqual(['人員', '角色']);
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/iam/users', '/iam/roles']);
    expect(links.every(a => a.querySelector('app-icon'))).toBeTrue();
    expect(links[1].getAttribute('aria-current')).toBe('page');
    expect(getComputedStyle(links[1]).backgroundColor).toBe('rgb(83, 130, 39)');
    expect(document.activeElement).toBe(links[1]);
    const b = switchBtn()!.getBoundingClientRect();
    expect(Math.abs(parseFloat(p.style.top) - (b.bottom + 6))).toBeLessThanOrEqual(1);
    expect(Math.abs(parseFloat(p.style.left) - b.left)).toBeLessThanOrEqual(1);
  });

  it('B7. 選單：Esc 收起、焦點回切換鈕；再按切換鈕收起', async () => {
    render({ siblings: SIBLINGS });
    await openMenu();
    key(document.activeElement as HTMLElement, 'Escape');
    expect(openPanels().length).toBe(0);
    expect(document.activeElement).toBe(switchBtn());
    expect(switchBtn()!.getAttribute('aria-expanded')).toBe('false');

    await openMenu();
    expect(openPanels().length).toBe(1);
    switchBtn()!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    switchBtn()!.click();
    fixture.detectChanges();
    expect(openPanels().length).toBe(0);
  });

  it('B8. 選單：第一個 Shift＋Tab 回切換鈕並收起；最後一個 Tab 收起、焦點交回切換鈕讓瀏覽器往下走', async () => {
    render({ siblings: SIBLINGS });
    await openMenu();
    const links = panelLinks();
    links[0].focus();
    const back = key(links[0], 'Tab', true);
    expect(back.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(switchBtn());
    expect(openPanels().length).toBe(0);

    await openMenu();
    const fwd = key(panelLinks()[1], 'Tab');
    expect(fwd.defaultPrevented).withContext('不擋，瀏覽器從切換鈕往下一個').toBeFalse();
    expect(document.activeElement).toBe(switchBtn());
    expect(openPanels().length).toBe(0);
  });

  it('B9. 點選單的頁面送出那一頁、擋預設、收起；點外面收起', async () => {
    render({ siblings: SIBLINGS });
    const sent: string[] = [];
    fixture.componentInstance.navigate.subscribe(c => sent.push(c.id!));
    await openMenu();
    const plain = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    panelLinks()[0].dispatchEvent(plain);
    fixture.detectChanges();
    expect(plain.defaultPrevented).toBeTrue();
    expect(sent).toEqual(['iam-users']);
    expect(openPanels().length).toBe(0);

    await openMenu();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    cleanups.push(() => outside.remove());
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(openPanels().length).toBe(0);
  });

  it('B10. 收起播 150ms ease-exit 動畫後才移除；換頁（items 換新）直接移除', fakeAsync(() => {
    render({ siblings: SIBLINGS });
    switchBtn()!.click();
    fixture.detectChanges();
    tick();
    const p = openPanels()[0];
    expect(getComputedStyle(p).animationDuration).toBe('0.15s');
    key(p.querySelector('a')!, 'Escape');
    expect(p.classList.contains('nav-link-panel--leaving')).toBeTrue();
    tick(150);
    fixture.detectChanges();
    expect(panels().length).toBe(0);

    switchBtn()!.click();
    fixture.detectChanges();
    tick();
    expect(openPanels().length).toBe(1);
    render({ items: [...IAM] });
    expect(panels().length).toBe(0);
    tick(500);
  }));

  it('B11. 名稱太長：前面的節先縮短成刪節號，目前頁維持全名', () => {
    render({
      items: [
        { id: 'a', label: '一個非常非常非常非常長的上層區域名稱', icon: 'Megaphone', href: '/a' },
        { id: 'b', label: '目前頁', icon: 'AppWindow' },
      ],
    });
    host().style.cssText = 'display:block;width:220px';
    cleanups.push(() => host().removeAttribute('style'));
    fixture.detectChanges();
    const firstLabel = segs()[0].querySelector<HTMLElement>('.breadcrumb__label')!;
    const lastLabel = segs()[1].querySelector<HTMLElement>('.breadcrumb__label')!;
    expect(firstLabel.scrollWidth).toBeGreaterThan(firstLabel.clientWidth);
    expect(getComputedStyle(firstLabel).textOverflow).toBe('ellipsis');
    expect(lastLabel.scrollWidth).toBeLessThanOrEqual(lastLabel.clientWidth);
    expect(host().getBoundingClientRect().width).toBe(220);
  });
});
