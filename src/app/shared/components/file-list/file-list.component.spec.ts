import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileListComponent } from './file-list.component';

describe('FileListComponent — 檔名與大小顯示', () => {
  let fixture: ComponentFixture<FileListComponent>;
  let component: FileListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FileListComponent] });
    fixture = TestBed.createComponent(FileListComponent);
    component = fixture.componentInstance;
  });

  const renderedText = (): string =>
    (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('size > 0 → 顯示「檔名 (大小)」', () => {
    component.docs = [{ id: 'd1', name: 'a.pdf', size: 2048, type: '結算申報書' }];
    fixture.detectChanges();
    expect(renderedText()).toContain('a.pdf (2 KB)');
  });

  it('size 為 0（後端列表只回 metadata，無大小）→ 只顯示檔名，不顯示「(0 KB)」', () => {
    component.docs = [{ id: 'd1', name: 'a.pdf', size: 0, type: '結算申報書' }];
    fixture.detectChanges();
    const text = renderedText();
    expect(text).toContain('a.pdf');
    expect(text).not.toContain('KB');
    expect(text).not.toContain('(0');
  });
});

describe('FileListComponent — 預設動作', () => {
  let fixture: ComponentFixture<FileListComponent>;
  let component: FileListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FileListComponent] }).compileComponents();
    fixture = TestBed.createComponent(FileListComponent);
    component = fixture.componentInstance;
  });

  // actions 只看 disabled：可編輯時 view + delete，唯讀時只剩 view。
  // 使用端的多個檔案清單直接依賴這組預設，改之前先查使用端。
  it('預設動作為 view + delete', () => {
    expect(component.actions).toEqual(['view', 'delete']);
  });

  it('disabled 時只剩 view（唯讀）', () => {
    component.disabled = true;
    expect(component.actions).toEqual(['view']);
  });
});
