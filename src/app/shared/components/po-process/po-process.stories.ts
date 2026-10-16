import type { Meta, StoryObj } from '@storybook/angular';
import { PoProcessComponent, PoProcessStatus } from '../../../../index';

const meta: Meta<PoProcessComponent> = {
  title: '展示元件/Po Process',
  id: 'po-process',
  component: PoProcessComponent,
  tags: ['autodocs'],
  argTypes: {
    status: {
      description: '目前處理狀態',
      control: { type: 'select' },
      options: ['Running', 'Success', 'Error', 'Congratulation'] satisfies PoProcessStatus[],
      table: { defaultValue: { summary: 'Running' } },
    },
    message: {
      description: '顯示於元件內的提示訊息',
      control: { type: 'text' },
    },
  },
  args: {
    status: 'Running',
    message: '資料處理中，請稍候...',
  },
};

export default meta;
type Story = StoryObj<PoProcessComponent>;

export const Running: Story = {
  name: '處理中',
  args: {
    status: 'Running',
    message: '資料處理中，請稍候...',
  },
};

export const Success: Story = {
  name: '成功',
  args: {
    status: 'Success',
    message: '成功！項目已完成',
  },
};

export const Error: Story = {
  name: '錯誤',
  args: {
    status: 'Error',
    message: '處理失敗，請重試',
  },
};

export const Congratulation: Story = {
  name: '恭喜完成',
  args: {
    status: 'Congratulation',
    message: '恭喜！申請已送出',
  },
};

export const AllStatuses: Story = {
  name: '所有狀態',
  render: () => ({
    template: `
      <div style="display:flex; flex-wrap:wrap; gap:24px; padding:16px;">
        <div style="flex:1; min-width:200px;">
          <p style="font-size:12px;color:#686868;margin-bottom:8px;">Running</p>
          <app-po-process status="Running" message="資料處理中，請稍候..."></app-po-process>
        </div>
        <div style="flex:1; min-width:200px;">
          <p style="font-size:12px;color:#686868;margin-bottom:8px;">Success</p>
          <app-po-process status="Success" message="成功！項目已完成"></app-po-process>
        </div>
        <div style="flex:1; min-width:200px;">
          <p style="font-size:12px;color:#686868;margin-bottom:8px;">Error</p>
          <app-po-process status="Error" message="處理失敗，請重試"></app-po-process>
        </div>
        <div style="flex:1; min-width:200px;">
          <p style="font-size:12px;color:#686868;margin-bottom:8px;">Congratulation</p>
          <app-po-process status="Congratulation" message="恭喜！申請已送出"></app-po-process>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [PoProcessComponent] },
  }),
};
