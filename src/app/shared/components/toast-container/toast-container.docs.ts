import type { ComponentDoc } from '../../../../docs/component-doc';

export const toastContainerDoc: ComponentDoc = {
  id: 'toast-container',
  name: 'Toast Container 全域 Toast 容器',
  selector: 'app-toast-container',
  group: '浮層元件',
  summary: '無 @Input / @Output · 資料來自 ToastService.toasts() · 整個 app 只掛一次（app root）· 內部固定以 stackMode 渲染 app-process-toast · z-index 2100',
  when: 'app root 掛一次就好。任何要顯示 toast 的地方呼叫 ToastService.show() / update()，不要自建本地 toast stack——否則會出現兩套堆疊互相遮蓋。唯一例外是 app-global-api-error-host（自有 9999 層）。',
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
  notes: [
    {
      type: 'info',
      content: '本元件沒有任何 @Input / @Output。它只 inject ToastService 並 @for 渲染 toasts()，退場時呼叫 removeById()。',
    },
    {
      type: 'info',
      content: '內部渲染 app-process-toast 時固定帶 [stackMode]="true"（位置交給容器排版）與 [duration]="999999999"（實際時長由 ToastService 的 resolveDuration 決定，不讓子元件自己計時）。',
    },
    {
      type: 'warning',
      content: '容器整體 pointer-events: none，只有帶 action 的 toast 會加 --interactive 才可點。理由：toast 位在卡片右下角，無條件可點會吃掉底下 sticky footer 按鈕數秒的點擊。',
    },
    {
      type: 'info',
      content: 'z-index 2100（2026-08-13 定案），須壓過 doc-preview 與 template-var-panel 的 2000 層。',
    },
  ],
};
