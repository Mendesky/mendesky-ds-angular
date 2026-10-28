import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, SimpleChange } from '@angular/core';
import { InputComponent } from './input.component';
import { FieldComponent } from '../field/field.component';

describe('InputComponent', () => {
  let fixture: ComponentFixture<InputComponent>;
  let component: InputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('@Output() blur', () => {
    it('失去焦點時 emit 當前空字串（初始值）', () => {
      const emitted: string[] = [];
      component.blur.subscribe(v => emitted.push(v));

      const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('.input-field');
      inputEl.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('');
    });

    it('使用者輸入後失去焦點時 emit 最新字串值', () => {
      const emitted: string[] = [];
      component.blur.subscribe(v => emitted.push(v));

      const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('.input-field');
      inputEl.value = '天母西路 1 號';
      inputEl.dispatchEvent(new Event('input'));
      inputEl.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('天母西路 1 號');
    });

    it('initialValue 設定後失去焦點時 emit 初始字串', () => {
      component.initialValue = '忠孝東路四段';
      component.ngOnChanges({ initialValue: new SimpleChange(null, '忠孝東路四段', false) });
      fixture.detectChanges();

      const emitted: string[] = [];
      component.blur.subscribe(v => emitted.push(v));

      const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('.input-field');
      inputEl.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('忠孝東路四段');
    });

    it('blur 不影響 valueChange — blur 時不觸發 valueChange', () => {
      const valueChangeEmitted: string[] = [];
      component.valueChange.subscribe(v => valueChangeEmitted.push(v));

      const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('.input-field');
      inputEl.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(valueChangeEmitted.length).toBe(0);
    });
  });
});

// ── 報讀名稱與憑證欄位（2026-10-28）──────────────────────────────────────

@Component({
  standalone: true,
  imports: [FieldComponent, InputComponent],
  template: `
    <app-field [label]="label" [required]="required">
      <app-input [ariaLabel]="ariaLabel" placeholder="請輸入帳號"></app-input>
    </app-field>
  `,
})
class FieldHostComponent {
  label = '帳號';
  required = false;
  ariaLabel = '';
}

