import type { ComponentDoc } from '../../../docs/component-doc';

export const portalTeleportDoc: ComponentDoc = {
  id: 'portal-teleport',
  name: 'Portal Teleport 元素外送',
  selector: '[appPortalTeleport]',
  group: '工具',
  description: `把套用此 directive 的元素在 ngOnInit 時 appendChild 到 document.body，在 ngOnDestroy 時移除。
用於「元素必須脫離目前 DOM 位置才能正確顯示」的情境——祖先有 transform、backdrop-filter 或 overflow:hidden 時，position:fixed 會以該祖先為基準或被裁切。`,
  props: [],
  usage: [
    {
      label: '基本用法',
      code: `<div class="my-overlay" appPortalTeleport>
  <!-- 這個 div 會被搬到 document.body 底下 -->
</div>`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: '沒有任何 @Input。純副作用 directive，全長 21 行。',
    },
    {
      type: 'warning',
      content: '元素離開原本的 DOM 位置後，CSS 的後代選擇器（如 .parent .child）與 CSS 變數繼承都會斷掉。樣式要寫成不依賴祖先，或改用全域 class。',
    },
    {
      type: 'warning',
      content: 'ngOnDestroy 只在「元素的 parent 仍是 document.body」時才移除。若中途被別的程式搬走，這個 directive 不會清掉它。',
    },
    {
      type: 'info',
      content: '需要「跟著某個 trigger 定位並追蹤捲動」時不要用這個，用 PortalPositioningService——它除了搬移還會處理定位、翻轉、捲動追蹤與 z-index。本 directive 只負責搬家。',
    },
  ],
};
