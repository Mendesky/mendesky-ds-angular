// 動效規範（正本）。
// tiers 只定義「時長分級」，不提供 CSS utility class：時長直接寫毫秒值，
// 緩動一律用 easing 的 var(--ease-enter) / var(--ease-exit) token。
// 原有的 cssClass 欄位從未被任何一方使用，2026-08-14 拍板移除；要新增便利 class 需先重新立契約。
import type { MotionDoc } from '../foundation-doc';

export const DS_MOTION: MotionDoc = {
  tiers: [
    {
      name: 'Micro',
      duration: '150ms',
      desc: 'hover · focus · toggle · checkbox · icon 旋轉',
      examples: [
        'button hover',
        'checkbox check',
        'icon spin',
        'focus ring',
      ],
    },
    {
      name: 'Component',
      duration: '300ms',
      desc: '原子元件：toast · tooltip · dropdown · 小 modal',
      examples: [
        'toast appear',
        'tooltip show',
        'dropdown open',
        'small modal',
      ],
    },
    {
      name: 'Panel',
      duration: '450ms',
      desc: '面板元件：drawer · sidebar · 大型 modal',
      examples: [
        'drawer slide',
        'sidebar expand',
        'large modal',
      ],
    },
    {
      name: 'Page',
      duration: '600ms',
      desc: '頁面轉場 · onboarding · 複雜多步驟動畫',
      examples: [
        'page transition',
        'onboarding flow',
        'multi-step wizard',
      ],
    },
  ],
  easing: {
    enter: {
      name: 'Enter（減速進場）',
      value: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      token: 'var(--ease-enter)',
      desc: '元素進場與大小／位置位移時，起步略緩、收尾平滑停下（easeOutCubic），比舊 (0,0,0.2,1) 起步更柔，layout 位移更不生硬',
    },
    exit: {
      name: 'Exit（加速離場）',
      value: 'cubic-bezier(0.4, 0, 1, 1)',
      token: 'var(--ease-exit)',
      desc: '元素離場時從緩慢開始到快速消失，感覺「果斷離開」',
    },
  },
  rule: 'Enter 動畫用 enter easing；Exit 動畫用 exit easing。Micro tier 兩者皆可用 ease-out。一律以 token var(--ease-enter)/var(--ease-exit) 套用（定義於 src/styles/core.scss :root），禁止硬寫 cubic-bezier 數值；size/位置 transition 一律帶 var(--ease-enter)。',
};
