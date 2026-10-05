import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

@Component({
  standalone: true,
  imports: [AvatarComponent],
  template: `<app-avatar propClass="Text" [size]="44" [text]="text" [clickable]="clickable" [ariaLabel]="ariaLabel" (click)="clicks = clicks + 1"></app-avatar>`,
})
class HostComponent {
  text = '王大明';
  clickable = true;
  ariaLabel = '';
  clicks = 0;
}

describe('AvatarComponent — 可點擊時是真正的按鈕（鍵盤可操作）', () => {
  let fixture: ComponentFixture<HostComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  function render(patch: Partial<HostComponent>): void {
    fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, patch);
    fixture.detectChanges();
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [HostComponent] }));

  it('clickable 時根元素是 type="button" 的按鈕，可被 Tab 聚焦，名稱來自 ariaLabel', () => {
    render({ clickable: true, ariaLabel: '個人面板' });
    const btn = el().querySelector('button');
    expect(btn).not.toBeNull();
    expect(btn!.getAttribute('type')).toBe('button');
    expect(btn!.tabIndex).toBe(0);
    expect(btn!.getAttribute('aria-label')).toBe('個人面板');
  });

  it('clickable 但沒給 ariaLabel 時，名稱用 text', () => {
    render({ clickable: true, ariaLabel: '' });
    expect(el().querySelector('button')!.getAttribute('aria-label')).toBe('王大明');
  });

  it('不可點擊時沒有按鈕，也不可聚焦', () => {
    render({ clickable: false });
    expect(el().querySelector('button')).toBeNull();
    expect((el().querySelector('.avatar-root') as HTMLElement).tabIndex).toBe(-1);
  });

  it('點內部按鈕時，外層 (click) 收到一次', () => {
    render({ clickable: true });
    el().querySelector('button')!.click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('按鈕大小等於 size，沒有被瀏覽器預設樣式撐大', () => {
    render({ clickable: true });
    const rect = el().querySelector('button')!.getBoundingClientRect();
    expect(rect.width).toBe(44);
    expect(rect.height).toBe(44);
  });
});
