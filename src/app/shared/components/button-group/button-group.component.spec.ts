import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ButtonGroupColor, ButtonGroupComponent, ButtonGroupOption } from './button-group.component';
import { ActionMenuComponent } from '../action-menu/action-menu.component';
import { MenuItemComponent } from '../menu-item/menu-item.component';

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
 * 2026-11-24 起（帶選單的選項，例：「合計｜分布 ▾｜走勢 ▾」）：
 * - 只有檢視型的文字選項能帶選單：字後面 12px 箭頭，右內距 L 6、M 4、S 3；有 icon 或不是檢視型不畫（開發模式提醒）。
 * - 沒選中時按＝選取；選中後再按（滑鼠、Enter、空白鍵）＝開關選單（menuToggle，依 menuOpen），不再送 valueChange；
 *   這一下 click 與 Enter 不往外冒，按住不放的連發不算；帶選單的選項按下空白鍵、Enter 後到放開前，連發不往下傳、
 *   放開取消預設動作（window 層，只攔這個鍵）；沒帶選單的選項不攔。
 *   選單開著時 value 被改掉（包括改成另一個帶選單的）或這顆沒了資格（停用）送「關」；同一輪才打開的（含第一次綁定）不算 value 被改掉。
 * - 選中、帶選單那顆 aria-haspopup="menu"、aria-expanded 跟 menuOpen；報讀「走勢，目前：金額」、滑過提示「走勢：金額」，選單開著時整組不提示。
 * - 選中、帶選單那顆滑過比選中深一階、按下再深一階（深灰 #535353／#333333、深藍 #0f4a67／#073045）；強制色彩下滑過底線、按下反白。
 * - 選單開著時箭頭轉 180°；menuAnchor() 給選單對齊（搭真的 app-action-menu 驗過開、關、Esc）。
 * 全部從真的 DOM 與 computed style 查。
 */
