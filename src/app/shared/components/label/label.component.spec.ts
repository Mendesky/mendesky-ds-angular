import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LabelComponent } from './label.component';

describe('LabelComponent', () => {
  let fixture: ComponentFixture<LabelComponent>;
  let component: LabelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelComponent);
    component = fixture.componentInstance;
  });

  it('預設不換行：hostClasses 不含 label--wrap', () => {
    expect(component.hostClasses['label--wrap']).toBeFalsy();
  });

  it('wrap=true 時套用 label--wrap，允許長文字折行', () => {
    component.wrap = true;
    expect(component.hostClasses['label--wrap']).toBeTrue();
  });

  it('wrap=true 的 label 實際 computed white-space 不是 nowrap（外框換行修正）', () => {
    component.wrap = true;
    component.text = '客戶同時諮詢114年財稅簽服務及115起財稅簽+記帳，但客戶覺得嘉威比較專業。';
    fixture.detectChanges();
    const labelEl = fixture.nativeElement.querySelector('.label') as HTMLElement;
    expect(getComputedStyle(labelEl).whiteSpace).not.toBe('nowrap');
  });
});
