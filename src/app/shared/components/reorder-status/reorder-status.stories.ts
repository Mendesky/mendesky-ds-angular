import { Component, ViewChild } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent, ReorderStatusComponent, reorderMessage } from '../../../../index';

// 報讀區本身看不見；範例把它念的那一句照抄在畫面上，方便看它什麼時候有字、什麼時候清空。
@Component({
  selector: 'story-reorder-status',
  standalone: true,
  imports: [ReorderStatusComponent, ButtonComponent],
  template: `
    <div style="max-width:480px;display:flex;flex-direction:column;gap:12px;padding:12px;border:1px dashed #d3d3d3;border-radius:8px">
      <app-button text="模擬：項目一移到第 3 個" (btnClick)="announce()"></app-button>
      <div style="color:#686868">報讀區目前的文字：「{{ status?.text }}」</div>
      <app-reorder-status></app-reorder-status>
    </div>
    <p style="color:#939393">焦點移到虛線框外面，或滑鼠移出虛線框，報讀區就清空。</p>
  `,
})
class ReorderStatusDemoComponent {
  @ViewChild(ReorderStatusComponent, { static: true }) status!: ReorderStatusComponent;
  announce(): void {
    this.status.announce(reorderMessage({ name: '項目一', from: 0, to: 2, count: 4 }));
  }
}

const meta: Meta<ReorderStatusComponent> = {
  title: '工具/Reorder Status',
  id: 'reorder-status',
  component: ReorderStatusComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ReorderStatusComponent>;

export const Default: Story = {
  name: '念出移動結果',
  render: () => ({
    template: `<story-reorder-status></story-reorder-status>`,
    moduleMetadata: { imports: [ReorderStatusDemoComponent] },
  }),
};
