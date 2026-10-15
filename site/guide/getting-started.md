# 開始使用

這篇說明怎麼把設計系統裝進一個 Angular 專案，並完成讓它能編譯、能跑測試、有樣式的設定。第一次接入設計系統、或專案裡的設定壞掉要對照時讀這篇。全部設定完，再接著讀[第一個畫面](./first-screen)。

## 這個套件是什麼

`@mendesky/ds-angular` 是 Mendesky 設計系統的 Angular 元件庫。

它是「原始碼套件」：套件裡放的是元件的 `.ts`、`.html`、`.scss` 原始碼，不是編譯好的檔案。

- 套件本身不需要 build。npm 安裝時，會直接把原始碼放進 `node_modules/@mendesky/ds-angular`。
- 使用端的 Angular 編譯器會把這些原始碼當成專案的一部分一起編譯。

因為由使用端自己編譯，專案需要多做下面四步設定。少一步，`ng build` 或 `ng test` 就會出錯。

## 安裝

從 GitHub 安裝，`#` 後面接要用的版本 tag：

```bash
npm i "github:Mendesky/mendesky-ds-angular#vX.Y.Z"
```

把 `vX.Y.Z` 換成實際版本，例如 `v0.1.11`。可用的版本與各版的變更列在 [GitHub Releases](https://github.com/Mendesky/mendesky-ds-angular/releases)。

裝完後 `package.json` 會多一行：

```json
{
  "dependencies": {
    "@mendesky/ds-angular": "github:Mendesky/mendesky-ds-angular#vX.Y.Z"
  }
}
```

`package-lock.json` 會記下這個 tag 對應的 commit。`package.json` 和 `package-lock.json` 要一起 commit。

### 套件需要的相依套件

套件在 `peerDependencies` 宣告了下列套件。peerDependencies 的意思是：套件本身不帶這些套件，要用使用端專案裡裝的那一份。

| 套件 | 版本 |
|---|---|
| `@angular/core`、`@angular/common`、`@angular/forms`、`@angular/platform-browser`、`@angular/cdk` | `>=17.3.0` |
| `rxjs` | `>=7.1.0` |
| `pdfjs-dist` | `3.11.174`（固定版本） |
| `markdown-it` | `^14.1.1` |
| `@tiptap/core`、`@tiptap/pm`、`@tiptap/starter-kit`、`@tiptap/extension-link`、`@tiptap/extension-placeholder` | `^3.22.3` |
| `@tiptap/extension-color`、`@tiptap/extension-table`、`@tiptap/extension-table-cell`、`@tiptap/extension-table-header`、`@tiptap/extension-table-row`、`@tiptap/extension-text-style` | `^3.22.4` |

## 四步設定

### 1. tsconfig 的 paths 指向專案根目錄的 symlink

在 `tsconfig.json` 加上路徑對應，讓 `import ... from '@mendesky/ds-angular'` 找到套件的進入點：

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@mendesky/ds-angular": ["mendesky-ds-angular/src/index.ts"]
    }
  }
}
```

這裡的 `mendesky-ds-angular` 是專案根目錄下的一個 symlink（符號連結，像捷徑一樣指向另一個資料夾），指向 `node_modules/@mendesky/ds-angular`。它由第 2 步自動建立。

路徑一定要指這個 symlink。另外兩種常見寫法都會壞：

- **直接指 `node_modules/@mendesky/ds-angular/...`**：`ng test` 用的編譯器看到路徑含 `/node_modules/`，會當成已編譯好的套件，略過元件的編譯。`ng build` 仍會過，但 `ng test` 會出現 `TypeError: Cannot read properties of undefined (reading 'ɵcmp')`。
- **指向專案外的相對路徑（例如 `../mendesky-ds-angular/src/index.ts`）**：測試建置會從專案外的另一份 `node_modules` 解析 `@angular/core`、`rxjs`，同一個套件出現兩份，測試出現 `NG0203`。

根目錄的 symlink 讓套件檔案不在 `node_modules` 路徑底下，但仍在專案自己的目錄樹裡，`@angular/core` 等相依套件也會解析到專案本身的那一份。兩個問題都避開。

symlink 是安裝時產生的，不要進版控。在 `.gitignore` 加一行：

```text
/mendesky-ds-angular
```

### 2. 用 postinstall 自動建立 symlink

symlink 由 `package.json` 的 `postinstall` 指令自動建立。postinstall 是 npm 在每次 `npm install` 完自動執行的指令。

```json
{
  "scripts": {
    "postinstall": "node scripts/link-ds-angular.js"
  }
}
```

`scripts/link-ds-angular.js` 的寫法如下：

```js
#!/usr/bin/env node
// 建立／刷新專案根目錄的 mendesky-ds-angular symlink，指向 node_modules/@mendesky/ds-angular。
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkgDir = path.join(root, 'node_modules', '@mendesky', 'ds-angular');
const linkPath = path.join(root, 'mendesky-ds-angular');

