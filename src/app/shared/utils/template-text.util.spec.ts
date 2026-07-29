import {
  renderTemplateAsText,
  migrateLegacyTemplateKeys,
  LEGACY_TEMPLATE_KEY_MIGRATIONS,
} from './template-text.util';

describe('migrateLegacyTemplateKeys', () => {
  it('將 %CompanyName% 遷移為 %QuotingCaseName%（PR #203 改名）', () => {
    const raw = '茲將附上 %CompanyName% 有關 %ServiceItemNames% 之專業服務公費報價單。';
    const result = migrateLegacyTemplateKeys(raw);
    expect(result).toContain('%QuotingCaseName%');
    expect(result).not.toContain('%CompanyName%');
    expect(result).toContain('%ServiceItemNames%');
  });

  it('將 %EstimatedRevenue% 遷移為 %EstimatedAnnualRevenue%（與 resolver 既有 sanitize 對齊）', () => {
    expect(migrateLegacyTemplateKeys('預估 %EstimatedRevenue% 元')).toBe('預估 %EstimatedAnnualRevenue% 元');
  });

  it('同時出現多個舊 key 全部遷移', () => {
    expect(migrateLegacyTemplateKeys('%CompanyName% / %EstimatedRevenue%'))
      .toBe('%QuotingCaseName% / %EstimatedAnnualRevenue%');
  });

  it('無舊 key 的字串原樣返回（新 key 不受影響）', () => {
    const raw = '本公司同意委託 %QuotingCaseName% 有關 %ServiceItemNames% 之專業報價。';
    expect(migrateLegacyTemplateKeys(raw)).toBe(raw);
  });

  it('保留 glance variant 後綴（%CompanyName|exact% → %QuotingCaseName|exact%）', () => {
    expect(migrateLegacyTemplateKeys('%CompanyName|exact%')).toBe('%QuotingCaseName|exact%');
  });

  it('遷移表為單一 SSOT，含 CompanyName 與 EstimatedRevenue', () => {
    expect(LEGACY_TEMPLATE_KEY_MIGRATIONS['CompanyName']).toBe('QuotingCaseName');
    expect(LEGACY_TEMPLATE_KEY_MIGRATIONS['EstimatedRevenue']).toBe('EstimatedAnnualRevenue');
  });
});

describe('renderTemplateAsText', () => {
  it('內建舊 key 遷移：含 %CompanyName% 的後端範本能用 QuotingCaseName 的值替換', () => {
    expect(renderTemplateAsText('附上 %CompanyName% 報價單', { QuotingCaseName: '中華大雄股份有限公司' }))
      .toBe('附上 中華大雄股份有限公司 報價單');
  });

  it('應將存在的變數替換為實際值', () => {
    expect(renderTemplateAsText('公司：%companyName%', { companyName: '中華電信' }))
      .toBe('公司：中華電信');
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
