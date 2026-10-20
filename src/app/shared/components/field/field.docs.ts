import type { ComponentApi } from '../../../../docs/component-doc';

export const fieldDoc: ComponentApi = {
  id: 'field',
  selector: 'app-field',
  summary: 'label hint [required] [emphasis]',
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
      desc: '強調樣式：label 加粗（700）+ 標題色（--text/title）+ label 下方 1px 分隔線；用於唯讀展示區塊（如信件的收件人 / 說明）',
    },
  ],
  usage: [
    {
      label: '必填欄位',
      code: `<app-field label="項目名稱" [required]="true">
  <app-input placeholder="請輸入項目名稱" [errorMessage]="form.nameError"></app-input>
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
      code: `<app-field label="收件人" [emphasis]="true">
  <div class="readonly-value noto-14-regular">{{ recipientText }}</div>
</app-field>`,
    },
  ],
};