if (!fs.existsSync(pkgDir)) {
  console.error('[link-ds-angular] node_modules/@mendesky/ds-angular 不存在，先跑 npm install');
  process.exit(1);
}

// 用相對路徑記錄 symlink
const target = path.relative(root, fs.realpathSync(pkgDir));

// 根目錄已有同名的真目錄或檔案時，不自動刪除，停下來讓人處理
const st = fs.lstatSync(linkPath, { throwIfNoEntry: false });
if (st && !st.isSymbolicLink()) {
  console.error(
    `[link-ds-angular] ${linkPath} 已存在且不是 symlink（${st.isDirectory() ? '真目錄' : '一般檔案'}）。` +
    '不自動刪除以免毀掉未 commit 的內容；請手動移走後重跑 npm install。',
  );
  process.exit(1);
}

const current = st ? fs.readlinkSync(linkPath) : null;

if (current === target) {
  process.exit(0);
}

// 刪舊連結用 unlink：rmSync 會跟著連結走，斷掉的連結會被當成不存在而沒刪到
if (st) {
  fs.unlinkSync(linkPath);
}
fs.symlinkSync(target, linkPath, 'dir');
console.log(`[link-ds-angular] ${path.basename(linkPath)} -> ${target}`);
```

這份腳本有兩個重點：

- **symlink 用相對路徑。** 用絕對路徑的話，整個專案目錄被搬到別處（例如 Docker 多階段建置把檔案複製到另一個路徑）後連結會斷，`ng build` 會出現 `is missing from the TypeScript compilation`。
- **不刪真目錄。** 如果根目錄的 `mendesky-ds-angular` 是真的資料夾（例如有人把設計系統的 repo 直接 clone 在這裡改），腳本會停下來報錯，不會刪掉裡面未 commit 的改動。

### 3. angular.json 開啟 preserveSymlinks

在 `angular.json` 的 `build` 和 `test` 兩個 target **都要**加上 `preserveSymlinks: true`。

開了之後，編譯器會把 symlink 底下的檔案當成專案 paths 對應的一部分。沒開的話，編譯器會把 symlink 換成實際路徑，判定檔案在編譯範圍外，出現 `is missing from the TypeScript compilation`。

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

### 4. 引入全域樣式

元件的顏色、間距、字型都來自設計系統的 token 與文字樣式，要先在全域引入。

先在 `angular.json` 的 `build` 和 `test` 兩個 target 都加上 `stylePreprocessorOptions.includePaths`，指向套件的樣式資料夾。樣式是 Sass 依這個路徑去找的，不受 `preserveSymlinks` 影響，所以這裡維持 `node_modules` 路徑：

```json
{
  "stylePreprocessorOptions": {
    "includePaths": ["node_modules/@mendesky/ds-angular/src/styles"]
  }
}
```

接著在全域樣式檔（例如 `src/styles.scss`）的開頭引入 `core`：

```scss
@use 'core';
```

`core` 包含三樣東西：

- **Token CSS 變數**：色彩、間距、陰影等設計數值。
- **文字樣式**：字型與排版規則。
- **工具 class**：常用的輔助 class。

元件編譯時還會用到套件裡的 `_mixins.scss` 和 `_breakpoints.scss`，這兩個會自動載入，不用另外引入。

專案自己的全域樣式寫在 `@use 'core';` 之後。

## 載入字型

套件不帶字型檔，字型由使用端在 `index.html` 的 `<head>` 載入：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700&family=Roboto+Mono:wght@400..700&display=swap" rel="stylesheet">
```

