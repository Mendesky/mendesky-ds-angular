import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { ProcessToastComponent, ToastType, ToastSize } from '../../../../index';

const meta: Meta<ProcessToastComponent> = {
  title: '浮層元件/Process Toast',
  id: 'process-toast',
  component: ProcessToastComponent,
  tags: ['autodocs'],
  argTypes: {
    type: {
      description: 'Toast 類型：success（成功）/ error（錯誤）',
      control: { type: 'select' },
      options: ['success', 'error'] satisfies ToastType[],
      table: { defaultValue: { summary: 'error' } },
    },
    message: {
      description: '顯示於 Toast 的訊息文字',
      control: { type: 'text' },
    },
    duration: {
      description: 'Toast 自動消失的毫秒數。caller 未指定時：有 action → 5000，沒 action → 3000',
      control: { type: 'number' },
      table: { defaultValue: { summary: '3000 / 5000 (有 action)' } },
    },
    size: {
      description: 'Toast 尺寸：M（預設 333×56px）/ S（260×40px 輕量版）',
      control: { type: 'select' },
      options: ['M', 'S'] satisfies ToastSize[],
      table: { defaultValue: { summary: 'M' } },
    },
    action: {
      description: '選填的 undo 按鈕：{ label, onClick }。按下 onClick 通常呼叫還原 API；自動消失代表使用者未反悔',
      control: { type: 'object' },
    },
    dismissed: {
      description: 'Toast 消失後觸發',
      action: 'dismissed',
    },
  },
  args: {
    type: 'success',
    message: '項目已成功建立',
    duration: 99999,
    size: 'M',
    stackMode: true,
  },
};

export default meta;
type Story = StoryObj<ProcessToastComponent>;

export const Success: Story = {
  name: '成功',
  args: {
    type: 'success',
    message: '項目已成功建立',
    duration: 99999,
  },
};

export const Error: Story = {
  name: '錯誤',
  args: {
    type: 'error',
    message: '操作失敗，請稍後再試',
    duration: 99999,
  },
};

export const SuccessSmall: Story = {
  name: '成功（S 小尺寸）',
  args: {
    type: 'success',
    message: '已儲存',
    duration: 99999,
    size: 'S',
  },
};

export const ErrorSmall: Story = {
  name: '錯誤（S 小尺寸）',
  args: {
    type: 'error',
    message: '操作失敗',
    duration: 99999,
    size: 'S',
  },
};

export const WithUndo: Story = {
  name: '含復原（reversibleToast）',
  args: {
    type: 'success',
    message: '已刪除「附件 A」',
    size: 'M',
    action: {
      label: '復原',
      onClick: () => action('undo-clicked')(),
    },
  },
};

export const WithUndoSmall: Story = {
  name: '含復原（S 小尺寸）',
  args: {
    type: 'success',
    message: '已移除項目',
    size: 'S',
    action: {
      label: '復原',
      onClick: () => action('undo-clicked')(),
    },
  },
};

export const Interactive: Story = {
  name: '互動示範（顯示 / 隱藏）',
  render: () => ({
    template: `
      <div style="padding:16px; min-height:120px;">
        <p style="font-size:13px;color:#686868;margin-bottom:12px;">
          點擊按鈕顯示 Toast，3 秒後自動消失。
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
          <button
            (click)="showSuccess()"
            style="padding:8px 16px;background:#5da26b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;"
          >
            顯示成功 Toast
          </button>
          <button
            (click)="showError()"
            style="padding:8px 16px;background:#cc5252;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;"
          >
            顯示錯誤 Toast
          </button>
        </div>
        <div
          *ngIf="visible"
          style="position:fixed;bottom:24px;right:24px;z-index:9999;"
        >
          <app-process-toast
            [type]="type"
            [message]="message"
            [duration]="3000"
            (dismissed)="onDismissed()"
          ></app-process-toast>
        </div>
      </div>
    `,
    props: {
      visible: false,
      type: 'success' as ToastType,
      message: '',
      showSuccess() {
        (this as any).type = 'success';
        (this as any).message = '項目已成功建立，請至項目清單查看';
        (this as any).visible = true;
      },
      showError() {
        (this as any).type = 'error';
        (this as any).message = '操作失敗，請稍後再試或聯繫系統管理員';
        (this as any).visible = true;
      },
      onDismissed() {
        (this as any).visible = false;
        action('dismissed')();
      },
    },
    moduleMetadata: { imports: [ProcessToastComponent] },
  }),
};
