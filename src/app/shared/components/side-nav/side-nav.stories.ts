import type { Meta, StoryObj } from '@storybook/angular';
import { SideNavComponent, SideNavGroup, DrawerShellComponent, ButtonComponent, IconComponent } from '../../../../index';

// 範例資料用中性詞。外框背景照使用端常見的淺灰頁面背景，側欄放在左邊、右邊是內容區。

const FEW: SideNavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: '首頁', icon: 'Dashboard', href: '#home' },
      { id: 'list', label: '清單', icon: 'Briefcase', href: '#list' },
      { id: 'assign', label: '分派', icon: 'Assign', href: '#assign' },
      { id: 'people', label: '聯絡人', icon: 'CustomerManagement', href: '#people' },
    ],
  },
];

const GROUPED: SideNavGroup[] = [
  {
    id: 'overview',
    heading: '總覽',
    items: [
      { id: 'home', label: '首頁', icon: 'Dashboard', href: '#home' },
      { id: 'people', label: '聯絡人', icon: 'CustomerManagement', href: '#people' },
    ],
  },
  {
    id: 'work',
    heading: '工作',
    items: [
      { id: 'list', label: '清單', icon: 'Briefcase', href: '#list' },
      { id: 'reports', label: '每月報表與年度彙整匯出紀錄', icon: 'Assign', href: '#reports' },
    ],
  },
  {
    id: 'admin',
    heading: '管理',
    items: [
      { id: 'settings', label: '設定', icon: 'Setting', href: '#settings' },
      { id: 'log', label: '紀錄', icon: 'Briefcase', href: '#log' },
    ],
  },
];

// 有子頁面：母項目的網址給第一個子頁面
const NESTED: SideNavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: '首頁', icon: 'Dashboard', href: '#home' },
      {
        id: 'team', label: '團隊', icon: 'CustomerManagement', href: '#members',
        children: [
          { id: 'members', label: '成員', icon: 'Person', href: '#members' },
          { id: 'roles', label: '角色', icon: 'IdCard', href: '#roles' },
        ],
      },
      {
        id: 'notify', label: '通知', icon: 'BellRing', href: '#activity',
        children: [
          { id: 'activity', label: '發送紀錄', icon: 'Pulse', href: '#activity' },
          { id: 'rules', label: '寄件規則', icon: 'Mails', href: '#rules' },
          { id: 'copy', label: '文案', icon: 'MessageText', href: '#copy' },
        ],
      },
      { id: 'settings', label: '設定', icon: 'Setting', href: '#settings' },
    ],
  },
];

// 窄的視窗放不下 200px 側欄加內容區時，外框自己橫向捲動，不撐寬整頁
const FRAME = 'display:flex;gap:8px;height:420px;max-width:100%;overflow:auto;padding:20px;background:#EEF1F5;border-radius:8px;box-sizing:border-box';
const CONTENT = 'flex:1;min-width:0;background:#ffffff;border-radius:12px;padding:16px;color:#686868';

const meta: Meta<SideNavComponent> = {
  title: '互動元件/Side Nav',
  id: 'side-nav',
  component: SideNavComponent,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'inline-radio',
      options: ['expanded', 'rail', 'hidden'],
      description: '寬度：展開 200px、窄欄 56px、藏起來 0',
      table: { defaultValue: { summary: 'expanded' } },
    },
    currentId: { control: 'text', description: '目前頁的項目 id' },
    ariaLabel: { control: 'text', description: '導覽地標的名稱', table: { defaultValue: { summary: '主要導覽' } } },
  },
  args: { groups: GROUPED, mode: 'expanded', currentId: 'list', ariaLabel: '主要導覽' },
  render: (args) => ({
    props: { ...args, current: args.currentId },
    template: `
      <div style="${FRAME}">
        <app-side-nav [groups]="groups" [mode]="mode" [currentId]="current" [ariaLabel]="ariaLabel"
                      (navigate)="current = $event.id"></app-side-nav>
        <div style="${CONTENT}">內容區。點左邊的項目換目前頁。</div>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<SideNavComponent>;

// ── 主範例：可用 Controls 調整寬度與目前頁 ───────────────────
export const Default: Story = {
  name: '預設（展開、三個群組）',
};

// ── 入口少：窄欄和藏起來，切換鈕在側欄外面 ─────────────────
export const Rail: Story = {
  name: '窄欄和藏起來（入口少的系統）',
  render: () => ({
    props: { groups: FEW, hidden: false, current: 'list' },
    template: `
      <div style="${FRAME};flex-direction:column;gap:12px">
        <app-button variant="outlined" color="neutral" leftIcon="Menu"
                    [text]="hidden ? '打開側欄' : '藏起側欄'"
                    [ariaExpanded]="!hidden"
                    (btnClick)="hidden = !hidden"></app-button>
        <div style="display:flex;gap:8px;flex:1;min-height:0">
          <app-side-nav [groups]="groups" [mode]="hidden ? 'hidden' : 'rail'" [currentId]="current"
                        (navigate)="current = $event.id"></app-side-nav>
          <div style="${CONTENT}">滑過或用鍵盤停在項目上，右邊會出現名稱。藏起來後按 Tab，焦點不會進到側欄。</div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [SideNavComponent, ButtonComponent] },
  }),
};

