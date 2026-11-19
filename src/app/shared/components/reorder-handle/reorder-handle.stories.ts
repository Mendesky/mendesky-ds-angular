import { ChangeDetectionStrategy, Component, ElementRef, Injector, Input, ViewChild, afterNextRender, inject } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import type { Meta, StoryObj } from '@storybook/angular';
import {
  CollapsibleComponent, IconBtnComponent, IconComponent, ReorderHandleComponent, ReorderStatusComponent,
  captureReorder, moveInArray, reorderMessage, settleReorder,
} from '../../../../index';

// 範例資料用中性詞：項目一、項目二…；分組一、分組二…
interface Row { id: string; name: string }
interface Group { id: string; name: string; rows: Row[] }

const rows = (prefix: string, n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i + 1}`, name: `項目${'一二三四五六七八九十'[i]}` }));

/**
 * 拖曳放下與選單移動共用：搬陣列、念結果。
 * 選單移動時其他項目從舊位置滑過去（captureReorder）；拖曳放下時預覽已經滑回落點，只讓被移動的發光（settleReorder）。
 */
function reorder<T extends { name: string }>(
  list: T[], e: { previousIndex: number; currentIndex: number } | CdkDragDrop<unknown>,
  container: HTMLElement, status: ReorderStatusComponent, injector: Injector,
): T[] {
  if (e.previousIndex === e.currentIndex) return list;
  const items = Array.from(container.children).filter(el => el.classList.contains('cdk-drag')) as HTMLElement[];
  const moved = items[e.previousIndex];
  const snap = 'direction' in e ? captureReorder(container, ':scope > .cdk-drag') : null;
  const next = moveInArray(list, e.previousIndex, e.currentIndex);
  status.announce(reorderMessage({ name: list[e.previousIndex].name, from: e.previousIndex, to: e.currentIndex, count: list.length }));
  afterNextRender(() => (snap ? snap.play(moved) : settleReorder(moved)), { injector });
  return next;
}

@Component({
  selector: 'story-reorder-list',
  standalone: true,
  imports: [CdkDropList, CdkDrag, ReorderHandleComponent, ReorderStatusComponent, IconBtnComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .wrap { max-width: 480px; position: relative; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .row { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px;
      background: #fff; border: 1px solid #e7e7e7; border-radius: 8px; color: #686868; }
    .row .name { flex: 1; }
    .header { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; color: #fff; border-radius: 8px; }
  `],
  template: `
    <div class="wrap">
      <div #list class="list ds-sortable" cdkDropList cdkDropListLockAxis="y" (cdkDropListDropped)="onMove($event)">
        @for (row of items; track row.id; let i = $index) {
          <div class="cdk-drag-host" cdkDrag cdkDragPreviewClass="ds-sortable-preview" [cdkDragStartDelay]="{ touch: 250, mouse: 0 }"
               [class.row]="!headerColor" [class.header]="!!headerColor" [style.background]="headerColor || null">
            <app-reorder-handle [label]="row.name" [index]="i" [count]="items.length"
              [appearance]="headerColor ? 'inverse' : 'default'" (move)="onMove($event)"></app-reorder-handle>
            <span class="name">{{ row.name }}</span>
          </div>
        }
      </div>
      <app-reorder-status></app-reorder-status>
    </div>
  `,
})
class ReorderListDemoComponent {
  @Input() count = 4;
  /** 有值時每列是深色標頭，握把用反白 */
  @Input() headerColor = '';
  @ViewChild('list', { static: true }) list!: ElementRef<HTMLElement>;
  @ViewChild(ReorderStatusComponent, { static: true }) status!: ReorderStatusComponent;
  private readonly injector = inject(Injector);
  items: Row[] = [];

  ngOnInit(): void { this.items = rows('r', this.count); }

  onMove(e: { previousIndex: number; currentIndex: number } | CdkDragDrop<unknown>): void {
    this.items = reorder(this.items, e, this.list.nativeElement, this.status, this.injector);
  }
}

