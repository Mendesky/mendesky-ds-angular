import type { Meta, StoryObj } from '@storybook/angular';
import { TextareaComponent } from '../../../../index';

const meta: Meta<TextareaComponent> = {
  title: '表單元件/Textarea',
  id: 'textarea',
  component: TextareaComponent,
  tags: ['autodocs'],
  argTypes: {
    size: {
      description: '輸入框尺寸',
      control: { type: 'select' },
      options: ['M', 'L'],
    },
    placeholder: {
      description: '占位提示文字',
      control: { type: 'text' },
    },
    errorMessage: {
      description: '錯誤訊息，有值時顯示錯誤樣式',
      control: { type: 'text' },
    },
    disabled: {
      description: '是否禁用',
      control: { type: 'boolean' },
    },
    valueChange: { action: 'valueChange' },
  },
};

export default meta;
type Story = StoryObj<TextareaComponent>;

export const Default: Story = {
  name: 'Default (L)',
  args: {
    size: 'L',
    placeholder: '請輸入備註說明…',
    errorMessage: '',
    disabled: false,
  },
};

export const SizeM_Preview: Story = {
  name: 'Size M（預覽）',
  args: {
    size: 'M',
    placeholder: '請輸入備註說明…',
    errorMessage: '',
    disabled: false,
  },
};

export const SizeM: Story = {
  name: 'Size M',
  args: {
    size: 'M',
    placeholder: '請輸入備註說明…',
    errorMessage: '',
    disabled: false,
  },
};

export const WithError: Story = {
  name: '有錯誤訊息',
  args: {
    size: 'L',
    placeholder: '請輸入備註說明…',
    errorMessage: '請填寫備註',
    disabled: false,
  },
};

export const Disabled: Story = {
  name: '禁用狀態',
  args: {
    size: 'L',
    placeholder: '此欄位目前不可編輯',
    errorMessage: '',
    disabled: true,
  },
};

export const AllStates: Story = {
  name: '所有狀態（並排）',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px; padding: 24px;">
        <div>
          <p style="font-size: 12px; color: #888; margin-bottom: 8px;">Default (L)</p>
          <app-textarea size="L" placeholder="請輸入備註說明…"></app-textarea>
        </div>
        <div>
          <p style="font-size: 12px; color: #888; margin-bottom: 8px;">Size M</p>
          <app-textarea size="M" placeholder="請輸入備註說明…"></app-textarea>
        </div>
        <div>
          <p style="font-size: 12px; color: #888; margin-bottom: 8px;">Size S</p>
          <app-textarea size="S" placeholder="請輸入備註說明…"></app-textarea>
        </div>
        <div>
          <p style="font-size: 12px; color: #888; margin-bottom: 8px;">有錯誤訊息</p>
          <app-textarea size="L" placeholder="請輸入備註說明…" errorMessage="請填寫備註"></app-textarea>
        </div>
        <div>
          <p style="font-size: 12px; color: #888; margin-bottom: 8px;">禁用</p>
          <app-textarea size="L" placeholder="此欄位目前不可編輯" [disabled]="true"></app-textarea>
        </div>
      </div>
    `,
  }),
};
