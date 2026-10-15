import type { Meta, StoryObj } from '@storybook/angular';
import { CtrlBarComponent } from '../../../../index';

const meta: Meta<CtrlBarComponent> = {
  title: '展示元件/Ctrl Bar',
  id: 'ctrl-bar',
  component: CtrlBarComponent,
  tags: ['autodocs'],
  argTypes: {},
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '控制列元件，提供頁面頂部的操作區域，無外部 @Input 屬性，內容由元件自身決定。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CtrlBarComponent>;

export const Default: Story = {
  name: 'Default',
  args: {},
};
