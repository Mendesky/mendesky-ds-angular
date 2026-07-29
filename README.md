# @mendesky/ds-angular

Mendesky Design System component library for Angular (source-consumed package).

## 快速開始

此套件以 source-consumed 模式提供，消費端應用需遵循以下設定：

### 1. 安裝依賴

在 consumer 的 `package.json` 中新增 `file:` 依賴：

```json
{
  "dependencies": {
    "@mendesky/ds-angular": "file:../mendesky-ds-angular"
  }
}
```

### 2. TypeScript 路徑對應

在 consumer 的 `tsconfig.json` 中配置 `paths`，指向套件入口：

```json
{
  "compilerOptions": {
    "paths": {
      "@mendesky/ds-angular": ["../mendesky-ds-angular/src/index.ts"]
    }
  }
}
```

### 3. Angular 編譯配置

在 consumer 的 `angular.json` 中啟用 `preserveSymlinks`，避免 monorepo 環境中的符號連結問題：

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
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

## 全域樣式引入

套件提供的所有元件依賴設計系統的 token 與 typography 定義。消費端應用的全域樣式中**必須引入**：

```scss
@import '@mendesky/ds-angular/src/styles/core.scss';
```

`core.scss` 包含：
- **Token CSS 變數**：色彩、間距、陰影等設計符號
- **Typography**：字體與排版規則
- **Utility class**：通用 helper class

元件編譯期額外依賴 `_mixins.scss` 與 `_breakpoints.scss`（自動隨套件載入），消費端無需手動引入。若未引入 `core.scss`，元件將在 runtime 缺乏樣式，呈現色碼裸奔狀態。

## License

MIT
