# @mendesky/ds-angular

Mendesky Design System component library for Angular (source-consumed package).

## 快速開始

此套件以 source-consumed 模式提供，消費端應用需遵循以下設定：

### 1. 安裝依賴

直接從 GitHub 安裝（需有 `Mendesky/mendesky-ds-angular` 的 SSH 讀取權限）：

```bash
npm i "git+ssh://git@github.com/Mendesky/mendesky-ds-angular.git#main"
```

`package.json` 會長這樣：

```json
{
  "dependencies": {
    "@mendesky/ds-angular": "git+ssh://git@github.com/Mendesky/mendesky-ds-angular.git#main"
  }
}
```

`package-lock.json` 釘的是 commit SHA，所以 `#main` 不會造成不同人裝到不同版本；要升到最新版跑
`npm update @mendesky/ds-angular`（記得連 lockfile 一起 commit）。本套件不需 build，npm 會直接
把原始碼放進 `node_modules/@mendesky/ds-angular`。

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

## License

MIT

## Spec 政策：與 mendesky-web 同步

本套件的 `*.spec.ts` 與 mendesky-web 中對應的 consumer contract tests 是**同一份契約的兩份拷貝**，
必須同步更新：改了元件行為，兩邊的 spec 一起改。web 的 CI（karma）是行為閘門，本 repo 的 CI 只跑
`tsc --noEmit`（typecheck 閘門）。回灌（backport）元件程式碼時，對應 spec 檔一併回灌，
不得留下「程式碼是新的、spec 斷言舊行為」的打架狀態。
