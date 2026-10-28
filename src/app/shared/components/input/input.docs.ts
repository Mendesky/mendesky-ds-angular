import type { ComponentApi } from '../../../../docs/component-doc';

export const inputDoc: ComponentApi = {
  id: 'input',
  selector: 'app-input',
  summary: 'size: S|M|L · placeholder type inputMode sanitize initialValue errorMessage errorPosition: top|bottom · [disabled] [readonly] · ariaLabel autocomplete name inputId · (valueChange) (blur) (passwordVisibilityChange)',
  props: [
    {
      name: 'size',
      type: 'InputSize',
      default: "'M'",
      desc: "'S' | 'M' | 'L'",
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'Placeholder'",
      desc: '佔位文字',
    },
    {
      name: 'type',
      type: 'string',
      default: "'text'",
      desc: "HTML input type（text / date / email / number / password / tel 等）；type='password' 時自動顯示 eye toggle，clear 按鈕隱藏",
    },
    {
      name: 'inputMode',
      type: 'InputMode',
      default: "'text'",
      desc: '透傳至原生 inputmode，影響行動裝置鍵盤型態。\'numeric\' 跳出數字鍵盤（無符號）；\'tel\' 跳出電話鍵盤（含 + * #）。電話/手機/純數字欄位搭配 sanitize="digits" 一起用。',
    },
    {
      name: 'sanitize',
      type: "'none' | 'digits'",
      default: "'none'",
      desc: "輸入時自動過濾字元。'digits' = 只保留數字，非數字（英文、符號、連字號）在 input event 中即時被 strip，含 paste 情境；cursor 位置自動修正。",
    },
    {
      name: 'initialValue',
      type: 'string',
      default: "''",
      desc: '預填值；外部可透過此 Input 同步更新欄位內容（ngOnChanges 監聽）',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: "''",
      desc: '錯誤訊息；有值時切換 error 狀態並顯示在下方',
    },
    {
      name: 'errorPosition',
      type: "'top' | 'bottom'",
      default: "'bottom'",
      desc: '錯誤 tooltip 顯示方向（浮動，不佔版面）',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '禁用狀態',
    },
    {
      name: 'readonly',
      type: 'boolean',
      default: 'false',
      desc: '唯讀狀態：不可編輯、隱藏清空鈕，但文字維持正常色、可聚焦選取（展示型欄位用，如分享連結）。與 disabled 不同——disabled 文字轉淡灰且不可聚焦。',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: '報讀軟體念的名稱，落在內層 input 的 aria-label。直接寫在有 label 的 app-field 裡不用設，會自動念欄位標題；沒有欄位標題、或包在別的元件裡時才設（例如表格列內、只有圖示標示的輸入框）。設了就只念它，不念欄位標題。要寫 ariaLabel，不要寫 aria-label：aria-label 會留在外框上，輸入框還是沒有名稱。',
    },
    {
      name: 'autocomplete',
      type: 'string',
      default: "''",
      desc: "透傳到內層 input 的 autocomplete。本站登入用 'username'／'current-password'；別的平台的帳密（不是登入本站用的）帳號欄用 'off'、密碼欄用 'new-password'，避免瀏覽器把本站帳密填進去。空字串不輸出。",
    },
    {
      name: 'name',
      type: 'string',
      default: "''",
      desc: '透傳到內層 input 的 name；空字串不輸出',
    },
    {
      name: 'inputId',
      type: 'string',
      default: "''",
      desc: '內層 input 的 id，給外面自己寫的 label for 指向。不要在 app-input 上寫 id：它會落在外框上，指向它的 label 連不到輸入框。',
    },
    {
      name: '(valueChange)',
      type: 'EventEmitter<string>',
      desc: '值變更事件',
      isOutput: true,
    },
    {
      name: '(blur)',
      type: 'EventEmitter<string>',
      desc: 'blur 事件，帶出當前值；用於需要 blur 後觸發邏輯的場景（如地址郵遞區號 lookup）',
      isOutput: true,
    },
    {
      name: '(passwordVisibilityChange)',
      type: 'EventEmitter<boolean>',
      desc: "type='password' 時按眼睛按鈕發出；true＝切成明文。用於明文不放在前端、切成明文才向後端取回的欄位",
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '搭配 app-field 提供標題與必填標示',
      code: `<app-field label="項目名稱" [required]="true">
  <app-input
    size="L"
    placeholder="請輸入項目名稱"
    [errorMessage]="form.nameError"
    (valueChange)="onNameChange($event)"
  ></app-input>
</app-field>`,
    },
    {
      label: '預填值（例：從 API 回填）',
      code: `<app-input
  size="M"
  [initialValue]="prefillValue"
  (valueChange)="prefillValue = $event"
></app-input>`,
    },
    {
      label: '日期 input',
      code: '<app-input type="date" size="M" (valueChange)="onDateChange($event)"></app-input>',
    },
    {
      label: '唯讀展示（如分享連結，不可編輯但可讀可選取）；沒有欄位標題時用 ariaLabel 給名稱',
      code: '<app-input size="M" ariaLabel="分享連結" [initialValue]="shareUrl" [readonly]="true"></app-input>',
    },
    {
      label: '別的平台的帳密（不讓瀏覽器填入本站帳密），切成明文時才取回密碼',
      code: `<app-field label="服務平台帳號">
  <app-input placeholder="請輸入帳號" autocomplete="off" (blur)="onAccountChange($event)"></app-input>
</app-field>
<app-field label="服務平台密碼">
  <app-input
    type="password"
    placeholder="請輸入密碼"
    autocomplete="new-password"
    (passwordVisibilityChange)="onPasswordVisibilityChange($event)"
  ></app-input>
</app-field>`,
    },
  ],
};
