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

describe('LabelComponent — 報價類型 variant（Purple / GreenOutline）', () => {
  let fixture: ComponentFixture<LabelComponent>;
  let component: LabelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelComponent);
    component = fixture.componentInstance;
  });

  it('Purple：實心紫底白字', () => {
    component.color = 'Purple';
    expect(component.hostClasses['label--purple']).toBeTrue();
    expect(component.textClass).toBe('text--white');
    expect(component.iconColorClass).toBe('icon--white');
  });

  it('GreenOutline：白底綠框綠字', () => {
    component.color = 'GreenOutline';
    expect(component.hostClasses['label--green-outline']).toBeTrue();
    expect(component.textClass).toBe('text--green');
    expect(component.iconColorClass).toBe('icon--green');
  });

  it('GreenOutline 的字重 600 由 DS 這一格提供，不需呼叫端補', () => {
    component.color = 'GreenOutline';
    component.size = 'S';
    component.text = '所客';
    fixture.detectChanges();
    const textEl = fixture.nativeElement.querySelector('.label__text') as HTMLElement;
    expect(getComputedStyle(textEl).fontWeight).toBe('600');
  });

  it('GreenOutline 框與字同色（#5a8c2c）', () => {
    component.color = 'GreenOutline';
    component.text = '所客';
    fixture.detectChanges();
    const labelEl = fixture.nativeElement.querySelector('.label') as HTMLElement;
    const textEl = fixture.nativeElement.querySelector('.label__text') as HTMLElement;
    expect(getComputedStyle(labelEl).borderTopColor).toBe('rgb(90, 140, 44)');
    expect(getComputedStyle(textEl).color).toBe('rgb(90, 140, 44)');
  });

  it('三張顏色對照表的 key 完全一致——新增 variant 只改其中一張會被抓出來', () => {
    const colorKeys = Object.keys((component as any).COLOR_CSS).sort();
    const textKeys  = Object.keys((component as any).TEXT_CLASS).sort();
    const iconKeys  = Object.keys((component as any).ICON_CLASS).sort();
    expect(textKeys).toEqual(colorKeys);
    expect(iconKeys).toEqual(colorKeys);
  });

  it('每個 variant 都解析得出 class，不會產生 undefined', () => {
    const colors = Object.keys((component as any).COLOR_CSS) as (typeof component.color)[];
    for (const c of colors) {
      component.color = c;
      expect(Object.keys(component.hostClasses)).not.toContain('undefined');
      expect(component.textClass).toBeDefined();
      expect(component.iconColorClass).toBeDefined();
    }
  });
});
