// 範例資料：四步驟編輯頁的頁面標題
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

// 排第一個：文件網站的元件頁「用法」嵌入的是第一個範例。單獨一顆點看不出效果，
// 所以第一個範例照實際用法排成一排：目前這一則用 Line、其餘用 Dot，點哪顆就切到哪顆。
// 第二排帶文字，滑過時展開成膠囊顯示文字。
export const Interactive: Story = {
  name: '互動（點選切換）',
  render: () => ({
    props: {
      current: 0,
      currentWithText: 0,
      pages: ['第一則', '第二則', '第三則', '第四則'],
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:20px;padding:24px;">
        <div style="display:flex;flex-direction:column;gap:8px;">
          <span class="noto-12-regular" style="color:#686868;">點任一顆切換，目前是 {{ pages[current] }}</span>
          <div style="display:flex;align-items:center;gap:4px;">
            @for (page of pages; track page; let i = $index) {
              <app-carousel-dot
                [variant]="i === current ? 'Line' : 'Dot'"
                [active]="i === current"
                (dotClick)="current = i">
              </app-carousel-dot>
            }
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <span class="noto-12-regular" style="color:#686868;">有文字時，滑過會展開顯示文字</span>
          <div style="display:flex;align-items:center;gap:4px;">
            @for (page of pages; track page; let i = $index) {
              <app-carousel-dot
                [variant]="i === currentWithText ? 'Line' : 'Dot'"
                [active]="i === currentWithText"
                [text]="page"
                (dotClick)="currentWithText = i">
              </app-carousel-dot>
            }
          </div>
        </div>
      </div>
    `,
  }),
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: `@for (page of pages; track page; let i = $index) {
  <app-carousel-dot
    [variant]="i === current ? 'Line' : 'Dot'"
    [active]="i === current"
    [text]="page"
    (dotClick)="current = i">
  </app-carousel-dot>
}`,
      },
    },
  },
};

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
          <app-carousel-dot variant="Dot" [active]="false" text="基本資料"></app-carousel-dot>
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
        <app-carousel-dot variant="Dot" [active]="false" text="基本資料"></app-carousel-dot>
        <app-carousel-dot variant="Dot" [active]="true" text="選擇項目"></app-carousel-dot>
        <app-carousel-dot variant="Dot" [active]="false" text="填寫內容"></app-carousel-dot>
        <app-carousel-dot variant="Dot" [active]="false" text="確認送出"></app-carousel-dot>
      </div>
    `,
    props: {},
  }),
};