describe('InputComponent — 報讀名稱', () => {
  let fixture: ComponentFixture<FieldHostComponent>;
  let host: FieldHostComponent;

  const root = () => fixture.nativeElement as HTMLElement;
  const field = () => root().querySelector('input.input-field') as HTMLInputElement;
  /** aria-labelledby 指到的元素文字；沒有 aria-labelledby 時是 null */
  const labelledText = (): string | null => {
    const ids = field().getAttribute('aria-labelledby');
    if (ids === null) return null;
    return ids.split(/\s+/).map(id => root().querySelector(`[id="${id}"]`)?.textContent?.trim() ?? '').join(' ');
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FieldHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FieldHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('放在有標題的 app-field 裡 → 內層 input 的 aria-labelledby 指到標題「帳號」，外框沒有', () => {
    expect(labelledText()).toBe('帳號');
    expect(field().hasAttribute('aria-label')).toBeFalse();
    expect(root().querySelector('app-input')!.hasAttribute('aria-labelledby')).toBeFalse();
  });

  it('同時設 ariaLabel → 只輸出 aria-label，不輸出 aria-labelledby', () => {
    host.ariaLabel = '登入帳號';
    fixture.detectChanges();
    expect(field().getAttribute('aria-label')).toBe('登入帳號');
    expect(field().hasAttribute('aria-labelledby')).toBeFalse();
  });

  it('欄位標題改字 → 名稱跟著變；改成空字串 → aria-labelledby 消失', () => {
    host.label = '甲';
    fixture.detectChanges();
    expect(labelledText()).toBe('甲');

    host.label = '乙';
    fixture.detectChanges();
    expect(labelledText()).toBe('乙');

    host.label = '';
    fixture.detectChanges();
    expect(field().hasAttribute('aria-labelledby')).toBeFalse();
  });

  it('欄位標題一開始是空的、之後才載入 → aria-labelledby 跟著出現', () => {
    host.label = '';
    fixture.detectChanges();
    expect(field().hasAttribute('aria-labelledby')).toBeFalse();

    host.label = '帳號';
    fixture.detectChanges();
    expect(labelledText()).toBe('帳號');
  });

  it('欄位必填 → aria-required="true"；非必填 → 沒有這個屬性', () => {
    expect(field().hasAttribute('aria-required')).toBeFalse();
    host.required = true;
    fixture.detectChanges();
    expect(field().getAttribute('aria-required')).toBe('true');
    host.required = false;
    fixture.detectChanges();
    expect(field().hasAttribute('aria-required')).toBeFalse();
  });

  it('沒有欄位、ariaLabel 只有空白 → aria-label 與 aria-labelledby 都不輸出', () => {
    const solo = TestBed.createComponent(InputComponent);
    solo.componentRef.setInput('ariaLabel', '   ');
    solo.detectChanges();
    const el = (solo.nativeElement as HTMLElement).querySelector('input.input-field')!;
    expect(el.hasAttribute('aria-label')).toBeFalse();
    expect(el.hasAttribute('aria-labelledby')).toBeFalse();
  });
});

/** 自己寫的元件，模板裡用了 app-input（例如 DS 的 app-inline-add） */
@Component({
  selector: 'test-wrapped-input',
  standalone: true,
  imports: [InputComponent],
  template: `<app-input placeholder="輸入後按 Enter"></app-input>`,
})
class WrappedInputComponent {}

@Component({
  standalone: true,
  imports: [FieldComponent, WrappedInputComponent],
  template: `
    <app-field label="前所資訊及更換原因" [required]="true">
      <test-wrapped-input></test-wrapped-input>
    </app-field>
  `,
})
class WrappedHostComponent {}

@Component({
  standalone: true,
  imports: [FieldComponent, InputComponent],
  template: `
    <app-field label="帳號" [required]="true">
      @if (show) {
        <app-input placeholder=""></app-input>
      }
    </app-field>
  `,
})
class ConditionalHostComponent {
  show = true;
}

describe('InputComponent — 欄位標題只連同一個模板裡的輸入框', () => {
  it('不連到外層欄位的標題，也不標必填（只有直接寫在 app-field 裡的才連）', async () => {
    await TestBed.configureTestingModule({ imports: [WrappedHostComponent] }).compileComponents();
    const f = TestBed.createComponent(WrappedHostComponent);
    f.detectChanges();
    const el = (f.nativeElement as HTMLElement).querySelector('input.input-field')!;
    expect(el.hasAttribute('aria-labelledby')).toBeFalse();
    expect(el.hasAttribute('aria-required')).toBeFalse();
  });

  it('寫在同一個模板的 @if 裡 → 照樣連到欄位標題、標必填', async () => {
    await TestBed.configureTestingModule({ imports: [ConditionalHostComponent] }).compileComponents();
    const f = TestBed.createComponent(ConditionalHostComponent);
    f.detectChanges();
    const root = f.nativeElement as HTMLElement;
    const el = root.querySelector('input.input-field')!;
    const title = root.querySelector('#' + el.getAttribute('aria-labelledby'));
    expect(title?.textContent?.trim()).toBe('帳號');
    expect(el.getAttribute('aria-required')).toBe('true');
  });
});

@Component({
  standalone: true,
  imports: [InputComponent],
  template: `<app-input type="password" autocomplete="new-password" name="pw" inputId="pw-1" placeholder="請輸入密碼"
                        (passwordVisibilityChange)="visible.push($event)"></app-input>`,
})
class CredentialHostComponent {
  visible: boolean[] = [];
}

describe('InputComponent — 憑證欄位', () => {
  let fixture: ComponentFixture<CredentialHostComponent>;
  const root = () => fixture.nativeElement as HTMLElement;
  const field = () => root().querySelector('input.input-field') as HTMLInputElement;
  const eye = () => root().querySelector('button.input-eye') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CredentialHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(CredentialHostComponent);
    fixture.detectChanges();
    document.body.appendChild(root());
  });

  afterEach(() => root().remove());

  it('autocomplete、name、inputId 落在內層 input；畫面上 #pw-1 只有一個', () => {
    expect(field().getAttribute('autocomplete')).toBe('new-password');
    expect(field().getAttribute('name')).toBe('pw');
    expect(field().id).toBe('pw-1');
    expect(document.querySelectorAll('#pw-1').length).toBe(1);
  });

  it('inputId 只有空白 → 不輸出 id', () => {
    const solo = TestBed.createComponent(InputComponent);
    solo.componentRef.setInput('inputId', '  ');
    solo.detectChanges();
    expect((solo.nativeElement as HTMLElement).querySelector('input.input-field')!.hasAttribute('id')).toBeFalse();
  });

  it('眼睛按鈕：可用 Tab 移到、名稱「顯示密碼」、aria-pressed 跟著切換', () => {
    expect(eye().getAttribute('tabindex')).not.toBe('-1');
    expect(eye().getAttribute('aria-label')).toBe('顯示密碼');
    expect(eye().getAttribute('aria-pressed')).toBe('false');

    eye().click();
    fixture.detectChanges();
    expect(eye().getAttribute('aria-pressed')).toBe('true');
    expect(field().type).toBe('text');
  });

  it('點眼睛 → passwordVisibilityChange 依序發出 true、false', () => {
    eye().click();
    fixture.detectChanges();
    eye().click();
    fixture.detectChanges();
    expect(fixture.componentInstance.visible).toEqual([true, false]);
    expect(field().type).toBe('password');
  });
});

