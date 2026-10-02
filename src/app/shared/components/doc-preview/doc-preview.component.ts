import {
  Component, Input, Output, EventEmitter,
  OnInit, AfterViewInit, OnDestroy, HostListener, signal, computed, inject, ElementRef,
 ChangeDetectionStrategy, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { IconBtnComponent } from '../icon-btn/icon-btn.component';
import { ModalStackService } from '../../../core/services/modal-stack.service';
import * as pdfjsLib from 'pdfjs-dist';
import { loadPdfDocument } from '../../utils/pdf-render.util';

// Promise.try polyfill for pdfjs-dist v5 (TC39 Stage 2, not yet in all browsers)
if (!(Promise as unknown as Record<string, unknown>)['try']) {
  (Promise as unknown as Record<string, unknown>)['try'] = function <T>(fn: () => T) {
    return new Promise<T>(resolve => resolve(fn()));
  };
}

pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.js';

export interface DocPreviewItem {
  name: string;
  url: string;
  mimeType?: string;
}

@Component({
  selector: 'app-doc-preview',
  standalone: true,
  imports: [CommonModule, IconComponent, IconBtnComponent],
  templateUrl: './doc-preview.component.html',
  styleUrls: ['./doc-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocPreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) docs: DocPreviewItem[] = [];
  @Input() startIndex = 0;
  @Output() closed = new EventEmitter<void>();

  private el = inject(ElementRef);
  private modalStack = inject(ModalStackService);
  private readonly modalId = `doc-preview-${Math.random().toString(36).slice(2)}`;

  currentIndex = signal(0);
  isLoading = signal(false);
  renderError = signal(false);
  // null = 待 render（顯示 skeleton），'' = 失敗（顯示 error card），非空字串 = 圖片 data URL
  imageBase64s = signal<(string | null)[]>([]);

  currentDoc = computed(() => this.docs[this.currentIndex()]);
  isSingle = computed(() => this.docs.length <= 1);
  isFirst = computed(() => this.currentIndex() === 0);
  isLast = computed(() => this.currentIndex() === this.docs.length - 1);

  isPdf = computed(() => {
    const doc = this.currentDoc();
    if (!doc) return false;
    if (doc.mimeType) return doc.mimeType === 'application/pdf';
    return doc.name.toLowerCase().endsWith('.pdf');
  });

  private static readonly BATCH_SIZE = 10;
  private pdfCache = new Map<string, pdfjsLib.PDFDocumentProxy>();
  private currentRenderUrl: string | null = null;
  private currentRenderTasks: pdfjsLib.RenderTask[] = [];

  ngOnInit(): void {
    this.modalStack.register(this.modalId);
    const clamped = Math.max(0, Math.min(this.startIndex, this.docs.length - 1));
    this.currentIndex.set(clamped);
    this.triggerLoad();
  }

  ngAfterViewInit(): void {
    document.body.appendChild(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.modalStack.unregister(this.modalId);
    this.cancelPendingRenders();
    if (document.body.contains(this.el.nativeElement)) {
      document.body.removeChild(this.el.nativeElement);
    }
    this.pdfCache.forEach(doc => doc.destroy());
    this.pdfCache.clear();
  }

  prev(): void {
    if (this.isFirst()) return;
    this.currentIndex.update(i => i - 1);
    this.triggerLoad();
  }

  next(): void {
    if (this.isLast()) return;
    this.currentIndex.update(i => i + 1);
    this.triggerLoad();
  }

  private triggerLoad(): void {
    if (!this.isPdf()) {
      this.imageBase64s.set([]);
      this.currentRenderUrl = null;
      this.cancelPendingRenders();
      return;
    }
    const doc = this.currentDoc();
    if (!doc) return;
    void this.loadPdfImages(doc.url);
  }

  download(): void {
    const doc = this.currentDoc();
    if (!doc) return;
    const a = document.createElement('a');
    a.href = doc.url;
    a.download = doc.name;
    a.click();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('doc-preview-overlay')) {
      this.closed.emit();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':    this.closed.emit(); break;
      case 'ArrowLeft': this.prev(); break;
      case 'ArrowRight': this.next(); break;
    }
  }

  private async loadPdfImages(url: string): Promise<void> {
    // 切換文件時立刻中止前一份正在跑的 renderTask，釋放 pdfjs worker
    this.cancelPendingRenders();

    this.currentRenderUrl = url;
    this.isLoading.set(true);
    this.renderError.set(false);
    this.imageBase64s.set([]);

    try {
      let pdfDoc = this.pdfCache.get(url);
      if (!pdfDoc) {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        pdfDoc = await loadPdfDocument(buffer);
        this.pdfCache.set(url, pdfDoc);
      }

      if (this.currentRenderUrl !== url) return;

      const total = pdfDoc.numPages;
      // null = 尚未 render（template 顯示 per-page skeleton），'' = 失敗，string = 圖片
      this.imageBase64s.set(new Array(total).fill(null));
      // 取得 numPages 後全域 isLoading 關掉，改由 per-page skeleton 主導
      this.isLoading.set(false);

      const BATCH = DocPreviewComponent.BATCH_SIZE;
      for (let start = 0; start < total; start += BATCH) {
        if (this.currentRenderUrl !== url) return;

        const pageNums = Array.from(
          { length: Math.min(BATCH, total - start) },
          (_, i) => start + i + 1,
        );
        const batchImages = await Promise.all(
          pageNums.map(pageNum => this.renderPage(pdfDoc!, pageNum, url)),
        );

        if (this.currentRenderUrl !== url) return;

        this.imageBase64s.update(prev => {
          const next = [...prev];
          pageNums.forEach((pageNum, i) => { next[pageNum - 1] = batchImages[i]; });
          return next;
        });
      }
    } catch {
      if (this.currentRenderUrl === url) this.renderError.set(true);
    } finally {
      if (this.currentRenderUrl === url) this.isLoading.set(false);
    }
  }

  private cancelPendingRenders(): void {
    this.currentRenderTasks.forEach(task => {
      try { task.cancel(); } catch { /* pdfjs 可能丟例外，吞掉 */ }
    });
    this.currentRenderTasks = [];
  }

  private async renderPage(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    expectedUrl: string,
  ): Promise<string> {
    if (this.currentRenderUrl !== expectedUrl) return '';
    try {
      const page = await pdfDoc.getPage(pageNum);
      if (this.currentRenderUrl !== expectedUrl) return '';

      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d')!;

      // pdfjs v5 render promise can hang forever on certain XObject structures
      const renderTask = page.render({ canvasContext: ctx, viewport });
      this.currentRenderTasks.push(renderTask);
      const timeoutId = setTimeout(() => renderTask.cancel(), 15000);
      try {
        await renderTask.promise;
      } finally {
        clearTimeout(timeoutId);
        this.currentRenderTasks = this.currentRenderTasks.filter(t => t !== renderTask);
      }
      return canvas.toDataURL('image/jpeg');
    } catch {
      return '';
    }
  }
}
