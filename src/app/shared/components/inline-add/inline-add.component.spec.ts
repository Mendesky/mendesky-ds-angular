import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Type } from '@angular/core';
import { InlineAddComponent } from './inline-add.component';
import { FieldComponent } from '../field/field.component';

/**
 * app-inline-add — ghost 觸發鈕 ↔ inline 輸入框
 * 行為：只有 Enter 提交（trim 後非空才 emit）；Esc / blur 一律取消。
 */
describe('InlineAddComponent', () => {
  let fixture: ComponentFixture<InlineAddComponent>;
  let component: InlineAddComponent;
  let emitted: string[];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [InlineAddComponent] });
    fixture = TestBed.createComponent(InlineAddComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.add.subscribe((v: string) => emitted.push(v));
    fixture.detectChanges();
  });

  it('預設為非編輯態（顯示觸發鈕）', () => {
    expect(component.editing()).toBeFalse();
  });

  it('點觸發 → 進入編輯態', () => {
    component.onTriggerClick();
    expect(component.editing()).toBeTrue();
  });

  it('輸入非空 + Enter → emit trim 後字串並回到非編輯態', () => {
    component.onTriggerClick();
    component.onValueChange('  測試原因  ');
    component.onInputKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toEqual(['測試原因']);
    expect(component.editing()).toBeFalse();
  });

  it('空白 + Enter → 不 emit，取消編輯態', () => {
    component.onTriggerClick();
    component.onValueChange('   ');
    component.onInputKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toEqual([]);
    expect(component.editing()).toBeFalse();
  });

  it('Esc → 不 emit，取消編輯態', () => {
    component.onTriggerClick();
    component.onValueChange('測試');
    component.onInputKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(emitted).toEqual([]);
    expect(component.editing()).toBeFalse();
  });

  it('blur → 不 emit，取消編輯態', () => {
    component.onTriggerClick();
    component.onValueChange('測試');
    component.onBlur();
    expect(emitted).toEqual([]);
    expect(component.editing()).toBeFalse();
  });

  it('輸入態 keydown → stopPropagation（方向鍵不冒泡到 chip 群組 roving focus）', () => {
    component.onTriggerClick();
    const ev = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    const stopSpy = spyOn(ev, 'stopPropagation');
    component.onInputKeydown(ev);
    expect(stopSpy).toHaveBeenCalled();
  });
});

// ── 報讀名稱：ariaLabel 交給內層輸入框（2026-11-04）──────────────────────

@Component({
  standalone: true,
  imports: [InlineAddComponent],
  template: `<app-inline-add ariaLabel="從哪裡得知這項活動" placeholder="輸入其他管道後按 Enter"></app-inline-add>`,
})
class NamedHostComponent {}

@Component({
  standalone: true,
  imports: [InlineAddComponent],
  template: `<app-inline-add placeholder="輸入其他管道後按 Enter"></app-inline-add>`,
})
class UnnamedHostComponent {}

/** 可複選欄位的寫法：欄位必填指的是整組至少選一個，不是最後這一格一定要打字 */
@Component({
  standalone: true,
  imports: [FieldComponent, InlineAddComponent],
  template: `
    <app-field label="從哪裡得知這項活動" [required]="true">
      <app-inline-add ariaLabel="從哪裡得知這項活動" placeholder="輸入其他管道後按 Enter"></app-inline-add>
    </app-field>
  `,
})
class RequiredFieldHostComponent {}

/** 同上但不設 ariaLabel：用來確認內層輸入框不會自己連到外層欄位（設了 ariaLabel 時 aria-labelledby 本來就不輸出，看不出來） */
@Component({
  standalone: true,
  imports: [FieldComponent, InlineAddComponent],
  template: `
    <app-field label="從哪裡得知這項活動" [required]="true">
      <app-inline-add placeholder="輸入其他管道後按 Enter"></app-inline-add>
    </app-field>
  `,
})
class RequiredFieldUnnamedHostComponent {}

describe('InlineAddComponent — 報讀名稱', () => {
  /** 點觸發鈕（app-button 畫出的 button）進入編輯態，等聚焦的 microtask 跑完，回傳內層輸入框 */
  async function openInput(fixture: ComponentFixture<unknown>): Promise<HTMLInputElement> {
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('app-inline-add button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const input = root.querySelector<HTMLInputElement>('app-inline-add input.input-field');
    expect(input).withContext('點觸發鈕後應出現輸入框').not.toBeNull();
    return input!;
  }

  async function render<T>(host: Type<T>): Promise<ComponentFixture<T>> {
    await TestBed.configureTestingModule({ imports: [host] }).compileComponents();
    const fixture = TestBed.createComponent(host);
    fixture.detectChanges();
    return fixture;
  }

  it('設 ariaLabel → 點觸發鈕後，內層 input 的 aria-label 是該名稱', async () => {
    const input = await openInput(await render(NamedHostComponent));
    expect(input.getAttribute('aria-label')).toBe('從哪裡得知這項活動');
  });

  it('不設 ariaLabel → 內層 input 沒有 aria-label（只念提示文字，跟原本一樣）', async () => {
    const input = await openInput(await render(UnnamedHostComponent));
    expect(input.hasAttribute('aria-label')).toBeFalse();
  });

  it('放在必填的 app-field 裡 → 內層 input 沒有 aria-required，也沒有 aria-labelledby', async () => {
    const input = await openInput(await render(RequiredFieldHostComponent));
    expect(input.hasAttribute('aria-required')).toBeFalse();
    expect(input.hasAttribute('aria-labelledby')).toBeFalse();
  });

  it('放在必填的 app-field 裡、不設 ariaLabel → 內層 input 也不連到欄位標題、不標必填', async () => {
    const input = await openInput(await render(RequiredFieldUnnamedHostComponent));
    expect(input.hasAttribute('aria-labelledby')).toBeFalse();
    expect(input.hasAttribute('aria-required')).toBeFalse();
  });
});
