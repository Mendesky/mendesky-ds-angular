import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CheckChipComponent } from './check-chip.component';
import { expectWrappedInto, isSingleLine, unwrappedTextWidth } from '../../testing/text-layout.helpers';

/**
 * Regression：chip 文字長度無上界時必須折行，不得撐破容器。
 *
 * bug 根因：`.chip` 原本 `white-space: nowrap` → min-content ＝ 整串文字寬 → 作為 flex item
 * 完全不可收縮 → 必定溢出容器。而 chip 的 text 並非只有固定 enum 短標籤：
 * 搭配 `app-inline-add` 的多選欄位，選項清單是由使用者自由輸入 push 進去的
 * （呼叫端通常只 trim + 去重，無長度限制），實務值常是整段敘述。
 *
 * 修法選的是「改預設」而非加 opt-in `wrap` prop：nowrap 撐破容器在任何 call site 都不是想要的
 * 行為，而 `white-space: normal` 對放得下的短標籤渲染結果相同（本檔第 3、4 條鎖住這點）。
 *
 * 量測策略（2026-08-04 CI 事故後改寫）：折行一律用 `lineCount()`（Range client rects），
 * 並用 `expectWrappedInto()` 先驗前提「測資不換行時確實比可用寬度寬」。
 * 原本用「高度比值 > 1.5」與同元素自比，在 Linux CI 紅了——單行高 macOS 38 / Linux 34，
 * 字寬 14 vs 12px，比值與像素常數兩種寫法都會壞。詳見 text-layout.helpers.ts 檔頭。
 */

/** 真實資料形狀：使用者在 inline-add 打的整段敘述（重複兩次，確保任何字型下都遠超容器） */
const LONG_TEXT =
  '這會是一個很長的測試我不知道會不會被截斷聽說今天的天氣超熱的不過我不知道因為我今天整天在辦公室裡我老公的阿姨說要來看我'
  + '而且我還想再補充一點就是這個欄位真的沒有字數上限所以使用者想打多長都可以';
const SHORT_TEXT = '網頁設計';
/** 長不可斷 ASCII token（overflow-wrap: anywhere 才擋得住） */
const LONG_URL = 'https://www.example.com/very/long/path/without/any/break/opportunity/at/all/1234567890';

@Component({
  standalone: true,
  imports: [CheckChipComponent, FormsModule],
  template: `
    <div class="wrap" [style.width.px]="width">
      <app-check-chip class="long" [text]="longText" theme="default" size="s" [ngModel]="true"></app-check-chip>
      <app-check-chip class="short" [text]="shortText" theme="default" size="s" [ngModel]="false"></app-check-chip>
    </div>
  `,
  styles: [`
    /* 對齊常見用法：chip 放在 flex-wrap 容器裡 */
    .wrap { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  `],
})
class HostComponent {
  width = 704;
  longText = LONG_TEXT;
  shortText = SHORT_TEXT;
}

