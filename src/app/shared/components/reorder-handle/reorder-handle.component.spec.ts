import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { moveInArray, reorderMessage } from '@mendesky/ds';
import { ReorderHandleAppearance, ReorderHandleComponent, ReorderMoveEvent } from './reorder-handle.component';
import { ReorderStatusComponent } from '../reorder-status/reorder-status.component';
import { CollapsibleComponent } from '../collapsible/collapsible.component';

/**
 * app-reorder-handle 契約（DS-16，原型 https://claude.ai/artifact/S4UF64mPpTWSRzG8b8FScN 第 5 版）：
 * - 握把是原生 button：aria-label「移動『名稱』」、aria-haspopup="menu"、aria-expanded 跟著選單。
 * - 點一下開選單，四項依序是上移、下移、移到最上、移到最下；做不到的 aria-disabled="true"，不隱藏。
 * - count < 2 或 disabled：按鈕停用、點了不開選單、CDK 握把停用（拖不動）。
 * - 選了之後送出一次 move { direction, previousIndex, currentIndex }；畫面重排後焦點回到被移動項目的握把
 *   （選單關閉時 app-action-menu 還焦點；上移、下移、移到最上、移到最下各測一次）。
 * - 放在 app-collapsible 綠色外觀的前置區：不設反白也是白色圖示、白色焦點框（本體規格的 dos 這樣寫）。
 * - 本身就是 CDK 握把：從握把按住移動會開始拖曳，從項目的其他地方按住不會。
 * - 反白外觀圖示是白色、焦點框改白；按鈕 24×24。
 * - 選單打開時，打開它的那顆握把加一層按下的底色（預設灰底、圖示變深；反白與綠色外觀 16% 白色淡底），關掉後恢復。
 * 全部從真的 DOM 查。
 */
/** 等握把的底色、顏色轉場（150ms）跑完再量 */
const settle = () => new Promise<void>(r => setTimeout(r, 200));

interface Item { id: string; name: string }

@Component({
  standalone: true,
  imports: [CdkDropList, CdkDrag, ReorderHandleComponent, ReorderStatusComponent],
  template: `
    <div style="width:360px; background:#535353">
      <div class="list ds-sortable" cdkDropList cdkDropListLockAxis="y" (cdkDropListDropped)="onDrop($event)">
        @for (item of items; track item.id; let i = $index) {
          <div class="row" cdkDrag style="display:flex; align-items:center; gap:8px; height:40px" [attr.data-id]="item.id">
            <app-reorder-handle [label]="item.name" [index]="i" [count]="items.length"
              [appearance]="appearance" [disabled]="disabled" (move)="onMove($event)"></app-reorder-handle>
            <span class="name">{{ item.name }}</span>
          </div>
        }
      </div>
      <app-reorder-status></app-reorder-status>
    </div>
    <button type="button" data-testid="outside">外面的按鈕</button>
  `,
})
class HostComponent {
  @ViewChild(ReorderStatusComponent) status!: ReorderStatusComponent;
  items: Item[] = [
    { id: 'a', name: '項目一' },
    { id: 'b', name: '項目二' },
    { id: 'c', name: '項目三' },
  ];
  appearance: ReorderHandleAppearance = 'default';
  disabled = false;
  moves: ReorderMoveEvent[] = [];
  drops = 0;

  onMove(e: ReorderMoveEvent): void {
    this.moves.push(e);
    this.apply(e.previousIndex, e.currentIndex);
  }

  onDrop(e: CdkDragDrop<unknown>): void {
    this.drops++;
    this.apply(e.previousIndex, e.currentIndex);
  }

  private apply(from: number, to: number): void {
    const name = this.items[from].name;
    this.items = moveInArray(this.items, from, to);
    this.status.announce(reorderMessage({ name, from, to, count: this.items.length }));
  }
}

