// 字型與文字樣式 class 的說明（正本）。
// class 本身定義在 src/styles/core.scss；`npm run check:docs` 會比對兩邊是否一致。
// 注意：Figma 設計稿 < 16px 時，實作改用 1em（繼承父層 14px 基礎字號）。
import type { TypographyFamily } from '../foundation-doc';

export const DS_TYPOGRAPHY: TypographyFamily[] = [
  {
    family: 'Noto Sans TC',
    cssVar: '--font-family\\/noto',
    role: '所有文字與一般數字（數字本身等寬）',
    classes: [
      {
        name: '.noto-12-regular',
        weight: 400,
        size: '12px',
        sizeNote: '實作用 1em',
      },
      {
        name: '.noto-12-medium',
        weight: 500,
        size: '12px',
        sizeNote: '實作用 1em',
      },
      {
        name: '.noto-12-bold',
        weight: 700,
        size: '12px',
        sizeNote: '實作用 1em',
      },
      {
        name: '.noto-14-regular',
        weight: 400,
        size: '14px',
      },
      {
        name: '.noto-14-medium',
        weight: 500,
        size: '14px',
      },
      {
        name: '.noto-14-bold',
        weight: 700,
        size: '14px',
      },
      {
        name: '.noto-16-regular',
        weight: 400,
        size: '16px',
      },
      {
        name: '.noto-16-medium',
        weight: 500,
        size: '16px',
      },
      {
        name: '.noto-20-regular',
        weight: 400,
        size: '20px',
      },
      {
        name: '.noto-20-bold',
        weight: 700,
        size: '20px',
      },
      {
        name: '.noto-24-regular',
        weight: 400,
        size: '24px',
      },
      {
        name: '.noto-36-regular',
        weight: 400,
        size: '36px',
      },
      {
        name: '.noto-50-regular',
        weight: 400,
        size: '50px',
      },
      {
        name: '.noto-80-regular',
        weight: 400,
        size: '80px',
      },
    ],
  },
  {
    family: 'Inter（已淘汰）',
    cssVar: '--font-family\\/inter',
    role: '已淘汰（2026-10-05）：Inter 從未被載入；舊名保留並改指 Noto Sans TC，新程式用 noto-*',
    classes: [
      {
        name: '.inter-10-regular',
        weight: 400,
        size: '10px',
      },
      {
        name: '.inter-12-regular',
        weight: 400,
        size: '12px',
        sizeNote: '實作用 1em',
      },
      {
        name: '.inter-12-medium',
        weight: 500,
        size: '12px',
        sizeNote: '實作用 1em',
      },
      {
        name: '.inter-12-bold',
        weight: 700,
        size: '12px',
        sizeNote: '實作用 1em',
      },
      {
        name: '.inter-14-regular',
        weight: 400,
        size: '14px',
      },
      {
        name: '.inter-14-semibold',
        weight: 600,
        size: '14px',
      },
      {
        name: '.inter-18-semibold',
        weight: 600,
        size: '18px',
      },
      {
        name: '.inter-20-bold',
        weight: 700,
        size: '20px',
      },
      {
        name: '.inter-32-semibold',
        weight: 600,
        size: '32px',
      },
      {
        name: '.inter-36-semibold',
        weight: 600,
        size: '36px',
      },
      {
        name: '.inter-40-medium',
        weight: 500,
        size: '40px',
      },
    ],
  },
  {
    family: 'Roboto Mono',
    cssVar: '--font-family\\/mono',
    role: '指定的金額欄位（其他數字用 Noto）',
    classes: [
      {
        name: '.mono-12-medium',
        weight: 500,
        size: '12px',
        sizeNote: '實作用 1em',
      },
      {
        name: '.mono-12-bold',
        weight: 700,
        size: '12px',
        sizeNote: '實作用 1em',
      },
      {
        name: '.mono-14-medium',
        weight: 500,
        size: '14px',
      },
      {
        name: '.mono-14-semibold',
        weight: 600,
        size: '14px',
      },
      {
        name: '.mono-18-bold',
        weight: 700,
        size: '18px',
      },
    ],
  },
];
