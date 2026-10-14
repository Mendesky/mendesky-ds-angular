import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent, PortalTeleportDirective } from '../../../index';
import { portalTeleportDoc } from './portal-teleport.docs';

// 本 directive 沒有 @Input，也沒有業務文字；以下範例只用中性的說明文字示範「搬到 document.body」前後的差別。
//
// 被外送的元素是 position:fixed，會以整個視窗定位；說明頁中改用獨立 iframe 呈現每個範例，
// 外送的元素才不會跑到說明頁的角落。

/** 範例用的開關：是否套用 appPortalTeleport（directive 本身沒有屬性可調） */
interface PortalTeleportArgs {
  teleport: boolean;
}

const IMPORTS = [PortalTeleportDirective, ButtonComponent];

// 有 transform + overflow:hidden 的祖先：position:fixed 會改以它為準，並被它裁切
const TRAP_STYLE =
  'position:relative;height:160px;margin:24px;padding:12px 16px;overflow:hidden;transform:translateZ(0);' +
  'border:1px dashed #bebebe;border-radius:8px;background:#f1f3f5;font-size:12px;color:#686868;';

const FLOATING_STYLE =
  'position:fixed;right:24px;bottom:24px;padding:12px 16px;border-radius:8px;' +
  'background:#3a9ccd;color:#fff;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,0.15);';

const meta: Meta<PortalTeleportArgs> = {
  title: '工具/Portal Teleport 元素外送',
  id: 'portal-teleport',
  tags: ['autodocs'],
  parameters: {
    dsDoc: portalTeleportDoc,
    docs: { story: { inline: false, iframeHeight: 320 } },
  },
  argTypes: {
    teleport: {
      control: 'boolean',
      description: '（範例用）是否在浮動元素上套用 appPortalTeleport',
    },
  },
};

export default meta;
type Story = StoryObj<PortalTeleportArgs>;

// ── 主範例：切換 teleport 比較 position:fixed 的定位基準 ─────────
export const Default: Story = {
  name: '基本用法',
  args: { teleport: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="${TRAP_STYLE}">
        這個框有 transform 與 overflow:hidden。
        @if (teleport) {
          <div appPortalTeleport style="${FLOATING_STYLE}">已搬到 document.body：以視窗右下角定位</div>
        } @else {
          <div style="${FLOATING_STYLE}">未搬移：以虛線框右下角定位，超出框的部分會被裁切</div>
        }
      </div>
    `,
    moduleMetadata: { imports: IMPORTS },
  }),
};

// ── 互動：元素出現時搬過去，消失時從 body 移除 ─────────────────
export const Toggle: Story = {
  name: '互動測試（顯示 / 移除）',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div style="padding:24px;">
        <app-button variant="filled" color="primary" size="M"
          [text]="show ? '移除外送元素' : '顯示外送元素'"
          (btnClick)="show = !show"></app-button>
        <p style="font-size:12px;color:#686868;margin-top:12px;">
          顯示時元素在 ngOnInit 被搬到 document.body；移除時在 ngOnDestroy 從 body 拿掉。
        </p>
      </div>
      @if (show) {
        <div appPortalTeleport style="${FLOATING_STYLE}">內容</div>
      }
    `,
    props: { show: false },
    moduleMetadata: { imports: IMPORTS },
  }),
};

// ── 注意：搬家後就吃不到祖先的樣式 ───────────────────────────
export const StyleInheritance: Story = {
  name: '注意：祖先樣式不再繼承',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div style="margin:24px;padding:12px 16px;border:1px dashed #bebebe;border-radius:8px;color:#cc5252;--demo-bg:#fdecea;font-size:14px;">
        祖先設定了文字顏色與 CSS 變數 --demo-bg。
        <div style="margin-top:12px;padding:8px 12px;border-radius:6px;background:var(--demo-bg, #ffffff);border:1px solid #e5e5e5;">
          留在原處：繼承到紅字與底色
        </div>
        <div appPortalTeleport style="position:fixed;right:24px;bottom:24px;padding:8px 12px;border-radius:6px;background:var(--demo-bg, #ffffff);border:1px solid #e5e5e5;">
          已搬到 body：紅字與底色都沒了
        </div>
      </div>
    `,
    moduleMetadata: { imports: IMPORTS },
  }),
};
