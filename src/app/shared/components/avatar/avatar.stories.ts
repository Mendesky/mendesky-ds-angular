import type { Meta, StoryObj } from '@storybook/angular';
import { AvatarComponent, AvatarClass, AvatarSize } from '../../../../index';

const meta: Meta<AvatarComponent> = {
  title: '展示元件/Avatar',
  id: 'avatar',
  component: AvatarComponent,
  tags: ['autodocs'],
  argTypes: {
    propClass: {
      description: '顯示類型：Thumb 照片 / Text 文字 / Icon 圖示',
      control: { type: 'select' },
      options: ['Text', 'Icon', 'Thumb'],
    },
    size: {
      description: '尺寸（px）：28 | 36 | 44 | 56 | 64 | 96 | 128 | 240',
      control: { type: 'select' },
      options: [28, 36, 44, 56, 64, 96, 128, 240],
    },
    src: {
      description: 'Thumb 模式用：圖片 URL',
      control: { type: 'text' },
    },
    text: {
      description: 'Text 模式用：顯示文字（通常取姓名第一字）',
      control: { type: 'text' },
    },
    iconName: {
      description: 'Icon 模式用：icon registry 中的 icon 名稱',
      control: { type: 'text' },
    },
    clickable: {
      description: '是否啟用 hover / active 互動效果',
      control: { type: 'boolean' },
    },
  },
  args: {
    propClass: 'Text',
    size: 44,
    src: '',
    text: '張',
    iconName: 'User',
    clickable: false,
  },
};

export default meta;
type Story = StoryObj<AvatarComponent>;

export const TextVariant: Story = {
  name: '文字頭像',
  args: {
    propClass: 'Text',
    size: 44,
    text: '張',
  },
};

export const IconVariant: Story = {
  name: 'Icon 頭像',
  args: {
    propClass: 'Icon',
    size: 44,
    iconName: 'User',
  },
};

export const ThumbVariant: Story = {
  name: '照片頭像',
  args: {
    propClass: 'Thumb',
    size: 44,
    src: 'https://i.pravatar.cc/240?img=32',
  },
};

export const AllSizes: Story = {
  name: '所有尺寸',
  render: () => ({
    template: `
      <div style="display:flex; align-items:flex-end; gap:24px; padding:24px; flex-wrap:wrap;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-avatar propClass="Text" [size]="28" text="李"></app-avatar>
          <span style="font-size:11px;color:#686868;">28</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-avatar propClass="Text" [size]="36" text="李"></app-avatar>
          <span style="font-size:11px;color:#686868;">36</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-avatar propClass="Text" [size]="44" text="李"></app-avatar>
          <span style="font-size:11px;color:#686868;">44</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-avatar propClass="Text" [size]="56" text="李"></app-avatar>
          <span style="font-size:11px;color:#686868;">56</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-avatar propClass="Text" [size]="64" text="李"></app-avatar>
          <span style="font-size:11px;color:#686868;">64</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-avatar propClass="Text" [size]="96" text="李"></app-avatar>
          <span style="font-size:11px;color:#686868;">96</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-avatar propClass="Text" [size]="128" text="李"></app-avatar>
          <span style="font-size:11px;color:#686868;">128</span>
        </div>
      </div>
    `,
    props: {},
  }),
};

export const Clickable: Story = {
  name: '可點擊狀態',
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap:24px; padding:24px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-avatar propClass="Text" [size]="44" text="張" [clickable]="false"></app-avatar>
          <span style="font-size:11px;color:#686868;">不可點擊</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-avatar propClass="Text" [size]="44" text="張" [clickable]="true"></app-avatar>
          <span style="font-size:11px;color:#686868;">可點擊（hover 試試）</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-avatar propClass="Icon" [size]="44" iconName="User" [clickable]="true"></app-avatar>
          <span style="font-size:11px;color:#686868;">Icon 可點擊</span>
        </div>
      </div>
    `,
    props: {},
  }),
};
