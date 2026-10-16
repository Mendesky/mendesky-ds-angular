import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { CheckChipComponent, CheckChipSize, CheckChipTheme } from '../../../../index';

const meta: Meta<CheckChipComponent> = {
  title: '互動元件/Check Chip',
  id: 'check-chip',
  component: CheckChipComponent,
  tags: ['autodocs'],
  argTypes: {
    text: {
      description: '顯示文字',
      control: { type: 'text' },
    },
    size: {
      description: '尺寸：m（表單大）/ s（表單小，預設）/ xs（緊湊）',
      control: { type: 'select' },
      options: ['m', 's', 'xs'],
    },
    theme: {
      description: '選中後的色彩主題',
      control: { type: 'select' },
      options: ['default', 'transparent', 'transparent-grey'],
    },
  },
  args: {
    text: '選項一',
    size: 's',
    theme: 'default',
  },
};

export default meta;
type Story = StoryObj<CheckChipComponent>;

export const Default: Story = {
  name: '預設',
  args: {
    text: '網頁設計',
    size: 's',
    theme: 'default',
  },
};

export const AllSizes: Story = {
  name: '所有尺寸',
  render: () => ({
    imports: [FormsModule, CheckChipComponent],
    template: `
      <div style="display:flex; align-items:center; gap:16px; padding:16px; flex-wrap:wrap;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <app-check-chip text="m 尺寸" size="m" [(ngModel)]="checkedM"></app-check-chip>
          <span style="font-size:11px;color:#686868;">m</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <app-check-chip text="s 尺寸" size="s" [(ngModel)]="checkedS"></app-check-chip>
          <span style="font-size:11px;color:#686868;">s（預設）</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <app-check-chip text="xs 尺寸" size="xs" [(ngModel)]="checkedXs"></app-check-chip>
          <span style="font-size:11px;color:#686868;">xs</span>
        </div>
      </div>
    `,
    props: {
      checkedM: false,
      checkedS: false,
      checkedXs: false,
    },
  }),
};

export const AllThemes: Story = {
  name: '所有主題',
  render: () => ({
    imports: [FormsModule, CheckChipComponent],
    template: `
      <div style="display:flex; flex-direction:column; gap:12px; padding:16px;">
        <p style="font-size:12px;color:#686868;margin:0;">點擊切換選取狀態以查看各主題效果：</p>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
            <app-check-chip text="Default" size="s" theme="default" [(ngModel)]="checkedDefault"></app-check-chip>
            <span style="font-size:11px;color:#686868;">default</span>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
            <app-check-chip text="Transparent" size="s" theme="transparent" [(ngModel)]="checkedTransparent"></app-check-chip>
            <span style="font-size:11px;color:#686868;">transparent</span>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
            <app-check-chip text="Transparent Grey" size="s" theme="transparent-grey" [(ngModel)]="checkedGrey"></app-check-chip>
            <span style="font-size:11px;color:#686868;">transparent-grey</span>
          </div>
        </div>
      </div>
    `,
    props: {
      checkedDefault: false,
      checkedTransparent: false,
      checkedGrey: false,
    },
  }),
};

export const Checked: Story = {
  name: '已選取狀態',
  render: () => ({
    imports: [FormsModule, CheckChipComponent],
    template: `
      <div style="display:flex; align-items:center; gap:12px; padding:16px; flex-wrap:wrap;">
        <app-check-chip text="網頁設計" size="s" theme="default" [(ngModel)]="c1"></app-check-chip>
        <app-check-chip text="平面設計" size="s" theme="default" [(ngModel)]="c2"></app-check-chip>
        <app-check-chip text="攝影" size="s" theme="default" [(ngModel)]="c3"></app-check-chip>
        <app-check-chip text="影音剪輯與後製" size="s" theme="default" [(ngModel)]="c4"></app-check-chip>
        <app-check-chip text="UI/UX" size="s" theme="default" [(ngModel)]="c5"></app-check-chip>
      </div>
    `,
    props: {
      c1: true,
      c2: true,
      c3: false,
      c4: false,
      c5: false,
    },
  }),
};

export const Interactive: Story = {
  name: '互動示範 — 擅長領域',
  render: () => ({
    imports: [FormsModule, CheckChipComponent],
    template: `
      <div style="padding:16px; max-width:480px;">
        <p style="font-size:13px;font-weight:600;margin-bottom:12px;">擅長領域（可複選）</p>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <app-check-chip text="網頁設計" size="s" [(ngModel)]="web"></app-check-chip>
          <app-check-chip text="平面設計" size="s" [(ngModel)]="graphic"></app-check-chip>
          <app-check-chip text="攝影" size="s" [(ngModel)]="photo"></app-check-chip>
          <app-check-chip text="影音剪輯與後製" size="s" [(ngModel)]="video"></app-check-chip>
          <app-check-chip text="UI/UX" size="s" [(ngModel)]="uiux"></app-check-chip>
          <app-check-chip text="文案撰寫" size="s" [(ngModel)]="copy"></app-check-chip>
        </div>
        <p style="font-size:12px;color:#686868;margin-top:12px;">
          已勾選：{{ selectedLabels() }}
        </p>
      </div>
    `,
    props: {
      web: false,
      graphic: false,
      photo: false,
      video: false,
      uiux: false,
      copy: false,
      // Storybook 以 Object.assign 把 props 複製到 wrapper 元件：getter 只會在複製當下求值一次，之後勾選不會更新顯示。
      // 改成方法，由模板每次變更偵測時呼叫（this 為 wrapper 元件，讀得到 ngModel 回寫的最新值）。與 radio-chip 的 Selected 修法一致。
      selectedLabels() {
        const labels = [];
        if ((this as any).web) labels.push('網頁設計');
        if ((this as any).graphic) labels.push('平面設計');
        if ((this as any).photo) labels.push('攝影');
        if ((this as any).video) labels.push('影音剪輯與後製');
        if ((this as any).uiux) labels.push('UI/UX');
        if ((this as any).copy) labels.push('文案撰寫');
        return labels.length ? labels.join('、') : '（未選）';
      },
    },
  }),
};
