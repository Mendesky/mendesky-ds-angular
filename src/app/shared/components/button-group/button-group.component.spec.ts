import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ButtonGroupColor, ButtonGroupComponent, ButtonGroupOption } from './button-group.component';

/**
 * app-button-group 契約（2026-11-20，原型 https://claude.ai/artifact/9Qq2vZe7n7VFwFFZfJ8V6m 白底建議 1＋下載建議 1）：
 * - 選項有 icon：按鈕只放 app-icon，選項名稱當 aria-label 與滑過提示；沒有 icon 照舊顯示文字。
 * - 檢視型：白底槽、1px #e7e7e7 內框、2px 內距與間距。沒選中的圖示 #939393、文字 #686868。
 * - 檢視型選中：color 預設 neutral＝#686868；primary＝#1a6489；字與圖示白色。
 * - 檢視型分隔線：只畫在兩顆都沒選中的按鈕之間。
 * - 檢視型選中按鈕的焦點框白色（藍框在深底上不到 3:1）。
 * - 圖示按鈕是正方形：S 24、M 28、L 32；槽比按鈕高 4px。
 * - 表單型、圓角型外觀不變。
 * 全部從真的 DOM 與 computed style 查。
 */
@Component({
  standalone: true,
  imports: [ButtonGroupComponent],
  template: `
    <div style="padding:16px;background:#eef1f5">
      <app-button-group data-testid="g" [type]="type" [size]="size" [color]="color"
        [options]="options" [value]="value" [disabled]="disabled"
        (valueChange)="changes.push($event); value = $event"></app-button-group>
    </div>
  `,
})
class HostComponent {
  type: 'form' | 'round' | 'view' = 'view';
  size: 'S' | 'M' | 'L' = 'M';
  color: ButtonGroupColor = 'neutral';
  options: ButtonGroupOption[] = [
    { value: 'list', label: '清單', icon: 'Table' },
    { value: 'grid', label: '格狀', icon: 'Kanban' },
    { value: 'board', label: '看板', icon: 'Dashboard' },
  ];
  value: string | null = 'list';
  disabled = false;
  changes: string[] = [];
}

const TEXT_OPTIONS: ButtonGroupOption[] = [
  { value: 's', label: '小' }, { value: 'm', label: '中' }, { value: 'l', label: '大' },
];

/**
 * 把 button-group 的樣式表複製一份，把 :hover／:active／:focus-visible 換成 class，就能在 Karma 裡「按住」「滑過」。
 * unwrap 給媒體條件時，該 @media 裡的規則直接攤平（Karma 切不了系統設定），用來量強制色彩與減少動態。
 * 寫法同 menu-item.component.spec.ts 的 emulateForcedColorsCascade。
 */
function emulateCascade(unwrap?: string): () => void {
  const isTarget = (r: CSSRule): r is CSSMediaRule =>
    !!unwrap && r instanceof CSSMediaRule && r.conditionText.includes(unwrap);
  const sheets = Array.from(document.styleSheets).filter((sheet) => {
    try {
      return Array.from(sheet.cssRules).some((r) => r.cssText.includes('.btn-group--view'));
    } catch {
      return false;
    }
  });
  const clones = sheets.map((sheet) => {
    const css = Array.from(sheet.cssRules)
      .map((r) => (isTarget(r) ? Array.from(r.cssRules).map((x) => x.cssText).join('\n') : r.cssText))
      .join('\n')
      .replace(/:hover/g, '.t-hover')
      .replace(/:active/g, '.t-active')
      .replace(/:focus-visible/g, '.t-focus')
      // 量顏色時不要量到漸變的起點；量減少動態時另外讀原始規則，不加這行
      + (unwrap?.includes('reduced-motion') ? '' : '\n.btn-group__item { transition: none !important; }');
    const el = document.createElement('style');
    el.textContent = css;
    const owner = sheet.ownerNode as Element;
    owner.parentNode!.insertBefore(el, owner.nextSibling);
    sheet.disabled = true;
    return el;
  });
  expect(sheets.length).withContext('含 view 型規則的樣式表').toBeGreaterThan(0);
  return () => {
    clones.forEach((el) => el.remove());
    sheets.forEach((sheet) => (sheet.disabled = false));
  };
}

