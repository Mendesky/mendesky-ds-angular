import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldComponent } from './field.component';

/**
 * `.field-header` 的排版不變式：空間不足時**換行**，不得壓縮標籤文字。
 *
 * 中文（CJK）可以逐字斷行 → 文字的 min-content 只有 1 個字寬，因此 flex 容器在空間不足時
 * 可以把標籤壓成「一字一行」而完全不溢出（瀏覽器認為這是合法收縮）。實測後果：某表單
 * 欄位的 label + hint 被壓成 2–3 字一行、旁邊留著長按鈕（2026-07-25 真機回報）。
 * `flex-wrap: wrap` 讓「放不下就換行」優先於「壓縮文字」。
 */
@Component({
  standalone: true,
  imports: [FieldComponent],
  template: `
    <div class="host-box" style="width: 366px">
      <app-field label="通知信寄送頻率" hint="（每週寄送、每月寄送）" [required]="true">
        <button field-action style="width: 230px">從 過往通知信寄送頻率 匯入設定</button>
        <div style="height: 36px">控制項</div>
      </app-field>
    </div>
  `,
})
class HostComponent {}

describe('FieldComponent — header 排版（放不下要換行，不得壓縮標籤）', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    // 需實際附加到 document 才量得到版面
    document.body.appendChild(fixture.nativeElement as HTMLElement);
  });

  afterEach(() => {
    (fixture.nativeElement as HTMLElement).remove();
  });

  it('容器窄 + 長 field-action → 標籤仍維持單行（不被壓成一字一行）', () => {
    const host = fixture.nativeElement as HTMLElement;
    const label = host.querySelector('.field-label') as HTMLElement;
    const hint = host.querySelector('.field-hint') as HTMLElement;
    expect(label).withContext('.field-label 應存在').toBeTruthy();

    const labelH = label.getBoundingClientRect().height;
    const hintH = hint.getBoundingClientRect().height;
    console.log(`[field-header] labelH=${labelH.toFixed(1)} hintH=${hintH.toFixed(1)}`);

    // 單行高度 = 14px × line-height 1.4 ≈ 19.6px；壓成多行會是它的 2 倍以上
    expect(labelH).withContext(`標籤被壓成多行（高 ${labelH.toFixed(1)}px）`).toBeLessThan(30);
    expect(hintH).withContext(`hint 被壓成多行（高 ${hintH.toFixed(1)}px）`).toBeLessThan(30);
  });

  it('header 不得水平溢出容器', () => {
    const header = (fixture.nativeElement as HTMLElement).querySelector('.field-header') as HTMLElement;
    expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
  });
});

/**
 * 空的 `<span class="field-action">`（field.component.html 無條件渲染）不得佔位：
 * 它寬 0，但前面的 6px gap 在 flex 換行計算時仍計入 → 窄欄位會為了這個 0 寬元素多換一行、
 * header 憑空多 6px，把同列其他欄位推歪（2026-07-26 對抗式複核實測：375px 級手機 22→28px）。
 */
@Component({
  standalone: true,
  imports: [FieldComponent],
  template: `
    <div style="width: 98px">
      <app-field label="鄉鎮市區" [required]="true">
        <div style="height: 36px">控制項</div>
      </app-field>
    </div>
  `,
})
class NoActionHostComponent {}

describe('FieldComponent — 空 field-action 不得造成多餘換行', () => {
  let fixture: ComponentFixture<NoActionHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NoActionHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(NoActionHostComponent);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement as HTMLElement);
  });

  afterEach(() => (fixture.nativeElement as HTMLElement).remove());

  it('欄寬 98px（介於「含空 span 需 100.5px」與「不含需 94.5px」之間）→ header 維持單行', () => {
    const header = (fixture.nativeElement as HTMLElement).querySelector('.field-header') as HTMLElement;
    const h = header.getBoundingClientRect().height;
    console.log(`[field-action:empty] headerH=${h.toFixed(1)}`);
    // 單行 = 19.6px；空 span 佔位時會多一個 flex 行 → 19.6 + 6(row-gap) = 25.6px
    expect(h).withContext(`header 多換了一行（高 ${h.toFixed(1)}px，單行應為 19.6）`).toBeLessThan(22);
  });
});

/**
 * 標題與說明的層級：標題中粗 500、說明（hint）一般 400、emphasis 標題 700。
 * 2026-10-05 使用者定案：標題加重以便和標題旁的說明文字區分。
 */
@Component({
  standalone: true,
  imports: [FieldComponent],
  template: `
    <app-field label="資產總額" hint="（元）"><div>控制項</div></app-field>
    <app-field label="群組標題" [emphasis]="true"><div>控制項</div></app-field>
  `,
})
class WeightHostComponent {}

describe('FieldComponent — 標題與說明的字重', () => {
  let fixture: ComponentFixture<WeightHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WeightHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(WeightHostComponent);
    fixture.detectChanges();
  });

  it('標題中粗 500，說明一般 400', () => {
    const fields = (fixture.nativeElement as HTMLElement).querySelectorAll('app-field');
    const label = fields[0].querySelector('.field-label') as HTMLElement;
    const hint = fields[0].querySelector('.field-hint') as HTMLElement;
    expect(getComputedStyle(label).fontWeight).toBe('500');
    expect(getComputedStyle(hint).fontWeight).toBe('400');
  });

  it('emphasis 標題維持 700', () => {
    const fields = (fixture.nativeElement as HTMLElement).querySelectorAll('app-field');
    const label = fields[1].querySelector('.field-label') as HTMLElement;
    expect(getComputedStyle(label).fontWeight).toBe('700');
  });
});
