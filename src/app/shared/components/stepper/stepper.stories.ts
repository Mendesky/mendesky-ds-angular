import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent, NavPage, NavSection, StepperComponent } from '../../../../index';

// ── 範例資料 ───────────────────────────────────────────────
// 水平步驟：取自 dashboard-app new-case-wizard 的 STEP_LABELS（新客戶、已設立時的步驟順序）
const WIZARD_STEPS = ['客戶設立現況', '統編查詢', '帳務類型', '基本資料', '業績來源'];

// 導覽頁面：取自 dashboard-app case-edit-modal 的 buildNavPages（已設立案件）
const P1: NavPage = {
  id: 'p1', num: '1', label: '營運資料',
  subItems: [
    { id: 'p1-doc', label: '報價依據文件' },
    { id: 'p1-operation', label: '營運資料' },
    { id: 'p1-voucher', label: '憑證資料' },
    { id: 'p1-former', label: '前所服務資料' },
  ],
};
const P2: NavPage = { id: 'p2', num: '2', label: '報價項目' };
const P4_SUB_ITEMS = [
  { id: 'p4-1', label: '發文資料' },
  { id: 'p4-2', label: '目的' },
  { id: 'p4-3', label: '服務範圍及內容' },
  { id: 'p4-4', label: '貴公司之協助辦理事項' },
  { id: 'p4-5', label: '酬金' },
  { id: 'p4-6', label: '服務備註' },
  { id: 'p4-7', label: '其它約定事項' },
];

// 單一客戶：第一段標題是客戶名稱（此處用佔位文字），第二段不顯示標題
const SINGLE_CASE_SECTIONS: NavSection[] = [
  { label: '客戶名稱', pages: [P1, P2] },
  {
    label: undefined,
    pages: [
      { id: 'p3', num: '3', label: '報價基本資料' },
      { id: 'p5', num: '4', label: '信件及同意函' },
      { id: 'p4', num: '5', label: '公費合約', subItems: P4_SUB_ITEMS },
      { id: 'p6', num: '6', label: '報價單預覽' },
    ],
  },
];

// 集團案件：每位客戶各自的頁面在第一段，共用資料在「集團報價共用資料」段
const GROUP_CASE_SECTIONS: NavSection[] = [
  { label: '客戶名稱', pages: [P1, P2, { id: 'p5', num: '3', label: '信件及同意函' }] },
  {
    label: '集團報價共用資料',
    pages: [
      { id: 'p3', num: '4', label: '報價基本資料' },
      { id: 'p4', num: '5', label: '公費合約', subItems: P4_SUB_ITEMS },
      { id: 'p6', num: '6', label: '報價單預覽' },
    ],
  },
];

// 成交：取自 dashboard-app closed-deal-modal 的 navSections（非集團），只有一段、不顯示標題
const CLOSED_DEAL_SECTIONS: NavSection[] = [
  {
    pages: [
      { id: 'consent', num: '1', label: '客戶同意函' },
      { id: 'company-0', num: '2', label: '酬金' },
      { id: 'deal-date', num: '3', label: '成交日期' },
      { id: 'confirm', num: '4', label: '成交前確認' },
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
    navSections: SINGLE_CASE_SECTIONS,
    activePage: 'p1-operation',
    expandedPageIds: ['p1'],
    lockedPageIds: [],
    sectionStatuses: { 'p1-doc': 'complete' },
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
      navSections: SINGLE_CASE_SECTIONS,
      activePage: 'p1-operation',
      expandedPageIds: ['p1'],
      lockedPageIds: ['p4', 'p6'],
      sectionStatuses: { 'p1-doc': 'complete', p2: 'complete' },
      validationTriggeredIds: ['p1-voucher', 'p1-former'],
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

// ── 導覽：集團案件的兩段標題 ───────────────────────────────────
export const NavGroupSections: Story = {
  name: '導覽：集團區段標題',
  render: () => ({
    props: {
      navSections: GROUP_CASE_SECTIONS,
      activePage: 'p4-1',
      expandedPageIds: ['p4'],
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

// ── 導覽：隱藏數字（dashboard-app 成交視窗） ─────────────────────
export const NavHideNum: Story = {
  name: '導覽：隱藏數字',
  render: () => ({
    props: {
      navSections: CLOSED_DEAL_SECTIONS,
      activePage: 'company-0',
      sectionStatuses: { consent: 'complete' },
      validationTriggeredIds: ['deal-date'],
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