@Component({
  selector: 'story-reorder-nested',
  standalone: true,
  imports: [CdkDropList, CdkDrag, ReorderHandleComponent, ReorderStatusComponent],
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .wrap { max-width: 520px; position: relative; }
    .groups { display: flex; flex-direction: column; gap: 12px; }
    .group { border: 1px solid #e7e7e7; border-radius: 8px; overflow: hidden; background: #fff; }
    .group-header { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; background: #535353; color: #fff; }
    .rows { display: flex; flex-direction: column; }
    .row { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; background: #fff; color: #686868; border-top: 1px solid #e7e7e7; }
  `],
  template: `
    <div class="wrap">
      <div #groupList class="groups ds-sortable" cdkDropList cdkDropListLockAxis="y" (cdkDropListDropped)="moveGroup($event)">
        @for (g of groups; track g.id; let gi = $index) {
          <div class="group" cdkDrag cdkDragPreviewClass="ds-sortable-preview" [cdkDragStartDelay]="{ touch: 250, mouse: 0 }">
            <div class="group-header">
              <app-reorder-handle appearance="inverse" [label]="g.name" [index]="gi" [count]="groups.length" (move)="moveGroup($event)"></app-reorder-handle>
              {{ g.name }}
            </div>
            <div #rowList class="rows ds-sortable" cdkDropList cdkDropListLockAxis="y" (cdkDropListDropped)="moveRow(g, rowList, $event)">
              @for (r of g.rows; track r.id; let i = $index) {
                <div class="row" cdkDrag cdkDragPreviewClass="ds-sortable-preview" [cdkDragStartDelay]="{ touch: 250, mouse: 0 }">
                  <app-reorder-handle [label]="r.name" [index]="i" [count]="g.rows.length" (move)="moveRow(g, rowList, $event)"></app-reorder-handle>
                  {{ r.name }}
                </div>
              }
            </div>
          </div>
        }
      </div>
      <app-reorder-status></app-reorder-status>
    </div>
  `,
})
class ReorderNestedDemoComponent {
  @ViewChild('groupList', { static: true }) groupList!: ElementRef<HTMLElement>;
  @ViewChild(ReorderStatusComponent, { static: true }) status!: ReorderStatusComponent;
  private readonly injector = inject(Injector);
  groups: Group[] = [
    { id: 'g1', name: '分組一', rows: rows('a', 3) },
    { id: 'g2', name: '分組二', rows: rows('b', 2) },
    { id: 'g3', name: '分組三', rows: rows('c', 1) },
  ];

  moveGroup(e: { previousIndex: number; currentIndex: number }): void {
    this.groups = reorder(this.groups, e, this.groupList.nativeElement, this.status, this.injector);
  }

  moveRow(g: Group, list: HTMLElement, e: { previousIndex: number; currentIndex: number }): void {
    g.rows = reorder(g.rows, e, list, this.status, this.injector);
  }
}

@Component({
  selector: 'story-reorder-collapsible',
  standalone: true,
  imports: [CdkDropList, CdkDrag, ReorderHandleComponent, ReorderStatusComponent, CollapsibleComponent, IconBtnComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .wrap { max-width: 560px; position: relative; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .card { border: 1px solid #e7e7e7; border-radius: 8px; background: #fff; }
    .body { padding: 12px 16px; color: #686868; }
  `],
  template: `
    <div class="wrap">
      <div #list class="list ds-sortable" cdkDropList cdkDropListLockAxis="y" (cdkDropListDropped)="onMove($event)">
        @for (s of sections; track s.id; let i = $index) {
          <div class="card" cdkDrag cdkDragPreviewClass="ds-sortable-preview" [cdkDragStartDelay]="{ touch: 250, mouse: 0 }">
            <app-collapsible appearance="accent" [title]="'第' + nums[i] + '段'" [expanded]="i === 0">
              <app-reorder-handle collapsibleLeading [label]="'第' + nums[i] + '段'" [index]="i" [count]="sections.length" (move)="onMove($event)"></app-reorder-handle>
              <span collapsibleSummary>{{ s.text }}</span>
              <app-icon-btn collapsibleTrailing propClass="Block-Transparent" size="16-" [ariaLabel]="'「第' + nums[i] + '段」的更多操作'">
                <app-icon name="More" size="16"></app-icon>
              </app-icon-btn>
              <div class="body">{{ s.text }}</div>
            </app-collapsible>
          </div>
        }
      </div>
      <app-reorder-status></app-reorder-status>
    </div>
  `,
})
class ReorderCollapsibleDemoComponent {
  @ViewChild('list', { static: true }) list!: ElementRef<HTMLElement>;
  @ViewChild(ReorderStatusComponent, { static: true }) status!: ReorderStatusComponent;
  private readonly injector = inject(Injector);
  readonly nums = '一二三四五六七八九十';
  sections = [
    { id: 's1', text: '這一段的內容。標題跟著位置重新編號。' },
    { id: 's2', text: '第二段的內容，比較長一點，收合時摘要放不下會用刪節號截斷。' },
    { id: 's3', text: '第三段的內容。' },
  ];

  onMove(e: { previousIndex: number; currentIndex: number } | CdkDragDrop<unknown>): void {
    if (e.previousIndex === e.currentIndex) return;
    const name = `第${this.nums[e.previousIndex]}段`;
    const items = Array.from(this.list.nativeElement.children).filter(el => el.classList.contains('cdk-drag')) as HTMLElement[];
    const moved = items[e.previousIndex];
    const snap = 'direction' in e ? captureReorder(this.list.nativeElement, ':scope > .cdk-drag') : null;
    this.sections = moveInArray(this.sections, e.previousIndex, e.currentIndex);
    this.status.announce(reorderMessage({
      name, from: e.previousIndex, to: e.currentIndex, count: this.sections.length, newName: `第${this.nums[e.currentIndex]}段`,
    }));
    afterNextRender(() => (snap ? snap.play(moved) : settleReorder(moved)), { injector: this.injector });
  }
}

const meta: Meta<ReorderHandleComponent> = {
  title: '互動元件/Reorder Handle',
  id: 'reorder-handle',
  component: ReorderHandleComponent,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: '項目的完整名稱（必填）；報讀念「移動『名稱』」' },
    index: { control: 'number', description: '這個項目目前在第幾個（從 0 起）' },
    count: { control: 'number', description: '清單共幾個項目；小於 2 時停用' },
    appearance: {
      control: 'radio',
      options: ['default', 'inverse'],
      description: '預設：白底；反白：深色標頭',
      table: { defaultValue: { summary: "'default'" } },
    },
    disabled: { control: 'boolean', description: '停用', table: { defaultValue: { summary: 'false' } } },
    move: { action: 'move' },
  },
};

