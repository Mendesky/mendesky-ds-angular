# 圖示

這篇說明圖示怎麼用：`app-icon` 的寫法、尺寸、顏色、怎麼查名稱，以及要新增圖示時的流程。
第一次放圖示之前讀一次。找不到想要的圖示時，回來看[新增圖示](#新增圖示)。

## 用法

所有圖示都用 <ComponentLink id="icon" />，給 `name` 與 `size`：

```html
<app-icon name="DownArrow" size="16"></app-icon>
```

- `name`：圖示名稱。查法見[查名稱](#查名稱)。
- `size`：顯示尺寸，字串。不給時是 `"24"`。
- 每個圖示都畫在 24×24 的格線上（`viewBox="0 0 24 24"`）。`size` 只決定顯示多大。

## 尺寸

| `size` | 像素 | 適用場景 |
|---|---|---|
| `"12"` | 12px | 卡片內的小圖示、badge |
| `"16"` | 16px | 控制列按鈕、表格操作 |
| `"24"` | 24px | 側欄導覽、一般圖示（預設） |
| `"32"` | 32px | 較大的圖示 |
| `"36"` | 36px | Toast 圖示 |
| `"48"` | 48px | 空狀態插圖 |

`size` 另外接受 `"20"` 與 `"28"`，這兩個是 <ComponentLink id="checkbox" /> 專用。

大小一律用 `size` 控制。不要用 inline style 的 `width`／`height` 或 `font-size`。

```html
<!-- ✅ 用 size -->
<app-icon name="DownArrow" size="16"></app-icon>

<!-- ❌ 用 inline style 控制大小 -->
<app-icon name="DownArrow" style="width: 16px; height: 16px"></app-icon>
```

## 顏色

圖示用 `currentColor` 上色，顏色跟著 CSS 的 `color` 走。
在圖示本身或父層設 `color` 即可；顏色用 token。

```html
<!-- 設在圖示本身 -->
<app-icon name="Search" size="24" style="color: var(--icon\/body)"></app-icon>
```

```scss
// 設在父層：裡面的 app-icon 跟著變色
.toolbar {
  color: var(--icon\/body);
}
```

- 圖示放在按鈕或 chip 裡時，會跟著文字色變色。
- 少數圖示帶固定顏色，不會跟著 `color` 變。例如多色品牌 logo `M365Color`，以及右上角帶紅點的 `Alerts`。

圖示專用的顏色 token：

<TokenTable groups="Icon 色" />

## 查名稱

下面是 DS 的全部圖示。輸入名稱可以篩選，點一下圖示會複製名稱。

<StoryEmbed id="foundations--icons" :height="520" title="圖示總覽" />

- 名稱要和清單上的寫法完全一樣，大小寫也要相同。
- 名稱不存在時，畫面上什麼都不顯示；開發模式會在 console 印出警告。
- 名稱可能含連字號或是小寫，例如 `Trash-Del`、`Done-OK`、`eye-off`。判定「沒有」之前，用名稱的一部分再篩一次。

## 不要安裝其他圖示庫

不要安裝 Font Awesome、Material Icons 等任何圖示庫。圖示一律用 `app-icon` 與 DS 的圖示清單。

## 新增圖示

圖示加在 DS repo 的 `src/app/shared/components/icon/icon.registry.ts`。使用端升級到含新圖示的 DS 版本後，就能用新名稱。

1. 先在[圖示總覽](#查名稱)確認沒有同樣意思的圖示。
2. 在 Figma 選取圖示，按右鍵，選 Copy/Paste as → Copy as SVG。
3. 只取 `<svg>` 內層的元素（`path`、`circle`、`rect` 等）。
4. 把寫死的顏色換成 `currentColor`，例如 `fill="#7D7D7D"` 改成 `fill="currentColor"`。描邊的 `stroke` 也一樣。
5. 以圖示名稱為 key 加進 registry。名稱對應 Figma 的 `Icons/xxx`（不含 `Icons/`）。
6. 來源不是 24×24 時，用 `transform` 把圖形縮放或置中到 24×24 格線。registry 裡有前例可以參考。

```ts
export const ICON_REGISTRY: Record<string, string> = {
  // ...
  'DownArrow': `<path fill-rule="evenodd" clip-rule="evenodd" d="..." fill="currentColor"/>`,
};
```

### 第三方來源要標註授權

取自第三方圖示庫的圖示，依其原授權使用。新增時：

1. 在 registry 的註解寫明來源與授權，例如 `Heroicons v2 outline megaphone, MIT`。
2. 同步更新 repo 根目錄的 `THIRD-PARTY-NOTICES.md`，在表格加上圖示 key、來源與授權。

目前用到的第三方來源：

| 來源 | 授權 |
|---|---|
| Heroicons v2 outline | MIT |
| Lucide | ISC |
| Lucide 中衍生自 Feather 的圖示 | MIT（Feather） |

## 相關

- <ComponentLink id="icon" />：屬性與範例
- <ComponentLink id="icon-btn" />：純圖示的按鈕
- [色彩與 token](./tokens)
- [元件怎麼選](./choosing-components)
