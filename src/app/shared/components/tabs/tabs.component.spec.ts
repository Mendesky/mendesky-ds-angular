import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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

  afterEach(() => el.remove());

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

  it('文字顏色在白底上都看得清楚：未選中灰、選中深藍、底線亮藍', () => {
    // 2026-11-09 定案：字色對白底對比要到 4.5；底線不是字，亮藍 #3a9ccd 即可
    expect(getComputedStyle(tabs()[1]).color).toBe('rgb(104, 104, 104)');
    expect(getComputedStyle(tabs()[0]).color).toBe('rgb(26, 100, 137)');
    expect(getComputedStyle(tabs()[0]).boxShadow).toContain('rgb(58, 156, 205)');
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
});