@Component({
  standalone: true,
  imports: [FieldComponent, InputComponent],
  template: `<app-field label="帳號"><app-input placeholder=""></app-input></app-field>`,
})
class EmptyHintFieldHostComponent {}

describe('InputComponent — 開發警告（沒有報讀名稱）', () => {
  let warn: jasmine.Spy;
  const inputWarnings = () => warn.calls.allArgs().filter(args => String(args[0]).startsWith('[app-input]'));

  beforeEach(async () => {
    warn = spyOn(console, 'warn');
    await TestBed.configureTestingModule({ imports: [InputComponent, EmptyHintFieldHostComponent] }).compileComponents();
  });

  function renderSolo(inputs: Record<string, string>): void {
    const f = TestBed.createComponent(InputComponent);
    for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
    f.detectChanges();
    f.detectChanges();
  }

  it('提示文字空白、沒有其他名稱 → 警告一次', () => {
    renderSolo({ placeholder: '' });
    expect(inputWarnings().length).toBe(1);
  });

  it('提示文字是預設的「Placeholder」→ 警告', () => {
    renderSolo({});
    expect(inputWarnings().length).toBe(1);
  });

  it('提示文字有意義（「請輸入」）→ 不警告', () => {
    renderSolo({ placeholder: '請輸入' });
    expect(inputWarnings().length).toBe(0);
  });

  it('有 ariaLabel → 不警告', () => {
    renderSolo({ placeholder: '', ariaLabel: '登入帳號' });
    expect(inputWarnings().length).toBe(0);
  });

  it('有 inputId（外面有自己的 label for）→ 不警告', () => {
    renderSolo({ placeholder: '', inputId: 'acct' });
    expect(inputWarnings().length).toBe(0);
  });

  it('放在有標題的 app-field 裡（提示文字空白）→ 不警告', () => {
    const f = TestBed.createComponent(EmptyHintFieldHostComponent);
    f.detectChanges();
    expect(inputWarnings().length).toBe(0);
  });

  it('日期輸入框只有提示文字 → 警告（瀏覽器不拿日期欄的提示文字當名稱）', () => {
    renderSolo({ type: 'date', placeholder: '請選擇日期' });
    expect(inputWarnings().length).toBe(1);
  });
});
