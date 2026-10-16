import type { ComponentDoc } from '../../../../docs/component-doc';

export const datePickerDoc: ComponentDoc = {
  id: 'date-picker',
  name: 'Date Picker',
  selector: 'app-date-picker',
  group: '表單元件',
  summary: 'mode: year|month|day · size: S|M|L · minYear maxYear · [maxDate] [clearable] [emptyLabel] · month/day 模式點標題年份展開年份清單快速跳年 · CVA 控制 value',
  when: '需要選取民國年、年月、或完整日期（年月日）的場景。',
  props: [
    {
      name: 'mode',
      type: "'year' | 'month' | 'day'",
      default: "'month'",
      desc: '選取粒度：year=只選年、month=選年月、day=選年月日',
    },
    {
      name: 'size',
      type: "'S' | 'M' | 'L'",
      default: "'M'",
      desc: 'trigger 高度：S=28px、M=32px、L=40px（對齊 app-select L）',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: '依 mode 自動推導',
      desc: "空值時顯示的 placeholder 文字；不傳時依 mode 推導：day='選擇日期'、month='選擇月份'、year='選擇年度'",
    },
    {
      name: 'minYear',
      type: 'number',
      default: '110',
      desc: '可選最小民國年',
    },
    {
      name: 'maxYear',
      type: 'number',
      default: '125',
      desc: '可選最大民國年',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '禁用狀態：灰底、不可點擊，支援 CVA setDisabledState',
    },
    {
      name: 'maxDate',
      type: '{ year: number; month: number; day: number } | null',
      default: 'null',
      desc: '不允許選此日期之後的日期（民國年）。月格灰暗、日格 disabled、年份清單中的未來年亦 disabled。null 表示無限制。',
    },
    {
      name: 'clearable',
      type: 'boolean',
      default: 'false',
      desc: '顯示清除按鈕：有值且非 disabled 時於欄位內顯示 ✕ icon（data-testid="date-picker-clear"），點擊 emit 空字串清空。opt-in，用於空值合法的場景（如非必填起始日）。',
    },
    {
      name: 'emptyLabel',
      type: 'string',
      default: "''",
      desc: '空值時顯示的「實心」語意文字（深色，非灰色 placeholder）。用於空值本身有明確業務語意的情境（如開始日期空＝「審核通過後開始」）；點擊仍可開面板選日期。空字串時退回一般 placeholder 行為。',
    },
    {
      name: 'maxMonth',
      type: 'number | null',
      default: 'null',
      desc: '不允許選超過此月份，需搭配 maxYear 一起用。null 表示無限制。注意與 maxYear／maxDate 是不同層級的限制，勿誤以為 maxYear 已涵蓋',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: "''",
      desc: '錯誤訊息；有值時欄位顯示錯誤樣式，並以錯誤提示顯示訊息',
    },
    {
      name: 'errorPosition',
      type: "'top' | 'bottom'",
      default: "'bottom'",
      desc: '錯誤提示顯示在欄位上方或下方',
    },
    {
      name: 'yearOnly',
      type: 'boolean',
      default: 'false',
      desc: '已淘汰，請改用 mode="year"；為 true 時等同 mode="year"',
    },
  ],
  usage: [
    {
      label: '選年月（預設）',
      code: `<app-date-picker
  size="S"
  [ngModel]="startTime"
  (ngModelChange)="onStartTimeChange($event)">
</app-date-picker>`,
    },
    {
      label: '只選年',
      code: `<app-date-picker
  mode="year"
  size="L"
  placeholder="選擇過往年度"
  [maxYear]="currentRocYear"
  [ngModel]="year"
  (ngModelChange)="onYearChange($event)">
</app-date-picker>`,
    },
    {
      label: '選年月日',
      code: `<app-date-picker
  mode="day"
  size="M"
  [ngModel]="date"
  (ngModelChange)="onDateChange($event)">
</app-date-picker>`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: "值格式：year='114'、month='114-3'、day='114-3-15'，空值 ''；實作 ControlValueAccessor，支援 ngModel",
    },
    {
      type: 'info',
      content: '行為規格：點擊 trigger → portal 到 body 的浮動 panel，dropdown 寬度與 trigger 同寬。year 模式：直接顯示 2 欄年份 grid，點擊年份即選取。month 模式：← 年 → 導覽 + 3×4 月份 grid，點擊月份即選取。day 模式：先選月份（← 年 → 導覽 + 3×4 月份 grid），選月後切換至日期 grid（← 返回 + 標題 + 7 欄星期 + 日期按鈕），點擊日期即選取。Escape / 點擊 trigger 外 → 關閉 panel。',
    },
    {
      type: 'info',
      content: '（2026-07 更新）快速跳年：month/day 模式的標題年份為可點按鈕（帶下箭頭），點擊展開可捲動的年份清單（minYear..maxYear，開啟時自動聚焦/捲到目前年），選年後回到月份 grid 繼續選月/日——用於 minYear 距今較遠（如出生日期民國40年起）時免逐年點箭頭。year 模式的年份清單是根視圖、選年即最終值（emit），行為不變。',
    },
    {
      type: 'info',
      content: "（2026-04 更新）鍵盤操作：Enter/Space 開關 panel、Tab/Shift+Tab 關閉 panel 並標記 touched（讓 Angular form validation 正確觸發）、Escape 關閉 panel。trigger 設定 role='combobox' + aria-expanded + aria-haspopup='listbox'。",
    },
    {
      type: 'warning',
      content: 'host 已設定 display: block，放入 flex 容器時會自動伸展；需固定寬度時請在父層設定 width。',
    },
  ],
  customTables: [],
};
