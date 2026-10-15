// 範例資料取自 dashboard-app 主線：src/app/features/quoting-cases/components/case-edit-modal/case-edit-modal.component.ts（報價案件編輯頁 p1～p4 的頁面標題）
import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { CarouselDotComponent, CarouselDotVariant } from '../../../../index';

const meta: Meta<CarouselDotComponent> = {
  title: '互動元件/Carousel Dot',
  id: 'carousel-dot',
  component: CarouselDotComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      description: '基礎形狀：Dot 圓點 / Line 橫條',
      control: { type: 'select' },
      options: ['Dot', 'Line'],
    },
    active: {
      description: '選中（啟用）狀態',
      control: { type: 'boolean' },
    },
    text: {
      description: '有值時啟用 hover 展開文字行為',
      control: { type: 'text' },
    },
    dotClick: {
      description: '點擊時觸發',
      action: 'dotClick',
    },
  },
  args: {
    variant: 'Dot',
    active: false,
    text: '',
  },
};

export default meta;
type Story = StoryObj<CarouselDotComponent>;

export const DotInactive: Story = {
  name: 'Dot — 未選中',
  args: {
    variant: 'Dot',
    active: false,
  },
};

export const DotActive: Story = {
  name: 'Dot — 選中',
  args: {
    variant: 'Dot',
    active: true,
  },
};

export const LineInactive: Story = {
  name: 'Line — 未選中',
  args: {
    variant: 'Line',
    active: false,
  },
};

export const LineActive: Story = {
  name: 'Line — 選中',
  args: {
    variant: 'Line',
    active: true,
  },
};

export const AllVariants: Story = {
  name: '所有狀態一覽',
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap:32px; padding:24px; flex-wrap:wrap;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-carousel-dot variant="Dot" [active]="false"></app-carousel-dot>
          <span style="font-size:11px;color:#686868;">Dot 未選中</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-carousel-dot variant="Dot" [active]="true"></app-carousel-dot>
          <span style="font-size:11px;color:#686868;">Dot 選中</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-carousel-dot variant="Line" [active]="false"></app-carousel-dot>
          <span style="font-size:11px;color:#686868;">Line 未選中</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-carousel-dot variant="Line" [active]="true"></app-carousel-dot>
          <span style="font-size:11px;color:#686868;">Line 選中</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-carousel-dot variant="Dot" [active]="false" text="營運資料"></app-carousel-dot>
          <span style="font-size:11px;color:#686868;">Dot 含文字（hover）</span>
        </div>
      </div>
    `,
    props: {},
  }),
};

export const WithTextLabel: Story = {
  name: '含文字標籤',
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap:16px; padding:24px;">
        <app-carousel-dot variant="Dot" [active]="false" text="營運資料"></app-carousel-dot>
        <app-carousel-dot variant="Dot" [active]="true" text="報價項目"></app-carousel-dot>
        <app-carousel-dot variant="Dot" [active]="false" text="報價基本資料"></app-carousel-dot>
        <app-carousel-dot variant="Dot" [active]="false" text="公費合約"></app-carousel-dot>
      </div>
    `,
    props: {},
  }),
};
