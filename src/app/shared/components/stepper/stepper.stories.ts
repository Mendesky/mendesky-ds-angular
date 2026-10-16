import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent, NavPage, NavSection, StepperComponent } from '../../../../index';

// ── 範例資料 ───────────────────────────────────────────────
// 水平步驟：精靈式表單的步驟順序
const WIZARD_STEPS = ['選擇類型', '身分驗證', '基本資料', '偏好設定', '確認送出'];

// 導覽頁面：多頁 modal 的左側導覽
const BASIC_PAGE: NavPage = {
  id: 'basic', num: '1', label: '基本資料',
  subItems: [
    { id: 'basic-files', label: '參考文件' },
    { id: 'basic-profile', label: '個人資料' },
    { id: 'basic-contact', label: '聯絡方式' },
    { id: 'basic-history', label: '過往紀錄' },
  ],
};
const ITEMS_PAGE: NavPage = { id: 'items', num: '2', label: '項目清單' };
const TERMS_SUB_ITEMS = [
  { id: 'terms-1', label: '發送資訊' },
  { id: 'terms-2', label: '目的' },
  { id: 'terms-3', label: '範圍及內容' },
  { id: 'terms-4', label: '需配合事項' },
  { id: 'terms-5', label: '費用' },
  { id: 'terms-6', label: '備註' },
  { id: 'terms-7', label: '其他約定事項' },
];

// 單一成員：第一段標題是成員名稱（此處用佔位文字），第二段不顯示標題
const SINGLE_MEMBER_SECTIONS: NavSection[] = [
  { label: '成員名稱', pages: [BASIC_PAGE, ITEMS_PAGE] },
  {
    label: undefined,
    pages: [
      { id: 'settings', num: '3', label: '基本設定' },
      { id: 'notice', num: '4', label: '通知及同意書' },
      { id: 'terms', num: '5', label: '條款內容', subItems: TERMS_SUB_ITEMS },
      { id: 'preview', num: '6', label: '文件預覽' },
    ],
  },
];

// 多位成員：每位成員各自的頁面在第一段，共用資料在「共用資料」段
const MULTI_MEMBER_SECTIONS: NavSection[] = [
  { label: '成員名稱', pages: [BASIC_PAGE, ITEMS_PAGE, { id: 'notice', num: '3', label: '通知及同意書' }] },
  {
    label: '共用資料',
    pages: [
      { id: 'settings', num: '4', label: '基本設定' },
      { id: 'terms', num: '5', label: '條款內容', subItems: TERMS_SUB_ITEMS },
      { id: 'preview', num: '6', label: '文件預覽' },
    ],
  },
];

// 送出流程：只有一段、不顯示標題
const SUBMIT_SECTIONS: NavSection[] = [
  {
    pages: [
      { id: 'consent', num: '1', label: '同意書' },
      { id: 'fee', num: '2', label: '費用' },
      { id: 'submit-date', num: '3', label: '送出日期' },
      { id: 'confirm', num: '4', label: '送出前確認' },
    ],
  },
];

const NAV_WRAP_STYLE = 'width:240px;';

// 導覽點擊：有子項的頁面跳到第一個子項並展開，沒有子項的直接切換
const NAV_HANDLERS = `
  (navPageClick)="activePage = $event.subItems?.length ? $event.subItems[0].id : $event.id; expandedPageIds = $event.subItems?.length ? [$event.id] : []"
  (navSubItemClick)="activePage = $event.subId"
`;

const meta: Meta<StepperComponent> = {
  title: '互動元件/Stepper',
  id: 'stepper',
  component: StepperComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['horizontal', 'nav'],
      description: '切換呈現模式：horizontal＝Wizard 進度指示；nav＝Modal 左側多層導覽',
      table: { defaultValue: { summary: 'horizontal' } },
    },
    steps: {
      control: 'object',
      description: '（horizontal）步驟標籤清單',
      table: { defaultValue: { summary: '[]' } },
    },
    currentStep: {
      control: { type: 'number', min: 0 },
      description: '（horizontal）當前步驟 index（0-based）',
      table: { defaultValue: { summary: '0' } },
    },
    navSections: {
      control: 'object',
      description: '（nav）導覽區段陣列；每段有 label?（區段標題）與 pages',
      table: { defaultValue: { summary: '[]' } },
    },
    activePage: {
      control: 'text',
      description: '（nav）目前 active 的 page id 或 sub-item id',
      table: { defaultValue: { summary: "''" } },
    },
    expandedPageIds: {
      control: 'object',
      description: '（nav）已展開子項目的頂層 page ids',
      table: { defaultValue: { summary: '[]' } },
    },
    lockedPageIds: {
      control: 'object',
      description: '（nav）尚未解鎖（不可點擊）的頂層 page ids',
      table: { defaultValue: { summary: '[]' } },
    },
    sectionStatuses: {
      control: 'object',
      description: "（nav）狀態 map：key＝page／sub-item id，值＝'empty' | 'in-progress' | 'complete'",
      table: { defaultValue: { summary: '{}' } },
    },
    validationTriggeredIds: {
      control: 'object',
      description: '（nav）已觸發驗證的 ids；未完成者顯示紅色警告',
      table: { defaultValue: { summary: '[]' } },
    },
    hideNum: {
      control: 'boolean',
      description: '（nav）隱藏 pill 內的數字（完成態的綠勾仍保留）',
      table: { defaultValue: { summary: 'false' } },
    },
    stepClick: { action: 'stepClick' },
    navPageClick: { action: 'navPageClick' },
    navSubItemClick: { action: 'navSubItemClick' },
  },
};

