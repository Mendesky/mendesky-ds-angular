import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CheckboxComponent, CheckboxSize } from './checkbox.component';
import { IconComponent } from '../icon/icon.component';
import { ICON_REGISTRY } from '../icon/icon.registry';

/**
 * app-checkbox 契約（2026-10-14 定案）：
 * - 三態：沒有 / 全有 / 部分，aria-checked 分別是 false / true / mixed。
 * - 「部分」只由呼叫端給，使用者點不出來：部分 → 全有、全有 → 沒有、沒有 → 全有。
 * - 圖示用 registry 的 CheckBox / CheckBoxOn / CheckBoxMixed；框與 CheckBox 同位置，可跟 check-chip 互換。
 */
@Component({
  standalone: true,
  imports: [CheckboxComponent, FormsModule],
  template: `
    <app-checkbox class="ctl" [checked]="checked" [indeterminate]="indeterminate" [size]="size"
      [disabled]="disabled" [label]="label" ariaLabel="報價案件管理 整組檢視"
      (checkedChange)="changes.push($event)"></app-checkbox>
    <app-checkbox class="model" [(ngModel)]="model" ariaLabel="綁 ngModel"></app-checkbox>
  `,
})
class HostComponent {
  checked = false;
  indeterminate = false;
  size: CheckboxSize = 'm';
  disabled = false;
  label = '';
  model = false;
  changes: boolean[] = [];
}

describe('CheckboxComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const button = (sel = '.ctl') => fixture.nativeElement.querySelector(`${sel} button`) as HTMLButtonElement;
  const icon = (sel = '.ctl') => fixture.nativeElement.querySelector(`${sel} app-icon`) as HTMLElement;
  const iconName = (sel = '.ctl') =>
    (fixture.debugElement.query(By.css(`${sel} app-icon`)).componentInstance as IconComponent).name;

  function render(patch: Partial<HostComponent> = {}): void {
    Object.assign(host, patch);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('三種狀態', () => {
    it('沒有：aria-checked="false"、CheckBox 圖示', () => {
      render({ checked: false, indeterminate: false });
      expect(button().getAttribute('role')).toBe('checkbox');
      expect(button().getAttribute('aria-checked')).toBe('false');
      expect(iconName()).toBe('CheckBox');
    });

    it('全有：aria-checked="true"、CheckBoxOn 圖示', () => {
      render({ checked: true });
      expect(button().getAttribute('aria-checked')).toBe('true');
      expect(iconName()).toBe('CheckBoxOn');
    });

    it('部分：aria-checked="mixed"、CheckBoxMixed 圖示，而且不管 checked 是什麼都顯示部分', () => {
      render({ checked: false, indeterminate: true });
      expect(button().getAttribute('aria-checked')).toBe('mixed');
      expect(iconName()).toBe('CheckBoxMixed');
      render({ checked: true, indeterminate: true });
      expect(button().getAttribute('aria-checked')).toBe('mixed');
    });

    it('沒有＝灰（text/body），全有、部分＝深一階的綠（Color/Green/80）', () => {
      render({ checked: false });
      expect(getComputedStyle(icon()).color).toBe('rgb(104, 104, 104)');
      render({ checked: true });
      expect(getComputedStyle(icon()).color).toBe('rgb(90, 140, 44)');
      render({ checked: false, indeterminate: true });
      expect(getComputedStyle(icon()).color).toBe('rgb(90, 140, 44)');
    });
  });

  describe('點擊', () => {
    it('沒有 → 全有，送出 true', () => {
      render({ checked: false });
      button().click();
      fixture.detectChanges();
      expect(host.changes).toEqual([true]);
      expect(button().getAttribute('aria-checked')).toBe('true');
    });

    it('全有 → 沒有，送出 false', () => {
      render({ checked: true });
      button().click();
      fixture.detectChanges();
      expect(host.changes).toEqual([false]);
      expect(button().getAttribute('aria-checked')).toBe('false');
    });

    it('部分 → 全有，送出 true（checked 原本是 true 也一樣，不會變成沒有）', () => {
      render({ checked: true, indeterminate: true });
      button().click();
      fixture.detectChanges();
      expect(host.changes).toEqual([true]);
      expect(button().getAttribute('aria-checked')).toBe('true');
    });

    it('點文字也算點勾選框', () => {
      render({ label: '檢視' });
      (fixture.nativeElement.querySelector('.ctl .checkbox__label') as HTMLElement).click();
      expect(host.changes).toEqual([true]);
    });
  });

  describe('停用', () => {
    it('點了不送出、狀態不變', () => {
      render({ disabled: true, checked: false });
      button().click();
      fixture.detectChanges();
      expect(host.changes).toEqual([]);
      expect(button().getAttribute('aria-checked')).toBe('false');
    });

    it('用原生 disabled：不能用 Tab 移到它', () => {
      render({ disabled: true });
      expect(button().disabled).toBeTrue();
    });

    it('整個元件 45% 透明度', () => {
      render({ disabled: true });
      expect(getComputedStyle(button()).opacity).toBe('0.45');
    });
  });

  describe('大小', () => {
    const cases: [CheckboxSize, number][] = [['s', 20], ['m', 24], ['l', 28]];
    for (const [size, px] of cases) {
      it(`${size} 用 ${px} 號圖示`, () => {
        render({ size });
        const box = icon().getBoundingClientRect();
        expect(box.width).toBe(px);
        expect(box.height).toBe(px);
      });
    }

    it('可點範圍都大於 24px（WCAG 2.5.8）', () => {
      for (const [size] of cases) {
        render({ size });
        const box = button().getBoundingClientRect();
        expect(box.width).withContext(size).toBeGreaterThanOrEqual(24);
        expect(box.height).withContext(size).toBeGreaterThanOrEqual(24);
      }
    });
  });

  describe('讀螢幕軟體', () => {
    it('沒有 label 時用 ariaLabel', () => {
      render({ label: '' });
      expect(button().getAttribute('aria-label')).toBe('報價案件管理 整組檢視');
    });

    it('有 label 時用 label 文字，不再另外給 aria-label', () => {
      render({ label: '檢視' });
      expect(button().getAttribute('aria-label')).toBeNull();
      expect(button().textContent!.trim()).toBe('檢視');
    });
  });

  it('支援 ngModel 雙向綁定', async () => {
    host.model = true;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(button('.model').getAttribute('aria-checked')).toBe('true');

    button('.model').click();
    fixture.detectChanges();
    expect(host.model).toBeFalse();
  });
});

