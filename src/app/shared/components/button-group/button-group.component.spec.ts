import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