- **Noto Sans TC（必載）**：所有文字與一般數字。它的數字本身就是等寬的，數字欄位不用另外加 `tabular-nums`。
- **Roboto Mono（用到 `mono-*` class 才需要）**：只用在報價與附加服務的金額。

舊的 `--font-family/inter` 和 `.inter-*` 已淘汰，目前改指向 Noto Sans TC，只是為了讓舊程式不壞。新程式請用 `noto-*`。各個文字樣式見[字型與文字樣式](./typography)。

## 提供 PDF worker

<ComponentLink id="doc-preview" /> 元件與 `pdf-render.util` 工具會處理 PDF。執行時它們會讀取網站根目錄下的 `assets/pdf.worker.min.js`，這支檔案要由使用端提供，版本是 pdfjs-dist 3.11.174。

從 `pdfjs-dist` 套件複製過來：

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.js src/assets/
```

`src/assets` 要在 `angular.json` 的 `assets` 清單裡，建置後才會出現在網站的 `assets/` 底下：

```json
{
  "assets": ["src/favicon.ico", "src/assets"]
}
```

少了這支檔案，PDF 預覽與渲染都無法運作。

自己讀 PDF 時一律呼叫 `pdf-render.util` 的 `loadPdfDocument()`，不要直接呼叫 `pdfjsLib.getDocument()`。`loadPdfDocument()` 關閉了 pdf.js 執行 eval 的功能，避免惡意 PDF 在網站上執行任意 JavaScript（CVE-2024-4367）。

## 確認設定成功

照順序檢查：

1. 跑 `npm install`。專案根目錄應該出現 `mendesky-ds-angular` 這個 symlink；第一次建立時，postinstall 會印出 `[link-ds-angular] mendesky-ds-angular -> node_modules/@mendesky/ds-angular`。
2. 照[第一個畫面](./first-screen)放一顆 `app-button`，跑 `ng build`，要能成功建置。
3. 打開畫面，按鈕要有設計系統的顏色與字型。
4. 跑 `ng test`，測試要能正常編譯執行。

出錯時對照下表：

| 症狀 | 原因 |
|---|---|
| `ng test` 出現 `Cannot read properties of undefined (reading 'ɵcmp')`，`ng build` 卻正常 | tsconfig 的 paths 指向 `node_modules`，改指根目錄的 symlink（第 1 步） |
| `ng test` 出現 `NG0203` | tsconfig 的 paths 指向專案外的相對路徑，改指根目錄的 symlink（第 1 步） |
| 出現 `is missing from the TypeScript compilation` | `build` 或 `test` 沒開 `preserveSymlinks`（第 3 步）；或 symlink 是絕對路徑，專案搬動後斷了（第 2 步） |
| 找不到 `@use 'core'` 的樣式檔 | `build` 或 `test` 沒設 `includePaths`（第 4 步） |
| 元件沒有任何顏色與間距 | 全域樣式沒有 `@use 'core'`（第 4 步） |
| postinstall 報「已存在且不是 symlink」 | 根目錄有同名的真資料夾或檔案，移走後重跑 `npm install` |
| PDF 預覽與渲染無法運作 | 缺少 `assets/pdf.worker.min.js` |

## 相關

- [第一個畫面](./first-screen)
- [版本與升級](./versioning)
- [字型與文字樣式](./typography)
- <ComponentLink id="doc-preview" />
