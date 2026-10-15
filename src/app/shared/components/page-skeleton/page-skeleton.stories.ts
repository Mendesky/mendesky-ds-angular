import type { Meta, StoryObj } from '@storybook/angular';
import { PageSkeletonComponent } from '../../../../index';

const meta: Meta<PageSkeletonComponent> = {
  title: '展示元件/Page Skeleton',
  id: 'page-skeleton',
  component: PageSkeletonComponent,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<PageSkeletonComponent>;

export const Default: Story = {
  name: 'Default',
  args: {},
};
