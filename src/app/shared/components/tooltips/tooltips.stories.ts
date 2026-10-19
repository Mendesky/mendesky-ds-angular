import type { Meta, StoryObj } from '@storybook/angular';
import { TooltipsComponent } from '../../../../index';

const meta: Meta<TooltipsComponent> = {
  title: '浮層元件/Tooltips',
  id: 'tooltips',
  component: TooltipsComponent,
  tags: ['autodocs'],
  argTypes: {
    propClass: {
      description: '箭頭方向（Down = 箭頭朝下，tooltip 顯示於上方）',
      control: { type: 'select' },
      options: ['Down', 'Top', 'Left', 'Right'],
    },
    styles: {
      description: '外觀風格',
      control: { type: 'select' },
      options: ['Default', 'Warning', 'Grey'],
    },
    text: {
      description: 'Tooltip 顯示文字',
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<TooltipsComponent>;

export const Default: Story = {
  name: 'Default',
  args: {
    propClass: 'Down',
    styles: 'Default',
    text: '說明文字',
  },
};

export const AllDirections: Story = {
  name: '所有箭頭方向',
  render: () => ({
    template: `
      <div style="display: flex; gap: 48px; padding: 48px; align-items: center; flex-wrap: wrap;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: #888;">Down（箭頭朝下）</span>
          <app-tooltips propClass="Down" styles="Default" text="此欄位為必填項目"></app-tooltips>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: #888;">Top（箭頭朝上）</span>
          <app-tooltips propClass="Top" styles="Default" text="此欄位為必填項目"></app-tooltips>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: #888;">Left（箭頭朝左）</span>
          <app-tooltips propClass="Left" styles="Default" text="此欄位為必填項目"></app-tooltips>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: #888;">Right（箭頭朝右）</span>
          <app-tooltips propClass="Right" styles="Default" text="此欄位為必填項目"></app-tooltips>
        </div>
      </div>
    `,
  }),
};

export const AllStyles: Story = {
  name: '所有風格',
  render: () => ({
    template: `
      <div style="display: flex; gap: 48px; padding: 48px; align-items: center; flex-wrap: wrap;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: #888;">Default</span>
          <app-tooltips propClass="Down" styles="Default" text="一般提示說明"></app-tooltips>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: #888;">Warning</span>
          <app-tooltips propClass="Down" styles="Warning" text="此操作無法還原，請確認"></app-tooltips>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: #888;">Grey</span>
          <app-tooltips propClass="Down" styles="Grey" text="選填欄位，可留空"></app-tooltips>
        </div>
      </div>
    `,
  }),
};

export const WithLongText: Story = {
  name: '長文字內容',
  args: {
    propClass: 'Down',
    styles: 'Default',
    text: '目前沒有任何項目，請先新增項目後再送出',
  },
};
