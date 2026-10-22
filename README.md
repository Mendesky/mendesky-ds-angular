# @mendesky/ds-angular

Mendesky Design System component library for Angular (source-consumed package).

設計系統分成本體與各框架套件：本套件是 Angular 版，依賴本體 [`@mendesky/ds`](https://github.com/Mendesky/mendesky-ds)（色彩、字型、圖示、跟框架無關的工具程式、元件規格），安裝本套件時會自動帶入。設計系統的文件網站：https://mendesky.github.io/mendesky-ds/

## 快速開始

此套件以 source-consumed 模式提供，消費端應用需遵循以下設定：

### 1. 安裝依賴

直接從 GitHub 安裝，指定版本 tag（版本列表見 GitHub Releases 或文件網站右上角的版本選單）：

```bash
npm i "github:Mendesky/mendesky-ds-angular#v0.1.12"
```

`package.json` 會長這樣：

```json
{
  "dependencies": {
    "@mendesky/ds-angular": "github:Mendesky/mendesky-ds-angular#v0.1.12"
  }
}
```

`package-lock.json` 會記下該 tag 對應的 commit；升級時改 tag 並指名重裝
（`npm i "github:Mendesky/mendesky-ds-angular#<新 tag>"`），記得連 lockfile 一起 commit。
本套件不需 build，npm 會直接把原始碼放進 `node_modules/@mendesky/ds-angular`。

### 2. TypeScript 路徑對應

`tsconfig.json` 的 `paths` **必須指向 consumer 專案根目錄下的一個 symlink**，而不是 `node_modules`，也不是 `../` 這種 sibling 相對路徑：

```json
{
  "compilerOptions": {
    "paths": {
      "@mendesky/ds-angular": ["mendesky-ds-angular/src/index.ts"]
    }
  }
}
```

其中 `./mendesky-ds-angular` 是 consumer 專案根目錄下的一個 symlink（建議 gitignore），指向真正的
`mendesky-ds-angular` repo。這個設計並非隨意，兩種常見的錯誤配置都會在實測中踩坑：

- **指向 `node_modules/@mendesky/ds-angular/...`**：Karma 測試建構器（`@ngtools/webpack`）使用的
  ivy 編譯器，只要解析路徑含有 `/node_modules/`，就會判定為 `isExternalLibraryImport` 並跳過
  `ɵcmp`/`ɵfac` 的產生（因為它預期那裡放的是已編譯發佈的 library，而非本套件這種直接消費原始
  `.ts` 原始碼的形式）。`ng build`（esbuild pipeline 沒有這條限制）仍會過，但 `ng test` 會炸成
  `TypeError: Cannot read properties of undefined (reading 'ɵcmp')`。
- **指向 `../mendesky-ds-angular/src/index.ts`（sibling 相對路徑）**：webpack 為測試建的 builder
  會把這個路徑解析到專案樹外、另一份獨立的 `node_modules`，導致 `@angular/core`、`rxjs` 等 peer
  依賴出現重複實例，測試炸出 `NG0203`。

根目錄的 symlink 讓套件檔案「掛在 node_modules 之外、但仍在專案自己的目錄樹底下」，同時保證第三方
依賴（`@angular/core`、`rxjs`…）解析到與應用程式本身相同的那份 `node_modules`，兩個雷都避開。

### 3. 自動建立 symlink（postinstall）

上述 symlink 應該由 consumer 專案的 `postinstall` script 自動建立/刷新，解析
`node_modules/@mendesky/ds-angular`（`npm install` 已從 git 依賴抓下來）的 realpath 後建立
symlink，不需要手動維護。可參考 `mendesky-platform-console` 的
`scripts/link-ds-angular.js` 作為標準範例。

### 4. Angular 編譯配置

在 consumer 的 `angular.json` 中，`build` 與 `test` 兩個 architect target **都要**啟用
`preserveSymlinks: true`——讓 ivy 編譯器把 symlink 出來的套件檔案視為專案自己 tsconfig path 對應的
一部分，而不是 realpath 解析到編譯範圍之外後拒絕它（"is missing from the TypeScript compilation"）：

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "preserveSymlinks": true
          }
        },
        "test": {
          "options": {
            "preserveSymlinks": true
          }
        }
      }
    }
  }
}
```

## 元件說明與範例網站

- 設計系統的文件網站在本體 repo：https://mendesky.github.io/mendesky-ds/
- 本 repo 發布 Angular 版的範例網站（Storybook）：`https://mendesky.github.io/mendesky-ds-angular/<版本>/components/`，
  `main/components/` 是開發中的最新內容。本機看：`npm run storybook`（http://localhost:6006）。
