import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-essentials'],
  framework: { name: '@storybook/angular', options: {} },
  docs: { defaultName: '說明' },
  core: { disableTelemetry: true },
};

export default config;
