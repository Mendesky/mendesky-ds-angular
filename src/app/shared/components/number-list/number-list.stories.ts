// 範例資料取自 dashboard-app 主線：src/app/features/quoting-cases/models/client-document-catalog.ts（客戶文件小分類名稱，作 label）、
// src/app/features/quoting-cases/components/client-documents-modal/client-documents-modal.component.spec.ts（檔名 fixture，作 text）、
// src/app/features/quoting-cases/components/handover-document-modal/pages/hdm-page4-maintenance/cards/p4-1-interview-basic-card/（「訪談人」）
import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { NumberListComponent, NumberListAction } from '../../../../index';

const meta: Meta<NumberListComponent> = {
  title: '展示元件/Number List',
  id: 'number-list',
  component: NumberListComponent,
  tags: ['autodocs'],
  argTypes: {
    size: {
      description: '元件尺寸；S 小 / M 大',
      control: { type: 'select' },
      options: ['S', 'M'],
      table: { defaultValue: { summary: 'S' } },
    },
    background: {
      description: 'Hover 底色',
      control: { type: 'select' },
      options: ['white', 'grey10', 'grey20'],
      table: { defaultValue: { summary: 'white' } },
    },
    label: {
      description: 'Label chip 文字；空字串時不顯示。≥1024px 放不下截成「…」並在截斷時給全文 tooltip；<1024px 換行',
      control: { type: 'text' },
    },
    text: {
      description: '主文字內容；規則同 label',
      control: { type: 'text' },
    },
    number1: {
      description: '右側數字 1（Inter SemiBold）',
      control: { type: 'text' },
    },
    number2: {
      description: '右側數字 2（較深色）',
      control: { type: 'text' },
    },
    actions: {
      description: '操作按鈕清單：view / download / edit / delete / subview（右側固定依 檢視／下載／編輯／刪除 排列；手機只留圖示）',
      control: { type: 'object' },
    },
    avatarText: {
      description: '顯示 Avatar；傳入姓名文字作為 avatar 內容',
      control: { type: 'text' },
    },
    actionClick: {
      description: '操作按鈕點擊時觸發，回傳 NumberListAction',
      action: 'actionClick',
    },
  },
  args: {
    size: 'S',
    background: 'white',
    label: '日記帳',
    text: '日記帳_上.pdf',
    number1: '123456',
    number2: '',
    actions: ['view', 'download'],
    avatarText: '',
  },
};

export default meta;
type Story = StoryObj<NumberListComponent>;

export const Default: Story = {
  name: '預設',
  args: {
    label: '日記帳',
    text: '日記帳_上.pdf',
    number1: '123456',
    actions: ['view', 'download'],
  },
};

export const SizeM: Story = {
  name: '大尺寸 (M)',
  args: {
    size: 'M',
    label: '案件編號',
    text: '王小華',
    number1: '2024-0001',
    number2: '78,500',
    actions: ['view', 'download'],
  },
};

export const GreyBackground: Story = {
  name: '灰色底色',
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:4px; padding:16px; max-width:520px;">
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:4px;">grey10</p>
          <app-number-list
            background="grey10"
            label="資產負債表"
            text="資產負債表.pdf"
            number1="NL-2024-789"
            [actions]="['view']"
          ></app-number-list>
        </div>
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:4px;">grey20</p>
          <app-number-list
            background="grey20"
            label="日記帳"
            text="日記帳_下.pdf"
            number1="NL-2024-790"
            [actions]="['view']"
          ></app-number-list>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [NumberListComponent] },
  }),
};

export const AllActions: Story = {
  name: '所有操作按鈕',
  args: {
    label: '報價案件',
    text: '林俊宏',
    number1: 'QT-2024-112',
    number2: '125,000',
    actions: ['subview', 'view', 'download', 'delete'],
  },
};

export const WithAvatar: Story = {
  name: '含 Avatar',
  args: {
    label: '訪談人',
    text: '陳怡君',
    number1: '0045',
    actions: ['view'],
    avatarText: '陳怡君',
  },
};

export const Interactive: Story = {
  name: '互動示範',
  render: () => ({
    template: `
      <div style="padding:16px; max-width:520px;">
        <p style="font-size:13px;color:#686868;margin-bottom:12px;">
          點擊操作按鈕可查看觸發的 actionClick 事件（見 Actions 面板）：
        </p>
        <app-number-list
          label="401 營業稅申報書"
          text="401.pdf"
          number1="TW-2024-99887"
          number2="245,000"
          [actions]="['subview','view','download','delete']"
          (actionClick)="onAction($event)"
        ></app-number-list>
        <div *ngIf="lastAction" style="margin-top:12px;font-size:13px;">
          最後觸發：<strong>{{ lastAction }}</strong>
        </div>
      </div>
    `,
    props: {
      lastAction: null as string | null,
      onAction(act: NumberListAction) {
        (this as any).lastAction = act;
        action('actionClick')(act);
      },
    },
    moduleMetadata: { imports: [NumberListComponent] },
  }),
};
