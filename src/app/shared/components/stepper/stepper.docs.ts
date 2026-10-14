import type { ComponentDoc } from '../../../../docs/component-doc';

export const stepperDoc: ComponentDoc = {
  id: 'stepper',
  name: 'Stepper',
  selector: 'app-stepper',
  group: '互動元件',
  summary: "variant: 'horizontal'|'nav' · horizontal: steps: string[] currentStep: number (stepClick) · nav: navSections activePage expandedPageIds lockedPageIds sectionStatuses (navPageClick) (navSubItemClick)",
  when: 'horizontal：多步驟 Wizard 進度指示。nav：Modal 左側多層導覽面板。',
  props: [
    {
      name: 'variant',
      type: "'horizontal' | 'nav'",
      default: "'horizontal'",
      desc: '切換呈現模式',
    },
    {
      name: 'steps',
      type: 'string[]',
      default: '[]',
      desc: '步驟標籤清單（依序顯示）',
    },
    {
      name: 'currentStep',
      type: 'number',
      default: '0',
      desc: '當前步驟 index（0-based）',
    },
    {
      name: '(stepClick)',
      type: 'EventEmitter<number>',
      desc: '點擊已完成步驟（done）時 emit index',
      isOutput: true,
    },
    {
      name: 'navSections',
      type: 'NavSection[]',
      default: '[]',
      desc: '導覽區段陣列；每個區段有 label?（區段標題）與 pages（NavPage[]）',
    },
    {
      name: 'activePage',
      type: 'string',
      default: "''",
      desc: '目前 active 的 page id 或 sub-item id',
    },
    {
      name: 'expandedPageIds',
      type: 'string[]',
      default: '[]',
      desc: '已展開顯示子項目的頂層 page ids',
    },
    {
      name: 'lockedPageIds',
      type: 'string[]',
      default: '[]',
      desc: '尚未解鎖（不可點擊）的頂層 page ids',
    },
    {
      name: 'sectionStatuses',
      type: 'Record<string, string>',
      default: '{}',
      desc: "子項目狀態 map（key = subItemId，值 = 'empty' | 'in-progress' | 'complete'）",
    },
    {
      name: 'validationTriggeredIds',
      type: 'string[]',
      default: '[]',
      desc: '已觸發驗證的 section / page ids；列在此的項目顯示紅色警告狀態。搭配 modal.nonlinear-completion pattern 使用',
    },
    {
      name: 'hideNum',
      type: 'boolean',
      default: 'false',
      desc: '隱藏 nav pill 內的數字文字（完成態的綠勾仍保留）',
    },
    {
      name: '(navPageClick)',
      type: 'EventEmitter<NavPage>',
      desc: '點擊頂層 pill 時 emit（已排除 locked 頁面）',
      isOutput: true,
    },
    {
      name: '(navSubItemClick)',
      type: 'EventEmitter<{subId, parentId}>',
      desc: '點擊子項目時 emit',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: 'horizontal — Wizard 步驟指示器',
      code: `<app-stepper
  [steps]="['統編查詢', '帳務類型', '基本資料', '客戶來源']"
  [currentStep]="stepIndex"
  (stepClick)="goToStep($event)"
></app-stepper>`,
    },
    {
      label: 'nav — 多層導覽面板',
      code: `<app-stepper
  variant="nav"
  [navSections]="navSections()"
  [activePage]="activePage()"
  [expandedPageIds]="expandedPageIdsArray()"
  [lockedPageIds]="lockedPageIdsArray()"
  [sectionStatuses]="navSectionStatuses()"
  (navPageClick)="onPageClick($event)"
  (navSubItemClick)="navigateTo($event.subId, $event.parentId)"
></app-stepper>

// 消費端 computed 範例
navSections = computed((): NavSection[] => [
  { label: companyName, pages: clientPages() },
  ...(isGroup ? [{ label: '集團報價共用資料', pages: sharedPages() }] : []),
]);
expandedPageIdsArray = computed(() => Array.from(expandedPages()));
lockedPageIdsArray   = computed(() => PAGE_ORDER.filter(id => isPageLocked(id)));
navSectionStatuses   = computed(() => formState.sectionStatuses());`,
    },
    {
      label: '介面定義',
      code: `// 從 stepper 元件 import
import { NavPage, NavSection, NavSubItem } from '...stepper/stepper.component';

interface NavSubItem { id: string; label: string; }
interface NavPage    { id: string; num: string; label: string; subItems?: NavSubItem[]; }
interface NavSection { label?: string; pages: NavPage[]; }`,
    },
  ],
  notes: [],
  customTables: [],
};
