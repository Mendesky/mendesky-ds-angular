import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { CellSelection, cellAround } from '@tiptap/pm/tables';

/**
 * 選單開啟時「整列/整欄操作範圍」高亮的 ProseMirror Decoration plugin。
 *
 * 為什麼是 Decoration 而非 classList：table cell 的 DOM 由 ProseMirror 管理，任何重繪
 * （例如 wrapper 掛的範本變數 autocomplete plugin，在點把手＝editor blur 時會觸發）
 * 會把手動加在 <td>/<th> 上的 class 連同整個 nodeview 替換掉（實測 07-25：class 加了 5 次、
 * 結束卻 0，且無 classList.remove ＝ 節點被替換）。Decoration 由 PM 在每次 render 重新套用，
 * 抹不掉；doc 變動時透過 mapping 保持有效。對應 feedback_richtext_inline_editing_pitfalls。
 *
 * class 名（rte-hl-row / -start / -end、rte-hl-col / -start / -end）與樣式仍由
 * rich-text-editor.component.scss 的 ::ng-deep .ProseMirror table 承接，與 classList 版一致。
 */
export const tableHighlightKey = new PluginKey<DecorationSet>('rteTableHighlight');

export const TableHighlightExtension = Extension.create({
  name: 'rteTableHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: tableHighlightKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(tableHighlightKey) as Decoration[] | null | undefined;
            if (meta !== undefined) {
              // meta = Decoration[]（設定）／null 或 []（清除）
              return Array.isArray(meta) && meta.length
                ? DecorationSet.create(tr.doc, meta)
                : DecorationSet.empty;
            }
            // 無高亮 meta：隨 doc 變動 map，保持既有 decoration 有效
            return old.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return tableHighlightKey.getState(state);
          },
        },
      }),
    ];
  },
});

/**
 * 由 anchor 位置（列/欄任一 cell 的 doc position）算出整列/整欄每個 cell 的 node decoration，
 * 首/尾 cell 加上 -start / -end 端點 class（供 CSS 組外框）。單一 cell：start 與 end 同格 → 四邊皆描。
 * 用 CellSelection.rowSelection / colSelection 取得該列/欄的 cell 集合（矩形表格；forEachCell 依 doc 序，
 * 列＝左至右、欄＝上至下，故 i=0 為首、i=last 為尾）。
 */
export function buildTableHighlightDecorations(
  state: EditorState,
  anchorPos: number,
  dir: 'row' | 'col',
): Decoration[] {
  let $cell: ReturnType<typeof cellAround>;
  try {
    $cell = cellAround(state.doc.resolve(anchorPos));
  } catch {
    return [];
  }
  if (!$cell) return [];

  let sel: CellSelection;
  try {
    sel = dir === 'row'
      ? CellSelection.rowSelection($cell)
      : CellSelection.colSelection($cell);
  } catch {
    return [];
  }

  const cells: { pos: number; size: number }[] = [];
  sel.forEachCell((node, pos) => cells.push({ pos, size: node.nodeSize }));
  if (!cells.length) return [];

  const base = dir === 'row' ? 'rte-hl-row' : 'rte-hl-col';
  const start = dir === 'row' ? 'rte-hl-row-start' : 'rte-hl-col-start';
  const end = dir === 'row' ? 'rte-hl-row-end' : 'rte-hl-col-end';

  return cells.map((c, i) => {
    const cls = [base];
    if (i === 0) cls.push(start);
    if (i === cells.length - 1) cls.push(end);
    return Decoration.node(c.pos, c.pos + c.size, { class: cls.join(' ') });
  });
}
