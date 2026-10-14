// 色彩與其他設計 token 的說明（正本）。
// token 本身定義在 src/styles/core.scss；`npm run check:docs` 會比對兩邊是否一致。
import type { TokenGroup } from '../foundation-doc';

export const DS_TOKENS: TokenGroup[] = [
  {
    group: '文字顏色',
    desc: 'Text',
    tokens: [
      {
        name: '--text\\/body',
        value: '#686868',
        desc: '一般內文',
      },
      {
        name: '--text\\/body-light',
        value: '#939393',
        desc: '淺色內文',
      },
      {
        name: '--text\\/body-lightest',
        value: '#ffffff',
        desc: '最淺/白色文字',
      },
      {
        name: '--text\\/secondary',
        value: '#535353',
        desc: '次要文字',
      },
      {
        name: '--text\\/disabled',
        value: '#939393',
        desc: '停用狀態文字',
      },
      {
        name: '--text\\/title',
        value: '#1c1c2e',
        desc: '標題文字',
      },
      {
        name: '--text\\/headings',
        value: '#535353',
        desc: '欄位標題',
      },
    ],
  },
  {
    group: '邊框',
    desc: 'Border',
    tokens: [
      {
        name: '--border\\/primary',
        value: '#e7e7e7',
        desc: '主要邊框',
      },
      {
        name: '--border\\/primary-dark',
        value: '#d3d3d3',
        desc: '深色邊框',
      },
      {
        name: '--border\\/primary-darker',
        value: '#bebebe',
        desc: '更深邊框',
      },
      {
        name: '--border\\/secondary',
        value: '#74ae3e',
        desc: '綠色強調邊框',
      },
      {
        name: '--border\\/teal',
        value: '#098da7',
        desc: '藍綠邊框',
      },
      {
        name: '--border\\/white',
        value: '#ffffff',
        desc: '純白邊框（毛玻璃浮層，如 action-menu）',
      },
    ],
  },
  {
    group: '灰階背景',
    desc: 'Grey / White',
    tokens: [
      {
        name: '--color\\/grey\\/20',
        value: '#e7e7e7',
        desc: '淺灰背景',
      },
      {
        name: '--color\\/grey\\/80',
        value: '#686868',
        desc: '灰色',
      },
      {
        name: '--color\\/grey\\/90',
        value: '#535353',
        desc: '深灰',
      },
      {
        name: '--color\\/white\\/10',
        value: '#f0f6fc',
        desc: '淡藍白背景（White 系列按亮度排序，10 為最淺；2026-08-13 由 --color/white/20 改名）',
      },
      {
        name: '--color\\/white\\/20',
        value: '#f1f3f5',
        desc: '極淺灰背景（2026-08-13 由 --color/grey/10 改名：grey/10 歸色票組的 Grey ramp 最淺階 #fcfcfc）',
      },
    ],
  },
  {
    group: '按鈕色',
    desc: 'Button',
    tokens: [
      {
        name: '--button\\/normal',
        value: '#f1f3f5',
        desc: '一般按鈕',
      },
      {
        name: '--button\\/white',
        value: '#ffffff',
        desc: '白色按鈕',
      },
      {
        name: '--button\\/action',
        value: '#3a9ccd',
        desc: '主色藍（Calm Blue 60）',
      },
      {
        name: '--button\\/action-light',
        value: '#4fbaef',
        desc: '主色藍亮色（Calm Blue 50）',
      },
      {
        name: '--button\\/neutral',
        value: '#939393',
        desc: '中性色',
      },
      {
        name: '--button\\/neutral-lightest',
        value: '#e7e7e7',
        desc: '中性最淺',
      },
      {
        name: '--button\\/neutral-lighter',
        value: '#bebebe',
        desc: '中性較淺',
      },
      {
        name: '--button\\/neutral-dark',
        value: '#7d7d7d',
        desc: '中性深',
      },
      {
        name: '--button\\/neutral-darker-hover',
        value: '#686868',
        desc: '中性 hover',
      },
      {
        name: '--button\\/neutral-darkest-actived',
        value: '#535353',
        desc: '中性 active',
      },
      {
        name: '--button\\/black',
        value: '#333333',
        desc: '黑色按鈕',
      },
      {
        name: '--button\\/success',
        value: '#74ae3e',
        desc: '成功綠',
      },
      {
        name: '--button\\/success-light',
        value: '#8fd053',
        desc: '成功綠亮色',
      },
      {
        name: '--button\\/success-dark-hover',
        value: '#5a8c2c',
        desc: '成功綠深 hover',
      },
      {
        name: '--button\\/success-darker-actived',
        value: '#426a1c',
        desc: '成功綠深 active',
      },
      {
        name: '--button\\/warning',
        value: '#ff7373',
        desc: '警告色',
      },
      {
        name: '--button\\/error',
        value: '#cc5252',
        desc: '錯誤色',
      },
    ],
  },
  {
    group: 'Label 色',
    desc: 'Label',
    tokens: [
      {
        name: '--label\\/secondary',
        value: '#ffffff',
        desc: '白色標籤',
      },
      {
        name: '--label\\/secondary-dark',
        value: '#f2f2f2',
        desc: '淺灰標籤',
      },
      {
        name: '--label\\/secondary-darkest',
        value: '#7d7d7d',
        desc: 'Grey 70',
      },
      {
        name: '--label\\/primary',
        value: '#4ba5b2',
        desc: 'Soft Blue（主要標籤）',
      },
      {
        name: '--label\\/accent-golden',
        value: '#af8e4d',
        desc: 'Golden（金色強調）',
      },
      {
        name: '--label\\/accent-salmon',
        value: '#b36a56',
        desc: 'Salmon（鮭魚色）',
      },
      {
        name: '--label\\/accent-green',
        value: '#5da26b',
        desc: 'Sea Green（海綠）',
      },
      {
        name: '--label\\/accent-green-light',
        value: '#8fd053',
        desc: 'Green 60（亮綠）',
      },
      {
        name: '--label\\/accent-blue',
        value: '#14b6d4',
        desc: 'Blue 70（水藍）',
      },
      {
        name: '--label\\/warning',
        value: '#cc5252',
        desc: '警告/危險',
      },
      {
        name: '--label\\/accent-purple',
        value: '#8b5c91',
        desc: '報價類型「專案」標籤（Color/Purple/70）',
      },
      {
        name: '--label\\/outline-green',
        value: '#5a8c2c',
        desc: '報價類型「所客」標籤的框與字（Color/Green/80）',
      },
      {
        name: '--label\\/kanban-draft',
        value: '#d3d3d3',
        desc: '看板 draft 欄的圓點色（Color/Grey/30）',
      },
      {
        name: '--label\\/kanban-opened',
        value: '#bac6fd',
        desc: '看板 opened 欄的圓點色（CornflowerBlue/30）',
      },
      {
        name: '--label\\/kanban-dealclosed',
        value: '#8293da',
        desc: '看板 dealclosed 欄的圓點色（CornflowerBlue/50）',
      },
      {
        name: '--label\\/kanban-archiving',
        value: '#5866a0',
        desc: '看板 archiving 欄的圓點色（CornflowerBlue/70）',
      },
      {
        name: '--label\\/kanban-archived',
        value: '#333d66',
        desc: '看板 archived 欄的圓點色（CornflowerBlue/90）',
      },
    ],
  },
  {
    group: '徽章色',
    desc: 'Badge',
    tokens: [
      {
        name: '--badge\\/unread',
        value: '#cc5252',
        desc: '未讀徽章（app-badge）。與 --button/error 同值但語意不同：未讀不是錯誤也不是警告，獨立成 token 才能日後分開調',
      },
    ],
  },
  {
    group: 'Icon 色',
    desc: 'Icon',
    tokens: [
      {
        name: '--icon\\/body',
        value: '#686868',
        desc: '一般 icon 色',
      },
      {
        name: '--icon\\/body-darkest',
        value: '#535353',
        desc: '深色 icon',
      },
      {
        name: '--icon\\/white',
        value: '#ffffff',
        desc: '白色 icon',
      },
      {
        name: '--icon\\/warning',
        value: '#cc5252',
        desc: '警告 icon',
      },
    ],
  },
  {
    group: 'Input',
    desc: 'Input',
    tokens: [
      {
        name: '--input\\/background',
        value: '#ffffff',
        desc: '輸入框背景',
      },
      {
        name: '--input\\/prompt',
        value: '#939393',
        desc: 'Placeholder 色',
      },
    ],
  },
  {
    group: '背景',
    desc: 'Background',
    tokens: [
      {
        name: '--bg\\/modal-content',
        value: '#f0f4f8',
        desc: 'Modal 內容區背景',
      },
      {
        name: '--bg\\/white',
        value: '#ffffff',
        desc: '白色背景',
      },
      {
        name: '--tooltip\\/background',
        value: '#ffffff',
        desc: 'Tooltip 背景',
      },
    ],
  },
  {
    group: '光暈',
    desc: 'Glow',
    tokens: [
      {
        name: '--glow\\/sidebar-primary',
        value: 'rgba(199,236,255,0.50)',
        desc: 'Sidebar 主光暈',
      },
      {
        name: '--glow\\/sidebar-secondary',
        value: 'rgba(199,236,255,0.35)',
        desc: 'Sidebar 副光暈',
      },
      {
        name: '--glow\\/content-primary',
        value: 'rgba(199,236,255,0.40)',
        desc: '內容區主光暈',
      },
      {
        name: '--glow\\/content-secondary',
        value: 'rgba(178,225,255,0.30)',
        desc: '內容區副光暈',
      },
    ],
  },
  {
    group: '圓角',
    desc: 'Border Radius',
    tokens: [
      {
        name: '--radious\\/sm',
        value: '4px',
        desc: '小圓角',
      },
      {
        name: '--radious\\/md',
        value: '8px',
        desc: '中圓角',
      },
      {
        name: '--radious\\/lg',
        value: '12px',
        desc: '大圓角',
      },
      {
        name: '--radious\\/xl',
        value: '20px',
        desc: '超大圓角',
      },
    ],
  },
  {
    group: '間距',
    desc: 'Spacing',
    tokens: [
      {
        name: '--spacing\\/xxs',
        value: '4px',
        desc: '最小間距',
      },
      {
        name: '--spacing\\/xs',
        value: '8px',
        desc: '小間距',
      },
      {
        name: '--spacing\\/sm',
        value: '12px',
        desc: '中小間距',
      },
      {
        name: '--spacing\\/md',
        value: '16px',
        desc: '中間距',
      },
      {
        name: '--spacing\\/lg',
        value: '24px',
        desc: '大間距',
      },
      {
        name: '--spacing\\/xl',
        value: '40px',
        desc: '超大間距',
      },
    ],
  },
  {
    group: '字體大小',
    desc: 'Font Size',
    tokens: [
      {
        name: '--font-size\\/2xs',
        value: '10px',
        desc: '最小字',
      },
      {
        name: '--font-size\\/xs',
        value: '11px',
        desc: '極小字',
      },
      {
        name: '--font-size\\/sm',
        value: '12px',
        desc: '小字（實作 1em）',
      },
      {
        name: '--font-size\\/md',
        value: '14px',
        desc: '內文（實作 1em）',
      },
      {
        name: '--font-size\\/lg',
        value: '16px',
        desc: '標準',
      },
      {
        name: '--font-size\\/xl',
        value: '20px',
        desc: '大字',
      },
      {
        name: '--font-size\\/2xl',
        value: '24px',
        desc: '更大',
      },
      {
        name: '--font-size\\/3xl',
        value: '28px',
        desc: '標題',
      },
      {
        name: '--font-size\\/4xl',
        value: '36px',
        desc: '大標題',
      },
      {
        name: '--font-size\\/5xl',
        value: '50px',
        desc: '特大',
      },
      {
        name: '--font-size\\/6xl',
        value: '80px',
        desc: '展示用',
      },
    ],
  },
  {
    group: '字體家族',
    desc: 'Font Family',
    tokens: [
      {
        name: '--font-family\\/noto',
        value: "'Noto Sans TC', sans-serif",
        desc: '中文字體',
      },
      {
        name: '--font-family\\/inter',
        value: "'Inter', sans-serif",
        desc: '英文/數字字體',
      },
      {
        name: '--font-family\\/mono',
        value: "'Roboto Mono', monospace",
        desc: '等寬字體（金額/數字）',
      },
    ],
  },
  {
    group: '版面尺寸',
    desc: 'Layout',
    tokens: [
      {
        name: '--sidebar-width',
        value: '64px',
        desc: '側欄寬度',
      },
      {
        name: '--header-height',
        value: '56px',
        desc: '頁首高度',
      },
      {
        name: '--filter-height',
        value: '44px',
        desc: '篩選列高度',
      },
      {
        name: '--tabs-height',
        value: '48px',
        desc: '頁籤列高度',
      },
      {
        name: '--card-radius',
        value: '12px',
        desc: '卡片圓角',
      },
      {
        name: '--card-shadow',
        value: '0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        desc: '卡片陰影',
      },
      {
        name: '--transition',
        value: '0.2s ease',
        desc: '預設轉場',
      },
    ],
  },
  {
    group: '右下角 Dock',
    desc: 'Dock',
    tokens: [
      {
        name: '--dock\\/h',
        value: 'var(--dock\\/issue-report-w)',
        desc: '右下角 Dock 群組的高度；dialog 開啟時覆寫成 0px，其餘時間跟著 Dock 大小',
      },
      {
        name: '--dock\\/gap',
        value: '12px',
        desc: 'Dock 項目之間的間距',
      },
      {
        name: '--dock\\/issue-report-w',
        value: '48px',
        desc: '問題回報按鈕的寬度',
      },
    ],
  },
  {
    group: '動效緩動',
    desc: 'Easing',
    tokens: [
      {
        name: '--ease-enter',
        value: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
        desc: '進場、減速；大小或位置位移（easeOutCubic）。用法見「基礎／動效」',
      },
      {
        name: '--ease-exit',
        value: 'cubic-bezier(0.4, 0, 1, 1)',
        desc: '離場、加速。用法見「基礎／動效」',
      },
    ],
  },
  {
    group: '焦點環',
    desc: 'Focus ring',
    tokens: [
      {
        name: '--focus-ring-color',
        value: 'var(--button\\/action, #3a9ccd)',
        desc: '鍵盤聚焦時的焦點環顏色',
      },
      {
        name: '--focus-ring-width',
        value: '2px',
        desc: '焦點環粗細',
      },
      {
        name: '--focus-ring-offset',
        value: '2px',
        desc: '焦點環與元素邊緣的距離',
      },
    ],
  },
  {
    group: 'Avatar 配色',
    desc: 'Avatar',
    palette: true,
    tokens: [
      {
        name: '--color-avatar-1',
        value: '#3A9CCD',
        desc: '頭像底色 1',
      },
      {
        name: '--color-avatar-2',
        value: '#8B5CF6',
        desc: '頭像底色 2',
      },
      {
        name: '--color-avatar-3',
        value: '#E88C3C',
        desc: '頭像底色 3',
      },
      {
        name: '--color-avatar-4',
        value: '#D946A8',
        desc: '頭像底色 4',
      },
      {
        name: '--color-avatar-5',
        value: '#10B981',
        desc: '頭像底色 5',
      },
      {
        name: '--color-avatar-6',
        value: '#6366F1',
        desc: '頭像底色 6',
      },
      {
        name: '--color-avatar-7',
        value: '#F59E0B',
        desc: '頭像底色 7',
      },
      {
        name: '--color-avatar-8',
        value: '#06B6D4',
        desc: '頭像底色 8',
      },
      {
        name: '--color-avatar-fallback',
        value: '#9CA3AF',
        desc: '頭像底色（沒有對應色時）',
      },
    ],
  },
  {
    group: '既有專案 Token',
    desc: 'core.scss「既有專案 Tokens」段，早期專案沿用',
    tokens: [
      {
        name: '--color-primary',
        value: '#1E6FF1',
        desc: '主色',
      },
      {
        name: '--color-primary-light',
        value: '#EEF4FF',
        desc: '主色（淺）',
      },
      {
        name: '--color-primary-dark',
        value: '#1558C9',
        desc: '主色（深）',
      },
      {
        name: '--color-bg',
        value: '#EEF1F5',
        desc: '頁面背景',
      },
      {
        name: '--color-card-bg',
        value: '#FFFFFF',
        desc: '卡片背景',
      },
      {
        name: '--color-sidebar-bg',
        value: '#FFFFFF',
        desc: '側欄背景',
      },
      {
        name: '--color-text-primary',
        value: '#1C1C2E',
        desc: '主要文字',
      },
      {
        name: '--color-text-secondary',
        value: '#6B7280',
        desc: '次要文字',
      },
      {
        name: '--color-text-muted',
        value: '#9CA3AF',
        desc: '弱化文字',
      },
      {
        name: '--color-border',
        value: '#E5E7EB',
        desc: '邊框',
      },
      {
        name: '--color-border-light',
        value: '#F3F4F6',
        desc: '淺邊框',
      },
      {
        name: '--color-progress-bg',
        value: '#E5E7EB',
        desc: '進度條底色',
      },
      {
        name: '--color-success',
        value: '#10B981',
        desc: '成功',
      },
      {
        name: '--color-warning',
        value: '#F59E0B',
        desc: '警告',
      },
      {
        name: '--color-danger',
        value: '#EF4444',
        desc: '危險',
      },
      {
        name: '--color-not-success',
        value: '#E07090',
        desc: 'not-success 狀態',
      },
      {
        name: '--color-not-success-light',
        value: '#FDF2F5',
        desc: 'not-success 狀態（淺底）',
      },
    ],
  },
  {
    group: '色票 — Blue',
    desc: 'Palette: Blue',
    palette: true,
    tokens: [
      {
        name: '--color\\/blue\\/100',
        value: '#004b59',
      },
      {
        name: '--color\\/blue\\/90',
        value: '#006e82',
      },
      {
        name: '--color\\/blue\\/80',
        value: '#0090ab',
      },
      {
        name: '--color\\/blue\\/70',
        value: '#14b6d4',
      },
      {
        name: '--color\\/blue\\/60',
        value: '#30dcfd',
      },
      {
        name: '--color\\/blue\\/50',
        value: '#56e4ff',
      },
      {
        name: '--color\\/blue\\/40',
        value: '#7beaff',
      },
      {
        name: '--color\\/blue\\/30',
        value: '#a0f0ff',
      },
      {
        name: '--color\\/blue\\/20',
        value: '#c5f6ff',
      },
      {
        name: '--color\\/blue\\/10',
        value: '#eafbff',
      },
    ],
  },
  {
    group: '色票 — Soft Blue',
    desc: 'Palette: Soft Blue',
    palette: true,
    tokens: [
      {
        name: '--color\\/softblue\\/100',
        value: '#1d535a',
      },
      {
        name: '--color\\/softblue\\/90',
        value: '#2a6e78',
      },
      {
        name: '--color\\/softblue\\/80',
        value: '#398995',
      },
      {
        name: '--color\\/softblue\\/70',
        value: '#4ba5b2',
      },
      {
        name: '--color\\/softblue\\/60',
        value: '#5ec1cf',
      },
      {
        name: '--color\\/softblue\\/50',
        value: '#73ddec',
      },
      {
        name: '--color\\/softblue\\/40',
        value: '#85f0ff',
      },
      {
        name: '--color\\/softblue\\/30',
        value: '#aaf4ff',
      },
      {
        name: '--color\\/softblue\\/20',
        value: '#cef9ff',
      },
      {
        name: '--color\\/softblue\\/10',
        value: '#f3fdff',
      },
    ],
  },
  {
    group: '色票 — Calm Blue',
    desc: 'Palette: Calm Blue',
    palette: true,
    tokens: [
      {
        name: '--color\\/calmblue\\/100',
        value: '#073045',
      },
      {
        name: '--color\\/calmblue\\/90',
        value: '#0f4a67',
      },
      {
        name: '--color\\/calmblue\\/80',
        value: '#1a6489',
      },
      {
        name: '--color\\/calmblue\\/70',
        value: '#2980ab',
      },
      {
        name: '--color\\/calmblue\\/60',
        value: '#3a9ccd',
      },
      {
        name: '--color\\/calmblue\\/50',
        value: '#4fbaef',
      },
      {
        name: '--color\\/calmblue\\/40',
        value: '#79d1fc',
      },
      {
        name: '--color\\/calmblue\\/30',
        value: '#a1e0ff',
      },
      {
        name: '--color\\/calmblue\\/20',
        value: '#c7ecff',
      },
      {
        name: '--color\\/calmblue\\/10',
        value: '#eef9ff',
      },
    ],
  },
  {
    group: '色票 — Green',
    desc: 'Palette: Green',
    palette: true,
    tokens: [
      {
        name: '--color\\/green\\/100',
        value: '#2b4810',
      },
      {
        name: '--color\\/green\\/90',
        value: '#426a1c',
      },
      {
        name: '--color\\/green\\/80',
        value: '#5a8c2c',
      },
      {
        name: '--color\\/green\\/70',
        value: '#74ae3e',
      },
      {
        name: '--color\\/green\\/60',
        value: '#8fd053',
      },
      {
        name: '--color\\/green\\/50',
        value: '#acf26b',
      },
      {
        name: '--color\\/green\\/40',
        value: '#c4fd90',
      },
      {
        name: '--color\\/green\\/30',
        value: '#d6ffb1',
      },
      {
        name: '--color\\/green\\/20',
        value: '#e7ffd1',
      },
      {
        name: '--color\\/green\\/10',
        value: '#f7fff1',
      },
    ],
  },
  {
    group: '色票 — Grey',
    desc: 'Palette: Grey',
    palette: true,
    tokens: [
      {
        name: '--color\\/grey\\/100',
        value: '#333333',
      },
      {
        name: '--color\\/grey\\/90',
        value: '#535353',
      },
      {
        name: '--color\\/grey\\/80',
        value: '#686868',
      },
      {
        name: '--color\\/grey\\/70',
        value: '#7d7d7d',
      },
      {
        name: '--color\\/grey\\/60',
        value: '#939393',
      },
      {
        name: '--color\\/grey\\/50',
        value: '#aaaaaa',
      },
      {
        name: '--color\\/grey\\/40',
        value: '#bebebe',
      },
      {
        name: '--color\\/grey\\/30',
        value: '#d3d3d3',
      },
      {
        name: '--color\\/grey\\/20',
        value: '#e7e7e7',
      },
      {
        name: '--color\\/grey\\/10',
        value: '#fcfcfc',
      },
    ],
  },
  {
    group: '色票 — Pink',
    desc: 'Palette: Pink',
    palette: true,
    tokens: [
      {
        name: '--color\\/pink\\/100',
        value: '#431e2a',
      },
      {
        name: '--color\\/pink\\/90',
        value: '#612d3e',
      },
      {
        name: '--color\\/pink\\/80',
        value: '#7e3e53',
      },
      {
        name: '--color\\/pink\\/70',
        value: '#9b5069',
      },
      {
        name: '--color\\/pink\\/60',
        value: '#b86480',
      },
      {
        name: '--color\\/pink\\/50',
        value: '#d57897',
      },
      {
        name: '--color\\/pink\\/40',
        value: '#f28fb0',
      },
      {
        name: '--color\\/pink\\/30',
        value: '#f9b1c9',
      },
      {
        name: '--color\\/pink\\/20',
        value: '#ffd5e3',
      },
      {
        name: '--color\\/pink\\/10',
        value: '#fff4f8',
      },
    ],
  },
  {
    group: '色票 — Salmon',
    desc: 'Palette: Salmon',
    palette: true,
    tokens: [
      {
        name: '--color\\/salmon\\/100',
        value: '#5b3025',
      },
      {
        name: '--color\\/salmon\\/90',
        value: '#794234',
      },
      {
        name: '--color\\/salmon\\/80',
        value: '#965544',
      },
      {
        name: '--color\\/salmon\\/70',
        value: '#b36a56',
      },
      {
        name: '--color\\/salmon\\/60',
        value: '#d07f6a',
      },
      {
        name: '--color\\/salmon\\/50',
        value: '#ed9680',
      },
      {
        name: '--color\\/salmon\\/40',
        value: '#ffa790',
      },
      {
        name: '--color\\/salmon\\/30',
        value: '#ffc1b1',
      },
      {
        name: '--color\\/salmon\\/20',
        value: '#ffdcd2',
      },
      {
        name: '--color\\/salmon\\/10',
        value: '#fff6f4',
      },
    ],
  },
  {
    group: '色票 — Gold',
    desc: 'Palette: Gold',
    palette: true,
    tokens: [
      {
        name: '--color\\/gold\\/100',
        value: '#57441e',
      },
      {
        name: '--color\\/gold\\/90',
        value: '#755c2c',
      },
      {
        name: '--color\\/gold\\/80',
        value: '#92753c',
      },
      {
        name: '--color\\/gold\\/70',
        value: '#af8e4d',
      },
      {
        name: '--color\\/gold\\/60',
        value: '#cca861',
      },
      {
        name: '--color\\/gold\\/50',
        value: '#e9c377',
      },
      {
        name: '--color\\/gold\\/40',
        value: '#ffd88a',
      },
      {
        name: '--color\\/gold\\/30',
        value: '#ffe4ad',
      },
      {
        name: '--color\\/gold\\/20',
        value: '#ffefd0',
      },
      {
        name: '--color\\/gold\\/10',
        value: '#fffbf3',
      },
    ],
  },
  {
    group: '色票 — Sea Green',
    desc: 'Palette: Sea Green',
    palette: true,
    tokens: [
      {
        name: '--color\\/seagreen\\/100',
        value: '#254b2d',
      },
      {
        name: '--color\\/seagreen\\/90',
        value: '#366840',
      },
      {
        name: '--color\\/seagreen\\/80',
        value: '#498555',
      },
      {
        name: '--color\\/seagreen\\/70',
        value: '#5da26b',
      },
      {
        name: '--color\\/seagreen\\/60',
        value: '#73bf82',
      },
      {
        name: '--color\\/seagreen\\/50',
        value: '#8adc9a',
      },
      {
        name: '--color\\/seagreen\\/40',
        value: '#a3fab4',
      },
      {
        name: '--color\\/seagreen\\/30',
        value: '#c1ffcd',
      },
      {
        name: '--color\\/seagreen\\/20',
        value: '#dbffe2',
      },
      {
        name: '--color\\/seagreen\\/10',
        value: '#f6fff8',
      },
    ],
  },
  {
    group: '色票 — Turquoise',
    desc: 'Palette: Turquoise',
    palette: true,
    tokens: [
      {
        name: '--color\\/turquoise\\/100',
        value: '#005c5a',
      },
      {
        name: '--color\\/turquoise\\/90',
        value: '#047e7c',
      },
      {
        name: '--color\\/turquoise\\/80',
        value: '#0fa09e',
      },
      {
        name: '--color\\/turquoise\\/70',
        value: '#1fc2bf',
      },
      {
        name: '--color\\/turquoise\\/60',
        value: '#33e4e1',
      },
      {
        name: '--color\\/turquoise\\/50',
        value: '#49fffc',
      },
      {
        name: '--color\\/turquoise\\/40',
        value: '#72fffd',
      },
      {
        name: '--color\\/turquoise\\/30',
        value: '#9bfffd',
      },
      {
        name: '--color\\/turquoise\\/20',
        value: '#c4fffe',
      },
      {
        name: '--color\\/turquoise\\/10',
        value: '#edfffe',
      },
    ],
  },
  {
    group: '色票 — Cornflower Blue',
    desc: 'Palette: Cornflower Blue',
    palette: true,
    tokens: [
      {
        name: '--color\\/cornflowerblue\\/100',
        value: '#232a48',
      },
      {
        name: '--color\\/cornflowerblue\\/90',
        value: '#333d66',
      },
      {
        name: '--color\\/cornflowerblue\\/80',
        value: '#455183',
      },
      {
        name: '--color\\/cornflowerblue\\/70',
        value: '#5866a0',
      },
      {
        name: '--color\\/cornflowerblue\\/60',
        value: '#6c7cbd',
      },
      {
        name: '--color\\/cornflowerblue\\/50',
        value: '#8293da',
      },
      {
        name: '--color\\/cornflowerblue\\/40',
        value: '#99abf7',
      },
      {
        name: '--color\\/cornflowerblue\\/30',
        value: '#bac6fd',
      },
      {
        name: '--color\\/cornflowerblue\\/20',
        value: '#d8dfff',
      },
      {
        name: '--color\\/cornflowerblue\\/10',
        value: '#f5f7ff',
      },
    ],
  },
  {
    group: '色票 — Purple',
    desc: 'Palette: Purple',
    palette: true,
    tokens: [
      {
        name: '--color\\/purple\\/100',
        value: '#422745',
      },
      {
        name: '--color\\/purple\\/90',
        value: '#5a385e',
      },
      {
        name: '--color\\/purple\\/80',
        value: '#734978',
      },
      {
        name: '--color\\/purple\\/70',
        value: '#8b5c91',
      },
      {
        name: '--color\\/purple\\/60',
        value: '#a46fab',
      },
      {
        name: '--color\\/purple\\/50',
        value: '#bd83c4',
      },
      {
        name: '--color\\/purple\\/40',
        value: '#d699de',
      },
      {
        name: '--color\\/purple\\/30',
        value: '#efb0f7',
      },
      {
        name: '--color\\/purple\\/20',
        value: '#fad5fe',
      },
      {
        name: '--color\\/purple\\/10',
        value: '#fef7ff',
      },
    ],
  },
];
