import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InlineAddComponent } from './inline-add.component';

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
