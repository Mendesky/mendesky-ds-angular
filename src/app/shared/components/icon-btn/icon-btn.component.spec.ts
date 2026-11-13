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

/**
 * 實心主色（PrimaryFilled）＋ size="12"：頁面主要的新增入口。外觀要跟全域 .app-action-cta-btn 一樣：
 * 24×24、主色底、白色圖示、圓角 4px、停用 40% 不透明。斷言查計算後樣式，不只查 class。
 */
@Component({
  standalone: true,
  imports: [IconBtnComponent],
  template: `
    <app-icon-btn size="12" propClass="PrimaryFilled" ariaLabel="新增項目" [disabled]="disabled">
      <span class="glyph"></span>
    </app-icon-btn>
  `,
})
class PrimaryFilledHostComponent {
  disabled = false;
}

describe('IconBtnComponent — PrimaryFilled 與 size="12"', () => {
  let fixture: ComponentFixture<PrimaryFilledHostComponent>;
  const btn = () => fixture.nativeElement.querySelector('button.icon-btn') as HTMLButtonElement;
  const iconWrap = () => fixture.nativeElement.querySelector('.icon-btn__icon-wrap') as HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(PrimaryFilledHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('按鈕 24×24、圖示區 12×12', () => {
    const r = btn().getBoundingClientRect();
    expect([r.width, r.height]).toEqual([24, 24]);
    const w = iconWrap().getBoundingClientRect();
    expect([w.width, w.height]).toEqual([12, 12]);
  });

  it('主色底、白色圖示、圓角 4px', () => {
    const cs = getComputedStyle(btn());
    expect(cs.backgroundColor).toBe('rgb(58, 156, 205)');
    expect(cs.color).toBe('rgb(255, 255, 255)');
    expect(cs.borderTopLeftRadius).toBe('4px');
  });

  it('停用時 40% 不透明，跟全域新增鈕一樣（其他外觀是 50%）', () => {
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    expect(btn().disabled).toBeTrue();
    expect(getComputedStyle(btn()).opacity).toBe('0.4');
  });

  it('ariaLabel 落在內層按鈕', () => {
    expect(btn().getAttribute('aria-label')).toBe('新增項目');
  });
});

/**
 * DS-12：loading。轉圈取代圖示；不加原生 disabled（焦點才留得住）、改用 aria-busy＋aria-disabled；
 * 點了不送出；不淡化（停用的 50% 會讓轉圈對比掉到 3:1 以下）；滑過不變色。
 */
@Component({
  standalone: true,
  imports: [IconBtnComponent],
  template: `
    <app-icon-btn class="lb" [size]="size" [propClass]="propClass" [loading]="loading" [loadingSize]="loadingSize"
      [loadingLabel]="loadingLabel" [disabled]="disabled" ariaLabel="列印" label="列印"
      (btnClick)="clicks = clicks + 1" (click)="hostClicks = hostClicks + 1">
      <span class="proj">P</span>
    </app-icon-btn>
  `,
})
class LoadingHostComponent {
  size: '12' | '16-' | '16' | '24' | '32' | '36' | '48' = '24';
  propClass: 'Normal' | 'Modal' | 'Icon+Text' | 'PrimaryFilled' = 'Normal';
  loading = false;
  loadingSize: '12' | '16' | '24' | '36' | null = null;
  loadingLabel = '';
  disabled = false;
  clicks = 0;
  /** 外層自己綁的 (click)：載入中不該收到 */
  hostClicks = 0;
}

describe('IconBtnComponent — loading（DS-12）', () => {
  let fixture: ComponentFixture<LoadingHostComponent>;
  const host = () => fixture.componentInstance;
  const button = () => fixture.nativeElement.querySelector('button.icon-btn') as HTMLButtonElement;
  const spinner = () => fixture.nativeElement.querySelector('app-spinner') as HTMLElement | null;
  const proj = () => fixture.nativeElement.querySelector('.proj') as HTMLElement;
  const set = (patch: Partial<LoadingHostComponent>) => { Object.assign(host(), patch); fixture.detectChanges(); };

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingHostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => { fixture.nativeElement.remove(); fixture.destroy(); });

  it('沒有 loading：顯示投影的圖示，沒有轉圈、沒有 aria-busy', () => {
    expect(proj().getClientRects().length).toBeGreaterThan(0);
    expect(spinner()).toBeNull();
    expect(button().hasAttribute('aria-busy')).toBeFalse();
    expect(button().hasAttribute('aria-disabled')).toBeFalse();
  });

  it('loading：轉圈取代圖示，轉圈是裝飾用', () => {
    set({ loading: true });
    expect(proj().getClientRects().length).toBe(0);
    expect(spinner()).not.toBeNull();
    expect(spinner()!.getAttribute('aria-hidden')).toBe('true');
  });

  it('loading：aria-busy＝true、aria-disabled＝true，沒有原生 disabled', () => {
    set({ loading: true });
    expect(button().getAttribute('aria-busy')).toBe('true');
    expect(button().getAttribute('aria-disabled')).toBe('true');
    expect(button().disabled).toBeFalse();
  });

  it('loading 又 disabled：以 disabled 為準（原生 disabled，不另外輸出 aria-disabled）', () => {
    set({ loading: true, disabled: true });
    expect(button().disabled).toBeTrue();
    expect(button().hasAttribute('aria-disabled')).toBeFalse();
  });

  it('loading：點了不送出 btnClick；結束後恢復', () => {
    set({ loading: true });
    button().click();
    expect(host().clicks).toBe(0);
    set({ loading: false });
    button().click();
    expect(host().clicks).toBe(1);
  });

  it('載入前有焦點，載入中焦點還在按鈕上', () => {
    button().focus();
    expect(document.activeElement).toBe(button());
    set({ loading: true });
    expect(document.activeElement).toBe(button());
  });

  it('loading：不淡化；滑鼠事件不落在按鈕上（滑過不變色）', () => {
    set({ loading: true });
    expect(getComputedStyle(button()).opacity).toBe('1');
    expect(getComputedStyle(button()).pointerEvents).toBe('none');
  });

  it('PrimaryFilled loading 也不淡化', () => {
    set({ propClass: 'PrimaryFilled', size: '12', loading: true });
    expect(getComputedStyle(button()).opacity).toBe('1');
  });

  it('Modal loading：轉圈是白色（Modal 放在深色底上）', () => {
    set({ propClass: 'Modal', loading: true });
    expect(getComputedStyle(spinner()!).color).toBe('rgb(255, 255, 255)');
  });

  it('Icon+Text loading：文字標籤留著', () => {
    set({ propClass: 'Icon+Text', loading: true });
    const label = fixture.nativeElement.querySelector('.icon-btn__label') as HTMLElement;
    expect(label.textContent?.trim()).toBe('列印');
  });

  const sizes: Array<[LoadingHostComponent['size'], string]> = [
    ['12', '12'], ['16-', '16'], ['16', '16'], ['24', '24'], ['32', '24'], ['36', '36'], ['48', '36'],
  ];
  for (const [size, px] of sizes) {
    it(`size=${size} 的轉圈預設 ${px}px`, () => {
      set({ size, loading: true });
      expect(spinner()!.querySelector('svg')!.getAttribute('width')).toBe(px);
    });
  }

  it('loadingSize 指定轉圈大小（圖示比按鈕的圖示位置小時用）', () => {
    set({ size: '24', loadingSize: '16', loading: true });
    expect(spinner()!.querySelector('svg')!.getAttribute('width')).toBe('16');
  });

  // ── 第一輪審查：click 不外傳 ──
  // 載入中按鈕 pointer-events: none，滑鼠實際點到的是外框 div；鍵盤 Enter／空白鍵在按鈕上也會發出原生 click。兩條都要擋。
  it('loading：點按鈕（含鍵盤觸發的 click），外層綁的 (click) 收不到', () => {
    set({ loading: true });
    button().click();
    expect(host().hostClicks).toBe(0);
  });

  it('loading：點外框（滑鼠實際點到的地方），外層綁的 (click) 收不到', () => {
    set({ loading: true });
    (fixture.nativeElement.querySelector('.icon-btn-wrap') as HTMLElement).click();
    expect(host().hostClicks).toBe(0);
  });

  it('沒有 loading：外層綁的 (click) 照常收到', () => {
    button().click();
    expect(host().hostClicks).toBe(1);
  });

  // ── 第一輪審查：loadingLabel（報讀軟體念出在等什麼） ──
  const statusEl = () => fixture.nativeElement.querySelector('app-icon-btn [role="status"]') as HTMLElement | null;

  it('沒設 loadingLabel：沒有 role="status"', () => {
    set({ loading: true });
    expect(statusEl()).toBeNull();
  });

  it('設了 loadingLabel、還沒載入：已經有一個空的 role="status"，在按鈕外面', () => {
    set({ loadingLabel: '產生 PDF 中…' });
    expect(statusEl()).not.toBeNull();
    expect(statusEl()!.textContent?.trim()).toBe('');
    expect(button().contains(statusEl())).toBeFalse();
  });

  it('載入中：同一個 status 填入 loadingLabel；結束後清空', () => {
    set({ loadingLabel: '產生 PDF 中…' });
    const before = statusEl();
    set({ loading: true });
    expect(statusEl()).toBe(before);
    expect(statusEl()!.textContent?.trim()).toBe('產生 PDF 中…');
    set({ loading: false });
    expect(statusEl()!.textContent?.trim()).toBe('');
  });

  it('status 視覺上隱藏（不佔版面）', () => {
    set({ loadingLabel: '產生 PDF 中…', loading: true });
    const rect = statusEl()!.getBoundingClientRect();
    expect(rect.width).toBeLessThanOrEqual(1);
    expect(rect.height).toBeLessThanOrEqual(1);
  });
});