/**
 * 圖示契約：CheckBoxOn / CheckBoxMixed 要能跟 CheckBox / CheckedBox 直接互換（check-chip 之後只換名稱）。
 * 所以框必須畫在同一個位置，而且只能用 currentColor（放在綠底 / 深灰底的 chip 上才會跟著文字變白）。
 */
describe('ICON_REGISTRY — 三態勾選框圖示', () => {
  let holder: HTMLDivElement;

  beforeEach(() => {
    holder = document.createElement('div');
    document.body.appendChild(holder);
  });
  afterEach(() => holder.remove());

  function bbox(name: string): DOMRect {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.innerHTML = `<g>${ICON_REGISTRY[name]}</g>`;
    holder.appendChild(svg);
    return (svg.firstElementChild as SVGGraphicsElement).getBBox();
  }

  for (const name of ['CheckBoxOn', 'CheckBoxMixed']) {
    it(`${name} 存在，而且只用 currentColor`, () => {
      const svg = ICON_REGISTRY[name];
      expect(svg).toBeTruthy();
      const colors = svg.match(/(?:fill|stroke)="([^"]+)"/g) ?? [];
      for (const c of colors) {
        expect(c.endsWith('"currentColor"') || c.endsWith('"none"')).withContext(c).toBeTrue();
      }
    });

    it(`${name} 的框跟 CheckBox 同位置（viewBox 中間 20 格）`, () => {
      const ref = bbox('CheckBox');
      const box = bbox(name);
      expect(box.x).toBeCloseTo(ref.x, 1);
      expect(box.y).toBeCloseTo(ref.y, 1);
      expect(box.width).toBeCloseTo(ref.width, 1);
      expect(box.height).toBeCloseTo(ref.height, 1);
      expect(ref.width).toBeCloseTo(20, 1);
    });
  }
});