export default meta;
type Story = StoryObj<StepperComponent>;

// ── 主範例：水平步驟。把 variant 切成 nav 可看導覽面板 ─────────
export const Default: Story = {
  name: '預設',
  args: {
    variant: 'horizontal',
    steps: WIZARD_STEPS,
    currentStep: 2,
    navSections: SINGLE_MEMBER_SECTIONS,
    activePage: 'basic-profile',
    expandedPageIds: ['basic'],
    lockedPageIds: [],
    sectionStatuses: { 'basic-files': 'complete' },
    validationTriggeredIds: [],
    hideNum: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div [style.width]="variant === 'nav' ? '240px' : 'auto'">
        <app-stepper
          [variant]="variant"
          [steps]="steps"
          [currentStep]="currentStep"
          [navSections]="navSections"
          [activePage]="activePage"
          [expandedPageIds]="expandedPageIds"
          [lockedPageIds]="lockedPageIds"
          [sectionStatuses]="sectionStatuses"
          [validationTriggeredIds]="validationTriggeredIds"
          [hideNum]="hideNum"
          (stepClick)="currentStep = $event; stepClick($event)"
          (navPageClick)="activePage = $event.subItems?.length ? $event.subItems[0].id : $event.id; expandedPageIds = $event.subItems?.length ? [$event.id] : []; navPageClick($event)"
          (navSubItemClick)="activePage = $event.subId; navSubItemClick($event)">
        </app-stepper>
      </div>
    `,
    moduleMetadata: { imports: [StepperComponent] },
  }),
};

// ── 水平：只能點回已完成的步驟 ─────────────────────────────────
export const HorizontalInteractive: Story = {
  name: '水平：可點回已完成步驟',
  render: () => ({
    props: { steps: WIZARD_STEPS, currentStep: 0 },
    template: `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <app-stepper [steps]="steps" [currentStep]="currentStep" (stepClick)="currentStep = $event"></app-stepper>
        <div style="display:flex;gap:8px;">
          <app-button variant="outlined" color="neutral" size="S" text="上一步"
            [disabled]="currentStep === 0" (btnClick)="currentStep = currentStep - 1"></app-button>
          <app-button variant="filled" color="primary" size="S" text="下一步"
            [disabled]="currentStep === steps.length - 1" (btnClick)="currentStep = currentStep + 1"></app-button>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [StepperComponent, ButtonComponent] },
  }),
};

// ── 導覽：完成、鎖定、驗證警告 ─────────────────────────────────
export const NavWithStatuses: Story = {
  name: '導覽：完成、鎖定與警告',
  render: () => ({
    props: {
      navSections: SINGLE_MEMBER_SECTIONS,
      activePage: 'basic-profile',
      expandedPageIds: ['basic'],
      lockedPageIds: ['terms', 'preview'],
      sectionStatuses: { 'basic-files': 'complete', items: 'complete' },
      validationTriggeredIds: ['basic-contact', 'basic-history'],
    },
    template: `
      <div style="${NAV_WRAP_STYLE}">
        <app-stepper
          variant="nav"
          [navSections]="navSections"
          [activePage]="activePage"
          [expandedPageIds]="expandedPageIds"
          [lockedPageIds]="lockedPageIds"
          [sectionStatuses]="sectionStatuses"
          [validationTriggeredIds]="validationTriggeredIds"
          ${NAV_HANDLERS}>
        </app-stepper>
      </div>
    `,
    moduleMetadata: { imports: [StepperComponent] },
  }),
};

// ── 導覽：多位成員時的兩段標題 ─────────────────────────────────
export const NavGroupSections: Story = {
  name: '導覽：兩段區段標題',
  render: () => ({
    props: {
      navSections: MULTI_MEMBER_SECTIONS,
      activePage: 'terms-1',
      expandedPageIds: ['terms'],
    },
    template: `
      <div style="${NAV_WRAP_STYLE}">
        <app-stepper
          variant="nav"
          [navSections]="navSections"
          [activePage]="activePage"
          [expandedPageIds]="expandedPageIds"
          ${NAV_HANDLERS}>
        </app-stepper>
      </div>
    `,
    moduleMetadata: { imports: [StepperComponent] },
  }),
};

// ── 導覽：隱藏數字（送出流程） ─────────────────────────────────
export const NavHideNum: Story = {
  name: '導覽：隱藏數字',
  render: () => ({
    props: {
      navSections: SUBMIT_SECTIONS,
      activePage: 'fee',
      sectionStatuses: { consent: 'complete' },
      validationTriggeredIds: ['submit-date'],
    },
    template: `
      <div style="${NAV_WRAP_STYLE}">
        <app-stepper
          variant="nav"
          [hideNum]="true"
          [navSections]="navSections"
          [activePage]="activePage"
          [sectionStatuses]="sectionStatuses"
          [validationTriggeredIds]="validationTriggeredIds"
          (navPageClick)="activePage = $event.id">
        </app-stepper>
      </div>
    `,
    moduleMetadata: { imports: [StepperComponent] },
  }),
};