/** 系統色（Highlight、GrayText 這類）在這個瀏覽器算出來的顏色 */
function systemColor(name: string): string {
  const probe = document.createElement('div');
  probe.style.color = name;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

describe('ButtonGroupComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const root = () => fixture.nativeElement as HTMLElement;
  const group = () => root().querySelector('.btn-group') as HTMLElement;
  const items = () => Array.from(root().querySelectorAll<HTMLButtonElement>('.btn-group__item'));
  const cs = (el: Element, pseudo?: string) => getComputedStyle(el, pseudo);
  const set = (patch: Partial<HostComponent>) => { Object.assign(host, patch); fixture.detectChanges(); };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('選項內容', () => {
    it('有 icon：按鈕只放圖示，選項名稱當 aria-label', () => {
      items().forEach((b, i) => {
        expect(b.querySelector('app-icon')).withContext(`第 ${i + 1} 顆要有圖示`).not.toBeNull();
        expect(b.textContent!.trim()).withContext('不顯示文字').toBe('');
        expect(b.getAttribute('aria-label')).toBe(host.options[i].label);
      });
    });

    it('沒有 icon：照舊顯示文字，不加 aria-label', () => {
      set({ options: TEXT_OPTIONS, value: 'm' });
      items().forEach((b, i) => {
        expect(b.querySelector('app-icon')).toBeNull();
        expect(b.textContent!.trim()).toBe(TEXT_OPTIONS[i].label);
        expect(b.hasAttribute('aria-label')).toBeFalse();
      });
    });
  });

  describe('檢視型外觀', () => {
    it('白底槽、1px #e7e7e7 內框、2px 內距與間距', () => {
      const g = cs(group());
      expect(g.backgroundColor).toBe('rgb(255, 255, 255)');
      expect(g.boxShadow).toContain('rgb(231, 231, 231)');
      expect(g.boxShadow).toContain('inset');
      expect(g.paddingTop).toBe('2px');
      expect(g.columnGap).toBe('2px');
    });

    it('沒選中：圖示 #939393、文字 #686868', () => {
      expect(cs(items()[1]).color).toBe('rgb(147, 147, 147)');
      set({ options: TEXT_OPTIONS, value: 'm' });
      expect(cs(items()[0]).color).toBe('rgb(104, 104, 104)');
    });

    it('選中：預設深灰 #686868、白字；滑過色不影響沒選中的底色', () => {
      const sel = cs(items()[0]);
      expect(sel.backgroundColor).toBe('rgb(104, 104, 104)');
      expect(sel.color).toBe('rgb(255, 255, 255)');
      expect(cs(items()[1]).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('color="primary"：選中深藍 #1a6489、白圖示', () => {
      set({ color: 'primary' });
      const sel = cs(items()[0]);
      expect(sel.backgroundColor).toBe('rgb(26, 100, 137)');
      expect(sel.color).toBe('rgb(255, 255, 255)');
    });

    it('分隔線只畫在兩顆都沒選中的按鈕之間', () => {
      // 選第 1 顆：第 2、3 顆之間有線；第 1、2 顆之間沒有
      expect(cs(items()[1], '::before').content).toBe('none');
      expect(cs(items()[2], '::before').content).not.toBe('none');
      expect(cs(items()[2], '::before').width).toBe('1px');
      // 選中間那顆：兩側都沒有線
      set({ value: 'grid' });
      expect(cs(items()[1], '::before').content).toBe('none');
      expect(cs(items()[2], '::before').content).toBe('none');
      // 都沒選：兩條都有
      set({ value: null });
      expect(cs(items()[1], '::before').content).not.toBe('none');
      expect(cs(items()[2], '::before').content).not.toBe('none');
    });

    it('選中按鈕取得鍵盤焦點時，焦點框是白色；沒選中的維持藍色', () => {
      items()[0].focus();
      expect(items()[0].matches(':focus-visible')).toBeTrue();
      expect(cs(items()[0]).outlineColor).toBe('rgb(255, 255, 255)');
      items()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(document.activeElement).toBe(items()[1]);
      expect(cs(items()[1]).outlineColor).toBe('rgb(58, 156, 205)');
    });

    for (const [size, btn] of [['S', 24], ['M', 28], ['L', 32]] as const) {
      it(`尺寸 ${size}：圖示按鈕 ${btn}×${btn}，槽高 ${btn + 4}`, () => {
        set({ size });
        const r = items()[1].getBoundingClientRect();
        expect(Math.round(r.width)).toBe(btn);
        expect(Math.round(r.height)).toBe(btn);
        expect(Math.round(group().getBoundingClientRect().height)).toBe(btn + 4);
      });
    }
  });

  describe('按住、強制色彩、減少動態（複製樣式表模擬）', () => {
    let restore: (() => void) | null = null;
    afterEach(() => { restore?.(); restore = null; });
    const press = (b: HTMLElement) => b.classList.add('t-hover', 't-active');

    for (const color of ['neutral', 'primary'] as const) {
      const bg = color === 'primary' ? 'rgb(26, 100, 137)' : 'rgb(104, 104, 104)';
      it(`按住沒選中的選項（${color}）：底色變深、字與圖示白色，不會跟底色同色`, () => {
        set({ color });
        restore = emulateCascade();
        const icon = items()[1];
        press(icon);
        expect(cs(icon).backgroundColor).withContext('圖示選項底色').toBe(bg);
        expect(cs(icon).color).withContext('圖示選項字色').toBe('rgb(255, 255, 255)');
        set({ options: TEXT_OPTIONS, value: 's' });
        const text = items()[1];
        press(text);
        expect(cs(text).backgroundColor).withContext('文字選項底色').toBe(bg);
        expect(cs(text).color).withContext('文字選項字色').toBe('rgb(255, 255, 255)');
      });
    }

    it('滑過沒選中的選項（沒按住）：只加深字色，不加底色', () => {
      restore = emulateCascade();
      items()[1].classList.add('t-hover');
      expect(cs(items()[1]).color).toBe('rgb(104, 104, 104)');
      expect(cs(items()[1]).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      set({ options: TEXT_OPTIONS, value: 's' });
      items()[1].classList.add('t-hover');
      expect(cs(items()[1]).color).toBe('rgb(83, 83, 83)');
    });

    for (const color of ['neutral', 'primary'] as const) {
      it(`強制色彩（${color}）：選中是系統反白色，按住、焦點、整組停用都不變；焦點框用反白字色`, () => {
        set({ color });
        restore = emulateCascade('forced-colors: active');
        const highlight = systemColor('Highlight');
        const highlightText = systemColor('HighlightText');
        const grayText = systemColor('GrayText');
        expect(highlight).not.toBe(highlightText);
        const sel = items()[0];
        for (const state of [[], ['t-hover', 't-active'], ['t-focus']]) {
          sel.classList.remove('t-hover', 't-active', 't-focus');
          sel.classList.add(...state);
          const ctx = state.join('+') || '平常';
          expect(cs(sel).backgroundColor).withContext(`${ctx} 底色`).toBe(highlight);
          expect(cs(sel).color).withContext(`${ctx} 字色`).toBe(highlightText);
        }
        expect(cs(sel).outlineColor).withContext('焦點框').toBe(highlightText);
        sel.classList.remove('t-focus');
        expect(cs(items()[2], '::before').backgroundColor).withContext('分隔線').toBe(systemColor('CanvasText'));

        set({ disabled: true });
        expect(cs(items()[0]).backgroundColor).withContext('整組停用：選中底色').toBe(highlight);
        expect(cs(items()[0]).color).withContext('整組停用：選中字色').toBe(highlightText);
        expect(cs(items()[1]).color).withContext('整組停用：沒選中字色').toBe(grayText);
      });
    }

    it('減少動態：拿掉轉場；平常有轉場', () => {
      expect(cs(items()[1]).transitionDuration).withContext('平常').not.toBe('0s');
      restore = emulateCascade('prefers-reduced-motion: reduce');
      expect(cs(items()[1]).transitionDuration.split(',').every(d => d.trim() === '0s')).withContext(cs(items()[1]).transitionDuration).toBeTrue();
    });
  });

  describe('滑過提示', () => {
    const tooltips = () => document.body.querySelectorAll('app-tooltip-portal');
    afterEach(() => tooltips().forEach(t => t.remove()));

    it('圖示選項：滑過 300ms 後在下方出現選項名稱', fakeAsync(() => {
      items()[1].dispatchEvent(new MouseEvent('mouseenter'));
      tick(300);
      fixture.detectChanges();
      expect(tooltips().length).toBe(1);
      expect(tooltips()[0].textContent).toContain('格狀');
      items()[1].dispatchEvent(new MouseEvent('mouseleave'));
      tick(500);
    }));

    it('文字選項：滑過不出提示（字已經在畫面上）', fakeAsync(() => {
      set({ options: TEXT_OPTIONS, value: 's' });
      items()[1].dispatchEvent(new MouseEvent('mouseenter'));
      tick(300);
      fixture.detectChanges();
      expect(tooltips().length).toBe(0);
    }));
  });

  describe('開發模式提醒', () => {
    it('只放圖示的選項被停用（單一選項或整組）時提醒一次；文字選項停用不提醒', () => {
      const warn = spyOn(console, 'warn');
      set({ options: TEXT_OPTIONS.map((o, i) => ({ ...o, disabled: i === 1 })), value: 's' });
      expect(warn).not.toHaveBeenCalled();
      set({ options: [
        { value: 'list', label: '清單', icon: 'Table' },
        { value: 'grid', label: '格狀', icon: 'Kanban', disabled: true },
      ], value: 'list' });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.calls.mostRecent().args[0]).toContain('格狀');
      set({ disabled: true });
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('整組停用、選項只放圖示：也提醒', () => {
      const warn = spyOn(console, 'warn');
      set({ disabled: true });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.calls.mostRecent().args[0]).toContain('清單');
    });
  });

  describe('鍵盤', () => {
    it('Tab 只停在選中那顆；方向鍵換焦點，Space 選取', () => {
      expect(items().map(b => b.tabIndex)).toEqual([0, -1, -1]);
      items()[0].focus();
      items()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(document.activeElement).toBe(items()[2]);
      items()[2].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      fixture.detectChanges();
      expect(host.changes).toEqual(['board']);
      expect(items()[2].getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('其他型不受影響', () => {
    it('表單型：選中綠色、槽有框', () => {
      set({ type: 'form', options: TEXT_OPTIONS, value: 'm' });
      expect(cs(items()[1]).backgroundColor).toBe('rgb(116, 174, 62)');
      expect(cs(group()).borderTopColor).toBe('rgb(231, 231, 231)');
      expect(cs(items()[2], '::before').content).toBe('none');
    });

    it('圓角型：選中深灰、color 不影響', () => {
      set({ type: 'round', options: TEXT_OPTIONS, value: 'm', color: 'primary' });
      expect(cs(items()[1]).backgroundColor).toBe('rgb(104, 104, 104)');
      expect(cs(items()[2], '::before').content).toBe('none');
    });
  });
});
