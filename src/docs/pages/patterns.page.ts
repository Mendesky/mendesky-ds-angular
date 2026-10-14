// 文件網站「互動原則」頁（只給 Storybook 用，不在套件對外出口裡）。內容來自 src/docs/patterns.ts。
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DS_PATTERNS } from '../patterns';
import type { PatternDoc } from '../pattern-doc';

@Component({
  selector: 'ds-docs-patterns-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>互動原則</h1>
    <p class="lead">元件長什麼樣之外，「什麼情境用什麼、為什麼這樣選」。做 DS 沒有的元件、或擴充既有元件前，先查這裡。
      任務碰到關閉、空狀態、錯誤、確認、載入任一類時必查。</p>
    <nav class="toc">
      @for (p of patterns; track p.key) {
        <a [href]="'#pattern-' + p.key" data-testid="pattern-toc">{{ p.value.name }} <code>{{ p.key }}</code></a>
      }
    </nav>
    @for (p of patterns; track p.key) {
      <section class="pattern" [id]="'pattern-' + p.key" data-testid="pattern">
        <h2>{{ p.value.name }} <code>{{ p.key }}</code></h2>
        <p class="principle"><strong>原則：</strong>{{ p.value.principle }}</p>
        <p><strong>什麼時候用：</strong>{{ p.value.when }}</p>

        <h3>情境</h3>
        @for (s of p.value.scenarios; track $index) {
          <div class="scenario">
            <p class="scenario__type"><code>{{ s.type }}</code> {{ s.description }}</p>
            <ul>@for (r of s.rule; track $index) { <li>{{ r }}</li> }</ul>
            <p class="sub">為什麼：{{ s.rationale }}</p>
            @if (s.example) { <p class="sub">例：{{ s.example }}</p> }
          </div>
        }

        @if (p.value.antiPatterns.length) {
          <h3>不要這樣做</h3>
          <ul class="anti">@for (a of p.value.antiPatterns; track $index) { <li>{{ a }}</li> }</ul>
        }

        <h3>無障礙</h3>
        @if (isText(p.value.a11y)) {
          <p>{{ p.value.a11y }}</p>
        } @else {
          @for (entry of a11yEntries(p.value); track entry[0]) {
            <p class="sub"><strong>{{ entry[0] }}</strong></p>
            <ul>@for (x of entry[1]; track $index) { <li>{{ x }}</li> }</ul>
          }
        }

        <p class="related"><strong>相關元件：</strong>
          @for (c of p.value.relatedComponents; track c) { <code>{{ c }}</code> }
        </p>
        @if (p.value.relatedPatterns?.length) {
          <p class="related"><strong>相關原則：</strong>
            @for (r of p.value.relatedPatterns; track r) { <code>{{ r }}</code> }
          </p>
        }
        @if (p.value.references.length) {
          <h3>參考</h3>
          <ul>
            @for (ref of p.value.references; track $index) {
              <li>
                @if (ref.url.startsWith('http')) { <a [href]="ref.url" target="_blank" rel="noopener">{{ ref.source }}</a> } @else { {{ ref.source }} }
                <span class="sub">— {{ ref.note }}</span>
              </li>
            }
          </ul>
        }
      </section>
    }
  `,
  styles: [`
    :host { display: block; padding: 24px 32px 48px; font-family: var(--font-family\\/noto, 'Noto Sans TC', sans-serif); color: #1c1c2e; font-size: 14px; line-height: 1.6; }
    h1 { font-size: 24px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 0 0 8px; }
    h3 { font-size: 15px; margin: 16px 0 6px; }
    code { font-family: 'Roboto Mono', monospace; font-size: 12px; background: #f1f3f5; padding: 1px 4px; border-radius: 4px; margin-right: 4px; }
    .lead { color: #686868; }
    .sub { color: #686868; font-size: 13px; margin: 4px 0; }
    .toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 24px; }
    .toc a { padding: 4px 10px; border: 1px solid #e7e7e7; border-radius: 16px; text-decoration: none; color: #1c1c2e; font-size: 13px; }
    .pattern { padding: 20px 0; border-top: 1px solid #e7e7e7; }
    .principle { background: #f4f9ef; border-left: 4px solid #74ae3e; padding: 8px 12px; border-radius: 4px; }
    .scenario { padding: 8px 12px; margin: 8px 0; background: #f6f7f8; border-radius: 6px; }
    .scenario ul, .anti { margin: 4px 0; padding-left: 20px; }
    .anti li { color: #8a2c2c; }
  `],
})
export class PatternsPage {
  readonly patterns = Object.entries(DS_PATTERNS).map(([key, value]) => ({ key, value }));

  isText(a11y: PatternDoc['a11y']): a11y is string {
    return typeof a11y === 'string';
  }

  a11yEntries(p: PatternDoc): [string, string[]][] {
    return typeof p.a11y === 'string' ? [] : Object.entries(p.a11y);
  }
}
