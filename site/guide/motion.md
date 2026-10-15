# 動效

這篇說明動畫的時長怎麼選、緩動曲線怎麼套，以及收合／展開動畫怎麼做。
寫任何 `transition` 或 `animation` 之前讀一次。

## 時長分級

時長分四級：Micro、Component、Panel、Page。依元素的規模挑一級。
各級的時長與適用場景見下方[時長與曲線一覽](#時長與曲線一覽)。

- 時長直接寫毫秒值。DS 不提供時長的 utility class。
- 進場與退場可以用不同等級。例如 <ComponentLink id="drawer-shell" /> 進場是 Panel 的 450ms，退場是 300ms。

## 緩動曲線

緩動曲線只有兩個 token：

- `var(--ease-enter)`：進場，以及大小、位置的位移。
- `var(--ease-exit)`：退場。

Micro 等級（hover、focus、toggle 這類）進出場都可以用減速（ease-out）曲線。DS 自己的 hover 轉場寫成 `150ms var(--ease-enter)`。

### 不可以硬寫 `cubic-bezier`

曲線一律用 token，不要寫 `cubic-bezier(...)` 數值。token 定義在 DS 的 `core.scss`；要調整手感時改 token 一處，全站一起生效。

### 大小與位置的轉場一定要帶曲線

`width`、`height`、`transform`、`margin`、`grid-template-rows` 這類大小或位置的轉場，一律帶 `var(--ease-enter)`。
不要省略曲線。省略時瀏覽器會用預設的 `ease`。

```scss
// ✅ 用 token
.panel {
  transition: transform 450ms var(--ease-enter);
}
.panel--leaving {
  transition: transform 300ms var(--ease-exit);
}

// ❌ 硬寫曲線數值
.panel {
  transition: transform 450ms cubic-bezier(0.215, 0.61, 0.355, 1);
}

// ❌ 省略曲線（瀏覽器會用預設的 ease）
.section {
  transition: height 300ms;
}
```

### 例外

- 即時跟隨的動畫，例如拖曳時跟著游標移動的指示，可以用 `linear`。
- `0s` 的瞬間切換不套曲線。

## 時長與曲線一覽

<MotionTable />

## 收合／展開

內容區塊的收合與展開，用 CSS Grid 的 `grid-template-rows` 從 `0fr` 轉到 `1fr`，子層設 `overflow: hidden`。

::: danger 不要用 max-height
不要用 `max-height` 做收合動畫。設一個大值（例如 2000px）時，展開看起來像沒有動畫，收合也不是線性的。
:::

### 用 `.ds-collapse`

DS 提供現成的工具 class <ComponentLink id="ds-collapse" />。它是 Component 等級的 300ms，進出場共用 `var(--ease-enter)`。

```html
<div class="ds-collapse" [class.ds-collapse--expanded]="isExpanded">
  <div class="ds-collapse__inner">
    <!-- 可收合的內容 -->
  </div>
</div>
```

- `.ds-collapse`：外殼，負責 `grid-template-rows` 的轉場。
- `.ds-collapse--expanded`：加上就展開，拿掉就收合。
- `.ds-collapse__inner`：內層，設 `overflow: hidden`。

<StoryEmbed id="ds-collapse--interactive" :height="260" title=".ds-collapse 互動範例" />

### 內層不能少

`.ds-collapse__inner` 一定要有。grid 列高的下限預設是內容高度；內層沒有 `overflow: hidden` 時，`0fr` 壓不下去，區塊收不起來。

<StoryEmbed id="ds-collapse--missing-inner" :height="260" title="少了內層就收不起來" />

### 用自己的 class 名稱

元件也可以用自己的 class 名稱，只要沿用同樣的 CSS Grid 做法：

```scss
.contact-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms var(--ease-enter);
}

.contact-content--expanded {
  grid-template-rows: 1fr;
}

.contact-content__inner {
  overflow: hidden;
}
```

## 相關

- [色彩與 token](./tokens)：緩動曲線也列在 token 的「動效緩動」分組
- [浮層怎麼選](./overlays)
- [元件怎麼選](./choosing-components)