// ── 入口多：展開和窄欄，切換鈕在頂端區 ─────────────────────
export const Expanded: Story = {
  name: '展開和窄欄（入口多、有分群的系統）',
  render: () => ({
    props: { groups: GROUPED, collapsed: false, current: 'reports' },
    template: `
      <div style="${FRAME}">
        <app-side-nav [groups]="groups" [mode]="collapsed ? 'rail' : 'expanded'" [currentId]="current"
                      (navigate)="current = $event.id">
          <button sideNavHeader type="button" [attr.aria-expanded]="!collapsed" (click)="collapsed = !collapsed"
                  style="display:flex;align-items:center;gap:8px;height:44px;margin-bottom:8px;padding:0 12px;border:0;border-radius:10px;background:transparent;color:#686868;font:inherit;cursor:pointer">
            <app-icon [name]="collapsed ? 'RightArrow' : 'LeftArrow'" size="20" style="color:currentColor"></app-icon>
            @if (!collapsed) { <span>收合側欄</span> } @else { <span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">展開側欄</span> }
          </button>
        </app-side-nav>
        <div style="${CONTENT}">「每月報表與年度彙整匯出紀錄」放不下，用刪節號截斷。收成窄欄後，群組之間改成分隔線。</div>
      </div>
    `,
    moduleMetadata: { imports: [SideNavComponent, IconComponent] },
  }),
};

// ── 窄螢幕：同一份項目放進抽屜 ─────────────────────────────
export const InDrawer: Story = {
  name: '放進抽屜（窄螢幕）',
  render: () => ({
    props: { groups: GROUPED, open: false, current: 'home' },
    template: `
      <app-button variant="outlined" color="neutral" leftIcon="Menu" text="打開導覽" (btnClick)="open = true"></app-button>
      <app-drawer-shell [isOpen]="open" side="left" width="min(280px, 85vw)" (close)="open = false">
        <div style="padding:16px">
          <app-side-nav style="width:100%;height:auto" [groups]="groups" mode="expanded" [currentId]="current"
                        (navigate)="current = $event.id; open = false"></app-side-nav>
        </div>
      </app-drawer-shell>
    `,
    moduleMetadata: { imports: [SideNavComponent, ButtonComponent, DrawerShellComponent] },
  }),
};

// ── 子頁面：窄欄滑過浮出子選單，展開時列在母項目下方 ───────────
export const WithChildren: Story = {
  name: '子頁面（窄欄浮出子選單、展開時列在下方）',
  render: () => ({
    props: { groups: NESTED, rail: true, current: 'roles' },
    template: `
      <div style="${FRAME};flex-direction:column;gap:12px">
        <app-button variant="outlined" color="neutral" [leftIcon]="rail ? 'RightArrow' : 'LeftArrow'"
                    [text]="rail ? '換成展開' : '換成窄欄'" (btnClick)="rail = !rail"></app-button>
        <div style="display:flex;gap:8px;flex:1;min-height:0">
          <app-side-nav [groups]="groups" [mode]="rail ? 'rail' : 'expanded'" [currentId]="current"
                        (navigate)="current = $event.id"></app-side-nav>
          <div style="${CONTENT}">
            窄欄：滑過「團隊」或「通知」，右邊浮出子選單；用鍵盤停到母項目再按 Tab 進入子選單。目前頁「角色」在團隊底下，窄欄時團隊是選中的樣子。
            展開：子頁面列在母項目下方，一直看得到。
          </div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [SideNavComponent, ButtonComponent] },
  }),
};
