import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SortHeaderComponent } from './sort-header.component';
import { nextSort, SortState } from './sort-header.model';

/**
 * app-sort-header 是可點擊排序的列表表頭：點了發出這欄的 key，排序狀態與排法由呼叫端負責。
 */
describe('SortHeaderComponent', () => {
  let fixture: ComponentFixture<SortHeaderComponent>;
  let component: SortHeaderComponent;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SortHeaderComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('label', '姓名');
    fixture.componentRef.setInput('key', 'name');
  });

  const button = () => host.querySelector('button') as HTMLButtonElement;

  const status = () => host.querySelector('[role="status"]') as HTMLElement;
  /** 按鈕念出來的名稱：按鈕裡的文字（圖示是 aria-hidden，不算） */
  const name = () => (button().textContent ?? '').replace(/\s+/g, '');

  it('顯示欄名，按鈕是 type="button"（放在表單裡不會送出）', () => {
    fixture.detectChanges();
    expect(name()).toBe('姓名');
    expect(button().type).toBe('button');
  });

  it('外層不是表格列：host 沒有 role，也沒有 aria-sort', () => {
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
    fixture.detectChanges();
    expect(host.hasAttribute('role')).toBeFalse();
    expect(host.hasAttribute('aria-sort')).toBeFalse();
  });

  it('沒有排序：按鈕只念欄名，圖示是通用排序符號，沒有作用中樣式', () => {
    fixture.detectChanges();
    expect(name()).toBe('姓名');
    expect(component.icon).toBe('Sort');
    expect(button().classList).not.toContain('ds-sort-header--active');
  });

  it('排序的是別欄：這欄維持未作用，按鈕只念欄名', () => {
    fixture.componentRef.setInput('sort', { key: 'email', dir: 'desc' });
    fixture.detectChanges();
    expect(component.active).toBeFalse();
    expect(name()).toBe('姓名');
  });

  it('升冪：按鈕念「姓名，升冪排序」、圖示 Sort-Asc、作用中樣式', () => {
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
    fixture.detectChanges();
    expect(name()).toBe('姓名，升冪排序');
    expect(component.icon).toBe('Sort-Asc');
    expect(button().classList).toContain('ds-sort-header--active');
  });

  it('降冪：按鈕念「姓名，降冪排序」、圖示 Sort-Desc', () => {
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'desc' });
    fixture.detectChanges();
    expect(name()).toBe('姓名，降冪排序');
    expect(component.icon).toBe('Sort-Desc');
  });

  it('排序狀態那段字畫面上看不到，也不佔位置', () => {
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
    fixture.detectChanges();
    const sr = button().querySelector('.ds-sort-header__sr') as HTMLElement;
    const cs = getComputedStyle(sr);
    expect(cs.position).toBe('absolute');
    expect(sr.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });

  it('圖示都標了 aria-hidden，不會被念出來', () => {
    fixture.componentRef.setInput('leftIcon', 'Sort');
    fixture.detectChanges();
    const svgs = Array.from(button().querySelectorAll('svg'));
    expect(svgs.length).toBe(2);
    expect(svgs.every(s => s.getAttribute('aria-hidden') === 'true')).toBeTrue();
  });

  describe('報讀區域', () => {
    it('一開始就在畫面上，而且是空的', () => {
      fixture.detectChanges();
      expect(status()).not.toBeNull();
      expect(status().textContent).toBe('');
    });

    it('已經在排序、但不是因為點了這一欄：不念', () => {
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('');
    });

    it('點了這一欄、排序狀態傳回來之後才念「已依姓名升冪排序」', () => {
      fixture.detectChanges();
      const region = status();
      button().click();
      fixture.detectChanges();
      // 排序狀態還沒傳回來：還是空的
      expect(region.textContent).toBe('');
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      // 同一個元素填字，不是重新插入一個
      expect(status()).toBe(region);
      expect(region.textContent).toBe('已依姓名升冪排序');
    });

    it('再點一次反轉方向：改念「已依姓名降冪排序」', () => {
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      button().click();
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'desc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('已依姓名降冪排序');
    });

    it('換成別欄排序：這一欄的報讀區域清空', () => {
      fixture.detectChanges();
      button().click();
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      fixture.componentRef.setInput('sort', { key: 'email', dir: 'asc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('');
    });

    it('點的是別欄：這一欄不念', () => {
      fixture.detectChanges();
      fixture.componentRef.setInput('sort', { key: 'email', dir: 'asc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('');
    });

    it('點了但呼叫端沒改排序，之後才因為別的原因排到這一欄：不念', async () => {
      fixture.detectChanges();
      button().click();
      await new Promise(r => setTimeout(r, 1100));
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('');
    });
  });

  describe('欄名前面的圖示', () => {
    const leftIcon = () => host.querySelector('.ds-sort-header__left-icon') as HTMLElement | null;

    it('沒給 leftIcon：不畫', () => {
      fixture.detectChanges();
      expect(leftIcon()).toBeNull();
    });

    it('給了 leftIcon：畫在欄名前面，12px，顏色跟文字一樣，沒在排序時也看得到', () => {
      fixture.componentRef.setInput('leftIcon', 'Sort');
      fixture.detectChanges();
      const el = leftIcon()!;
      expect(el).not.toBeNull();
      const label = host.querySelector('.ds-sort-header__label')!;
      expect(el.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(el.getBoundingClientRect().width).toBe(12);
      expect(getComputedStyle(el).color).toBe(getComputedStyle(button()).color);
      expect(getComputedStyle(el).opacity).toBe('1');
    });
  });

  it('點擊發出這欄的 key', () => {
    const got: string[] = [];
    component.sortChange.subscribe(k => got.push(k));
    fixture.detectChanges();
    button().click();
    expect(got).toEqual(['name']);
  });

  it('沒在排序時圖示預設隱藏（opacity 0），正在排序時顯示', () => {
    fixture.detectChanges();
    const icon = () => host.querySelector('.ds-sort-header__icon') as HTMLElement;
    // 圖示有 150ms 淡入；關掉動畫才讀得到切換後的值
    icon().style.transition = 'none';
    expect(getComputedStyle(icon()).opacity).toBe('0');
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
    fixture.detectChanges();
    expect(getComputedStyle(icon()).opacity).toBe('1');
  });

  it('align="center" 時 host 置中，按鈕不往外拉', () => {
    fixture.componentRef.setInput('align', 'center');
    fixture.detectChanges();
    expect(host.classList).toContain('ds-sort-header--center');
    expect(getComputedStyle(host).justifyContent).toBe('center');
    expect(getComputedStyle(button()).marginLeft).toBe('0px');
    expect(getComputedStyle(button()).marginRight).toBe('0px');
  });

  it('靠左時按鈕往左拉 6px、靠右時往右拉 6px（文字跟下方內容的邊緣對齊）', () => {
    fixture.detectChanges();
    expect(getComputedStyle(button()).marginLeft).toBe('-6px');
    fixture.componentRef.setInput('align', 'end');
    fixture.detectChanges();
    expect(getComputedStyle(button()).marginRight).toBe('-6px');
  });

  it('欄名太長：固定一行、尾端用刪節號，圖示不被擠掉', () => {
    host.style.width = '80px';
    fixture.componentRef.setInput('label', '這是一個非常非常長的欄位名稱');
    fixture.componentRef.setInput('leftIcon', 'Sort');
    fixture.detectChanges();
    const label = host.querySelector('.ds-sort-header__label') as HTMLElement;
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
    host.querySelectorAll('app-icon').forEach(i => expect((i as HTMLElement).getBoundingClientRect().width).toBe(12));
    host.style.width = '';
  });

  it('align="end" 時 host 靠右', () => {
    fixture.componentRef.setInput('align', 'end');
    fixture.detectChanges();
    expect(host.classList).toContain('ds-sort-header--end');
    expect(getComputedStyle(host).justifyContent).toBe('flex-end');
  });

  it('消費端的欄寬 class 帶 overflow: hidden 時也不裁切按鈕', () => {
    const style = document.createElement('style');
    style.textContent = '.clip-cell { overflow: hidden; width: 120px; }';
    document.head.appendChild(style);
    host.classList.add('clip-cell');
    fixture.detectChanges();
    expect(getComputedStyle(host).overflow).toBe('visible');
    style.remove();
  });

  it('data-testid 依 key 產生，方便消費端測試定位', () => {
    fixture.detectChanges();
    expect(button().getAttribute('data-testid')).toBe('sort-name');
  });
});

/** 放在表格列裡：host 要帶 columnheader 與 aria-sort，按鈕名稱不重複寫排序狀態 */
@Component({
  standalone: true,
  imports: [SortHeaderComponent],
  template: `
    <div role="table">
      <div role="row">
        <app-sort-header label="姓名" key="name" [sort]="sort" (sortChange)="clicked = $event" />
      </div>
    </div>
  `,
})
class InRowHostComponent {
  sort: SortState | null = null;
  clicked = '';
}

describe('SortHeaderComponent 放在表格列（role="row"）裡', () => {
  let fixture: ComponentFixture<InRowHostComponent>;
  const el = () => fixture.nativeElement.querySelector('app-sort-header') as HTMLElement;
  const button = () => el().querySelector('button') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InRowHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(InRowHostComponent);
  });

  it('host 是 columnheader，沒有排序時 aria-sort=none', () => {
    fixture.detectChanges();
    expect(el().getAttribute('role')).toBe('columnheader');
    expect(el().getAttribute('aria-sort')).toBe('none');
  });

  it('升冪、降冪用 aria-sort 表達，按鈕名稱只有欄名（不重複念）', () => {
    fixture.componentInstance.sort = { key: 'name', dir: 'asc' };
    fixture.detectChanges();
    expect(el().getAttribute('aria-sort')).toBe('ascending');
    expect((button().textContent ?? '').replace(/\s+/g, '')).toBe('姓名');
    fixture.componentInstance.sort = { key: 'name', dir: 'desc' };
    fixture.detectChanges();
    expect(el().getAttribute('aria-sort')).toBe('descending');
  });

  it('點了之後一樣會念「已依姓名升冪排序」', () => {
    fixture.detectChanges();
    button().click();
    expect(fixture.componentInstance.clicked).toBe('name');
    fixture.componentInstance.sort = { key: 'name', dir: 'asc' };
    fixture.detectChanges();
    expect(el().querySelector('[role="status"]')!.textContent).toBe('已依姓名升冪排序');
  });
});

describe('nextSort', () => {
  it('點新的欄從預設方向開始（預設升冪）', () => {
    expect(nextSort(null, 'name')).toEqual({ key: 'name', dir: 'asc' });
    expect(nextSort({ key: 'email', dir: 'asc' }, 'count', 'desc')).toEqual({ key: 'count', dir: 'desc' });
  });

  it('再點同一欄反轉方向（兩段切換）', () => {
    expect(nextSort({ key: 'name', dir: 'asc' }, 'name')).toEqual({ key: 'name', dir: 'desc' });
    expect(nextSort({ key: 'name', dir: 'desc' }, 'name')).toEqual({ key: 'name', dir: 'asc' });
  });
});
