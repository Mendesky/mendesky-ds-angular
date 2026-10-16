// 範例資料：帶序號的工作項目短名
import type { Meta, StoryObj } from '@storybook/angular';
import { ListTagComponent } from '../../../../index';

const meta: Meta<ListTagComponent> = {
  title: '展示元件/List Tag',
  id: 'list-tag',
  component: ListTagComponent,
  tags: ['autodocs'],
  argTypes: {
    itemNumber: {
      description: '序號文字，顯示於左側圓形標記',
      control: { type: 'text' },
      table: { defaultValue: { summary: 'i' } },
    },
    showBadge: {
      description: '顯示主要 Badge（橘色）',
      control: { type: 'boolean' },
      table: { defaultValue: { summary: 'true' } },
    },
    showBadgeB: {
      description: '顯示第二 Badge（藍色）',
      control: { type: 'boolean' },
      table: { defaultValue: { summary: 'false' } },
    },
    showBadgeC: {
      description: '顯示第三 Badge（綠色）',
      control: { type: 'boolean' },
      table: { defaultValue: { summary: 'false' } },
    },
    text: {
      description: '主要顯示文字',
      control: { type: 'text' },
      table: { defaultValue: { summary: 'Text' } },
    },
  },
  args: {
    itemNumber: '1',
    showBadge: true,
    showBadgeB: false,
    showBadgeC: false,
    text: '介面設計',
  },
};

export default meta;
type Story = StoryObj<ListTagComponent>;

export const Default: Story = {
  name: '預設',
  args: {
    itemNumber: '1',
    showBadge: true,
    showBadgeB: false,
    showBadgeC: false,
    text: '介面設計',
  },
};

export const WithBadgeB: Story = {
  name: '顯示第二 Badge',
  args: {
    itemNumber: '2',
    showBadge: true,
    showBadgeB: true,
    showBadgeC: false,
    text: '前端開發',
  },
};

export const AllBadges: Story = {
  name: '全部 Badge 顯示',
  args: {
    itemNumber: '3',
    showBadge: true,
    showBadgeB: true,
    showBadgeC: true,
    text: '介面設計（含設計規範）',
  },
};

export const NoNumber: Story = {
  name: '無序號',
  args: {
    itemNumber: '',
    showBadge: false,
    showBadgeB: false,
    showBadgeC: false,
    text: '活動場地申請',
  },
};

export const AllVariants: Story = {
  name: '所有變體',
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:8px; padding:16px; max-width:400px;">
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:4px;">預設（showBadge）</p>
          <app-list-tag itemNumber="1" [showBadge]="true" text="介面設計"></app-list-tag>
        </div>
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:4px;">Badge A + B</p>
          <app-list-tag itemNumber="2" [showBadge]="true" [showBadgeB]="true" text="前端開發"></app-list-tag>
        </div>
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:4px;">全部 Badge</p>
          <app-list-tag itemNumber="3" [showBadge]="true" [showBadgeB]="true" [showBadgeC]="true" text="介面設計（含設計規範）"></app-list-tag>
        </div>
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:4px;">無 Badge</p>
          <app-list-tag itemNumber="4" [showBadge]="false" text="名片印製"></app-list-tag>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [ListTagComponent] },
  }),
};
