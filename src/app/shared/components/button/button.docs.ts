import type { ComponentDoc } from '../../../../docs/component-doc';

export const buttonDoc: ComponentDoc = {
  id: 'button',
  name: 'Button',
  selector: 'app-button',
  group: '互動元件',
  summary: 'variant: filled|tonal|outlined|ghost|elevated · color: primary|success|danger|neutral · size: XXS|XS|S|M|L · leftIcon/rightIcon · [disabled] [fullWidth] [loading] · [clickableWhenDisabled] [disabledMessage] · (btnClick) (disabledClick)',
  when: '任何可點擊操作。禁止原生 <button>。loading=true 時 spinner 取代 icon、底色不變、點擊無效。**用投影內容（不給 text，例如選單選項放「標籤＋名稱」）時，裡面的文字顏色寫 color: inherit**，否則 ghost／elevated 的滑過、按下文字色套不到（2026-10-02：寫死深色字 → ghost 滑過變深灰底配黑字）。',
  props: [
    {
      name: 'variant',
      type: 'ButtonVariant',
      default: "'filled'",
      desc: 'filled | tonal | outlined | ghost | elevated',
    },
    {
      name: 'color',
      type: 'ButtonColor',
      default: "'primary'",
      desc: 'primary | success | danger | neutral（elevated 不需指定）',
    },
    {
      name: 'size',
      type: 'ButtonSize',
      default: "'M'",
      desc: 'XXS(17px) | XS(24px) | S(32px) | M(36px) | L(40px)',
    },
    {
      name: 'text',
      type: 'string',
      default: "''",
      desc: '按鈕文字',
    },
    {
      name: 'leftIcon',
      type: 'string',
      desc: '左側 icon 名稱（icon registry）',
    },
    {
      name: 'rightIcon',
      type: 'string',
      desc: '右側 icon 名稱',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '禁用狀態',
    },
    {
      name: 'fullWidth',
      type: 'boolean',
      default: 'false',
      desc: '撐滿父容器寬度',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      desc: '載入中狀態；底色不變，spinner 取代 icon，點擊無效',
    },
    {
      name: 'loadingText',
      type: 'string',
      default: "''",
      desc: 'loading=true 時顯示的替換文字（選填）',
    },
    {
      name: 'description',
      type: 'string',
      default: "''",
      desc: '雙行模式：名稱下方的說明文字。有值時 height:auto、文字靠左，適合 action-menu 列表項目',
    },
    {
      name: 'shortcut',
      type: 'string',
      default: "''",
      desc: '鍵盤快速鍵提示（e.g. "⌘N"），顯示在按鈕右側。主要用於 action-menu 選項，參考 Fluent UI secondaryContent 模式。只顯示提示，不綁定快速鍵行為。',
    },
    {
      name: 'clickableWhenDisabled',
      type: 'boolean',
      default: 'false',
      desc: 'true 時改用 aria-disabled 取代原生 disabled，讓點擊事件仍可穿透。適用於「需顯示 disabled 原因」的主動作按鈕。',
    },
    {
      name: 'disabledMessage',
      type: 'string | string[]',
      default: '[]',
      desc: 'clickableWhenDisabled=true 且 disabled=true 時，點擊按鈕上方顯示的 tooltip 訊息。單條傳 string，多條傳 string[]（以 bullet list 呈現）。',
    },
    {
      name: '(btnClick)',
      type: 'EventEmitter',
      desc: '正常點擊事件輸出',
      isOutput: true,
    },
    {
      name: '(disabledClick)',
      type: 'EventEmitter',
      desc: 'clickableWhenDisabled=true 且 disabled=true 時，點擊觸發。父層監聽後可執行 scroll 到第一個欄位錯誤等操作。',
      isOutput: true,
    },
    {
      name: 'leftLabel',
      type: 'BtnLabelConfig | null',
      default: 'null',
      desc: 'leftIcon 之後、文字之前的 app-label；null 為不顯示。格式 { text, color, size? }',
    },
    {
      name: 'centerLabel',
      type: 'BtnLabelConfig | null',
      default: 'null',
      desc: 'leftLabel 之後、文字之前的第二個 app-label；null 為不顯示',
    },
    {
      name: 'rightLabel',
      type: 'BtnLabelConfig | null',
      default: 'null',
      desc: '文字之後、rightIcon 之前的 app-label；null 為不顯示',
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-button
  variant="filled"
  color="primary"
  size="M"
  text="確認"
  leftIcon="Done-OK"
  [disabled]="false"
  [fullWidth]="false"
  (btnClick)="onConfirm()"
></app-button>`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: 'Icon 一律使用 color:currentColor，不可寫死顏色。尺寸對應：XXS/XS → size="12"，S/M → size="16"，L → size="24"。',
    },
    {
      type: 'warn',
      content: '驗證重點：hover 時所有 icon 顏色應與文字同步變白，不得保留灰色。若 icon 有 style="color:#686868" 寫死，hover 不會變色 — 請改為 style="color:currentColor" 或 color:inherit。',
    },
    {
      type: 'info',
      content: 'ViewEncapsulation.None — 外部可透過 CSS 覆寫樣式。',
    },
  ],
  customTables: [
    {
      title: 'Icon size 對應表',
      columns: [
        '按鈕尺寸',
        'Icon size',
        'Icon px',
        '說明',
      ],
      rows: [
        [
          'XXS (17px)',
          'size="12"',
          '12×12',
          '極小按鈕，僅容圖示',
        ],
        [
          'XS (24px)',
          'size="12"',
          '12×12',
          '小型操作按鈕',
        ],
        [
          'S (32px)',
          'size="12"',
          '12×12',
          '標準輔助按鈕',
        ],
        [
          'M (36px)',
          'size="16"',
          '16×16',
          '主要操作按鈕（預設）',
        ],
        [
          'L (40px)',
          'size="24"',
          '24×24',
          '大型主要按鈕',
        ],
      ],
    },
    {
      title: '語意選用指引（Semantic Usage Guide）',
      columns: [
        '操作語意',
        'variant / color',
        '視覺特徵',
        '實際範例',
      ],
      rows: [
        [
          '取消 / 關閉 / 還原 / 清除',
          'elevated',
          '白底毛玻璃，低視覺重量，暗示「可退出」',
          '取消、清除篩選、重設、上一步',
        ],
        [
          '逆流程 / 危險操作（表單確認按鈕）',
          'filled / danger',
          '紅底實心，高警示感',
          '刪除確認、封存確認（Dialog 內）',
        ],
        [
          '逆流程 / 危險操作（選單列表項目）',
          'ghost / danger',
          '紅色文字，無背景，適合選單密集排列',
          'Action Menu 內的刪除案件、封存案件',
        ],
        [
          '完成階段任務（里程碑）',
          'filled / success',
          '綠底實心，傳達「達成」與「正向推進」',
          '立案、成交、完成並開始填寫',
        ],
        [
          '一般往下推進 / 搜尋 / 主要動作',
          'filled / primary',
          '藍底實心，主要動作視覺重量最高',
          '下一步、套用、登入、查詢',
        ],
        [
          '情境捷徑（卡片內輔助操作）',
          'tonal / neutral',
          '灰底軟質感，hover 變灰實心，低調工具感，不與 CTA 競爭',
          '同登記地址、從商工同步、套用標準報價、帶入',
        ],
        [
          'inline 新增（＋新增項目）',
          'ghost / primary',
          '藍色文字，無背景，適合內容中插入的輕量操作',
          '＋ 新增其他項目、全部已讀',
        ],
        [
          '並排時的次要選項',
          'outlined / primary',
          '藍色邊框，重量低於 filled，適合與 filled/primary 並排',
          '查看全部通知、Microsoft 365 登入（與「登入」並列）',
        ],
        [
          '中性導覽（非業務動作）',
          'outlined / neutral',
          '灰色邊框，低調，不干擾主要流程',
          '登出平台、歷史搜尋詞',
        ],
      ],
    },
  ],
};
