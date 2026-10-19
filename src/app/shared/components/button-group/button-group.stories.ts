import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { ButtonGroupComponent, ButtonGroupOption } from '../../../../index';

const GENDER_OPTIONS: ButtonGroupOption[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
];

const POLICY_OPTIONS: ButtonGroupOption[] = [
  { value: 'new', label: '新契約' },
  { value: 'renew', label: '續保' },
  { value: 'change', label: '異動' },
];

const VIEW_OPTIONS: ButtonGroupOption[] = [
  { value: 'list', label: '清單' },
  { value: 'grid', label: '格狀' },
  { value: 'kanban', label: '看板' },
];

const meta: Meta<ButtonGroupComponent> = {
  title: '互動元件/Button Group',
  id: 'button-group',
  component: ButtonGroupComponent,
  tags: ['autodocs'],
  argTypes: {
    type: {
      description: '按鈕群組樣式類型',
      control: { type: 'select' },
      options: ['form', 'round', 'view'],
    },
    options: {
      description: '選項清單，每項含 value 與 label',
      control: { type: 'object' },
    },
    value: {
      description: '目前選取的值',
      control: { type: 'text' },
    },
    disabled: {
      description: '禁用整組按鈕',
      control: { type: 'boolean' },
    },
    errorMessage: {
      description: '錯誤訊息（僅 form 類型有效）',
      control: { type: 'text' },
    },
    valueChange: {
      description: '選取值變更時觸發',
      action: 'valueChange',
    },
  },
  args: {
    type: 'form',
    options: POLICY_OPTIONS,
    value: 'new',
    disabled: false,
    errorMessage: '',
  },
};

export default meta;
type Story = StoryObj<ButtonGroupComponent>;

export const FormType: Story = {
  name: 'Form 類型',
  args: {
    type: 'form',
    options: POLICY_OPTIONS,
    value: 'new',
  },
};

export const RoundType: Story = {
  name: 'Round 類型',
  args: {
    type: 'round',
    options: GENDER_OPTIONS,
    value: 'male',
  },
};

export const ViewType: Story = {
  name: 'View 類型',
  args: {
    type: 'view',
    options: VIEW_OPTIONS,
    value: 'list',
  },
};

export const WithError: Story = {
  name: '錯誤狀態',
  args: {
    type: 'form',
    options: POLICY_OPTIONS,
    value: null,
    errorMessage: '請選擇一種申請類型',
  },
};

export const Disabled: Story = {
  name: '禁用狀態',
  args: {
    type: 'form',
    options: POLICY_OPTIONS,
    value: 'renew',
    disabled: true,
  },
};

export const Interactive: Story = {
  name: '互動示範',
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:24px; padding:16px; max-width:480px;">
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:6px;">Form 類型 — 申請性質</p>
          <app-button-group
            type="form"
            [options]="policyOptions"
            [value]="policyValue"
            (valueChange)="onPolicyChange($event)"
          ></app-button-group>
          <p style="font-size:12px;margin-top:6px;">已選：{{ policyValue || '（未選）' }}</p>
        </div>
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:6px;">View 類型 — 顯示模式</p>
          <app-button-group
            type="view"
            [options]="viewOptions"
            [value]="viewValue"
            (valueChange)="onViewChange($event)"
          ></app-button-group>
          <p style="font-size:12px;margin-top:6px;">已選：{{ viewValue || '（未選）' }}</p>
        </div>
      </div>
    `,
    props: {
      policyOptions: POLICY_OPTIONS,
      policyValue: 'new' as string | null,
      viewOptions: VIEW_OPTIONS,
      viewValue: 'list' as string | null,
      onPolicyChange(val: string) {
        (this as any).policyValue = val;
        action('valueChange (policy)')(val);
      },
      onViewChange(val: string) {
        (this as any).viewValue = val;
        action('valueChange (view)')(val);
      },
    },
  }),
};
