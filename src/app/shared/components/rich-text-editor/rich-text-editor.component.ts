import {
  Component, Input, Output, EventEmitter, ElementRef, ViewChild,
  AfterViewInit, OnDestroy, OnChanges, SimpleChanges,
  inject, ChangeDetectorRef, signal,
  ApplicationRef, EnvironmentInjector, createComponent, ComponentRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionMenuComponent } from '../action-menu/action-menu.component';
import { RteTableGripComponent, GripMenuItem } from './table-toolbar/rte-table-grip.component';
import { TableHighlightExtension, tableHighlightKey, buildTableHighlightDecorations } from './table-toolbar/rte-table-highlight.plugin';
import { PortalPositioningService, PortalOverlayRef } from '../../services/portal-positioning.service';
import { Editor, Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CellSelection, selectedRect, isInTable } from '@tiptap/pm/tables';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import MarkdownIt from 'markdown-it';
import { IconBtnComponent } from '../icon-btn/icon-btn.component';
import { IconComponent } from '../icon/icon.component';
import { ProseMirrorJSON } from '../../../features/quoting-cases/models/p4-contract.model';
import {
  docEqualsIgnoringAttrs,
  isExcelHtml,
  extractAndCleanExcelTable,
  isRichHtml,
  isMarkdownLike,
} from './rich-text-editor.helpers';

