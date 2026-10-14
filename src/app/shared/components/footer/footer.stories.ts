import type { Meta, StoryObj } from '@storybook/angular';
import { FooterComponent } from '../../../../index';

// Footer 沒有 Input/Output，文字寫死在元件內。
// 父層能調整的是 CSS 自訂屬性（見 footer.docs.ts 的表格），所以 Controls 調的是這四個變數，
// 不是元件屬性。預設值與 RWD 覆寫值皆取自 footer.docs.ts / footer.component.scss。

interface FooterCssArgs {
  /** --footer-padding */
  padding: string;
  /** --footer-font-size */
  fontSize: string;
  /** --footer-word-break */
  wordBreak: string;
  /** --footer-overflow-wrap */
  overflowWrap: string;
}

/** 把 Controls 的值組成 inline style 字串，掛在 app-footer 上（CSS 變數會往內層繼承） */
const toStyle = (a: FooterCssArgs): string =>
  [
    `--footer-padding: ${a.padding}`,
    `--footer-font-size: ${a.fontSize}`,
    `--footer-word-break: ${a.wordBreak}`,
    `--footer-overflow-wrap: ${a.overflowWrap}`,
  ].join('; ');

const meta: Meta<FooterCssArgs> = {
  title: '展示元件/Footer',
  id: 'footer',
  component: FooterComponent,
  tags: ['autodocs'],
  argTypes: {
    padding: {
      name: '--footer-padding',
      control: 'text',
      description: '整體 padding',
      table: { defaultValue: { summary: '10px 10px 20px' } },
    },
    fontSize: {
      name: '--footer-font-size',
      control: 'text',
      description: '字體大小',
      table: { defaultValue: { summary: '1em' } },
    },
    wordBreak: {
      name: '--footer-word-break',
      control: { type: 'select' },
      options: ['normal', 'keep-all', 'break-all'],
      description: '換行規則',
      table: { defaultValue: { summary: 'normal' } },
    },
    overflowWrap: {
      name: '--footer-overflow-wrap',
      control: { type: 'select' },
      options: ['normal', 'break-word', 'anywhere'],
      description: '溢出換行',
      table: { defaultValue: { summary: 'normal' } },
    },
  },
  args: {
    padding: '10px 10px 20px',
    fontSize: '1em',
    wordBreak: 'normal',
    overflowWrap: 'normal',
  },
  render: (args) => ({
    props: { cssText: toStyle(args) },
    template: `<app-footer [attr.style]="cssText"></app-footer>`,
    moduleMetadata: { imports: [FooterComponent] },
  }),
};

export default meta;
type Story = StoryObj<FooterCssArgs>;

// ── 主範例：預設樣式，可用 Controls 調整四個 CSS 變數 ─────────────
export const Default: Story = {
  name: '預設',
  parameters: {
    docs: {
      source: { code: '<app-footer />' },
    },
  },
};

// ── RWD 覆寫（docs 範例中 tablet-down 的值）─────────────────────
export const TabletOverride: Story = {
  name: 'RWD 覆寫（平板以下）',
  args: {
    padding: '12px 10px',
    fontSize: '12px',
    wordBreak: 'keep-all',
    overflowWrap: 'break-word',
  },
  parameters: {
    docs: {
      source: {
        language: 'scss',
        code: `// 父元件 SCSS，不需 ::ng-deep
@include bp.tablet-down {
  app-footer {
    --footer-padding: 12px 10px;
    --footer-font-size: 12px;
    --footer-word-break: keep-all;
    --footer-overflow-wrap: break-word;
  }
}`,
      },
    },
  },
};

// ── 窄容器對照：預設 vs RWD 覆寫 ────────────────────────────────
export const NarrowCompare: Story = {
  name: '窄容器對照（預設 vs RWD 覆寫）',
  render: () => ({
    template: `
      <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;">
        <div style="width:320px;border:1px dashed #d0d0d0;">
          <div class="noto-12-regular" style="color:#686868;padding:6px 8px;">預設</div>
          <app-footer></app-footer>
        </div>
        <div style="width:320px;border:1px dashed #d0d0d0;">
          <div class="noto-12-regular" style="color:#686868;padding:6px 8px;">RWD 覆寫</div>
          <app-footer
            style="--footer-padding: 12px 10px; --footer-font-size: 12px; --footer-word-break: keep-all; --footer-overflow-wrap: break-word;">
          </app-footer>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [FooterComponent] },
  }),
  parameters: {
    controls: { disable: true },
  },
};
