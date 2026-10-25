import type { ComponentApi } from '../../../../docs/component-doc';

export const toastContainerDoc: ComponentApi = {
  id: 'toast-container',
  selector: 'app-toast-container',
  summary: '無 @Input / @Output · 資料來自 ToastService.toasts() · 整個 app 只掛一次（app root）· 內部固定以 stackMode 渲染 app-process-toast · z-index 2100',
  props: [],
  usage: [
    {
      label: 'app root 掛載（只需一次）',
      code: `<!-- app.component.html -->
<router-outlet />
<app-toast-container />`,
    },
    {
      label: '呼叫端',
      code: `// 不直接用這個元件，透過 service
private readonly toast = inject(ToastService);

this.toast.show({ type: 'success', message: '已儲存' });`,
    },
  ],
  usageNotes: [
    '本體說的「toast 服務」在 Angular 是 ToastService：以 inject(ToastService) 取得後呼叫 show() / update()。',
    'app-toast-container 沒有任何 @Input / @Output；資料來自 ToastService 的 toasts()。',
  ],
};
