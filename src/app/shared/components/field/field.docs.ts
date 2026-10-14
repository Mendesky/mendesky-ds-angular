import type { ComponentDoc } from '../../../../docs/component-doc';

export const fieldDoc: ComponentDoc = {
  id: 'field',
  name: 'Field',
  selector: 'app-field',
  group: '表單元件',
  summary: 'label hint [required] [emphasis]',
  when: '所有表單欄位外層包裝。提供一致的 label 排版。標題只放欄位名稱（中粗 500）；單位（元）、限制（單檔上限 50MB）、提示（可複選）一律放 hint（標題旁淺灰說明），不要寫進 label 文字。跟畫面重複的說明（例如按鈕已列出的選項）直接不寫。',
  props: [
    {
      name: 'label',
      type: 'string',
      default: "''",
      desc: '標題文字（中粗 500，v0.1.9 起）；只放欄位名稱，不含單位或說明；空字串時不顯示標題列',
    },
    {
      name: 'hint',
      type: 'string',
      default: "''",
      desc: '標題旁的說明文字（一般 400、淺灰），排在標題與「必填」之間；放單位（元）、限制、提示，盡量精簡',
    },
    {
      name: 'required',
      type: 'boolean',
      default: 'false',
      desc: '顯示「必填」badge（SoftBlue，XXS）',
    },
    {
      name: 'emphasis',
      type: 'boolean',
      default: 'false',
      desc: '強調樣式：label 加粗（700）+ 標題色（--text/title）+ label 下方 1px 分隔線；用於唯讀展示區塊（如 P4 發文資料 / 目的）',
    },
  ],
  usage: [
    {
      label: '必填欄位',
      code: `<app-field label="案件名稱" [required]="true">
  <app-input placeholder="請輸入案件名稱" [errorMessage]="form.nameError"></app-input>
</app-field>`,
    },
    {
      label: '一般欄位（選填不標示）',
      code: `<app-field label="備註">
  <app-textarea placeholder="選填說明"></app-textarea>
</app-field>`,
    },
    {
      label: '無標題（僅包裹 input，不顯示 label row）',
      code: `<app-field>
  <app-input placeholder="搜尋"></app-input>
</app-field>`,
    },
    {
      label: '強調樣式（唯讀展示）',
      code: `<app-field label="受文者" [emphasis]="true">
  <div class="cem-readonly-value noto-14-regular">{{ recipientText }}</div>
</app-field>`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: 'app-field 是表單欄位的包裝元件，負責統一管理標題列與必填 badge。將 app-input、app-textarea、app-autocomplete 等放入 <ng-content> 即可。選填欄位不加任何 badge，只顯示 label 文字。',
    },
  ],
  customTables: [],
};