describe('ReorderHandleComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const handles = () => Array.from(fixture.nativeElement.querySelectorAll('app-reorder-handle')) as HTMLElement[];
  const button = (i: number) => handles()[i].querySelector('button') as HTMLButtonElement;
  const menuItems = () => Array.from(document.querySelectorAll('app-action-menu app-menu-item button.mi')) as HTMLButtonElement[];
  const order = () => (Array.from(fixture.nativeElement.querySelectorAll('.row')) as HTMLElement[]).map(r => r.dataset['id']);

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.querySelectorAll('app-action-menu').forEach(m => m.remove());
    fixture.destroy();
  });

  it('握把是按鈕：名稱「移動『名稱』」、會開選單、選單關著時 aria-expanded="false"', () => {
    const b = button(0);
    expect(b.tagName).toBe('BUTTON');
    expect(b.getAttribute('aria-label')).toBe('移動「項目一」');
    expect(b.getAttribute('aria-haspopup')).toBe('menu');
    expect(b.getAttribute('aria-expanded')).toBe('false');
  });

  it('點一下開選單：四項依序，第一個項目的上移、移到最上停用（不隱藏）', () => {
    button(0).click();
    fixture.detectChanges();
    expect(button(0).getAttribute('aria-expanded')).toBe('true');
    const items = menuItems();
    expect(items.map(i => i.textContent!.trim())).toEqual(['上移', '下移', '移到最上', '移到最下']);
    expect(items.map(i => i.getAttribute('aria-disabled'))).toEqual(['true', null, 'true', null]);
  });

  it('最後一個項目：下移、移到最下停用', () => {
    button(2).click();
    fixture.detectChanges();
    expect(menuItems().map(i => i.getAttribute('aria-disabled'))).toEqual([null, 'true', null, 'true']);
  });

  it('選「下移」：送出一次 move，畫面重排後焦點在被移動項目的握把', async () => {
    button(0).focus();
    button(0).click();
    fixture.detectChanges();
    menuItems()[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.moves).toEqual([{ direction: 'down', previousIndex: 0, currentIndex: 1 }]);
    expect(order()).toEqual(['b', 'a', 'c']);
    expect(document.activeElement).toBe(button(1));
    expect(button(1).getAttribute('aria-label')).toBe('移動「項目一」');
  });

  it('選「移到最下」：項目被搬到最後，焦點仍回到它的握把', async () => {
    button(0).focus();
    button(0).click();
    fixture.detectChanges();
    menuItems()[3].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(order()).toEqual(['b', 'c', 'a']);
    expect(document.activeElement).toBe(button(2));
  });

  it('選「移到最上」：其他項目被搬動，焦點仍回到被移動項目的握把', async () => {
    button(2).focus();
    button(2).click();
    fixture.detectChanges();
    menuItems()[2].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(order()).toEqual(['c', 'a', 'b']);
    expect(document.activeElement).toBe(button(0));
  });

  it('停用的項目點了不送出', () => {
    button(0).click();
    fixture.detectChanges();
    menuItems()[0].click();
    fixture.detectChanges();
    expect(host.moves).toEqual([]);
    expect(order()).toEqual(['a', 'b', 'c']);
  });

  it('只有一個項目：按鈕停用、點了不開選單、CDK 握把停用', () => {
    host.items = [{ id: 'a', name: '項目一' }];
    fixture.detectChanges();
    expect(button(0).disabled).toBeTrue();
    button(0).click();
    fixture.detectChanges();
    expect(menuItems().length).toBe(0);
    const dragHandle = fixture.debugElement.query(el => el.name === 'app-reorder-handle').injector.get(CdkDragHandle);
    expect(dragHandle.disabled).toBeTrue();
  });

  it('disabled：按鈕停用、CDK 握把停用；拿掉後恢復', () => {
    host.disabled = true;
    fixture.detectChanges();
    const dh = () => fixture.debugElement.query(el => el.name === 'app-reorder-handle').injector.get(CdkDragHandle);
    expect(button(0).disabled).toBeTrue();
    expect(dh().disabled).toBeTrue();
    host.disabled = false;
    fixture.detectChanges();
    expect(button(0).disabled).toBeFalse();
    expect(dh().disabled).toBeFalse();
  });

  describe('拖曳', () => {
    function press(el: HTMLElement): { x: number; y: number } {
      const r = el.getBoundingClientRect();
      const p = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      // buttons、detail 不能是 0：CDK 會把那種 mousedown 當成報讀軟體模擬的點擊，不開始拖曳
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: p.x, clientY: p.y, button: 0, buttons: 1, detail: 1 }));
      return p;
    }
    function moveTo(x: number, y: number): void {
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: x, clientY: y, buttons: 1 }));
      fixture.detectChanges();
    }
    /** 放開，並等拖曳預覽滑回落點、被移除（CDK 等它的轉場結束才移除） */
    async function release(x: number, y: number): Promise<void> {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
      fixture.detectChanges();
      for (let k = 0; k < 40 && document.querySelector('.cdk-drag-preview'); k++) {
        await new Promise(r => setTimeout(r, 25));
      }
      fixture.detectChanges();
    }

    it('從握把按住移動會開始拖曳；從名稱按住不會', async () => {
      const p = press(button(0));
      moveTo(p.x, p.y + 10);
      expect(document.querySelector('.cdk-drag-preview')).not.toBeNull();
      await release(p.x, p.y + 10);
      expect(document.querySelector('.cdk-drag-preview')).toBeNull();

      const name = fixture.nativeElement.querySelector('.row .name') as HTMLElement;
      const q = press(name);
      moveTo(q.x, q.y + 10);
      expect(document.querySelector('.cdk-drag-preview')).toBeNull();
      await release(q.x, q.y + 10);
    });

    it('拖到第三個放開：清單重排、報讀區念出結果', async () => {
      const p = press(button(0));
      for (let k = 1; k <= 12; k++) moveTo(p.x, p.y + k * 8);
      await release(p.x, p.y + 96);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(host.drops).toBe(1);
      expect(order()).toEqual(['b', 'c', 'a']);
      expect(fixture.nativeElement.querySelector('app-reorder-status').textContent.trim())
        .toBe('「項目一」已從第 1 個移到第 3 個，共 3 個');
    });

    it('只有一個項目時拖不動', async () => {
      host.items = [{ id: 'a', name: '項目一' }];
      fixture.detectChanges();
      const p = press(button(0));
      moveTo(p.x, p.y + 10);
      expect(document.querySelector('.cdk-drag-preview')).toBeNull();
      await release(p.x, p.y + 10);
    });
  });

  describe('外觀', () => {
    it('預設：灰色圖示、24×24', () => {
      const b = button(0);
      expect(getComputedStyle(b).color).toBe('rgb(147, 147, 147)');
      const r = b.getBoundingClientRect();
      expect([r.width, r.height]).toEqual([24, 24]);
    });

    it('反白：白色圖示、焦點框白色', () => {
      host.appearance = 'inverse';
      fixture.detectChanges();
      const b = button(0);
      expect(getComputedStyle(b).color).toBe('rgb(255, 255, 255)');
      expect(getComputedStyle(handles()[0]).getPropertyValue('--focus-ring-color').trim()).toMatch(/#ffffff|#fff|rgb\(255, 255, 255\)/i);
    });

    it('選單打開：預設外觀加一層灰底、圖示變深；選單關掉後恢復', async () => {
      button(1).click();
      fixture.detectChanges();
      await settle();
      expect(getComputedStyle(button(1)).backgroundColor).toBe('rgb(231, 231, 231)');
      expect(getComputedStyle(button(1)).color).toBe('rgb(104, 104, 104)');
      // 只有打開選單的那一顆
      expect(getComputedStyle(button(0)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      button(1).click();
      fixture.detectChanges();
      await settle();
      expect(getComputedStyle(button(1)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('選單打開：反白外觀加 16% 白色淡底', async () => {
      host.appearance = 'inverse';
      fixture.detectChanges();
      button(1).click();
      fixture.detectChanges();
      await settle();
      expect(getComputedStyle(button(1)).backgroundColor).toMatch(/0\.16\)$/);
      expect(getComputedStyle(button(1)).color).toBe('rgb(255, 255, 255)');
    });

    it('停用：跟 icon-btn 停用一樣淡成一半', () => {
      host.items = [{ id: 'a', name: '項目一' }];
      fixture.detectChanges();
      expect(getComputedStyle(button(0)).opacity).toBe('0.5');
    });
  });
});

@Component({
  standalone: true,
  imports: [CollapsibleComponent, ReorderHandleComponent],
  template: `
    <app-collapsible appearance="accent" title="第一段">
      <app-reorder-handle collapsibleLeading label="第一段" [index]="0" [count]="2"></app-reorder-handle>
      <p>內容</p>
    </app-collapsible>
  `,
})
class AccentHostComponent {}

describe('ReorderHandleComponent 放在 app-collapsible 綠色外觀', () => {
  it('不設反白也是白色圖示、24×24、焦點框白色', () => {
    const fixture = TestBed.createComponent(AccentHostComponent);
    fixture.detectChanges();
    const handle = fixture.debugElement.query(By.directive(ReorderHandleComponent)).componentInstance as ReorderHandleComponent;
    const b = fixture.nativeElement.querySelector('app-reorder-handle button') as HTMLButtonElement;
    expect(getComputedStyle(b).color).toBe('rgb(255, 255, 255)');
    const r = b.getBoundingClientRect();
    expect([r.width, r.height]).toEqual([24, 24]);
    handle.focusButton();
    expect(document.activeElement).toBe(b);
    expect(getComputedStyle(b).outlineStyle).toBe('solid');
    expect(getComputedStyle(b).outlineColor).toBe('rgb(255, 255, 255)');
  });

  it('選單打開：16% 白色淡底', async () => {
    const fixture = TestBed.createComponent(AccentHostComponent);
    fixture.detectChanges();
    const b = fixture.nativeElement.querySelector('app-reorder-handle button') as HTMLButtonElement;
    b.click();
    fixture.detectChanges();
    await settle();
    expect(getComputedStyle(b).backgroundColor).toMatch(/0\.16\)$/);
    document.querySelectorAll('app-action-menu').forEach(m => m.remove());
    fixture.destroy();
  });
});
