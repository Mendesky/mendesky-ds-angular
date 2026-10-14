import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NumberListComponent, NumberListAction } from './number-list.component';

/**
 * 截斷／換行／手機排法都由 media query 決定（tablet-landscape-down <1024、tablet-down <768），
 * 看的是「視窗寬」而不是元件寬。Karma 預設在 iframe 裡跑、寬度約 800px（已落在 <1024），
 * 所以每個版面測試都要自己設定 iframe 寬度，跑完還原。
 */
function setViewportWidth(px: number): () => void {
  const frame = window.frameElement as HTMLElement | null;
  if (!frame) throw new Error('需在 Karma 的 iframe 內執行，才能控制視窗寬度');
  const prev = frame.style.width;
  frame.style.width = `${px}px`;
  frame.getBoundingClientRect(); // 強制父文件重排，iframe 的 media query 才會跟著更新
  return () => { frame.style.width = prev; };
}

describe('NumberListComponent — edit 動作', () => {
  let fixture: ComponentFixture<NumberListComponent>;
  let component: NumberListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NumberListComponent);
    component = fixture.componentInstance;
  });

  function buttonLabels(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.nl-buttons .nl-action-btn'))
      .map((btn) => (btn as HTMLElement).textContent?.trim() ?? '');
  }

  it('actions 含 edit 時顯示「編輯」按鈕，點擊 emit edit', () => {
    fixture.componentRef.setInput('actions', ['edit'] satisfies NumberListAction[]);
    fixture.detectChanges();

    const emitted: NumberListAction[] = [];
    component.actionClick.subscribe((a) => emitted.push(a));
    const btn = fixture.nativeElement.querySelector('.nl-buttons .nl-action-btn') as HTMLButtonElement;
    btn.click();

    expect(buttonLabels()).toEqual(['編輯']);
    expect(emitted).toEqual(['edit']);
  });

  it('按鈕順序固定為 檢視 / 下載 / 編輯 / 刪除（刪除永遠在最右）', () => {
    fixture.componentRef.setInput('actions', ['delete', 'edit', 'download', 'view'] satisfies NumberListAction[]);
    fixture.detectChanges();

    expect(buttonLabels()).toEqual(['檢視', '下載', '編輯', '刪除']);
  });

  it('沒有 edit 時不顯示「編輯」', () => {
    fixture.componentRef.setInput('actions', ['view', 'delete'] satisfies NumberListAction[]);
    fixture.detectChanges();

    expect(buttonLabels()).not.toContain('編輯');
  });
});

