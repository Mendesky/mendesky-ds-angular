import type { Meta, StoryObj } from '@storybook/angular';
import { ToggleComponent } from '../../../../index';

const meta: Meta<ToggleComponent> = {
  title: '互動元件/Toggle',
  id: 'toggle',
  component: ToggleComponent,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: '開關狀態',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: '禁用狀態',
      table: { defaultValue: { summary: 'false' } },
    },
    checkedChange: { action: 'checkedChange' },
  },
};

export default meta;
type Story = StoryObj<ToggleComponent>;

export const Off: Story = {
  args: { checked: false, disabled: false },
};

export const On: Story = {
  args: { checked: true, disabled: false },
};

export const DisabledOff: Story = {
  args: { checked: false, disabled: true },
};

export const DisabledOn: Story = {
  args: { checked: true, disabled: true },
};

export const Interactive: Story = {
  name: '互動測試（可點擊切換）',
  render: () => {
    let checked = false;
    return {
      template: `
        <div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;">
          <app-toggle
            [checked]="checked"
            (checkedChange)="checked = $event"
          ></app-toggle>
          <span style="font-size:12px;color:#686868;">狀態：{{ checked ? 'On' : 'Off' }}</span>
        </div>
      `,
      props: { checked },
      moduleMetadata: { imports: [ToggleComponent] },
    };
  },
};

export const AllStates: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:24px;align-items:center;">
        <div style="text-align:center;">
          <app-toggle [checked]="false"></app-toggle>
          <div style="font-size:11px;color:#686868;margin-top:6px;">Off</div>
        </div>
        <div style="text-align:center;">
          <app-toggle [checked]="true"></app-toggle>
          <div style="font-size:11px;color:#686868;margin-top:6px;">On</div>
        </div>
        <div style="text-align:center;">
          <app-toggle [checked]="false" [disabled]="true"></app-toggle>
          <div style="font-size:11px;color:#686868;margin-top:6px;">Disabled Off</div>
        </div>
        <div style="text-align:center;">
          <app-toggle [checked]="true" [disabled]="true"></app-toggle>
          <div style="font-size:11px;color:#686868;margin-top:6px;">Disabled On</div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [ToggleComponent] },
  }),
};
