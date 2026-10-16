# 表單與錯誤提示

這篇說明四件事：表單欄位怎麼包、驗證錯誤怎麼顯示、怎麼在選項清單尾端新增自訂項、Wizard 裡的 Enter 鍵怎麼運作。

做表單、或要接上驗證錯誤之前，先讀這篇。

## 先判斷

| 你要做的事 | 做法 | 用什麼 |
| --- | --- | --- |
| 欄位要有標題、必填標示 | 外層包一層。標題只放欄位名稱；單位、限制、提示放 `hint`；必填傳 `[required]="true"` | <ComponentLink id="field" /> |
| 某個欄位驗證沒通過 | 在欄位元件傳 `errorMessage`。有值就進入錯誤狀態，空字串就清除 | <ComponentLink id="input" />、<ComponentLink id="select" />、<ComponentLink id="date-picker" /> 等，見下一節 |
| 按送出時條件還不足 | 主按鈕維持停用外觀但可以點，點了說明原因並捲到第一個錯誤欄位 | <ComponentLink id="button" /> 的 `clickableWhenDisabled`，見[浮層怎麼選](./overlays) |
| 在選項清單尾端新增自訂項 | 觸發鈕原地變成輸入框，按 Enter 送出。不用 `window.prompt`，也不在 Modal 裡再疊 Dialog | <ComponentLink id="inline-add" /> |
| Wizard 或表單 Modal 裡按 Enter | 兩段式：第一次 Enter 把焦點移到主按鈕，第二次才真的送出 | 下方規則「Wizard 鍵盤導航」 |

## 欄位錯誤訊息怎麼顯示

錯誤訊息掛在欄位元件本身，不掛在 `app-field`。`app-field` 只管標題與必填標示。選填欄位不加任何標示。

共通的寫法：

- `errorMessage` 是開關。有字就顯示錯誤，空字串就是沒有錯誤。
- 錯誤提示是浮動的 tooltip，不佔版面。
- `errorPosition` 決定提示在欄位上方（`top`）或下方（`bottom`），預設 `bottom`。
- 欄位錯誤**預設顯示在欄位下方**，一般情況用預設值即可。只有版面放不下（例如欄位下方緊接著其他內容、會被遮住）時，才改成 `errorPosition="top"`。

| 元件 | 錯誤相關屬性 | 補充 |
| --- | --- | --- |
| <ComponentLink id="input" /> | `errorMessage`、`errorPosition` | |
| <ComponentLink id="textarea" /> | `errorMessage`、`errorPosition` | |
| <ComponentLink id="number-input" /> | `errorMessage`、`errorPosition` | |
| <ComponentLink id="select" /> | `errorMessage`、`errorPosition` | |
| <ComponentLink id="autocomplete" /> | `errorMessage`、`errorPosition` | |
| <ComponentLink id="date-picker" /> | `errorMessage`、`errorPosition` | |
| <ComponentLink id="button-group" /> | `errorMessage`、`errorPosition` | 只有 `type="form"` 有效 |
| <ComponentLink id="inline-confirm" /> | `error`、`errorMessage`、`errorPosition` | `error` 切換警示色框；`errorMessage` 預設顯示在勾選項下方 |
| <ComponentLink id="upload-dropzone" /> | `errorMessage`、`errorPosition` | 預設顯示在上傳區下方，框線同時轉成錯誤紅 |

在有明確送出按鈕的 Modal 或 Wizard 裡，使用者點了停用的主按鈕時，所有錯誤同時顯示，畫面捲到第一個錯誤欄位。這個流程寫在[浮層怎麼選](./overlays)的底部按鈕段落。

## 情境與範例

### 欄位驗證沒通過

下面的範例還沒選日期時顯示錯誤。選好日期後，`errorMessage` 變成空字串，錯誤就消失。

<StoryEmbed id="date-picker--error-state" :height="420" title="日期欄位的錯誤狀態" />

```html
<app-field label="出生日期" [required]="true">
  <app-date-picker
    mode="day"
    size="M"
    [errorMessage]="pickerValue ? '' : '請選擇出生日期'"
    [(ngModel)]="pickerValue">
  </app-date-picker>
</app-field>
```

`app-input`、`app-select` 的寫法一樣：

```html
<app-field label="項目名稱" [required]="true">
  <app-input
    size="L"
    placeholder="請輸入項目名稱"
    [errorMessage]="form.nameError"
    (valueChange)="onNameChange($event)"
  ></app-input>
</app-field>

<app-field label="部門" [required]="true">
  <app-select
    [options]="departmentOptions"
    placeholder="請選擇部門"
    [errorMessage]="form.departmentError"
    formControlName="department"
  ></app-select>
</app-field>
```

### 在選項清單尾端新增自訂項

點「＋ 新增其他項目」，按鈕會原地變成輸入框。輸入後按 Enter，新項目會加進清單並勾選。

<StoryEmbed id="inline-add--in-chip-group" :height="260" title="在選項清單尾端新增自訂項" />

- 只有 Enter 會送出。內容去掉前後空白後不是空字串，才會發出 `(add)`。
- 按 Esc 或點到別處（blur）一律取消，輸入的內容丟掉。
- 元件只負責輸入。去重、加入清單、勾選都在父層的 `(add)` 處理。
- 新增後立刻勾選並送後端。失敗時怎麼處理，見[載入與回饋](./feedback)。

```html
<div class="chip-wrap">
  @for (opt of options(); track opt) {
    <app-check-chip [text]="opt" [(ngModel)]="checked[opt]"></app-check-chip>
  }
  <app-inline-add (add)="addCustom($event)"></app-inline-add>
</div>
```

```ts
// 父層：去重 + 加入清單 + 勾選（資料留在父層）
addCustom(name: string) {
  if (this.options().includes(name)) return;
  this.options.update(l => [...l, name]);
  this.onToggle(name, true); // 自動勾選並送後端
}
```

### Wizard 裡的 Enter 鍵

Wizard 的 Enter 分兩段，避免使用者打完一格就誤觸換頁：

- 焦點在文字欄位時按 Enter：焦點移到當頁的主按鈕（下一步、送出），不直接送出。
- 焦點在主按鈕時再按 Enter：才真的送出。
- 焦點在多行文字框（textarea）時，Enter 保留換行。
- 輸入法正在選字時，Enter 是確認選字，不攔截。

`app-button-group` 已內建對應的鍵盤行為：方向鍵在選項之間移動，Space 只切換選項。對未選中的選項按 Enter 會切換過去；對已選中的選項再按一次 Enter，事件會往外傳給 Wizard，由 Wizard 把焦點移到下一步按鈕。

下面的範例可以用方向鍵、Space、Enter 試試看。範例外層沒有 Wizard，所以對已選中的選項再按 Enter 不會有反應。

<StoryEmbed id="button-group--interactive" :height="260" title="Button Group 鍵盤操作" />

## 規則

<PatternBlock id="form.inline-custom-add" />

<PatternBlock id="wizard.keyboard" />

## 相關

- [浮層怎麼選](./overlays)：停用主按鈕的 tooltip 與捲到錯誤欄位。
- [載入與回饋](./feedback)：欄位存檔後的 toast、載入中不讓欄位寫入。
- 元件：<ComponentLink id="field" />、<ComponentLink id="input" />、<ComponentLink id="select" />、<ComponentLink id="date-picker" />、<ComponentLink id="inline-add" />、<ComponentLink id="check-chip" />、<ComponentLink id="button-group" />
