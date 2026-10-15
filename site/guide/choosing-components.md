# 元件怎麼選

這篇說明寫畫面時怎麼挑元件：原生 HTML 元素該換成哪個 DS 元件，以及各分組有哪些元件、各自用在哪裡。
開始寫 template 前讀一次。之後不確定該用哪個元件時，回來查表。

## 先查有沒有現成元件

寫 template 之前，先確認 DS 有沒有現成元件可用。

1. 要用原生元素（`<button>`、`<input>` 這類）時，先看下面的對照表。
2. 要做選單、浮層、確認彈窗、標籤這類組合時，也先看對照表。表裡列了最常被自己刻的組合。
3. 表裡沒有的需求，到[各分組的元件](#各分組的元件)找用途相符的元件。
4. 點進元件說明頁，讀「什麼時候用」與注意事項。禁止的做法也寫在那裡。

元件說明會寫明它取代哪些自刻做法，以及自刻會出什麼問題。
例如 <ComponentLink id="toast-container" /> 只在 app root 掛一次；自己再建一套 toast 堆疊，兩套會互相遮蓋。

## 原生元素與自刻組合的對照

| 原生元素／自刻做法 | 改用 | 怎麼分 |
|---|---|---|
| `<button>` | <ComponentLink id="button" />、<ComponentLink id="icon-btn" /> | 一般可點擊操作用 `app-button`；純圖示的操作（工具列、表格操作）用 `app-icon-btn` |
| `<input>` | <ComponentLink id="input" />、<ComponentLink id="number-input" /> | 單行文字用 `app-input`；金額、數量等數字欄位用 `app-number-input`（有加減鍵與格式化） |
| `<select>` | <ComponentLink id="select" />、<ComponentLink id="autocomplete" /> | 固定選項用 `app-select`；要先搜尋、再動態篩選選項時用 `app-autocomplete` |
| `<textarea>` | <ComponentLink id="textarea" /> | 備註、描述等多行輸入 |
| 自刻 dropdown／menu | <ComponentLink id="action-menu" /> | 右鍵或「更多」按鈕展開的選單 |
| 自刻 overlay＋card | <ComponentLink id="modal-shell" /> | 所有自訂 modal 的容器 |
| 自刻確認彈窗 | <ComponentLink id="dialog" /> | 不可逆操作前的確認，或錯誤提示 |
| 自刻 badge／tag | <ComponentLink id="label" /> | 狀態、分類標籤 |

「怎麼分」一欄摘自各元件說明的用途。細節以元件說明頁為準。

要顯示「有未讀」或未讀數字的徽章，是另一個元件 <ComponentLink id="badge" />，不是 `app-label`。

## 例外

下列情況不用套這張對照表：

- 純 SCSS 或純邏輯的修改。
- 功能專屬（feature-specific）的元件。

## 各分組的元件

下面各表的用途欄，取自每個元件說明的「什麼時候用」。點元件名稱可進入說明頁，看屬性與範例。

### 互動元件

<ComponentTable group="互動元件" />

### 表單元件

表單怎麼組、錯誤怎麼提示，見[表單與錯誤提示](./forms)。

<ComponentTable group="表單元件" />

### 浮層元件

不確定該用哪一種浮層時，見[浮層怎麼選](./overlays)。
不可逆操作的確認，見[確認與破壞性動作](./confirmation)。

<ComponentTable group="浮層元件" />

### 展示元件

<ComponentTable group="展示元件" />

### 工具

這一組不是元件，是 CSS class 或 directive。用途寫在各自的說明頁。

<ComponentTable group="工具" />

## 相關

- [浮層怎麼選](./overlays)
- [確認與破壞性動作](./confirmation)
- [表單與錯誤提示](./forms)
- [圖示](./icons)
- [貢獻](./contributing)：要把新元件加進 DS 時讀
