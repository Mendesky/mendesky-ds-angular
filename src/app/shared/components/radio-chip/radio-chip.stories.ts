// 範例資料取自 dashboard-app 主線：src/app/features/quoting-cases/models/account-type.model.ts（ACCOUNT_TYPE_OPTIONS 帳務類型：純簽證／稅務帳／管理帳／財務帳）
import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { FormsModule } from '@angular/forms';
import { RadioChipComponent, RadioChipSize } from '../../../../index';

const meta: Meta<RadioChipComponent> = {
  title: '互動元件/Radio Chip',
  id: 'radio-chip',
  component: RadioChipComponent,
  tags: ['autodocs'],
  argTypes: {
    text: {
      description: '顯示文字',
      control: { type: 'text' },
    },
    size: {
      description: '尺寸：m（大）/ s（中，預設）/ xs（小）',
      control: { type: 'select' },
      options: ['m', 's', 'xs'] satisfies RadioChipSize[],
      table: { defaultValue: { summary: 's' } },
    },
    showRadio: {
      description: '是否顯示左側 Radio 圓圈圖示',
      control: { type: 'boolean' },
      table: { defaultValue: { summary: 'true' } },
    },
    showCancel: {
      description: '選中後是否顯示右側取消（×）按鈕',
      control: { type: 'boolean' },
      table: { defaultValue: { summary: 'false' } },
    },
    cancelClick: {
      description: '點擊取消按鈕時觸發',
      action: 'cancelClick',
    },
  },
  args: {
    text: '稅務帳',
    size: 's',
    showRadio: true,
    showCancel: false,
  },
};

export default meta;
type Story = StoryObj<RadioChipComponent>;

export const Default: Story = {
  name: '預設',
  args: {
    text: '稅務帳',
    size: 's',
    showRadio: true,
    showCancel: false,
  },
};

export const WithCancel: Story = {
  name: '含取消按鈕',
  args: {
    text: '管理帳',
    size: 's',
    showRadio: true,
    showCancel: true,
  },
};

export const NoRadio: Story = {
  name: '無 Radio 圖示',
  args: {
    text: '財務帳',
    size: 's',
    showRadio: false,
    showCancel: false,
  },
};

export const AllSizes: Story = {
  name: '所有尺寸',
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap:16px; padding:16px; flex-wrap:wrap;">
        <div style="text-align:center;">
          <p style="font-size:12px;color:#686868;margin-bottom:6px;">m（大）</p>
          <app-radio-chip size="m" text="純簽證" [showRadio]="true"></app-radio-chip>
        </div>
        <div style="text-align:center;">
          <p style="font-size:12px;color:#686868;margin-bottom:6px;">s（中，預設）</p>
          <app-radio-chip size="s" text="稅務帳" [showRadio]="true"></app-radio-chip>
        </div>
        <div style="text-align:center;">
          <p style="font-size:12px;color:#686868;margin-bottom:6px;">xs（小）</p>
          <app-radio-chip size="xs" text="管理帳" [showRadio]="true"></app-radio-chip>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [RadioChipComponent] },
  }),
};

export const Selected: Story = {
  name: '已選中（ngModel）',
  render: () => ({
    template: `
      <div style="padding:16px;">
        <p style="font-size:13px;color:#686868;margin-bottom:12px;">
          點擊 Chip 可切換選中狀態；已選中時可點 × 取消選取：
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <app-radio-chip
            text="純簽證"
            size="s"
            [showRadio]="true"
            [showCancel]="true"
            [(ngModel)]="val1"
            (cancelClick)="val1 = false"
          ></app-radio-chip>
          <app-radio-chip
            text="稅務帳"
            size="s"
            [showRadio]="true"
            [showCancel]="true"
            [(ngModel)]="val2"
            (cancelClick)="val2 = false"
          ></app-radio-chip>
          <app-radio-chip
            text="管理帳"
            size="s"
            [showRadio]="true"
            [showCancel]="true"
            [(ngModel)]="val3"
            (cancelClick)="val3 = false"
          ></app-radio-chip>
          <app-radio-chip
            text="財務帳"
            size="s"
            [showRadio]="true"
            [showCancel]="true"
            [(ngModel)]="val4"
            (cancelClick)="val4 = false"
          ></app-radio-chip>
        </div>
        <div style="margin-top:12px;font-size:13px;color:#686868;">
          已選取：
          <strong>{{ selectedLabels() }}</strong>
        </div>
      </div>
    `,
    props: {
      val1: true,
      val2: false,
      val3: true,
      val4: false,
      // Angular template 的識別字一律從元件 context 取值：template 內寫 `Boolean` 拿到的是 ctx.Boolean（undefined），
      // 原本的 `.filter(Boolean)` 等於 `.filter(undefined)` → TypeError: undefined is not a function。改由方法在 TS 端計算。
      selectedLabels() {
        const self = this as any;
        const labels = [
          self.val1 && '純簽證',
          self.val2 && '稅務帳',
          self.val3 && '管理帳',
          self.val4 && '財務帳',
        ].filter(Boolean);
        return labels.length ? labels.join('、') : '（無）';
      },
    },
    moduleMetadata: { imports: [RadioChipComponent, FormsModule] },
  }),
};
