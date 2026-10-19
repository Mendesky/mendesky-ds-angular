# 表格的情境工具列

在富文字編輯器的表格裡，滑鼠移到儲存格時，列的左緣或欄的上緣會浮出一個小把手。點把手會開出只跟那一列或那一欄有關的選單，例如插入、刪除、建立複本。這篇說明什麼時候開這個功能、它怎麼運作。

要讓使用者就地調整表格結構，或想對其他重複的結構做類似的就地操作時，先讀這篇。

## 先判斷

「情境工具列」指貼在某個區塊邊緣、只跟那個區塊有關的操作入口。它不佔版面，也不改內容。

| 你的需求 | 做法 | 用什麼 |
| --- | --- | --- |
| 富文字編輯器裡的表格，要讓使用者增刪列與欄 | 開啟表格結構編輯（預設關閉，需要時才開） | <ComponentLink id="rich-text-editor" /> 的 `[tableStructureEditing]="true"` |
| 儲存的格式不支援表格 | 連表格工具一起隱藏，快捷鍵與貼上也進不來 | <ComponentLink id="rich-text-editor" /> 的 `hiddenTools` 傳入 `'table'` |
| 對其他重複結構（清單項、看板欄）就地施加一組操作 | 套用同一個原則：邊緣把手＋只列相關操作的選單＋範圍高亮 | 下方規則「情境選取工具列」 |
| 刪除一列或一欄 | 靠復原，不彈確認 Dialog | 見[確認與破壞性動作](./confirmation) |
| 刪除整個表格 | 不放進把手選單，由使用者選取整個表格後刪除 | — |

## 情境與範例

### 開啟表格結構編輯

在下面的範例裡，把滑鼠移到表格的儲存格上。列的左緣、欄的上緣會浮出把手。點開選單時，該列或該欄會以外框加淡底標示範圍。

<StoryEmbed id="rich-text-editor--table-structure-editing" :height="520" title="表格結構編輯" />

```html
<app-rich-text-editor
  [value]="contentDoc"
  placeholder="請輸入背景說明…"
  [readOnly]="readOnly"
  [tableStructureEditing]="true"
  (valueChange)="onContentChange($event)"
  (composedBlur)="onBlur()">
</app-rich-text-editor>
```

使用時注意：

- 觸控裝置沒有 hover。點一下儲存格，把手同樣會浮出。用鍵盤移進儲存格也會。
- 把手是按鈕，可以用 Tab 聚焦，按 Enter 或 Space 開啟選單。
- 選單只列跟這一列或這一欄有關的操作。第一列（表頭）的選單不會出現「上方插入列」。
- 選單開著的時候，把手不會收起來，滑鼠可以安心移到選單上。

### 選單裡的危險操作

刪除這類危險操作，在選單裡要用顏色加文字一起標示，不能只靠顏色。DS 的選單容器是 <ComponentLink id="action-menu" />，危險項目用 `variant="ghost"`、`color="danger"` 的按鈕。

<StoryEmbed id="action-menu--danger-actions" :height="220" title="選單裡的危險操作" />

自己實作類似的把手時，先看下方規則的實作要點：把手要掛到 `document.body` 才不會被裁切；範圍高亮在編輯器管理的儲存格上，必須用 ProseMirror（編輯器底層管理文件內容的框架）的 Decoration 實作，不能直接改 class，否則編輯器重繪時會被抹掉。

## 規則

<PatternBlock id="interaction.contextual-selection-toolbar" />

## 相關

- [確認與破壞性動作](./confirmation)：什麼時候用復原、什麼時候升級成 Dialog。
- [浮層怎麼選](./overlays)：浮層原型的分界。
- 元件：<ComponentLink id="rich-text-editor" />、<ComponentLink id="action-menu" />、<ComponentLink id="button" />