- 拆成本體＋框架套件之前（v0.2.0 以前）的完整文件保留在 `https://mendesky.github.io/mendesky-ds-angular/<版本>/`。

元件說明分成兩份，以同一個 `id` 對應；文件網站、Storybook 說明頁、mendesky-web 的 AI 協作索引把兩份合併呈現：

| 內容 | 放在哪裡 |
|---|---|
| 元件規格（何時用、注意事項、選用表格） | 本體 `@mendesky/ds` 的 `src/docs/components/<id>.ts` |
| Angular 用法（selector、屬性、事件、範例程式碼） | 本 repo 元件旁邊的 `<名稱>.docs.ts`（格式見 `src/docs/component-doc.ts`） |
| 範例頁 | 本 repo 元件旁邊的 `<名稱>.stories.ts` |
| 色彩與 token、字型、動效、互動原則、圖示、跟框架無關的工具程式 | 本體 `@mendesky/ds` |

### 新增或修改元件時要補什麼

1. 本體 repo：元件規格 `src/docs/components/<id>.ts`（何時用、注意事項）。
2. 本 repo：元件旁邊的 `<名稱>.docs.ts`：每個 `@Input`／`@Output`（含 signal 的 `input()`／`output()`／`model()`）、程式碼範例。只放 Angular 用法，規格欄位放這裡會被檢查擋下。
3. 本 repo：元件旁邊的範例頁 `<名稱>.stories.ts`：`title` 寫成 `'<分組>/<名稱>'` 字面值；第一支 story 是說明頁上方的主範例。
4. 改了本體之後，本 repo 的 `package.json` 把 `@mendesky/ds` 改指新版本（用 `npm i "github:Mendesky/mendesky-ds#<tag>"` 指名安裝）。
5. 本機跑一次：

```bash
npm run typecheck      # 型別檢查
npm run check:templates # 元件 template 檢查：用跟使用端相同的 Angular 嚴格設定編譯元件
npm run check:docs     # Angular 說明與程式碼一致、跟本體元件規格對得上
npm run test:scripts   # 檢查腳本自身的測試
npx ng test --watch=false --browsers=ChromeHeadless   # 單元測試
bash scripts/build-storybook-site.sh storybook-static # 建範例網站
node scripts/smoke-storybook.mjs storybook-static     # 範例網站逐頁冒煙測試
```

CI 會在每個 PR 跑同樣的檢查，任何一項失敗都不能合併。只在母元件內部使用的子元件（例如 `select-panel`）
不需要說明檔，清單在 `scripts/check-docs.mjs` 的 `INTERNAL_COMPONENTS`。

元件 template 檢查失敗時，訊息會指出 template 的檔名與行號，例如
`button.component.html:24:10 - error TS2339: Property 'xxx' does not exist on type 'ButtonComponent'`。
使用端（mendesky-web、platform-console）用同一套嚴格設定編譯 DS，這裡沒擋下的錯，換版時會在使用端壞掉。
設定在 `tsconfig.templates.json`；嚴格選項被關掉、或有元件沒被納入檢查時，檢查會直接失敗。

## PDF 功能依賴

套件內的 `doc-preview` 元件與 `pdf-render.util` 工具需要 PDF 處理能力，在 runtime 會讀取：

