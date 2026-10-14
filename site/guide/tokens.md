# 色彩與 token

這篇說明 DS 的設計 token：顏色、圓角、間距等數值怎麼命名、怎麼分組、寫樣式時怎麼引用。
寫任何顏色之前讀一次。拿設計稿的色碼要找對應 token 時，回來查[Figma 色碼怎麼對照](#figma-色碼怎麼對照)。

## 一律用 `var(token)`，不寫死色碼

顏色一律用 CSS 變數，不要寫死色碼。

```scss
// ✅ 用 token
.title {
  color: var(--text\/title);
  border-bottom: 1px solid var(--border\/primary);
}

// ❌ 寫死色碼
.title {
  color: #1c1c2e;
  border-bottom: 1px solid #e7e7e7;
}
```

原因：

- token 全部定義在 DS 的 `src/styles/core.scss` 的 `:root`。值只在這一處，改了以後用到它的地方一起變。
- 同值、不同用途的顏色是不同的 token，日後才能分開調整。例如 `--badge/unread` 與 `--button/error` 都是 #cc5252，但「未讀」不是錯誤，所以各有一個 token。寫死色碼就分不出來了。

## 命名方式

- 名稱用斜線分層：`--類別/名稱`。例如 `--text/body`、`--border/primary`、`--button/action`。
- 色票用 `--color/色系/階`。例如 `--color/grey/20`、`--color/calmblue/60`。
- 少數 token 沒有斜線，例如 `--sidebar-width`、`--ease-enter`、`--color-primary`。
- 圓角 token 的拼字是 `radious`（例如 `--radious/md`）。照原樣寫。

### 寫進 CSS 要跳脫斜線

CSS 變數名稱裡的斜線要寫成 `\/`：

```scss
.card {
  border-radius: var(--radious\/md);
  padding: var(--spacing\/md);
  background: var(--bg\/white);
}
```

下面表格的 token 名稱照 `core.scss` 原樣列出，已經含跳脫，可以直接複製。
文章內文為了好讀，寫成不跳脫的 `--text/body`。

## 分組

token 依用途分組。下面列常用的分組；完整清單見[本頁最後](#完整清單)。

### 文字顏色、邊框、灰階背景

<TokenTable groups="文字顏色,邊框,灰階背景" />

::: warning 白底上的淺灰
要「白底上看得出來的淺灰」，用 `--color/white/20`（#f1f3f5）。
不要用 `--color/grey/10`（#fcfcfc）：它和白色只差 3/255，放在白底上等於沒有效果。
:::

| 用途 | 用這個 | 不要用 |
|---|---|---|
| 列或按鈕的 hover、區塊底色、進度條軌道 | `--color/white/20`（#f1f3f5） | `--color/grey/10`（#fcfcfc） |
| 選定態，比 hover 更深一階 | `--color/grey/20`（#e7e7e7） | — |

- DS 自己的點擊複製（`.app-copy`）hover 底色用的就是 `--color/white/20`。
- `--color/white/20` 是不透明的 hex。半透明底會讓下層的漸層或光暈透上來；需要不透明底時用它。

### 按鈕色、Label 色

<TokenTable groups="按鈕色,Label 色" />

### 其他顏色

徽章、圖示、輸入框、背景、光暈、焦點環各有專用 token。

<TokenTable groups="徽章色,Icon 色,Input,背景,光暈,焦點環" />

### 圓角與間距

<TokenTable groups="圓角,間距" />

### 字體大小

Figma 小於 16px 的字級，實作用 `1em`。原因與字型 class 見[字型與文字樣式](./typography)。

<TokenTable groups="字體大小" />

### 其他分組

- **動效緩動**：`--ease-enter`、`--ease-exit`。用法見[動效](./motion)。
- **版面尺寸**：側欄寬度、頁首高度、卡片圓角與陰影等。
- **右下角 Dock**：右下角 Dock 群組的高度與項目間距。
- **Avatar 配色**：頭像底色。
- **既有專案 Token**：`core.scss`「既有專案 Tokens」段，早期專案沿用。

## 色票（palette）

色票是各色系的完整色階，分組名稱是「色票 — 色系」，例如「色票 — Grey」。

- 每個色系都有 10 到 100 共十階。數字越大越深。例如 Grey 100 是 #333333，Grey 10 是 #fcfcfc。
- 語意 token 的說明會註明取自哪一階。例如 `--button/action` 是 Calm Blue 60，`--label/accent-blue` 是 Blue 70。

以 Grey 為例：

<TokenTable groups="色票 — Grey" />

所有色系的色塊在下方[完整清單](#完整清單)的後段。

## Figma 色碼怎麼對照

1. 拿設計稿上的色碼，到 token 表找同值的 token。
2. 同一個色碼可能對到好幾個 token，挑用途相符的那個。例如 #939393 同時是 `--text/body-light`、`--text/disabled`、`--button/neutral`、`--input/prompt` 的值；停用狀態的文字就用 `--text/disabled`。
3. 對「值」，不要對「名字」。設計稿或原型裡的變數，可能和 DS token 同名不同值。例如原型的 `--grey-10` 是 #f1f3f5，對應的是 DS 的 `--color/white/20`；DS 的 `--color/grey/10` 則是 #fcfcfc。

## 完整清單

所有分組與色票的色塊：

<StoryEmbed id="foundations--colors" :height="640" title="色彩與 token 完整清單" />

## 相關

- [字型與文字樣式](./typography)
- [動效](./motion)
- [圖示](./icons)：圖示顏色也用 token
- [元件怎麼選](./choosing-components)
