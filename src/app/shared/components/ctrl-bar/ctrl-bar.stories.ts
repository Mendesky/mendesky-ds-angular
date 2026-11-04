import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { CtrlBarComponent, CheckChipComponent, InputComponent } from '../../../../index';

// Ctrl Bar 本身是透明的左右兩格外框，沒放東西時畫面上什麼都看不到。
// 範例一律在兩格放上內容（左邊篩選、右邊搜尋），下方再墊一塊內容區，讓人看得出操作列在頁面上的位置。
// 範例內容用中性佔位文字（這個元件不綁定任何業務內容）。

/** 頁面底色與內容區：只為了在畫面上看得出操作列的位置，不屬於 Ctrl Bar 本身。
 *  內容區左緣對齊操作列的左內距：操作列在 768px 以下內距從 20px 縮成 10px，內容區跟著縮。 */
const PAGE_STYLE = 'background:#f0f4f8;padding:0 20px 16px 0;min-height:200px;';
const CONTENT_STYLE =
  'height:120px;border:1px dashed #bebebe;border-radius:8px;background:#fff;' +
  'display:flex;align-items:center;justify-content:center;color:#686868;';

const meta: Meta<CtrlBarComponent> = {
  title: '展示元件/Ctrl Bar',
  id: 'ctrl-bar',
  component: CtrlBarComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [FormsModule, CheckChipComponent, InputComponent] })],
  argTypes: {},
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '頁面或區塊頂部的操作列。元件只負責排版：左右兩格的內容由使用的人用 slot="left"、slot="right" 放進去，元件本身沒有任何輸入屬性，也沒有背景。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CtrlBarComponent>;

export const Default: Story = {
  name: '左邊篩選、右邊搜尋',
  render: () => ({
    props: { a: true, b: false, c: false, inset: matchMedia('(max-width: 767px)').matches ? 10 : 20 },
    template: `
      <div style="${PAGE_STYLE}">
        <app-ctrl-bar>
          <ng-container slot="left">
            <app-check-chip text="篩選一" [(ngModel)]="a"></app-check-chip>
            <app-check-chip text="篩選二" [(ngModel)]="b"></app-check-chip>
            <app-check-chip text="篩選三" [(ngModel)]="c"></app-check-chip>
          </ng-container>
          <ng-container slot="right">
            <app-input size="S" placeholder="搜尋" ariaLabel="搜尋"></app-input>
          </ng-container>
        </app-ctrl-bar>
        <div class="noto-14-regular" style="${CONTENT_STYLE}" [style.margin-left.px]="inset">頁面內容</div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      source: {
        code: `<app-ctrl-bar>
  <ng-container slot="left">
    <app-check-chip text="篩選一" [(ngModel)]="a"></app-check-chip>
    <app-check-chip text="篩選二" [(ngModel)]="b"></app-check-chip>
  </ng-container>
  <ng-container slot="right">
    <app-input size="S" placeholder="搜尋" ariaLabel="搜尋"></app-input>
  </ng-container>
</app-ctrl-bar>`,
      },
    },
  },
};