describe('NumberListComponent — label / text 截斷（寬度 1024px 以上）', () => {
  let fixture: ComponentFixture<NumberListComponent>;
  let restoreViewport: () => void;

  const LONG = '這是一個非常非常長的檔案標題，窄欄放不下時必須截成刪節號而不是把卡片撐開';

  beforeEach(async () => {
    restoreViewport = setViewportWidth(1280);
    await TestBed.configureTestingModule({
      imports: [NumberListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NumberListComponent);
    (fixture.nativeElement as HTMLElement).style.display = 'block';
    (fixture.nativeElement as HTMLElement).style.width = '240px';
    document.body.appendChild(fixture.nativeElement);
  });

  afterEach(() => {
    (fixture.nativeElement as HTMLElement).remove();
    restoreViewport();
  });

  function el(selector: string): HTMLElement {
    return fixture.nativeElement.querySelector(selector) as HTMLElement;
  }

  it('label chip 放不下時截成「…」，不撐出列寬', () => {
    fixture.componentRef.setInput('label', LONG);
    fixture.componentRef.setInput('actions', []);
    fixture.detectChanges();

    const label = el('.nl-label');
    const style = getComputedStyle(label);
    expect(style.textOverflow).toBe('ellipsis');
    expect(style.overflow).toBe('hidden');
    expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(240);
  });

  it('label 真的被截斷時才可聚焦（tabindex=0），讓鍵盤也能看到全文', async () => {
    fixture.componentRef.setInput('label', LONG);
    fixture.componentRef.setInput('actions', []);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    expect(el('.nl-label').getAttribute('tabindex')).toBe('0');
  });

  it('label 沒被截斷時不可聚焦（不多一個無意義的 tab 停點）', async () => {
    fixture.componentRef.setInput('label', '短標題');
    fixture.componentRef.setInput('actions', []);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    expect(el('.nl-label').hasAttribute('tabindex')).toBeFalse();
  });

  it('text（檔名）被截斷時同樣可聚焦', async () => {
    fixture.componentRef.setInput('text', LONG + '.pdf');
    fixture.componentRef.setInput('actions', ['view', 'delete'] satisfies NumberListAction[]);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    expect(el('.nl-text').getAttribute('tabindex')).toBe('0');
  });
});

// ── 2026-10-13：窄螢幕換行、按鈕對齊檔名、手機兩行排法 ───────────────────────

/** 實際長度取自客戶文件原型的示意資料：標題約 40 字、檔名是沒有空白的長英文 */
const LONG_TITLE = '銀行對帳單 113 年 1–3 月（含外幣帳戶與定存明細，請審計組比對期末餘額後回填）';
const LONG_FILE = 'Bank_Statement_2024Q1_TWD_USD_FixedDeposit_Reconciliation_final_v3.pdf';

function centerY(node: Element): number {
  const r = node.getBoundingClientRect();
  return r.top + r.height / 2;
}

/** 檔名可能自己也換成好幾行；按鈕要對齊的是「檔名的最後一行」，用文字的行框量 */
function lastLineCenterY(node: Element): number {
  const range = document.createRange();
  range.selectNodeContents(node);
  const lines = Array.from(range.getClientRects());
  const last = lines[lines.length - 1];
  return last.top + last.height / 2;
}

async function settle(fixture: ComponentFixture<NumberListComponent>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((r) => requestAnimationFrame(() => r(null)));
}

function mount(viewport: number, hostWidth: number): {
  fixture: ComponentFixture<NumberListComponent>;
  q: (selector: string) => HTMLElement;
  cleanup: () => void;
} {
  const restoreViewport = setViewportWidth(viewport);
  const fixture = TestBed.createComponent(NumberListComponent);
  const hostEl = fixture.nativeElement as HTMLElement;
  hostEl.style.display = 'block';
  hostEl.style.width = `${hostWidth}px`;
  document.body.appendChild(hostEl);
  return {
    fixture,
    q: (selector) => hostEl.querySelector(selector) as HTMLElement,
    cleanup: () => { hostEl.remove(); restoreViewport(); },
  };
}

describe('NumberListComponent — 寬度小於 1024px：標題與檔名換行完整顯示', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NumberListComponent] }).compileComponents();
  });

  it('標題與檔名都不截斷，全文換行顯示，也不給 tab 停點', async () => {
    const { fixture, q, cleanup } = mount(900, 240);
    try {
      expect(window.matchMedia('(max-width: 1023px)').matches).withContext('視窗寬度沒有設成功').toBeTrue();

      fixture.componentRef.setInput('label', '短標題');
      fixture.componentRef.setInput('text', '短.pdf');
      fixture.componentRef.setInput('actions', []);
      await settle(fixture);
      const oneLineLabel = q('.nl-label').getBoundingClientRect().height;
      const oneLineText = q('.nl-text').getBoundingClientRect().height;

      fixture.componentRef.setInput('label', LONG_TITLE);
      fixture.componentRef.setInput('text', LONG_FILE);
      await settle(fixture);
      const label = q('.nl-label');
      const text = q('.nl-text');

      for (const node of [label, text]) {
        expect(getComputedStyle(node).whiteSpace).toBe('normal');
        expect(node.scrollWidth).toBeLessThanOrEqual(node.clientWidth + 1);
        expect(node.hasAttribute('tabindex')).toBeFalse();
      }
      expect(label.getBoundingClientRect().height).toBeGreaterThan(oneLineLabel * 1.5);
      expect(text.getBoundingClientRect().height).toBeGreaterThan(oneLineText * 1.5);
      expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(240);
    } finally {
      cleanup();
    }
  });
});

describe('NumberListComponent — 標題＋檔名＋按鈕的列：按鈕對齊檔名那一行', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NumberListComponent] }).compileComponents();
  });

  // 1280＝截斷模式、900＝換行模式；元件寬 360 讓標題與檔名一定折成兩行
  [1280, 900].forEach((viewport) => {
    it(`視窗 ${viewport}px：折成兩行時，按鈕與檔名最後一行的中線差 ≤ 2px（不卡在兩行中間）`, async () => {
      const { fixture, q, cleanup } = mount(viewport, 360);
      try {
        fixture.componentRef.setInput('label', LONG_TITLE);
        fixture.componentRef.setInput('text', LONG_FILE);
        fixture.componentRef.setInput('actions', ['view', 'edit', 'delete'] satisfies NumberListAction[]);
        await settle(fixture);

        const label = q('.nl-label').getBoundingClientRect();
        const text = q('.nl-text').getBoundingClientRect();
        expect(text.top).withContext('標題與檔名沒有折成兩行，這條測試沒有測到東西').toBeGreaterThanOrEqual(label.bottom);
        expect(Math.abs(centerY(q('.nl-buttons')) - lastLineCenterY(q('.nl-text')))).toBeLessThanOrEqual(2);
      } finally {
        cleanup();
      }
    });
  });

  it('沒有 label 的單行列維持置中', async () => {
    const { fixture, q, cleanup } = mount(1280, 360);
    try {
      fixture.componentRef.setInput('text', '401 營業稅申報書.pdf');
      fixture.componentRef.setInput('actions', ['view', 'delete'] satisfies NumberListAction[]);
      await settle(fixture);

      expect(q('.nl-row').classList.contains('nl-row--labeled')).toBeFalse();
      expect(getComputedStyle(q('.nl-row')).alignItems).toBe('center');
      expect(Math.abs(centerY(q('.nl-buttons')) - centerY(q('.nl-text')))).toBeLessThanOrEqual(1);
    } finally {
      cleanup();
    }
  });

  it('有 number／avatar／subview 的列不套用兩行排法（維持原排法）', async () => {
    const { fixture, q, cleanup } = mount(1280, 360);
    try {
      fixture.componentRef.setInput('label', '標題');
      fixture.componentRef.setInput('text', '檔名.pdf');
      fixture.componentRef.setInput('actions', ['download'] satisfies NumberListAction[]);
      fixture.componentRef.setInput('number1', '12');
      await settle(fixture);

      expect(q('.nl-row').classList.contains('nl-row--labeled')).toBeFalse();
    } finally {
      cleanup();
    }
  });
});

