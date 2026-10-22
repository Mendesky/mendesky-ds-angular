import type { ComponentApi } from '../../../docs/component-doc';

export const portalTeleportDoc: ComponentApi = {
  id: 'portal-teleport',
  selector: '[appPortalTeleport]',
  props: [],
  usage: [
    {
      label: '基本用法',
      code: `<div class="my-overlay" appPortalTeleport>
  <!-- 這個 div 會被搬到 document.body 底下 -->
</div>`,
    },
  ],
  usageNotes: [
    'Angular 版是屬性型 directive appPortalTeleport：沒有任何 @Input，純副作用 directive，全長 21 行。',
    'appPortalTeleport 在 ngOnInit 時把元素 appendChild 到 document.body，在 ngOnDestroy 時移除。',
    {
      type: 'warning',
      content: 'ngOnDestroy 只在「元素的 parent 仍是 document.body」時才移除。若中途被別的程式搬走，appPortalTeleport 不會清掉它。',
    },
    '本體說的「浮層定位服務」在 Angular 是 PortalPositioningService（以 inject(PortalPositioningService) 取得）：需要跟著某個 trigger 定位並追蹤捲動時用它，不用 appPortalTeleport。',
  ],
};