@Component({
  standalone: true,
  imports: [ButtonGroupComponent],
  template: `
    <div style="padding:16px;background:#eef1f5" (click)="outerClicks = outerClicks + 1" (keydown)="outerKeys.push($event.key)">
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
  /** 外層收到的 click 次數、keydown 的鍵：看哪些事件往外冒 */
  outerClicks = 0;
  outerKeys: string[] = [];
}

/** 搭真的 app-action-menu：照說明檔的用法（anchorEl＝menuAnchor()），選單開關由 menuToggle 決定 */
@Component({
  standalone: true,
  imports: [ButtonGroupComponent, ActionMenuComponent, MenuItemComponent],
  template: `
    <div style="padding:16px">
      <app-button-group #group type="view" size="M" [options]="options" [value]="value" (valueChange)="value = $event"
        [menuOpen]="menuOpen" (menuToggle)="toggles.push($event); menuOpen = $event"></app-button-group>
      @if (menuOpen) {
        <app-action-menu style="width:160px" [anchorEl]="group.menuAnchor()" ariaLabel="畫金額或件數" (closeMenu)="closes = closes + 1; menuOpen = false">
          <app-menu-item label="金額" [selected]="metric === 'amount'" (itemClick)="metric = 'amount'"></app-menu-item>
          <app-menu-item label="件數" [selected]="metric === 'count'" (itemClick)="metric = 'count'"></app-menu-item>
        </app-action-menu>
      }
    </div>
  `,
})
class MenuHostComponent {
  options: ButtonGroupOption[] = [
    { value: 'cards', label: '合計' },
    { value: 'dist', label: '分布', menu: { hint: '金額' } },
  ];
  value = 'dist';
  metric = 'amount';
  menuOpen = false;
  toggles: boolean[] = [];
  closes = 0;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

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

    for (const [color, selected, hover, active] of [
      ['neutral', 'rgb(104, 104, 104)', 'rgb(83, 83, 83)', 'rgb(51, 51, 51)'],
      ['primary', 'rgb(26, 100, 137)', 'rgb(15, 74, 103)', 'rgb(7, 48, 69)'],
    ] as const) {
      it(`選中、帶選單那顆（${color}）：滑過深一階、按下再深一階，字白色；選中但沒帶選單的滑過、按下不變`, () => {
        set({ color, options: [{ value: 'cards', label: '合計' }, { value: 'dist', label: '分布', menu: { hint: '金額' } }], value: 'dist' });
        restore = emulateCascade();
        const trigger = items()[1];
        expect(cs(trigger).backgroundColor).withContext('平常').toBe(selected);
        trigger.classList.add('t-hover');
        expect(cs(trigger).backgroundColor).withContext('滑過').toBe(hover);
        expect(cs(trigger).color).withContext('滑過字色').toBe('rgb(255, 255, 255)');
        trigger.classList.add('t-active');
        expect(cs(trigger).backgroundColor).withContext('按下').toBe(active);
        expect(cs(trigger).color).withContext('按下字色').toBe('rgb(255, 255, 255)');
        trigger.classList.remove('t-hover', 't-active');
        set({ value: 'cards' });
        const plain = items()[0];
        plain.classList.add('t-hover');
        expect(cs(plain).backgroundColor).withContext('選中沒帶選單：滑過').toBe(selected);
        plain.classList.add('t-active');
        expect(cs(plain).backgroundColor).withContext('選中沒帶選單：按下').toBe(selected);
      });

      it(`強制色彩（${color}）：選中、帶選單那顆滑過加底線（底仍是系統反白色）、按下反白；沒帶選單的不變`, () => {
        set({ color, options: [{ value: 'cards', label: '合計' }, { value: 'dist', label: '分布', menu: { hint: '金額' } }], value: 'dist' });
        restore = emulateCascade('forced-colors: active');
        const highlight = systemColor('Highlight');
        const highlightText = systemColor('HighlightText');
        const trigger = items()[1];
        expect(cs(trigger).textDecorationLine).withContext('平常沒底線').toBe('none');
        trigger.classList.add('t-hover');
        expect(cs(trigger).backgroundColor).withContext('滑過底色').toBe(highlight);
        expect(cs(trigger).textDecorationLine).withContext('滑過底線').toBe('underline');
        trigger.classList.add('t-active');
        expect(cs(trigger).backgroundColor).withContext('按下底色').toBe(highlightText);
        expect(cs(trigger).color).withContext('按下字色').toBe(highlight);
        trigger.classList.remove('t-hover', 't-active');
        set({ value: 'cards' });
        items()[0].classList.add('t-hover', 't-active');
        expect(cs(items()[0]).backgroundColor).withContext('選中沒帶選單：按住仍是系統反白色').toBe(highlight);
        expect(cs(items()[0]).textDecorationLine).toBe('none');
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
    // 測試中途失敗時，提示框可能留在 body 上，影響後面的測試（Karma 順序是隨機的）
    afterEach(() => document.body.querySelectorAll('app-tooltip-portal').forEach(t => t.remove()));

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

    it('選單開著時按：送「關」；關著時按：送「開」（看當下的 menuOpen）', () => {
      set({ value: 'dist', menuOpen: true });
      press(items()[1]);
      expect(host.toggles).toEqual([false]);
      set({ menuOpen: false });
      press(items()[1]);
      expect(host.toggles).toEqual([false, true]);
    });

    it('按下後沒有形成 click（拖出按鈕才放開、手機捲動送 pointercancel），之後用空白鍵、Enter 按：一次就打開，不會留下按下時的狀態', () => {
      set({ value: 'dist', menuOpen: true });
      items()[1].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      items()[1].dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
      set({ menuOpen: false });
      items()[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(host.toggles).toEqual([true]);
      items()[1].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      items()[1].dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
      items()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      expect(host.toggles).toEqual([true, true]);
    });

    it('觸發鈕的 click 不往外冒；沒選中（選取）的 click 照常往外冒', () => {
      press(items()[1]);
      expect(host.outerClicks).withContext('選取').toBe(1);
      press(items()[1]);
      expect(host.toggles).toEqual([true]);
      expect(host.outerClicks).withContext('開關選單').toBe(1);
      press(items()[0]);
      expect(host.outerClicks).withContext('選回沒帶選單的').toBe(2);
    });

    it('Enter：沒選中＝選取；選中帶選單那顆＝開關選單、擋原生 click、不往外冒；選中但沒帶選單的照舊往外冒（給 wizard 的 onFormEnter）', () => {
      const enter = (b: HTMLElement) => {
        const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        b.dispatchEvent(e);
        fixture.detectChanges();
        return e;
      };
      expect(enter(items()[1]).defaultPrevented).withContext('沒選中：選取').toBeTrue();
      expect(host.changes).toEqual(['dist']);
      host.outerKeys = [];
      const open = enter(items()[1]);
      expect(host.toggles).toEqual([true]);
      expect(open.defaultPrevented).withContext('擋原生 click，免得開了又關').toBeTrue();
      expect(host.outerKeys).withContext('開關選單的 Enter 不往外冒').toEqual([]);
      set({ menuOpen: true });
      enter(items()[1]);
      expect(host.toggles).toEqual([true, false]);
      set({ value: 'cards', menuOpen: false });
      const plain = enter(items()[0]);
      expect(plain.defaultPrevented).withContext('選中沒帶選單：不擋').toBeFalse();
      expect(host.outerKeys).withContext('選中沒帶選單：往外冒').toEqual(['Enter']);
    });

    it('按住空白鍵、Enter 不放（連發）：只算第一下，選單不會一直開開關關', () => {
      set({ value: 'dist' });
      for (const key of [' ', 'Enter']) {
        items()[1].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        items()[1].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, repeat: true }));
        items()[1].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, repeat: true }));
      }
      expect(host.toggles).toEqual([true, true]);
      expect(host.outerKeys).withContext('開關選單的 Enter（連發的也是）不往外冒').not.toContain('Enter');
    });

    it('按住空白鍵、Enter 時焦點才移到這組（沒先在這裡按下）：收到的連發不算，沒選中的不會被選取，Enter 也不往外冒', () => {
      set({ value: 'dist' });
      for (const k of [' ', 'Enter']) {
        items()[1].dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, repeat: true }));
      }
      items()[2].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true, repeat: true }));
      fixture.detectChanges();
      expect(host.toggles).withContext('觸發鈕不開關選單').toEqual([]);
      expect(host.changes).withContext('沒選中的不被選取').toEqual([]);
      expect(host.outerKeys).withContext('觸發鈕上的 Enter 連發不往外冒').not.toContain('Enter');
    });

    it('選單開著時 value 被改掉（改成另一個帶選單的、或沒帶選單的）或這顆沒了資格（整組停用、這一項停用）：送「關」；還是觸發鈕時不送', fakeAsync(() => {
      const step = (patch: Partial<HostComponent>) => { set(patch); flushMicrotasks(); return [...host.toggles]; };
      step({ value: 'dist' });
      expect(step({ menuOpen: true })).withContext('打開').toEqual([]);
      expect(step({ size: 'S' })).withContext('還是觸發鈕').toEqual([]);
      expect(step({ value: 'trend' })).withContext('value 改成另一個帶選單的').toEqual([false]);
      expect(step({ value: 'cards' })).withContext('value 改成沒帶選單的').toEqual([false, false]);
      host.toggles = [];
      step({ value: 'dist' });
      host.toggles = [];
      expect(step({ disabled: true })).withContext('整組停用').toEqual([false]);
      expect(step({ disabled: false, options: MENU_OPTIONS.map(o => ({ ...o, disabled: o.value === 'dist' })) })).withContext('這一項停用').toEqual([false, false]);
      host.toggles = [];
      step({ options: MENU_OPTIONS, menuOpen: false });
      expect(step({ value: 'trend' })).withContext('選單關著不送').toEqual([]);
    }));

    it('同一輪把 value 改成另一個帶選單的、menuOpen 從關改成開：不送「關」（選單跟著新的值開）；改成沒帶選單的又打開：送「關」', fakeAsync(() => {
      const step = (patch: Partial<HostComponent>) => { set(patch); flushMicrotasks(); return [...host.toggles]; };
      step({ value: 'dist' });
      expect(step({ value: 'trend', menuOpen: true })).withContext('改成另一個帶選單的又打開').toEqual([]);
      step({ menuOpen: false });
      expect(step({ value: 'cards', menuOpen: true })).withContext('改成沒帶選單的又打開：沒有觸發鈕').toEqual([false]);
    }));

    it('第一次綁定就是開的（例如從網址還原）：選中帶選單的不送「關」；選中沒帶選單的送「關」', fakeAsync(() => {
      const cases: Array<[string, boolean[]]> = [['dist', []], ['cards', [false]]];
      for (const [value, expected] of cases) {
        const f = TestBed.createComponent(HostComponent);
        Object.assign(f.componentInstance, { options: MENU_OPTIONS, value, menuOpen: true });
        f.detectChanges();
        flushMicrotasks();
        expect(f.componentInstance.toggles).withContext(value).toEqual(expected);
        f.destroy();
      }
    }));

    describe('按下空白鍵、Enter 後到放開前（window 層）', () => {
      let other: HTMLButtonElement;
      let otherKeys: string[];
      const key = (target: Element, type: 'keydown' | 'keyup', k: string, repeat = false) => {
        const e = new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true, repeat });
        target.dispatchEvent(e);
        fixture.detectChanges();
        return e;
      };
      beforeEach(() => {
        // 代表焦點已經移進選單的第一項：按鈕組以外的元素
        other = document.createElement('button');
        document.body.appendChild(other);
        otherKeys = [];
        other.addEventListener('keydown', (e) => otherKeys.push(e.key));
      });
      afterEach(() => other.remove());

      for (const k of [' ', 'Enter']) {
        const name = k === ' ' ? '空白鍵' : 'Enter';
        it(`${name}開關選單後：連發不往下傳、放開取消預設動作（焦點已移到別處也一樣）；放開之後就不再攔`, () => {
          set({ value: 'dist' });
          key(items()[1], 'keydown', k);
          expect(host.toggles).toEqual([true]);
          const repeat = key(other, 'keydown', k, true);
          expect(repeat.defaultPrevented).withContext('連發：取消預設動作').toBeTrue();
          expect(otherKeys).withContext('連發：不往下傳').toEqual([]);
          expect(key(other, 'keyup', k).defaultPrevented).withContext('放開：取消預設動作').toBeTrue();
          expect(key(other, 'keydown', k, true).defaultPrevented).withContext('放開之後：不再攔').toBeFalse();
          expect(key(other, 'keyup', k).defaultPrevented).withContext('放開之後：不再攔').toBeFalse();
          expect(host.toggles).toEqual([true]);
        });
      }

      it('空白鍵選取沒選中的帶選單選項：放開時取消預設動作（Firefox 放開時補的 click 不會把剛選中的選單打開）', () => {
        key(items()[1], 'keydown', ' ');
        expect(host.changes).toEqual(['dist']);
        expect(key(items()[1], 'keyup', ' ').defaultPrevented).toBeTrue();
        expect(host.toggles).toEqual([]);
      });

      it('按了新的一下、視窗失去焦點、元件被移除：都停止攔', () => {
        set({ value: 'dist' });
        key(items()[1], 'keydown', ' ');
        key(other, 'keydown', ' ');
        expect(key(other, 'keyup', ' ').defaultPrevented).withContext('按了新的一下').toBeFalse();
        key(items()[1], 'keydown', ' ');
        window.dispatchEvent(new Event('blur'));
        expect(key(other, 'keyup', ' ').defaultPrevented).withContext('視窗失去焦點').toBeFalse();
        key(items()[1], 'keydown', ' ');
        fixture.destroy();
        const up = new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true });
        other.dispatchEvent(up);
        expect(up.defaultPrevented).withContext('元件被移除').toBeFalse();
      });

      it('攔空白鍵的時候：別的鍵（Esc、方向鍵）照常往下傳、不取消預設動作；放開別的鍵也不停止攔', () => {
        set({ value: 'dist' });
        key(items()[1], 'keydown', ' ');
        expect(host.toggles).toEqual([true]);
        for (const k of ['Escape', 'ArrowDown']) {
          expect(key(other, 'keydown', k).defaultPrevented).withContext(`${k}：不取消`).toBeFalse();
          expect(key(other, 'keydown', k, true).defaultPrevented).withContext(`${k} 連發：不取消`).toBeFalse();
          expect(key(other, 'keyup', k).defaultPrevented).withContext(`放開 ${k}：不取消`).toBeFalse();
        }
        expect(otherKeys).withContext('別的鍵往下傳').toEqual(['Escape', 'Escape', 'ArrowDown', 'ArrowDown']);
        expect(key(other, 'keydown', ' ', true).defaultPrevented).withContext('空白鍵連發：還在攔').toBeTrue();
        expect(key(other, 'keyup', ' ').defaultPrevented).withContext('放開空白鍵：還在攔').toBeTrue();
      });

      it('攔空白鍵的時候按了 Enter：改攔 Enter，空白鍵不再攔', () => {
        set({ value: 'dist' });
        key(items()[1], 'keydown', ' ');
        key(items()[1], 'keydown', 'Enter');
        expect(host.toggles).toEqual([true, true]);
        expect(key(other, 'keydown', ' ', true).defaultPrevented).withContext('空白鍵連發：不再攔').toBeFalse();
        expect(key(other, 'keyup', ' ').defaultPrevented).withContext('放開空白鍵：不再攔').toBeFalse();
        expect(key(other, 'keydown', 'Enter', true).defaultPrevented).withContext('Enter 連發：攔').toBeTrue();
        expect(key(other, 'keyup', 'Enter').defaultPrevented).withContext('放開 Enter：攔').toBeTrue();
      });

      const plainCases: Array<[string, Partial<HostComponent>, number]> = [
        ['檢視型沒帶選單的', { value: 'dist' }, 0],
        ['表單型', { type: 'form', options: TEXT_OPTIONS, value: 's' }, 1],
        ['圓角型', { type: 'round', options: TEXT_OPTIONS, value: 's' }, 1],
      ];
      for (const [name, patch, idx] of plainCases) {
        it(`${name}選項按空白鍵選取：不攔（連發照常往下傳、不取消預設動作；放開不取消預設動作）`, () => {
          set(patch);
          key(items()[idx], 'keydown', ' ');
          expect(host.changes.length).withContext('選取').toBe(1);
          expect(key(other, 'keydown', ' ', true).defaultPrevented).withContext('連發：不取消').toBeFalse();
          expect(otherKeys).withContext('連發：往下傳').toEqual([' ']);
          expect(key(other, 'keyup', ' ').defaultPrevented).withContext('放開：不取消').toBeFalse();
        });
      }
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

    it('沒選中的帶選單選項：報讀帶目前值，但沒有 aria-haspopup／aria-expanded（按下去是選取）；menu 沒給 hint：不加 aria-label、不提示', fakeAsync(() => {
      expect(items()[2].getAttribute('aria-label')).toBe('走勢，目前：件數');
      expect(items()[2].hasAttribute('aria-haspopup')).toBeFalse();
      expect(items()[2].hasAttribute('aria-expanded')).toBeFalse();
      set({ options: [{ value: 'cards', label: '合計' }, { value: 'dist', label: '分布', menu: {} }], value: 'dist' });
      expect(arrow(items()[1])).withContext('沒給 hint 也畫箭頭').not.toBeNull();
      expect(items()[1].hasAttribute('aria-label')).toBeFalse();
      expect(items()[1].getAttribute('aria-haspopup')).toBe('menu');
      items()[1].dispatchEvent(new MouseEvent('mouseenter'));
      tick(300);
      fixture.detectChanges();
      expect(document.body.querySelectorAll('app-tooltip-portal').length).toBe(0);
    }));

    it('表單型帶 hint：不畫箭頭、不加 aria-label、不提示、按選中那顆不開選單', fakeAsync(() => {
      spyOn(console, 'warn');
      set({ type: 'form', value: 'dist' });
      expect(arrow(items()[1])).toBeNull();
      expect(items()[1].hasAttribute('aria-label')).toBeFalse();
      expect(items()[1].hasAttribute('aria-haspopup')).toBeFalse();
      items()[1].dispatchEvent(new MouseEvent('mouseenter'));
      tick(300);
      fixture.detectChanges();
      expect(document.body.querySelectorAll('app-tooltip-portal').length).toBe(0);
      press(items()[1]);
      expect(host.toggles).toEqual([]);
    }));

    it('選單開著時整組不出提示（提示和選單都往下出）；已經出來的提示在選單打開時收起；選單關了照常提示', fakeAsync(() => {
      const tips = () => document.body.querySelectorAll('app-tooltip-portal');
      set({ value: 'dist' });
      items()[1].dispatchEvent(new MouseEvent('mouseenter'));
      tick(300);
      fixture.detectChanges();
      expect(tips().length).withContext('選單關著：照常提示').toBe(1);
      set({ menuOpen: true });
      expect(tips().length).withContext('選單打開：收起').toBe(0);
      items()[1].dispatchEvent(new MouseEvent('mouseleave'));
      items()[1].dispatchEvent(new MouseEvent('mouseenter'));
      tick(300);
      fixture.detectChanges();
      expect(tips().length).withContext('選單開著時再滑進來：不提示').toBe(0);
      items()[2].dispatchEvent(new MouseEvent('mouseenter'));
      tick(300);
      fixture.detectChanges();
      expect(tips().length).withContext('選單開著時旁邊的選項也不提示（選單比按鈕寬，會疊到）').toBe(0);
      items()[2].dispatchEvent(new MouseEvent('mouseleave'));
      set({ menuOpen: false });
      items()[2].dispatchEvent(new MouseEvent('mouseenter'));
      tick(300);
      fixture.detectChanges();
      expect(tips().length).withContext('選單關了：照常提示').toBe(1);
      items()[2].dispatchEvent(new MouseEvent('mouseleave'));
      tick(500);
      tips().forEach(t => t.remove());
    }));

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

    it('只放圖示的選項帶 menu：不畫箭頭，開發模式提醒一次（之後再換選項也不重複提醒）', () => {
      const warn = spyOn(console, 'warn');
      set({ options: [{ value: 'a', label: '甲', icon: 'Table', menu: {} }, { value: 'b', label: '乙', icon: 'Kanban' }], value: 'a' });
      expect(arrow(items()[0])).toBeNull();
      expect(items()[0].hasAttribute('aria-haspopup')).withContext('選中也不是選單觸發鈕').toBeFalse();
      expect(component().menuAnchor()).toBeNull();
      press(items()[0]);
      expect(host.toggles).withContext('按選中那顆不開選單').toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.calls.mostRecent().args[0]).toContain('甲');
      set({ options: [{ value: 'c', label: '丙', icon: 'Table', menu: {} }], value: 'c' });
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('表單型帶 menu：開發模式提醒一次（點名那一項），之後再換選項不重複提醒；檢視型文字選項帶 menu 不提醒', () => {
      const warn = spyOn(console, 'warn');
      expect(warn).not.toHaveBeenCalled();
      set({ type: 'form', value: 'dist' });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.calls.mostRecent().args[0]).toContain('分布');
      set({ options: [...MENU_OPTIONS], value: 'trend' });
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('搭真的 app-action-menu（說明檔的用法：anchorEl＝menuAnchor()）', () => {
    let menuFixture: ComponentFixture<MenuHostComponent>;
    let menuHost: MenuHostComponent;
    const trigger = () => (menuFixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.btn-group__item')[1];
    const menu = () => document.body.querySelector('app-action-menu') as HTMLElement | null;
    /** 照真的點擊順序送：pointerdown（定位服務在 document 上判斷點外面）→ pointerup → click */
    const click = async (b: HTMLElement) => {
      b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
      b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, composed: true }));
      b.click();
      menuFixture.detectChanges();
      await nextFrame();
      await nextFrame();
      menuFixture.detectChanges();
    };
    const key = async (target: Element, k: string, repeat = false) => {
      target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, repeat }));
      menuFixture.detectChanges();
      await nextFrame();
      await nextFrame();
      menuFixture.detectChanges();
    };

    beforeEach(() => {
      menuFixture = TestBed.createComponent(MenuHostComponent);
      menuHost = menuFixture.componentInstance;
      menuFixture.detectChanges();
    });
    afterEach(() => {
      menuHost.menuOpen = false;
      menuFixture.detectChanges();
      menuFixture.destroy();
      document.body.querySelectorAll('app-tooltip-portal, app-action-menu').forEach(t => t.remove());
    });

    it('按選中那顆：打開、選單貼著這顆、左緣對齊；再按一次：只送一次「關」、選單關上不會又打開，焦點回到按鈕', async () => {
      await click(trigger());
      expect(menuHost.toggles).toEqual([true]);
      expect(menu()).withContext('選單打開').not.toBeNull();
      // 選單打開有 150ms 的縮放動畫，等它跑完再量位置
      await new Promise((r) => setTimeout(r, 200));
      const b = trigger().getBoundingClientRect();
      const m = menu()!.getBoundingClientRect();
      // 下方放不下時定位服務會翻到上方（測試頁面裡按鈕的位置會受前面的測試影響），兩種都算貼著這顆
      const gap = m.top >= b.bottom ? m.top - b.bottom : b.top - m.bottom;
      expect(gap).withContext(`貼著按鈕（選單 ${m.top}–${m.bottom}、按鈕 ${b.top}–${b.bottom}）`).toBeGreaterThanOrEqual(0);
      expect(gap).withContext('間距 6px').toBeLessThanOrEqual(8);
      expect(Math.abs(m.left - b.left)).withContext('左緣對齊').toBeLessThan(1);
      expect(menu()!.contains(document.activeElement)).withContext('焦點進選單').toBeTrue();

      await click(trigger());
      await new Promise((r) => setTimeout(r));
      menuFixture.detectChanges();
      expect(menuHost.toggles).withContext('只送一次「關」').toEqual([true, false]);
      expect(menuHost.closes).withContext('按觸發鈕不算點選單外面').toBe(0);
      expect(menu()).withContext('選單關上、沒有又打開').toBeNull();
      expect(document.activeElement).withContext('焦點回到按鈕').toBe(trigger());
    });

    it('Esc 關掉：焦點回到按鈕；再用空白鍵按一次就打開', async () => {
      trigger().focus();
      await key(trigger(), ' ');
      expect(menuHost.toggles).toEqual([true]);
      expect(menu()).not.toBeNull();
      await key(document.activeElement!, 'Escape');
      expect(menu()).withContext('Esc 關上').toBeNull();
      expect(menuHost.menuOpen).toBeFalse();
      expect(document.activeElement).withContext('焦點回到按鈕').toBe(trigger());
      await key(trigger(), ' ');
      expect(menuHost.toggles).withContext('再按一次就打開').toEqual([true, true]);
      expect(menu()).not.toBeNull();
    });

    // 合成的 keydown 不會觸發原生 click，app-action-menu 自己也略過連發，所以「選單項目沒被點到」驗不到這裡；
    // 驗的是連發傳不到選單項目、預設動作被取消（真的鍵盤連發、Firefox 放開補的 click 靠這兩個擋）
    it('空白鍵打開、焦點移進選單後：按住不放的連發傳不到選單第一項、取消預設動作，放開也取消預設動作', async () => {
      trigger().focus();
      await key(trigger(), ' ');
      expect(menu()).not.toBeNull();
      const item = document.activeElement!;
      expect(menu()!.contains(item)).withContext('焦點在選單裡').toBeTrue();
      const reached: string[] = [];
      item.addEventListener('keydown', (e) => reached.push((e as KeyboardEvent).key));
      for (let i = 0; i < 2; i++) {
        const repeat = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true, repeat: true });
        item.dispatchEvent(repeat);
        expect(repeat.defaultPrevented).withContext('連發：取消預設動作').toBeTrue();
      }
      await nextFrame();
      menuFixture.detectChanges();
      expect(reached).withContext('連發：傳不到選單項目').toEqual([]);
      expect(menu()).withContext('選單還開著').not.toBeNull();
      const up = new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true });
      item.dispatchEvent(up);
      expect(up.defaultPrevented).withContext('放開：取消預設動作').toBeTrue();
    });

    it('選單開著時點另一個沒選中的選項：選單當成點外面關上、選取那一項，不多送「關」', async () => {
      await click(trigger());
      expect(menu()).not.toBeNull();
      const cards = (menuFixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.btn-group__item')[0];
      await click(cards);
      await new Promise((r) => setTimeout(r));
      menuFixture.detectChanges();
      expect(menuHost.value).toBe('cards');
      expect(menu()).withContext('選單關上').toBeNull();
      expect(menuHost.closes).withContext('由選單的點外面關掉').toBe(1);
      expect(menuHost.toggles).withContext('不多送「關」').toEqual([true]);
    });

    it('點選單外面關掉之後，再按觸發鈕一次就打開', async () => {
      await click(trigger());
      expect(menu()).not.toBeNull();
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
      menuFixture.detectChanges();
      expect(menu()).withContext('點外面關上').toBeNull();
      await click(trigger());
      expect(menuHost.toggles).toEqual([true, true]);
      expect(menu()).not.toBeNull();
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
