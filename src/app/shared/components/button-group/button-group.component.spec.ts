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
 * - 圓角型外觀不變。
 * 2026-11-24 起（本體 #59 規格「選中的顏色看用途」）：
 * - 表單型也吃 color：不設或 progress＝綠 #74ae3e（填寫進度）；primary＝深藍 #1a6489；neutral＝深灰 #686868。
 * - 檢視型不設 color 是深灰；progress 也是深灰（檢視型不拿來作答）。
 * - 表單型深藍、深灰選中時焦點框白色；強制色彩下表單型選中改用系統反白色（三種顏色都是）。
 * 2026-11-24 起（帶選單的選項，原型「主管報價案件總覽」第二版的「合計｜分布 ▾｜走勢 ▾」）：
 * - 只有檢視型的文字選項能帶選單：字後面 12px 箭頭，右內距 L 6、M 4、S 3；有 icon 或不是檢視型不畫（開發模式提醒）。
 * - 沒選中時按＝選取；選中後再按＝開關選單（menuToggle），不再送 valueChange；選單開著時按（點外面先關）送的是關。
 * - 選中、帶選單那顆 aria-haspopup="menu"、aria-expanded 跟 menuOpen；報讀「走勢，目前：金額」、滑過提示「走勢：金額」。
 * - 選單開著時箭頭轉 180°；空白鍵同滑鼠按；menuAnchor() 給選單對齊。
 * 全部從真的 DOM 與 computed style 查。
 */
@Component({
  standalone: true,
  imports: [ButtonGroupComponent],
  template: `
    <div style="padding:16px;background:#eef1f5">
      <app-button-group data-testid="g" [type]="type" [size]="size" [color]="color"
        [options]="options" [value]="value" [disabled]="disabled" [errorMessage]="errorMessage" [menuOpen]="menuOpen"
        (valueChange)="changes.push($event); value = $event" (menuToggle)="toggles.push($event)"></app-button-group>
    </div>
  `,
})
class HostComponent {
  type: 'form' | 'round' | 'view' = 'view';
  size: 'S' | 'M' | 'L' = 'M';
  // 不設 color 時由型別決定預設（表單型綠、檢視型深灰），所以 host 預設不傳
  color: ButtonGroupColor | undefined = undefined;
  options: ButtonGroupOption[] = [
    { value: 'list', label: '清單', icon: 'Table' },
    { value: 'grid', label: '格狀', icon: 'Kanban' },
    { value: 'board', label: '看板', icon: 'Dashboard' },
  ];
  value: string | null = 'list';
  disabled = false;
  errorMessage = '';
  menuOpen = false;
  changes: string[] = [];
  toggles: boolean[] = [];
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

