import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SortHeaderComponent } from './sort-header.component';
import { nextSort } from './sort-header.model';

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

  it('顯示欄名，host 是 columnheader，按鈕是 type="button"（放在表單裡不會送出）', () => {
    fixture.detectChanges();
    expect(button().textContent).toContain('姓名');
    expect(host.getAttribute('role')).toBe('columnheader');
    expect(button().type).toBe('button');
  });

  it('沒有排序：aria-sort=none，圖示是通用排序符號，沒有作用中樣式', () => {
    fixture.detectChanges();
    expect(host.getAttribute('aria-sort')).toBe('none');
    expect(component.icon).toBe('Sort');
    expect(button().classList).not.toContain('ds-sort-header--active');
  });

  it('排序的是別欄：這欄維持未作用', () => {
    fixture.componentRef.setInput('sort', { key: 'email', dir: 'desc' });
    fixture.detectChanges();
    expect(host.getAttribute('aria-sort')).toBe('none');
    expect(component.active).toBeFalse();
  });

  it('升冪：aria-sort=ascending、向上箭頭、作用中樣式', () => {
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
    fixture.detectChanges();
    expect(host.getAttribute('aria-sort')).toBe('ascending');
    expect(component.icon).toBe('UpArrow');
    expect(button().classList).toContain('ds-sort-header--active');
  });

  it('降冪：aria-sort=descending、向下箭頭', () => {
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'desc' });
    fixture.detectChanges();
    expect(host.getAttribute('aria-sort')).toBe('descending');
    expect(component.icon).toBe('DownArrow');
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
