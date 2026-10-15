import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { ProcessModalComponent, ProcessModalType } from '../../../../index';

const meta: Meta<ProcessModalComponent> = {
  title: '浮層元件/Process Modal',
  id: 'process-modal',
  component: ProcessModalComponent,
  tags: ['autodocs'],
  argTypes: {
    type: {
      description: '彈窗類型：running（處理中）/ congratulation（成交慶祝）',
      control: { type: 'select' },
      options: ['running', 'congratulation'] satisfies ProcessModalType[],
      table: { defaultValue: { summary: 'running' } },
    },
    message: {
      description: '顯示於彈窗內的提示訊息',
      control: { type: 'text' },
    },
    isOpen: {
      description: '控制彈窗開閉',
      control: { type: 'boolean' },
      table: { defaultValue: { summary: 'false' } },
    },
    dismissed: {
      description: '點擊 backdrop 關閉時觸發（僅 congratulation 類型可關閉）',
      action: 'dismissed',
    },
  },
  args: {
    type: 'running',
    message: '資料處理中…',
    isOpen: false,
  },
};

export default meta;
type Story = StoryObj<ProcessModalComponent>;

export const RunningOpen: Story = {
  name: '處理中（開啟）',
  args: {
    isOpen: true,
    type: 'running',
    message: '資料處理中，請稍候，請勿關閉視窗...',
  },
};

export const CongratulationOpen: Story = {
  name: '成交慶祝（開啟）',
  args: {
    isOpen: true,
    type: 'congratulation',
    message: '恭喜！本次報價案件已正式成交，感謝您的努力！',
  },
};

export const Closed: Story = {
  name: '關閉狀態',
  args: {
    isOpen: false,
    type: 'running',
    message: '此彈窗目前為關閉狀態',
  },
};

export const Interactive: Story = {
  name: '互動示範',
  render: () => ({
    template: `
      <div style="padding:16px;">
        <p style="font-size:13px;color:#686868;margin-bottom:12px;">
          點擊按鈕開啟不同類型的彈窗。Congratulation 類型可點擊 backdrop 關閉。
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button
            (click)="openRunning()"
            style="padding:8px 16px;background:#4ba5b2;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;"
          >
            開啟「處理中」
          </button>
          <button
            (click)="openCongrats()"
            style="padding:8px 16px;background:#5da26b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;"
          >
            開啟「成交慶祝」
          </button>
        </div>
        <app-process-modal
          [type]="type"
          [message]="message"
          [isOpen]="isOpen"
          (dismissed)="onDismissed()"
        ></app-process-modal>
      </div>
    `,
    props: {
      type: 'running' as ProcessModalType,
      message: '',
      isOpen: false,
      openRunning() {
        (this as any).type = 'running';
        (this as any).message = '資料處理中，請稍候，請勿關閉視窗...';
        (this as any).isOpen = true;
        setTimeout(() => { (this as any).isOpen = false; }, 3000);
      },
      openCongrats() {
        (this as any).type = 'congratulation';
        (this as any).message = '恭喜！本次報價案件已正式成交，感謝您的努力！';
        (this as any).isOpen = true;
      },
      onDismissed() {
        (this as any).isOpen = false;
        action('dismissed')();
      },
    },
    moduleMetadata: { imports: [ProcessModalComponent] },
  }),
};
