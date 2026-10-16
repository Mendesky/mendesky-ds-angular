import { componentWrapperDecorator } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { FileListComponent, FileItem } from '../../../../index';

/** 有類型模式（例如依文件類型分類的附件）：type 由父層帶入，渲染成 label chip */
const typedDocs: FileItem[] = [
  { id: 'd1', name: 'a.pdf', size: 2048, type: '企劃書' },
  { id: 'd2', name: 'a.jpeg', size: 0, type: '其他' },
];

/** 無類型模式（例如 wizard 裡只收單一種文件）：不帶 type，不渲染 chip */
const untypedDocs: FileItem[] = [
  { id: 'doc-1', name: '檢核表.pdf', size: 100 },
];

const meta: Meta<FileListComponent> = {
  title: '展示元件/File List',
  id: 'file-list',
  component: FileListComponent,
  tags: ['autodocs'],
  argTypes: {
    docs: {
      control: 'object',
      description: 'FileItem[]：{ id, name, size, type?, url?, mimeType? }，size 單位 bytes；size 為 0 時只顯示檔名',
      table: { defaultValue: { summary: '[]' } },
    },
    disabled: {
      control: 'boolean',
      description: '唯讀模式，只剩 view',
      table: { defaultValue: { summary: 'false' } },
    },
    emptyText: {
      control: 'text',
      description: '空狀態提示文字；空字串時不渲染空狀態',
      table: { defaultValue: { summary: "'尚未上傳任何檔案'" } },
    },
    removeFile: { action: 'removeFile', description: '點 delete 時 emit doc.id' },
    viewFile: { action: 'viewFile', description: '點 view 時 emit doc.id' },
  },
  args: {
    docs: typedDocs,
    disabled: false,
    emptyText: '尚未上傳任何檔案',
  },
  decorators: [componentWrapperDecorator((story) => `<div style="max-width:520px;">${story}</div>`)],
};

export default meta;
type Story = StoryObj<FileListComponent>;

// ── 主範例：有類型模式，可用 Controls 調整 ─────────────────────
export const Default: Story = {
  name: '預設（有類型）',
};

// ── 無類型模式 ─────────────────────────────────────────────────
export const Untyped: Story = {
  name: '無類型（不顯示 chip）',
  args: { docs: untypedDocs },
};

// ── 唯讀 ───────────────────────────────────────────────────────
export const ReadOnly: Story = {
  name: '唯讀（只剩檢視）',
  args: { docs: typedDocs, disabled: true },
};

// ── 空狀態 ─────────────────────────────────────────────────────
export const Empty: Story = {
  name: '空狀態',
  args: { docs: [], emptyText: '尚未上傳原始檔案' },
};

// ── 空清單且不顯示空狀態 ───────────────────────────────────────
export const EmptyHidden: Story = {
  name: '空清單、不顯示空狀態（emptyText 空字串）',
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex;flex-direction:column;gap:6px;">
        <app-file-list [docs]="docs" [emptyText]="emptyText"></app-file-list>
        <span class="noto-12-regular" style="color:#939393;">（上方沒有任何輸出：emptyText 為空字串時不渲染空狀態，避免多出 padding）</span>
      </div>
    `,
    moduleMetadata: { imports: [FileListComponent] },
  }),
  args: { docs: [], emptyText: '' },
};
