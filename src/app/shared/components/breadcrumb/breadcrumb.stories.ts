import type { Meta, StoryObj } from '@storybook/angular';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../../index';

// 範例資料用中性詞。外框背景照使用端常見的淺灰頁面背景。

const THREE: BreadcrumbItem[] = [
  { id: 'overview', label: '總覽', icon: 'Dashboard', href: '#overview' },
  { id: 'a', label: '專案 A', icon: 'AppWindow', href: '#a' },
  { id: 'v', label: 'v2.4.0', icon: 'VersionTag' },
];

const TEAM_PAGES: BreadcrumbItem[] = [
  { id: 'members', label: '成員', icon: 'Person', href: '#members' },
  { id: 'roles', label: '角色', icon: 'IdCard', href: '#roles' },
];

const FRAME = 'max-width:100%;padding:20px;background:#EEF1F5;border-radius:8px;box-sizing:border-box';

const meta: Meta<BreadcrumbComponent> = {
  title: '互動元件/Breadcrumb',
  id: 'breadcrumb',
  component: BreadcrumbComponent,
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: { control: 'text', description: '導覽地標的名稱', table: { defaultValue: { summary: '目前位置' } } },
  },
  args: { items: THREE, siblings: [], ariaLabel: '目前位置' },
  render: (args) => ({
    props: args,
    template: `
      <div style="${FRAME}">
        <app-breadcrumb [items]="items" [siblings]="siblings" [ariaLabel]="ariaLabel" (navigate)="0"></app-breadcrumb>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<BreadcrumbComponent>;

// ── 主範例：三層，每一節都有圖示 ─────────────────────────────
export const Default: Story = {
  name: '預設（三層、每一節都有圖示）',
};

// ── 最後一節切換同區頁面 ─────────────────────────────────────
export const WithSwitch: Story = {
  name: '最後一節切換同區頁面',
  render: () => ({
    props: {
      pages: TEAM_PAGES,
      current: TEAM_PAGES[1],
      pick(this: { current: BreadcrumbItem; pages: BreadcrumbItem[] }, item: BreadcrumbItem) {
        const hit = this.pages.find(p => p.id === item.id);
        if (hit) this.current = hit;
      },
    },
    template: `
      <div style="${FRAME}">
        <app-breadcrumb
          [items]="[{ id: 'team', label: '團隊', icon: 'CustomerManagement', href: '#team' }, current]"
          [siblings]="pages"
          (navigate)="pick($event)"></app-breadcrumb>
      </div>
    `,
    moduleMetadata: { imports: [BreadcrumbComponent] },
  }),
};

// ── 名稱太長：前面的節先縮 ───────────────────────────────────
export const Truncated: Story = {
  name: '名稱太長（前面的節先縮）',
  render: () => ({
    props: {
      items: [
        { id: 'a', label: '一個很長很長的上層區域名稱', icon: 'Dashboard', href: '#a' },
        { id: 'b', label: '另一個也很長的中間層名稱', icon: 'AppWindow', href: '#b' },
        { id: 'c', label: '目前頁', icon: 'VersionTag' },
      ] as BreadcrumbItem[],
    },
    template: `
      <div style="${FRAME};width:320px">
        <app-breadcrumb [items]="items" (navigate)="0"></app-breadcrumb>
      </div>
    `,
    moduleMetadata: { imports: [BreadcrumbComponent] },
  }),
};