describe('NumberListComponent — 手機（小於 768px）', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NumberListComponent] }).compileComponents();
  });

  // 逐一跑常見手機寬（窄機也要涵蓋）；元件寬＝視窗扣掉 modal 與卡片內距約 48px
  [320, 360, 375, 390, 430].forEach((viewport) => {
    it(`視窗 ${viewport}px：標題獨佔第一行、用滿整列；檔名與按鈕在第二行且中線對齊`, async () => {
      const { fixture, q, cleanup } = mount(viewport, viewport - 48);
      try {
        expect(window.matchMedia('(max-width: 767px)').matches).withContext('視窗寬度沒有設成功').toBeTrue();

        fixture.componentRef.setInput('label', LONG_TITLE);
        fixture.componentRef.setInput('text', LONG_FILE);
        fixture.componentRef.setInput('actions', ['view', 'edit', 'delete'] satisfies NumberListAction[]);
        await settle(fixture);

        const label = q('.nl-label').getBoundingClientRect();
        const text = q('.nl-text').getBoundingClientRect();
        const buttons = q('.nl-buttons').getBoundingClientRect();

        expect(getComputedStyle(q('.nl-row')).display).toBe('grid');
        expect(buttons.top).withContext('按鈕不可和標題擠在同一行').toBeGreaterThanOrEqual(label.bottom);
        expect(text.top).toBeGreaterThanOrEqual(label.bottom);
        expect(label.right).withContext('標題要能伸到按鈕欄上方（用滿整列）').toBeGreaterThan(buttons.left);
        // 手機版照原型：按鈕與檔名在同一格線列，垂直置中於檔名（檔名換成多行時對齊整段的中線）
        expect(Math.abs(centerY(q('.nl-buttons')) - centerY(q('.nl-text')))).toBeLessThanOrEqual(2);
        expect(q('.nl-row').scrollWidth).withContext('不可撐出列寬').toBeLessThanOrEqual(q('.nl-row').clientWidth + 1);
      } finally {
        cleanup();
      }
    });
  });

  it('按鈕只留圖示：文字隱藏、按鈕寬 24px，按鈕名稱保留在 aria-label', async () => {
    const { fixture, q, cleanup } = mount(390, 342);
    try {
      fixture.componentRef.setInput('text', '401 營業稅申報書.pdf');
      fixture.componentRef.setInput('actions', ['view', 'download', 'edit', 'delete'] satisfies NumberListAction[]);
      await settle(fixture);

      const btns = Array.from(q('.nl-buttons').querySelectorAll<HTMLElement>('.nl-action-btn'));
      expect(btns.map((b) => b.getAttribute('aria-label'))).toEqual(['檢視', '下載', '編輯', '刪除']);
      for (const b of btns) {
        expect(getComputedStyle(b.querySelector('span') as HTMLElement).display).toBe('none');
        expect(b.getBoundingClientRect().width).toBe(24);
      }
    } finally {
      cleanup();
    }
  });

  it('寬螢幕維持「圖示＋文字」按鈕', async () => {
    const { fixture, q, cleanup } = mount(1280, 600);
    try {
      fixture.componentRef.setInput('text', '401 營業稅申報書.pdf');
      fixture.componentRef.setInput('actions', ['view', 'delete'] satisfies NumberListAction[]);
      await settle(fixture);

      const span = q('.nl-buttons .nl-action-btn span');
      expect(getComputedStyle(span).display).not.toBe('none');
      expect(span.textContent?.trim()).toBe('檢視');
    } finally {
      cleanup();
    }
  });
});