describe('CheckChipComponent — 長文字折行不撐破容器（regression）', () => {
  let host: HostComponent;
  let root: HTMLElement;

  function render(width: number, longText = LONG_TEXT): void {
    const fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.width = width;
    host.longText = longText;
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
  }

  const container = () => root.querySelector<HTMLElement>('.wrap')!;
  const longChip = () => root.querySelector<HTMLElement>('app-check-chip.long .chip')!;
  const shortChip = () => root.querySelector<HTMLElement>('app-check-chip.short .chip')!;
  const longText = () => root.querySelector<HTMLElement>('app-check-chip.long .chip__text')!;
  const shortText = () => root.querySelector<HTMLElement>('app-check-chip.short .chip__text')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('長自由文字 chip 不溢出容器右緣（表單寬度 704px）', () => {
    render(704);
    // 前提：測資對這個容器確實過長。否則「不溢出」會變成恆真——沒有溢出壓力時誰都不溢出
    expect(unwrappedTextWidth(longText()))
      .withContext('測資不換行時應遠寬於容器，否則本測失去對象')
      .toBeGreaterThan(container().clientWidth);

    const c = container().getBoundingClientRect();
    const chip = longChip().getBoundingClientRect();
    expect(chip.right).withContext(`chip 右緣 ${chip.right} 應在容器右緣 ${c.right} 內`).toBeLessThanOrEqual(c.right + 1);
    expect(container().scrollWidth).withContext('容器不應有水平捲動內容').toBeLessThanOrEqual(container().clientWidth);
  });

  it('長自由文字 chip 折成多行（行數量測，與字型無關）', () => {
    render(704);
    expectWrappedInto(longText());
  });

  it('短標籤維持單行、寬度貼合內容（改預設不破壞既有 chip 外觀）', () => {
    render(704);
    expect(isSingleLine(shortText())).withContext('短標籤不應折行').toBe(true);
    // 相對容器而非像素常數：短標籤只佔一小部分寬度，長文字才會吃滿
    const short = shortChip().getBoundingClientRect();
    expect(short.width)
      .withContext(`短 chip 寬 ${short.width} 應遠小於容器 ${container().clientWidth}`)
      .toBeLessThan(container().clientWidth * 0.3);
    expect(short.width).withContext('短 chip 應比長 chip 窄').toBeLessThan(longChip().getBoundingClientRect().width);
  });

  it('窄容器（action-menu 220px）下短標籤仍單行', () => {
    render(220, SHORT_TEXT);
    // 逐顆各自斷言單行；不用兩顆互比高度——render(220, SHORT_TEXT) 讓兩顆吃同一字串，互比恆真
    expect(isSingleLine(longText())).withContext('220px 下短文字仍應單行').toBe(true);
    expect(isSingleLine(shortText())).withContext('220px 下短文字仍應單行').toBe(true);
    expect(container().scrollWidth).toBeLessThanOrEqual(container().clientWidth);
  });

  /**
   * 容器用 300px（手機看分享連結的級距）而非 704px：URL 的 `/ ? &` 是合法斷點，
   * 整條 URL 不換行只有約 666px，在 704px 容器內本來就塞得下 → 在寬容器測「URL 會折行」
   * 是恆真的假通過（改寫前這條就是這樣一直綠的，被新加的前提守門抓出來）。
   */
  it('長不可斷 ASCII token 也折行（overflow-wrap: anywhere）', () => {
    render(300, LONG_URL);
    expect(unwrappedTextWidth(longText()))
      .withContext('URL 不換行時應寬於容器')
      .toBeGreaterThan(container().clientWidth);

    const c = container().getBoundingClientRect();
    const chip = longChip().getBoundingClientRect();
    expect(chip.right).withContext(`URL chip 右緣 ${chip.right} 應在容器 ${c.right} 內`).toBeLessThanOrEqual(c.right + 1);
    expect(container().scrollWidth).toBeLessThanOrEqual(container().clientWidth);
    expect(isSingleLine(longText())).withContext('URL 應折行而非單行溢出').toBe(false);
  });

  it('折行時文字左對齊（button UA 預設 center 會讓多行居中、難讀）', () => {
    render(704);
    expect(getComputedStyle(longChip()).textAlign).toBe('left');
  });

  it('折行後 checkbox icon 不被壓扁（維持 16px）', () => {
    render(704);
    const icon = root.querySelector<HTMLElement>('app-check-chip.long .chip__icon')!;
    expect(icon.getBoundingClientRect().width).withContext('icon 應維持 16px 不被 flex 壓縮').toBeGreaterThanOrEqual(15);
  });
});

/**
 * 報讀契約（2026-10-28）：內層 button 依選取狀態輸出 aria-pressed（"true"／"false"），
 * 跟同家族的 radio-chip 一致；ariaLabel 落在內層 button，沒設就不輸出。
 * 點擊與表單寫入是兩條不同的路徑，各驗一次。
 */
@Component({
  standalone: true,
  imports: [CheckChipComponent, FormsModule],
  template: `
    <app-check-chip class="click" text="網頁設計"></app-check-chip>
    <app-check-chip class="model" text="已完成" [ngModel]="model"></app-check-chip>
    <app-check-chip class="named" text="其他" ariaLabel="其他服務"></app-check-chip>
  `,
})
class A11yHostComponent {
  model = false;
}

describe('CheckChipComponent — 已選狀態與名稱', () => {
  let fixture: ComponentFixture<A11yHostComponent>;

  const chip = (sel: string) => fixture.nativeElement.querySelector(`app-check-chip.${sel} button`) as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [A11yHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(A11yHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('點擊：aria-pressed 由 "false" 變 "true"，再點回 "false"', () => {
    expect(chip('click').getAttribute('aria-pressed')).toBe('false');
    chip('click').click();
    fixture.detectChanges();
    expect(chip('click').getAttribute('aria-pressed')).toBe('true');
    chip('click').click();
    fixture.detectChanges();
    expect(chip('click').getAttribute('aria-pressed')).toBe('false');
  });

  it('表單寫入 true：aria-pressed 變 "true"，選中樣式也跟著出現', async () => {
    expect(chip('model').getAttribute('aria-pressed')).toBe('false');
    fixture.componentInstance.model = true;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(chip('model').getAttribute('aria-pressed')).toBe('true');
    expect(chip('model').classList).toContain('chip--selected');
  });

  it('有設 ariaLabel 時落在內層 button；沒設時沒有', () => {
    expect(chip('named').getAttribute('aria-label')).toBe('其他服務');
    expect(chip('click').hasAttribute('aria-label')).toBeFalse();
  });
});
