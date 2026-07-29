import { ApplicationRef, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutocompleteComponent, AutocompleteOption } from './autocomplete.component';
import { SelectComponent } from '../select/select.component';

/**
 * 面板寬度必須等於輸入框寬度。
 *
 * panel host 只綁 `min-width: <trigger 寬>`、`width` 為 auto → 對 `position: fixed` 元素而言
 * 寬度是 shrink-to-fit＝`min(max-content, 可用寬)`，而 max-content ＝「最長選項不換行的寬度」。
 * 選項短時（員工姓名）不超過 trigger、看起來一致；選項長時（行業代號：代號＋最長 30 字的
 * 行業名稱，實測資料 `Industry_Code.json` 2542 筆）max-content 遠超 trigger → 面板往外長到
 * 可用寬度、貼齊螢幕兩側，與同畫面其他下拉明顯不一致（2026-07-25 真機回報）。
 */
const LONG_INDUSTRY: AutocompleteOption[] = [
  // 取自 src/assets/json/Industry_Code.json 的最長名稱（30 字）
  { label: '081234 豆類加工食品（豆腐、豆乾、豆皮、豆腐乳、豆豉、豆漿除外）製造', value: '081234' },
  { label: '011100 稻作栽培', value: '011100' },
];

const SHORT_STAFF: AutocompleteOption[] = [
  { label: '王品蓁（總所／工商）', value: 's1' },
  { label: '林筱芹（總所／工商）', value: 's2' },
];

@Component({
  standalone: true,
  imports: [AutocompleteComponent],
  template: `
    <div style="width: 366px">
      <app-autocomplete [options]="opts" placeholder="請選擇行業代號"></app-autocomplete>
    </div>
  `,
})
class HostComponent {
  opts: AutocompleteOption[] = [];
}

describe('AutocompleteComponent — 下拉面板寬度對齊輸入框', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
  });

  afterEach(() => {
    (fixture.nativeElement as HTMLElement).remove();
    document.querySelectorAll('app-autocomplete-panel').forEach(el => el.remove());
  });

  /** 開啟面板並回傳 trigger / panel 寬度 */
  function openAndMeasure(options: AutocompleteOption[]): { trigger: number; panel: number } {
    fixture.componentInstance.opts = options;
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    document.body.appendChild(host);

    const box = host.querySelector('.autocomplete-box') as HTMLElement;
    (host.querySelector('input.autocomplete-input') as HTMLInputElement)
      .dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    // 面板是 createComponent + appRef.attachView 建立的動態元件 → CD 走 ApplicationRef.tick()，
    // fixture.detectChanges() 不會渲染它（少了這步面板只有 2px＝左右 border、量不到真寬度）
    TestBed.inject(ApplicationRef).tick();

    const panel = document.querySelector('app-autocomplete-panel') as HTMLElement | null;
    expect(panel).withContext('面板應已開啟').toBeTruthy();
    expect(panel!.querySelectorAll('.autocomplete-option').length)
      .withContext('面板應已渲染選項').toBeGreaterThan(0);
    return {
      trigger: box.getBoundingClientRect().width,
      panel: panel!.getBoundingClientRect().width,
    };
  }

  it('長選項（行業代號，最長 30 字行業名）→ 面板不得超過輸入框寬度', () => {
    const m = openAndMeasure(LONG_INDUSTRY);
    console.log(`[panel-w long] trigger=${m.trigger.toFixed(1)} panel=${m.panel.toFixed(1)}`);
    expect(m.panel).withContext(`面板 ${m.panel.toFixed(1)}px 比輸入框 ${m.trigger.toFixed(1)}px 寬`)
      .toBeLessThanOrEqual(m.trigger);
  });

  it('短選項（員工姓名）→ 面板等於輸入框寬度（對照組，修正前後皆應成立）', () => {
    const m = openAndMeasure(SHORT_STAFF);
    console.log(`[panel-w short] trigger=${m.trigger.toFixed(1)} panel=${m.panel.toFixed(1)}`);
    expect(m.panel).toBe(m.trigger);
  });
});

// ── 面板視覺與 app-select 面板一致（2026-07-26 使用者回報「跟其他選單不一致」）──────
// 兩個面板原本是兩套語言（select #fcfcfc + 10px 圓角 + 藥丸選項；autocomplete 白底 + 透明選項）。
// 這裡把「面板底色 / 圓角 / 選項底色」鎖成一致；刻意保留的差異是 select 選項單行截斷、
// autocomplete 允許換行（長行業名截斷會看不出是哪一筆）。
@Component({
  standalone: true,
  imports: [AutocompleteComponent, SelectComponent],
  template: `
    <div style="width: 366px">
      <app-autocomplete [options]="opts" placeholder="ac"></app-autocomplete>
      <app-select [options]="selOpts" placeholder="sel"></app-select>
    </div>
  `,
})
class BothHostComponent {
  opts: AutocompleteOption[] = [{ label: '王品蓁（總所／工商）', value: 's1' }];
  selOpts = [{ label: '王品蓁（總所／工商）', value: 's1' }];
}

describe('AutocompleteComponent — 面板視覺與 select 面板一致', () => {
  let fixture: ComponentFixture<BothHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BothHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(BothHostComponent);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement as HTMLElement);
  });

  afterEach(() => {
    (fixture.nativeElement as HTMLElement).remove();
    document.querySelectorAll('app-autocomplete-panel, app-select-panel').forEach(el => el.remove());
  });

  it('面板底色 / 圓角 / 選項底色 三者與 select 面板相同', () => {
    const host = fixture.nativeElement as HTMLElement;
    (host.querySelector('input.autocomplete-input') as HTMLInputElement).dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    const selectComp = fixture.debugElement.children[0].children[1].componentInstance as any;
    selectComp.open();
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();

    const acPanel = document.querySelector('app-autocomplete-panel .autocomplete-panel') as HTMLElement;
    const selPanel = document.querySelector('app-select-panel .panel') as HTMLElement;
    expect(acPanel).withContext('autocomplete 面板應已開啟').toBeTruthy();
    expect(selPanel).withContext('select 面板應已開啟').toBeTruthy();

    const ac = getComputedStyle(acPanel);
    const sel = getComputedStyle(selPanel);
    console.log(`[visual] ac bg=${ac.backgroundColor} radius=${ac.borderRadius} | sel bg=${sel.backgroundColor} radius=${sel.borderRadius}`);
    expect(ac.backgroundColor).withContext('面板底色').toBe(sel.backgroundColor);
    expect(ac.borderRadius).withContext('面板圓角').toBe(sel.borderRadius);

    const acOpt = getComputedStyle(document.querySelector('.autocomplete-option') as HTMLElement);
    const selOpt = getComputedStyle(document.querySelector('.panel-option') as HTMLElement);
    console.log(`[visual] ac opt bg=${acOpt.backgroundColor} | sel opt bg=${selOpt.backgroundColor}`);
    expect(acOpt.backgroundColor).withContext('選項底色').toBe(selOpt.backgroundColor);
  });
});
