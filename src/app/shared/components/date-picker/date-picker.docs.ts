import type { ComponentApi } from '../../../../docs/component-doc';

export const datePickerDoc: ComponentApi = {
  id: 'date-picker',
  selector: 'app-date-picker',
  summary: 'mode: year|month|day · size: S|M|L · minYear maxYear · [maxDate] [clearable] [emptyLabel] · ariaLabel · month/day 模式點標題年份展開年份清單快速跳年 · CVA 控制 value',
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
      desc: '顯示清除按鈕：有值且非 disabled 時於欄位內顯示 ✕ icon（data-testid="date-picker-clear"），點擊 emit 空字串清空。清除鈕念「清除＋欄位名稱」，例如「清除完成日期」；沒有欄位名稱時念「清除日期」。opt-in，用於空值合法的場景（如非必填的開始日期）。',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: '報讀軟體念的欄位名稱。直接寫在有 label 的 app-field 裡不用設，會自動念欄位標題；沒有欄位標題、或包在別的元件裡時才設（例如篩選列的開始、結束日期）。設了就只用它，不用欄位標題。按鈕念「名稱＋目前文字」，清除鈕念「清除＋名稱」；名稱跟按鈕上的文字一樣時（例如提示文字就寫「開始日期」）只念一次。同一個欄位裡放兩個（例如日期區間的開始與結束）時兩個都要設，不然兩顆清除鈕會念一樣的名稱。要寫 ariaLabel，不要寫 aria-label：aria-label 會留在外框上，按鈕還是念不出欄位名稱。',
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
      label: '放在有標題的欄位裡：報讀軟體念「完成日期 114 年 3 月 15 日」，欄位必填時也會念出必填，不用另外設名稱',
      code: `<app-field label="完成日期" [required]="true">
  <app-date-picker
    mode="day"
    size="L"
    [ngModel]="completedDate"
    (ngModelChange)="onCompletedDateChange($event)">
  </app-date-picker>
</app-field>`,
    },
    {
      label: '沒有欄位標題時用 ariaLabel 給名稱（例：篩選列的日期區間）',
      code: `<app-date-picker mode="day" size="S" ariaLabel="開始日期" placeholder="開始日期" [clearable]="true" [ngModel]="from" (ngModelChange)="onFromChange($event)"></app-date-picker>
<app-date-picker mode="day" size="S" ariaLabel="結束日期" placeholder="結束日期" [clearable]="true" [ngModel]="to" (ngModelChange)="onToChange($event)"></app-date-picker>`,
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
  usageNotes: [
    {
      type: 'info',
      content: 'app-date-picker 實作 ControlValueAccessor，支援 ngModel。',
    },
    {
      type: 'info',
      content: 'Tab／Shift+Tab 關閉 panel 時會把表單控制項標記為 touched，讓 Angular form validation 正確觸發。',
    },
    {
      type: 'info',
      content: '欄位標題和必填只認同一個模板裡直接包住它的 app-field（跟 app-input 一樣）。把 app-date-picker 包進自己寫的元件、再把那個元件放進 app-field，就念不到外層的標題和必填，這時要在自己的元件上接一個名稱再傳給 ariaLabel。',
    },
  ],
};
