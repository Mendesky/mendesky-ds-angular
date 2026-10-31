import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconBtnComponent } from './icon-btn.component';

/**
 * app-icon-btn 當選單觸發鈕（例：More）：ariaHaspopup／ariaExpanded 要落在內層 button.icon-btn。
 * 動作選單關閉後在 Safari 找回觸發鈕，找的是標了 aria-haspopup 的那顆可以拿焦點的按鈕；
 * 標在外框（app-icon-btn 或包 tooltip 的 div）上，找到了也 focus 不了。
 */
@Component({
  standalone: true,
  imports: [IconBtnComponent],
  template: `
    <app-icon-btn class="trigger" ariaLabel="更多操作" ariaHaspopup="menu" [ariaExpanded]="expanded"></app-icon-btn>
    <app-icon-btn class="plain" ariaLabel="編輯"></app-icon-btn>
  `,
})
class HostComponent {
  expanded = true;
}

describe('IconBtnComponent — ariaHaspopup／ariaExpanded（打開選單的圖示按鈕）', () => {
  let fixture: ComponentFixture<HostComponent>;
  const inner = (cls: string) => fixture.nativeElement.querySelector(`app-icon-btn.${cls} button.icon-btn`) as HTMLButtonElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('設 ariaHaspopup="menu"、ariaExpanded=true → 內層 button 有 aria-haspopup="menu"、aria-expanded="true"；改成 false 時輸出 "false"', () => {
    expect(inner('trigger').getAttribute('aria-haspopup')).toBe('menu');
    expect(inner('trigger').getAttribute('aria-expanded')).toBe('true');
    fixture.componentInstance.expanded = false;
    fixture.detectChanges();
    expect(inner('trigger').getAttribute('aria-expanded')).toBe('false');
  });

  it('外框（app-icon-btn、包 tooltip 的 div）不帶 aria-haspopup／aria-expanded', () => {
    const host = fixture.nativeElement.querySelector('app-icon-btn.trigger') as HTMLElement;
    const wrap = host.querySelector('.icon-btn-wrap') as HTMLElement;
    for (const el of [host, wrap]) {
      expect(el.hasAttribute('aria-haspopup')).toBeFalse();
      expect(el.hasAttribute('aria-expanded')).toBeFalse();
    }
  });

  it('不設時內層 button 不輸出這兩個屬性', () => {
    expect(inner('plain').hasAttribute('aria-haspopup')).toBeFalse();
    expect(inner('plain').hasAttribute('aria-expanded')).toBeFalse();
  });
});
