import { Component, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import {
  ButtonComponent,
  ToastContainerComponent,
  ToastService,
  type ToastInput,
  type ToastSize,
  type ToastType,
} from '../../../../index';

// 範例訊息取自 dashboard-app 主線 ToastService.show() 的實際呼叫：
// - success「已開始下載」、error「下載失敗，請稍後再試」
// - loading「訪談表生成中」（client-view-modal / handover-share-viewer）
// - 含復原：「已匯入主要公司資料」＋「復原」（import-main-client-btn）
//
// toast-container 沒有任何 @Input，內容全來自 ToastService。為了讓範例一打開就看得到 toast、
// 也能用 Controls 調整，下面放一個只在範例頁使用的小元件：它 inject 同一個 ToastService，
// 依傳入的清單呼叫 show()（帶 persist，不會自動消失），並把 <app-toast-container> 一起畫出來。
@Component({
  selector: 'story-toast-preview',
  standalone: true,
  imports: [ToastContainerComponent, ButtonComponent],
  // 每個範例各用一份 ToastService，說明頁上多個範例的 toast 不會混在一起
  providers: [ToastService],
  template: `
    @if (withButtons) {
      <div style="display:flex;gap:12px;flex-wrap:wrap;padding:24px;">
        <app-button variant="filled" color="primary" size="M" text="成功 toast" (btnClick)="showSuccess()"></app-button>
        <app-button variant="elevated" color="danger" size="M" text="錯誤 toast" (btnClick)="showError()"></app-button>
        <app-button variant="elevated" color="neutral" size="M" text="含復原 toast" (btnClick)="showUndo()"></app-button>
      </div>
      <p style="margin:0;padding:0 24px;font-size:12px;color:#686868;">成功 3 秒、錯誤與含復原 5 秒後自動消失；多顆時最新的排在最下面。</p>
    }
    <app-toast-container></app-toast-container>
  `,
})
class ToastPreviewComponent implements OnChanges, OnDestroy {
  /** 一進來就顯示、不會自動消失的 toast 清單 */
  @Input() toasts: ToastInput[] = [];
  /** 顯示「按按鈕跳 toast」的互動按鈕 */
  @Input() withButtons = false;

  private readonly toast = inject(ToastService);
  private shownIds: string[] = [];

  ngOnChanges(): void {
    this.clear();
    this.shownIds = this.toasts.map((t) => this.toast.show({ ...t, persist: true }));
  }

  ngOnDestroy(): void {
    this.clear();
  }

  showSuccess(): void {
    this.toast.show({ type: 'success', message: '已開始下載' });
  }

  showError(): void {
    this.toast.show({ type: 'error', message: '下載失敗，請稍後再試' });
  }

  showUndo(): void {
    const id = this.toast.show({
      type: 'success',
      message: '已匯入主要公司資料',
      action: {
        label: '復原',
        onClick: () => {
          this.toast.dismiss(id);
          action('復原')();
        },
      },
    });
  }

  private clear(): void {
    this.shownIds.forEach((id) => this.toast.removeById(id));
    this.shownIds = [];
  }
}

/** 主範例的 Controls：調整要顯示的那一顆 toast */
interface ToastDemoArgs {
  type: ToastType;
  message: string;
  size: ToastSize;
  withAction: boolean;
}

type Args = ToastContainerComponent & ToastDemoArgs;

// toast-container 是 position:fixed（桌機右下角）。外層舞台加 transform，讓 fixed 以舞台為準，
// 範例才會關在框內，不會飄到說明頁的右下角。
const STAGE_STYLE =
  'position:relative;height:280px;overflow:hidden;transform:translateZ(0);' +
  'border-radius:8px;background:#f1f3f5;';

const meta: Meta<Args> = {
  title: '浮層元件/Toast Container 全域 Toast 容器',
  id: 'toast-container',
  component: ToastContainerComponent,
  tags: ['autodocs'],
  decorators: [componentWrapperDecorator((story) => `<div style="${STAGE_STYLE}">${story}</div>`)],
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['success', 'error', 'loading'] satisfies ToastType[],
      description: '（範例用）ToastService.show() 的 type',
    },
    message: {
      control: 'text',
      description: '（範例用）ToastService.show() 的 message',
    },
    size: {
      control: 'inline-radio',
      options: ['S', 'M'] satisfies ToastSize[],
      description: "（範例用）ToastService.show() 的 size；容器未指定時用 'S'",
    },
    withAction: {
      control: 'boolean',
      description: '（範例用）帶「復原」action；只有帶 action 的 toast 可點',
    },
  },
};

export default meta;
type Story = StoryObj<Args>;

// ── 主範例：用 Controls 調整一顆 toast ────────────────────
export const Default: Story = {
  name: '基本用法',
  args: {
    type: 'success',
    message: '已開始下載',
    size: 'S',
    withAction: false,
  },
  render: (args) => ({
    props: {
      toasts: [
        {
          type: args.type,
          message: args.message,
          size: args.size,
          action: args.withAction ? { label: '復原', onClick: action('復原') } : undefined,
        },
      ] satisfies ToastInput[],
    },
    template: `<story-toast-preview [toasts]="toasts"></story-toast-preview>`,
    moduleMetadata: { imports: [ToastPreviewComponent] },
  }),
};

// ── 多顆堆疊（最新在最下）───────────────────────────────
export const Stacked: Story = {
  name: '多顆堆疊',
  parameters: { controls: { disable: true } },
  render: () => ({
    props: {
      toasts: [
        { type: 'success', message: '已開始下載' },
        { type: 'error', message: '下載失敗，請稍後再試' },
        { type: 'loading', message: '訪談表生成中' },
      ] satisfies ToastInput[],
    },
    template: `<story-toast-preview [toasts]="toasts"></story-toast-preview>`,
    moduleMetadata: { imports: [ToastPreviewComponent] },
  }),
};

// ── 含復原（唯一可點的 toast）───────────────────────────
export const WithUndo: Story = {
  name: '含復原（可點擊）',
  parameters: { controls: { disable: true } },
  render: () => ({
    props: {
      toasts: [
        { type: 'success', message: '已匯入主要公司資料', action: { label: '復原', onClick: action('復原') } },
      ] satisfies ToastInput[],
    },
    template: `<story-toast-preview [toasts]="toasts"></story-toast-preview>`,
    moduleMetadata: { imports: [ToastPreviewComponent] },
  }),
};

// ── 互動：按按鈕呼叫 ToastService.show() ───────────────────
export const Interactive: Story = {
  name: '互動測試（呼叫 ToastService）',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<story-toast-preview [withButtons]="true"></story-toast-preview>`,
    moduleMetadata: { imports: [ToastPreviewComponent] },
  }),
};
