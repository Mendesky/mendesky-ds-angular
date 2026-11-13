import type { Meta, StoryObj } from '@storybook/angular';
import {
  ActionMenuComponent, ButtonComponent, DividerComponent, ICON_REGISTRY, LabelComponent, MenuItemComponent,
} from '../../../../index';

const iconNames = ['', ...Object.keys(ICON_REGISTRY)];

/** 選單放在這個外框裡：選單會搬到 body、出現在外框下方，外框留出下方的空間 */
const inMenu = (menu: string, minHeight = 160) => `
  <div style="position:relative;display:inline-block;padding-bottom:${minHeight}px;">
    ${menu}
  </div>
`;

const SORT_OPTIONS = [
  { value: 'newest', label: '由新到舊' },
  { value: 'oldest', label: '由舊到新' },
  { value: 'name-asc', label: '名稱 A→Z' },
  { value: 'name-desc', label: '名稱 Z→A' },
  { value: 'updated-desc', label: '更新時間 新→舊' },
  { value: 'updated-asc', label: '更新時間 舊→新' },
];

const meta: Meta<MenuItemComponent> = {
  title: '互動元件/Menu Item',
  id: 'menu-item',
  component: MenuItemComponent,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: '這一項要做什麼，或代表哪一個值（必填）',
    },
    description: {
      control: 'text',
      description: '文字下方的說明；空字串不顯示',
      table: { defaultValue: { summary: "''" } },
    },
    icon: {
      control: 'select',
      options: iconNames,
      description: '文字左邊的 DS 圖示名稱；空字串不顯示',
      table: { defaultValue: { summary: "''" } },
    },
    tone: {
      control: 'select',
      options: ['neutral', 'danger'],
      description: 'danger＝紅字的危險動作',
      table: { defaultValue: { summary: 'neutral' } },
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    selected: {
      control: 'select',
      options: [null, true, false],
      description: 'null＝一般動作；true／false＝單選項的選中／未選中',
      table: { defaultValue: { summary: 'null' } },
    },
    opensPanel: {
      control: 'select',
      options: [null, 'dialog'],
      description: "點了會在旁邊打開面板時設 'dialog'：右邊加箭頭，在選單裡點了不關選單",
      table: { defaultValue: { summary: 'null' } },
    },
    panelOpen: {
      control: 'boolean',
      description: '旁邊的面板開著沒；設了 opensPanel 才有作用',
      table: { defaultValue: { summary: 'false' } },
    },
    details: {
      control: 'object',
      description: '補充說明，每一個字串是一條；滑過或用鍵盤移到這一項時，選單旁邊出現面板。只在選單裡、沒設 opensPanel 時有作用',
      table: { defaultValue: { summary: 'null' } },
    },
    itemClick: { action: 'itemClick' },
  },
};

export default meta;
type Story = StoryObj<MenuItemComponent>;

// ── 一般：執行一個動作，第一項可用右側控制項調整 ─────────────
export const Default: Story = {
  name: '一般',
  args: {
    label: '編輯項目',
    description: '',
    icon: '',
    tone: 'neutral',
    disabled: false,
    selected: null,
    opensPanel: null,
    panelOpen: false,
  },
  render: (args) => ({
    props: args,
    template: inMenu(`
      <app-action-menu ariaLabel="更多操作">
        <app-menu-item [label]="label" [description]="description" [icon]="icon" [tone]="tone"
          [disabled]="disabled" [selected]="selected" [opensPanel]="opensPanel" [panelOpen]="panelOpen"
          (itemClick)="itemClick()"></app-menu-item>
        <app-menu-item label="複製項目"></app-menu-item>
        <app-menu-item label="封存項目"></app-menu-item>
      </app-action-menu>
    `),
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent] },
  }),
};

// ── 圖示：顯示在文字左邊，顏色跟著文字 ───────────────────────
export const WithIcon: Story = {
  name: '圖示',
  render: () => ({
    template: inMenu(`
      <app-action-menu ariaLabel="更多操作">
        <app-menu-item label="編輯項目" icon="Edit"></app-menu-item>
        <app-menu-item label="複製項目" icon="Copy"></app-menu-item>
        <app-menu-item label="封存項目" icon="Archive"></app-menu-item>
      </app-action-menu>
    `),
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent] },
  }),
};

// ── 說明文字：第一行粗的標題，第二行灰色說明；滑過兩行都變淺色 ──────
export const WithDescription: Story = {
  name: '說明文字',
  render: () => ({
    template: inMenu(`
      <app-action-menu ariaLabel="更多操作" style="width:260px">
        <app-menu-item label="複製項目" icon="Copy" description="建立一份內容相同的新項目"></app-menu-item>
        <app-menu-item label="封存項目" icon="Archive" description="封存後只在「已封存」清單看得到"></app-menu-item>
      </app-action-menu>
    `),
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent] },
  }),
};

// ── 危險：紅字；跟其他動作用分隔線隔開 ───────────────────────
export const Danger: Story = {
  name: '危險',
  render: () => ({
    template: inMenu(`
      <app-action-menu ariaLabel="更多操作">
        <app-menu-item label="編輯項目" icon="Edit"></app-menu-item>
        <app-divider role="separator"></app-divider>
        <app-menu-item label="刪除項目" icon="Trash-Del" tone="danger"></app-menu-item>
      </app-action-menu>
    `),
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent, DividerComponent] },
  }),
};