export default meta;
type Story = StoryObj<ReorderHandleComponent>;

// ── 一份清單：拖曳或點握把開選單 ─────────────────────────
export const Default: Story = {
  name: '一份清單',
  render: () => ({
    template: `<story-reorder-list [count]="4"></story-reorder-list>`,
    moduleMetadata: { imports: [ReorderListDemoComponent] },
  }),
};

// ── 兩種外觀：白底用預設，深色標頭用反白 ──────────────────
export const Appearances: Story = {
  name: '兩種外觀',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:24px">
        <story-reorder-list [count]="3"></story-reorder-list>
        <story-reorder-list [count]="3" headerColor="#535353"></story-reorder-list>
        <story-reorder-list [count]="3" headerColor="#af8e4d"></story-reorder-list>
      </div>`,
    moduleMetadata: { imports: [ReorderListDemoComponent] },
  }),
};

// ── 巢狀：分組與項目各自排序，項目不能跨組 ────────────────
export const Nested: Story = {
  name: '巢狀清單',
  render: () => ({
    template: `<story-reorder-nested></story-reorder-nested>`,
    moduleMetadata: { imports: [ReorderNestedDemoComponent] },
  }),
};

// ── 收合卡片：綠色外觀，握把在前置區，「⋯」在尾端區 ───────
export const InCollapsible: Story = {
  name: '放在收合區塊',
  render: () => ({
    template: `<story-reorder-collapsible></story-reorder-collapsible>`,
    moduleMetadata: { imports: [ReorderCollapsibleDemoComponent] },
  }),
};

// ── 只有一個項目：握把停用 ───────────────────────────────
export const SingleItem: Story = {
  name: '只有一個項目',
  render: () => ({
    template: `<story-reorder-list [count]="1"></story-reorder-list>`,
    moduleMetadata: { imports: [ReorderListDemoComponent] },
  }),
};
