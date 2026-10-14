import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { UploadDropzoneComponent } from '../../../../index';

// 範例資料取自 dashboard-app 主線實際用法：
// - 結案文件 / 回填報價單原檔：acceptedTypes ['.pdf', '.jpg', '.jpeg', '.png']、maxSize 20
// - p1-operation：disabledHint「請先選擇文件類型」
// - new-case-wizard / report-original-file-modal：errorMessage「請至少上傳一份報價單原檔」
const meta: Meta<UploadDropzoneComponent> = {
  title: '互動元件/Upload Dropzone',
  id: 'upload-dropzone',
  component: UploadDropzoneComponent,
  tags: ['autodocs'],
  // 錯誤 tooltip 顯示在拖放區正上方，外層留出空間避免被畫面頂端切掉
  decorators: [componentWrapperDecorator((story) => `<div style="max-width:480px;padding-top:56px;">${story}</div>`)],
  argTypes: {
    acceptedTypes: {
      control: 'object',
      description: "可接受的副檔名陣列（需含點號，如 '.pdf'）；空陣列表示不限制類型",
      table: { defaultValue: { summary: '[]' } },
    },
    maxSize: {
      control: 'number',
      description: '單一檔案大小上限（MB）',
      table: { defaultValue: { summary: '20' } },
    },
    disabled: {
      control: 'boolean',
      description: '停用狀態，停用時拖放區不可點擊',
      table: { defaultValue: { summary: 'false' } },
    },
    disabledHint: {
      control: 'text',
      description: '停用時顯示的提示文字，取代主說明文字',
      table: { defaultValue: { summary: "''" } },
    },
    errorMessage: {
      control: 'text',
      description: '欄位驗證錯誤訊息；有值時顯示紅框與上方 tooltip（空字串 = 無錯誤）',
      table: { defaultValue: { summary: "''" } },
    },
    fileSelected: { action: 'fileSelected' },
    fileError: { action: 'fileError' },
  },
};

export default meta;
type Story = StoryObj<UploadDropzoneComponent>;

// ── 主範例：限 PDF / 圖片、20MB（可在 Controls 調整）──────
export const Default: Story = {
  name: '基本用法',
  args: {
    acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 20,
    disabled: false,
    disabledHint: '',
    errorMessage: '',
  },
};

// ── 只收 PDF ─────────────────────────────────────────
export const PdfOnly: Story = {
  name: '只收 PDF',
  args: {
    acceptedTypes: ['.pdf'],
    maxSize: 20,
  },
};

// ── 停用（前置條件未完成）────────────────────────────
export const Disabled: Story = {
  name: '停用（先完成前置條件）',
  args: {
    acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 50,
    disabled: true,
    disabledHint: '請先選擇文件類型',
  },
};

// ── 錯誤狀態（紅框 + 上方 tooltip）─────────────────────
export const WithError: Story = {
  name: '錯誤狀態',
  args: {
    acceptedTypes: ['.pdf'],
    maxSize: 20,
    errorMessage: '請至少上傳一份報價單原檔',
  },
};

// ── 互動：選檔後顯示結果（檔案只在瀏覽器內，不會上傳）──────
export const Interactive: Story = {
  name: '互動測試（選檔事件）',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-upload-dropzone
          [acceptedTypes]="['.pdf', '.jpg', '.jpeg', '.png']"
          [maxSize]="20"
          [errorMessage]="error"
          (fileSelected)="onSelected($event)"
          (fileError)="error = $event">
        </app-upload-dropzone>
        <div style="font-size:12px;color:#686868;">
          @if (names.length) {
            已選擇：{{ names.join('、') }}
          } @else {
            尚未選擇檔案（拖曳或點擊上方區域選檔，可試試不符類型或超過大小的檔案）
          }
        </div>
      </div>
    `,
    props: {
      names: [] as string[],
      error: '',
      onSelected(files: File[]) {
        (this as { names: string[] }).names = files.map((f) => f.name);
      },
    },
    moduleMetadata: { imports: [UploadDropzoneComponent] },
  }),
};