// ── 停用：整項灰 50、標題不加粗，原因寫在說明；滑過不變色，方向鍵仍停得到，點了沒反應 ─────────
export const Disabled: Story = {
  name: '停用',
  render: () => ({
    template: inMenu(`
      <app-action-menu ariaLabel="更多操作">
        <app-menu-item label="編輯項目" icon="Edit"></app-menu-item>
        <app-menu-item label="封存項目" icon="Archive" [disabled]="true" description="先完成上一步才能使用"></app-menu-item>
        <app-menu-item label="複製項目" icon="Copy"></app-menu-item>
      </app-action-menu>
    `, 200),
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent] },
  }),
};

// ── 在旁邊打開面板：右邊有箭頭，點了不關選單；面板開著時跟滑過一樣亮著 ─────────
//    面板由使用端自己做（另一個 app-action-menu，見說明的用法範例），這裡只示範箭頭和開著的樣子
export const OpensPanel: Story = {
  name: '在旁邊打開面板',
  render: () => ({
    template: inMenu(`
      <app-action-menu ariaLabel="更多操作">
        <app-menu-item label="編輯項目" icon="Edit"></app-menu-item>
        <app-menu-item label="匯出" icon="Download" opensPanel="dialog" [panelOpen]="open" (itemClick)="open = !open"></app-menu-item>
        <app-divider role="separator"></app-divider>
        <app-menu-item label="刪除項目" icon="Trash-Del" tone="danger"></app-menu-item>
      </app-action-menu>
    `),
    props: { open: true },
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent, DividerComponent] },
  }),
};

// ── 補充說明：滑過或用鍵盤移到選項時，選單右邊出現面板，標題是 label、條列是 details ─────────
//    按「匯出」打開選單。滑鼠移出選單時面板留著，選單關掉才消失。用滑鼠點開時不會自己出現，用鍵盤打開時第一項的說明會先出現
const EXPORT_FORMATS = [
  { label: '匯出成 CSV', details: ['只有文字與數字，沒有格式', '用任何試算表或文字編輯器都打得開', '適合再匯入其他系統'] },
  { label: '匯出成試算表', details: ['保留欄寬、顏色與公式', '適合直接列印或分享給別人'] },
  { label: '匯出成 PDF', details: ['版面固定，不能再編輯', '適合寄出或存檔'] },
];

export const Details: Story = {
  name: '補充說明',
  render: () => ({
    template: `
      <div style="padding-bottom:160px;">
        <!-- 選單對齊包住它的外層，所以按鈕和選單包在同一個 span 裡，選單才會出現在按鈕正下方 -->
        <span style="display:inline-block;">
          <app-button variant="ghost" color="neutral" size="S" text="匯出"
            ariaHaspopup="menu" [ariaExpanded]="open" (btnClick)="open = !open"></app-button>
          @if (open) {
            <app-action-menu ariaLabel="匯出" (closeMenu)="open = false">
              @for (f of formats; track f.label) {
                <app-menu-item [label]="f.label" [details]="f.details" (itemClick)="open = false"></app-menu-item>
              }
            </app-action-menu>
          }
        </span>
      </div>
    `,
    props: { formats: EXPORT_FORMATS, open: false },
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent, ButtonComponent] },
  }),
};

// ── 單選：選中的那項深藍實心底；「還原預設」放在分隔線下的最後一列 ──────
export const SingleSelect: Story = {
  name: '單選',
  render: () => ({
    template: inMenu(`
      <app-action-menu ariaLabel="排序">
        @for (o of options; track o.value) {
          <app-menu-item [label]="o.label" [selected]="sort === o.value" (itemClick)="sort = o.value"></app-menu-item>
        }
        <app-divider role="separator"></app-divider>
        <app-menu-item label="還原預設" (itemClick)="sort = 'newest'"></app-menu-item>
      </app-action-menu>
    `, 280),
    props: { options: SORT_OPTIONS, sort: 'name-asc' },
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent, DividerComponent] },
  }),
};

// ── 自訂內容：文字後面放標籤；底色變深時 LightWhite 的「已封存」自動變白 ─────
export const CustomContent: Story = {
  name: '自訂內容',
  render: () => ({
    template: inMenu(`
      <app-action-menu ariaLabel="切換項目">
        @for (p of projects; track p.name) {
          <app-menu-item [label]="p.name" [selected]="current === p.name" (itemClick)="current = p.name">
            <app-label [color]="p.typeColor" size="XXS" [text]="p.type"></app-label>
            @if (p.archived) {
              <app-label color="LightWhite" size="XXS" text="已封存"></app-label>
            }
          </app-menu-item>
        }
      </app-action-menu>
    `, 200),
    props: {
      current: '項目 B',
      projects: [
        { name: '項目 A', type: '文件', typeColor: 'Grey70', archived: false },
        { name: '項目 B', type: '表單', typeColor: 'Golden', archived: false },
        { name: '項目 C', type: '圖片', typeColor: 'Salmon', archived: true },
        { name: '項目 D', type: '文件', typeColor: 'Grey70', archived: true },
      ],
    },
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent, LabelComponent] },
  }),
};

// ── 選單外：一組單選（例如手機篩選視窗的排序區），寬度跟著文字、排不下換行 ──
export const OutsideMenu: Story = {
  name: '選單外',
  render: () => ({
    template: `
      <div role="group" aria-label="排序" style="max-width:311px;">
        @for (o of options; track o.value) {
          <app-menu-item [label]="o.label" [selected]="sort === o.value" (itemClick)="sort = o.value"></app-menu-item>
        }
      </div>
    `,
    props: { options: SORT_OPTIONS, sort: 'newest' },
    moduleMetadata: { imports: [MenuItemComponent] },
  }),
};
