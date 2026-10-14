import type { Meta, StoryObj } from '@storybook/angular';
import { ColorsPage, IconsPage, MotionPage, TypographyPage } from './foundation-pages.page';

const meta: Meta = {
  title: '基礎',
  id: 'foundations',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Colors: Story = {
  name: '色彩與 token',
  render: () => ({ template: '<ds-docs-colors-page></ds-docs-colors-page>', moduleMetadata: { imports: [ColorsPage] } }),
};

export const Typography: Story = {
  name: '字型',
  render: () => ({ template: '<ds-docs-typography-page></ds-docs-typography-page>', moduleMetadata: { imports: [TypographyPage] } }),
};

export const Motion: Story = {
  name: '動效',
  render: () => ({ template: '<ds-docs-motion-page></ds-docs-motion-page>', moduleMetadata: { imports: [MotionPage] } }),
};

export const Icons: Story = {
  name: '圖示',
  render: () => ({ template: '<ds-docs-icons-page></ds-docs-icons-page>', moduleMetadata: { imports: [IconsPage] } }),
};
