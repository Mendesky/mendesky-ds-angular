import type { Meta, StoryObj } from '@storybook/angular';
import { CollapsibleComponent, CollapsibleGroupComponent } from '../../../../index';

const meta: Meta<CollapsibleGroupComponent> = {
  title: '互動元件/Collapsible Group',
  id: 'collapsible-group',
  component: CollapsibleGroupComponent,
  tags: ['autodocs'],
  argTypes: {
    single: { control: 'boolean', description: '一次只開一段', table: { defaultValue: { summary: 'false' } } },
  },
};

export default meta;
type Story = StoryObj<CollapsibleGroupComponent>;

const BODY = `<div style="padding:12px 16px;color:#686868">這一組的設定。</div>`;

// ── 一次只開一段：打開另一段，原本開著的那段收起來 ──────────
export const Single: Story = {
  name: '一次只開一段',
  args: { single: true },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [CollapsibleComponent] },
    template: `
      <div style="max-width:560px">
        <app-collapsible-group [single]="single">
          <app-collapsible title="第一組設定" [expanded]="true">${BODY}</app-collapsible>
          <app-collapsible title="第二組設定">${BODY}</app-collapsible>
          <app-collapsible title="第三組設定">${BODY}</app-collapsible>
        </app-collapsible-group>
      </div>
    `,
  }),
};
