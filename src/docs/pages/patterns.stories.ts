import type { Meta, StoryObj } from '@storybook/angular';
import { PatternsPage } from './patterns.page';

const meta: Meta = {
  title: '互動原則',
  id: 'patterns',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const AllPatterns: Story = {
  name: '全部原則',
  render: () => ({ template: '<ds-docs-patterns-page></ds-docs-patterns-page>', moduleMetadata: { imports: [PatternsPage] } }),
};