  describe('表單型的選中色（看用途）', () => {
    const GREEN = 'rgb(116, 174, 62)';
    const BLUE = 'rgb(26, 100, 137)';
    const GREY = 'rgb(104, 104, 104)';
    const WHITE = 'rgb(255, 255, 255)';
    // 從檢視型切過來時，框與底色有 0.15 秒漸變；量之前先讓漸變跑完，不然量到的是起點色
    const form = (patch: Partial<HostComponent> = {}) => {
      set({ type: 'form', options: TEXT_OPTIONS, value: 'm', ...patch });
      root().getAnimations({ subtree: true }).forEach((a) => a.finish());
    };

    it('不設 color：選中綠色、白字、槽有框（跟以前一樣）', () => {
      form();
      expect(cs(items()[1]).backgroundColor).toBe(GREEN);
      expect(cs(items()[1]).color).toBe(WHITE);
      expect(cs(group()).borderTopColor).toBe('rgb(231, 231, 231)');
      expect(cs(items()[2], '::before').content).toBe('none');
    });

    for (const [color, bg] of [['progress', GREEN], ['primary', BLUE], ['neutral', GREY]] as const) {
      it(`color="${color}"：選中 ${bg}、白字；沒選中的維持透明底、#686868 字`, () => {
        form({ color });
        expect(cs(items()[1]).backgroundColor).toBe(bg);
        expect(cs(items()[1]).color).toBe(WHITE);
        expect(cs(items()[0]).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(cs(items()[0]).color).toBe(GREY);
      });
    }

    for (const size of ['S', 'M', 'L'] as const) {
      it(`尺寸 ${size}：color="primary" 一樣是深藍`, () => {
        form({ color: 'primary', size });
        expect(cs(items()[1]).backgroundColor).toBe(BLUE);
      });
    }

    it('換顏色不改尺寸：三種顏色的按鈕高度、寬度都一樣', () => {
      const boxes = (['progress', 'primary', 'neutral'] as const).map((color) => {
        form({ color });
        const r = items()[1].getBoundingClientRect();
        return `${Math.round(r.width)}x${Math.round(r.height)}`;
      });
      expect(new Set(boxes).size).withContext(boxes.join(' / ')).toBe(1);
    });

    for (const color of ['primary', 'neutral'] as const) {
      it(`color="${color}"：選中那顆拿到鍵盤焦點時焦點框白色（藍框在深底上不到 3:1）`, () => {
        form({ color });
        items()[1].focus();
        expect(items()[1].matches(':focus-visible')).toBeTrue();
        expect(cs(items()[1]).outlineColor).toBe(WHITE);
      });
    }

    it('整組停用：選中的顏色不變，整組半透明', () => {
      form({ color: 'primary', disabled: true });
      expect(cs(items()[1]).backgroundColor).toBe(BLUE);
      expect(cs(group()).opacity).toBe('0.5');
    });

    it('有錯誤時：框變紅，選中的顏色不變', () => {
      form({ color: 'primary', errorMessage: '請選一項' });
      expect(cs(group()).borderTopColor).toBe('rgb(204, 82, 82)');
      expect(cs(items()[1]).backgroundColor).toBe(BLUE);
    });

    describe('滑過、強制色彩（複製樣式表模擬）', () => {
      let restore: (() => void) | null = null;
      afterEach(() => { restore?.(); restore = null; });

      for (const color of [undefined, 'primary', 'neutral'] as const) {
        it(`滑過沒選中的選項（color=${color ?? '不設'}）：淺灰底 #e7e7e7，跟選中色無關`, () => {
          form({ color });
          restore = emulateCascade();
          items()[0].classList.add('t-hover');
          expect(cs(items()[0]).backgroundColor).toBe('rgb(231, 231, 231)');
        });
      }

      for (const color of [undefined, 'progress', 'primary', 'neutral'] as const) {
        it(`強制色彩（color=${color ?? '不設'}）：選中是系統反白色，沒選中不是`, () => {
          form({ color });
          restore = emulateCascade('forced-colors: active');
          const highlight = systemColor('Highlight');
          expect(cs(items()[1]).backgroundColor).toBe(highlight);
          expect(cs(items()[1]).color).toBe(systemColor('HighlightText'));
          expect(cs(items()[0]).backgroundColor).not.toBe(highlight);
        });
      }
    });
  });

  describe('檢視型的 color="progress"', () => {
    it('跟不設一樣是深灰（檢視型不拿來作答）', () => {
      set({ color: 'progress' });
      expect(cs(items()[0]).backgroundColor).toBe('rgb(104, 104, 104)');
    });
  });

  describe('帶選單的選項', () => {
    const MENU_OPTIONS: ButtonGroupOption[] = [
      { value: 'cards', label: '合計' },
      { value: 'dist', label: '分布', menu: { hint: '金額' } },
      { value: 'trend', label: '走勢', menu: { hint: '件數' } },
    ];
    const arrow = (b: HTMLElement) => b.querySelector('.btn-group__menu-arrow') as HTMLElement | null;
    const component = () => fixture.debugElement.children[0].children[0].componentInstance as ButtonGroupComponent;
    const press = (b: HTMLElement) => { b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b.click(); fixture.detectChanges(); };
    beforeEach(() => set({ options: MENU_OPTIONS, value: 'cards' }));

    it('檢視型的文字選項：字後面一個 12px 箭頭，報讀不念箭頭', () => {
      expect(arrow(items()[0])).withContext('沒帶選單').toBeNull();
      for (const b of [items()[1], items()[2]]) {
        expect(arrow(b)).not.toBeNull();
        expect(arrow(b)!.getAttribute('aria-hidden')).toBe('true');
        expect(Math.round(arrow(b)!.getBoundingClientRect().width)).toBe(12);
        expect(b.textContent!.trim()).toBe(MENU_OPTIONS[items().indexOf(b)].label);
      }
    });

    for (const [size, right] of [['S', '3px'], ['M', '4px'], ['L', '6px']] as const) {
      it(`尺寸 ${size}：帶選單的右內距 ${right}（箭頭貼近邊）；沒帶選單的不變`, () => {
        set({ size });
        expect(cs(items()[1]).paddingRight).toBe(right);
        expect(cs(items()[0]).paddingRight).not.toBe(right);
      });
    }

    it('沒選中時按：選取，不開選單；選中後再按：開選單，不再選取', () => {
      press(items()[1]);
      expect(host.changes).toEqual(['dist']);
      expect(host.toggles).toEqual([]);
      press(items()[1]);
      expect(host.changes).toEqual(['dist']);
      expect(host.toggles).toEqual([true]);
    });

    it('選單開著時按：送「關」；按下時選單還開著、放開前已經被點外面關掉，也是送「關」（不會又打開）', () => {
      set({ value: 'dist', menuOpen: true });
      press(items()[1]);
      expect(host.toggles).toEqual([false]);
      items()[1].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      set({ menuOpen: false });
      items()[1].click();
      fixture.detectChanges();
      expect(host.toggles).toEqual([false, false]);
    });

    it('選中、帶選單那顆 aria-haspopup="menu"、aria-expanded 跟著選單；沒選中的沒有', () => {
      set({ value: 'dist' });
      expect(items()[1].getAttribute('aria-haspopup')).toBe('menu');
      expect(items()[1].getAttribute('aria-expanded')).toBe('false');
      set({ menuOpen: true });
      expect(items()[1].getAttribute('aria-expanded')).toBe('true');
      expect(items()[2].hasAttribute('aria-haspopup')).withContext('沒選中：按下去是選取').toBeFalse();
      expect(items()[0].hasAttribute('aria-expanded')).toBeFalse();
    });

    it('報讀名稱帶目前值：「分布，目前：金額」；沒帶選單的照舊不加 aria-label', () => {
      expect(items()[1].getAttribute('aria-label')).toBe('分布，目前：金額');
      expect(items()[2].getAttribute('aria-label')).toBe('走勢，目前：件數');
      expect(items()[0].hasAttribute('aria-label')).toBeFalse();
    });

    it('選單開著時箭頭轉 180°；關著不轉', () => {
      set({ value: 'dist' });
      // 量轉完的角度，不量轉場中間的值
      arrow(items()[1])!.style.transition = 'none';
      expect(cs(arrow(items()[1])!).transform).toBe('none');
      set({ menuOpen: true });
      fixture.detectChanges();
      const t = cs(arrow(items()[1])!).transform;
      expect(t === 'matrix(-1, 0, 0, -1, 0, 0)' || t.startsWith('matrix(-1, 1.2')).withContext(t).toBeTrue();
      expect(cs(arrow(items()[2])!).transform).withContext('沒選中的不轉').toBe('none');
    });

    it('空白鍵：沒選中＝選取；選中帶選單那顆＝開關選單', () => {
      items()[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      fixture.detectChanges();
      expect(host.changes).toEqual(['dist']);
      items()[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      fixture.detectChanges();
      expect(host.toggles).toEqual([true]);
    });

    it('menuAnchor()：選中、帶選單那顆；選中的沒帶選單、或整組停用時是 null', () => {
      expect(component().menuAnchor()).toBeNull();
      set({ value: 'trend' });
      expect(component().menuAnchor()).toBe(items()[2]);
      set({ disabled: true });
      expect(component().menuAnchor()).toBeNull();
    });

    it('滑過提示「分布：金額」（目前值不在畫面上）', fakeAsync(() => {
      items()[1].dispatchEvent(new MouseEvent('mouseenter'));
      tick(300);
      fixture.detectChanges();
      const tips = document.body.querySelectorAll('app-tooltip-portal');
      expect(tips.length).toBe(1);
      expect(tips[0].textContent).toContain('分布：金額');
      items()[1].dispatchEvent(new MouseEvent('mouseleave'));
      tick(500);
      tips.forEach(t => t.remove());
    }));

    it('只有檢視型的文字選項能帶：表單型、只放圖示的不畫箭頭，開發模式提醒一次', () => {
      const warn = spyOn(console, 'warn');
      set({ options: [{ value: 'a', label: '甲', icon: 'Table', menu: {} }, { value: 'b', label: '乙', icon: 'Kanban' }], value: 'a' });
      expect(arrow(items()[0])).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.calls.mostRecent().args[0]).toContain('甲');
      set({ type: 'form', options: MENU_OPTIONS, value: 'dist' });
      expect(arrow(items()[1])).toBeNull();
      press(items()[1]);
      expect(host.toggles).withContext('表單型按選中那顆不開選單').toEqual([]);
    });
  });

  describe('其他型不受影響', () => {

    it('圓角型：選中深灰、color 不影響', () => {
      set({ type: 'round', options: TEXT_OPTIONS, value: 'm', color: 'primary' });
      expect(cs(items()[1]).backgroundColor).toBe('rgb(104, 104, 104)');
      expect(cs(items()[2], '::before').content).toBe('none');
    });
  });
});