- **路徑**：`assets/pdf.worker.min.js`
- **版本**：pdfjs-dist 3.11.174

**消費端必須**手動在 web root 的 `assets/` 資料夾下提供此檔案。可從 pdfjs-dist 套件中複製：

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.js src/assets/
```

若缺少此檔案，PDF 預覽與渲染功能將無法正常運作。

**安全**：讀 PDF 一律呼叫 `loadPdfDocument()`（`pdf-render.util`），不要直接呼叫 `pdfjsLib.getDocument()`。
它關閉了 pdf.js 的 eval（`isEvalSupported: false`），避免惡意 PDF 在本站執行任意 JavaScript（CVE-2024-4367）。

## 全域樣式引入

套件提供的所有元件依賴設計系統的 token 與 typography 定義。在 consumer 的 `angular.json` 中，於
`build` 與 `test` 兩個 architect target 都加上 `stylePreprocessorOptions.includePaths`，指向套件在
`node_modules` 底下的 styles 目錄（樣式解析走 Sass 的 load path，不受 `preserveSymlinks` 影響，維持
`node_modules` 路徑即可）：

```json
{
  "stylePreprocessorOptions": {
    "includePaths": ["node_modules/@mendesky/ds-angular/src/styles"]
  }
}
```

接著在 consumer 的全域樣式（如 `src/styles.scss`）中**必須引入**：

```scss
@use 'core';
```

`core` 包含：
- **Token CSS 變數**：色彩、間距、陰影等設計符號
- **Typography**：字體與排版規則
- **Utility class**：通用 helper class

元件編譯期額外依賴 `_mixins.scss` 與 `_breakpoints.scss`（自動隨套件載入），消費端無需手動引入。若未引入 `core`，元件將在 runtime 缺乏樣式，呈現色碼裸奔狀態。

## 字型載入

本套件**不**自帶字型檔，由消費端在 `index.html` 載入：

- **Noto Sans TC（必載）**：所有文字與一般數字。Noto Sans TC 的數字本身等寬，數字欄位不需另加 `tabular-nums`。
- **Roboto Mono（用到 `mono-*` class 才需要）**：用在需要逐位對齊的金額；哪些金額要用它，由使用端規定。

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700&family=Roboto+Mono:wght@400..700&display=swap" rel="stylesheet">
```

`--font-family/inter` 與 `.inter-*` 已淘汰（Inter 從未被任何消費端載入），目前改指 Noto Sans TC 以免舊用法壞掉；新程式請用 `noto-*`。

## 授權

Copyright (c) 2026 嘉威聯合會計師事務所. All rights reserved.

本 repo 公開僅供檢視，未授權任何使用、複製、修改或散布，完整條款見 [LICENSE](./LICENSE)。
圖示在本體套件 `@mendesky/ds`；取自第三方的圖示（Heroicons、Lucide）的授權見本體 repo 的 [THIRD-PARTY-NOTICES.md](https://github.com/Mendesky/mendesky-ds/blob/main/THIRD-PARTY-NOTICES.md)。

## Spec 政策：測試只放這個 repo

元件的 `*.spec.ts` 只放在這個 repo，使用端專案（mendesky-web）不保留複製品。
本 repo 的 CI 在每次 push 與每個發到 `main` 的 PR 跑型別檢查、元件 template 檢查、說明檢查、單元測試（Karma）、
範例網站建置與冒煙測試，任何一項失敗都不能合併。跟框架無關的工具程式的測試在本體 repo。

- 單元測試是元件行為的閘門。改了元件行為，在同一個 PR 改對應的 spec，
  不得留下「程式碼是新的、spec 斷言舊行為」的打架狀態。
- 新元件的 spec 放在元件旁邊，只放這裡。
- 使用端只測自己的程式（自己的 directive、頁面怎麼組元件），不複製 DS 的 spec。
- 從使用端搬元件進來時，spec 一起搬，使用端那份刪掉。
