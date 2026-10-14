// 文件網站「基礎」區的頁面（只給 Storybook 用，不在套件對外出口裡）。
// 內容全部來自 src/docs/foundations/ 的說明正本與圖示清單本身，這裡只負責排版。
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { IconComponent } from '../../app/shared/components/icon/icon.component';
import { ICON_REGISTRY } from '../../app/shared/components/icon/icon.registry';
import { DS_TOKENS } from '../foundations/tokens';
import { DS_TYPOGRAPHY } from '../foundations/typography';
import { DS_MOTION } from '../foundations/motion';
import type { TokenEntry } from '../foundation-doc';

const PAGE_STYLES = `
  :host { display: block; padding: 24px 32px 48px; font-family: var(--font-family\\/noto, 'Noto Sans TC', sans-serif); color: #1c1c2e; }
  h1 { font-size: 24px; font-weight: 700; margin: 0 0 8px; }
  h2 { font-size: 18px; font-weight: 600; margin: 32px 0 4px; }
  .lead { color: #686868; margin: 0 0 16px; font-size: 14px; }
  .sub { color: #939393; font-size: 12px; margin: 0 0 12px; }
  code { font-family: 'Roboto Mono', monospace; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e7e7e7; vertical-align: top; }
  th { background: #f6f7f8; font-weight: 600; }
`;

/** 值看起來是顏色才畫色塊（間距、圓角、字級這類只列數值） */
function isColor(t: TokenEntry): boolean {
  return /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(t.value);
}

@Component({
  selector: 'ds-docs-colors-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>色彩與 token</h1>
    <p class="lead">全部定義在 <code>src/styles/core.scss</code>。寫樣式時用 <code>var(token 名稱)</code>，不要寫死色碼。</p>
    @for (g of groups; track g.group) {
      <section [attr.data-testid]="'token-group-' + $index">
        <h2>{{ g.group }}</h2>
        <p class="sub">{{ g.desc }}</p>
        <div class="grid" [class.grid--palette]="g.palette">
          @for (t of g.tokens; track t.name + $index) {
            <div class="token" data-testid="token">
              @if (isColor(t)) {
                <span class="swatch" [style.background]="'var(' + t.name + ')'"></span>
              }
              <code class="name">{{ t.name }}</code>
              <span class="value">{{ t.value }}</span>
              @if (t.desc) { <span class="desc">{{ t.desc }}</span> }
            </div>
          }
        </div>
      </section>
    }
  `,
  styles: [PAGE_STYLES + `
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .grid--palette { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
    .token { display: flex; flex-direction: column; gap: 4px; padding: 10px; border: 1px solid #e7e7e7; border-radius: 8px; min-width: 0; }
    .swatch { height: 40px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.08); }
    .name { word-break: break-all; color: #1c1c2e; }
    .value { font-size: 12px; color: #686868; word-break: break-all; }
    .desc { font-size: 12px; color: #535353; }
  `],
})
export class ColorsPage {
  readonly groups = DS_TOKENS;
  readonly isColor = isColor;
}

@Component({
  selector: 'ds-docs-typography-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>字型</h1>
    <p class="lead">文字樣式一律用下列 class，定義在 <code>src/styles/core.scss</code>。字型檔由使用端載入，見首頁「安裝」。</p>
    @for (f of families; track f.family) {
      <h2>{{ f.family }}</h2>
      <p class="sub">{{ f.role }} · <code>{{ f.cssVar }}</code></p>
      <table>
        <thead><tr><th>class</th><th>字重</th><th>字級</th><th>範例</th></tr></thead>
        <tbody>
          @for (c of f.classes; track c.name) {
            <tr data-testid="type-class">
              <td><code>{{ c.name }}</code></td>
              <td>{{ c.weight }}</td>
              <td>{{ c.size }}@if (c.sizeNote) {<span class="note">（{{ c.sizeNote }}）</span>}</td>
              <td><span [class]="c.name.slice(1)">設計系統 Design System 0123456789</span></td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [PAGE_STYLES + `.note { color: #939393; font-size: 12px; }`],
})
export class TypographyPage {
  readonly families = DS_TYPOGRAPHY;
}

@Component({
  selector: 'ds-docs-motion-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>動效</h1>
    <p class="lead">{{ motion.rule }}</p>
    <h2>時長分級</h2>
    <table>
      <thead><tr><th>分級</th><th>時長</th><th>用在哪裡</th><th>例子</th></tr></thead>
      <tbody>
        @for (t of motion.tiers; track t.name) {
          <tr data-testid="motion-tier">
            <td>{{ t.name }}</td><td><code>{{ t.duration }}</code></td><td>{{ t.desc }}</td><td>{{ t.examples.join('、') }}</td>
          </tr>
        }
      </tbody>
    </table>
    <h2>緩動曲線</h2>
    <table>
      <thead><tr><th>用途</th><th>token</th><th>值</th><th>說明</th></tr></thead>
      <tbody>
        @for (e of easings; track e.token) {
          <tr data-testid="motion-easing">
            <td>{{ e.name }}</td><td><code>{{ e.token }}</code></td><td><code>{{ e.value }}</code></td><td>{{ e.desc }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: [PAGE_STYLES],
})
export class MotionPage {
  readonly motion = DS_MOTION;
  readonly easings = [DS_MOTION.easing.enter, DS_MOTION.easing.exit];
}

@Component({
  selector: 'ds-docs-icons-page',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>圖示</h1>
    <p class="lead">用法：<code>&lt;app-icon name="名稱" size="24"&gt;&lt;/app-icon&gt;</code>。點一下圖示會複製名稱。共 {{ names.length }} 個。</p>
    <input class="search" type="search" placeholder="輸入名稱篩選，例如 arrow" data-testid="icon-search"
      [value]="query()" (input)="query.set($any($event.target).value)" />
    @if (copied()) { <p class="copied" data-testid="icon-copied">已複製：{{ copied() }}</p> }
    <div class="grid">
      @for (n of filtered(); track n) {
        <button type="button" class="icon" data-testid="icon-item" [attr.title]="n" (click)="copy(n)">
          <app-icon [name]="n" size="24"></app-icon>
          <span>{{ n }}</span>
        </button>
      } @empty {
        <p class="sub">沒有符合「{{ query() }}」的圖示。</p>
      }
    </div>
  `,
  styles: [PAGE_STYLES + `
    .search { width: 320px; max-width: 100%; height: 36px; padding: 0 12px; border: 1px solid #d3d3d3; border-radius: 6px; font-size: 14px; margin-bottom: 12px; }
    .copied { color: #426a1c; font-size: 13px; margin: 0 0 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
    .icon { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 6px; background: #fff; border: 1px solid #e7e7e7; border-radius: 8px; cursor: pointer; color: #535353; font: inherit; }
    .icon:hover, .icon:focus-visible { border-color: #3a9ccd; color: #1c1c2e; }
    .icon span { font-size: 11px; word-break: break-all; text-align: center; }
  `],
})
export class IconsPage {
  readonly names = Object.keys(ICON_REGISTRY).sort((a, b) => a.localeCompare(b));
  readonly query = signal('');
  readonly copied = signal('');
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.names.filter((n) => n.toLowerCase().includes(q)) : this.names;
  });

  copy(name: string): void {
    this.copied.set(name);
    navigator.clipboard?.writeText(name).catch(() => undefined);
  }
}
