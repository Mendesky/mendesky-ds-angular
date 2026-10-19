# 字型與文字樣式

這篇說明文字樣式怎麼套：用哪些 class、Figma 字級怎麼換算、Noto Sans TC 與 Roboto Mono 各用在哪裡。
寫任何文字樣式之前讀一次。

## 用 class，不要用 inline style

文字樣式一律在 template 加 class。不要用 inline style 設字型、字級、字重。

```html
<!-- ✅ 用 class -->
<span class="noto-14-medium">欄位標題</span>

<!-- ❌ inline style -->
<span style="font-size: 14px; font-weight: 500">欄位標題</span>
```

class 名稱的格式是「字型-字級-字重」。例如 `noto-14-medium` 是 Noto Sans TC、14px、字重 500。
所有 class 列在本頁的[字型 class 一覽](#字型-class-一覽)。

## Figma 小於 16px：用 1em

Figma 設計稿的字級小於 16px 時，實作用 `1em`，不寫像素。

- `1em` 會繼承父層的字級。頁面的基礎字級設在 `html, body`，是 14px。
- 12px 的 class（`noto-12-*`、`mono-12-*`）本身就是 `font-size: 1em`，直接用即可。
- 自己寫 `font-size` 時也照這條。字體大小 token 也有註明：`--font-size/sm`（12px）與 `--font-size/md`（14px）實作用 1em。

```scss
// Figma 標 12px 的說明文字
.hint {
  font-size: 1em;
}
```

### 手機上的輸入框

寬度 767px 以下時，輸入框、下拉、多行輸入與可編輯區的字級固定為 16px。
原因：iOS Safari 在字級小於 16px 的輸入框聚焦時，會自動放大畫面。
這段已寫在 DS 的 `core.scss`，不用自己加。

## 字距

24px 以上的 class 已內建 `letter-spacing: -0.02em`。不需要另外設定字距。

## Noto Sans TC：所有文字與一般數字

- 中文正文、標題、一般數字，都用 `noto-*`。
- Noto Sans TC 的數字本身等寬。數字欄位不需要另加 `tabular-nums`。

## Roboto Mono：使用端指定的金額

- `mono-*` 用在需要逐位對齊、上下比較的金額，例如明細表裡的單價與小計。
- 哪些金額要用等寬字型，是產品自己的規則，由使用端訂定。DS 只提供 `mono-*` 字級，不規定用在哪些欄位。
- 其他數字一律用對應字級的 `noto-*`，例如編號、電話、日期、版本號、頁碼、各種數量。

在 SCSS 裡直接設字型時，這樣寫：

```scss
// 使用端指定要等寬的金額
.price {
  font-family: 'Roboto Mono', monospace;
}

// 其他文字與數字
.serial-no {
  font-family: 'Noto Sans TC', sans-serif;
}
```

## Inter 已淘汰

- Inter 從未被載入。設成 Inter 的地方，實際顯示的是系統字型。
- `.inter-*` class 與 `--font-family/inter` 保留為舊名，已改指 Noto Sans TC。
- 新程式一律用 `noto-*`，不要再寫 `'Inter'`。

## 字型檔

DS 不附字型檔，由使用端載入 Noto Sans TC 與 Roboto Mono。
載入的字重要涵蓋下表 class 用到的字重。

## 字型 class 一覽

字級欄標「實作用 1em」的，就是上面[小於 16px 的規則](#figma-小於-16px-用-1em)。

<TypographyTable />

## 省略號用全形「…」

介面文案的省略號，用單一全形字元 `…`（U+2026）。不要用三個半形句點 `...`。

| 情境 | 寫法 |
|---|---|
| 進行中提示（按鈕載入文字、區塊載入文字） | `載入中…`、`建立中…`、`送出中…` |
| 下拉或自動完成的載入中選項 | `查詢中…` |
| 句中省略、「…等」 | `生日或電話…等` |

原因：`…` 是一個字元，三點的間距由字型排好。`...` 是三個西文句點，在中文字串裡的點距與基線由西文字型決定，看起來比旁邊的中文鬆散。

`...` 只在下列情況使用：

1. 程式語法，例如 TypeScript 的 spread／rest。
2. 必須是 ASCII 的識別字，例如 `data-testid`、CSS class、網址、檔名。
3. 照原樣顯示外部系統回傳的字串，例如後端訊息、第三方 API。
4. 純文字通道，例如 console log、CLI、commit message。
5. 英文引文的省略標記。

這是介面慣例，不是中文標點規範。標點規範的省略號是六點「……」；介面用單個 `…` 是中文介面的通行做法。

## 相關

- [色彩與 token](./tokens)：字體大小與字體家族 token
- [元件怎麼選](./choosing-components)
- [開始使用](./getting-started)
