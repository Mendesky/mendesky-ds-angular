# 貢獻

這篇說明新增或修改設計系統元件時，除了元件本身還要補哪些檔案、送出 PR 前在本機跑哪些檢查，以及 CI 會擋下什麼。要改設計系統的 repo 時讀這篇。

## 每種內容的正本在哪裡

設計系統的 repo 是元件說明、token、字型、動效、互動原則的唯一正本。文件網站從這些檔案產生，不要在別處另外維護一份。

| 內容 | 正本位置 |
|---|---|
| 元件說明（用途、屬性、範例程式碼、注意事項） | 元件旁邊的 `<名稱>.docs.ts`，格式見 `src/docs/component-doc.ts` |
| 範例頁 | 元件旁邊的 `<名稱>.stories.ts` |
| 色彩與 token、字型、動效 | `src/docs/foundations/`（樣式本身在 `src/styles/core.scss`） |
| 互動原則 | `src/docs/patterns.ts` |
| 指南文章 | `site/guide/*.md` |
| 圖示 | `src/app/shared/components/icon/icon.registry.ts` |

## 新增或修改元件時要補什麼

### 1. 說明檔 `<名稱>.docs.ts`

放在元件旁邊，export 一個 `ComponentDoc` 物件。要寫：

- `when`：什麼時候用、禁止哪些用法。
- `props`：每一個 `@Input`／`@Output`，包含用 signal 寫的 `input()`／`output()`／`model()`。輸出事件的名稱用括號包住，例如 `(btnClick)`，並標 `isOutput: true`。
- `usage`：程式碼範例。
- `notes`：注意事項。

`group` 是文件網站上的分組，只能是 `互動元件`、`表單元件`、`浮層元件`、`展示元件`、`工具` 其中之一。

以 `app-field` 的說明檔為例（節錄）：

```ts
import type { ComponentDoc } from '../../../../docs/component-doc';

export const fieldDoc: ComponentDoc = {
  id: 'field',
  name: 'Field',
  selector: 'app-field',
  group: '表單元件',
  when: '所有表單欄位外層包裝。提供一致的 label 排版。…',
  props: [
    {
      name: 'required',
      type: 'boolean',
      default: 'false',
      desc: '顯示「必填」badge（SoftBlue，XXS）',
    },
    // …每個 @Input／@Output 都要列
  ],
  usage: [
    {
      label: '必填欄位',
      code: `<app-field label="案件名稱" [required]="true">
  <app-input placeholder="請輸入案件名稱" [errorMessage]="form.nameError"></app-input>
</app-field>`,
    },
  ],
  // notes、customTables 等其餘欄位略
};
```

說明檔裡的屬性名稱必須跟元件程式碼宣告的完全一致，檢查會比對（見下方「本機檢查」）。

### 2. 範例頁 `<名稱>.stories.ts`

放在元件旁邊：

- `title` 寫成 `'<分組>/<名稱>'` 的字面值，例如 `'表單元件/Input'`。不要用變數或字串組合。
- 第一支 story 是元件說明頁上方的主範例。

以 `app-input` 的範例頁為例（節錄）：

```ts
import type { Meta, StoryObj } from '@storybook/angular';
import { InputComponent } from '../../../../index';

const meta: Meta<InputComponent> = {
  title: '表單元件/Input',
  id: 'input',
  component: InputComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<InputComponent>;

export const Default: Story = {
  args: {
    size: 'L',
    placeholder: '請輸入文字',
    disabled: false,
  },
};
```

### 3. token 與字型 class 同步

改了 `src/styles/core.scss` 裡的 token 或字型 class，要同步改 `src/docs/foundations/`。文件網站的 token 與字型表格是從 `foundations` 產生的。

### 4. 行為改了，測試一起改

設計系統的 `*.spec.ts` 與使用端專案裡對應的元件契約測試，是同一份契約的兩份拷貝。改了元件行為，兩邊的測試要一起改，不要留下「程式碼是新的、測試還在檢查舊行為」的狀態。

### 只在母元件內部用的子元件

只在母元件內部使用、不給外部直接用的子元件（例如 `select-panel`）不需要說明檔。這份清單在 `scripts/check-docs.mjs` 的 `INTERNAL_COMPONENTS`。不在清單上的公開元件，檢查都會要求它旁邊有說明檔。

## 寫指南文章

指南文章放在 `site/guide/*.md`。文章只寫說明；表格與互動原則的內容在建置時從上面的正本讀出，不要把規則抄進文章。

連到元件說明頁用 `<ComponentLink id="..." />`，嵌入範例用 `<StoryEmbed id="..." />`。`ComponentLink` 或互動原則的 id 寫錯、找不到對象時，指南的冒煙測試會失敗。

## 本機檢查

送出 PR 前在本機跑一次：

```bash
npm run typecheck      # 型別檢查
npm run check:docs     # 說明與程式碼是否一致（屬性、token、字型、互動原則）
npx ng test --watch=false --browsers=ChromeHeadless   # 單元測試
DOCS_REPO_BASE=/ npm run site:build -- main          # 建完整文件網站（指南＋元件頁）
node scripts/smoke-storybook.mjs site/.vitepress/dist/components   # 元件頁逐頁冒煙測試
node scripts/smoke-guides.mjs site/.vitepress/dist /main/         # 指南逐頁冒煙測試
```

冒煙測試是逐頁打開網站，確認每頁都畫得出來、沒有錯誤。

邊寫邊看文件網站：

```bash
npm run site:dev       # 指南
npm run storybook      # 元件頁，打開 http://localhost:6006
```

## CI 會擋什麼

每次 push 與每個發到 `main` 的 PR，CI 都會跑下面四項，任何一項失敗都不能合併：

| 檢查 | 內容 |
|---|---|
| 型別檢查 | `npm run typecheck`，範例頁與說明檔也在檢查範圍內 |
| 說明檢查 | 先跑檢查腳本自身的測試（`npm run test:scripts`），再跑 `npm run check:docs`：每個公開元件都有說明檔、說明檔列的屬性跟程式碼宣告一致、說明檔能正確載入 |
| 單元測試 | `ng test`。CI 會先裝中文字型，讓版面量測類的測試換行結果跟開發機一致 |
| 文件網站建置與冒煙測試 | 建完整文件網站（指南＋元件頁），再逐頁打開元件頁與指南頁 |

建置指南時會檢查站內連結，指南裡連到不存在的頁面，建置就會失敗。

## 相關

- [版本與升級](./versioning)
- [開始使用](./getting-started)
- [元件怎麼選](./choosing-components)
