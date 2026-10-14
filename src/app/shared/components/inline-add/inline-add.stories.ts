import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { CheckChipComponent, FieldComponent, InlineAddComponent } from '../../../../index';

const meta: Meta<InlineAddComponent> = {
  title: '互動元件/Inline Add',
  id: 'inline-add',
  component: InlineAddComponent,
  tags: ['autodocs'],
  argTypes: {
    buttonText: {
      control: 'text',
      description: '觸發鈕文字',
      table: { defaultValue: { summary: '＋ 新增其他項目' } },
    },
    placeholder: {
      control: 'text',
      description: 'inline 輸入框 placeholder',
      table: { defaultValue: { summary: '輸入後按 Enter' } },
    },
    size: {
      control: 'select',
      options: ['S', 'M'],
      description: '尺寸，對齊相鄰 chip / button',
      table: { defaultValue: { summary: 'S' } },
    },
    disabled: {
      control: 'boolean',
      description: '停用觸發鈕（權限控管用）',
      table: { defaultValue: { summary: 'false' } },
    },
    add: { action: 'add' },
  },
};

export default meta;
type Story = StoryObj<InlineAddComponent>;

// ── 主範例：點觸發鈕 → 原地變輸入框 → Enter 提交（在 Actions 面板看 add 事件） ──
// placeholder 取自 dashboard-app 前所資料「前所資訊及更換原因」
export const Default: Story = {
  name: '預設',
  args: {
    buttonText: '＋ 新增其他項目',
    placeholder: '輸入更換原因後按 Enter',
    size: 'S',
    disabled: false,
  },
};

// ── 尺寸 M ─────────────────────────────────────────────────
export const SizeM: Story = {
  name: '尺寸 M',
  args: {
    buttonText: '＋ 新增其他項目',
    placeholder: '輸入後按 Enter',
    size: 'M',
    disabled: false,
  },
};

// ── 停用（唯讀時，比照 dashboard-app 交接單的 readonly） ──────
export const Disabled: Story = {
  name: '停用',
  args: {
    buttonText: '＋ 新增其他項目',
    placeholder: '輸入服務業務後按 Enter',
    size: 'S',
    disabled: true,
  },
};

// ── chip 群組尾端新增自訂項：去重、加入清單、勾選都由父層處理 ──
// 選項取自 dashboard-app p1-operation 的 DEFAULT_CHANGE_REASONS
export const InChipGroup: Story = {
  name: 'chip 群組新增自訂項',
  render: () => {
    const reasons = ['會計師/記帳士退休', '服務不好', '專業不足', '境外公司'];
    const checked: Record<string, boolean> = {};
    return {
      props: {
        reasons,
        checked,
        addCustom: (name: string) => {
          if (!reasons.includes(name)) reasons.push(name);
          checked[name] = true; // 新增即視為選取
        },
      },
      template: `
        <div style="max-width:560px;">
          <app-field label="前所資訊及更換原因" hint="可複選" [required]="true">
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;" role="group">
              @for (reason of reasons; track reason) {
                <app-check-chip [text]="reason" theme="default" size="s" [(ngModel)]="checked[reason]"></app-check-chip>
              }
              <app-inline-add placeholder="輸入更換原因後按 Enter" (add)="addCustom($event)"></app-inline-add>
            </div>
          </app-field>
        </div>
      `,
      moduleMetadata: { imports: [InlineAddComponent, CheckChipComponent, FieldComponent, FormsModule] },
    };
  },
};
