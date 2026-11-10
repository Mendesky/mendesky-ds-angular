import { ApplicationRef, Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { TabItem, TabsComponent } from './tabs.component';

/**
 * app-tabs 契約（2026-11-09）：
 * - 頁籤列 role="tablist"＋aria-label；每個頁籤是原生 button，role="tab"，aria-selected 標出選中。
 * - roving tabindex：只有選中的頁籤（沒選中時是第一個沒停用的）tabindex=0，其他 -1。
 * - 左右方向鍵移到前後一個沒停用的頁籤並選中，頭尾繞回；Home、End 到第一個、最後一個沒停用的。
 * - 點擊選中；點已選中的、點停用的不發 valueChange。停用用 aria-disabled，不用原生 disabled。
 * - 狀態標記：紅色圖示（aria-hidden），label 用看不見的文字接在名稱後面，報讀軟體一起念；滑過顯示 label。
 * - panelId：每個頁籤 aria-controls 指向它；selectedTabId 是選中頁籤的 id。
 * - 投影內容放在 tablist 外面。
 * 全部從真的 DOM 查，不看元件內部狀態。
 */
@Component({
  standalone: true,
  imports: [TabsComponent],
  template: `
    <app-tabs #t ariaLabel="資料分組" [panelId]="panelId" [items]="items" [value]="value"
      (valueChange)="value = $event; changes.push($event)">
      <button type="button" data-testid="add">新增一組</button>
    </app-tabs>
    <div id="panel" role="tabpanel" [attr.aria-labelledby]="t.selectedTabId"></div>
  `,
})
class HostComponent {
  items: TabItem[] = [
    { value: 'a', label: '第一組' },
    { value: 'b', label: '第二組', status: { label: '需處理' } },
    { value: 'c', label: '第三組', disabled: true },
    { value: 'd', label: '第四組' },
  ];
  value: string | number | null = 'a';
  panelId = 'panel';
  changes: Array<string | number> = [];
}

describe('TabsComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  const tabs = () => Array.from(el.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const key = (target: HTMLElement, k: string) => {
    const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    target.dispatchEvent(ev);
    fixture.detectChanges();
    return ev;
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    document.body.appendChild(el);
    fixture.detectChanges();
  });

  afterEach(() => {
    el.remove();
    document.querySelectorAll('app-tooltip-portal').forEach(n => n.remove());
  });

  it('頁籤列是 tablist，有名稱；每個頁籤是 role="tab" 的原生 button', () => {
    const list = el.querySelector('[role="tablist"]')!;
    expect(list.getAttribute('aria-label')).toBe('資料分組');
    expect(tabs().length).toBe(4);
    tabs().forEach(t => {
      expect(t.tagName).toBe('BUTTON');
      expect(t.getAttribute('type')).toBe('button');
    });
  });

  it('aria-selected 只標在選中的頁籤，選中的有選中樣式', () => {
    expect(tabs().map(t => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false']);
    expect(tabs()[0].classList).toContain('tabs__tab--selected');
    expect(getComputedStyle(tabs()[0]).fontWeight).toBe('600');
  });

  it('文字顏色在白底上都看得清楚：未選中灰、選中深藍，底線跟選中的字同色', () => {
    // 2026-11-09 定案：字色對白底對比要到 4.5；選中的字和底線用同一個深藍，不要一個頁籤兩種藍
    expect(getComputedStyle(tabs()[1]).color).toBe('rgb(104, 104, 104)');
    expect(getComputedStyle(tabs()[0]).color).toBe('rgb(26, 100, 137)');
    expect(getComputedStyle(tabs()[0]).boxShadow).toContain('rgb(26, 100, 137)');
  });

  it('停用的頁籤帶狀態標記時，標記跟停用的文字一樣是灰色；沒停用的標記維持紅色', () => {
    // 2026-11-09 定案：停用代表不能操作，不用紅色催人處理
    host.items = [
      { value: 'a', label: '第一組' },
      { value: 'b', label: '第二組', status: { label: '需處理' } },
      { value: 'c', label: '第三組', disabled: true, status: { label: '需處理' } },
    ];
    fixture.detectChanges();
    const mark = (i: number) => getComputedStyle(tabs()[i].querySelector('.tabs__status') as HTMLElement).color;
    expect(mark(2)).toBe(getComputedStyle(tabs()[2]).color);
    expect(mark(2)).not.toBe('rgb(204, 82, 82)');
    expect(mark(1)).toBe('rgb(204, 82, 82)');
  });

  it('roving tabindex：只有選中的頁籤在 Tab 順序裡', () => {
    expect(tabs().map(t => t.tabIndex)).toEqual([0, -1, -1, -1]);
    host.value = 'd';
    fixture.detectChanges();
    expect(tabs().map(t => t.tabIndex)).toEqual([-1, -1, -1, 0]);
  });

  it('都沒選中時，第一個沒停用的頁籤在 Tab 順序裡', () => {
    host.value = null;
    host.items = [{ value: 'x', label: '停用', disabled: true }, ...host.items];
    fixture.detectChanges();
    expect(tabs().map(t => t.tabIndex)).toEqual([-1, 0, -1, -1, -1]);
  });

  it('點另一個頁籤發 valueChange 並選中；點已選中的不發', () => {
    tabs()[1].click();
    fixture.detectChanges();
    expect(host.changes).toEqual(['b']);
    expect(tabs()[1].getAttribute('aria-selected')).toBe('true');
    tabs()[1].click();
    fixture.detectChanges();
    expect(host.changes).toEqual(['b']);
  });

  it('停用的頁籤：aria-disabled、沒有原生 disabled，點了不發', () => {
    const off = tabs()[2];
    expect(off.getAttribute('aria-disabled')).toBe('true');
    expect(off.disabled).toBeFalse();
    off.click();
    fixture.detectChanges();
    expect(host.changes).toEqual([]);
  });

  it('右方向鍵：移到下一個並選中，跳過停用，最後一個繞回第一個', () => {
    tabs()[0].focus();
    const ev = key(tabs()[0], 'ArrowRight');
    expect(ev.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(tabs()[1]);
    expect(host.changes).toEqual(['b']);
    key(tabs()[1], 'ArrowRight');
    expect(document.activeElement).toBe(tabs()[3]);
    expect(host.changes).toEqual(['b', 'd']);
    key(tabs()[3], 'ArrowRight');
    expect(document.activeElement).toBe(tabs()[0]);
    expect(host.changes).toEqual(['b', 'd', 'a']);
  });

  it('左方向鍵：第一個繞到最後一個；Home、End 到頭尾沒停用的頁籤', () => {
    tabs()[0].focus();
    key(tabs()[0], 'ArrowLeft');
    expect(document.activeElement).toBe(tabs()[3]);
    expect(host.value).toBe('d');
    key(tabs()[3], 'Home');
    expect(document.activeElement).toBe(tabs()[0]);
    expect(host.value).toBe('a');
    key(tabs()[0], 'End');
    expect(document.activeElement).toBe(tabs()[3]);
    expect(host.value).toBe('d');
  });

  it('左方向鍵也跳過停用的頁籤', () => {
    host.value = 'd';
    fixture.detectChanges();
    tabs()[3].focus();
    key(tabs()[3], 'ArrowLeft');
    expect(document.activeElement).toBe(tabs()[1]);
    expect(host.value).toBe('b');
  });

  it('第一個、最後一個停用時，Home、End 停在最靠近頭尾的沒停用頁籤', () => {
    host.items = [
      { value: 'x', label: '停用的頭', disabled: true },
      { value: 'a', label: '第一組' },
      { value: 'b', label: '第二組' },
      { value: 'y', label: '停用的尾', disabled: true },
    ];
    host.value = 'a';
    fixture.detectChanges();
    tabs()[1].focus();
    key(tabs()[1], 'End');
    expect(document.activeElement).toBe(tabs()[2]);
    expect(host.value).toBe('b');
    key(tabs()[2], 'Home');
    expect(document.activeElement).toBe(tabs()[1]);
    expect(host.value).toBe('a');
  });

  it('其他按鍵不處理，也不擋預設行為', () => {
    const ev = key(tabs()[0], 'ArrowDown');
    expect(ev.defaultPrevented).toBeFalse();
    expect(host.changes).toEqual([]);
  });

  it('狀態標記：紅色圖示不念，label 接在名稱後面念', () => {
    const t = tabs()[1];
    const icon = t.querySelector('.tabs__status')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(icon).color).toBe('rgb(204, 82, 82)');
    const sr = t.querySelector('.tabs__sr') as HTMLElement;
    expect(sr.textContent).toContain('需處理');
    expect(sr.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    // 名稱：可見文字＋看不見的狀態文字（圖示 aria-hidden 不算）
    const name = Array.from(t.childNodes)
      .filter(n => n.nodeType !== Node.COMMENT_NODE)
      .filter(n => !(n instanceof HTMLElement && n.getAttribute('aria-hidden') === 'true'))
      .map(n => n.textContent ?? '').join('').replace(/\s+/g, '');
    expect(name).toBe('第二組，需處理');
    expect(tabs()[0].querySelector('.tabs__status')).toBeNull();
  });

  it('狀態標記：滑過圖示顯示 status 的 label', fakeAsync(() => {
    const icon = tabs()[1].querySelector('.tabs__status') as HTMLElement;
    icon.dispatchEvent(new Event('mouseenter'));
    tick(300);
    TestBed.inject(ApplicationRef).tick();
    const tip = document.querySelector('app-tooltip-portal .tooltip__text') as HTMLElement | null;
    expect(tip?.textContent?.trim()).toBe('需處理');
    icon.dispatchEvent(new Event('mouseleave'));
    flush();
  }));

  it('panelId：每個頁籤 aria-controls 指向它；selectedTabId 是選中頁籤的 id', () => {
    tabs().forEach(t => expect(t.getAttribute('aria-controls')).toBe('panel'));
    const panel = el.querySelector('#panel')!;
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs()[0].id);
    tabs()[3].click();
    fixture.detectChanges();
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs()[3].id);
    host.panelId = '';
    fixture.detectChanges();
    expect(tabs()[0].hasAttribute('aria-controls')).toBeFalse();
  });

  it('頁籤 id 在同一頁的兩個元件之間不重複', () => {
    const other = TestBed.createComponent(HostComponent);
    other.detectChanges();
    const ids = new Set([...tabs(), ...Array.from(other.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLElement>)].map(t => t.id));
    expect(ids.size).toBe(8);
  });

  it('投影的內容在 tablist 外面、最後一個頁籤右邊', () => {
    const add = el.querySelector('[data-testid="add"]') as HTMLElement;
    expect(add.closest('[role="tablist"]')).toBeNull();
    expect(add.getBoundingClientRect().left).toBeGreaterThanOrEqual(tabs()[3].getBoundingClientRect().right);
  });

  it('沒投影內容時，尾端外框不佔位', () => {
    @Component({
      standalone: true,
      imports: [TabsComponent],
      template: `<app-tabs ariaLabel="分組" [items]="items" value="a"></app-tabs>`,
    })
    class BareHost { items: TabItem[] = [{ value: 'a', label: '第一組' }]; }
    const bare = TestBed.createComponent(BareHost);
    document.body.appendChild(bare.nativeElement);
    bare.detectChanges();
    const end = bare.nativeElement.querySelector('.tabs__end') as HTMLElement;
    expect(getComputedStyle(end).display).toBe('none');
    bare.nativeElement.remove();
  });

  it('尾端放比頁籤高的內容時，選中的深藍線還是貼在灰線上', () => {
    // 尾端放 M、L 尺寸的按鈕時，頁籤列會比頁籤高；頁籤要撐滿整列，底線才會對齊
    @Component({
      standalone: true,
      imports: [TabsComponent],
      template: `<app-tabs ariaLabel="分組" [items]="items" value="a">
        <button type="button" style="height: 48px">新增一組</button>
      </app-tabs>`,
    })
    class TallHost { items: TabItem[] = [{ value: 'a', label: '第一組' }, { value: 'b', label: '第二組' }]; }
    const tall = TestBed.createComponent(TallHost);
    document.body.appendChild(tall.nativeElement);
    tall.detectChanges();
    const bar = (tall.nativeElement.querySelector('.tabs') as HTMLElement).getBoundingClientRect();
    const selected = tall.nativeElement.querySelector('.tabs__tab--selected') as HTMLElement;
    const label = (selected.querySelector('.tabs__label') as HTMLElement).getBoundingClientRect();
    expect(bar.height).toBeGreaterThanOrEqual(48);
    expect(Math.abs(bar.bottom - selected.getBoundingClientRect().bottom)).toBeLessThan(0.5);
    // 文字仍在整列的垂直中間
    expect(Math.abs((label.top + label.bottom) / 2 - (bar.top + bar.bottom) / 2)).toBeLessThan(1);
    tall.nativeElement.remove();
  });

  it('放不下時頁籤列左右捲動、不換行；鍵盤移到的頁籤捲進看得到的範圍', () => {
    host.items = Array.from({ length: 12 }, (_, i) => ({ value: i, label: `第 ${i + 1} 組` }));
    host.value = 0;
    el.style.width = '240px';
    el.style.display = 'block';
    fixture.detectChanges();
    const list = el.querySelector('.tabs__list') as HTMLElement;
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    const tops = new Set(tabs().map(t => Math.round(t.getBoundingClientRect().top)));
    expect(tops.size).toBe(1);
    tabs()[0].focus();
    key(tabs()[0], 'End');
    const last = tabs()[11].getBoundingClientRect();
    const box = list.getBoundingClientRect();
    expect(last.right).toBeLessThanOrEqual(box.right + 1);
  });

  // 2026-11-09：選中的頁籤由使用端改 value（例如新增一組後選中它）時，原本不會捲進畫面，捲軸又藏起來，使用者看不到新選中的頁籤
  describe('選中的頁籤改變時捲進看得到的範圍', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ value: i, label: `第 ${i + 1} 組` }));
    const list = (root: HTMLElement = el) => root.querySelector('.tabs__list') as HTMLElement;
    const inView = (tab: HTMLElement, root: HTMLElement = el) => {
      const r = tab.getBoundingClientRect();
      const box = list(root).getBoundingClientRect();
      return r.left >= box.left - 1 && r.right <= box.right + 1;
    };
    const narrow = (n: number, value: number) => {
      host.items = many(n);
      host.value = value;
      el.style.width = '240px';
      el.style.display = 'block';
      fixture.detectChanges();
    };

    it('使用端加一個頁籤並選中它（例如「新增一組」）：頁籤列捲到看得見新頁籤', () => {
      narrow(12, 0);
      expect(list().scrollLeft).toBe(0);
      host.items = many(13);
      host.value = 12;
      fixture.detectChanges();
      expect(inView(tabs()[12])).withContext('新頁籤在看得到的範圍').toBeTrue();
    });

    it('使用端把 value 改回前面看不到的頁籤：頁籤列捲回去', () => {
      narrow(12, 11);
      expect(inView(tabs()[11])).toBeTrue();
      host.value = 0;
      fixture.detectChanges();
      expect(inView(tabs()[0])).toBeTrue();
    });

    it('第一次畫出來時選中的就在後面：直接捲到看得見它', () => {
      const f = TestBed.createComponent(HostComponent);
      const root: HTMLElement = f.nativeElement;
      root.style.width = '240px';
      root.style.display = 'block';
      document.body.appendChild(root);
      f.componentInstance.items = many(12);
      f.componentInstance.value = 10;
      f.detectChanges();
      const tab = root.querySelectorAll<HTMLElement>('[role="tab"]')[10];
      expect(inView(tab, root)).toBeTrue();
      root.remove();
    });

    it('選中的沒變、只換了 items（例如改名）：不把使用者自己捲的位置拉回去', () => {
      narrow(12, 0);
      list().scrollLeft = list().scrollWidth;
      const scrolled = list().scrollLeft;
      expect(scrolled).toBeGreaterThan(0);
      host.items = host.items.map((t, i) => (i === 5 ? { ...t, label: '改過的名稱' } : t));
      fixture.detectChanges();
      expect(list().scrollLeft).toBe(scrolled);
    });

    it('點看得到一半的頁籤：捲到整個看得到', () => {
      narrow(12, 0);
      const partly = tabs().find(t => {
        const r = t.getBoundingClientRect();
        const box = list().getBoundingClientRect();
        return r.left < box.right && r.right > box.right + 1;
      })!;
      expect(partly).withContext('有一個被右邊切到的頁籤').toBeDefined();
      partly.click();
      fixture.detectChanges();
      expect(inView(partly)).toBeTrue();
    });
  });
});
