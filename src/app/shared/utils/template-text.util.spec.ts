import { renderTemplateAsText } from './template-text.util';

describe('renderTemplateAsText', () => {
  it('不做任何 key 改名：%oldKey% 只用同名的值替換', () => {
    expect(renderTemplateAsText('附上 %oldKey%', { newKey: '新值' }))
      .toBe('附上 [oldKey]');
  });

  it('應將存在的變數替換為實際值', () => {
    expect(renderTemplateAsText('名稱：%name%', { name: '範例' }))
      .toBe('名稱：範例');
  });

  it('變數不存在時顯示 [key] 預設值', () => {
    expect(renderTemplateAsText('%MonthCount% 個月', {}))
      .toBe('[MonthCount] 個月');
  });

  it('應替換多個變數', () => {
    expect(renderTemplateAsText('%a%-%b%', { a: '1', b: '2' }))
      .toBe('1-2');
  });

  it('無變數的純文字原樣回傳', () => {
    expect(renderTemplateAsText('hello', {}))
      .toBe('hello');
  });

  it('換行符應被保留', () => {
    expect(renderTemplateAsText('line1\nline2', {}))
      .toBe('line1\nline2');
  });
});