/** 列把手選單項。不含「刪除整個表格」——太危險易誤觸，改由使用者選取整表後原生刪除。 */
const ROW_GRIP_ITEMS: readonly GripMenuItem[] = [
  { id: 'addAbove', label: '上方插入列', icon: 'UpArrow' },
  { id: 'addBelow', label: '下方插入列', icon: 'DownArrow' },
  { id: 'duplicate', label: '建立複本', icon: 'Copy' },
  { id: 'clear', label: '清除內容', icon: 'Cross' },
  { id: 'deleteRow', label: '刪除此列', icon: 'Trash-Del', dividerBefore: true, danger: true},
];
/** 欄把手選單項。 */
const COL_GRIP_ITEMS: readonly GripMenuItem[] = [
  { id: 'addLeft', label: '左方插入欄', icon: 'LeftArrow' },
  { id: 'addRight', label: '右方插入欄', icon: 'RightArrow' },
  { id: 'duplicate', label: '建立複本', icon: 'Copy' },
  { id: 'clear', label: '清除內容', icon: 'Cross' },
  { id: 'deleteCol', label: '刪除此欄', icon: 'Trash-Del', dividerBefore: true, danger: true},
];

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, IconBtnComponent, IconComponent, ActionMenuComponent],
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.scss'],
})
export class RichTextEditorComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() value: ProseMirrorJSON | null = null;
  @Input() placeholder = '';
  @Input() readOnly = false;
  /** 傳入額外 Tiptap extensions（如 ImageAssetNode、TemplateVariableNode）；Extensions = (Extension|Node|Mark)[] */
  @Input() extraExtensions: Extensions = [];
  /**
   * 比對 docJson 相等時要忽略的 attr key 清單。
   * fee-supplement-editor 傳 ['displayUrl']；一般場景傳 []。
   */
  @Input() ignoredAttrs: string[] = [];
  /**
   * 要隱藏的工具（按鈕 + 對應 extension 一併關閉，快捷鍵/貼上也進不了 schema）。
   * 消費端序列化目標不支援某格式時傳入（如回報問題 → Notion 不支援 underline/color/table）。
   * 建立 editor 時讀取，須於初始化前設定。
   */
  @Input() hiddenTools: ReadonlyArray<'underline' | 'color' | 'table'> = [];
  /**
   * 開啟表格結構編輯：hover（滑鼠）或 tap 進 cell（觸控/鍵盤）時，於列左緣 / 欄上緣浮出把手，
   * 點把手 → 該列/欄增刪選單（Notion 式）。
   * opt-in 預設 false——只有 fee-supplement-editor 傳 true；HDM 客戶狀況卡 / issue-report / 唯讀 view 維持現狀（gate 不外溢）。
   */
  @Input() tableStructureEditing = false;

  @Output() valueChange = new EventEmitter<ProseMirrorJSON>();
  @Output() composedBlur = new EventEmitter<void>();
  /**
   * 剪貼簿貼上含圖片 item 時 emit；wrapper 可攔截並自行處理上傳。
   * emit 後 base 不繼續處理此次 paste 事件。
   */
  @Output() imagePasted = new EventEmitter<File>();

  @ViewChild('editorHost', { static: true }) editorHostRef!: ElementRef<HTMLDivElement>;
  @ViewChild('rootEl', { static: true }) rootElRef!: ElementRef<HTMLDivElement>;

  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private envInjector = inject(EnvironmentInjector);
  private positioning = inject(PortalPositioningService);
  private editorInstance: Editor | null = null;
  private suppressEmit = false;
  private blurTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly md = new MarkdownIt({ html: false, linkify: true });

  // ── 表格結構編輯（Notion 式把手）狀態 ──
  private rowGripRef: ComponentRef<RteTableGripComponent> | null = null;
  private colGripRef: ComponentRef<RteTableGripComponent> | null = null;
  private rowGripOverlay: PortalOverlayRef | null = null;
  private colGripOverlay: PortalOverlayRef | null = null;
  private hoverRowEl: HTMLElement | null = null;
  private hoverColCell: HTMLElement | null = null;
  private gripHideTimer: ReturnType<typeof setTimeout> | null = null;
  /** 任一把手選單開啟中 → 鎖住把手，不被 hover-intent 收（否則滑鼠移向浮出的選單時把手被收、選單秒關）。 */
  private gripMenuOpen = false;
  // ── 選單開啟時：高亮該列/欄的操作範圍（Notion 式整塊外框 + 淡藍底），用 PM Decoration 實作 ──
  /** 當前高亮的方向（守衛：切換把手時，只有「正在高亮的方向」的選單關閉才清，避免關 A 選單誤清剛套上的 B 高亮）。 */
  private highlightedDir: 'row' | 'col' | null = null;

  /** Expose editor to wrapper via @ViewChild */
  getEditor(): Editor | null {
    return this.editorInstance;
  }

  /**
   * 讓 wrapper 執行需要抑制 onUpdate emit 的操作
   * （如 hydrateImageDisplayUrls 呼叫 updateImageNodeAttrs）。
   */
  runSuppressed(fn: () => void): void {
    this.suppressEmit = true;
    try { fn(); } finally { this.suppressEmit = false; }
  }

  isHidden(tool: 'underline' | 'color' | 'table'): boolean {
    return this.hiddenTools.includes(tool);
  }

  ngAfterViewInit(): void {
    this.editorInstance = new Editor({
      element: this.editorHostRef.nativeElement,
      extensions: [
        StarterKit.configure({
          link: false,
          ...(this.isHidden('underline') ? { underline: false } : {}),
        }),
        ...(this.isHidden('table')
          ? []
          : [Table.configure({ resizable: false }), TableRow, TableHeader, TableCell]),
        // 表格結構編輯（fee-supplement）才掛：選單開啟時整列/整欄高亮的 decoration plugin。
        ...(this.tableStructureEditing && !this.isHidden('table') ? [TableHighlightExtension] : []),
        Placeholder.configure({ placeholder: this.placeholder, showOnlyWhenEditable: true }),
        Link.configure({ openOnClick: false, autolink: true }),
        // 文字顏色：Color 依賴 TextStyle mark，TextStyle 必須排在前
        ...(this.isHidden('color') ? [] : [TextStyle, Color]),
        ...this.extraExtensions,
      ],
      content: this.value ?? undefined,
      editable: !this.readOnly,
      editorProps: this.readOnly ? {} : {
        handlePaste: (_view, event) => this.onPaste(event as ClipboardEvent),
      },
      onUpdate: ({ editor }) => {
        if (this.suppressEmit) return;
        this.valueChange.emit(editor.getJSON() as ProseMirrorJSON);
      },
    });

    if (!this.readOnly) {
      this.editorHostRef.nativeElement.addEventListener('drop', this.handleDrop);
    }

    // 表格結構編輯：opt-in + 可編輯 + table extension 有掛載時，掛把手觸發。
    // - mousemove/mouseleave：滑鼠 hover 驅動（桌面）
    // - selectionUpdate：tap 進 cell / 鍵盤移動選區驅動（觸控裝置無 hover，靠此顯示把手）
    if (this.tableStructureEditing && !this.readOnly && !this.isHidden('table')) {
      const host = this.editorHostRef.nativeElement;
      host.addEventListener('mousemove', this.onTableMouseMove);
      host.addEventListener('mouseleave', this.onTableMouseLeave);
      this.editorInstance.on('selectionUpdate', this.onSelectionInTable);
    }

    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.editorInstance) return;

    const valueChanged = !!changes['value'];

    if (valueChanged) {
      const next = this.value ?? { type: 'doc', content: [] };
      const current = this.editorInstance.getJSON() as ProseMirrorJSON;
      if (!docEqualsIgnoringAttrs(next, current, this.ignoredAttrs)) {
        this.detachGrips(); // 重建 DOM 會銷毀 tr/cell，把手錨點失效 → 先卸載，重新 hover/selection 再掛
        this.suppressEmit = true;
        try {
          this.editorInstance.commands.setContent(next, { emitUpdate: false });
        } finally {
          this.suppressEmit = false;
        }
      }
    }
  }

  /**
   * 供 wrapper 在 readOnly 模式下強制重渲染 NodeView（如 templateVars / assets 變化時）。
   * wrapper 的 ngOnChanges 偵測到 varsOrAssetsChanged 時呼叫。
   */
  forceSetContent(docJson: ProseMirrorJSON | null): void {
    if (!this.editorInstance) return;
    const next = docJson ?? { type: 'doc', content: [] };
    this.detachGrips(); // clear→setContent 重建 NodeView，把手錨點失效
    this.suppressEmit = true;
    try {
      // 先清空再設回：atom NodeView（如 templateVariable chip）在新舊 node `eq`（同 type + attrs）時，
      // ProseMirror 會重用既有 NodeView、**不呼叫 update()** → chip 顯示值（來自外部 templateVars 的 lazy
      // closure）不會刷新。清空迫使 NodeView 銷毀，再設回時以最新 templateVars 重建，chip 文字才更新。
      this.editorInstance.commands.setContent({ type: 'doc', content: [] }, { emitUpdate: false });
      this.editorInstance.commands.setContent(next, { emitUpdate: false });
    } finally {
      this.suppressEmit = false;
    }
  }

  ngOnDestroy(): void {
    if (this.blurTimer) clearTimeout(this.blurTimer);
    this.detachGrips();
    if (!this.readOnly) {
      this.editorHostRef?.nativeElement?.removeEventListener('drop', this.handleDrop);
      if (this.tableStructureEditing && !this.isHidden('table')) {
        this.editorHostRef?.nativeElement?.removeEventListener('mousemove', this.onTableMouseMove);
        this.editorHostRef?.nativeElement?.removeEventListener('mouseleave', this.onTableMouseLeave);
      }
    }
    this.editorInstance?.destroy(); // 同時清除 selectionUpdate listener
    this.editorInstance = null;
  }

  onRootFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const root = this.rootElRef.nativeElement;
    if (next && root.contains(next)) return;
    if (this.blurTimer) clearTimeout(this.blurTimer);
    this.blurTimer = setTimeout(() => {
      const active = document.activeElement;
      if (active && root.contains(active)) return;
      this.composedBlur.emit();
    }, 0);
  }

  // ── Toolbar actions ──
  toggleBold(): void { this.editorInstance?.chain().focus().toggleBold().run(); }
  toggleItalic(): void { this.editorInstance?.chain().focus().toggleItalic().run(); }
  toggleUnderline(): void { this.editorInstance?.chain().focus().toggleUnderline().run(); }
  toggleStrike(): void { this.editorInstance?.chain().focus().toggleStrike().run(); }
  toggleHeading(): void { this.editorInstance?.chain().focus().toggleHeading({ level: 3 }).run(); }
  toggleBulletList(): void { this.editorInstance?.chain().focus().toggleBulletList().run(); }
  toggleOrderedList(): void { this.editorInstance?.chain().focus().toggleOrderedList().run(); }
  isActive(name: string): boolean { return this.editorInstance?.isActive(name) ?? false; }
  insertTable(): void {
    if (this.isHidden('table')) return; // extension 未掛載，chain 上無 insertTable 指令
    this.editorInstance?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  // ── 表格結構編輯（tableStructureEditing；Notion 式 hover / tap 把手）──

  /** mousemove（桌面 hover）：偵測 hover 的 cell，於其列/欄邊緣顯示把手。不在 cell 時延遲收（除非選單開）。 */
  private onTableMouseMove = (e: MouseEvent): void => {
    const cell = (e.target as HTMLElement | null)?.closest('td, th') as HTMLElement | null;
    if (!cell) { this.scheduleGripHide(); return; }
    this.showGripsForCell(cell);
  };

  /** 離開 editor：延遲收把手（hover-intent），讓滑鼠來得及移到浮出的把手/選單（把手 mouseenter 與選單開啟會取消收起）。 */
  private onTableMouseLeave = (): void => { this.scheduleGripHide(); };

  /** selectionUpdate（觸控 tap / 鍵盤）：選區進 table cell → 顯示該 cell 列/欄把手；離開 table → 延遲收。 */
  private onSelectionInTable = (): void => {
    const editor = this.editorInstance;
    if (!editor) return;
    if (!editor.isActive('table')) { this.scheduleGripHide(); return; }
    const dom = editor.view.domAtPos(editor.state.selection.$from.pos);
    const el = dom.node.nodeType === Node.ELEMENT_NODE ? (dom.node as HTMLElement) : dom.node.parentElement;
    const cell = el?.closest('td, th') as HTMLElement | null;
    if (cell) this.showGripsForCell(cell);
  };

  /** 依 cell 定位列把手（anchor tr, left）與欄把手（anchor 首列該欄 cell, top）；只在列/欄改變時重掛。 */
  private showGripsForCell(cell: HTMLElement): void {
    // 選單開啟中：凍結把手——勿因游標移過其他列/欄的 cell 而重指把手或重設選單項
    // （否則點表頭列開選單後往下移，選單項會被換成非表頭列的完整版、冒出本不該有的「上方插入列」）。
    if (this.gripMenuOpen) return;
    this.cancelGripHide();
    const tr = cell.closest('tr') as HTMLElement | null;
    const table = cell.closest('table') as HTMLElement | null;
    if (!tr || !table) return;
    const colIndex = Array.from(tr.children).indexOf(cell);
    const colCell = (table.querySelector('tr')?.children[colIndex] as HTMLElement | null) ?? null;
    if (tr !== this.hoverRowEl) { this.hoverRowEl = tr; this.mountGrip('row', tr); }
    if (colCell && colCell !== this.hoverColCell) { this.hoverColCell = colCell; this.mountGrip('col', colCell); }
  }

  private scheduleGripHide = (): void => {
    this.cancelGripHide();
    this.gripHideTimer = setTimeout(() => {
      if (this.gripMenuOpen) return; // 選單開啟中 → 不收（使用者正在操作選單）
      this.detachGrips();
    }, 250);
  };
  private cancelGripHide = (): void => {
    if (this.gripHideTimer) { clearTimeout(this.gripHideTimer); this.gripHideTimer = null; }
  };

  /** 掛載/重定位 列把手（anchor tr, placement left）或 欄把手（anchor 首列該欄 cell, placement top）。 */
  private mountGrip(dir: 'row' | 'col', anchorEl: HTMLElement): void {
    const isRow = dir === 'row';
    // 表頭列（第一列）不提供「上方插入列」——已在最上、往上插無意義（對齊 Notion）。
    let items: readonly GripMenuItem[] = isRow ? ROW_GRIP_ITEMS : COL_GRIP_ITEMS;
    if (isRow && anchorEl.closest('table')?.querySelector('tr') === anchorEl) {
      items = ROW_GRIP_ITEMS.filter(i => i.id !== 'addAbove');
    }
    let ref = isRow ? this.rowGripRef : this.colGripRef;
    if (!ref) {
      ref = createComponent(RteTableGripComponent, { environmentInjector: this.envInjector });
      ref.setInput('direction', dir);
      ref.instance.pick.subscribe((id: string) => this.onGripPick(dir, id));
      // 選單開啟時鎖住把手：滑鼠移向浮出選單會離開把手 button，若照常 hover-intent 收把手，選單會被連帶銷毀而秒關。
      // 同時：選單開 → 高亮該列/欄操作範圍；選單關 → 清高亮（方向守衛：切換把手時勿誤清另一方向剛套上的高亮）。
      ref.instance.menuStateChange.subscribe((open: boolean) => {
        this.gripMenuOpen = open;
        if (open) {
          this.cancelGripHide();
          this.highlightScope(dir);
        } else if (this.highlightedDir === dir) {
          this.clearHighlight();
        }
      });
      const el = ref.location.nativeElement as HTMLElement;
      el.addEventListener('mouseenter', this.cancelGripHide);
      el.addEventListener('mouseleave', this.scheduleGripHide);
      this.appRef.attachView(ref.hostView);
      document.body.appendChild(el);
      if (isRow) this.rowGripRef = ref; else this.colGripRef = ref;
    }
    ref.setInput('items', items);              // 每次依「當前列是否表頭」更新選單
    ref.changeDetectorRef.detectChanges();     // zone 外 + items 變更須手動 render
    // 重定位到新的列/欄
    (isRow ? this.rowGripOverlay : this.colGripOverlay)?.detach();
    const panelRef = new ElementRef(ref.location.nativeElement as HTMLElement);
    const overlay = this.positioning.attach(new ElementRef(anchorEl), panelRef, {
      placement: isRow ? 'left' : 'top',
      gap: 4,
      trackScroll: true,
      scrollContainerStrategy: 'document',
      closeOnClickOutside: false, // 收起由 hover-intent / selection 驅動
      closeOnEscape: false,
    });
    if (isRow) this.rowGripOverlay = overlay; else this.colGripOverlay = overlay;
  }

  /** 點把手選單項：先把 selection 移到該列/欄的 cell（TipTap 指令作用於選區所在 cell），再執行指令。 */
  private onGripPick(dir: 'row' | 'col', id: string): void {
    const editor = this.editorInstance;
    if (!editor) return;
    const anchorCell = dir === 'row'
      ? (this.hoverRowEl?.querySelector('td, th') as HTMLElement | null)
      : this.hoverColCell;
    if (anchorCell) {
      try {
        const pos = editor.view.posAtDOM(anchorCell, 0);
        editor.chain().focus().setTextSelection(pos + 1).run();
      } catch { /* posAtDOM 失敗 → 沿用當前選區 */ }
    }
    switch (id) {
      case 'addAbove': this.addRowBefore(); break;
      case 'addBelow': this.addRowAfter(); break;
      case 'deleteRow': this.deleteRow(); break;
      case 'addLeft': this.addColumnBefore(); break;
      case 'addRight': this.addColumnAfter(); break;
      case 'duplicate': dir === 'row' ? this.duplicateRow() : this.duplicateColumn(); break;
      case 'clear': dir === 'row' ? this.clearRow() : this.clearColumn(); break;
      case 'deleteCol': this.deleteColumn(); break;
      case 'deleteTable': this.deleteTable(); break;
    }
    this.detachGrips(); // DOM 結構已變，重置把手（下次 hover/selection 重掛）
  }

  /** 卸載列/欄把手（hover 離開 / selection 離開 / setContent 重建 / 指令後 / 元件銷毀）。 */
  private detachGrips(): void {
    this.cancelGripHide();
    this.clearHighlight();
    this.gripMenuOpen = false;
    this.hoverRowEl = null;
    this.hoverColCell = null;
    const refs = [this.rowGripRef, this.colGripRef];
    const overlays = [this.rowGripOverlay, this.colGripOverlay];
    this.rowGripRef = null;
    this.colGripRef = null;
    this.rowGripOverlay = null;
    this.colGripOverlay = null;
    overlays.forEach(o => o?.detach());
    refs.forEach(r => { if (r) { this.appRef.detachView(r.hostView); r.destroy(); } });
  }

  // ── 選單開啟時高亮該列/欄的操作範圍（Notion 式整塊外框 + 淡藍底）──
  // 用 ProseMirror Decoration（非 classList）：table cell DOM 由 PM 管理，feeSupplement 的
  // autocomplete plugin 在點把手（editor blur）時會觸發重繪、把手動加的 classList 連 nodeview 一起替換掉
  // （07-25 實測：class 加了 5 次結束卻 0、且無 classList.remove ＝節點被換）。Decoration 由 PM 每次
  // render 重新套用，抹不掉；透過 setMeta 派送、不動 doc（docChanged=false → 不 emit valueChange）。
  // class 名與樣式仍由 ::ng-deep .ProseMirror table 承接，與先前一致。詳見 rte-table-highlight.plugin.ts。

  /** 高亮指定方向的整列/整欄：由 hover 錨點 cell 取 doc position → 算 decoration → setMeta 派送到 plugin。 */
  private highlightScope(dir: 'row' | 'col'): void {
    const editor = this.editorInstance;
    if (!editor) return;
    const anchorEl = dir === 'row'
      ? (this.hoverRowEl?.querySelector('td, th') as HTMLElement | null)
      : this.hoverColCell;
    if (!anchorEl) { this.clearHighlight(); return; }
    let pos: number;
    try { pos = editor.view.posAtDOM(anchorEl, 0); } catch { this.clearHighlight(); return; }
    const decos = buildTableHighlightDecorations(editor.state, pos, dir);
    editor.view.dispatch(editor.state.tr.setMeta(tableHighlightKey, decos));
    this.highlightedDir = dir;
  }

  /** 清除高亮（choke-point：選單關 / detachGrips 皆呼叫）。派空 decoration；highlightedDir null 時無事可清直接返回。 */
  private clearHighlight(): void {
    if (this.highlightedDir === null) return; // 無高亮 → 免派空 transaction，避免多餘重繪
    const editor = this.editorInstance;
    if (editor && !editor.isDestroyed) {
      editor.view.dispatch(editor.state.tr.setMeta(tableHighlightKey, null));
    }
    this.highlightedDir = null;
  }

  /** 7 個結構指令對應 TipTap Table extension；只作用於選區所在整行/整列（維持矩形）。
   *  isHidden('table') 時 extension 未掛載、chain 無此指令，直接 return（比照 insertTable）。 */
  addRowBefore(): void { if (this.isHidden('table')) return; this.editorInstance?.chain().focus().addRowBefore().run(); }
  addRowAfter(): void { if (this.isHidden('table')) return; this.editorInstance?.chain().focus().addRowAfter().run(); }
  deleteRow(): void { if (this.isHidden('table')) return; this.editorInstance?.chain().focus().deleteRow().run(); }
  addColumnBefore(): void { if (this.isHidden('table')) return; this.editorInstance?.chain().focus().addColumnBefore().run(); }
  addColumnAfter(): void { if (this.isHidden('table')) return; this.editorInstance?.chain().focus().addColumnAfter().run(); }
  deleteColumn(): void { if (this.isHidden('table')) return; this.editorInstance?.chain().focus().deleteColumn().run(); }
  deleteTable(): void { if (this.isHidden('table')) return; this.editorInstance?.chain().focus().deleteTable().run(); }

  /**
   * 清除當前列所有 cell 內容、保留 cell 結構（cell 變空 paragraph）。
   * 以 CellSelection.rowSelection 選整列 → deleteSelection（對 CellSelection 只清內容、不刪 cell）。
   * 純前端 ProseMirror；chain 派送觸發 onUpdate → valueChange emit。
   */
  clearRow(): void {
    if (this.isHidden('table')) return;
    this.editorInstance?.chain().focus().command(({ tr, state, dispatch }) => {
      if (!isInTable(state)) return false;
      const rect = selectedRect(state);
      const cellOffset = rect.map.map[rect.top * rect.map.width];   // 該列第一個 cell
      const $cell = state.doc.resolve(rect.tableStart + cellOffset);
      if (dispatch) { tr.setSelection(CellSelection.rowSelection($cell)); tr.deleteSelection(); }
      return true;
    }).run();
  }

  /** 清除當前欄所有 cell 內容、保留結構。以 CellSelection.colSelection 選整欄 → deleteSelection。 */
  clearColumn(): void {
    if (this.isHidden('table')) return;
    this.editorInstance?.chain().focus().command(({ tr, state, dispatch }) => {
      if (!isInTable(state)) return false;
      const rect = selectedRect(state);
      const cellOffset = rect.map.map[rect.left];                   // 第一列該欄的 cell
      const $cell = state.doc.resolve(rect.tableStart + cellOffset);
      if (dispatch) { tr.setSelection(CellSelection.colSelection($cell)); tr.deleteSelection(); }
      return true;
    }).run();
  }

  /**
   * 複製當前列（含 cell 內容/格式）插到其下方 → 列數 +1。
   * 列是單一 tableRow node，直接 copy 後 insert 到該列結束位置。
   */
  duplicateRow(): void {
    if (this.isHidden('table')) return;
    this.editorInstance?.chain().focus().command(({ tr, state, dispatch }) => {
      if (!isInTable(state)) return false;
      const rect = selectedRect(state);
      const { table, tableStart } = rect;
      const rowIndex = rect.top;
      let pos = tableStart;
      for (let i = 0; i < rowIndex; i++) pos += table.child(i).nodeSize;
      const rowNode = table.child(rowIndex);
      if (dispatch) tr.insert(pos + rowNode.nodeSize, rowNode.copy(rowNode.content));
      return true;
    }).run();
  }

  /**
   * 複製當前欄插到其右方 → 每列 cell 數 +1。
   * 欄無單一 node：用 TableMap 對每列取該欄 cell 複製，從文件後方（底列）往前插入避免 pos 位移；
   * seen 去重防 rowspan cell 在多列共用同一 offset 時重複插入。
   */
  duplicateColumn(): void {
    if (this.isHidden('table')) return;
    this.editorInstance?.chain().focus().command(({ tr, state, dispatch }) => {
      if (!isInTable(state)) return false;
      const rect = selectedRect(state);
      const { table, tableStart, map } = rect;
      const col = rect.left;
      if (dispatch) {
        const seen = new Set<number>();
        for (let r = map.height - 1; r >= 0; r--) {
          const cellOffset = map.map[r * map.width + col];
          if (seen.has(cellOffset)) continue;                      // rowspan cell 只複製一次
          seen.add(cellOffset);
          const cell = table.nodeAt(cellOffset);
          if (!cell) continue;
          tr.insert(tableStart + cellOffset + cell.nodeSize, cell.copy(cell.content));
        }
      }
      return true;
    }).run();
  }

  // ── 文字顏色 ──
  /**
   * 固定色票，沿用舊前端 markdown-textarea 的 7 色（來源：Frontend repo
   * component/markdown-textarea presetColors）；hex=null 為「預設（清除顏色）」。
   * 顏色以 inline style 序列化，前端檢視 / 後端 PDF 皆吃 inline style，故色盤可自由增減、不影響契約。
   */
  readonly TEXT_COLORS: ReadonlyArray<{ label: string; hex: string | null }> = [
    { label: '預設', hex: null },
    { label: '紅', hex: '#E53E3E' },
    { label: '橘', hex: '#DD6B20' },
    { label: '黃', hex: '#D4A017' },
    { label: '綠', hex: '#38A169' },
    { label: '藍', hex: '#2980AB' },
    { label: '紫', hex: '#805AD5' },
    { label: '灰', hex: '#718096' },
  ];
  readonly colorMenuOpen = signal(false);

  openColorMenu(): void { this.colorMenuOpen.set(true); }
  closeColorMenu(): void { this.colorMenuOpen.set(false); }

  /** 點色塊：有 hex 套色、無 hex 清除；關閉交由 action-menu 的 closeMenu 處理 */
  selectColor(c: { hex: string | null }): void {
    if (c.hex) this.applyColor(c.hex);
    else this.clearColor();
  }

  applyColor(hex: string): void { this.editorInstance?.chain().focus().setColor(hex).run(); }
  clearColor(): void { this.editorInstance?.chain().focus().unsetColor().run(); }

  // ── Paste & Drop ──

  private onPaste(e: ClipboardEvent): boolean {
    const data = e.clipboardData;
    if (!data) return false;

    const htmlData = data.getData('text/html');
    const textData = data.getData('text/plain');

    if (htmlData && isExcelHtml(htmlData)) {
      const tableHtml = extractAndCleanExcelTable(htmlData);
      if (tableHtml) this.editorInstance?.commands.insertContent(tableHtml);
      return true;
    }

    const items = data.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          this.imagePasted.emit(file);
          return true;
        }
      }
    }

    if (!isRichHtml(htmlData) && textData && isMarkdownLike(textData)) {
      const html = this.md.render(textData);
      this.editorInstance?.commands.insertContent(html);
      return true;
    }

    return false;
  }

  private handleDrop = (event: Event): void => {
    const e = event as DragEvent;
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        e.preventDefault();
        this.imagePasted.emit(files[i]);
        return;
      }
    }
  };
}
