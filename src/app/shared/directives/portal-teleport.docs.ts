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
};
