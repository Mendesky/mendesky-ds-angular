import type { Preview } from '@storybook/angular';
import { DsDocsPage } from './ds-docs-page';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    controls: { expanded: true },
    docs: { page: DsDocsPage },
    options: {
      storySort: { order: ['互動元件', '表單元件', '浮層元件', '展示元件', '工具', '基礎', ['色彩與 token', '字型', '動效', '圖示'], '互動原則'] },
    },
  },
};

export default preview;
